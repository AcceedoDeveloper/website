import { Component, OnInit, ViewChild, TemplateRef, OnDestroy, ElementRef ,AfterViewInit} from '@angular/core';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';



Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent implements AfterViewInit {

  showmaindocument = false;
  showdocumentpop = false;
showinsummary = false;
showMonthView = false;
  showmaintask = true;

  ngAfterViewInit(): void {
    const canvas = document.getElementById('workItemsChart') as HTMLCanvasElement;

    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (ctx) {
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Done', 'In Progress', 'To Do'],
            datasets: [{
              data: [1, 1, 2],
              backgroundColor: ['#4285F4', '#7CB342', '#BA68C8'], // blue, green, purple
              borderWidth: 0
            }]
          },
          options: {
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true }
            }
          }
        });
      }
    }

  }
    openuv() {
    this.ngAfterViewInit()
    this.showinsummary = true;
    this.showmaintask = false;
    this.showMonthView = false;
    this.showmaindocument = false;
    }
    
    
}
