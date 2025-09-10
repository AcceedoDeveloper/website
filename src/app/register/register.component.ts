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
@Injectable({
  providedIn: 'root'
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

  // Pagination properties
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

  // Pagination methods
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
    
    // Ensure current page is within valid range
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
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      this.showEllipsis = false;
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of page range
      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust if we're at the beginning
      if (this.currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're at the end
      if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        this.showEllipsis = true;
      } else {
        this.showEllipsis = false;
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < this.totalPages - 1) {
        this.showEllipsis = true;
      }
      
      // Always show last page
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

  // Rest of your existing methods remain the same...
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

  editUser(item: any) {
    this.dialog.open(RegistermatComponent, {
      width: '80vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: { item }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getuserdata();
      }
    });
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
    this.dialog.open(RegistermatComponent, {
      width: '90vw',
      maxWidth: '65vw',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: {}
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getuserdata();
      }
    });
  }

  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
  }

  // ... rest of your existing methods
}