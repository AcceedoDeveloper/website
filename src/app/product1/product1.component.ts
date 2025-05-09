
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-product1',
  templateUrl: './product1.component.html',
  styleUrl: './product1.component.css'
})
export class Product1Component implements OnInit {
  currentYear: number = new Date().getFullYear();
  demoForm: FormGroup;
  
  features = [
    {
      icon: '🔥',
      title: 'Heat Treatment Process Monitoring',
      description: 'Our device accurately tracks every stage of the heat treatment cycle — heating, holding, and quenching. It ensures the temperature is maintained precisely and detects any deviation in real-time.'
    },
    {
      icon: '🌡️',
      title: ' High-Temperature Tracking',
      description: 'Capable of monitoring temperatures above 500°C with high accuracy. It captures detailed temperature data critical for ensuring the quality of treated materials.'
    },
    {
      icon: '💾',
      title: ' Power Cut Protection & Data Backup',
      description: 'Even during a power cut, our hardware safely stores your data. It can retain process records for up to 3 days, ensuring no data loss during unexpected outages.'
    },
    {
      icon: '📱',
      title: 'Live Data Monitoring',
      description: 'View live data of your heat treatment process directly on your PC or mobile device. Real-time monitoring ensures you can track temperature, time, and process parameters remotely.'
    },
    {
      icon: '✅',
      title: 'Quality Control ',
      description: 'By tracking every step, our system helps maintain high standards and supports compliance with industrial heat treatment protocols. It reduces errors and improves process reliability.'
    },
    {
      icon: '📝',
      title: 'Custom Reports',
      description: 'Generates detailed reports for every heat treatment cycle. Helps your team review performance, ensure quality, and maintain accurate records for audits.'
    }
  ];

  benefits = [
    {
      title: 'Improved Quality',
      description: 'Ensures product quality by maintaining precise heating and cooling cycles, reducing defects and inconsistencies.'
    },
    {
      title: 'Reduced Waste',
      description: 'Minimizes material waste by detecting process deviations early and enabling immediate corrective actions.'
    },
    {
      title: 'Operational Efficiency',
      description: 'Enhances overall efficiency through real-time monitoring, remote access, and automated alerts.'
    },
    {
      title: 'Cost Savings',
      description: 'Identifies energy-saving opportunities and helps save companies millions through predictive maintenance.'
    },
    {
      title: 'Process Validation',
      description: 'Provides valuable documentation for quality control and regulatory compliance.'
    },
    {
      title: 'Remote Oversight',
      description: 'Allows management to monitor processes from anywhere, ensuring better oversight and reporting.'
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



