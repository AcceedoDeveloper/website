


import { Component, OnInit } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DepartmentDialogComponent } from './department-dialog/department-dialog.component';
import { UserservicesService } from '../register/services/userservices.service';
//import service
import { DepartmentserviceService } from './service/departmentservice.service';
import { ConfigService } from '../service/config.service';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // get id 

@Injectable({
  providedIn: 'root'
})

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) return items;

    const lower = searchText.toLowerCase();

    return items.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(lower)
      )
    );
  }
}
@Component({
  selector: 'app-department',
  
  templateUrl: './department.component.html',
  styleUrl: './department.component.css'
})
export class DepartmentComponent { 
  isNavOpen = false;
    isDropdownOpen=false;
    showrole=false;
  tasks: any[] = [];
  users: any[] = [];
  userData: any = null;
    onNavCheckChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.isNavOpen = target.checked;
    console.log('Hamburger menu toggled, nav open:', this.isNavOpen);
    if (!this.isNavOpen) {
      this.isDropdownOpen = false; 
      console.log('Dropdown closed due to hamburger menu closing');
    }
  }

  task: any = {
    assignee: '',
    description: '',
      priority: '',
    status: 'todo',
    createdAt: null,
    dueDate: null,
    timeEstimate: '',
    attachment: '',
    fileName: ''
  };

  editComment: string = '';
  showTaskBox =false;
  showSuccessMessage = false;
  showUserDropdown = false;
  searchQuery: string = '';
  dropdownOpen = false;
 
  isModalOpen = false;
  selectedTask: any = null;
 
filteredTasks: any[] = [];


  // Profile Edit Modal
  showEditModal = false;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;
subdepartments: string[] = [''];
  currentDateTime: string = '';
  dateTime: string = '';
  hasNotification = false;

  constructor(private dialog: MatDialog,
    private departmentservices:DepartmentserviceService,
    private userserives:UserservicesService,
    private route:ActivatedRoute,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {

    //get data
    this.getdmdata();
  }

  // get department data --> api

  showdm:any;
  isDeleting = false;

  getdmdata()
  {
    this.departmentservices.loaddm().subscribe(data=>
    {
      this.showdm=data;
    }
    )
  }

    userdata:any;
  dmformdata:any;

  // edit
editdepartment(department: any) {
  console.log('Editing department:', department);
  this.dialog.open(DepartmentDialogComponent, {
    width: '80vw',
    height: 'auto',
    maxHeight: '90vh',
    panelClass: 'custom-dialog',
    disableClose:true,
    data: { department } 
  });
}



  //delete dm data
  deletedm(ID: any) {
    if (!ID) {
      console.error('Invalid department ID:', ID);
      this.snackBar.open('Invalid department ID provided', 'Close', { duration: 3000 });
      return;
    }

    // Check if department has any users or sub-departments
    this.checkDepartmentDependencies(ID).then((hasDependencies) => {
      if (hasDependencies) {
        this.snackBar.open('Cannot delete department: It has users or sub-departments', 'Close', { duration: 5000 });
        return;
      }

      // Use Material Dialog for confirmation
      const dialogRef = this.dialog.open(DepartmentDialogComponent, {
        width: '400px',
        height: 'auto',
        data: { 
          mode: 'delete',
          departmentId: ID,
          title: 'Confirm Department Deletion',
          message: 'Are you sure you want to delete this department? This action cannot be undone and will remove all department data.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'confirm') {
          this.performDepartmentDeletion(ID);
        }
      });
    }).catch((error) => {
      console.error('Error checking department dependencies:', error);
      this.snackBar.open('Error checking department dependencies', 'Close', { duration: 3000 });
    });
  }

  private async checkDepartmentDependencies(departmentId: any): Promise<boolean> {
    try {
      // Check if department has any users
      const users = await this.userserives.getuser().toPromise();
      if (Array.isArray(users)) {
        const hasUsers = users.some((user: any) => 
          user.department?._id === departmentId || 
          user.departmentName === departmentId ||
          user.department === departmentId
        );
        if (hasUsers) {
          return true;
        }
      }

      // Check if department has sub-departments
      const departments = await this.departmentservices.loaddm().toPromise();
      if (Array.isArray(departments)) {
        const hasSubDepartments = departments.some((dept: any) => 
          dept.parentDepartment === departmentId || 
          dept.parentId === departmentId
        );
        if (hasSubDepartments) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error fetching department dependencies:', error);
      return false; // Allow deletion if check fails
    }
  }

  private performDepartmentDeletion(ID: any): void {
    this.isDeleting = true;
    
    this.departmentservices.deletedm(ID).subscribe({
      next: (res) => {
        console.log('Department deleted successfully:', res);
        this.snackBar.open('Department deleted successfully!', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.getdmdata(); // Refresh departments list
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Delete operation failed:', err);
        
        let errorMessage = 'Failed to delete department';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 404) {
          errorMessage = 'Department not found';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to delete this department';
        } else if (err.status === 409) {
          errorMessage = 'Cannot delete department: It has users or sub-departments';
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
  }

  ngOnInit(): void {
    this.getCurrentUser();
   
    this.updateTime();
  }


  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }

  toggleTaskBox() {
    this.showTaskBox = !this.showTaskBox;
  }


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  //show role
  getrole()
  {
    this.showrole=!this.showrole;
  }

  

  cancel() {
    this.task = {
      assignee: '',
      description: '',
      status: 'todo',
      createdAt: null,
      dueDate: null,
      timeEstimate: '',
      attachment: ''
    };
    this.showTaskBox = false;
  }

 onSearch() {
  const query = this.searchQuery.toLowerCase();
  this.filteredTasks = this.tasks.filter(task =>
    task.description.toLowerCase().includes(query)
  );
}

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.task.attachment = file.name;
    }
  }

  onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    this.task.attachment = file;
    this.task.fileName = file.name;
  }
}

  fetchTasks() {
  
  }


  selectAssignee(user: any) {
    this.task.assignee =
      user.username ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email;
    this.showUserDropdown = false;
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  addTask() {
   
  }

  deleteTask(task: any) {
   
  }

  openEditModal(task: any) {
    this.selectedTask = { ...task };
    this.editComment = task.description;
    this.isModalOpen = true;
  }

  saveEdit() {
    if (!this.selectedTask || !this.editComment) return;

   
  }

  closeModal() {
    this.isModalOpen = false;
  }

  markAsCompleted(task: any) {
   
  }

  // Profile Modal Methods
  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfilePicture() {
   
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
        this.editUserData.photoURL = this.previewImage;
      };
      reader.readAsDataURL(file);
    }
  }

  signOut() {
    
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  createdepartment()
  {

  }

  showdepartment() {
    this.dialog.open(DepartmentDialogComponent, {
    width: '80vw',
    disableClose:true,
      // maxHeight: '60vh',
      panelClass: 'custom-dialog',
      data: {} 


});

  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      
      // Process user image URL
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

  getuserdata() {
    this.userserives.getuser().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.userdata = data.map((user: any) => this.processUserImage(user));
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data)];
        } else {
          console.warn('Unexpected response format:', data);
          this.userdata = [];
        }
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userdata = [];
      }
    });
  }

  private processUserImage(user: any): any {
    const processedUser = { ...user };
    
    if (processedUser.photo) {
      if (processedUser.photo.startsWith('http')) {
        processedUser.photoURL = processedUser.photo;
      } else {
        processedUser.photoURL = this.configService.getUploadUrl(processedUser.photo);
      }
    } else {
      // processedUser.photoURL = 'assets/default-avatar.png';
    }
    
    return processedUser;
  }



















  createcancel(){
    alert('You dont create department');
  }

  getdepartment()
  {

  }

  addSubDepartment() {
    this.subdepartments.push(''); // Add a new empty input field
  }
}
