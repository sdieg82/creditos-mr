import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Importa Validators si necesitas validaciones
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AmortizationRow {
  mes: number;
  fechaPago: string; // Cambiado a string para formatear la fecha
  cuota: number;
  interes: number;
  capital: number;
  seguro: number;
  saldo: number;
}

interface PlazoOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-layout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './layout-page.component.html',
  styleUrls: ['./layout-page.component.css'], // Corregido 'styleUrl' a 'styleUrls' si usas array
})
export class LayoutPageComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Define el formulario
  public creditForm = this.fb.group({
    creditType: [''],
    // Agrega validadores si es necesario, ej: Validators.required, Validators.min(300)
    creditAmount: ['', [Validators.required, Validators.min(300)]],
    creditPlazo: ['', Validators.required],
    creditMethod: ['Frances', Validators.required], // Valor por defecto y requerido
  });

  // Opciones de tipo de crédito
  public creditoptions = [
    { value: 'microcrédito', label: 'Microcrédito' },
    { value: 'microReactívate', label: 'Microcrédito Reactívate' }, // Considera si necesita reglas propias
    { value: 'consumo', label: 'Consumo' },
    { value: 'vehicular', label: 'Vehicular' },
    { value: 'pymes', label: 'PYMES' },
  ];

  // Plazos por defecto (para tipos de crédito que no sean microcrédito o fuera de rangos)
  private defaultCreditPlazo: PlazoOption[] = [
    { value: '12', label: '12 Meses' },
    { value: '18', label: '18 Meses' },
    { value: '24', label: '24 Meses' },
    { value: '36', label: '36 Meses' },
    { value: '48', label: '48 Meses' },
    { value: '60', label: '60 Meses' },
    { value: '72', label: '72 Meses' },
    { value: '84', label: '84 Meses' },
    { value: '96', label: '96 Meses' },
    { value: '120', label: '120 Meses' },
    // { value: '144', label: '144 Meses' }, // Puedes añadir más si es necesario
  ];

  // Plazos disponibles para el select (se actualiza dinámicamente)
  public creditMonthPlazo: PlazoOption[] = [...this.defaultCreditPlazo];

  // Estado y resultados de la simulación
  public form = false;
  public A: number = 0; // Cuota mensual
  public totalInteres: number = 0;
  public totalPagar: number = 0;
  public totalSeguro: number = 0;
  public amortizationTable: AmortizationRow[] = [];
  public amortizationTableTotal: number = 0;
  public tasaInteresAnualMostrada: number = 0; // Tasa de interés para mostrar en %
  public errorMessage: string = ''; // Mensaje de error si es necesario
  public errorMsg:boolean = false; // Variable para mostrar el mensaje de error
  public rango:string=''; // Variable para mostrar el rango de monto permitido
  public cuotaFija: number = 0; // Cuota fija para mostrar en la UI
  public aleman:boolean=false // Variable para mostrar el metodo de amortizacion aleman
  public frances:boolean=true // Variable para mostrar el metodo de amortizacion frances
  public primeraCuota:number=0 // Variable para mostrar la primera cuota francesa
  ngOnInit(): void {
    // Escucha cambios en tipo y monto para actualizar plazos y tasa
    this.creditForm
      .get('creditType')
      ?.valueChanges.subscribe(() => this.actualizarPlazosYResetear());
    this.creditForm
      .get('creditAmount')
      ?.valueChanges.subscribe(() => this.actualizarPlazosYResetear());

    // Inicializa los plazos por si hay valores iniciales
    this.actualizarPlazos();
  }

  creditSelected(event: any) {
    this.form = !!event.target.value;
    // Resetear resultados si cambia el tipo de crédito principal
    this.resetSimulationResults();
  }

  seleccionarMetodo(metodo: string) {
    this.creditForm.get('creditMethod')?.setValue(metodo);
    // Recalcular si ya hay datos
    if (this.creditForm.valid && this.A > 0) {
       this.credit();
    }
  }

  getPlazoEnAnios(): number {
    const plazo = Number(this.creditForm.get('creditPlazo')?.value);
    return isNaN(plazo) ? 0 : plazo / 12;
  }

  // --- Lógica de Cálculo ---
  credit() {
    if (this.creditForm.invalid) {
      // Opcional: Marcar campos como tocados para mostrar errores
      this.creditForm.markAllAsTouched();
      console.error('Formulario inválido');
      this.resetSimulationResults(); // Limpia resultados si el form es inválido
      return;
    }

    let P = Number(this.creditForm.get('creditAmount')?.value) || 0;
    // console.log('este es el monto',P)
    const n = Number(this.creditForm.get('creditPlazo')?.value) || 0;
    // console.log('este es el plazo anual',n)
    const metodo = this.creditForm.get('creditMethod')?.value || 'Frances'; // Asegura un valor
    const creditType = this.creditForm.get('creditType')?.value;
    const fechaInicio = new Date(); // O la fecha que desees como inicio
    const fechaPago = new Date(fechaInicio); // Copiamos la fecha

    // 1. Determinar la Tasa de Interés Anual según las reglas
    let tasaAnual = 0.10; // Tasa por defecto si no es microcrédito o no cumple reglas
    this.tasaInteresAnualMostrada = 10; // Por defecto en %

    if (creditType === 'microcrédito') {
      if (P >= 1 && P <= 1000) {
        tasaAnual = 0.2250;
      } else if (P > 1000 && P <= 10000) { // Agrupado 1001-10000
        tasaAnual = 0.2150;
      } else if (P >= 10001 && P < 200000) { // Agrupado 10001-200000
        tasaAnual = 0.1900;
      }else if (P > 200000 ) { // Agrupado 10001-200000
        this.errorMsg=true
        this.A = 0; // Si no cumple, no calculamos cuota
        P=0
        console.log('Monto fuera de rango para microcrédito');
        this.errorMessage = 'Monto fuera de rango para el crédito seleccionado'; // Mensaje de error
        setTimeout(() => {
          this.errorMsg=false
        }, 4000);
      }

      // Puedes añadir tasas para otros tipos si es necesario
      // else if (creditType === 'consumo') { tasaAnual = 0.16; } // Ejemplo
    }

    if (creditType === 'pymes') {
      
      if (P <5000 || P >= 700000) {
        this.errorMsg=true
        this.A = 0; // Si no cumple, no calculamos cuota
        P=0
        console.log('Monto fuera de rango para microcrédito');
        this.errorMessage = 'Monto fuera de rango para el crédito seleccionado'; // Mensaje de error
        setTimeout(() => {
          this.errorMsg=false
        }, 4000); 
      }
      else if (P >= 5000 && P <= 700000) {
        tasaAnual = 0.11;
      }
      // Puedes añadir tasas para otros tipos si es necesario
      // else if (creditType === 'consumo') { tasaAnual = 0.16; } // Ejemplo
    }

    if (creditType === 'microReactívate') {
      if (P <3000 || P >= 50000) {
        this.errorMsg=true
        this.A = 0; // Si no cumple, no calculamos cuota
        P=0
        console.log('Monto fuera de rango para microcrédito');
        this.errorMessage = 'Monto fuera de rango para el crédito seleccionado'; // Mensaje de error
        setTimeout(() => {
          this.errorMsg=false
        }, 4000);
      }
      else if (P >= 3000 && P <= 50000) {
        tasaAnual = 0.1399;
      }
    }

    if (creditType === 'consumo') {
      if(P <300 || P >= 450000) {
        this.errorMsg=true
        this.A = 0; // Si no cumple, no calculamos cuota
        P=0
        console.log('Monto fuera de rango para microcrédito');
        this.errorMessage = 'Monto fuera de rango para el crédito seleccionado'; // Mensaje de error
        setTimeout(() => {
          this.errorMsg=false
        }, 4000);
      }
      if (P > 200 && P <= 450000) {
        tasaAnual = 0.1505;
      } 
    }

    if (creditType === 'vehicular') {
      if(P <2001 || P >= 200000) {
        this.errorMessage = 'Monto fuera de rango para el crédito seleccionado'; // Mensaje de error
        this.errorMsg=true
        this.A = 0; // Si no cumple, no calculamos cuota
        P=0
        console.log('Monto fuera de rango para microcrédito');
        setTimeout(() => {
          this.errorMsg=false
        }, 4000);
       

      }else if (P >= 2000 && P <= 200000) {
        tasaAnual = 0.1505;
      }
    }
    
    // Actualiza la tasa para mostrar en la UI
    this.tasaInteresAnualMostrada = tasaAnual * 100;
    // console.log(this.tasaInteresAnualMostrada)
    // 2. Calcular Tasa Mensual
    // console.log('tasa anual',tasaAnual)
    const r = tasaAnual / 12;
    // console.log('este es la tasa mensual',r)


    // 3. Calcular Cuota (A) - Método Francés (si aplica)
    // Evita división por cero o NaN si r o n son 0 o inválidos
    if (metodo === 'Frances' && n > 0 && r > 0) {
      this.aleman=false
      this.frances=true
      console.log("prestamo",P)
      console.log("interes por mes",r)
         this.A = (P * r) / (1 - Math.pow(1 + r, -n));
         console.log('este es la cuota',this.A)
    } else if (metodo === 'Frances') {
        this.A = (n > 0) ? P/n : 0; // Si la tasa es 0, es capital/plazo
        // console.log('entra por el if',this.A) 
    } else {
      this.frances=false
      this.aleman=true  
      this.A = 0; // Para Alemán, la cuota varía, A no es la cuota fija
    }


    // 4. Generar Tabla de Amortización
    this.amortizationTable = [];
    let saldo = P;
    // console.log('este es el P',P)
    // console.log('este es el saldo',saldo)
    let interesTotalCalc = 0;
    let cuotaTotalCalc = 0;
    let totalSeguroCalc=0// Cambiado el nombre para evitar confusión con this.A

    if (n > 0 && P > 0) { // Asegura que hay monto y plazo
      for (let i = 1; i <= n; i++) {
         // Asegura que el saldo inicial es P si no se ha modificado
        let interesMes = saldo * r;
        let cuotaMes = 0;
        let amortizacionMes = 0;
        let seguroMes = 0; // Si necesitas calcular seguro, puedes agregarlo aquí
        let saldoPendiente = 0;
        let totalSeguro = 0; // Inicializa el total de seguro
        if (metodo === 'Frances') {
          seguroMes=0.00041*saldo;
          totalSeguro=totalSeguro+seguroMes
          saldoPendiente=saldo+seguroMes
          cuotaMes = this.A + seguroMes;
          if(i === 1) { // Si es la primera cuota, guarda el valor
            this.aleman=false
            this.frances=true
            this.primeraCuota=cuotaMes // Guarda la primera cuota para mostrarla
             // Guarda el valor de la cuota fija
          }

          console.log('cuota mes',cuotaMes)
          amortizacionMes = this.A - interesMes;
          P=P-amortizacionMes // Usar la cuota fija calculada

          // console.log('amortizacion mes',amortizacionMes)
          // console.log('saldo',P) // Ejemplo de cálculo de seguro, ajusta según sea necesario
        } else { // Método Alemán
          seguroMes=0.00041*saldo;
          amortizacionMes = P / n; // Amortización constante
          totalSeguro=totalSeguro+seguroMes
          // console.log('amortizacion mes',amortizacionMes)
          // console.log('interes mes',interesMes)
          // console.log('seguro mes',seguroMes)
          cuotaMes = amortizacionMes + interesMes + totalSeguro; // Cuota variable
          // console.log('cuota mes',cuotaMes)
        }

        // Ajuste para la última cuota para que el saldo sea exactamente 0
        if (i === n) {
            amortizacionMes = saldo; // Lo que queda de saldo se amortiza
            if(metodo === 'Frances') {
              console.log(amortizacionMes)   
              cuotaMes = amortizacionMes + interesMes + seguroMes; // recalcular cuota final
                 console.log('cuota final',cuotaMes)
                 this.cuotaFija=amortizacionMes+interesMes
                 this.A = cuotaMes; // Actualizar A si es la ultima cuota francesa (opcional visualmente)
                 console.log('cuota fija',this.A)
                } else {
                 cuotaMes = amortizacionMes + interesMes + seguroMes; // Recalcular cuota alemana final
            }
            saldo = 0;
        } else {
            saldo -= amortizacionMes;
        }


        // Evitar saldos negativos muy pequeños por precisión decimal
        if (saldo < 0.005 && saldo > -0.005) {
            saldo = 0;
        }
        const fechaCuota = new Date(fechaPago);
        fechaCuota.setMonth(fechaCuota.getMonth() + i);
      
        // Formateamos la fecha (por ejemplo, "11 abril 2025")
        const opcionesFormato = { day: '2-digit', month: 'long', year: 'numeric' } as const;
        const fechaFormateada = fechaCuota.toLocaleDateString('es-ES', opcionesFormato);
      
        this.amortizationTable.push({
          mes: i,
          fechaPago:fechaFormateada,
          cuota: cuotaMes,
          interes: interesMes,
          capital: amortizacionMes,
          seguro: seguroMes,
          saldo: saldo,
        });

        interesTotalCalc += interesMes;
        cuotaTotalCalc += cuotaMes;
        totalSeguroCalc += seguroMes; // Acumula el total de seguro
      }
      // saldo is already updated, no need to reassign P
    }


    // 5. Actualizar Totales
    this.totalInteres = interesTotalCalc;
    this.totalPagar = cuotaTotalCalc;
    this.amortizationTableTotal = cuotaTotalCalc;
    this.totalSeguro=totalSeguroCalc // Total en el pie de la tabla

     // Si es Alemán, A no es la cuota fija, podríamos mostrar la primera cuota o nada
     if(metodo === 'Aleman' && this.amortizationTable.length > 0) {
        this.A = this.amortizationTable[0].cuota;
        this.cuotaFija=this.amortizationTable[0].capital +this.amortizationTable[0].interes // Muestra la primera cuota alemana como referencia
     } else if (metodo !== 'Frances') {
        this.A = 0; // No mostrar cuota fija si no es francés
     }


    console.log('Simulación:', this.creditForm.value);
    console.log('Tasa Anual Aplicada:', tasaAnual);
    console.log('Resultados:', { A: this.A, totalInteres: this.totalInteres, totalPagar: this.totalPagar });
  }

  onInputChange(event: any) {
    const input = event.target as HTMLInputElement;
    // Permite números y un punto decimal opcional
    let value = input.value.replace(/[^0-9.]/g, '');
    // Asegura que solo haya un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Opcional: Formatear a dos decimales si se desea al escribir
    // if (parts[1] && parts[1].length > 2) {
    //   value = Number(value).toFixed(2);
    // }
    // Actualiza el valor del input y del form control (si es necesario)
    input.value = value;
    // Descomentar la siguiente línea si el (input) no actualiza el formControlName correctamente
    // this.creditForm.get('creditAmount')?.setValue(value, { emitEvent: false }); // Evitar bucle si se usa (input)
  }

  descargarPDF() {
    if (this.amortizationTable.length === 0) return; // No descargar si no hay tabla
  
    const doc = new jsPDF();
    const P = Number(this.creditForm.get('creditAmount')?.value) || 0;
    const n = Number(this.creditForm.get('creditPlazo')?.value) || 0;
    const metodo = this.creditForm.get('creditMethod')?.value || 'N/A';
    const tipoCredito = this.creditoptions.find(opt => opt.value === this.creditForm.get('creditType')?.value)?.label || 'N/A';
  
    doc.setFontSize(18);
    doc.text('Simulación de Crédito', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
  
    // Información del crédito
    doc.text(`Tipo de Crédito: ${tipoCredito}`, 14, 32);
    doc.text(`Monto Solicitado: $${P.toFixed(2)}`, 14, 38);
    doc.text(`Plazo: ${n} meses`, 14, 44);
    doc.text(`Método Amortización: ${metodo}`, 14, 50);
    doc.text(`Tasa Interés Anual: ${this.tasaInteresAnualMostrada.toFixed(2)}%`, 14, 56);
    doc.text(`Cuota Mensual Referencial: $${this.A.toFixed(2)} ${metodo === 'Aleman' ? '(Primera Cuota)' : ''}`, 14, 62);
  
    // Tabla de amortización con todas las columnas
    autoTable(doc, {
      head: [['No. de Cuotas', 'Fecha de pago', 'Capital', 'Interés', 'Seguro', 'Valor de la cuota', 'Saldo']],
      body: this.amortizationTable.map((row) => [
        row.mes,
        `${row.fechaPago}`,
        `$${row.capital.toFixed(2)}`,
        `$${row.interes.toFixed(2)}`,
        `$${row.seguro.toFixed(2)}`,
        `$${row.cuota.toFixed(2)}`,
        `$${row.saldo.toFixed(2)}`
      ]),
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      styles: {
        fontSize: 9,
      },
    });
  
    // Total al final
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total a pagar: $${this.amortizationTableTotal.toFixed(2)}`, 14, finalY);
  
    // Guardar
    doc.save('simulacion_credito.pdf');
  }
  

  // --- Funciones Auxiliares ---

  // Actualiza los plazos disponibles y resetea la selección actual
  actualizarPlazosYResetear() {
    const plazoActual = this.creditForm.get('creditPlazo')?.value;
    this.actualizarPlazos();
    // Comprueba si el plazo que estaba seleccionado sigue siendo válido
    const esPlazoValido = this.creditMonthPlazo.some(p => p.value === plazoActual);
    if (!esPlazoValido) {
      this.creditForm.get('creditPlazo')?.setValue(''); // Resetea si ya no es válido
    }
    // Resetear simulación si cambian tipo o monto
     this.resetSimulationResults();
  }

  // Lógica para determinar los plazos según tipo y monto
  actualizarPlazos() {
    const creditType = this.creditForm.get('creditType')?.value;
    const creditAmount = Number(this.creditForm.get('creditAmount')?.value) || 0;

    let maxMonths = 0;

    if (creditType === 'microcrédito') {
      this.rango="Mínimo 300 y Máximo 200000"
      if (creditAmount >= 1 && creditAmount <= 1000) maxMonths = 12;
      else if (creditAmount >= 1001 && creditAmount <= 2000) maxMonths = 24;
      else if (creditAmount >= 2001 && creditAmount <= 5000) maxMonths = 36;
      else if (creditAmount >= 5001 && creditAmount <= 10000) maxMonths = 60;
      else if (creditAmount >= 10001 && creditAmount <= 30000) maxMonths = 72;
      else if (creditAmount >= 30001 && creditAmount <= 40000) maxMonths = 84;
      else if (creditAmount >= 40001 && creditAmount <= 50000) maxMonths = 96;
      else if (creditAmount >= 50001 && creditAmount <= 200000) maxMonths = 120;
       // Si es > 200000 o 0, usamos default (o podrías definir un maxMonths aquí también)
    }

    if (creditType === 'microReactívate') {
      this.rango="Mínimo 3000 y Máximo 50000"
      if (creditAmount >= 3000 && creditAmount <= 30000) maxMonths = 60;
      
       // Si es > 200000 o 0, usamos default (o podrías definir un maxMonths aquí también)
    }
    if (creditType === 'consumo') {
      
      this.rango="Mínimo 300 y Máximo 450000"
      if (creditAmount >= 200 && creditAmount <= 1000) maxMonths = 12;
      else if (creditAmount >= 1001 && creditAmount <= 2000) maxMonths = 18;
      else if (creditAmount >= 2001 && creditAmount <= 5000) maxMonths = 24;
      else if (creditAmount >= 5001 && creditAmount <= 10000) maxMonths = 48;
      else if (creditAmount >= 10001 && creditAmount <= 20000) maxMonths = 60;
      else if (creditAmount >= 20001 && creditAmount <= 30000) maxMonths = 72;
      else if (creditAmount >= 30001 && creditAmount <= 40000) maxMonths = 84;
      else if (creditAmount >= 40001 && creditAmount <= 450000) maxMonths = 120;
      // Si es > 200000 o 0, usamos default (o podrías definir un maxMonths aquí también)
    }

    if (creditType === 'vehicular') {
      this.rango="Mínimo 2000 y Máximo 200000"
      if (creditAmount >= 2001 && creditAmount <= 5000) maxMonths = 24;
      else if (creditAmount >= 5001 && creditAmount <= 10000) maxMonths = 48;
      else if (creditAmount >= 10001 && creditAmount <= 20000) maxMonths = 60;
      else if (creditAmount >= 20001 && creditAmount <= 40000) maxMonths = 72;
      else if (creditAmount >= 40000 && creditAmount <= 200000) maxMonths = 120;
      // Si es > 200000 o 0, usamos default (o podrías definir un maxMonths aquí también)
    }

    if (creditType === 'pymes') {
      this.rango="Mínimo 5000 y Máximo 700000"
      if (creditAmount >= 5000 && creditAmount <= 40000) maxMonths = 48;
      else if (creditAmount >= 50001 && creditAmount <= 700000) maxMonths = 144;
      // Si es > 200000 o 0, usamos default (o podrías definir un maxMonths aquí también)
    }

    if (maxMonths > 0) {
      // Generar plazos hasta maxMonths
      this.creditMonthPlazo = this.generatePlazos(maxMonths);
    } else {
      // Usar plazos por defecto para otros tipos o montos fuera de rango microcrédito
      this.creditMonthPlazo = [...this.defaultCreditPlazo];
    }
  }

  // Genera un array de opciones de plazo desde 1 hasta maxMonths
  generatePlazos(maxMonths: number): PlazoOption[] {
    return Array.from({ length: maxMonths }, (_, i) => {
      const mes = i + 1;
      return {
        value: mes.toString(),
        label: `${mes} Mes${mes > 1 ? 'es' : ''}`,
      };
    });
  }

   // Limpia los resultados de la simulación anterior
  resetSimulationResults() {
    this.errorMsg=false
    
    this.A = 0;
    this.totalInteres = 0;
    this.totalPagar = 0;
    this.amortizationTable = [];
    this.amortizationTableTotal = 0;
    this.tasaInteresAnualMostrada = 0; // También resetea la tasa mostrada
  }

  resetAll(){
    this.creditForm.reset(); // Resetea el formulario
    this.creditMonthPlazo = [...this.defaultCreditPlazo]; // Resetea los plazos a los por defecto
    this.resetSimulationResults(); // Limpia resultados de la simulación
    this.form = false; // Resetea el estado del formulario
    this.errorMsg=false // Resetea el mensaje de error
    this.rango='' // Resetea el rango de monto permitido
    this.cuotaFija=0 // Resetea la cuota fija para mostrar en la UI
    this.aleman=false // Resetea el metodo de amortizacion aleman
    this.frances=true // Resetea el metodo de amortizacion frances
  }
}