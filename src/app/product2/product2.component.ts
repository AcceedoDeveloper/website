
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-product2',
  templateUrl: './product2.component.html',
  styleUrl: './product2.component.css'
})
export class Product2Component implements OnInit {
  currentYear: number = new Date().getFullYear();
  demoForm: FormGroup;
  
  
  benefits = [
    {
      title: 'Accurate Time and Attendance Tracking',
      description: 'Eliminate manual errors with automated employee check-ins via fingerprint, card, or mobile app scanning. Ensure precise clocking in and out, including late arrivals and early departures.'
    },
    {
      title: 'Streamlined Payroll & Leave Management',
      description: 'Automate salary calculations and leave approvals based on real-time attendance data, reducing payroll errors and saving administrative time.'
    },
    {
      title: 'Comprehensive Reporting & Remote Access',
      description: 'Generate detailed attendance and payroll reports easily, with cloud-based access for HR and managers to monitor and manage workforce data from anywhere.'
    },
  ];

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



