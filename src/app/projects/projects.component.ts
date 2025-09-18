import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CreatprojectService } from '../service/creatproject.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { UserservicesService } from '../register/services/userservices.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
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

  constructor(
    private projectService: CreatprojectService,
    private assignworkService: AssignWorkService,
    private userService: UserservicesService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initCommentForm();
    this.loadUserFromSession();
    this.loadEmployees();
    this.updateDateTime();
  }

  private updateDateTime() {
    setInterval(() => {
      this.dateTime = new Date().toLocaleString();
    }, 1000);
  }

  private initForm() {
    this.assignmentForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      assignedTo: [this.username, Validators.required],
      assignee: ['', Validators.required],
      startDate: [''],
      dueDate: ['', Validators.required],
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
    this.userService.getuser().subscribe({
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
  }

  getEmployeeValue(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || '';
  }

  getEmployeeDisplay(emp: any): string {
    return typeof emp === 'string' ? emp : emp.username || emp.UserName || emp.name || emp.email || '';
  }

  fetchProjectsByEmployee(userName: string) {
    this.projectService.getProjectsByEmployee(userName).subscribe({
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
  }

  onProjectSelect() {
    const selectedProject = this.projects.find(p => p._id === this.selectedProjectId || p.id === this.selectedProjectId);
    this.selectedProjectName = selectedProject?.projectName || selectedProject?.name || '';
    this.filterAssignmentsByProject();
  }

  getAssignments() {
    this.loading = true;
    this.assignworkService.getAssignments().subscribe({
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
  }

  private filterAssignmentsByProject() {
    let filteredAssignments: AssignWork[] = [];
    
    if (this.selectedProjectId) {

      filteredAssignments = this.allAssignments.filter(a => 
        a.projectId === this.selectedProjectId || 
        a.projectName === this.selectedProjectName
      );
    } else {
   
      filteredAssignments = this.allAssignments.filter(
        a => a.assignedTo === this.username || a.assignee === this.username
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
      setTimeout(() => this.error = '', 3000);
      return;
    }

    this.editingTask = task || null;
    this.selectedTask = task || null;
    
    let title = '';
    let description = '';

    if (task) {
      title = task.title || '';
      description = task.description || '';
    }

    const formData = task
      ? { 
          title: title,
          description: description,
          assignedTo: task.assignedTo,
          assignee: task.assignee,
          startDate: task.startDate ? new Date(task.startDate) : '',
          dueDate: new Date(task.dueDate),
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
    
    dialogRef.afterClosed().subscribe(() => {
      this.assignmentForm.reset({ 
        assignedTo: this.username,
        Status: 'ToDo'
      });
      this.commentForm.reset();
      this.editingTask = null;
      this.selectedTask = null;
    });
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
    
  
    this.commentForm.reset();
  }

  saveAssignment() {
    if (this.assignmentForm.invalid) {
      return;
    }

    const formValue = this.assignmentForm.value;
    const payload: any = {
      projectName: this.selectedProjectName,
      title: formValue.title,
      description: formValue.description,
      comment: this.editingTask?.comment || [],
      assignedTo: this.username,
      assignee: formValue.assignee,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString().split('T')[0] : '',
      dueDate: new Date(formValue.dueDate).toISOString().split('T')[0],
      Status: this.editingTask ? this.editingTask.Status : 'ToDo',
      projectId: this.selectedProjectId || ''
    };

    if (this.editingTask && this.editingTask._id) {
      this.assignworkService.updateAssignment(this.editingTask._id, payload).subscribe({
        next: () => {
          this.successMessage = 'Task updated successfully';
          this.getAssignments();
          this.dialog.closeAll();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.error = 'Failed to update task';
          setTimeout(() => this.error = '', 3000);
        }
      });
    } else {
      this.assignworkService.createAssignment(payload).subscribe({
        next: () => {
          this.successMessage = 'Task created successfully';
          this.getAssignments();
          this.dialog.closeAll();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.error = 'Failed to create task';
          setTimeout(() => this.error = '', 3000);
        }
      });
    }
  }

  deleteAssignment(id: string | undefined) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    this.assignworkService.deleteAssignment(id).subscribe({
      next: () => {
        this.successMessage = 'Task deleted successfully';
        this.getAssignments();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.error = 'Failed to delete task';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  drop(event: CdkDragDrop<AssignWork[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const movedTask = event.previousContainer.data[event.previousIndex];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      if (movedTask && movedTask._id) {
        const updatePayload = { 
          ...movedTask,
          Status: newStatus 
        };

        this.assignworkService.updateAssignment(movedTask._id, updatePayload).subscribe({
          next: () => {
            movedTask.Status = newStatus;
            this.getAssignments(); 
          },
          error: () => {
            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );
            this.error = 'Failed to update task status';
            setTimeout(() => this.error = '', 3000);
          }
        });
      }
    }
  }
}