import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-page',
  standalone: true,
  imports: [],
  templateUrl: './form-page.component.html',
  styleUrl: './form-page.component.css'
})
export class FormPageComponent {

    public rango:string='';
    private fb = inject(FormBuilder);
    
      // Define el formulario
      public creditForm = this.fb.group({
        creditType: [''],
        // Agrega validadores si es necesario, ej: Validators.required, Validators.min(300)
        creditAmount: ['', [Validators.required, Validators.min(300)]],
        creditPlazo: ['', Validators.required],
        creditMethod: ['Frances', Validators.required], // Valor por defecto y requerido
      });

  

    onInputChange(event: any) {
    const input = event.target as HTMLInputElement;
    // Permite números y un punto decimal opcional
    let value = input.value.replace(/[^0-9.]/g, '');
    // Asegura que solo haya un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    input.value = value;
  }

  seleccionarMetodo(metodo: string) {
    this.creditForm.get('creditMethod')?.setValue(metodo);
    // Recalcular si ya hay datos
    if (this.creditForm.valid 
      // && 
      // this.A > 0
    ) {
      //  this.credit();
    }
  }


  resetAll(){
    this.creditForm.reset(); // Resetea el formulario
    // this.creditMonthPlazo = [...this.defaultCreditPlazo]; // Resetea los plazos a los por defecto
    // this.resetSimulationResults(); // Limpia resultados de la simulación
    // this.form = false; // Resetea el estado del formulario
    // this.errorMsg=false // Resetea el mensaje de error
    this.rango='' // Resetea el rango de monto permitido
    // this.cuotaFija=0 // Resetea la cuota fija para mostrar en la UI
    // this.aleman=false // Resetea el metodo de amortizacion aleman
    // this.frances=true // Resetea el metodo de amortizacion frances
  }

  credit(){
    
  }



}
