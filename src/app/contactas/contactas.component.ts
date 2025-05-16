import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contactas',
  templateUrl: './contactas.component.html',
  styleUrl: './contactas.component.css'
})
export class ContactasComponent implements OnInit {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder,) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  submitForm(): void {
   
  }
}