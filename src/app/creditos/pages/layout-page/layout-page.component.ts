import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './layout-page.component.html',
  styleUrl: './layout-page.component.css'
})
export class LayoutPageComponent {
  public mes12:number = 12;
  public mes48:number = 48;
  public mes60:number = 60;
  public mes72:number = 72;
  public mes144:number = 144;
  public form:boolean = false;

  public creditoptions = [
    { value: 12, label: '12 meses' },
    { value: 48, label: '48 meses' },
    { value: 60, label: '60 meses' },
    { value: 72, label: '72 meses' },
    { value: 144, label: '144 meses' }
  ];

  creditSelected(event: any) {
    const selectedValue = event.target.value;
    console.log('valor seleccionado',selectedValue)
    this.form = true;
    console.log('seleccionado')
  }
}
