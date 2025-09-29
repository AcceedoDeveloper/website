


import { Component, OnInit } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';


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
  selector: 'app-loginheader',
  templateUrl: './loginheader.component.html',
  styleUrl: './loginheader.component.css'
})
export class LoginheaderComponent {
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

  currentDateTime: string = '';
  dateTime: string = '';
  hasNotification = false;



  constructor() {}
  // function

   onSearch() {
  const query = this.searchQuery.toLowerCase();
  this.filteredTasks = this.tasks.filter(task =>
    task.description.toLowerCase().includes(query)
  );
}
  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchTasks();
    this.fetchUsers();
    this.updateTime();
     this.fetchTasks();
  }
 fetchTasks() {
  
  }
fetchUsers() {
    
  }
  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }

  // Profile Modal Methods
  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }
 getCurrentUser() {
    
  }

     newTask = {
       
      };

      // Profile Modal Methods
    

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

    getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
getrole()
{
  
}
   signOut() {
    
  }
 
}
