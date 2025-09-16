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

  todoAssignments: AssignWork[] = [];
  inProgressAssignments: AssignWork[] = [];
  doneAssignments: AssignWork[] = [];

  assignmentForm!: FormGroup;
  editingTask: AssignWork | null = null;
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
    this.loadUserFromSession();
    this.initForm();
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
      description: ['', Validators.required],
      assignedTo: [this.username, Validators.required],
      assignee: ['', Validators.required],
      dueDate: ['', Validators.required],
       Status: ['ToDo']    // ✅ lowercase
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
    this.getAssignments();
  }

  getAssignments() {
    this.loading = true;
    this.assignworkService.getAssignments().subscribe({
      next: (res: any) => {
        this.loading = false;
        let assignments: AssignWork[] = [];

        if (Array.isArray(res)) {
          assignments = res;
        } else if (res?.data && Array.isArray(res.data)) {
          assignments = res.data;
        } else if (res?.assignments && Array.isArray(res.assignments)) {
          assignments = res.assignments;
        }

        const userAssignments = assignments.filter(
          a => (a.assignedTo === this.username || a.assignee === this.username) &&
               (!this.selectedProjectId || a.projectId === this.selectedProjectId)
        );

        this.todoAssignments = [];
        this.inProgressAssignments = [];
        this.doneAssignments = [];

        userAssignments.forEach(assignment => {
          switch (assignment.Status) { // ✅ lowercase
            case 'InProgress':
            case 'inprogress':
            case 'in progress':
              this.inProgressAssignments.push(assignment);
              break;
            case 'Done':
            case 'done':
            case 'completed':
              this.doneAssignments.push(assignment);
              break;
            default:
              assignment.Status = 'ToDo';
              this.todoAssignments.push(assignment);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.clearAssignments();
      }
    });
  }

  private clearAssignments() {
    this.todoAssignments = [];
    this.inProgressAssignments = [];
    this.doneAssignments = [];
  }

  openAssignmentDialog(task?: AssignWork) {
    this.editingTask = task || null;
    const formData = task
      ? { ...task, dueDate: new Date(task.dueDate) }
      : {
          description: '',
          assignedTo: this.username,
          assignee: '',
          dueDate: new Date(),
          Status: 'ToDo'   // ✅ lowercase
        };
    this.assignmentForm.reset(formData);

    const dialogRef = this.dialog.open(this.assignmentDialog, { width: '500px' });
    dialogRef.afterClosed().subscribe(() => {
      this.assignmentForm.reset({ assignedTo: this.username, Status: 'ToDo' });
      this.editingTask = null;
    });
  }

saveAssignment() {
  if (this.assignmentForm.invalid) return;

  const formValue = this.assignmentForm.value;
  const payload: any = {
    description: formValue.description,
    assignedTo: this.username,
    assignee: formValue.assignee,
    dueDate: new Date(formValue.dueDate).toISOString().split('T')[0], 
    Status: this.editingTask ? formValue.status || 'ToDo' : 'ToDo',  // ✅ Send capital S
    projectId: this.selectedProjectId || ''
  };

  if (this.editingTask && this.editingTask._id) {
    this.assignworkService.updateAssignment(this.editingTask._id, payload).subscribe({
      next: () => {
        this.getAssignments();
        this.dialog.closeAll();
      },
      error: (err) => {
        console.error('Update error:', err);
        alert('Failed to update assignment');
      }
    });
  } else {
    this.assignworkService.createAssignment(payload).subscribe({
      next: (res) => {
        const newTask: any = { ...payload, _id: res.work?._id || Date.now().toString() };
        this.todoAssignments.unshift(newTask);
        this.dialog.closeAll();
      },
      error: (err) => {
        console.error('Create error:', err);
        alert('Failed to create assignment');
      }
    });
  }
}


  deleteAssignment(id: string | undefined) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    this.assignworkService.deleteAssignment(id).subscribe({
      next: () => this.getAssignments(),
      error: (err) => {
        console.error('Delete error:', err);
        alert('Failed to delete assignment');
      }
    });
  }


drop(event: CdkDragDrop<AssignWork[]>, newStatus: string) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const movedTask = event.container.data[event.currentIndex];

    if (movedTask && movedTask._id) {
      // ✅ Send with capital S
      const updatePayload = { Status: newStatus }; 

      console.log('Updating task with payload:', updatePayload);

      this.assignworkService.updateAssignment(movedTask._id, updatePayload).subscribe({
        next: (res) => {
          console.log('Update success:', res);
          this.getAssignments();
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Failed to update task status. Check backend logs.');
        }
      });
    }
  }

}
}