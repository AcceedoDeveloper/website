


import { Component, OnInit } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DepartmentDialogComponent } from './department-dialog/department-dialog.component';
import { UserservicesService } from '../register/services/userservices.service';
//import service
import { DepartmentserviceService } from './service/departmentservice.service';
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
    private route:ActivatedRoute
  ) {

    //get data
    this.getdmdata();
  }

  // get department data --> api

  showdm:any;

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
    data: { department } 
  });
}



  //delete dm data

 deletedm(ID: any) {
  if (confirm("Are you sure you want to delete this item?")) {
    this.departmentservices.deletedm(ID).subscribe({
      next: (res) => {
        console.log("Deleted successfully:", res);
        this.getdmdata(); 
      },
      error: (err) => {
        console.error("Error while deleting:", err);
        alert("Failed to delete. Please try again.");
      }
    });
  }
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
          this.userData.photoURL = `http://localhost:3008/uploads/${this.userData.photo}`;
        }
      } else {
        this.userData.photoURL = 'assets/default-avatar.png';
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
        processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photo}`;
      }
    } else {
      processedUser.photoURL = 'assets/default-avatar.png';
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
