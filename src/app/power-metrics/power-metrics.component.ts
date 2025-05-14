import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-power-metrics',
  templateUrl: './power-metrics.component.html',
  styleUrl: './power-metrics.component.css'
})
export class PowerMetricsComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  demoForm: FormGroup;
    
  constructor(private fb: FormBuilder) {
    this.demoForm = this.fb.group({
      name: ['', Validators.required],
      company: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: ['']
    });
  }

  ngOnInit(): void {
    this.setupScrollAnimation();
  }

  onSubmit(): void {
    if (this.demoForm.valid) {
      // Here you would typically send the form data to your backend
      console.log('Form submitted:', this.demoForm.value);
      // Reset form after submission
      this.demoForm.reset();
      // Show success message
      alert('Thank you for your demo request! We will contact you shortly.');
    }
  }

  private setupScrollAnimation(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    // Wait for the view to be initialized
    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => {
        observer.observe(el);
      });
    }, 0);
  }
}



