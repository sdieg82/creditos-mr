import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.css'
})
export class LayoutPageComponent {
  private fb = inject(FormBuilder);

  public creditForm = this.fb.group({
    creditType: [''],
    creditAmount: [''],
    creditPlazo: [''],
    creditMethod: [''],  // 🔹 Renombrado de `creditMetod` a `creditMethod`
  });
  public A:number = 0; // Inicializado como 0 para evitar NaN en caso de que no se calcule

  public form: boolean = false;

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

  creditSelected(event: any) {
    const selectedValue = event.target.value;
    console.log('Valor seleccionado:', selectedValue);
    this.form = !!selectedValue; // Si selecciona algo, muestra el formulario
  }

  seleccionarMetodo(metodo: string) {
    this.creditForm.get('creditMethod')?.setValue(metodo);
    
  }

  credit() {
    console.log('Formulario enviado:', this.creditForm.value);
    // Aquí puedes agregar la lógica para manejar el envío del formulario
    const MC=this.creditForm.get('creditMethod')?.value;
    const P = Number(this.creditForm.get('creditAmount')?.value) || 0; // Ensure P is a number with a default value
    const M=this.creditForm.get('creditType')?.value;
    const n = Number(this.creditForm.get('creditPlazo')?.value) || 0; // Convert to number, default to 0 if invalid
    const r = 0.1 / 12; // Tasa de interés mensual (10% anual dividido por 12 meses)  
    this.A= n > 0 ? (P * r) / (1 - Math.pow(1 + r, -n)) : 0; // Ensure n is valid for calculation
    console.log(this.A)
  }
}
