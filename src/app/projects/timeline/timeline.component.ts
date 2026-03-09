import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnChanges {
  @Input() timelineItems: any[] = [];
  @Input() selectedProjectId: string = '';
  @Input() selectedProjectName: string = '';
  @Input() months: string[] = [];

  timelineYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  todayLeftPercent: number = 0;
  groupedTimelineItems: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.buildTimeline();
    this.setTodayLine();
  }

  private buildTimeline(): void {
    const items = [...(this.timelineItems || [])];

    this.groupedTimelineItems = items.map((task, index) => {
      const startDate = this.getSafeDate(task.startDate || task.createdAt || task.dueDate);
      const endDate = this.getSafeDate(task.dueDate || task.startDate || task.createdAt);
      const safeEndDate = endDate < startDate ? startDate : endDate;

      return {
        ...task,
        rowId: index + 1,
        startDateObj: startDate,
        endDateObj: safeEndDate,
        startLeft: this.getStartPercent(startDate),
        width: this.getDurationPercent(startDate, safeEndDate),
        statusClass: this.getStatusClass(task.Status),
        progressWidth: this.getProgressWidth(task.Status)
      };
    });
  }

  private setTodayLine(): void {
    const today = new Date();
    const startOfYear = new Date(this.timelineYear, 0, 1);
    const endOfYear = new Date(this.timelineYear, 11, 31);

    const total = endOfYear.getTime() - startOfYear.getTime();
    const current = today.getTime() - startOfYear.getTime();

    this.todayLeftPercent = Math.min(Math.max((current / total) * 100, 0), 100);
  }

  private getSafeDate(value: any): Date {
    if (!value) {
      return new Date(this.timelineYear, 0, 1);
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return new Date(this.timelineYear, 0, 1);
    }

    return d;
  }

  getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ').filter(Boolean);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  getMonthShort(month: string): string {
    return month.substring(0, 3).toUpperCase();
  }

  getStartPercent(date: Date): number {
    const startOfYear = new Date(this.timelineYear, 0, 1);
    const endOfYear = new Date(this.timelineYear, 11, 31);

    const totalMs = endOfYear.getTime() - startOfYear.getTime();
    const currentMs = date.getTime() - startOfYear.getTime();

    return Math.min(Math.max((currentMs / totalMs) * 100, 0), 100);
  }

  getDurationPercent(start: Date, end: Date): number {
    const startOfYear = new Date(this.timelineYear, 0, 1);
    const endOfYear = new Date(this.timelineYear, 11, 31);

    const totalMs = endOfYear.getTime() - startOfYear.getTime();
    const diffMs = end.getTime() - start.getTime();

    return Math.max((diffMs / totalMs) * 100, 2.5);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase().trim();

    if (s.includes('done') || s.includes('complete')) {
      return 'bar-done';
    }

    if (s.includes('progress')) {
      return 'bar-progress';
    }

    return 'bar-todo';
  }

  getProgressWidth(status: string): number {
    const s = (status || '').toLowerCase().trim();

    if (s.includes('done') || s.includes('complete')) {
      return 100;
    }

    if (s.includes('progress')) {
      return 60;
    }

    return 25;
  }

  formatDateLabel(dateValue: any): string {
    const d = this.getSafeDate(dateValue);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  getTodoCount(): number {
    return this.groupedTimelineItems.filter(item => item.statusClass === 'bar-todo').length;
  }

  getProgressCount(): number {
    return this.groupedTimelineItems.filter(item => item.statusClass === 'bar-progress').length;
  }

  getDoneCount(): number {
    return this.groupedTimelineItems.filter(item => item.statusClass === 'bar-done').length;
  }

  trackByRow(index: number, item: any): number {
    return item.rowId;
  }
}