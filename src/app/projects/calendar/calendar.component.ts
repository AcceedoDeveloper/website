import { Component } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {

  showmaindocument = false;
  showdocumentpop = false;
showinsummary = true;
showMonthView = false;
  showmaintask = false;


  months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    years: number[] = [];
    selectedMonth: number = new Date().getMonth();
    selectedYear: number = new Date().getFullYear();
      days: any[] = [];


        opentask() {
    this.showmaintask = true;
    this.showmaindocument = false;
    this.showinsummary = false;
    this.showMonthView = false;
  }

    openuv() {
    this.showinsummary = true;
    this.showmaintask = false;
    this.showMonthView = false;
    this.showmaindocument = false;
    }

  opendoc() {
    this.showmaindocument = true;
    this.showmaintask = false;
    this.showinsummary = false;
    this.showMonthView = false;
  }

  openMonthView() {
    this.showMonthView = true;
    this.showmaintask = false;
    this.showmaindocument = false;
    this.showinsummary = false;
  }

      ngOnInit(): void {
        const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.generateCalendar();
}

  generateCalendar() {
    this.days = [];
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const offset = (startDay + 6) % 7;

    for (let i = 0; i < offset; i++) {
      this.days.push({ date: '', isSunday: false, isHoliday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(this.selectedYear, this.selectedMonth, d);
      const isSunday = dateObj.getDay() === 0;
      const isHoliday = (this.selectedMonth === 8 && d === 25);

      this.days.push({ date: d, isSunday, isHoliday });
    }

    while (this.days.length % 7 !== 0) {
      this.days.push({ date: '', isSunday: false, isHoliday: false });
    }
  }
}
