
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
  
  features = [
    {
      icon: '🔍',
      title: 'Biometric Integration',
      description: 'Seamless facial recognition and fingerprint scanning ensure 100% accurate attendance tracking, eliminating buddy punching and time theft. Supports contactless check-ins for hygienic workplaces.'
    },
    {
      icon: '⏰',
      title: 'Real-Time Attendance Monitoring',
      description: 'Automatically detects late arrivals, early departures, and absenteeism with configurable grace periods. Tracks shift-based schedules for flexible workforce management.'
    },
    {
      icon: '💰',
      title: 'Automated Payroll & Deductions',
      description: 'Smart system calculates salaries, overtime (OT), and deductions for late arrivals, unpaid leaves, or policy violations. Ensures compliance with company policies.'
    },
    {
      icon: '📱',
      title: 'Employee Self-Service Portal',
      description: 'Single login access for employees to view attendance, salary slips, leave status, and apply for loans. Personalized dashboard for easy tracking of shifts and pending requests.'
    },
    {
      icon: '📊',
      title: 'Advanced Reporting & Analytics',
      description: 'Generates customizable reports for payroll, attendance trends, and labor costs. Exportable data for audits and compliance.'
    },
    {
      icon: '🔔',
      title: 'Alerts & Notifications',
      description: 'Instant alerts for attendance anomalies, policy violations, or pending approvals. Keeps employees and managers informed in real time.'
    }
  ];

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



