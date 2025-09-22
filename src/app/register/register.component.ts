import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { RegistermatComponent } from './registermat/registermat.component';
import { MatDialog } from '@angular/material/dialog';
import { UserservicesService } from './services/userservices.service';

import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../service/auth.service.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  [x: string]: any;
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
  selectedFile: File | null = null;
  showcreateuser = false;
  showuser = true;
  openMenu: string | null = null;
  userRole: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  authService: any;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedUsers: any[] = [];
  filteredUsers: any[] = [];
  searchQuery = '';
  showEllipsis = false;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore, 
    private router: Router,
    private dialog: MatDialog,
    private userserives: UserservicesService,
    private route: ActivatedRoute,
  ) {
    this.getuserdata();
  }

  userdata: any;

  isNavOpen = false;
  isDropdownOpen = false;
  showrole = false;
  tasks: any[] = [];
  users: any[] = [];
  userData: any = null;

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.itemsPerPage, this.filteredUsers.length);
  }

  get totalItems(): number {
    return this.filteredUsers.length;
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
    
    this.paginatedUsers = this.filteredUsers.slice(this.startIndex, this.endIndex);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (this.totalPages <= maxVisiblePages) {

      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      this.showEllipsis = false;
    } else {

      pages.push(1);
      

      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
      

      if (this.currentPage <= 3) {
        endPage = 4;
      }
      
     
      if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - 3;
      }
      

      if (startPage > 2) {
        this.showEllipsis = true;
      } else {
        this.showEllipsis = false;
      }
      
 
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      

      if (endPage < this.totalPages - 1) {
        this.showEllipsis = true;
      }
      

      pages.push(this.totalPages);
    }
    
    return pages;
  }

  filterUsers() {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.userdata];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.userdata.filter((user: any) => 
        (user.UserName && user.UserName.toLowerCase().includes(query)) ||
        (user.emailId && user.emailId.toLowerCase().includes(query)) ||
        (user.role?.role && user.role.role.toLowerCase().includes(query)) ||
        (user.department?.departmentName && user.department.departmentName.toLowerCase().includes(query)) ||
        (user.subDepartment && user.subDepartment.toLowerCase().includes(query)) ||
        (user.phoneNumber && user.phoneNumber.includes(query))
      );
    }
    
    this.currentPage = 1;
    this.updatePagination();
  }


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
  showTaskBox = false;
  showSuccessMessage = false;
  showUserDropdown = false;
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
    this.updateTime();
    this.getCurrentUser();
    this.getuserdata();
    
    setInterval(() => {
      this.updateTime();
    }, 60000);
  }

  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toLocaleString();
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      
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
          this.filteredUsers = [...this.userdata];
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data)];
          this.filteredUsers = [...this.userdata];
        } else {
          console.warn('Unexpected response format:', data);
          this.userdata = [];
          this.filteredUsers = [];
        }
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userdata = [];
        this.filteredUsers = [];
        this.updatePagination();
      }
    });
  }


editUser(item: any) {
  const dialogRef = this.dialog.open(RegistermatComponent, {
    width: '80vw',
    height: 'auto',
    maxHeight: '90vh',
    panelClass: 'custom-dialog',
    data: { item }
  });
  
  dialogRef.afterClosed().subscribe((updatedUser: any) => {
    if (updatedUser) {

      const index = this.userdata.findIndex((u: any) => u._id === updatedUser._id);
      if (index !== -1) {

        const processedUser = this.processUserImage(updatedUser);
        this.userdata[index] = processedUser;
        

        const filteredIndex = this.filteredUsers.findIndex((u: any) => u._id === updatedUser._id);
        if (filteredIndex !== -1) {
          this.filteredUsers[filteredIndex] = processedUser;
        }
        

        this.updatePagination();
      }
      

      if (this.userData && this.userData._id === item._id) {
        this.updateCurrentUserData(updatedUser);
      }
    }
  });
}


private updateCurrentUserData(updatedUser: any): void {

  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    const userData = JSON.parse(userStr);
    const updatedUserData = {
      ...userData,
      photoURL: updatedUser.photoURL || userData.photoURL,
      photo: updatedUser.photo || userData.photo
    };
    sessionStorage.setItem('user', JSON.stringify(updatedUserData));
    

    this.userData = updatedUserData;
  }
}

private processUserImage(user: any): any {
  const processedUser = { ...user };
  

  if (processedUser.photoURL) {

    if (processedUser.photoURL.startsWith('http')) {
      processedUser.photoURL = processedUser.photoURL;
    } else {

      processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photoURL}`;
    }
  } 

  else if (processedUser.photo) {
    if (processedUser.photo.startsWith('http')) {
      processedUser.photoURL = processedUser.photo;
    } else {
      processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photo}`;
    }
  } 
  else {
    processedUser.photoURL = 'assets/default-avatar.png';
  }
  
  return processedUser;
}

  deleteUser(ID: any) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userserives.deleteuser(ID).subscribe({
        next: (res) => {
          console.log('User deleted successfully:', res);
          this.getuserdata();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

showcreateuserss() {
  const dialogRef = this.dialog.open(RegistermatComponent, {
    width: '90vw',
    maxWidth: '65vw',
    height: '90vh',
    maxHeight: '90vh',
    panelClass: 'custom-dialog',
    data: {}
  });
  
  dialogRef.afterClosed().subscribe((newUser: any) => {
    if (newUser) {
      const processedUser = this.processUserImage(newUser);
      this.userdata.unshift(processedUser);
      this.filteredUsers.unshift(processedUser);
      

      this.updatePagination();
    }
  });
}


  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
  }

    toggleTaskBox() {
      this.showTaskBox = !this.showTaskBox;
    }
  
  
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    }
  

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
  
  
    fetchUsers() {
      this.afs
        .collection('users')
        .valueChanges({ idField: 'id' })
        .subscribe((users) => {
          this.users = users;
        });
    }
  


  
    openEditModal(task: any) {
      this.selectedTask = { ...task };
      this.editComment = task.description;
      this.isModalOpen = true;
    }
  
    closeModal() {
      this.isModalOpen = false;
    }
  
    openEditProfile() {
      this.editUserData = { ...this.userData };
      this.showEditModal = true;
    }
  
    closeEditModal() {
      this.showEditModal = false;
    }
saveProfilePicture() {
  if (!this.selectedFile) return;

  const filePath = `profileImages/${this.userData.uid}_${Date.now()}_${this.selectedFile.name}`;
  const fileRef = this['storage'].ref(filePath);
  const task = this['storage'].upload(filePath, this.selectedFile);

  task.snapshotChanges().pipe(
    finalize(() => {
      fileRef.getDownloadURL().subscribe((url: string) => {

        this.afs.collection('users').doc(this.userData.uid)
          .update({ photoURL: url })
          .then(() => {
            console.log('✅ Profile image updated in Firestore');
            this.userData = {
              ...this.userData,
              photoURL: url
            };

            this.editUserData = {
              ...this.editUserData,
              photoURL: url
            };

            sessionStorage.setItem('user', JSON.stringify(this.userData));

            this.selectedFile = null;
            this.showEditModal = false;

          })
          .catch(err => console.error('❌ Firestore update error', err));
      });
    })
  ).subscribe();
}


  

onPhotoSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result;
      this.editUserData = {
        ...this.editUserData,
        photoURL: this.previewImage
      };
      this.userData = {
        ...this.userData,
        photoURL: this.previewImage
      };
    };
    reader.readAsDataURL(file);
  }
}


  
    signOut() {
      this.afAuth.signOut();
    }
  

  
    getInitials(name: string): string {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
  
  onSubmit(form: any) {
    if (form.valid && this.user.password === this.confirmPassword) {
      this.afAuth.createUserWithEmailAndPassword(this.user.email, this.user.password)
      
        .then((userCredential) => {
          const uid = userCredential.user?.uid;
          if (uid) {
            const userData = {
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              email: this.user.email,
              mobile: this.user.mobile,
              role: this.user.role,
              username: this.user.username,
              password: this.user.password
            };

            

            this.firestore.collection('users').doc(uid).set(userData).then(() => {
              console.log('User data saved to Firestore!');

              sessionStorage.setItem('uid', uid);
              sessionStorage.setItem('username', `${this.user.firstName} ${this.user.lastName}`);
              sessionStorage.setItem('email', this.user.email);
              sessionStorage.setItem('role', this.user.role);

              this.formSubmitted = true;
              setTimeout(() => {
                this.router.navigate(['/register']);
              }, 1000);
            });
          }
        })
        .catch(error => {
          console.error('Error during Firebase Auth or Firestore:', error);
        });
    } else {
      console.log('Form not valid or passwords do not match.');
    }
  }
}


function finalize(arg0: () => void): any {
  throw new Error('Function not implemented.');
}

