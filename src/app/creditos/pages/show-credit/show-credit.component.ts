import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';


interface AmortizationRow {
  mes: number;
  fechaPago: string; // Cambiado a string para formatear la fecha
  cuota: number;
  interes: number;
  capital: number;
  seguro: number;
  saldo: number;
}

@Component({
  selector: 'app-show-credit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-credit.component.html',
  styleUrl: './show-credit.component.css'
})
export class ShowCreditComponent {

  public errorMsg:boolean = false;
  public errorMessage: string = '';
  public aleman:boolean=false; // Variable para mostrar el metodo de amortizacion aleman
  public frances:boolean=true;
  public primeraCuota:number=0;
  public amortizationTable: AmortizationRow[] = [];
  public creditMethod:string =''
  public creditTerm:number=0;
  public tasaInteresAnualMostrada:number=0;
  public A:number=0
  amortizationTableTotal:number=0
  totalInteres:number=0
  totalSeguro:string=''
  totalPagar:number=0
  creditAmount:string=''

   public creditoptions = [
    { value: 'microcrédito', label: 'Microcrédito' },
    { value: 'microReactívate', label: 'Microcrédito Reactívate' }, // Considera si necesita reglas propias
    { value: 'consumo', label: 'Consumo' },
    { value: 'vehicular', label: 'Vehicular' },
    { value: 'pymes', label: 'PYMES' },
  ];

  private fb=inject(FormBuilder)
  public creditForm = this.fb.group({
    creditAmount: [''],
    creditPlazo: [''],
    creditTasa: [''],
    creditSeguro: [''],
    creditMethod: ['']
  });
  
  creditSelected(event: any) {
    // this.creditForm = !!event.target.value;
    // Resetear resultados si cambia el tipo de crédito principal
    this.resetSimulationResults();
  }

    resetSimulationResults() {
    this.errorMsg=false
    
    this.A = 0;
    this.totalInteres = 0;
    this.totalPagar = 0;
    this.amortizationTable = [];
    this.amortizationTableTotal = 0;
    this.tasaInteresAnualMostrada = 0; // También resetea la tasa mostrada
  }
   getPlazoEnAnios(): number {
    const plazo = Number(this.creditForm.get('creditPlazo')?.value);
    return isNaN(plazo) ? 0 : plazo / 12;
  }
}
