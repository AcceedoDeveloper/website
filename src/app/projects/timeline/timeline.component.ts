import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';

type ZoomLevel = 'month' | 'quarter';

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
  @Input() currentUsername: string = '';

  @Output() todayClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() monthViewClick = new EventEmitter<void>();
  @Output() newTaskClick = new EventEmitter<void>();

  timelineYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  currentMonthIndex: number = new Date().getMonth();
  currentColumnIndex: number = 0;
  todayLeftPercent: number = 0;

  groupedTimelineItems: any[] = [];
  allTimelineItems: any[] = [];

  currentFilter: string = 'all';
  searchText: string = '';
  zoomLevel: ZoomLevel = 'month';

  todoCount: number = 0;
  progressCount: number = 0;
  doneCount: number = 0;
  riskCount: number = 0;

  visibleTimelineColumns: string[] = [];
  dependencyLines: Array<{ path: string }> = [];

  private readonly rowHeight = 160;
  private readonly trackTopOffset = 80;

  isExpanded = false;

  ngOnChanges(changes: SimpleChanges): void {
  this.setupTimelineColumns();
  this.buildTimeline();
  this.applyFilters();
  this.setTodayLine();

  setTimeout(() => {
    this.buildDependencies();
  });
}
  onTodayClick(): void {
    this.todayClick.emit();
  }

  onFilterClick(): void {
    this.filterClick.emit();
  }

  onMonthViewClick(): void {
    this.monthViewClick.emit();
  }

  onNewTaskClick(): void {
    this.newTaskClick.emit();
  }

  setZoomLevel(level: ZoomLevel): void {
    this.zoomLevel = level;
    this.setupTimelineColumns();
    this.buildTimeline();
    this.applyFilters();
    this.setTodayLine();
    this.buildDependencies();
  }

 searchTasks(text: string): void {
  this.searchText = (text || '').toLowerCase().trim();
  this.applyFilters();

  setTimeout(() => {
    this.buildDependencies();
  });
}
  setFilter(filter: string): void {
  this.currentFilter = filter;
  this.applyFilters();

  setTimeout(() => {
    this.buildDependencies();
  });
}
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      document.body.classList.add('timeline-expanded');
    } else {
      document.body.classList.remove('timeline-expanded');
    }
  }

  formatTodayLabel(): string {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  private setupTimelineColumns(): void {
    if (this.zoomLevel === 'quarter') {
      this.visibleTimelineColumns = ['Q1', 'Q2', 'Q3', 'Q4'];
      return;
    }

    this.visibleTimelineColumns = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  }

  private buildTimeline(): void {
    const items = [...(this.timelineItems || [])];

    const validDates = items
      .map(task => this.getSafeDate(task?.startDate || task?.createdAt || task?.dueDate))
      .filter(date => !isNaN(date.getTime()));

    if (validDates.length > 0) {
      this.timelineYear = validDates[0].getFullYear();
    } else {
      this.timelineYear = new Date().getFullYear();
    }

    this.currentMonth = new Date().getMonth();
    this.currentMonthIndex = this.currentMonth;

    const processedItems = items.map((task, index) => {
      const startDate = this.getSafeDate(
        task.startDate || task.createdAt || task.dueDate
      );

      const endDate = this.getSafeDate(
        task.dueDate || task.endDate || task.startDate || task.createdAt
      );

      const safeEndDate = endDate < startDate ? startDate : endDate;

      const rawStatus = task.Status || task.status || '';
      const statusClass = this.getStatusClass(rawStatus);
      const progressWidth = this.getProgressWidth(rawStatus);

      const startLeft = this.getStartPercent(startDate);
      const width = this.getDurationPercent(startDate, safeEndDate);

     return {
  ...task,
  rowId: task._id || index + 1,
  rowIndex: index,
  startDateObj: startDate,
  endDateObj: safeEndDate,
  startLeft,
  endLeft: startLeft + width,
  width,
  statusClass,
  progressWidth,
  displayTitle: task.title || task.taskName || task.name || `Task ${index + 1}`,
  displayOwner: task.assignee || task.assignedTo || task.owner || task.team || 'NA',
  displayPriority: this.getPriority(task),
  displayStatus: this.getDisplayStatus(rawStatus)
};
    });

    this.allTimelineItems = processedItems;
  }

  private applyFilters(): void {
    let items = [...this.allTimelineItems];

    if (this.searchText) {
      items = items.filter(item =>
        (item.displayTitle || '').toLowerCase().includes(this.searchText) ||
        (item.displayOwner || '').toLowerCase().includes(this.searchText) ||
        (item.displayStatus || '').toLowerCase().includes(this.searchText) ||
        (item.displayPriority || '').toLowerCase().includes(this.searchText)
      );
    }

    if (this.currentFilter === 'mine') {
      const currentUser = (this.currentUsername || '').toLowerCase().trim();

      if (!this.selectedProjectId && currentUser) {
        items = items.filter(item => {
          const owner = (item.displayOwner || '').toLowerCase().trim();
          const assignee = (item.assignee || '').toLowerCase().trim();
          const assignedTo = (item.assignedTo || '').toLowerCase().trim();

          return (
            owner.includes(currentUser) ||
            assignee.includes(currentUser) ||
            assignedTo.includes(currentUser)
          );
        });
      }
    } else if (this.currentFilter === 'done') {
      items = items.filter(item => item.statusClass === 'bar-done');
    } else if (this.currentFilter === 'high') {
      items = items.filter(item => (item.displayPriority || '').toLowerCase() === 'high');
    } else if (this.currentFilter === 'risk') {
      items = items.filter(item => item.statusClass === 'bar-risk');
    }

    this.groupedTimelineItems = items;
    this.calculateCounts();
  }

  private calculateCounts(): void {
    this.todoCount = this.groupedTimelineItems.filter(t => t.statusClass === 'bar-todo').length;
    this.progressCount = this.groupedTimelineItems.filter(t => t.statusClass === 'bar-progress').length;
    this.doneCount = this.groupedTimelineItems.filter(t => t.statusClass === 'bar-done').length;
    this.riskCount = this.groupedTimelineItems.filter(t => t.statusClass === 'bar-risk').length;
  }

  private setTodayLine(): void {
    const today = new Date();

    if (this.zoomLevel === 'quarter') {
      const quarterIndex = Math.floor(today.getMonth() / 3);
      this.currentColumnIndex = quarterIndex;
      this.todayLeftPercent = ((quarterIndex + 0.5) / this.visibleTimelineColumns.length) * 100;
      return;
    }

    const monthMap = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonthShort = today.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const monthIndex = monthMap.indexOf(currentMonthShort);

    this.currentColumnIndex = monthIndex !== -1 ? monthIndex : 0;

    if (monthIndex === -1) {
      this.todayLeftPercent = 0;
      return;
    }

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayProgress = (today.getDate() - 1) / daysInMonth;

    this.todayLeftPercent = ((monthIndex + dayProgress) / monthMap.length) * 100;
  }

private buildDependencies(): void {
  const items = this.groupedTimelineItems || [];
  const lines: Array<{ path: string }> = [];

  console.log('Dependency source items:', items);

  items.forEach((task) => {
    if (!task.dependsOn) {
      console.log('No dependsOn for task:', task._id);
      return;
    }

    const parent = items.find(t => String(t._id) === String(task.dependsOn));

    console.log('Task:', task._id, 'dependsOn:', task.dependsOn, 'parent:', parent);

    if (!parent) return;

    const fromX = this.getTrackPercentToSvgX(parent.endLeft);
    const fromY = this.getRowCenterY(parent.rowIndex);

    const toX = this.getTrackPercentToSvgX(task.startLeft);
    const toY = this.getRowCenterY(task.rowIndex);

    const gap = 46;
    const bend = 34;

    const path = `
      M ${fromX} ${fromY}
      C ${fromX + gap} ${fromY},
        ${toX - bend} ${fromY},
        ${toX - bend} ${(fromY + toY) / 2}
      S ${toX - bend} ${toY},
        ${toX} ${toY}
    `;

    console.log('Generated path:', path);

    lines.push({ path: path.replace(/\s+/g, ' ').trim() });
  });

  this.dependencyLines = lines;
  console.log('Final dependencyLines:', this.dependencyLines);
}
private getTrackPercentToSvgX(percent: number): number {
  const trackWidth = 1040;
  return (percent / 100) * trackWidth;
}

  private getRowCenterY(rowIndex: number): number {
    return (rowIndex * this.rowHeight) + this.trackTopOffset;
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

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  getStartPercent(date: Date): number {
    if (this.zoomLevel === 'quarter') {
      const quarterIndex = Math.floor(date.getMonth() / 3);
      const monthInQuarter = date.getMonth() % 3;
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const dayProgress = (date.getDate() - 1) / daysInMonth;
      return ((quarterIndex + ((monthInQuarter + dayProgress) / 3)) / 4) * 100;
    }

    const monthMap = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthShort = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const monthIndex = monthMap.indexOf(monthShort);

    if (monthIndex === -1) {
      return 0;
    }

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayProgress = (date.getDate() - 1) / daysInMonth;

    return ((monthIndex + dayProgress) / monthMap.length) * 100;
  }

  getDurationPercent(start: Date, end: Date): number {
    const startPercent = this.getStartPercent(start);
    const endPercent = this.getStartPercent(end);
    const minimumWidth = this.zoomLevel === 'quarter' ? 12 : 10;
    return Math.max(endPercent - startPercent, minimumWidth);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase().trim();

    if (
      s.includes('risk') ||
      s.includes('delay') ||
      s.includes('delayed') ||
      s.includes('overdue') ||
      s.includes('blocked')
    ) {
      return 'bar-risk';
    }

    if (s.includes('done') || s.includes('complete') || s.includes('completed')) {
      return 'bar-done';
    }

    if (s.includes('progress') || s.includes('in progress')) {
      return 'bar-progress';
    }

    return 'bar-todo';
  }

  getProgressWidth(status: string): number {
    const s = (status || '').toLowerCase().trim();

    if (
      s.includes('risk') ||
      s.includes('delay') ||
      s.includes('delayed') ||
      s.includes('overdue') ||
      s.includes('blocked')
    ) {
      return 35;
    }

    if (s.includes('done') || s.includes('complete') || s.includes('completed')) {
      return 100;
    }

    if (s.includes('progress') || s.includes('in progress')) {
      return 60;
    }

    return 25;
  }

  getDisplayStatus(status: string): string {
    const s = (status || '').toLowerCase().trim();

    if (
      s.includes('risk') ||
      s.includes('delay') ||
      s.includes('delayed') ||
      s.includes('overdue') ||
      s.includes('blocked')
    ) {
      return 'At Risk';
    }

    if (s.includes('done') || s.includes('complete') || s.includes('completed')) {
      return 'Done';
    }

    if (s.includes('progress') || s.includes('in progress')) {
      return 'In Progress';
    }

    return 'To Do';
  }

  formatDateLabel(dateValue: any): string {
    const d = this.getSafeDate(dateValue);

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  private getPriority(task: any): string {
    const raw = (task?.priority || '').toLowerCase().trim();

    if (raw === 'high') return 'High';
    if (raw === 'low') return 'Low';
    return 'Medium';
  }

  trackByRow(index: number, item: any): any {
    return item.rowId || index;
  }
}