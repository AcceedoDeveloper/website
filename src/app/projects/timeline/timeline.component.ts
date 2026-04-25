import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
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
  status: TaskStatus;
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

interface TimelineMonthSegment {
  label: string;
  left: number;
  width: number;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnChanges, OnDestroy, AfterViewInit {
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
  private viewInitialized = false;
  private initialProjectViewApplied = false;
activeView: 'month' | 'project' = 'month';
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
    status: 'New' as TaskStatus,
    assignee: '',
    startDate: this.getDefaultTaskStartDate() as Date | null,
    endDate: this.getDefaultTaskEndDate() as Date | null
  };

  tasks: TimelineTask[] = [];
  private deletedImportedTaskIds = new Set<string>();
  private importedSubtaskOverrides: Record<string, TimelineSubtask[]> = {};
  private persistTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private yearRollCooldownId: ReturnType<typeof setTimeout> | null = null;
  private lastPersistedManualTasks = '';
  private cachedDisplayTasks: TimelineTask[] = [];
  private cachedProjectOptions: string[] = [];
  private cachedAssigneeOptions: string[] = [];
  private cachedDays: TimelineDay[] = [];
  private cachedMonthSegments: TimelineMonthSegment[] = [];
  private cachedCurrentMonthLabel = '';
  private cachedTodayLineLeft = -100;
  private cachedActiveTaskCount = 0;
  private cachedSubtaskCount = 0;
  private cachedProjectCount = 0;
  totalDays = 0;
  calendarGridTemplate = '';
  calendarMinWidth = '';

  constructor(private cdr: ChangeDetectorRef) {
    this.rebuildCalendarState();
    this.updateComputedState();
  }

  ngOnDestroy(): void {
    this.flushPersistTasks();
    if (this.yearRollCooldownId) {
      clearTimeout(this.yearRollCooldownId);
      this.yearRollCooldownId = null;
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.applyInitialProjectView();
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
    this.rebuildTasksFromInputs();
    this.cachedProjectOptions = Array.from(new Set(this.tasks.map(task => task.projectName).filter(Boolean)));

    if (this.selectedProjectFilter !== 'all' && !this.cachedProjectOptions.includes(this.selectedProjectFilter)) {
      this.selectedProjectFilter = 'all';
    }

    this.syncProjectTitle();
    this.refreshSchedule();
    this.applyInitialProjectView();
  }

  get activeTaskCount(): number {
    return this.cachedActiveTaskCount;
  }

  get subtaskCount(): number {
    return this.cachedSubtaskCount;
  }

  get projectCount(): number {
    return this.cachedProjectCount;
  }

  get currentMonthLabel(): string {
    return this.cachedCurrentMonthLabel;
  }

  get days(): TimelineDay[] {
    return this.cachedDays;
  }

  get monthSegments(): TimelineMonthSegment[] {
    return this.cachedMonthSegments;
  }

  get todayLineLeft(): number {
    return this.cachedTodayLineLeft;
  }

  get displayTasks(): TimelineTask[] {
    return this.cachedDisplayTasks;
  }

  get projectOptions(): string[] {
    return this.cachedProjectOptions;
  }

  get assigneeOptions(): string[] {
    return this.cachedAssigneeOptions;
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
    this.updateComputedState();
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
    this.rebuildCalendarState();
    this.updateComputedState();
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

  this.initialProjectViewApplied = true;
  this.showProjectPanel = false;
  this.showFilterPanel = false;

  this.activeView = 'project'; // ✅ THIS IS IMPORTANT

  this.visibleMonthDate = this.getMonthStart(new Date());
  this.rebuildCalendarState();
  this.updateComputedState();

  setTimeout(() => {
    this.scrollToDate(new Date(), 'auto');
  }, 0);

  this.monthViewClick.emit();
}

  jumpToProjectStart(): void {
    const projectStart = this.getProjectStartDate();
    if (!projectStart) {
      return;
    }

    this.visibleMonthDate = this.getMonthStart(projectStart);
    this.rebuildCalendarState();
    this.updateComputedState();

    setTimeout(() => {
      this.scrollToDate(projectStart);
    }, 0);
  }

  private applyInitialProjectView(): void {
    if (this.initialProjectViewApplied || !this.viewInitialized || !this.tasks.length) {
      return;
    }

    this.initialProjectViewApplied = true;
    this.jumpToProjectStart();
  }

  onTimelineScroll(): void {
    const scroller = this.timelineScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    if (!this.totalDays) {
      return;
    }

    this.syncMonthLabelFromScroll(scroller);
  }

  onTimelineWheel(event: WheelEvent): void {
    const scroller = this.timelineScroller?.nativeElement;
    if (!scroller || !this.totalDays) {
      return;
    }

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) {
      return;
    }

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    if (maxScrollLeft <= 0) {
      return;
    }

    if (this.yearRollCooldownId) {
      return;
    }

    const nextScrollLeft = scroller.scrollLeft + delta;
    const atStart = scroller.scrollLeft <= 0.5;
    const atEnd = scroller.scrollLeft >= maxScrollLeft - 0.5;

    if (this.activeView === 'project' && atStart && nextScrollLeft < 0) {
      event.preventDefault();
      scroller.scrollLeft = 0;
      return;
    }

    if (nextScrollLeft < 0 && atStart) {
      event.preventDefault();
      this.rollTimelineYear(-1, Math.abs(nextScrollLeft));
      return;
    }

    if (this.activeView === 'project' && atEnd && nextScrollLeft > maxScrollLeft) {
      event.preventDefault();
      scroller.scrollLeft = maxScrollLeft;
      return;
    }

    if (nextScrollLeft > maxScrollLeft && atEnd) {
      event.preventDefault();
      this.rollTimelineYear(1, nextScrollLeft - maxScrollLeft);
    }
  }

  clearFilters(): void {
    this.selectProjectFilter('all');
    this.selectedTypeFilter = 'all';
    this.selectedAllocationFilter = 'all';
    this.selectedAssigneeFilter = 'all';
    this.showTodayOnly = false;
    this.updateComputedState();
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
          status: this.newTask.status,
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
      status: this.newSubtask.status,
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
    this.updateComputedState();
  }

  onFiltersChanged(): void {
    this.updateComputedState();
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

  getSubtaskColorClass(subtask: TimelineSubtask): string {
    return subtask.allocation === 'busy' ? 'busy-bar' : 'available-bar';
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

  getTaskTimelineClass(task: TimelineTask): string {
    return `bar-status-${this.getTimelineStatusKey(task.status)}`;
  }

  getSubtaskTimelineClass(subtask: TimelineSubtask): string {
    return `bar-status-${this.getTimelineStatusKey(subtask.status)}`;
  }

  getTaskProgressPercent(task: TimelineTask): number {
    return this.getTimelineProgressPercent(task.status, this.getTaskStartDate(task), this.getTaskEndDate(task));
  }

  getSubtaskProgressPercent(subtask: TimelineSubtask): number {
    return this.getTimelineProgressPercent(subtask.status, this.getSubtaskStartDate(subtask), this.getSubtaskEndDate(subtask));
  }

  getProgressLabel(progressPercent: number): string {
    return `${Math.round(progressPercent)}%`;
  }

  getTaskProgressTextClass(task: TimelineTask): string {
    return this.taskHasConflict(task) ? 'bar-progress-text-dark' : 'bar-progress-text-light';
  }

  getSubtaskProgressTextClass(subtask: TimelineSubtask): string {
    return subtask.allocation === 'busy' ? 'bar-progress-text-dark' : 'bar-progress-text-light';
  }

get isProjectSelected(): boolean {
  return !!(this.selectedProjectId || this.selectedProjectName);
}

  getTaskBarLabelClass(task: TimelineTask): string {
    const placementClass = this.getBarLabelClass(this.getTaskDuration(task), this.totalDays - this.getTaskEndDay(task));
    if (placementClass !== 'bar-label-inside') {
      return placementClass;
    }

    return `${placementClass} ${this.taskHasConflict(task) ? 'bar-label-dark' : 'bar-label-light'}`;
  }

  getSubtaskBarLabelClass(subtask: TimelineSubtask): string {
    const duration = Math.max(1, this.getSubtaskEndDay(subtask) - this.getSubtaskStartDay(subtask) + 1);
    const placementClass = this.getBarLabelClass(duration, this.totalDays - this.getSubtaskEndDay(subtask));
    if (placementClass !== 'bar-label-inside') {
      return placementClass;
    }

    return `${placementClass} ${subtask.allocation === 'busy' ? 'bar-label-dark' : 'bar-label-light'}`;
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
    if (task.status === 'New') {
      return 'rgba(85, 95, 109, 0.12)';
    }

    return this.taskHasConflict(task) ? 'var(--tm-yellow)' : '#12906f';
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
        subtask.status = subtask.status || task.status;

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

    this.schedulePersistTasks();
    this.updateComputedState();
  }

  private rebuildTasks(): void {
    const localManualTasks = this.tasks.filter(task => task.source === 'manual');
    const persistedManualTasks = this.loadPersistedTasks();
    const mappedTimelineTasks = this.buildMappedTimelineTasks();
    this.tasks = [
      ...localManualTasks,
      ...persistedManualTasks.filter(task => !localManualTasks.some(local => local.id === task.id)),
      ...mappedTimelineTasks
    ];
    this.refreshSchedule();
  }

  private rebuildTasksFromInputs(): void {
    const persistedManualTasks = this.loadPersistedTasks();
    this.hasManualEdits = persistedManualTasks.length > 0;
    this.tasks = [...persistedManualTasks, ...this.buildMappedTimelineTasks()];
  }

  private buildMappedTimelineTasks(): TimelineTask[] {
    return this.mapAssignmentsToTasks(this.timelineItems)
      .filter(task => !this.deletedImportedTaskIds.has(String(task.id)))
      .map(task => ({
        ...task,
        subtasks: [...task.subtasks, ...(this.importedSubtaskOverrides[String(task.id)] || [])]
      }));
  }

  private hasConflict(taskId: string | number, subtaskId: string | number, assignee: string, targetSubtask: TimelineSubtask): boolean {
    const parentTask = this.tasks.find(task => task.id === taskId);
    if (!parentTask) {
      return false;
    }

    return parentTask.subtasks.some(subtask => {
      if (subtask.id === subtaskId) {
        return false;
      }

      const overlaps = this.doSubtasksOverlap(targetSubtask, subtask);
      const isLaterSubtask = this.compareSubtaskOrder(targetSubtask, subtask) > 0;
      return overlaps && isLaterSubtask;
    });
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
        status: this.normalizeStatus(subTask.Status || item.Status),
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
      status: this.normalizeStatus(subTask.Status || item.Status),
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
        status: this.normalizeStatus(item.Status),
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
      status: this.normalizeStatus(item.Status),
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

  private getBarLabelClass(durationDays: number, trailingDays: number): string {
    if (trailingDays >= 4) {
      return 'bar-label-outside';
    }

    if (durationDays >= 4) {
      return 'bar-label-inside';
    }

    return 'bar-label-before';
  }

  private getTimelineStatusKey(status: TaskStatus): 'todo' | 'in-progress' | 'done' {
    if (status === 'Completed') {
      return 'done';
    }

    if (status === 'In progress') {
      return 'in-progress';
    }

    return 'todo';
  }

  private getTimelineProgressPercent(status: TaskStatus, startDate: Date | null, endDate: Date | null): number {
    if (status === 'Completed') {
      return 100;
    }

    if (status !== 'In progress' || !startDate || !endDate) {
      return 0;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const progressEnd = today < endDate ? today : endDate;
    if (progressEnd < startDate) {
      return 0;
    }

    if (progressEnd >= endDate) {
      return 100;
    }

    const totalDays = Math.max(1, this.getDateDifference(startDate, endDate));
    const completedDays = Math.max(0, this.getDateDifference(startDate, progressEnd));
    return Math.max(0, Math.min(100, (completedDays / totalDays) * 100));
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
      status: 'New',
      assignee: '',
      startDate: this.getDefaultTaskStartDate() as Date | null,
      endDate: this.getDefaultTaskEndDate() as Date | null
    };
  }

  private buildDays(): TimelineDay[] {
    const today = new Date();
    const visibleStart = this.getVisibleRangeStart();

    return Array.from({ length: this.totalDays }, (_, index) => {
      const date = this.addDays(visibleStart, index);
      return {
        day: date.getDate(),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      };
    });
  }

  private buildMonthSegments(): TimelineMonthSegment[] {
    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    const totalDays = Math.max(1, this.totalDays);

    const segments: TimelineMonthSegment[] = [];
    let current = new Date(visibleStart.getFullYear(), visibleStart.getMonth(), 1);

    while (current <= visibleEnd) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const nextMonthStart = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const segmentStart = monthStart < visibleStart ? visibleStart : monthStart;
      const segmentEnd = nextMonthStart <= visibleEnd ? this.addDays(nextMonthStart, -1) : visibleEnd;
      const leftDays = this.getDateDifference(visibleStart, segmentStart) - 1;
      const widthDays = this.getDateDifference(segmentStart, segmentEnd);
      const monthName = this.months[current.getMonth()] || monthStart.toLocaleString('default', { month: 'long' });

      segments.push({
        label: `${monthName} ${current.getFullYear()}`,
        left: (leftDays / totalDays) * 100,
        width: (widthDays / totalDays) * 100
      });

      current = nextMonthStart;
    }

    return segments;
  }

  private rebuildCalendarState(): void {
    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    this.totalDays = this.getDateDifference(visibleStart, visibleEnd);
    this.calendarGridTemplate = `repeat(${this.totalDays}, minmax(36px, 1fr))`;
    this.calendarMinWidth = `${this.totalDays * 36}px`;
    this.cachedDays = this.buildDays();
    this.cachedMonthSegments = this.buildMonthSegments();

    const monthName =
      this.months[this.visibleMonthDate.getMonth()] ||
      this.visibleMonthDate.toLocaleString('default', { month: 'long' });
    this.cachedCurrentMonthLabel = `${monthName} ${this.visibleMonthDate.getFullYear()}`;

    if (!this.isViewingVisibleYear()) {
      this.cachedTodayLineLeft = -100;
      return;
    }

    const todayIndex = this.getDayOfYear(new Date()) - 1;
    const safeIndex = todayIndex >= 0 ? todayIndex : 0;
    this.cachedTodayLineLeft = ((safeIndex + 0.5) / this.totalDays) * 100;
  }

  private updateComputedState(): void {
    this.rebuildCalendarState();

    const todayDay = this.isViewingVisibleYear() ? this.getDayOfYear(new Date()) : null;
    this.cachedProjectOptions = Array.from(new Set(this.tasks.map(task => task.projectName).filter(Boolean)));

    const visibleTasks = this.tasks
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

        return task.subtasks.length > 0 || this.isTaskInVisibleMonth(task);
      });

    this.cachedDisplayTasks = visibleTasks;
    this.cachedAssigneeOptions = Array.from(
      new Set(
        this.tasks.flatMap(task => this.getVisibleSubtasks(task).map(subtask => subtask.assignee)).filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));
    this.cachedActiveTaskCount = visibleTasks.length;
    this.cachedSubtaskCount = visibleTasks.reduce((count, task) => count + this.getVisibleSubtasks(task).length, 0);
    this.cachedProjectCount = this.cachedProjectOptions.length;
    this.cdr.markForCheck();
  }

  private syncMonthLabelFromScroll(scroller: HTMLDivElement): void {
    const visibleStart = this.getVisibleRangeStart();
    const centerLeft = scroller.scrollLeft + scroller.clientWidth / 2;
    const dayIndex = Math.max(0, Math.min(this.totalDays - 1, Math.round((centerLeft / scroller.scrollWidth) * (this.totalDays - 1))));
    const centeredDate = this.addDays(visibleStart, dayIndex);
    const nextMonthDate = this.getMonthStart(centeredDate);

    if (
      nextMonthDate.getFullYear() === this.visibleMonthDate.getFullYear() &&
      nextMonthDate.getMonth() === this.visibleMonthDate.getMonth()
    ) {
      return;
    }

    this.visibleMonthDate = nextMonthDate;
    this.rebuildCalendarState();
  }

  private rollTimelineYear(direction: 1 | -1, overflowPx: number): void {
    if (this.yearRollCooldownId) {
      return;
    }

    this.yearRollCooldownId = setTimeout(() => {
      this.yearRollCooldownId = null;
    }, 120);

    const currentYear = this.visibleMonthDate.getFullYear();
    const nextYear = currentYear + direction;

    this.visibleMonthDate = new Date(nextYear, direction > 0 ? 0 : 11, 1);
    this.rebuildCalendarState();
    this.updateComputedState();

    requestAnimationFrame(() => {
      const scroller = this.timelineScroller?.nativeElement;
      if (scroller) {
        const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
        const nextScrollLeft = direction > 0
          ? Math.min(overflowPx, maxScrollLeft)
          : Math.max(0, maxScrollLeft - overflowPx);

        scroller.scrollLeft = nextScrollLeft;
      }
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

  private scrollToDate(date: Date, behavior: ScrollBehavior = 'smooth'): void {
    const scroller = this.timelineScroller?.nativeElement;
    if (!scroller || !this.totalDays) {
      return;
    }

    const dayIndex = Math.min(
      this.totalDays - 1,
      Math.max(0, this.getDateDifference(this.getVisibleRangeStart(), date) - 1)
    );
    const targetLeft = ((dayIndex + 0.5) / this.totalDays) * scroller.scrollWidth - scroller.clientWidth / 2;
    scroller.scrollTo({
      left: Math.max(0, targetLeft),
      behavior
    });
  }

onTaskClick(task: TimelineTask): void {
    this.scrollToTask(task);
  const startDate = this.getTaskStartDate(task);
  if (!startDate) return;

  const middleDate = this.getMiddleOfMonth(startDate);

  // scroll first
  setTimeout(() => {
    this.scrollToDate(middleDate, 'smooth');

    // then highlight that bar
    setTimeout(() => {
      this.highlightTaskBar(task.id);
    }, 300); // wait for scroll
  }, 0);
}

highlightTaskBar(taskId: string | number): void {
  // remove old highlight
  document.querySelectorAll('.task-bar').forEach(el => {
    el.classList.remove('active-task');
  });

  // add highlight to clicked one
  const el = document.getElementById('task-bar-' + taskId);

  if (el) {
    el.classList.add('active-task');

    // auto remove after animation
    setTimeout(() => {
      el.classList.remove('active-task');
    }, 1500);
  }
}
focusTaskId: string | number | null = null;

triggerFocusAnimation(taskId: string | number): void {
  this.focusTaskId = taskId;

  setTimeout(() => {
    this.focusTaskId = null; // remove animation after effect
  }, 600);
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
    const serializedManualTasks = JSON.stringify(manualTasks);
    if (serializedManualTasks === this.lastPersistedManualTasks) {
      return;
    }

    localStorage.setItem(this.getStorageKey(), serializedManualTasks);
    this.lastPersistedManualTasks = serializedManualTasks;
  }

  private loadPersistedTasks(): TimelineTask[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (!raw) {
        this.lastPersistedManualTasks = '[]';
        return [];
      }

      const parsed = JSON.parse(raw) as TimelineTask[];
      if (!Array.isArray(parsed)) {
        this.lastPersistedManualTasks = '[]';
        return [];
      }

      this.lastPersistedManualTasks = raw;
      return parsed.filter(task => task?.source === 'manual');
    } catch {
      this.lastPersistedManualTasks = '[]';
      return [];
    }
  }

  private schedulePersistTasks(): void {
    if (this.persistTimeoutId) {
      clearTimeout(this.persistTimeoutId);
    }

    this.persistTimeoutId = setTimeout(() => {
      this.persistTimeoutId = null;
      this.persistTasks();
    }, 150);
  }

  private flushPersistTasks(): void {
    if (this.persistTimeoutId) {
      clearTimeout(this.persistTimeoutId);
      this.persistTimeoutId = null;
      this.persistTasks();
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

  private getProjectStartDate(): Date | null {
    const selectedProject = this.selectedProjectFilter !== 'all'
      ? this.selectedProjectFilter
      : this.selectedProjectName?.trim();

    const relevantTasks = selectedProject
      ? this.tasks.filter(task => task.projectName === selectedProject)
      : this.tasks;

    const taskDates = relevantTasks.flatMap(task => {
      const dates = [this.getTaskStartDate(task), ...task.subtasks.map(subtask => this.getSubtaskStartDate(subtask))];
      return dates.filter((date): date is Date => !!date);
    });

    if (!taskDates.length) {
      return null;
    }

    return taskDates.reduce((earliest, current) => (current < earliest ? current : earliest));
  }

  private getProjectEndDate(): Date | null {
    const selectedProject = this.selectedProjectFilter !== 'all'
      ? this.selectedProjectFilter
      : this.selectedProjectName?.trim();

    const relevantTasks = selectedProject
      ? this.tasks.filter(task => task.projectName === selectedProject)
      : this.tasks;

    const taskDates = relevantTasks.flatMap(task => {
      const dates = [this.getTaskEndDate(task), ...task.subtasks.map(subtask => this.getSubtaskEndDate(subtask))];
      return dates.filter((date): date is Date => !!date);
    });

    if (!taskDates.length) {
      return null;
    }

    return taskDates.reduce((latest, current) => (current > latest ? current : latest));
  }

  private getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private getVisibleRangeStart(): Date {
    if (this.activeView === 'project') {
      const projectStart = this.getProjectStartDate();
      if (projectStart) {
        return projectStart;
      }
    }

    return new Date(this.visibleMonthDate.getFullYear(), 0, 1);
  }

  private getVisibleRangeEnd(): Date {
    if (this.activeView === 'project') {
      const projectEnd = this.getProjectEndDate();
      if (projectEnd) {
        return new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate());
      }
    }

    return new Date(this.visibleMonthDate.getFullYear(), 11, 31);
  }

  private getDayOfYear(date: Date): number {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return this.getDateDifference(yearStart, date);
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private isViewingVisibleYear(): boolean {
    const today = new Date();
    return this.visibleMonthDate.getFullYear() === today.getFullYear();
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

    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    return startDate <= visibleEnd && endDate >= visibleStart;
  }

  private isTaskInVisibleMonth(task: TimelineTask): boolean {
    const startDate = this.getTaskStartDate(task);
    const endDate = this.getTaskEndDate(task);
    if (!startDate || !endDate) {
      return false;
    }

    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    return startDate <= visibleEnd && endDate >= visibleStart;
  }

  private resolveVisibleDay(startDate: Date, endDate: Date, fallbackDay = 1): number {
    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    if (startDate > visibleEnd) {
      return this.clampDay(fallbackDay);
    }

    if (startDate < visibleStart) {
      return 1;
    }

    return this.clampDay(this.getDateDifference(visibleStart, startDate));
  }

  private resolveVisibleEndDay(startDate: Date, endDate: Date): number {
    const visibleStart = this.getVisibleRangeStart();
    const visibleEnd = this.getVisibleRangeEnd();
    if (endDate < visibleStart) {
      return 1;
    }

    if (endDate > visibleEnd) {
      return this.totalDays;
    }

    return this.clampDay(this.getDateDifference(visibleStart, endDate));
  }

goToPreviousMonth(event?: Event): void {
  event?.stopPropagation();

  const prevMonth = new Date(
    this.visibleMonthDate.getFullYear(),
    this.visibleMonthDate.getMonth() - 1,
    1
  );

  if (this.activeView === 'project') {
    const projectStart = this.getProjectStartDate();
    if (projectStart) {
      const earliestMonth = this.getMonthStart(projectStart);
      if (prevMonth < earliestMonth) {
        return;
      }
    }
  }

  this.visibleMonthDate = prevMonth;
  this.rebuildCalendarState();
  this.updateComputedState();

  const middleDate = this.getMiddleOfMonth(prevMonth);

  setTimeout(() => {
    this.scrollToDate(middleDate, 'smooth');
  }, 100);
}

goToNextMonth(event?: Event): void {
  event?.stopPropagation();

  const nextMonth = new Date(
    this.visibleMonthDate.getFullYear(),
    this.visibleMonthDate.getMonth() + 1,
    1
  );

  this.visibleMonthDate = nextMonth;
  this.rebuildCalendarState();
  this.updateComputedState();

  const middleDate = this.getMiddleOfMonth(nextMonth);

  setTimeout(() => {
    this.scrollToDate(middleDate, 'smooth');
  }, 100);
}

private shiftTimelineByDays(dayDelta: number, directionLabel: 'previous' | 'next'): void {
  const movedDate = this.addDays(this.visibleMonthDate, dayDelta);

  // ✅ Convert to middle of that month
  const targetDate = this.getMiddleOfMonth(movedDate);

  this.visibleMonthDate = targetDate;
  this.rebuildCalendarState();
  this.updateComputedState();

  setTimeout(() => {
    this.scrollToDate(targetDate, 'smooth');
  }, 100);
}
getMiddleOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const middleDay = Math.floor(daysInMonth / 2);

  return new Date(year, month, middleDay);
}

scrollToTask(task: TimelineTask): void {
  this.selectedTaskId = task.id;

  const startDate = this.getTaskStartDate(task);
  if (!startDate) return;

  const middleDate = this.getMiddleOfMonth(startDate);

  setTimeout(() => {
    this.scrollToDate(middleDate, 'smooth');
  }, 0);
}
emitProjectView(): void {
  if (!this.isProjectSelected) {
    return;
  }

  this.showTodayOnly = false;
  this.showProjectPanel = false;
  this.showFilterPanel = false;
  this.activeView = 'project';

  const selectedProjectName = this.selectedProjectName?.trim();
  if (selectedProjectName) {
    this.selectProjectFilter(selectedProjectName);
  }

  this.jumpToProjectStart();
}

onProjectSelect(project: any) {
  this.selectedProjectId = project.id;
  this.selectedProjectName = project.name;

  this.cdr.detectChanges(); // OnPush fix 🔥
}


}
