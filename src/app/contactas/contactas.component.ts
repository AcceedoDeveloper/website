import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contactas',
  templateUrl: './contactas.component.html',
  styleUrls: ['./contactas.component.css']  // Note: `styleUrls` (plural) not `styleUrl`
})
export class ContactasComponent implements OnInit {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {}
submitForm(): void {

  if (this.contactForm.valid) {
    const name = this.contactForm.value.name;
    const email = this.contactForm.value.email;
    const message = this.contactForm.value.message;

    const whatsappUrl =
      "https://wa.me/919994111214?text=" +
      "Hello, my name is " + encodeURIComponent(name) +
      "%0A" +
      "Email: " + encodeURIComponent(email) +
      "%0A" +
      "Message: " + encodeURIComponent(message);

    window.open(whatsappUrl, '_blank');

  } else {
    console.warn('Form is invalid:', this.contactForm);
    this.contactForm.markAllAsTouched();
  }
}
}
