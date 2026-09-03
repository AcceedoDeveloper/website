import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../service/contact.service';

@Component({
  selector: 'app-contactas',
  templateUrl: './contactas.component.html',
  styleUrls: ['./contactas.component.css']
})
export class ContactasComponent implements OnInit {
  contactForm: FormGroup;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private contactService: ContactService) {
    this.contactForm = this.fb.group({
      company: [''],
      name: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[+]?[\d\s\-()]{7,15}$/)]],
      message: [''],
    });
  }

  ngOnInit(): void {}

  submitForm(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.errorMessage = 'Please fix the highlighted fields and try again.';
      return;
    }

    const { company, name, email, phone, message } = this.contactForm.value;

    if (!company && !name && !email && !phone && !message) {
      this.errorMessage = 'Please fill in at least one field before sending.';
      return;
    }

    this.submitting = true;

    this.contactService.createContact({ company, name, email, phone, message }).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = 'Thanks! Your message has been received. We will reach out soon.';
        this.openWhatsApp({ company, name, email, phone, message });
        this.contactForm.reset();
      },
      error: (err) => {
        this.submitting = false;
        console.error('Contact save failed:', err);
        this.errorMessage =
          err?.error?.message ||
          'We could not save your message right now. Please try again in a moment.';
      }
    });
  }

  private openWhatsApp(v: { company: string; name: string; email: string; phone: string; message: string }): void {
    const lines: string[] = [];
    if (v.name) lines.push('Hello, my name is ' + v.name);
    if (v.company) lines.push('Company: ' + v.company);
    if (v.email) lines.push('Email: ' + v.email);
    if (v.phone) lines.push('Phone: ' + v.phone);
    if (v.message) lines.push('Message: ' + v.message);

    if (!lines.length) return;

    const whatsappUrl =
      'https://wa.me/919994111214?text=' +
      lines.map(encodeURIComponent).join('%0A');
    window.open(whatsappUrl, '_blank');
  }
}
