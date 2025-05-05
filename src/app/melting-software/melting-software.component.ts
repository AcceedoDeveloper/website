import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OnInit } from '@angular/core';


@Component({
  selector: 'app-melting-software',
  templateUrl: './melting-software.component.html',
  styleUrl: './melting-software.component.css'
})
export class MeltingSoftwareComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  demoForm: FormGroup;
  
  features = [
    {
      icon: '🔥',
      title: 'Smart Charge-Mix Automation',
      description: 'Automatically calculates optimal raw material & alloy quantities based on spectrum analysis. Adjusts charge-mix in real time for cost efficiency and quality consistency.'
    },
    {
      icon: '📊 ',
      title: 'Real-Time Process Monitoring',
      description: 'Live tracking of furnace temperature, alloy additions, and melt progress. Mobile/PC access to data, alerts, and adjustments from anywhere.'
    },
    {
      icon: '⚙️',
      title: 'Predictive Maintenance & Logs',
      description: 'Tracks furnace lining wear, ladle conditions, and heat numbers. Schedules maintenance to prevent unplanned downtime.'
    },
    {
      icon: '📑',
      title: 'Automated Reporting & Compliance',
      description: 'Generates batch reports with actual vs. target composition, test results, and furnace logs. Exports to spreadsheets or prints for audits and traceability.'
    },
    {
      icon: '🧠',
      title: 'AI-Driven Optimization',
      description: 'Compares current melt data with historical loads for quality control. Recommends alloy adjustments to reduce waste and energy use.'
    },
    {
      icon: '🔧',
      title: 'Scalable for Foundries of All Sizes',
      description: 'Handles single-furnace shops to high-volume industrial foundries.'
    }
    
  ];

  benefits = [
    {
      title: 'Zero Human Error',
      description: 'Eliminates manual calculations and guesswork in alloy mixing, ensuring precise metallurgical outcomes.'
    },
    {
      title: 'Cost & Waste Reduction',
      description: 'Optimizes raw material usage, cuts excess alloy waste, and reduces rework rates.'
    },
    {
      title: 'Faster Production Cycles',
      description: 'Automates planning, furnace selection, and prioritization to accelerate order fulfillment.'
    },
    {
      title: 'Data-Backed Decision Making',
      description: 'Live dashboards and trend analysis empower proactive process improvements.'
    },
    {
      title: 'Cloud-Enabled Oversight',
      description: 'Securely access melt data, reports, and furnace status remotely for multi-site management.'
    },
    {
      title: 'Seamless Integration',
      description: 'Connects with spectrometers, furnaces, and ERP systems for end-to-end traceability.'
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



