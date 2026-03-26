import { Component } from '@angular/core';

@Component({
  selector: 'app-product6',
  templateUrl: './product6.component.html',
  styleUrls: ['./product6.component.css']   
})
export class Product6Component {
modalOpen = false;
modalImage = '';

 currentIndex = 0;

  phases = [
    {
      title: '1. Product Details',
      description: 'Record product information required for quality inspection and documentation.',
      points: [
        'Product Name',
        'Customer Name',
        'Drawing Reference',
        'JSIR – Setup Inspection',
        'PIR – Process Inspection',
        'PDIR – Process Design Inspection',
        'ISIR – Initial Sample Inspection',
        'PMS – Preventive Maintenance'
      ]
    },
    {
      title: '2. Machine Mapping',
      description: 'Machine mapping connects manufacturing operations with machines.',
      points: [
        'Assign machines to operations',
        'Define production sequence',
        'Link machine capability',
        'Ensure correct equipment usage',
        'Improve production efficiency'
      ]
    },
    {
      title: '3. Operations & Inspection',
      description: 'Manage operations and track inspection reports during production.',
      points: [
        'Operation Name',
        'Drawing Reference',
        'JSIR validation',
        'PIR inspection',
        'PDIR process validation',
        'ISIR sample inspection',
        'PMS maintenance tracking'
      ]
    }
  ];

  next() {
    this.currentIndex++;
    if (this.currentIndex >= this.phases.length) {
      this.currentIndex = 0;
    }
  }

  prev() {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.phases.length - 1;
    }
  }

  getCardClass(index: number) {

    if (index === this.currentIndex) {
      return 'active';
    }

    if (index === this.currentIndex + 1) {
      return 'next';
    }

    if (index === this.currentIndex - 1) {
      return 'prev';
    }

    return '';
  }


openImage(img: string): void {
  this.modalImage = img;
  this.modalOpen = true;
}

closeImage(): void {
  this.modalOpen = false;
}
}