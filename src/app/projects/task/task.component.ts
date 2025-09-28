import { Component, OnInit, ViewChild, TemplateRef, OnDestroy, ElementRef ,AfterViewInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { CreatprojectService } from '../../service/creatproject.service';
import { AssignWorkService, AssignWork } from '../../service/assignwork.service';
import { UserservicesService } from '../../register/services/userservices.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
})
export class TaskComponent {


  showmaintask = true;
  safePdfUrl: SafeResourceUrl | null = null;
 filteredTitles: string[] = []; 
  allTitles: string[] = []; 
  editingDocument: Document | null = null;
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  searchTerm: string = '';
  selectedFile: File | null = null;
  uploadedPictures: string[] = [];
  selectedPictureFiles: File[] = [];
    employees: any[] = [];
 removeImage: any;
 cancelEdit: any;
  showinuserview = false;
 error = '';
   loading = false;
   successMessage = '';
  userViewAssignments: AssignWork[] = [];
  selectedTaskDate: Date | null = null;
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
private subs = new Subscription();

    opentask() {
    this.showmaintask = true;

  }
    isCurrentUserTeamLead(): boolean {
    if (!this.selectedProjectTeamLeads.length) return false;
    return this.selectedProjectTeamLeads.some(lead =>
      lead === this.username ||
      lead === this.userData?.UserName ||
      lead === this.userData?.username
    );
  }

 constructor(
    private projectService: CreatprojectService,
    private assignworkService: AssignWorkService,
    private userService: UserservicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ){}

  
  ngOnInit(): void {

    this.filterAssignmentsByProject();
    this.loadUserFromSession();
    this.loadEmployees();
   
  }
    applyDateFilter() {
  
    this.todoAssignments = this.getFilteredTasksByStatus('ToDo');
    this.inProgressAssignments = this.getFilteredTasksByStatus('InProgress');
    this.doneAssignments = this.getFilteredTasksByStatus('Done');
  }

    getFilteredTasksByStatus(status: string): AssignWork[] {
    let tasks = this.allAssignments;
  
    if (this.selectedProjectId) {
      tasks = tasks.filter(a =>
        String(a.projectId) === String(this.selectedProjectId) ||
        String(a.projectId || '') === String(this.selectedProjectId) ||
        String(a.projectName || '').toLowerCase() === String(this.selectedProjectName || '').toLowerCase()
      );
    } else {
      tasks = tasks.filter(
        a => String(a.assignedTo) === String(this.username) || String(a.assignee) === String(this.username)
      );
    }


    if (this.selectedTaskDate) {
      const selectedDate = new Date(this.selectedTaskDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);
        
        return taskDueDate.getTime() === selectedDate.getTime();
      });
    }

    return tasks.filter(assignment => {
      const taskStatus = (assignment.Status || 'ToDo').toLowerCase().trim();
      const targetStatus = status.toLowerCase();
      
      if (targetStatus === 'inprogress') {
        return taskStatus.includes('progress');
      } else if (targetStatus === 'done') {
        return taskStatus.includes('done') || taskStatus.includes('complete');
      } else {
        return !taskStatus.includes('progress') && 
               !taskStatus.includes('done') && 
               !taskStatus.includes('complete');
      }
    });
  }

  getFilteredTasksCount(): number {
    if (!this.selectedTaskDate) return this.allAssignments.length;
    
    const selectedDate = new Date(this.selectedTaskDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    return this.allAssignments.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      
      return taskDueDate.getTime() === selectedDate.getTime();
    }).length;
  }

      onTaskDateChange() {
    this.applyDateFilter();
  }

    clearDateFilter() {
    this.selectedTaskDate = null;
    this.applyDateFilter();
  }

  
  deleteAssignment(id: string | undefined) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    const s = this.assignworkService.deleteAssignment(id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted successfully', 'Close', { duration: 2500 });
        this.removeAssignmentFromLocal(id);
      },
      error: () => {
        this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 });
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
    return `http://localhost:3008/${path.replace(/\\/g, '/')}`;
  }

  removePicture(index: number) {
    this.uploadedPictures.splice(index, 1);
  }

  viewImage(path: string) {
    const url = this.getImageUrl(path);
    window.open(url, '_blank');
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
  getEmployeeValue(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || '';
  }

  getEmployeeDisplay(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || emp.email || '';
  }

  
  openAssignmentDialog(task?: AssignWork) {
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
      this.uploadedPictures = [];
    }
    this.selectedPictureFiles = [];

    this.editingTask = task || null;
    this.selectedTask = task || null;

    const formData = task
      ? {
          title: task.title || '',
          description: task.description || '',
          assignedTo: task.assignedTo || this.username,
          assignee: task.assignee || '',
          startDate: task.startDate ? new Date(task.startDate) : '',
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
          Status: task.Status || 'ToDo'
        }
      : {
          title: '',
          description: '',
          assignedTo: this.username,
          assignee: '',
          startDate: '',
          dueDate: new Date(),
          Status: 'ToDo'
        };

    this.assignmentForm.reset(formData);
    this.commentForm.reset();

    const dialogRef = this.dialog.open(this.assignmentDialog, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });

    const afterSub = dialogRef.afterClosed().subscribe(() => {
      this.assignmentForm.reset({
        assignedTo: this.username,
        Status: 'ToDo'
      });
      this.commentForm.reset();
      this.editingTask = null;
      this.selectedTask = null;
      afterSub.unsubscribe();
    });

    this.subs.add(afterSub);
  }

  saveAssignment() {
    if (this.assignmentForm.invalid) {
      this.snackBar.open('Please fill required fields', 'Close', { duration: 2500 });
      return;
    }

    const formValue = this.assignmentForm.value;
    const formData = new FormData();

    formData.append('projectName', this.selectedProjectName || (this.editingTask?.projectName || ''));
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('assignedTo', formValue.assignedTo || this.username);
    formData.append('assignee', formValue.assignee);
    formData.append('startDate', formValue.startDate ? new Date(formValue.startDate).toISOString().split('T')[0] : '');
    formData.append('dueDate', formValue.dueDate ? new Date(formValue.dueDate).toISOString().split('T')[0] : '');
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
          this.snackBar.open('Task updated successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          this.dialog.closeAll();
        },
        error: () => {
          this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.assignworkService.createAssignment(formData).subscribe({
        next: () => {
          this.snackBar.open('Task created successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          this.dialog.closeAll();
        },
        error: () => {
          this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
        }
      });
    }
  }


    private filterAssignmentsByProject() {
    let filteredAssignments: AssignWork[] = [];

    if (this.selectedProjectId) {
      filteredAssignments = this.allAssignments.filter(a =>
        String(a.projectId) === String(this.selectedProjectId) ||
        String(a.projectId || '') === String(this.selectedProjectId) ||
        String(a.projectName || '').toLowerCase() === String(this.selectedProjectName || '').toLowerCase()
      );
    } else {
      filteredAssignments = this.allAssignments.filter(
        a => String(a.assignedTo) === String(this.username) || String(a.assignee) === String(this.username)
      );
    }

    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];

    filteredAssignments.forEach(assignment => {
      const status = (assignment.Status || 'ToDo').toLowerCase().trim();
      if (status.includes('progress')) {
        this.inProgressAssignments.push(assignment);
      } else if (status.includes('done') || status.includes('complete')) {
        this.doneAssignments.push(assignment);
      } else {
        this.todoAssignments.push(assignment);
      }
    });

    if (this.selectedTaskDate) {
      this.applyDateFilter();
    }
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
      this.userData = usernameOnly ? { UserName: usernameOnly } : null;
    }

    this.displayName = this.userData?.UserName || this.userData?.username || 'User';
    this.username = this.displayName;

    if (this.assignmentForm) {
      this.assignmentForm.patchValue({ assignedTo: this.username });
    }

    if (this.username && this.username !== 'User') {
      this.fetchProjectsByEmployee(this.username);
      this.getAssignments();
    }
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



  private clearAssignments() {
    this.allAssignments = [];
    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];
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

}


