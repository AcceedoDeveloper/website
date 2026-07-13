import { Component } from '@angular/core';
import { CareersService } from '../careers/careers.service';



@Component({
  selector: 'app-career',
  templateUrl: './career.component.html',
  styleUrls: ['./career.component.css']
})
export class CareerComponent {
   roles: any[] = [];

constructor(private careerService: CareersService) {}

ngOnInit() {
  this.careerService.getAllCareers().subscribe((res: any) => {
    this.roles = res;
    //console.log(this.roles);
  });
}
openFullScreen(arg0: string) {
throw new Error('Method not implemented.');
}
scrollToSection(_t20: HTMLElement) {
throw new Error('Method not implemented.');
}

  scrollToJobs() {
    const target = document.querySelector('#jobs');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openWhatsApp() {
    const phoneNumber = '919994111214'; 
    const message = 'Hello, I would like to join your Company';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}