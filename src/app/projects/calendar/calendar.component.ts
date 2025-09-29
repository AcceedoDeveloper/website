import { Component, OnInit } from '@angular/core';
import { AssignWorkService, AssignWork } from '../../service/assignwork.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  days: any[] = [];

  allAssignments: AssignWork[] = [];
  allAssignees: string[] = [];
  selectedAssignee: string = '';

  selectedDay: any = null;         
  selectedDayTasks: AssignWork[] = []; 

  constructor(private assignWorkService: AssignWorkService) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
    this.loadAssignments();
  }

  loadAssignments() {
    this.assignWorkService.getAssignments().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) this.allAssignments = res;
        else if (res?.works && Array.isArray(res.works)) this.allAssignments = res.works;
        else this.allAssignments = [];

       
        this.allAssignees = Array.from(
          new Set(this.allAssignments.map(task => task.assignee).filter(Boolean))
        );

        this.generateCalendar();
      },
      error: () => {
        this.allAssignments = [];
        this.allAssignees = [];
        this.generateCalendar();
      }
    });
  }

  generateCalendar() {
    this.days = [];
    this.selectedDay = null;
    this.selectedDayTasks = [];

    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() + 6) % 7; 
    for (let i = 0; i < startDay; i++) {
      this.days.push({ date: '', isSunday: false, tasks: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(this.selectedYear, this.selectedMonth, d);
      const isSunday = dateObj.getDay() === 0;
      let tasksForDay = this.allAssignments.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const matchDate =
          taskDate.getDate() === d &&
          taskDate.getMonth() === this.selectedMonth &&
          taskDate.getFullYear() === this.selectedYear;

        const matchAssignee = !this.selectedAssignee || task.assignee === this.selectedAssignee;

        return matchDate && matchAssignee;
      });

      this.days.push({ date: d, isSunday, tasks: tasksForDay });
    }
    while (this.days.length % 7 !== 0) {
      this.days.push({ date: '', isSunday: false, tasks: [] });
    }
  }

  selectDay(day: any) {
    if (day.tasks.length > 0) {
      this.selectedDay = day;
      if (this.selectedAssignee) {
        this.selectedDayTasks = day.tasks.map((task: { title: any; }) => ({ title: task.title }));
      } else {

        this.selectedDayTasks = day.tasks.map((task: { title: any; assignee: any; }) => ({ title: task.title, assignee: task.assignee }));
      }
    } else {
      this.selectedDay = null;
      this.selectedDayTasks = [];
    }
  }
}
