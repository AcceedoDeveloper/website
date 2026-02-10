import { Component, OnInit, ViewChild, TemplateRef, OnDestroy, ElementRef ,AfterViewInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { CreatprojectService } from '../service/creatproject.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { UserservicesService } from '../register/services/userservices.service';
import { ConfigService } from '../service/config.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { DateUtilsService } from '../service/date-utils.service';
import { AssignmentDeleteConfirmationDialogComponent } from './assignment-delete-confirmation-dialog.component';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
interface Document {
  _id: string;
  title: string;
  files: string[];
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, OnDestroy, AfterViewInit{
cancelEdit: any;
isLoading = false;
isDeleting = false;

showmaintask = true;
Documents =false;
Calendar = false;
Summary = false;
showdocumentpop = false;
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
 


  // User View
  showinuserview = false;



  userViewAssignments: AssignWork[] = [];
  

  // PDF
  loadError: { [key: string]: boolean } = {}; 
  isPdfLoaded: { [key: string]: boolean } = {}; 

  userData: any = null;
  username = '';
  displayName = 'User';
  dateTime: string = new Date().toLocaleString();
  
 
  projects: any[] = [];
  selectedProjectId = '';
  selectedProjectName = '';
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
  private dateIntervalId: any = null;
  searchQuery: any;
  isDragActive: any;
  cd: any;
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
    private dateUtils: DateUtilsService
  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      file: [null]
    });
  }

  

  ngOnInit(): void {
    this.initForm();
    this.initCommentForm();
    this.getCurrentUser();
    this.loadUserFromSession();
    this.loadEmployees();
    this.updateDateTime();
    this.getDocuments();
    this.ngAfterViewInit()
    
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
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.generateCalendar();
    this.getDocuments();
   
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
    
    console.log('Filtered tasks - ToDo:', this.todoAssignments.length);
    console.log('Filtered tasks - InProgress:', this.inProgressAssignments.length);
    console.log('Filtered tasks - Done:', this.doneAssignments.length);
  }

  getFilteredTasksByStatus(status: string): AssignWork[] {
  let tasks = [...this.allAssignments];

  /* =============================
     PROJECT / USER FILTER
  ============================== */
  if (this.selectedProjectId) {
    tasks = tasks.filter(a =>
      String(a.projectId) === String(this.selectedProjectId) ||
      String(a.projectName || '').toLowerCase() ===
        String(this.selectedProjectName || '').toLowerCase()
    );
  } else {
    tasks = tasks.filter(a =>
      String(a.assignedTo) === String(this.username) ||
      String(a.assignee) === String(this.username)
    );
  }

  /* =============================
     DATE FILTER → ONLY FOR TODO
  ============================== */
  if (this.selectedTaskDate && status.toLowerCase() === 'todo') {
  const selectedDate = new Date(this.selectedTaskDate);
  selectedDate.setHours(0, 0, 0, 0);

  tasks = tasks.filter(task => {
    if (!task.createdAt) return true; // IMPORTANT

    const created = new Date(task.createdAt);
    created.setHours(0, 0, 0, 0);

    return created.getTime() === selectedDate.getTime();
  });
}


  /* =============================
     STATUS FILTER
  ============================== */
  return tasks.filter(task => {
    const taskStatus = (task.Status || 'ToDo').toLowerCase().trim();

    if (status.toLowerCase() === 'inprogress') {
      return taskStatus.includes('progress');
    }

    if (status.toLowerCase() === 'done') {
      return taskStatus.includes('done') || taskStatus.includes('complete');
    }

    // ToDo
    return (
      !taskStatus.includes('progress') &&
      !taskStatus.includes('done') &&
      !taskStatus.includes('complete')
    );
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

onDateChange() {
    console.log('Selected Date:', this.selectedTaskDate);
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
      dueDate: [this.dateUtils.getCurrentDateString(), Validators.required],
      Status: ['ToDo']
    });
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
    this.userData.photoURL = 'assets/default-avatar.png';
  }

  const img = new Image();
  img.src = this.userData.photoURL;
  img.onload = () => {
    this.userData.photoURL = this.userData.photoURL + '?t=' + new Date().getTime();
    this.cd.detectChanges(); 
  };

  if (this.assignmentForm) {
    this.assignmentForm.patchValue({ assignedTo: this.username });
  }
  if (this.username && this.username !== 'User') {
    this.fetchProjectsByEmployee(this.username);
    this.getAssignments();
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
      },
      error: () => {
        this.employees = [];
      }
    });
    this.subs.add(s);
  }

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
        this.userData.photoURL = 'assets/default-avatar.png';
      }
    }
  }

  getEmployeeValue(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || '';
  }

  getEmployeeDisplay(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || emp.email || '';
  }

  fetchProjectsByEmployee(userName: string) {
    const s = this.projectService.getProjectsByEmployee(userName).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.projects = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.projects = res.data;
        } else if (res?.projects && Array.isArray(res.projects)) {
          this.projects = res.projects;
        } else {
          this.projects = [];
        }
      },
      error: () => {
        this.projects = [];
      }
    });
    this.subs.add(s);
  }

  onProjectSelect() {
    const selectedProject = this.projects.find(p =>
      String(p._id) === String(this.selectedProjectId) ||
      String(p.id) === String(this.selectedProjectId)
    );

    if (!selectedProject && this.selectedProjectId) {
      this.selectedProjectName = '';
      this.selectedProjectTeamLeads = [];
    } else {
      this.selectedProjectName = selectedProject?.projectName || selectedProject?.name || '';
      this.selectedProjectTeamLeads = selectedProject?.teamLeads || [];
    }

    this.filterAssignmentsByProject();
  }

  isCurrentUserTeamLead(): boolean {
    if (!this.selectedProjectTeamLeads.length) return false;
    return this.selectedProjectTeamLeads.some(lead =>
      lead === this.username ||
      lead === this.userData?.UserName ||
      lead === this.userData?.username
    );
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

  getAssignments() {
    this.loading = true;
    const s = this.assignworkService.getAssignments().subscribe({
      next: (res: any) => {
        this.loading = false;
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
      },
      error: () => {
        this.loading = false;
        this.clearAssignments();
      }
    });
    this.subs.add(s);
  }

  private filterAssignmentsByProject() {
    console.log('=== filterAssignmentsByProject called ===');
    console.log('selectedProjectId:', this.selectedProjectId);
    console.log('selectedTaskDate:', this.selectedTaskDate);
    
    // Use the same filtering logic as getFilteredTasksByStatus
    this.todoAssignments = this.getFilteredTasksByStatus('ToDo');
    this.inProgressAssignments = this.getFilteredTasksByStatus('InProgress');
    this.doneAssignments = this.getFilteredTasksByStatus('Done');
    
    console.log('Final filtered assignments:');
    console.log('- ToDo:', this.todoAssignments.length);
    console.log('- InProgress:', this.inProgressAssignments.length);
    console.log('- Done:', this.doneAssignments.length);
  }

  private clearAssignments() {
    this.allAssignments = [];
    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];
  }

  openAssignmentDialog(task?: AssignWork) {
    console.log( "data", task);
    
    if (!this.selectedProjectId && !task) {
      this.error = "Please select a project first to add tasks";
      this.snackBar.open(this.error, 'Close', { duration: 3000 });
      this.error = '';
      return;
    }

    if (!this.isCurrentUserTeamLead() && !task) {
      this.error = "Only team leads can assign tasks to this project";
      this.snackBar.open(this.error, 'Close', { duration: 3000 });
      this.error = '';
      return;
    }

    if (task && task.pictures?.length) {
      this.uploadedPictures = [...task.pictures];
    } else {
      this.uploadedPictures = [];
    }
    this.selectedPictureFiles = [];

    this.editingTask = task || null;
    this.selectedTask = task || null;

    // Debug date conversion
    let startDateValue = '';
    let dueDateValue = '';
    
    if (task) {
      console.log('Original startDate:', task.startDate);
      console.log('Original dueDate:', task.dueDate);
      
      // For HTML date inputs, we need YYYY-MM-DD format strings
      if (task.startDate) {
        // Convert to YYYY-MM-DD format for HTML date input
        const startDate = new Date(task.startDate);
        if (!isNaN(startDate.getTime())) {
          startDateValue = task.startDate; // Keep as string in YYYY-MM-DD format
        }
        console.log('Formatted startDate:', startDateValue);
      }
      
      if (task.dueDate) {
        // Convert to YYYY-MM-DD format for HTML date input
        const dueDate = new Date(task.dueDate);
        if (!isNaN(dueDate.getTime())) {
          dueDateValue = task.dueDate; // Keep as string in YYYY-MM-DD format
        }
        console.log('Formatted dueDate:', dueDateValue);
      }
    }

    const formData = task
      ? {
          title: task.title || '',
          description: task.description || '',
          assignedTo: task.assignedTo || this.username,
          assignee: task.assignee || '',
          startDate: startDateValue,
          dueDate: dueDateValue || this.dateUtils.getCurrentDateString(),
          Status: task.Status || 'ToDo'
        }
      : {
          title: '',
          description: '',
          assignedTo: this.username,
          assignee: '',
          startDate: '',
          dueDate: this.dateUtils.getCurrentDateString(),
          Status: 'ToDo'
        };

    console.log('Form data being set:', formData);

    // Use patchValue instead of reset to properly handle Date objects
    this.assignmentForm.patchValue(formData);
    this.commentForm.reset();

    // Debug form values after patch
    setTimeout(() => {
      console.log('Form startDate value:', this.assignmentForm.get('startDate')?.value);
      console.log('Form dueDate value:', this.assignmentForm.get('dueDate')?.value);
    }, 100);

    const dialogRef = this.dialog.open(this.assignmentDialog, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose:true,
    });

    const afterSub = dialogRef.afterClosed().subscribe(() => {
      this.assignmentForm.patchValue({
        assignedTo: this.username,
        Status: 'ToDo',
        startDate: '',
        dueDate: this.dateUtils.getCurrentDateString()
      });
      this.commentForm.reset();
      this.editingTask = null;
      this.selectedTask = null;
      this.uploadedPictures = [];
      this.selectedPictureFiles = [];
      afterSub.unsubscribe();
    });

    this.subs.add(afterSub);
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
          this.getAssignments();
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

  saveAssignment() {
    if (this.assignmentForm.invalid) {
      this.snackBar.open('Please fill required fields', 'Close', { duration: 2500 });
      return;
    }

    this.isLoading = true;
    const formValue = this.assignmentForm.value;
    const formData = new FormData();

    formData.append('projectName', this.selectedProjectName || (this.editingTask?.projectName || ''));
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('assignedTo', formValue.assignedTo || this.username);
    formData.append('assignee', formValue.assignee);
    // Fix date conversion to avoid timezone issues
    formData.append('startDate', formValue.startDate ? this.dateUtils.formatDateForBackend(formValue.startDate) : '');
    formData.append('dueDate', formValue.dueDate ? this.dateUtils.formatDateForBackend(formValue.dueDate) : '');
    formData.append('Status', formValue.Status || (this.editingTask ? this.editingTask.Status : 'ToDo'));
    formData.append('projectId', this.selectedProjectId || (this.editingTask?.projectId || ''));

    if (this.uploadedPictures?.length) {
      formData.append('existingPictures', JSON.stringify(this.uploadedPictures));
    }

    this.selectedPictureFiles.forEach(file => {
      formData.append('pictures', file);
    });

    if (this.editingTask && this.editingTask._id) {
      this.assignworkService.updateAssignment(this.editingTask._id, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Task updated successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          setTimeout(() => {
            this.dialog.closeAll();
          }, 300);
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.assignworkService.createAssignment(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Task created successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          setTimeout(() => {
            this.dialog.closeAll();
          }, 300);
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
        }
      });
    }
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
        width: '400px',
        height: 'auto',
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
      this.snackBar.open('Cannot change status for unsaved task', 'Close', { duration: 3000 });
    }
  }

  // Navigation Methods
  opentask() {
this.showmaintask = true;
this.Documents =false;
this.Calendar = false;
this.Summary = false;
  }

  openuv() {
    this.ngAfterViewInit()
this.showmaintask = false;
this.Documents =false;
this.Calendar = false;
this.Summary = true;
    
}

  opendoc() {
this.showmaintask = false;
this.Documents =true;
this.Calendar = false;
this.Summary = false;
  }

  openMonthView() {
this.showmaintask = false;
this.Documents =false;
this.Calendar = true;
this.Summary = false;
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

  closeDialog() {
    this.dialog.closeAll();
  }

  
}