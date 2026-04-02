import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AssignWork, AssignWorkSubTask } from '../../service/assignwork.service';

type TaskType = 'PHASE' | 'TASK' | 'BUG';
type TaskStatus = 'New' | 'In progress' | 'Completed';
type TaskPriority = 'Low' | 'Normal' | 'High';
type AllocationState = 'available' | 'busy';

interface TimelineSubtask {
  id: string | number;
  title: string;
  description: string;
  duration: number;
  assignee: string;
  startDay: number;
  endDay: number;
  allocation: AllocationState;
  startDate?: string;
  endDate?: string;
  isSynthetic?: boolean;
}

interface TimelineTask {
  id: string | number;
  title: string;
  projectName: string;
  source: 'default' | 'imported' | 'manual';
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  expanded: boolean;
  startDate?: string;
  endDate?: string;
  subtasks: TimelineSubtask[];
}

interface TimelineDay {
  day: number;
  label: string;
  isWeekend: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnChanges {
  @ViewChild('timelineScroller') timelineScroller?: ElementRef<HTMLDivElement>;

  @Input() timelineItems: AssignWork[] = [];
  @Input() selectedProjectId: string = '';
  @Input() selectedProjectName: string = '';
  @Input() months: string[] = [];
  @Input() currentUsername: string = '';

  @Output() todayClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() monthViewClick = new EventEmitter<void>();
  @Output() newTaskClick = new EventEmitter<void>();

  projectTitle = 'Project plan';
  showTaskForm = false;
  showProjectPanel = false;
  showFilterPanel = false;
  showTodayOnly = false;
  selectedTaskId: string | number | null = null;
  hasManualEdits = false;
  selectedProjectFilter = 'all';
  selectedTypeFilter: 'all' | TaskType = 'all';
  selectedAllocationFilter: 'all' | AllocationState = 'all';
  selectedAssigneeFilter = 'all';
  visibleMonthDate = this.getMonthStart(new Date());

  newTask = {
    title: '',
    type: 'TASK' as TaskType,
    status: 'New' as TaskStatus,
    priority: 'Normal' as TaskPriority,
    assignee: '',
    startDate: this.getDefaultTaskStartDate() as Date | null,
    endDate: this.getDefaultTaskEndDate() as Date | null,
    duration: 4
  };

  newSubtask = {
    title: '',
    description: '',
    assignee: '',
    startDate: this.getDefaultTaskStartDate() as Date | null,
    endDate: this.getDefaultTaskEndDate() as Date | null
  };

  tasks: TimelineTask[] = [];
  private deletedImportedTaskIds = new Set<string>();
  private importedSubtaskOverrides: Record<string, TimelineSubtask[]> = {};

  constructor() {
    this.refreshSchedule();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProjectName']) {
      this.syncProjectTitle();
    }

    const timelineChanged = !!changes['timelineItems'];
    const projectContextChanged = !!changes['selectedProjectId'];
    if (!timelineChanged && !projectContextChanged) {
      return;
    }

    this.loadImportedOverrides();

    const persistedManualTasks = this.loadPersistedTasks();
    const mappedTimelineTasks = this.mapAssignmentsToTasks(this.timelineItems)
      .filter(task => !this.deletedImportedTaskIds.has(String(task.id)))
      .map(task => ({
        ...task,
        subtasks: [...task.subtasks, ...(this.importedSubtaskOverrides[String(task.id)] || [])]
      }));

    this.hasManualEdits = persistedManualTasks.length > 0;
    this.tasks = [...persistedManualTasks, ...mappedTimelineTasks];
    if (this.selectedProjectFilter !== 'all' && !this.projectOptions.includes(this.selectedProjectFilter)) {
      this.selectedProjectFilter = 'all';
    }
    this.syncProjectTitle();
    this.refreshSchedule();
  }

  get activeTaskCount(): number {
    return this.displayTasks.length;
  }

  get subtaskCount(): number {
    return this.displayTasks.reduce((count, task) => count + this.getVisibleSubtasks(task).length, 0);
  }

  get projectCount(): number {
    return this.projectOptions.length;
  }

  get currentMonthLabel(): string {
    const monthName =
      this.months[this.visibleMonthDate.getMonth()] ||
      this.visibleMonthDate.toLocaleString('default', { month: 'long' });
    return `${monthName} ${this.visibleMonthDate.getFullYear()}`;
  }

  get totalDays(): number {
    return this.getDaysInMonth(this.visibleMonthDate);
  }

  get days(): TimelineDay[] {
    return this.buildDays();
  }

  get calendarGridTemplate(): string {
    return `repeat(${this.totalDays}, minmax(36px, 1fr))`;
  }

  get calendarMinWidth(): string {
    return `${this.totalDays * 36}px`;
  }

  get todayLineLeft(): number {
    if (!this.isViewingCurrentMonth()) {
      return -100;
    }

    const todayIndex = this.days.findIndex(day => day.isToday);
    const safeIndex = todayIndex >= 0 ? todayIndex : 0;
    return ((safeIndex + 0.5) / this.totalDays) * 100;
  }

  get displayTasks(): TimelineTask[] {
    const todayDay = this.isViewingCurrentMonth() ? this.days.find(day => day.isToday)?.day ?? 1 : null;

    return this.tasks
      .map(task => {
        const subtasks = task.subtasks.filter(subtask => {
          if (!this.isSubtaskInVisibleMonth(subtask)) {
            return false;
          }

          const startDay = this.getSubtaskStartDay(subtask);
          const endDay = this.getSubtaskEndDay(subtask);

          if (this.showTodayOnly && todayDay !== null && (todayDay < startDay || todayDay > endDay)) {
            return false;
          }

          if (this.selectedAllocationFilter !== 'all' && subtask.allocation !== this.selectedAllocationFilter) {
            return false;
          }

          if (this.selectedAssigneeFilter !== 'all' && subtask.assignee !== this.selectedAssigneeFilter) {
            return false;
          }

          return true;
        });

        return {
          ...task,
          subtasks
        };
      })
      .filter(task => {
        if (this.selectedProjectFilter !== 'all' && task.projectName !== this.selectedProjectFilter) {
          return false;
        }

        if (this.selectedTypeFilter !== 'all' && task.type !== this.selectedTypeFilter) {
          return false;
        }

        return task.subtasks.length > 0;
      });
  }

  get projectOptions(): string[] {
    return Array.from(new Set(this.tasks.map(task => task.projectName).filter(Boolean)));
  }

  get assigneeOptions(): string[] {
    return Array.from(
      new Set(
        this.tasks.flatMap(task => this.getVisibleSubtasks(task).map(subtask => subtask.assignee)).filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));
  }

  hasVisibleSubtasks(task: TimelineTask): boolean {
    return this.getVisibleSubtasks(task).length > 0;
  }

  getVisibleSubtasks(task: TimelineTask): TimelineSubtask[] {
    return task.subtasks.filter(subtask => !subtask.isSynthetic);
  }

  selectProjectFilter(projectName: string): void {
    this.selectedProjectFilter = projectName;
    this.syncProjectTitle();
  }

  openTaskComposer(): void {
    this.showTaskForm = !this.showTaskForm;
    this.selectedTaskId = null;
  }

  toggleProjectPanel(): void {
    this.showProjectPanel = !this.showProjectPanel;
    if (this.showProjectPanel) {
      this.showFilterPanel = false;
    }
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
    if (this.showFilterPanel) {
      this.showProjectPanel = false;
    }
    this.filterClick.emit();
  }

  openSubtaskComposer(taskId: string | number): void {
    this.selectedTaskId = this.isSelectedTask(taskId) ? null : taskId;
    this.showTaskForm = false;
    this.resetSubtaskForm();
  }

  emitToday(): void {
    this.showTodayOnly = !this.showTodayOnly;
    if (this.showTodayOnly) {
      this.visibleMonthDate = this.getMonthStart(new Date());
    }
    this.scrollToToday();
    this.todayClick.emit();
  }

  emitFilter(): void {
    this.toggleFilterPanel();
  }

  emitMonthView(): void {
    this.showTodayOnly = false;
    this.selectProjectFilter('all');
    this.selectedTypeFilter = 'all';
    this.selectedAllocationFilter = 'all';
    this.selectedAssigneeFilter = 'all';
    this.showProjectPanel = false;
    this.showFilterPanel = false;
    this.visibleMonthDate = this.getMonthStart(new Date());
    this.monthViewClick.emit();
  }

  goToPreviousMonth(): void {
    this.visibleMonthDate = this.getMonthStart(
      new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth() - 1, 1)
    );
    this.refreshSchedule();
  }

  goToNextMonth(): void {
    this.visibleMonthDate = this.getMonthStart(
      new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth() + 1, 1)
    );
    this.refreshSchedule();
  }

  clearFilters(): void {
    this.selectProjectFilter('all');
    this.selectedTypeFilter = 'all';
    this.selectedAllocationFilter = 'all';
    this.selectedAssigneeFilter = 'all';
    this.showTodayOnly = false;
  }

  onNewTaskStartDateChange(value: Date | null): void {
    const startDate = this.normalizePickerDate(value);
    const endDate = this.normalizePickerDate(this.newTask.endDate);
    const duration = Math.max(1, Number(this.newTask.duration) || 1);

    this.newTask.startDate = startDate;
    if (!startDate) {
      return;
    }

    if (!endDate || endDate < startDate) {
      this.newTask.endDate = this.addDays(startDate, duration - 1);
      return;
    }

    this.newTask.duration = this.getDateDifference(startDate, endDate);
  }

  onNewTaskEndDateChange(value: Date | null): void {
    const endDate = this.normalizePickerDate(value);
    const startDate = this.normalizePickerDate(this.newTask.startDate);

    if (startDate && endDate && endDate < startDate) {
      this.newTask.endDate = startDate;
      return;
    }

    this.newTask.endDate = endDate;
    if (startDate && endDate) {
      this.newTask.duration = this.getDateDifference(startDate, endDate);
    }
  }

  onNewTaskDurationChange(value: number | string): void {
    const duration = Math.max(1, Number(value) || 1);
    const startDate = this.normalizePickerDate(this.newTask.startDate);

    this.newTask.duration = duration;
    if (!startDate) {
      return;
    }

    this.newTask.endDate = this.addDays(startDate, duration - 1);
  }

  addTask(): void {
    const title = this.newTask.title.trim();
    const assignee = this.newTask.assignee.trim() || this.currentUsername || 'Unassigned';
    const startDate = this.normalizePickerDate(this.newTask.startDate);
    const endDate = this.normalizePickerDate(this.newTask.endDate);

    if (!title || !startDate || !endDate) {
      return;
    }

    this.hasManualEdits = true;
    const normalizedRange = this.normalizeSubtaskDateRange(startDate, endDate, 1);
    const duration = normalizedRange.duration;
    const startDay = this.resolveVisibleDay(normalizedRange.startDate, normalizedRange.endDate);
    const endDay = this.resolveVisibleEndDay(normalizedRange.startDate, normalizedRange.endDate);
    this.visibleMonthDate = this.getMonthStart(normalizedRange.startDate);

    this.tasks.unshift({
      id: `manual-${Date.now()}`,
      title,
      projectName: this.selectedProjectName || this.projectTitle,
      source: 'manual',
      type: this.newTask.type,
      status: this.newTask.status,
      priority: this.newTask.priority,
      assignee,
      expanded: true,
      startDate: this.toStorageDate(normalizedRange.startDate),
      endDate: this.toStorageDate(normalizedRange.endDate),
      subtasks: [
        {
          id: `manual-sub-${Date.now() + 1}`,
          title,
          description: '',
          duration,
          assignee,
          startDay,
          endDay,
          allocation: 'available',
          startDate: this.toStorageDate(normalizedRange.startDate),
          endDate: this.toStorageDate(normalizedRange.endDate),
          isSynthetic: true
        }
      ]
    });

    this.resetTaskForm();
    this.showTaskForm = false;
    this.refreshSchedule();
  }

  addSubtask(task: TimelineTask): void {
    const targetTask = this.tasks.find(item => item.id === task.id);
    const title = this.newSubtask.title.trim();
    const assignee = this.newSubtask.assignee.trim();
    const startDate = this.normalizePickerDate(this.newSubtask.startDate);
    const endDate = this.normalizePickerDate(this.newSubtask.endDate);

    if (!targetTask || !title || !assignee || !startDate || !endDate) {
      return;
    }

    this.hasManualEdits = true;

    const normalizedRange = this.normalizeSubtaskDateRange(startDate, endDate, 1);
    const duration = normalizedRange.duration;
    const startDay = this.resolveVisibleDay(normalizedRange.startDate, normalizedRange.endDate);
    const endDay = this.resolveVisibleEndDay(normalizedRange.startDate, normalizedRange.endDate);

    const createdSubtask: TimelineSubtask = {
      id: `sub-${Date.now()}`,
      title,
      description: this.newSubtask.description.trim(),
      duration,
      assignee,
      startDay,
      endDay,
      allocation: 'available',
      startDate: this.toStorageDate(normalizedRange.startDate),
      endDate: this.toStorageDate(normalizedRange.endDate),
      isSynthetic: false
    };

    targetTask.subtasks.push(createdSubtask);

    if (targetTask.source === 'imported') {
      const taskKey = String(targetTask.id);
      this.importedSubtaskOverrides[taskKey] = [...(this.importedSubtaskOverrides[taskKey] || []), createdSubtask];
      this.persistImportedOverrides();
    }

    targetTask.assignee = targetTask.subtasks[0]?.assignee || targetTask.assignee;
    targetTask.expanded = true;
    this.selectedTaskId = null;
    this.resetSubtaskForm();
    this.rebuildTasks();
  }

  deleteTask(taskId: string | number): void {
    this.hasManualEdits = true;
    const targetTask = this.tasks.find(task => task.id === taskId);
    if (targetTask?.source === 'imported') {
      this.deletedImportedTaskIds.add(String(taskId));
      delete this.importedSubtaskOverrides[String(taskId)];
      this.persistImportedOverrides();
    }

    this.rebuildTasks();
  }

  deleteSubtask(task: TimelineTask, subtaskId: string | number): void {
    const targetTask = this.tasks.find(item => item.id === task.id);
    if (!targetTask) {
      return;
    }

    this.hasManualEdits = true;
    targetTask.subtasks = targetTask.subtasks.filter(subtask => subtask.id !== subtaskId);

    if (targetTask.source === 'imported') {
      const taskKey = String(targetTask.id);
      this.importedSubtaskOverrides[taskKey] = (this.importedSubtaskOverrides[taskKey] || [])
        .filter(subtask => subtask.id !== subtaskId);
      this.persistImportedOverrides();
    }

    this.rebuildTasks();
  }

  toggleTask(task: TimelineTask): void {
    const targetTask = this.tasks.find(item => item.id === task.id);
    if (!targetTask) {
      return;
    }

    targetTask.expanded = !targetTask.expanded;
  }

  getTaskStartDay(task: TimelineTask): number {
    const startDate = this.getTaskStartDate(task);
    const endDate = this.getTaskEndDate(task);
    if (startDate && endDate) {
      return this.resolveVisibleDay(startDate, endDate, 1);
    }

    if (!task.subtasks.length) {
      return 1;
    }

    return Math.min(...task.subtasks.map(subtask => this.getSubtaskStartDay(subtask)));
  }

  getTaskEndDay(task: TimelineTask): number {
    const startDate = this.getTaskStartDate(task);
    const endDate = this.getTaskEndDate(task);
    if (startDate && endDate) {
      return this.resolveVisibleEndDay(startDate, endDate);
    }

    if (!task.subtasks.length) {
      return 1;
    }

    return Math.max(...task.subtasks.map(subtask => this.getSubtaskEndDay(subtask)));
  }

  getTaskDuration(task: TimelineTask): number {
    return this.getTaskEndDay(task) - this.getTaskStartDay(task) + 1;
  }

  getTaskBarLeft(task: TimelineTask): number {
    return ((this.getTaskStartDay(task) - 1) / this.totalDays) * 100;
  }

  getTaskBarWidth(task: TimelineTask): number {
    return (this.getTaskDuration(task) / this.totalDays) * 100;
  }

  getSubtaskBarLeft(subtask: TimelineSubtask): number {
    return ((this.getSubtaskStartDay(subtask) - 1) / this.totalDays) * 100;
  }

  getSubtaskBarWidth(subtask: TimelineSubtask): number {
    return (Math.max(1, this.getSubtaskEndDay(subtask) - this.getSubtaskStartDay(subtask) + 1) / this.totalDays) * 100;
  }

  getTaskTypeClass(type: TaskType): string {
    return type.toLowerCase();
  }

  getStatusClass(status: TaskStatus): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  getPriorityClass(priority: TaskPriority): string {
    return priority.toLowerCase();
  }

  getTaskBarClass(task: TimelineTask): string {
    return `task-bar-${task.type.toLowerCase()}`;
  }

  taskHasConflict(task: TimelineTask): boolean {
    const assignee = task.assignee.trim().toLowerCase();
    const startDate = this.getTaskStartDate(task);
    const endDate = this.getTaskEndDate(task);

    if (!assignee || !startDate || !endDate) {
      return false;
    }

    return this.tasks.some(otherTask => {
      if (otherTask.id === task.id) {
        return false;
      }

      const otherAssignee = otherTask.assignee.trim().toLowerCase();
      const otherStartDate = this.getTaskStartDate(otherTask);
      const otherEndDate = this.getTaskEndDate(otherTask);

      if (!otherStartDate || !otherEndDate) {
        return false;
      }

      const sameAssignee = otherAssignee === assignee;
      const overlaps = startDate <= otherEndDate && endDate >= otherStartDate;
      const isLaterTask = this.compareTaskOrder(task, otherTask) > 0;
      return sameAssignee && overlaps && isLaterTask;
    });
  }

  getTaskBarBackground(task: TimelineTask): string {
    if (this.taskHasConflict(task)) {
      return 'var(--tm-yellow)';
    }

    if (task.type === 'BUG') {
      return 'var(--tm-red)';
    }

    return '#12906f';
  }

  getInitials(name: string): string {
    if (!name) {
      return 'NA';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  trackByTask(index: number, task: TimelineTask): string | number {
    return task.id;
  }

  trackBySubtask(index: number, subtask: TimelineSubtask): string | number {
    return subtask.id;
  }

  isSelectedTask(taskId: string | number): boolean {
    return this.selectedTaskId !== null && String(this.selectedTaskId) === String(taskId);
  }

  private refreshSchedule(): void {
    for (const task of this.tasks) {
      for (const subtask of task.subtasks) {
        if (subtask.startDate) {
          const normalizedRange = this.normalizeSubtaskDateRange(subtask.startDate, subtask.endDate, subtask.duration);
          subtask.startDate = this.toStorageDate(normalizedRange.startDate);
          subtask.endDate = this.toStorageDate(normalizedRange.endDate);
          subtask.duration = normalizedRange.duration;
          continue;
        }

        subtask.startDay = this.clampDay(subtask.startDay);
        subtask.duration = Math.max(1, subtask.duration);
        subtask.endDay = this.getEndDay(subtask.startDay, subtask.duration);
      }
    }

    for (const task of this.tasks) {
      for (const subtask of task.subtasks) {
        subtask.allocation = this.hasConflict(task.id, subtask.id, subtask.assignee, subtask)
          ? 'busy'
          : 'available';
      }
    }

    this.persistTasks();
  }

  private rebuildTasks(): void {
    const persistedManualTasks = this.loadPersistedTasks();
    const mappedTimelineTasks = this.mapAssignmentsToTasks(this.timelineItems)
      .filter(task => !this.deletedImportedTaskIds.has(String(task.id)))
      .map(task => ({
        ...task,
        subtasks: [...task.subtasks, ...(this.importedSubtaskOverrides[String(task.id)] || [])]
      }));

    const localManualTasks = this.tasks.filter(task => task.source === 'manual');
    this.tasks = [...localManualTasks, ...persistedManualTasks.filter(task => !localManualTasks.some(local => local.id === task.id)), ...mappedTimelineTasks];
    this.refreshSchedule();
  }

  private hasConflict(taskId: string | number, subtaskId: string | number, assignee: string, targetSubtask: TimelineSubtask): boolean {
    const normalizedAssignee = assignee.trim().toLowerCase();

    if (!normalizedAssignee) {
      return false;
    }

    return this.tasks.some(task =>
      task.subtasks.some(subtask => {
        if (task.id === taskId && subtask.id === subtaskId) {
          return false;
        }

        const sameAssignee = subtask.assignee.trim().toLowerCase() === normalizedAssignee;
        const overlaps = this.doSubtasksOverlap(targetSubtask, subtask);
        const isLaterTask = this.compareSubtaskOrder(targetSubtask, subtask) > 0;
        return sameAssignee && overlaps && isLaterTask;
      })
    );
  }

  private mapAssignmentsToTasks(items: AssignWork[]): TimelineTask[] {
    return items.map((item, index) => {
      const status = this.normalizeStatus(item.Status);
      const subtasks = item.subTask?.length
        ? item.subTask.map((subTask, subTaskIndex) => this.mapAssignmentSubTask(item, subTask, index, subTaskIndex))
        : [this.mapAssignmentFallbackSubTask(item, index)];

      return {
        id: this.getImportedTaskId(item, index),
        title: item.title || `Task ${index + 1}`,
        projectName: item.projectName || this.selectedProjectName || this.projectTitle,
        source: 'imported',
        type: 'TASK',
        status,
        priority: 'Normal',
        assignee: item.assignee || item.assignedTo || this.currentUsername || 'Unassigned',
        expanded: true,
        startDate: this.toStorageDate(this.parseDate(item.startDate)),
        endDate: this.toStorageDate(this.parseDate(item.dueDate)),
        subtasks
      };
    });
  }

  private mapAssignmentSubTask(
    item: AssignWork,
    subTask: AssignWorkSubTask,
    taskIndex: number,
    subTaskIndex: number
  ): TimelineSubtask {
    const startDate = this.parseDate(subTask.StartDate || item.startDate);
    const endDate = this.parseDate(subTask.EndDate || item.dueDate);

    if (!startDate || !endDate) {
      return {
        id: `${this.getImportedTaskId(item, taskIndex)}-sub-${subTaskIndex}`,
        title: subTask.title || `Subtask ${subTaskIndex + 1}`,
        description: subTask.description || '',
        duration: 1,
        assignee: subTask.assignee || subTask.assignedTo || item.assignee || item.assignedTo || this.currentUsername || 'Unassigned',
        startDay: 1,
        endDay: 1,
        allocation: 'available',
        isSynthetic: false
      };
    }

    const normalizedRange = this.normalizeSubtaskDateRange(startDate, endDate, 1);

    return {
      id: `${this.getImportedTaskId(item, taskIndex)}-sub-${subTaskIndex}`,
      title: subTask.title || `Subtask ${subTaskIndex + 1}`,
      description: subTask.description || '',
      duration: Math.max(1, this.getDateDifference(normalizedRange.startDate, normalizedRange.endDate)),
      assignee: subTask.assignee || subTask.assignedTo || item.assignee || item.assignedTo || this.currentUsername || 'Unassigned',
      startDay: this.resolveVisibleDay(normalizedRange.startDate, normalizedRange.endDate, subTaskIndex + 1),
      endDay: this.resolveVisibleEndDay(normalizedRange.startDate, normalizedRange.endDate),
      allocation: 'available',
      startDate: this.toStorageDate(normalizedRange.startDate),
      endDate: this.toStorageDate(normalizedRange.endDate),
      isSynthetic: false
    };
  }

  private mapAssignmentFallbackSubTask(item: AssignWork, index: number): TimelineSubtask {
    const startDate = this.parseDate(item.startDate);
    const endDate = this.parseDate(item.dueDate);

    if (!startDate || !endDate) {
      return {
        id: `${this.getImportedTaskId(item, index)}-sub-0`,
        title: item.title || `Subtask ${index + 1}`,
        description: item.description || '',
        duration: 1,
        assignee: item.assignee || item.assignedTo || this.currentUsername || 'Unassigned',
        startDay: 1,
        endDay: 1,
        allocation: 'available',
        isSynthetic: true
      };
    }

    const normalizedRange = this.normalizeSubtaskDateRange(startDate, endDate, 1);

    return {
      id: `${this.getImportedTaskId(item, index)}-sub-0`,
      title: item.title || `Subtask ${index + 1}`,
      description: item.description || '',
      duration: Math.max(1, this.getDateDifference(normalizedRange.startDate, normalizedRange.endDate)),
      assignee: item.assignee || item.assignedTo || this.currentUsername || 'Unassigned',
      startDay: this.resolveVisibleDay(normalizedRange.startDate, normalizedRange.endDate, index + 1),
      endDay: this.resolveVisibleEndDay(normalizedRange.startDate, normalizedRange.endDate),
      allocation: 'available',
      startDate: this.toStorageDate(normalizedRange.startDate),
      endDate: this.toStorageDate(normalizedRange.endDate),
      isSynthetic: true
    };
  }

  private parseDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private getDateDifference(startDate: Date | null, endDate: Date | null): number {
    if (!startDate || !endDate) {
      return 1;
    }

    const diff = endDate.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  private normalizeStatus(value: string | undefined): TaskStatus {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('done') || normalized.includes('complete')) {
      return 'Completed';
    }
    if (normalized.includes('progress')) {
      return 'In progress';
    }
    return 'New';
  }

  private clampDay(day: number): number {
    return Math.min(this.totalDays, Math.max(1, Number(day) || 1));
  }

  private getSubtaskStartDate(subtask: TimelineSubtask): Date | null {
    return this.parseDate(subtask.startDate);
  }

  private getSubtaskEndDate(subtask: TimelineSubtask): Date | null {
    return this.parseDate(subtask.endDate || subtask.startDate);
  }

  private getTaskStartDate(task: TimelineTask): Date | null {
    return this.parseDate(task.startDate);
  }

  private getTaskEndDate(task: TimelineTask): Date | null {
    return this.parseDate(task.endDate || task.startDate);
  }

  private getSubtaskStartDay(subtask: TimelineSubtask): number {
    const startDate = this.getSubtaskStartDate(subtask);
    const endDate = this.getSubtaskEndDate(subtask);
    if (startDate && endDate) {
      return this.resolveVisibleDay(startDate, endDate, subtask.startDay);
    }

    return this.clampDay(subtask.startDay);
  }

  private getSubtaskEndDay(subtask: TimelineSubtask): number {
    const startDate = this.getSubtaskStartDate(subtask);
    const endDate = this.getSubtaskEndDate(subtask);
    if (startDate && endDate) {
      return this.resolveVisibleEndDay(startDate, endDate);
    }

    return this.getEndDay(this.getSubtaskStartDay(subtask), subtask.duration);
  }

  private doSubtasksOverlap(left: TimelineSubtask, right: TimelineSubtask): boolean {
    const leftStartDate = this.getSubtaskStartDate(left);
    const leftEndDate = this.getSubtaskEndDate(left);
    const rightStartDate = this.getSubtaskStartDate(right);
    const rightEndDate = this.getSubtaskEndDate(right);

    if (leftStartDate && leftEndDate && rightStartDate && rightEndDate) {
      return leftStartDate <= rightEndDate && leftEndDate >= rightStartDate;
    }

    const leftStartDay = this.getSubtaskStartDay(left);
    const leftEndDay = this.getSubtaskEndDay(left);
    const rightStartDay = this.getSubtaskStartDay(right);
    const rightEndDay = this.getSubtaskEndDay(right);
    return leftStartDay <= rightEndDay && leftEndDay >= rightStartDay;
  }

  private compareSubtaskOrder(left: TimelineSubtask, right: TimelineSubtask): number {
    const leftStartDate = this.getSubtaskStartDate(left);
    const rightStartDate = this.getSubtaskStartDate(right);
    if (leftStartDate && rightStartDate) {
      const startDiff = leftStartDate.getTime() - rightStartDate.getTime();
      if (startDiff !== 0) {
        return startDiff;
      }
    }

    const leftEndDate = this.getSubtaskEndDate(left);
    const rightEndDate = this.getSubtaskEndDate(right);
    if (leftEndDate && rightEndDate) {
      const endDiff = leftEndDate.getTime() - rightEndDate.getTime();
      if (endDiff !== 0) {
        return endDiff;
      }
    }

    const startDayDiff = this.getSubtaskStartDay(left) - this.getSubtaskStartDay(right);
    if (startDayDiff !== 0) {
      return startDayDiff;
    }

    const endDayDiff = this.getSubtaskEndDay(left) - this.getSubtaskEndDay(right);
    if (endDayDiff !== 0) {
      return endDayDiff;
    }

    return String(left.id).localeCompare(String(right.id));
  }

  private compareTaskOrder(left: TimelineTask, right: TimelineTask): number {
    const leftStartDate = this.getTaskStartDate(left);
    const rightStartDate = this.getTaskStartDate(right);
    if (leftStartDate && rightStartDate) {
      const startDiff = leftStartDate.getTime() - rightStartDate.getTime();
      if (startDiff !== 0) {
        return startDiff;
      }
    }

    const leftEndDate = this.getTaskEndDate(left);
    const rightEndDate = this.getTaskEndDate(right);
    if (leftEndDate && rightEndDate) {
      const endDiff = leftEndDate.getTime() - rightEndDate.getTime();
      if (endDiff !== 0) {
        return endDiff;
      }
    }

    return String(left.id).localeCompare(String(right.id));
  }

  private getEndDay(startDay: number, duration: number): number {
    return this.clampDay(startDay + duration - 1);
  }

  private resetTaskForm(): void {
    this.newTask = {
      title: '',
      type: 'TASK',
      status: 'New',
      priority: 'Normal',
      assignee: '',
      startDate: this.getDefaultTaskStartDate() as Date | null,
      endDate: this.getDefaultTaskEndDate() as Date | null,
      duration: 4
    };
  }

  private resetSubtaskForm(): void {
    this.newSubtask = {
      title: '',
      description: '',
      assignee: '',
      startDate: this.getDefaultTaskStartDate() as Date | null,
      endDate: this.getDefaultTaskEndDate() as Date | null
    };
  }

  private buildDays(): TimelineDay[] {
    const today = new Date();
    const year = this.visibleMonthDate.getFullYear();
    const month = this.visibleMonthDate.getMonth();

    return Array.from({ length: this.totalDays }, (_, index) => {
      const date = new Date(year, month, index + 1);
      return {
        day: index + 1,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday:
          index + 1 === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear()
      };
    });
  }

  private scrollToToday(): void {
    const scroller = this.timelineScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const targetLeft = (this.todayLineLeft / 100) * scroller.scrollWidth - scroller.clientWidth / 2;
    scroller.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth'
    });
  }

  private getStorageKey(): string {
    const key = this.selectedProjectId || this.selectedProjectName || 'default';
    return `timeline.tasks.${key}`;
  }

  private getImportedOverridesKey(): string {
    const key = this.selectedProjectId || this.selectedProjectName || 'default';
    return `timeline.imported-overrides.${key}`;
  }

  private persistTasks(): void {
    const manualTasks = this.tasks.filter(task => task.source === 'manual');
    localStorage.setItem(this.getStorageKey(), JSON.stringify(manualTasks));
  }

  private loadPersistedTasks(): TimelineTask[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as TimelineTask[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(task => task?.source === 'manual');
    } catch {
      return [];
    }
  }

  private persistImportedOverrides(): void {
    localStorage.setItem(
      this.getImportedOverridesKey(),
      JSON.stringify({
        deletedTaskIds: Array.from(this.deletedImportedTaskIds),
        subtaskOverrides: this.importedSubtaskOverrides
      })
    );
  }

  private loadImportedOverrides(): void {
    try {
      const raw = localStorage.getItem(this.getImportedOverridesKey());
      if (!raw) {
        this.deletedImportedTaskIds = new Set<string>();
        this.importedSubtaskOverrides = {};
        return;
      }

      const parsed = JSON.parse(raw) as { deletedTaskIds?: string[]; subtaskOverrides?: Record<string, TimelineSubtask[]> };
      this.deletedImportedTaskIds = new Set(parsed.deletedTaskIds || []);
      this.importedSubtaskOverrides = parsed.subtaskOverrides || {};
    } catch {
      this.deletedImportedTaskIds = new Set<string>();
      this.importedSubtaskOverrides = {};
    }
  }

  private getImportedTaskId(item: AssignWork, index: number): string {
    return String(item._id || item.projectId || item.title || `task-${index}`);
  }

  private syncProjectTitle(): void {
    if (this.selectedProjectFilter !== 'all') {
      this.projectTitle = this.selectedProjectFilter;
      return;
    }

    const selectedProjectName = this.selectedProjectName?.trim();
    this.projectTitle = this.projectOptions.length > 1 ? 'All Projects' : (selectedProjectName || 'Project plan');
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private isViewingCurrentMonth(): boolean {
    const today = new Date();
    return (
      this.visibleMonthDate.getFullYear() === today.getFullYear() &&
      this.visibleMonthDate.getMonth() === today.getMonth()
    );
  }

  private createDateForVisibleMonth(day: number): Date {
    return new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth(), this.clampDay(day));
  }

  private getDefaultTaskStartDate(): Date {
    const today = new Date();
    if (
      this.visibleMonthDate.getFullYear() === today.getFullYear() &&
      this.visibleMonthDate.getMonth() === today.getMonth()
    ) {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    return this.createDateForVisibleMonth(1);
  }

  private getDefaultTaskEndDate(): Date {
    return this.addDays(this.getDefaultTaskStartDate(), 3);
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private normalizePickerDate(value: Date | string | null | undefined): Date | null {
    const parsed = typeof value === 'string' ? this.parseDate(value) : value;
    if (!parsed) {
      return null;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private toStorageDate(date: Date | null): string | undefined {
    return date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString() : undefined;
  }

  private createSubtaskDates(startDay: number, duration: number): Pick<TimelineSubtask, 'startDate' | 'endDate'> {
    const startDate = this.createDateForVisibleMonth(startDay);
    const endDate = this.addDays(startDate, duration - 1);
    return {
      startDate: this.toStorageDate(startDate),
      endDate: this.toStorageDate(endDate)
    };
  }

  private normalizeSubtaskDateRange(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    fallbackDuration: number
  ): { startDate: Date; endDate: Date; duration: number } {
    const normalizedStart = typeof startDate === 'string' ? this.parseDate(startDate) : startDate;
    const normalizedEnd = typeof endDate === 'string' ? this.parseDate(endDate) : endDate;
    const fallbackStart = this.createDateForVisibleMonth(1);
    const safeStart = normalizedStart || normalizedEnd || fallbackStart;
    const safeEnd = normalizedEnd || this.addDays(safeStart, Math.max(1, fallbackDuration) - 1);
    const orderedStart = safeStart <= safeEnd ? safeStart : safeEnd;
    const orderedEnd = safeStart <= safeEnd ? safeEnd : safeStart;
    return {
      startDate: orderedStart,
      endDate: orderedEnd,
      duration: this.getDateDifference(orderedStart, orderedEnd)
    };
  }

  private isSubtaskInVisibleMonth(subtask: TimelineSubtask): boolean {
    if (!subtask.startDate) {
      return false;
    }

    const startDate = this.parseDate(subtask.startDate);
    const endDate = this.parseDate(subtask.endDate || subtask.startDate);
    if (!startDate || !endDate) {
      return false;
    }

    const visibleStart = this.getMonthStart(this.visibleMonthDate);
    const visibleEnd = new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth() + 1, 0);
    return startDate <= visibleEnd && endDate >= visibleStart;
  }

  private resolveVisibleDay(startDate: Date, endDate: Date, fallbackDay = 1): number {
    const visibleStart = this.getMonthStart(this.visibleMonthDate);
    if (startDate > new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth() + 1, 0)) {
      return this.clampDay(fallbackDay);
    }

    return this.clampDay(startDate < visibleStart ? 1 : startDate.getDate());
  }

  private resolveVisibleEndDay(startDate: Date, endDate: Date): number {
    const visibleEnd = new Date(this.visibleMonthDate.getFullYear(), this.visibleMonthDate.getMonth() + 1, 0);
    if (endDate < this.getMonthStart(this.visibleMonthDate)) {
      return 1;
    }

    return this.clampDay(endDate > visibleEnd ? visibleEnd.getDate() : endDate.getDate());
  }
}
