import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AssignWorkService, AssignWork } from '../../service/assignwork.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() selectedProjectId: string = '';
  @Input() selectedProjectName: string = '';
  @Input() username: string = '';
  @Input() projects: any[] = [];

  months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  days: any[] = [];
  allAssignments: AssignWork[] = [];
  selectedProjectTeamLeads: string[] = [];
  todoAssignments: AssignWork[] = [];
  selectedTaskDate: Date | null = null;
  inProgressAssignments: AssignWork[] = [];
  doneAssignments: AssignWork[] = [];
  allAssignees: string[] = [];
  selectedAssignee: string = '';
  selectedDay: any = null;
  selectedDayTasks: AssignWork[] = [];
  filteredAssignments: AssignWork[] = [];

  constructor(private assignWorkService: AssignWorkService) {}
   
  currentMonth: Date = new Date();
selectedDate: Date = new Date();


changeMonth(offset: number) {
  const year = this.currentMonth.getFullYear();
  const month = this.currentMonth.getMonth() + offset;

  const lastDay = new Date(year, month + 1, 0).getDate();
  const newDay = Math.min(this.selectedDate.getDate(), lastDay);

  this.currentMonth = new Date(year, month, 1);
  this.selectedDate = new Date(year, month, newDay);

  this.buildCalendar();
}

buildCalendar() {
  this.days = [];

  const year = this.currentMonth.getFullYear();
  const month = this.currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Empty cells before month start
  for (let i = 0; i < firstDay; i++) {
    this.days.push({ date: null });
  }

  // Month days
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);

    this.days.push({
      date: d,
      fullDate: dateObj,
      isSunday: dateObj.getDay() === 0,
      isSelected:
        dateObj.toDateString() ===
        this.selectedDate.toDateString(),
    });
  }
}
  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
    this.loadAssignments();
  }

  

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProjectId'] || changes['selectedProjectName'] || changes['username']) {
      this.filterAssignmentsByProject();
      this.generateCalendar();
    }
  }

  loadAssignments() {
    this.assignWorkService.getAssignments().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) this.allAssignments = res;
        else if (res?.works && Array.isArray(res.works)) this.allAssignments = res.works;
        else if (res?.data && Array.isArray(res.data)) this.allAssignments = res.data;
        else if (res?.assignments && Array.isArray(res.assignments)) this.allAssignments = res.assignments;
        else this.allAssignments = [];

        this.filterAssignmentsByProject();
        this.updateAssignees();
        this.generateCalendar();
      },
      error: () => {
        this.allAssignments = [];
        this.filteredAssignments = [];
        this.allAssignees = [];
        this.generateCalendar();
      }
    });
  }

  private filterAssignmentsByProject() {
    if (this.selectedProjectId) {
      this.filteredAssignments = this.allAssignments.filter(a =>
        String(a.projectId) === String(this.selectedProjectId) ||
        String(a.projectId || '') === String(this.selectedProjectId) ||
        String(a.projectName || '').toLowerCase() === String(this.selectedProjectName || '').toLowerCase()
      );
    } else {
      this.filteredAssignments = this.allAssignments.filter(
        a => String(a.assignedTo) === String(this.username) || String(a.assignee) === String(this.username)
      );
    }

    this.updateAssignees();
  }

  private updateAssignees() {
    this.allAssignees = Array.from(
      new Set(this.filteredAssignments.map(task => task.assignee).filter(Boolean))
    );
  }

  generateCalendar() {
    this.days = [];
    this.selectedDay = null;
    this.selectedDayTasks = [];

    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // Sunday = 0, Monday = 1, etc.

    for (let i = 0; i < startDay; i++) {
      this.days.push({ date: '', isSunday: false, tasks: [] });
    }

   
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(this.selectedYear, this.selectedMonth, d);
      const isSunday = dateObj.getDay() === 0;
      
      let tasksForDay = this.filteredAssignments.filter(task => {
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
        this.selectedDayTasks = day.tasks.map((task: AssignWork) => ({ 
          title: task.title,
          status: task.Status 
        }));
      } else {
        this.selectedDayTasks = day.tasks.map((task: AssignWork) => ({ 
          title: task.title, 
          assignee: task.assignee,
          status: task.Status
        }));
      }
    } else {
      this.selectedDay = null;
      this.selectedDayTasks = [];
    }
  }

  getAssigneeTaskCount(assignee: string): number {
    return this.filteredAssignments.filter(task => task.assignee === assignee).length;
  }

  onAssigneeChange() {
    this.generateCalendar();
  }

  onMonthChange() {
    this.generateCalendar();
  }

  onYearChange() {
    this.generateCalendar();
  }
}