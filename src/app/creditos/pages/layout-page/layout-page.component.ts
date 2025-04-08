import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AmortizationRow {
  mes: number;
  cuota: number;
  interes: number;
  amortizacion: number;
  saldo: number;
}

@Component({
  selector: 'app-layout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.css',
})
export class LayoutPageComponent implements OnInit {
  
  ngOnInit(): void {
    const creditType = this.creditForm.get('creditType')?.value;
    this.creditForm.get('creditType')?.valueChanges.subscribe((value) => {
      if(creditType === 'Corporativo') {
        
      }
   })
  }
  private fb = inject(FormBuilder);
  public creditForm = this.fb.group({
    creditType: [''],
    creditAmount: [''],
    creditPlazo: [''],
    creditMethod: [''],
  });

  public creditoptions = [
    { value: 'Corporativo', label: 'Corporativo' },
    { value: 'Empresarial', label: 'Empresarial' },
    { value: 'PYMES', label: 'PYMES' },
    { value: 'Consumo', label: 'Consumo' },
    { value: 'Vehicular', label: 'Vehicular' },
    { value: 'Microcredito Minorista', label: 'Microcredito Minorista' },
    { value: 'Microcredito Acumulación Simple', label: 'Microcredito Acumulación Simple' },
    { value: 'Microcredito Acumulación Ampliada', label: 'Microcredito Acumulación Ampliada' },
    { value: 'Inmobiliario', label: 'Inmobiliario' },
    { value: 'Credipoliza', label: 'Credipoliza' },
    { value: 'Reactívate', label: 'Reactívate' },
  ];

  public creditPlazo = [
    { value: '12', label: '12 Meses' },
    { value: '18', label: '18 Meses' },
    { value: '24', label: '24 Meses' },
    { value: '48', label: '48 Meses' },
    { value: '60', label: '60 Meses' },
    { value: '72', label: '72 Meses' },
    { value: '144', label: '144 Meses' },
  ]



  public form = false;
  public A: number = 0;
  public totalInteres: number = 0;
  public totalPagar: number = 0;
  public amortizationTable: AmortizationRow[] = [];
  public amortizationTableTotal: number = 0;

  creditSelected(event: any) {
    this.form = !!event.target.value;
  }

  seleccionarMetodo(metodo: string) {
    this.creditForm.get('creditMethod')?.setValue(metodo);
  }
  getPlazoEnAnios(): number {
    const plazo = Number(this.creditForm.get('creditPlazo')?.value);
    return isNaN(plazo) ? 0 : plazo / 12;
  }
  credit() {   
    const P = Number(this.creditForm.get('creditAmount')?.value) || 0;
    const n = Number(this.creditForm.get('creditPlazo')?.value) || 0;
    const metodo = this.creditForm.get('creditMethod')?.value;
    const r = 0.1069 / 12;

    if(
      this.creditForm.get('creditType')?.value === 'Corporativo' && 
      this.creditForm.get('creditPlazo')?.value==='48' && 
      this.creditForm.get('creditMethod')?.value === 'Frances'&& 
      (this.creditForm.get('creditAmount')?.value ?? '') <= '40000'
    ) {
      this.A = n > 0 ? (P * r) / (1 - Math.pow(1 + r, -n)) : 0;
      this.amortizationTable = [];
    }


    let saldo = P;
    let interesTotal = 0;
    let cuotaTotal = 0;

    for (let i = 1; i <= n; i++) {
      let interes = saldo * r;
      let cuota = metodo === 'frances' ? this.A : (P / n) + interes;
      let amortizacion = cuota - interes;
      saldo -= amortizacion;

      this.amortizationTable.push({
        mes: i,
        cuota,
        interes,
        amortizacion,
        saldo: saldo < 0 ? 0 : saldo,
      });

      interesTotal += interes;
      cuotaTotal += cuota;
    }

    this.totalInteres = interesTotal;
    this.totalPagar = cuotaTotal;
    this.amortizationTableTotal = cuotaTotal;
    console.log(this.creditForm.value)
  }

  onInputChange(event: any) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
  }
  descargarPDF() {
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text('Tabla de Amortización', 14, 20);
  
    autoTable(doc, {
      head: [['Mes', 'Cuota', 'Interés', 'Amortización', 'Saldo']],
      body: this.amortizationTable.map(row => [
        row.mes,
        `$${row.cuota.toFixed(2)}`,
        `$${row.interes.toFixed(2)}`,
        `$${row.amortizacion.toFixed(2)}`,
        `$${row.saldo.toFixed(2)}`
      ]),
      startY: 30,
    });
  
    doc.save('tabla_amortizacion.pdf');
  }
  
}
