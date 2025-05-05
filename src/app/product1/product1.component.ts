
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
      icon: '📊',
      title: 'Multiple Heat Cycles',
      description: 'Record any number of heat cycles or curves during the process. This capability allows precise tracking of multiple heating and cooling phases for complex treatments.'
    },
    {
      icon: '☁️',
      title: 'Cloud Storage',
      description: 'Store data on the cloud for secure access to heat treatment records from any device, even if local hardware is unavailable. Ensures continuous monitoring and data retrieval.'
    },
    {
      icon: '⚡',
      title: 'Energy Monitoring',
      description: 'Tracks energy consumption for every cycle, providing detailed data on power usage. Helps identify energy-saving opportunities and ensures efficient operation.'
    },
    {
      icon: '📱',
      title: 'Live Data Monitoring',
      description: 'View live data of your heat treatment process directly on your PC or mobile device. Real-time monitoring ensures you can track temperature, time, and process parameters remotely.'
    },
    {
      icon: '🔔',
      title: 'Alerts & Notifications',
      description: 'Receive immediate alerts if any values fall outside acceptable ranges. Enables quick response to anomalies and maintains optimal process conditions.'
    },
    {
      icon: '📈',
      title: 'Custom Reports',
      description: 'Additional reports can be added and tailored to meet specific customer or business requirements for enhanced operational insights and decision-making.'
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



