import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { CreatprojectService } from '../service/creatproject.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { UserservicesService } from '../register/services/userservices.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  userData: any = null;
  username = '';
  displayName = 'User';
  dateTime: string = new Date().toLocaleString();
  projects: any[] = [];
  selectedProjectId = '';
  selectedProjectName = '';

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

  private subs = new Subscription();
  private dateIntervalId: any = null;
searchQuery: any;

  constructor(
    private projectService: CreatprojectService,
    private assignworkService: AssignWorkService,
    private userService: UserservicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initCommentForm();
    this.loadUserFromSession();
    this.loadEmployees();
    this.updateDateTime();
  }

  ngOnDestroy(): void {
    if (this.dateIntervalId) {
      clearInterval(this.dateIntervalId);
      this.dateIntervalId = null;
    }
    this.subs.unsubscribe();
  }

  private updateDateTime() {
    this.dateIntervalId = setInterval(() => {
      this.dateTime = new Date().toLocaleString();
    }, 1000);
  }

  private initForm() {
  
    this.assignmentForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      assignedTo: ['', Validators.required],
      assignee: ['', Validators.required],
      startDate: [''],
      dueDate: [new Date(), Validators.required],
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
        if (this.employees.length === 0) {
          this.employees = ['Sabari', 'Ramesh', 'Anitha', 'Vijay'];
        }
      },
      error: () => {
        this.employees = ['Sabari', 'Ramesh', 'Anitha', 'Vijay'];
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
      console.warn('Selected projectId not found in loaded projects:', this.selectedProjectId);
      this.selectedProjectName = '';
    } else {
      this.selectedProjectName = selectedProject?.projectName || selectedProject?.name || '';
    }

    this.filterAssignmentsByProject();
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
  }

  private clearAssignments() {
    this.allAssignments = [];
    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];
  }

  openAssignmentDialog(task?: AssignWork) {
    if (!this.selectedProjectId && !task) {
      this.error = "Please select a project first to add tasks";
      this.snackBar.open(this.error, 'Close', { duration: 3000 });
      this.error = '';
      return;
    }

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

    const formValue = this.assignmentForm.value;
    const payload: any = {
      projectName: this.selectedProjectName || (this.editingTask?.projectName || ''),
      title: formValue.title,
      description: formValue.description,
      comment: this.editingTask?.comment || [],
      assignedTo: formValue.assignedTo || this.username,
      assignee: formValue.assignee,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString().split('T')[0] : '',
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString().split('T')[0] : '',
      Status: formValue.Status || (this.editingTask ? this.editingTask.Status : 'ToDo'),
      projectId: this.selectedProjectId || (this.editingTask?.projectId || '')
    };

    if (this.editingTask && this.editingTask._id) {
      const s = this.assignworkService.updateAssignment(this.editingTask._id, payload).subscribe({
        next: () => {
          this.snackBar.open('Task updated successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          this.dialog.closeAll();
        },
        error: () => {
          this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    } else {
      const s = this.assignworkService.createAssignment(payload).subscribe({
        next: () => {
          this.snackBar.open('Task created successfully', 'Close', { duration: 2500 });
          this.getAssignments();
          this.dialog.closeAll();
        },
        error: () => {
          this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
        }
      });
      this.subs.add(s);
    }
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

    const movedTask = event.previousContainer.data[event.previousIndex];
    if (!movedTask) return;
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const previousStatus = movedTask.Status;
    movedTask.Status = newStatus;

    if (movedTask._id) {
      const updatePayload = { ...movedTask, Status: newStatus };
      const s = this.assignworkService.updateAssignment(movedTask._id, updatePayload).subscribe({
        next: () => {
  
          this.getAssignments();
        },
        error: () => {
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
      transferArrayItem(
        event.container.data,
        event.previousContainer.data,
        event.currentIndex,
        event.previousIndex
      );
      this.snackBar.open('Cannot change status for unsaved task', 'Close', { duration: 3000 });
    }
  }
}
