import { Component, OnInit, ViewChild, TemplateRef, OnDestroy, ElementRef, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { catchError, debounceTime, finalize, of, Subject, Subscription, switchMap, timeout } from 'rxjs';
import { CreatprojectService } from '../service/creatproject.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { UserservicesService } from '../register/services/userservices.service';
import { ConfigService } from '../service/config.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { DateUtilsService } from '../service/date-utils.service';
import { AssignmentDeleteConfirmationDialogComponent } from './assignment-delete-confirmation-dialog.component';
import { TimelineComponent } from './timeline/timeline.component';
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
interface Document {
  _id: string;
  title: string;
  files: string[];
}

interface User {
  name: string;
  photo?: string;
}
@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, OnDestroy, AfterViewInit {
cancelEdit: any;
isLoading = false;
isDeleting = false;
showtask = true;
datefiltersection = true;
showmaintask = true;
Documents = false;
Calendar = false;
Summary = false;
compare = false;
TimeLine = false;
showdocumentpop = false;

// Timeline data
timelineItems: AssignWork[] = [];

currentDate!: string;
currentTime!: string;


todayDay = new Date().getDate();  
todayMonth = new Date().getMonth();
todayYear = new Date().getFullYear();
  selectedDay: number = 1;

  safePdfUrl: SafeResourceUrl | null = null;
 filteredTitles: string[] = []; 
  allTitles: string[] = []; 
  
  editingDocument: Document | null = null;
  documentForm: FormGroup;
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  searchTerm: string = '';
  selectedFile: File | null = null;
  uploadedPictures: string[] = [];
  selectedPictureFiles: File[] = [];
   users: User[] = [];




  // User View
  showinuserview = false;


 currentPage:string = 'task';
  userViewAssignments: AssignWork[] = [];
  

  // PDF
  loadError: { [key: string]: boolean } = {}; 
  isPdfLoaded: { [key: string]: boolean } = {}; 

  userData: any = null;
  username = '';
  displayName = 'User';
  dateTime: string = new Date().toLocaleString();


openCompare() {
  this.compare = true;
}


closeCompare() {
  this.compare = false;
}
 
  projects: any[] = [];
  allProjects: any[] = [];

selectedProjectId: string = '';
selectedProjectName: string = '';
selectedProjectTeamLeads: string[] = [];


  allAssignments: AssignWork[] = [];
  todoAssignments: AssignWork[] = [];
  inProgressAssignments: AssignWork[] = [];
  doneAssignments: AssignWork[] = [];


  assignmentForm!: FormGroup;
  commentForm!: FormGroup;


  editingTask: AssignWork | null = null;
  selectedTask: AssignWork | null = null;
  @ViewChild('assignmentDialog') assignmentDialog!: TemplateRef<any>;
  @ViewChild(TimelineComponent) timelineComponent?: TimelineComponent;


  employees: any[] = [];
  loading = false;
  error = '';
  successMessage = '';
  months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  days: any[] = [];
  selectedTaskDate: string = '';
  private subs = new Subscription();
  private assignmentsReload$ = new Subject<boolean>();
  private assignmentsLoadedOnce = false;
  private dateIntervalId: any = null;
  searchQuery: any;
  isDragActive: any;
  constructor(
  private projectService: CreatprojectService,
  private assignworkService: AssignWorkService,
  private userService: UserservicesService,
  private configService: ConfigService,
  private fb: FormBuilder,
  private dialog: MatDialog,
  private snackBar: MatSnackBar,
  private http: HttpClient,
  private sanitizer: DomSanitizer,
  private dateUtils: DateUtilsService,
  private cd: ChangeDetectorRef
) {
  this.documentForm = this.fb.group({
    title: ['', Validators.required],
    file: [null]
  });
}


private addCacheBuster(url: string, timestamp: number): string {
  return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
}

private processUserImage(user: any): void {
  const timestamp = new Date().getTime();

  const photoField =
    user.photo ||
    user.photoURL ||
    user.imagePath ||
    user.image ||
    user.avatar;

  if (photoField) {
    const baseUrl = 'http://localhost:3008/uploads/';

    if (photoField.startsWith('http')) {
      user.photoURL = this.addCacheBuster(photoField, timestamp);
    } else if (photoField.startsWith('/')) {
      user.photoURL = this.addCacheBuster('http://localhost:3008' + photoField, timestamp);
    } else {
      user.photoURL = this.addCacheBuster(baseUrl + photoField, timestamp);
    }

    console.log('Constructed photo URL:', user.photoURL);
  } else {
    user.photoURL = '';
  }
}
private loadEmployees() {
  const s = this.userService.getuser().subscribe({
    next: (res: any) => {
      if (Array.isArray(res)) {
        this.employees = res;
      } else if (res?.data && Array.isArray(res.data)) {
        this.employees = res.data;
      } else if (res?.users && Array.isArray(res.users)) {
        this.employees = res.users;
      } else {
        this.employees = [];
      }

      this.employees.forEach((emp: any) => this.processUserImage(emp));

      console.log('employees after image processing:', this.employees);
    },
    error: () => {
      this.employees = [];
    }
  });

  this.subs.add(s);
}
getUserPhoto(name: string): string {
  if (!name || !this.employees || this.employees.length === 0) {
    return '';
  }

  const normalizedTaskName = String(name).trim().toLowerCase();

  const user = this.employees.find((u: any) => {
    const username = String(u.username || '').trim().toLowerCase();
    const userName = String(u.UserName || '').trim().toLowerCase();
    const fullName = String(u.name || '').trim().toLowerCase();
    const displayName = String(u.displayName || '').trim().toLowerCase();

    return (
      normalizedTaskName === username ||
      normalizedTaskName === userName ||
      normalizedTaskName === fullName ||
      normalizedTaskName === displayName
    );
  });

  if (!user) {
    return '';
  }

  return user.photoURL || '';
}

    getInitials(name: string): string {
    if (!name) return '';

    const words = name.trim().split(' ').filter(w => w.length > 0);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  

  ngOnInit(): void {
    this.setupAssignmentsStream();
    this.loadProjects();
    this.initForm();
    this.initCommentForm();
    this.getCurrentUser();
    this.loadUserFromSession();
    this.loadEmployees();
    this.updateDateTime();
    this.isAdmin();
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.generateCalendar();
    this.getDocuments();
    const today = new Date();
    this.selectedTaskDate = this.getTodayDateString();
    console.log('Initialized selectedTaskDate with current date:', this.selectedTaskDate);
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);

    this.generateCalendar();

    // Load all projects for admin dropdown
    if (this.isAdmin()) {
      this.loadAllProjects();
    }
   
  }

  ngOnDestroy(): void {
    if (this.dateIntervalId) {
      clearInterval(this.dateIntervalId);
      this.dateIntervalId = null;
    }
    this.subs.unsubscribe();
  }
  

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
  onTaskDateChange() {
    this.applyDateFilter();
  }

  

  clearDateFilter() {
    this.selectedTaskDate = '';
    this.applyDateFilter();
  }

  applyDateFilter() {
    console.log('Applying date filter for date:', this.selectedTaskDate);
    console.log('Total assignments before filter:', this.allAssignments.length);
    
    this.todoAssignments = this.getFilteredTasksByStatus('ToDo');
    this.inProgressAssignments = this.getFilteredTasksByStatus('InProgress');
    this.doneAssignments = this.getFilteredTasksByStatus('Done');

    // Keep timeline in sync with selected date/project
    this.updateTimelineItems();
    
    console.log('Filtered tasks - ToDo:', this.todoAssignments.length);
    console.log('Filtered tasks - InProgress:', this.inProgressAssignments.length);
    console.log('Filtered tasks - Done:', this.doneAssignments.length);
    console.log('Filtered tasks - Timeline:', this.timelineItems.length);
  }

 getFilteredTasksByStatus(status: string): AssignWork[] {

  let tasks = [...this.allAssignments];


  /* PROJECT / USER FILTER */

  if (this.selectedProjectId) {

    tasks = tasks.filter(a =>
      String(a.projectId) === String(this.selectedProjectId) ||
      String(a.projectName || '').toLowerCase() ===
      String(this.selectedProjectName || '').toLowerCase()
    );

    if (!this.isAdmin()) {
      tasks = tasks.filter(task => this.isTaskVisibleToCurrentUser(task));
    }

  }
  else {

    tasks = tasks.filter(task => this.isTaskVisibleToCurrentUser(task));

  }



   if (this.selectedTaskDate && status.toLowerCase() === 'todo') {

    const selectedDate = new Date(this.selectedTaskDate);

    selectedDate.setHours(0,0,0,0);


    tasks = tasks.filter(task => {

      if (!task.createdAt) return true;

      const createdDate = new Date(task.createdAt);

      createdDate.setHours(0,0,0,0);


      // ✅ PROFESSIONAL FIX

      return createdDate.getTime() <= selectedDate.getTime();

    });

  }




  /* STATUS FILTER */

  return tasks.filter(task => {

    const taskStatus = (task.Status || 'ToDo').toLowerCase().trim();

    if (status.toLowerCase() === 'inprogress') {

      return taskStatus.includes('progress');

    }

    if (status.toLowerCase() === 'done') {

      return taskStatus.includes('done') ||
             taskStatus.includes('complete');

    }

    return !taskStatus.includes('progress') &&
           !taskStatus.includes('done');

  });

}

getDueLabel(task: AssignWork): string {
  if (!task?.dueDate) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due Today';
  if (diffDays === 1) return 'Due Tomorrow';

  return `Due in ${diffDays} days`;
}

private getTaskDateOnly(value: string | Date | undefined | null): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

getTaskDurationLabel(task: AssignWork): string {
  const startDate = this.getTaskDateOnly(task?.startDate);
  const endDate = this.getTaskDateOnly(task?.dueDate);

  if (startDate && endDate) {
    const diffInDays = Math.max(
      1,
      Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    return `${diffInDays} Day${diffInDays > 1 ? 's' : ''}`;
  }

  if (startDate) {
    const today = this.getTaskDateOnly(new Date());
    const elapsedDays = today
      ? Math.max(
          1,
          Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        )
      : 1;

    return `${elapsedDays} Day${elapsedDays > 1 ? 's' : ''}`;
  }

  return 'Days';
}

loadProjects(): void {
  const userStr = sessionStorage.getItem('user');

  if (!userStr) {
    console.error('No user found in sessionStorage');
    return;
  }

  const user = JSON.parse(userStr);
  const userName = user.UserName || user.username || user.name || '';

  this.projectService.getProjects().subscribe({
    next: (res: any[]) => {
      console.log("All Projects:", res);

      // 🔥 Filter projects where user is in employees
      this.projects = this.isAdmin()
        ? res
        : res.filter(project =>
            this.isUserInProjectList(project?.employees, userName) ||
            this.isUserInProjectList(project?.teamLeads, userName)
          );

      console.log('Filtered Projects:', this.projects);

      if (this.projects.length > 0) {
  this.selectedProjectId = this.projects[0]._id; // first project
} else {
  this.selectedProjectId = ''; // fallback to "All Projects"
}




      this.onProjectSelect();
      this.cd.detectChanges();
    },
    error: (err) => {
      console.error("Error loading projects:", err);
    }
  });
}

private getPersonName(person: any): string {
  return String(
    person?.username ||
    person?.UserName ||
    person?.name ||
    person?.displayName ||
    person ||
    ''
  ).toLowerCase().trim();
}

private isUserInProjectList(list: any, userName: string): boolean {
  if (!list) {
    return false;
  }

  const currentUser = this.getPersonName(userName);
  const members = Array.isArray(list) ? list : [list];

  return members.some(member => this.getPersonName(member) === currentUser);
}

private isTaskAssignedToCurrentUser(task: AssignWork): boolean {
  const currentUser = this.getPersonName(
    this.username ||
    this.userData?.UserName ||
    this.userData?.username ||
    ''
  );

  return (
    this.getPersonName(task?.assignedTo) === currentUser ||
    this.getPersonName(task?.assignee) === currentUser
  );
}

private isTaskVisibleToCurrentUser(task: AssignWork): boolean {
  return (
    this.isTaskAssignedToCurrentUser(task) ||
    this.isCurrentUserTeamLeadForTask(task)
  );
}

private isCurrentUserTeamLeadForTask(task: AssignWork): boolean {
  const currentUser =
    this.username ||
    this.userData?.UserName ||
    this.userData?.username ||
    '';

  if (!currentUser) {
    return false;
  }

  const taskProjectId = String(task?.projectId || '').trim();
  const taskProjectName = String(task?.projectName || '').trim().toLowerCase();

  const taskBelongsToSelectedProject =
    !!this.selectedProjectId &&
    (
      String(this.selectedProjectId) === taskProjectId ||
      String(this.selectedProjectName || '').trim().toLowerCase() === taskProjectName
    );

  if (taskBelongsToSelectedProject && this.isUserInProjectList(this.selectedProjectTeamLeads, currentUser)) {
    return true;
  }

  const taskProject = this.projects.find(project => {
    const projectId = String(project?._id || project?.id || '').trim();
    const projectName = String(project?.projectName || project?.name || '').trim().toLowerCase();

    return (
      (!!taskProjectId && projectId === taskProjectId) ||
      (!!taskProjectName && projectName === taskProjectName)
    );
  });

  return this.isUserInProjectList(taskProject?.teamLeads, currentUser);
}

isTaskCreatedByCurrentUser(task: AssignWork): boolean {
  const currentUser = this.getPersonName(
    this.username ||
    this.userData?.UserName ||
    this.userData?.username ||
    ''
  );

  return this.getPersonName(task?.assignedTo) === currentUser;
}

getTaskCreatorLabel(task: AssignWork): string {
  if (this.isTaskCreatedByCurrentUser(task)) {
    return this.isCurrentUserTeamLead() ? 'TL' : 'Admin';
  }
 return this.isTaskCreatedByTeamLead(task) ? 'TL' : 'Admin';
}

isTaskCreatedByTeamLead(task: AssignWork): boolean {
  const creator = String(task?.assignedTo || '').toLowerCase().trim();

  return this.selectedProjectTeamLeads.some((lead: any) => {
    const leadName = String(
      lead?.username ||
      lead?.UserName ||
      lead?.name ||
      lead
    ).toLowerCase().trim();

    return leadName === creator;
  });
}

trackById(index: number, project: any): string {
  return project._id || project.id || index;
}

  getFilteredTasksCount(): number {
    if (!this.selectedTaskDate) return this.allAssignments.length;

    const selectedDate = new Date(this.selectedTaskDate);
    selectedDate.setHours(0, 0, 0, 0);

    return this.allAssignments.filter(task => {
      if (!task.createdAt) return false;

      const taskCreatedDate = new Date(task.createdAt);
      taskCreatedDate.setHours(0, 0, 0, 0);

      return taskCreatedDate.getTime() === selectedDate.getTime();
    }).length;
  }
isDueToday(task: AssignWork): boolean {
  if (!task?.dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  return due.getTime() === today.getTime();
}

getDueText(task: AssignWork): string {
  if (!task?.dueDate) return 'No due date';

  if (this.isOverdue(task)) return 'Overdue';
  if (this.isDueToday(task)) return 'Due Today';

  return `Due ${new Date(task.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })}`;
}

 isOverdue(task: AssignWork): boolean {
  if (!task?.dueDate) return false;

  const status = (task.Status || '').toLowerCase();
  if (status.includes('done') || status.includes('complete')) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}



 private updateDateTime() {
    this.dateIntervalId = setInterval(() => {
      const now = new Date();

      this.currentDate = now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      this.currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }, 1000);
  }

  onDayChange() {
  this.generateDays();
}

onMonthChange() {
  this.generateDays();
}

onYearChange() {
  this.generateDays();
}

generateDays() {
  const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
  this.days = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateObj = new Date(this.selectedYear, this.selectedMonth, d);
    const isSunday = dateObj.getDay() === 0;
    const isHoliday = (this.selectedMonth === 8 && d === 25);

    this.days.push({ date: d, isSunday, isHoliday });
  }

  if (!this.selectedDay || this.selectedDay > lastDay) {
    this.selectedDay = this.todayDay <= lastDay ? this.todayDay : 1;
  }

}



changeDate(days: number) {
  const currentDate = new Date(this.selectedTaskDate);
  currentDate.setDate(currentDate.getDate() + days);

  this.selectedTaskDate = this.formatDate(currentDate);
  this.onDateChange();
}

formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // yyyy-mm-dd
}

onDateChange(): void {

  console.log("Date Changed:", this.selectedTaskDate);

  // force Angular to update view
  this.todoAssignments = this.getFilteredTasksByStatus('todo');
  this.inProgressAssignments = this.getFilteredTasksByStatus('InProgress');
  this.doneAssignments = this.getFilteredTasksByStatus('Done');

  // keep timeline in sync
  this.updateTimelineItems();

  this.cd.detectChanges();

}

  // Move to previous day
  prevDay() {
    const date = new Date(this.selectedTaskDate);
    date.setDate(date.getDate() - 1);
    this.selectedTaskDate = this.formatDate(date);
    this.onDateChange();
  }

  // Move to next day
  nextDay() {
    const date = new Date(this.selectedTaskDate);
    date.setDate(date.getDate() + 1);
    this.selectedTaskDate = this.formatDate(date);
    this.onDateChange();
  }

  // Format date as yyyy-MM-dd for <input type="date">
  
// Method to get today's date in YYYY-MM-DD format
getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


  private initForm() {
    this.assignmentForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      assignedTo: ['', Validators.required],
      assignee: ['', Validators.required],
      startDate: [''],
      dueDate: ['', Validators.required],
      Status: ['ToDo'],
      projectId: [''],
      projectName: [''],
      subTask: this.fb.array([this.createSubTaskGroup()])
    });
  }

  get subTaskArray(): FormArray {
    return this.assignmentForm.get('subTask') as FormArray;
  }

  private createSubTaskGroup(subTask?: any): FormGroup {
    return this.fb.group({
      title: [subTask?.title || ''],
      description: [subTask?.description || ''],
      StartDate: [this.normalizeDateInputValue(subTask?.StartDate)],
      EndDate: [this.normalizeDateInputValue(subTask?.EndDate)],
      assignedTo: [subTask?.assignedTo || this.username || ''],
      assignee: [subTask?.assignee || ''],
      Status: [subTask?.Status || 'ToDo'],
      NoOfDays: [subTask?.NoOfDays || '']
    });
  }

  private normalizeDateInputValue(value: any): string {
    if (!value) {
      return '';
    }

    try {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  addSubTaskRow(): void {
    this.subTaskArray.push(this.createSubTaskGroup());
  }

  removeSubTaskRow(index: number): void {
    if (this.subTaskArray.length === 1) {
      this.subTaskArray.at(0).reset({
        title: '',
        description: '',
        StartDate: '',
        EndDate: '',
        assignedTo: this.username || '',
        assignee: '',
        Status: 'ToDo',
        NoOfDays: ''
      });
      return;
    }

    this.subTaskArray.removeAt(index);
  }

  private initCommentForm() {
    this.commentForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

 private loadUserFromSession() {
  const userStr = sessionStorage.getItem('user');

  if (userStr) {
    try {
      this.userData = JSON.parse(userStr);
    } catch {
      this.userData = { UserName: userStr };
    }
  } else {
    const usernameOnly = sessionStorage.getItem('username');
    this.userData = usernameOnly ? { UserName: usernameOnly } : { UserName: 'User' };
  }

  this.displayName = this.userData?.UserName || this.userData?.username || 'User';
  this.username = this.displayName;

  if (this.userData.photo) {
    this.userData.photoURL = this.userData.photo.startsWith('http')
      ? this.userData.photo
      : this.configService.getUploadUrl(this.userData.photo);
  } else {
    // this.userData.photoURL = 'assets/default-avatar.png';
  }

  const img = new Image();
  img.src = this.userData.photoURL;
  img.onload = () => {
    this.userData.photoURL = this.userData.photoURL + '?t=' + new Date().getTime();
    try {
      this.cd.detectChanges();
    } catch (e) {
      // View may already be destroyed or not yet initialized
    }
  };
  // img.onerror = () => {
  //   this.userData.photoURL = 'assets/default-avatar.png';
  //   try {
  //     this.cd.detectChanges();
  //   } catch (e) {
  //     // View may already be destroyed or not yet initialized
  //   }
  // };

  if (this.assignmentForm && this.username && this.username !== 'User') {
    this.assignmentForm.patchValue({ assignedTo: this.username });
  }
  if (this.username && this.username !== 'User') {
    // when the component first loads we already call loadProjects() in ngOnInit.
    // fetchProjectsByEmployee was overwriting that list with a user-specific
    // array (often empty).  comment it out unless you really want the
    // dropdown restricted to the current user.
    // this.fetchProjectsByEmployee(this.username);

    this.getAssignments();
  }
}
  // private loadEmployees() {
  //   const s = this.userService.getuser().subscribe({
  //     next: (res: any) => {
  //       if (Array.isArray(res)) {
  //         this.employees = res;
  //       } else if (res?.data && Array.isArray(res.data)) {
  //         this.employees = res.data;
  //       } else if (res?.users && Array.isArray(res.users)) {
  //         this.employees = res.users;
  //       } else {
  //         this.employees = [];
  //       }
  //     },
  //     error: () => {
  //       this.employees = [];
  //     }
  //   });
  //   this.subs.add(s);
  // }

    getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      if (this.userData.photo) {
        if (this.userData.photo.startsWith('http')) {
          this.userData.photoURL = this.userData.photo;
        } else {
          this.userData.photoURL = this.configService.getUploadUrl(this.userData.photo);
        }
      } else {
        // this.userData.photoURL = 'assets/default-avatar.png';
      }
    }
  }

  getEmployeeValue(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || '';
  }

  getEmployeeDisplay(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || emp.email || '';
  }

  onStartDateChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value; // yyyy-mm-dd
  console.log('----- START DATE CHANGE EVENT -----');
  console.log('Selected Date from input:', value);
  this.assignmentForm.get('startDate')?.setValue(value, { emitEvent: true });
  console.log('Form Control startDate value after set:', this.assignmentForm.get('startDate')?.value);
  console.log('Entire Form Value:', this.assignmentForm.value);
  console.log('-----------------------------------');
}

// Load ALL projects (for admin project selector in dialog)
  // private loadAllProjects() {
  //   const s = this.projectService.getProjects().subscribe({
  //     next: (res: any) => {
  //       if (Array.isArray(res)) {
  //         this.allProjects = res;
  //       } else if (res?.data && Array.isArray(res.data)) {
  //         this.allProjects = res.data;
  //       } else if (res?.projects && Array.isArray(res.projects)) {
  //         this.allProjects = res.projects;
  //       } else {
  //       this.allProjects = [];
  //       }
  //     },
  //     error: () => {
  //       this.projects = [];
  //       this.loadProjects();
  //     }
  //   });
  //   this.subs.add(s);
  // }

// Handle project selection inside the dialog (for admin)
  // onDialogProjectSelect() {
  //   const selectedId = this.assignmentForm.get('projectId')?.value;
  //   if (!selectedId) {
  //     this.assignmentForm.patchValue({ projectName: '' });
  //     return;
  //   }

  //   const projectList = this.allProjects.length > 0 ? this.allProjects : this.projects;
  //   const selectedProject = projectList.find(p =>
  //     String(p._id) === String(selectedId) ||
  //     String(p.id) === String(selectedId)
  //   );

  //   if (selectedProject) {
  //     const name = selectedProject.projectName || selectedProject.name || '';
  //     this.assignmentForm.patchValue({ projectName: name });
  //   }
  // }

  // Load ALL projects (for admin project selector in dialog)
  private loadAllProjects() {
    const s = this.projectService.getProjects().subscribe({
      next: (res: any) => {
      if (Array.isArray(res)) {
          this.allProjects = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.allProjects = res.data;
        } else if (res?.projects && Array.isArray(res.projects)) {
          this.allProjects = res.projects;
        } else {
          this.allProjects = [];
        }
      },
      error: () => {
        this.allProjects = [];
      }
    });
    this.subs.add(s);
  }

  // Handle project selection inside the dialog (for admin)
  onDialogProjectSelect() {
    const selectedId = this.assignmentForm.get('projectId')?.value;
    if (!selectedId) {
      this.assignmentForm.patchValue({ projectName: '' });
      return;
    }

    const projectList = this.allProjects.length > 0 ? this.allProjects : this.projects;
    const selectedProject = projectList.find(p =>
      String(p._id) === String(selectedId) ||
      String(p.id) === String(selectedId)
    );

    if (selectedProject) {
      const name = selectedProject.projectName || selectedProject.name || '';
      this.assignmentForm.patchValue({ projectName: name });
    }
  }

  /**
   * Load projects that are assigned to a particular user.  If the
   * employee-specific call returns an empty array we fall back to
   * loading *all* projects so that the dropdown never stays blank.
   */
  fetchProjectsByEmployee(userName: string) {
    const s = this.projectService.getProjectsByEmployee(userName).subscribe({
      next: (res: any) => {
        const arr = this._normalizeProjectsResponse(res);

        if (arr.length === 0) {
          console.warn('No projects returned for user', userName, ', loading all projects instead');
          this.loadProjects();
        } else {
          this.projects = arr;
          this.onProjectSelect(); // update selection info if necessary
        }
      },
      error: () => {
        console.warn('Error fetching projects by employee, loading all projects');
        this.projects = [];
        this.loadProjects();
      }
    });
    this.subs.add(s);
  }

  /**
   * Convert various shapes of response into a plain project array.
   */
  private _normalizeProjectsResponse(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.projects && Array.isArray(res.projects)) return res.projects;
    return [];
  }



  onProjectSelect(projectId?: string): void {
    const resolvedProjectId =
      projectId !== undefined ? String(projectId) : String(this.selectedProjectId || '');

    this.selectedProjectId = resolvedProjectId;

    if (!resolvedProjectId) {
      this.selectedProjectName = '';
      this.selectedProjectTeamLeads = [];
      this.filterAssignmentsByProject();
      return;
    }

    const selectedProject = this.projects.find(project =>
      String(project._id || project.id || '') === resolvedProjectId
    );

    this.selectedProjectName =
      selectedProject?.projectName ||
      selectedProject?.name ||
      '';

    this.selectedProjectTeamLeads =
      selectedProject?.teamLeads || [];

    console.log("Selected ID:", this.selectedProjectId);
    console.log("Selected Name:", this.selectedProjectName);

    this.filterAssignmentsByProject();
  }

  isCurrentUserTeamLead(): boolean {

  if (!this.selectedProjectTeamLeads || this.selectedProjectTeamLeads.length === 0) {
    return false;
  }

  const currentUser =
    this.username ||
    this.userData?.UserName ||
    this.userData?.username ||
    '';

  return this.isUserInProjectList(this.selectedProjectTeamLeads, currentUser);
}

  onPictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.selectedPictureFiles.push(file);
      });
    }
  }

  getImageUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.configService.getUploadsUrl()}${path.replace(/\\/g, '/')}`;
  }

  removePicture(index: number) {
    this.uploadedPictures.splice(index, 1);
  }

  removeImage(index: number) {
    this.uploadedPictures.splice(index, 1);
  }

  viewImage(path: string) {
    const url = this.getImageUrl(path);
    console.log( "url", url);
    window.open(url, '_blank');
  }

  getAssignments(forceReload = false): void {
    this.assignmentsReload$.next(forceReload);
  }

  private filterAssignmentsByProject() {
    this.todoAssignments = this.getFilteredTasksByStatus('ToDo');
    this.inProgressAssignments = this.getFilteredTasksByStatus('InProgress');
    this.doneAssignments = this.getFilteredTasksByStatus('Done');

    this.updateTimelineItems();
  }

  private updateTimelineItems() {
    const filtered = [...this.todoAssignments, ...this.inProgressAssignments, ...this.doneAssignments]
      .filter((task, index, tasks) =>
        index === tasks.findIndex(candidate => String(candidate._id || '') === String(task._id || ''))
      );

    // Sort timeline items in ascending order by date (dueDate -> startDate -> createdAt)
    this.timelineItems = filtered.sort((a, b) => {
      const aTime = new Date(a.dueDate || a.startDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.dueDate || b.startDate || b.createdAt || 0).getTime();
      return aTime - bTime;
    });
  }

  private clearAssignments() {
    this.allAssignments = [];
    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];
    this.timelineItems = [];
  }

  private setupAssignmentsStream(): void {
    const s = this.assignmentsReload$
      .pipe(
        debounceTime(50),
        switchMap((forceReload) => {
          if (!forceReload && this.assignmentsLoadedOnce) {
            this.filterAssignmentsByProject();
            return of(null);
          }

          this.loading = true;
          this.error = '';

          return this.assignworkService.getAssignments().pipe(
            timeout(15000),
            catchError((err) => {
              console.error('Assignments request failed or timed out:', err);
              this.error = 'Unable to load tasks. Please try again.';
              this.clearAssignments();
              return of(null);
            }),
            finalize(() => {
              this.loading = false;
            })
          );
        })
      )
      .subscribe((res: any) => {
        if (!res) {
          return;
        }

        this.assignmentsLoadedOnce = true;
        if (Array.isArray(res)) {
          this.allAssignments = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.allAssignments = res.data;
        } else if (res?.assignments && Array.isArray(res.assignments)) {
          this.allAssignments = res.assignments;
        } else if (res?.works && Array.isArray(res.works)) {
          this.allAssignments = res.works;
        } else {
          this.allAssignments = [];
        }

        this.filterAssignmentsByProject();
      });

    this.subs.add(s);
  }


  isAdmin(): boolean {
  // roleObj could be undefined or an object
  const roleObj: any = this.userData?.role || localStorage.getItem('role');
  
  // extract role string safely
  const roleStr = typeof roleObj === 'string' 
    ? roleObj 
    : roleObj?.role ?? ''; // get .role if object, else empty string

  console.log('roleStr:', roleStr);  // should print 'admin'
  return roleStr.toLowerCase() === 'admin';
}


  // Get project list for dialog dropdown
  getDialogProjectList(): any[] {
    if (this.isAdmin() && this.allProjects.length > 0) {
      return this.allProjects;
    }
    return this.projects;
  }

isAdminOrTeamLead(): boolean {
  return this.isAdmin() || this.isCurrentUserTeamLead();
}

openAssignmentDialog(task?: AssignWork) {

  // 🚨 ROLE CHECK
  if (!this.isAdminOrTeamLead() && !task) {
    this.snackBar.open(
      'Only Admin or Team Lead can create tasks',
      'Close',
      { duration: 3000 }
    );
    return;
  }

  this.editingTask = task || null;

  let startDateStr = '';
  let dueDateStr = '';

  // Normalize dates
  if (task?.startDate) {
    try {
      const d = new Date(task.startDate);
      if (!isNaN(d.getTime())) {
        startDateStr = d.toISOString().split('T')[0];
      }
    } catch {}
  }

  if (task?.dueDate) {
    try {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        dueDateStr = d.toISOString().split('T')[0];
      }
    } catch {}
  }

  const resolvedProjectId = this.resolveDialogProjectId(task);

  this.assignmentForm.patchValue({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: this.username,
    assignee: task?.assignee || '',
    startDate: startDateStr,
    dueDate: dueDateStr,
    Status: task?.Status || 'ToDo',
    projectId: resolvedProjectId,
    projectName: task?.projectName || this.selectedProjectName || ''
  });

  const taskSubTasks = task?.subTask?.length ? task.subTask : [null];

  this.assignmentForm.setControl(
    'subTask',
    this.fb.array(taskSubTasks.map(subTask => this.createSubTaskGroup(subTask)))
  );

  this.dialog.open(this.assignmentDialog, {
    width: '1200px',
    maxWidth: '96vw',
    minWidth: '0',
    maxHeight: '92vh',
  });
}

private resolveDialogProjectId(task?: AssignWork): string {
  const directId = task?.projectId || this.selectedProjectId || '';
  if (directId) {
    const matchedById = this.projects.find(project =>
      String(project?._id || project?.id || '') === String(directId)
    );
    if (matchedById) {
      return String(directId);
    }
  }

  const projectName = String(task?.projectName || this.selectedProjectName || '').trim().toLowerCase();
  if (!projectName) {
    return '';
  }

  const matchedProject = this.projects.find(project =>
    String(project?.projectName || project?.name || '').trim().toLowerCase() === projectName
  );

  return String(matchedProject?._id || matchedProject?.id || '');
}

 

  addComment() {
    if (this.commentForm.invalid || !this.selectedTask) return;

    const message = this.commentForm.get('message')?.value;
    const newComment = {
      user: this.username,
      message: message,
      timestamp: new Date()
    };

    const comments = this.selectedTask.comment ? [...this.selectedTask.comment] : [];
    comments.push(newComment);
    this.selectedTask.comment = comments;

    if (this.selectedTask._id) {
      const payload = { ...this.selectedTask, comment: comments };
      const s = this.assignworkService.updateAssignment(this.selectedTask._id, payload).subscribe({
        next: () => {
          this.snackBar.open('Comment added', 'Close', { duration: 2000 });
          this.commentForm.reset();
          this.getAssignments(true);
        },
        error: () => {
          this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
          const arr = this.selectedTask?.comment || [];
          arr.pop();
          this.selectedTask!.comment = arr;
        }
      });
      this.subs.add(s);
    } else {
      this.snackBar.open('Comment added locally (save task to persist)', 'Close', { duration: 3000 });
      this.commentForm.reset();
    }
}

onSubTaskStartDateChange(index: number): void {
  this.updateSubTaskDurationAndEndDate(index, 'start');
}

onSubTaskEndDateChange(index: number): void {
  this.updateSubTaskDurationAndEndDate(index, 'end');
}

private updateSubTaskDurationAndEndDate(index: number, changedField: 'start' | 'end'): void {
  const subTaskGroup = this.subTaskArray.at(index) as FormGroup | null;
  if (!subTaskGroup) {
    return;
  }

  const startValue = subTaskGroup.get('StartDate')?.value;
  const endValue = subTaskGroup.get('EndDate')?.value;
  const startDate = startValue ? new Date(startValue) : null;
  const endDate = endValue ? new Date(endValue) : null;

  if (startDate && endDate && endDate < startDate) {
    if (changedField === 'start') {
      subTaskGroup.patchValue({ EndDate: startValue }, { emitEvent: false });
    } else {
      subTaskGroup.patchValue({ StartDate: endValue }, { emitEvent: false });
    }
  }

  const normalizedStart = subTaskGroup.get('StartDate')?.value;
  const normalizedEnd = subTaskGroup.get('EndDate')?.value;
  if (!normalizedStart || !normalizedEnd) {
    subTaskGroup.patchValue({ NoOfDays: '' }, { emitEvent: false });
    return;
  }

  const safeStart = new Date(normalizedStart);
  const safeEnd = new Date(normalizedEnd);
  const diff = Math.floor((safeEnd.getTime() - safeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  subTaskGroup.patchValue({ NoOfDays: diff > 0 ? String(diff) : '1' }, { emitEvent: false });
}

saveAssignment()
{

if(this.assignmentForm.invalid)
{
this.snackBar.open(
'Please fill required fields',
'Close',
{duration:2500}
);
return;
}


const formValue =
this.assignmentForm.value;



// projectId resolve
const projectId =
formValue.projectId ||
this.selectedProjectId ||
this.editingTask?.projectId ||
'';



// find project object
const selectedProject =
this.projects.find(
p =>
String(p._id) === String(projectId)
);



// projectName resolve
const projectName =
selectedProject?.projectName ||
selectedProject?.name ||
this.selectedProjectName ||
this.editingTask?.projectName ||
'';




// validation
if(!projectId || !projectName)
{

this.snackBar.open(
'Please select project',
'Close',
{duration:4000}
);

return;

}



this.isLoading = true;

const subTaskPayload = (formValue.subTask || [])
  .filter((subTask: any) =>
    !!subTask?.title ||
    !!subTask?.description ||
    !!subTask?.StartDate ||
    !!subTask?.EndDate ||
    !!subTask?.assignee
  )
  .map((subTask: any) => ({
    title: subTask.title || '',
    description: subTask.description || '',
    StartDate: subTask.StartDate
      ? this.dateUtils.formatDateForBackend(subTask.StartDate)
      : '',
    EndDate: subTask.EndDate
      ? this.dateUtils.formatDateForBackend(subTask.EndDate)
      : '',
    assignedTo: subTask.assignedTo || this.username,
    assignee: subTask.assignee || '',
    Status: subTask.Status || 'ToDo',
    NoOfDays: subTask.NoOfDays || ''
  }));

const basePayload = {
  projectId,
  projectName,
  title: formValue.title || '',
  description: formValue.description || '',
  assignedTo: formValue.assignedTo || this.username,
  assignee: formValue.assignee || '',
  startDate: formValue.startDate
    ? this.dateUtils.formatDateForBackend(formValue.startDate)
    : '',
  dueDate: formValue.dueDate
    ? this.dateUtils.formatDateForBackend(formValue.dueDate)
    : '',
  Status: formValue.Status || 'ToDo',
  subTask: subTaskPayload
};

const hasFileUpload = this.selectedPictureFiles.length > 0 || this.uploadedPictures?.length > 0;
let requestBody: FormData | typeof basePayload = basePayload;

if (hasFileUpload) {
  const formData = new FormData();

  formData.append('projectId', basePayload.projectId);
  formData.append('projectName', basePayload.projectName);
  formData.append('title', basePayload.title);
  formData.append('description', basePayload.description);
  formData.append('assignedTo', basePayload.assignedTo);
  formData.append('assignee', basePayload.assignee);
  formData.append('startDate', basePayload.startDate);
  formData.append('dueDate', basePayload.dueDate);
  formData.append('Status', basePayload.Status);

  if (subTaskPayload.length > 0) {
    formData.append('subTask', JSON.stringify(subTaskPayload));

    subTaskPayload.forEach((subTask: any, index: number) => {
      formData.append(`subTask[${index}][title]`, subTask.title || '');
      formData.append(`subTask[${index}][description]`, subTask.description || '');
      formData.append(`subTask[${index}][StartDate]`, subTask.StartDate || '');
      formData.append(`subTask[${index}][EndDate]`, subTask.EndDate || '');
      formData.append(`subTask[${index}][assignedTo]`, subTask.assignedTo || '');
      formData.append(`subTask[${index}][assignee]`, subTask.assignee || '');
      formData.append(`subTask[${index}][Status]`, subTask.Status || 'ToDo');
      formData.append(`subTask[${index}][NoOfDays]`, subTask.NoOfDays || '');
    });
  }

  if (this.uploadedPictures?.length) {
    formData.append('existingPictures', JSON.stringify(this.uploadedPictures));
  }

  this.selectedPictureFiles.forEach(file => {
    formData.append('pictures', file);
  });

  requestBody = formData;
}


const finalStartDate = formValue.startDate ? this.dateUtils.formatDateForBackend(formValue.startDate) : '';
console.log('----- SAVING ASSIGNMENT -----');
console.log('Final Raw startDate:', formValue.startDate);
console.log('Final Formatted startDate for FormData:', finalStartDate);
console.log('-----------------------------');

// request
const request$ =
this.editingTask?._id
?

this.assignworkService
.updateAssignment(
this.editingTask._id,
requestBody
)

:

this.assignworkService
.createAssignment(
requestBody
);




request$
.subscribe({

next:()=>
{

this.isLoading=false;

this.snackBar.open(

this.editingTask
?
'Task updated'
:
'Task created',

'Close',

{duration:2500}

);


this.getAssignments(true);


this.dialog.closeAll();

},


error:(err)=>
{

this.isLoading=false;

this.snackBar.open(

'Save Failed',

'Close',

{duration:4000}

);

}

});

}

  deleteAssignment(id: string | undefined) {
    if (!id) {
      console.error('Invalid assignment ID:', id);
      this.snackBar.open('Invalid assignment ID provided', 'Close', { duration: 3000 });
      return;
    }

    // Check if assignment has any dependencies
    this.checkAssignmentDependencies(id).then((hasDependencies) => {
      if (hasDependencies) {
        this.snackBar.open('Cannot delete assignment: It has related tasks or dependencies', 'Close', { duration: 5000 });
        return;
      }

      // Use Material Dialog for confirmation
      const dialogRef = this.dialog.open(AssignmentDeleteConfirmationDialogComponent, {
       width: '800px', 
       minHeight: '50px',
        data: { 
          mode: 'delete',
          assignmentId: id,
          title: 'Confirm Assignment Deletion',
          message: 'Are you sure you want to delete this assignment? This action cannot be undone and will remove all assignment data.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.performAssignmentDeletion(id);
        }
      });
    }).catch((error) => {
      console.error('Error checking assignment dependencies:', error);
      this.snackBar.open('Error checking assignment dependencies', 'Close', { duration: 3000 });
    });
  }

  private async checkAssignmentDependencies(assignmentId: string): Promise<boolean> {
    try {
      // Check if assignment has any dependencies
      // This is a placeholder - you would implement actual dependency checks based on your business logic
      // For example, check if assignment has related tasks, comments, attachments, etc.
      return false; // For now, allow deletion
    } catch (error) {
      console.error('Error fetching assignment dependencies:', error);
      return false; // Allow deletion if check fails
    }
  }

  private performAssignmentDeletion(id: string): void {
    this.isDeleting = true;
    
    const s = this.assignworkService.deleteAssignment(id).subscribe({
      next: () => {
        console.log('Assignment deleted successfully');
        this.snackBar.open('Assignment deleted successfully', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.removeAssignmentFromLocal(id);
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Delete operation failed:', err);
        
        let errorMessage = 'Failed to delete assignment';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 404) {
          errorMessage = 'Assignment not found';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to delete this assignment';
        } else if (err.status === 409) {
          errorMessage = 'Cannot delete assignment: It has related tasks or dependencies';
        } else if (err.status === 0) {
          errorMessage = 'Network error: Please check your connection';
        }
        
        this.snackBar.open(errorMessage, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isDeleting = false;
      }
    });
    this.subs.add(s);
  }

  private removeAssignmentFromLocal(id: string) {
    const removeFrom = (arr: AssignWork[]) => {
      const idx = arr.findIndex(a => String(a._id) === String(id));
      if (idx > -1) arr.splice(idx, 1);
    };
    removeFrom(this.allAssignments);
    removeFrom(this.todoAssignments);
    removeFrom(this.inProgressAssignments);
    removeFrom(this.doneAssignments);
  }

  drop(event: CdkDragDrop<AssignWork[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const movedTask = event.previousContainer.data[event.previousIndex];
    if (!movedTask) return;

    // Move task locally
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const previousStatus = movedTask.Status;
    movedTask.Status = newStatus;
    this.updateTimelineItems();

    if (movedTask._id) {
      const updatePayload = { Status: newStatus };

      const s = this.assignworkService.updateAssignment(movedTask._id, updatePayload).subscribe({
        next: () => {
          this.snackBar.open('Task status updated', 'Close', { duration: 2000 });
        },
        error: () => {
          // Rollback if failed
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          movedTask.Status = previousStatus;
          this.updateTimelineItems();
          this.snackBar.open('Failed to update task status', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    } else {
      // Rollback for unsaved tasks
      transferArrayItem(
        event.container.data,
        event.previousContainer.data,
        event.currentIndex,
        event.previousIndex
      );
      movedTask.Status = previousStatus;
      this.updateTimelineItems();
      this.snackBar.open('Cannot change status for unsaved task', 'Close', { duration: 3000 });
    }
  }

  // Navigation Methods
  opentask() {
this.currentPage = 'task';
this.showmaintask = true;
this.Documents =false;
this.Calendar = false;
this.Summary = false;
this.compare =false;
this.TimeLine = false;
this.showtask=true;
this.datefiltersection=true;
  }

  openuv() {
    setTimeout(() => {
      this.ngAfterViewInit();
    }, 100);
 this.currentPage = 'summary';    
this.showmaintask = false;
this.Documents =false;
this.Calendar = false;
this.Summary = true;
this.compare =false;
this.TimeLine = false;
this.showtask=false;
this.datefiltersection=false;
    
}

  opendoc() {
 if (this.currentPage === 'documents' && this.Documents) {
   return;
 }
 this.currentPage = 'documents';    
this.showmaintask = false;
this.Documents =true;
this.Calendar = false;
this.Summary = false;
this.compare =false;
this.TimeLine = false;
this.showtask=false;
this.datefiltersection=false;
  }

  openMonthView() {
 this.currentPage = 'calendar';    
this.showmaintask = false;
this.Documents =false;
this.Calendar = true;
this.Summary = false;
this.compare =false;
this.TimeLine = false;
this.showtask=false;
this.datefiltersection=false;
  }

  opencom() {
     this.currentPage = 'compare';
  this.showmaintask = false;
this.Documents =false;
this.Calendar = false;
this.Summary = false;
this.compare = true;
this.TimeLine = false;
this.datefiltersection=false;
}
 openTL() {
  if (!this.assignmentsLoadedOnce) {
    this.getAssignments();
  }

  this.currentPage = 'TimeLine';
  this.showmaintask = false;
  this.showtask = false;
  this.Documents = false;
  this.Calendar = false;
  this.Summary = false;
  this.compare = false;
  this.TimeLine = true;
  this.datefiltersection = false;
  this.filterAssignmentsByProject();

  setTimeout(() => {
    this.timelineComponent?.emitMonthView();
  }, 0);
}
  opendocpop(doc?: any) {
    this.editingDocument = doc || null;
    this.showdocumentpop = true;

    if (doc) {
      this.documentForm.patchValue({
        title: doc.title,
        file: null
      });
      this.selectedFile = null;
    } else {
      this.documentForm.reset();
      this.selectedFile = null;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.documentForm.patchValue({ file: this.selectedFile });
    }
  }

  submitDocument() {
    if (!this.documentForm.valid && !this.editingDocument) {
      this.snackBar.open('Please provide title and file', 'Close', { duration: 2500 });
      return;
    }

    const formData = new FormData();
    formData.append('title', this.documentForm.get('title')?.value);
    if (this.selectedFile) {
      formData.append('files', this.selectedFile);
    }

    if (this.editingDocument && this.editingDocument._id) {
      const s = this.assignworkService.updateDocument(this.editingDocument._id, formData).subscribe({
        next: () => {
          this.snackBar.open('Document updated successfully', 'Close', { duration: 2500 });
          this.getDocuments();
          this.showdocumentpop = false;
          this.documentForm.reset();
          this.selectedFile = null;
          this.editingDocument = null;
        },
        error: () => {
          this.snackBar.open('Failed to update document', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    } else {
      if (!this.selectedFile) {
        this.snackBar.open('Please provide a file for new document', 'Close', { duration: 2500 });
        return;
      }
      const s = this.assignworkService.createDocument(formData).subscribe({
        next: () => {
          this.snackBar.open('Document uploaded successfully', 'Close', { duration: 2500 });
          this.getDocuments();
          this.showdocumentpop = false;
          this.documentForm.reset();
          this.selectedFile = null;
        },
        error: () => {
          this.snackBar.open('Failed to upload document', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    }
  }

  getStatusClass(status: string): string {
  if (!status) return 'status-todo';
  
  const s = status.toLowerCase().trim();
  if (s.includes('done') || s.includes('complete')) return 'status-done';
  if (s.includes('progress') || s.includes('inprogress')) return 'status-progress';
  return 'status-todo';
}

  getDocuments() {
    const s = this.assignworkService.getDocument().subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.documents = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.documents = res.data;
        } else {
          this.documents = [];
        }
        this.filteredDocuments = [...this.documents];
        // Populate allTitles with unique document titles
        this.allTitles = [...new Set(this.documents.map(doc => doc.title))];
        this.filteredTitles = [...this.allTitles];
      },
      error: () => {
        this.snackBar.open('Failed to load documents', 'Close', { duration: 3000 });
        this.documents = [];
        this.filteredDocuments = [];
        this.allTitles = [];
        this.filteredTitles = [];
      }
    });
    this.subs.add(s);
  }

  filterDocuments() {
    if (!this.searchTerm) {
      this.filteredDocuments = [...this.documents];
      return;
    }
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredDocuments = this.documents.filter(doc =>
      doc.title.toLowerCase().includes(searchLower)
    );
  }

  filterTitles() {
    const filterValue = this.documentForm.get('title')?.value?.toLowerCase() || '';
    this.filteredTitles = this.allTitles.filter(title =>
      title.toLowerCase().includes(filterValue)
    );
  }

  onTitleSelected(event: any) {
    const selectedTitle = event.option.value;
    this.documentForm.get('title')?.setValue(selectedTitle);
    const selectedDoc = this.documents.find(doc => doc.title === selectedTitle);
    if (selectedDoc) {
      this.editingDocument = selectedDoc;
      this.documentForm.patchValue({
        title: selectedDoc.title,
        file: null
      });
      this.selectedFile = null;
    }
  }

  deleteDocument(id: string) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    const s = this.assignworkService.deleteDocument(id).subscribe({
      next: () => {
        this.snackBar.open('Document deleted successfully', 'Close', { duration: 2500 });
        this.documents = this.documents.filter(doc => String(doc._id) !== String(id));
        this.filterDocuments();
        this.allTitles = [...new Set(this.documents.map(doc => doc.title))];
        this.filteredTitles = [...this.allTitles];
      },
      error: () => {
        this.snackBar.open('Failed to delete document', 'Close', { duration: 3000 });
      }
    });
    this.subs.add(s);
  }

  loadUserViewAssignments() {
    if (!this.username || !this.selectedProjectName) {
      this.userViewAssignments = [];
      this.snackBar.open('Please select a project to view tasks', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const s = this.assignworkService.getUserview(this.selectedProjectName, this.username).subscribe({
      next: (res) => {
        this.loading = false;
        if (Array.isArray(res)) {
          this.userViewAssignments = res;
        } else if (res?.works && Array.isArray(res.works)) {
          this.userViewAssignments = res.works;
        } else {
          this.userViewAssignments = [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('User view error:', err);
        this.snackBar.open('Failed to load user tasks', 'Close', { duration: 3000 });
        this.userViewAssignments = [];
      }
    });
    this.subs.add(s);
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

  
  if (this.todayDay <= daysInMonth) {
    this.selectedDay = this.todayDay;
  } else {
    this.selectedDay = 1;
  }
}
  onPictureDropped($event: DragEvent) {
    throw new Error('Method not implemented.');
  }
  onDragOver($event: DragEvent) {
    throw new Error('Method not implemented.');
  }
  onDragEnter($event: DragEvent) {
    throw new Error('Method not implemented.');
  }
  onDragLeave($event: DragEvent) {
    throw new Error('Method not implemented.');
  }
getFileUrl(file: string): string {
    const cleanFile = file.replace(/^uploads\//, '');
    const url = file.startsWith('http') ? file : this.configService.getUploadUrl(cleanFile.replace(/\\/g, '/'));
    console.log(`Generated PDF URL: ${url}`);
    return url;
  }

  getSafeFileUrl(file: string): SafeResourceUrl {
    const url = this.getFileUrl(file);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFileType(file: string): string {
    const extension = file.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return 'pdf';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension || '')) {
      return 'image';
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'excel';
    }
    return 'other';
  }

  onPdfLoad(file: string) {
    console.log(`PDF loaded successfully: ${file}`);
    this.isPdfLoaded[file] = true;
    this.loadError[file] = false;
  }

  onPdfError(file: string, error: any) {
    console.error(`PDF load error for ${file}:`, error);
    this.isPdfLoaded[file] = false;
    this.loadError[file] = true;
  }

  closeDialog():void {
    this.dialog.closeAll();
  }

   close():void {
    this.dialog.closeAll();
  }
handleTimelineTodayClick(): void {
  this.selectedTaskDate = this.getTodayDateString();
  this.onDateChange();
}

handleTimelineFilterClick(): void {
  this.datefiltersection = true;
  this.showmaintask = true;
  this.TimeLine = false;
  this.currentPage = 'task';
  this.filterAssignmentsByProject();
}

handleTimelineMonthViewClick(): void {
  this.currentPage = 'TimeLine';
  this.showmaintask = false;
  this.Documents = false;
  this.Calendar = false;
  this.Summary = false;
  this.compare = false;
  this.TimeLine = true;
  this.showtask = false;
  this.datefiltersection = false;
  this.filterAssignmentsByProject();
}

handleTimelineNewTaskClick(): void {
  this.openAssignmentDialog();
}
  
}
