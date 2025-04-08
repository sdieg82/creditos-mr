import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Importa Validators si necesitas validaciones
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AmortizationRow {
  mes: number;
  cuota: number;
  interes: number;
  amortizacion: number;
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
  public amortizationTable: AmortizationRow[] = [];
  public amortizationTableTotal: number = 0;
  public tasaInteresAnualMostrada: number = 0; // Tasa de interés para mostrar en %

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

    const P = Number(this.creditForm.get('creditAmount')?.value) || 0;
    const n = Number(this.creditForm.get('creditPlazo')?.value) || 0;
    const metodo = this.creditForm.get('creditMethod')?.value || 'Frances'; // Asegura un valor
    const creditType = this.creditForm.get('creditType')?.value;

    // 1. Determinar la Tasa de Interés Anual según las reglas
    let tasaAnual = 0.10; // Tasa por defecto si no es microcrédito o no cumple reglas
    this.tasaInteresAnualMostrada = 10; // Por defecto en %

    if (creditType === 'microcrédito') {
      if (P >= 1 && P <= 1000) {
        tasaAnual = 0.2250;
      } else if (P >= 1001 && P <= 10000) { // Agrupado 1001-10000
        tasaAnual = 0.2150;
      } else if (P >= 10001 && P <= 200000) { // Agrupado 10001-200000
        tasaAnual = 0.1900;
      }
      // Puedes añadir tasas para otros tipos si es necesario
      // else if (creditType === 'consumo') { tasaAnual = 0.16; } // Ejemplo
    }
    // Actualiza la tasa para mostrar en la UI
    this.tasaInteresAnualMostrada = tasaAnual * 100;

    // 2. Calcular Tasa Mensual
    const r = tasaAnual / 12;

    // 3. Calcular Cuota (A) - Método Francés (si aplica)
    // Evita división por cero o NaN si r o n son 0 o inválidos
    if (metodo === 'Frances' && n > 0 && r > 0) {
         this.A = (P * r) / (1 - Math.pow(1 + r, -n));
    } else if (metodo === 'Frances') {
        this.A = (n > 0) ? P/n : 0; // Si la tasa es 0, es capital/plazo
    } else {
        this.A = 0; // Para Alemán, la cuota varía, A no es la cuota fija
    }


    // 4. Generar Tabla de Amortización
    this.amortizationTable = [];
    let saldo = P;
    let interesTotalCalc = 0;
    let cuotaTotalCalc = 0; // Cambiado el nombre para evitar confusión con this.A

    if (n > 0 && P > 0) { // Asegura que hay monto y plazo
      for (let i = 1; i <= n; i++) {
        let interesMes = saldo * r;
        let cuotaMes = 0;
        let amortizacionMes = 0;

        if (metodo === 'Frances') {
          cuotaMes = this.A; // Usar la cuota fija calculada
          amortizacionMes = cuotaMes - interesMes;
        } else { // Método Alemán
          amortizacionMes = P / n; // Amortización constante
          cuotaMes = amortizacionMes + interesMes;
        }

        // Ajuste para la última cuota para que el saldo sea exactamente 0
        if (i === n) {
            amortizacionMes = saldo; // Lo que queda de saldo se amortiza
            if(metodo === 'Frances') {
                 cuotaMes = amortizacionMes + interesMes; // recalcular cuota final
                 this.A = cuotaMes; // Actualizar A si es la ultima cuota francesa (opcional visualmente)
            } else {
                 cuotaMes = amortizacionMes + interesMes; // Recalcular cuota alemana final
            }
            saldo = 0;
        } else {
            saldo -= amortizacionMes;
        }


        // Evitar saldos negativos muy pequeños por precisión decimal
        if (saldo < 0.005 && saldo > -0.005) {
            saldo = 0;
        }

        this.amortizationTable.push({
          mes: i,
          cuota: cuotaMes,
          interes: interesMes,
          amortizacion: amortizacionMes,
          saldo: saldo,
        });

        interesTotalCalc += interesMes;
        cuotaTotalCalc += cuotaMes;
      }
    }


    // 5. Actualizar Totales
    this.totalInteres = interesTotalCalc;
    this.totalPagar = cuotaTotalCalc;
    this.amortizationTableTotal = cuotaTotalCalc; // Total en el pie de la tabla

     // Si es Alemán, A no es la cuota fija, podríamos mostrar la primera cuota o nada
     if(metodo === 'Aleman' && this.amortizationTable.length > 0) {
        this.A = this.amortizationTable[0].cuota; // Muestra la primera cuota alemana como referencia
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


    autoTable(doc, {
      head: [['Mes', 'Cuota', 'Interés', 'Amortización', 'Saldo']],
      body: this.amortizationTable.map((row) => [
        row.mes,
        `$${row.cuota.toFixed(2)}`,
        `$${row.interes.toFixed(2)}`,
        `$${row.amortizacion.toFixed(2)}`,
        `$${row.saldo.toFixed(2)}`,
      ]),
      startY: 70, // Ajustar coordenada Y para empezar después del texto
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] }, // Ejemplo de color de cabecera
    });

    // Añadir totales al final del PDF después de la tabla
    let finalY = (doc as any).lastAutoTable.finalY; // Obtener la posición Y final de la tabla
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Intereses: $${this.totalInteres.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Total a Pagar: $${this.totalPagar.toFixed(2)}`, 14, finalY + 16);

    doc.save('tabla_amortizacion.pdf');
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
    this.A = 0;
    this.totalInteres = 0;
    this.totalPagar = 0;
    this.amortizationTable = [];
    this.amortizationTableTotal = 0;
    this.tasaInteresAnualMostrada = 0; // También resetea la tasa mostrada
  }
}