import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import{RoledialogComponent} from './roledialog/roledialog.component';
import{RoleserviceService} from '../service/roleservice.service';
import { UserservicesService } from '../register/services/userservices.service';
import { Injectable } from '@angular/core';
// for edit --> get id
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrl: './role.component.css'
})
@Injectable({
  providedIn: 'root'
})
export class RoleComponent {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: '',
    username: '',
    password: ''
  };

  confirmPassword = '';
  formSubmitted = false;

  showPassword = false;
  showConfirmPassword = false;

    // form edit
roleid:any;
  userService: any;

  constructor(
   
    private router: Router,
    private dialog: MatDialog,
    private roleservices:RoleserviceService,
    private userserives:UserservicesService,
     private route:ActivatedRoute,
     private snackBar: MatSnackBar
     
   
  ) {

    //get data
    this.Loadroledata();


      

  }

  //getrole api ---> get

  roledata:any;

  Loadroledata()
  {
this.roleservices.Loadrole().subscribe(data => 
    {
this.roledata=data;
    }
    )
  }

  //edit data

 


editroles:any;


//delete role

 deleterole(ID: any) {
    if (!ID) {
      console.error(' Invalid role ID:', ID);
      this.snackBar.open('Invalid role ID', 'Close', { duration: 3000 });
      return;
    }

    
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleservices.deleterole(ID).subscribe({
        next: (data) => {
          console.log(' Role deleted:', data);
          this.snackBar.open('Role deleted successfully!', 'Close', { duration: 3000 });
          this.Loadroledata(); // Refresh roles list
        },
        error: (err) => {
          console.error('Delete failed:', JSON.stringify(err, null, 2));
          this.snackBar.open(`Failed to delete role: ${err.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    }
  }





  userdata:any;


  //role 


    isNavOpen = false;
      isDropdownOpen=false;
      
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
  

    showEditModal = false;
    editUserData: any = {};
    previewImage: string | ArrayBuffer | null = null;
  
    currentDateTime: string = '';
    dateTime: string = '';
    hasNotification = false;
  
  
   
    ngOnInit(): void {
      this.getCurrentUser();
      this.getCurrentUser();
      this.fetchUsers();
      this.updateTime();

       
  console.log('🔎 Role from Firestore/UserData:', this.userData?.role);
  console.log('🔎 Role from SessionStorage:', sessionStorage.getItem('role'));
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
  
 

  getrole() {
  const dialogRef = this.dialog.open(RoledialogComponent, {
    width: 'auto',
   
    height: 'auto',
    maxHeight: 'auto',
    panelClass: 'custom-dialog',
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.Loadroledata(); 
    }
  });
}

  
editrole(role: any) {
  console.log(role);
  const dialogRef = this.dialog.open(RoledialogComponent, {
    width: 'auto',
    height: 'auto',
    maxHeight: 'auto',
    panelClass: 'custom-dialog',
    data: { role }  
  });


  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.Loadroledata();
    }
  });
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
  
  
    fetchUsers() {
     
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


isAdmin(): boolean {
 
  const role = sessionStorage.getItem('role') || this.userData?.role || '';
  return role?.toLowerCase() === 'admin';
}

 onSubmit(form: any) {
    if (form.valid && this.user.password === this.confirmPassword) {
      this.userService.createUser(this.user).subscribe({
        next: (res: any) => {
          console.log('✅ User created:', res);

     
          sessionStorage.setItem('role', this.user.role);
          sessionStorage.setItem('username', `${this.user.firstName} ${this.user.lastName}`);
          sessionStorage.setItem('email', this.user.email);

          this.snackBar.open('User created successfully!', 'Close', { duration: 3000 });

          this.formSubmitted = true;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        },
        error: (err: { error: { message: any; }; }) => {
          console.error('❌ Error creating user:', err);
          this.snackBar.open(err.error?.message || 'User creation failed', 'Close', { duration: 5000 });
        }
      });
    } else {
      this.snackBar.open('Form invalid or passwords do not match!', 'Close', { duration: 3000 });
    }
  }
}

  
 
