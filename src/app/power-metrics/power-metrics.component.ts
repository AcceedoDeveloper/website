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
  
  features = [
    {
      icon: '🔌',
      title: 'Real-Time Energy Tracking',
      description: 'Continuously monitors electricity, gas, and water consumption via smart meters & IoT sensors. Instant alerts for abnormal usage spikes or inefficiencies.'
    },
    {
      icon: '📊',
      title: 'Comprehensive Analytics',
      description: 'AI-powered trend analysis identifies waste patterns and peak demand cycles. Compares historical vs. real-time data to forecast future consumption.'
    },
    {
      icon: '📱',
      title: 'Customizable Dashboards',
      description: 'Drag-and-drop widgets for live KPIs: cost trends, carbon footprint, and demand forecasts. Role-based views for facilities managers, CFOs, and sustainability teams.'
    },
    {
      icon: '💡',
      title: 'Automated Efficiency Recommendations',
      description: 'AI suggests actionable fixes: equipment upgrades, schedule adjustments, or retrofits. Prioritizes high-impact changes with ROI estimates.'
    },
    {
      icon: '🌐',
      title: 'Multi-Site & Cloud Management',
      description: 'Centralized control for distributed facilities with granular drill-down. Secure API integrations with ERP, BMS, and utility providers.'
    },
    {
      icon: '🏭',
      title: 'Industrial Scalability',
      description: 'Processes millions of data points daily across manufacturing plants, data centers, and smart grids.'
    }
  ];

  benefits = [
    {
      title: 'Cost Reduction',
      description: 'Slash energy bills by 15–30% through peak shaving and waste elimination.'
    },
    {
      title: 'Sustainability Compliance',
      description: 'Track carbon emissions in real time for ESG reporting and regulatory audits.'
    },
    {
      title: 'Operational Efficiency',
      description: 'Predictive maintenance flags failing equipment before energy waste escalates.'
    },
    {
      title: 'Data-Backed Decision Making',
      description: 'Benchmark performance across sites and optimize tariffs/load distribution.'
    },
    {
      title: 'Cybersecurity & Reliability',
      description: 'End-to-end encryption with offline data caching during disruptions.'
    },
    {
      title: '24/7 Support & Integration',
      description: 'Works with legacy SCADA, Modbus, and new IoT ecosystems.'
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



