
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
      title: 'Eliminates Manual Errors',
      description: 'Automated tracking and payroll processing reduce human errors, ensuring accurate salary calculations and attendance records.'
    },
    {
      title: 'Cost Savings',
      description: 'Minimizes revenue loss from time theft, unauthorized absences, and payroll discrepancies. Optimizes overtime costs with AI-driven insights.'
    },
    {
      title: 'Enhanced Productivity',
      description: 'Streamlines HR operations, freeing up time for strategic tasks. Real-time monitoring improves workforce efficiency.'
    },
    {
      title: 'Regulatory Compliance',
      description: 'Maintains transparent records for labor laws, audits, and dispute resolution. Customizable policies ensure adherence to company rules.'
    },
    {
      title: 'Remote Workforce Management',
      description: 'Cloud-based access allows HR and managers to monitor attendance, approve leaves, and process payroll from anywhere.'
    },
    {
      title: 'Scalable for High-Traffic Environments',
      description: 'Processes thousands of biometric check-ins per hour with sub-second response times. Supports 200+ concurrent terminals across multiple locations.'
    }
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



