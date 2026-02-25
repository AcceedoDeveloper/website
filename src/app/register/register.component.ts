import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserservicesService } from './services/userservices.service';
import { ConfigService } from '../service/config.service';
import { ActivatedRoute } from '@angular/router';
import { RegistermatComponent } from './registermat/registermat.component';
import { HeaderComponent } from '../header/header.component';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
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

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedUsers: any[] = [];
  filteredUsers: any[] = [];
  searchQuery = '';
  showEllipsis = false;

  userdata: any;
  isNavOpen = false;
  isDropdownOpen = false;
  showrole = false;
  tasks: any[] = [];
  users: any[] = [];
  userData: any = null;
  isDeleting = false;

  constructor(
   
    private router: Router,
    private dialog: MatDialog,
    private userserives: UserservicesService,
    private configService: ConfigService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.getuserdata();
  }

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
    if (!this.isNavOpen) {
      this.isDropdownOpen = false;
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
      
      // Process user image URL
      if (this.userData.photo) {
        if (this.userData.photo.startsWith('http')) {
          this.userData.photoURL = this.userData.photo;
        } else {
          this.userData.photoURL = this.configService.getUploadUrl(this.userData.photo);
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
          this.userdata = data.map((user: any) => this.processUserImage(user, false));
          this.filteredUsers = [...this.userdata];
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data, false)];
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
      width: '90vw',
      maxWidth: '65vw',
      height: '90vh',
      maxHeight: '90vh',
      disableClose:true,
      panelClass: 'custom-dialog',
      data: { item }
    });
    
    dialogRef.afterClosed().subscribe((updatedUser: any) => {
      if (updatedUser) {
        console.log('Updated user received:', updatedUser);
        const processedUser = this.processUserImage(updatedUser, false);
        const index = this.userdata.findIndex((u: any) => u._id === updatedUser._id);
        if (index !== -1) {
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
        setTimeout(() => {
          this.getuserdata();
        }, 100);
      }
    });
  }

  private updateCurrentUserData(updatedUser: any): void {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      const updatedUserData = {
        ...userData,
        ...updatedUser,
        photoURL: this.getImageUrl(updatedUser),
        photo: updatedUser.photo || userData.photo
      };
      
      sessionStorage.setItem('user', JSON.stringify(updatedUserData));
      this.userData = updatedUserData;
    }
  }

  private processUserImage(user: any, isCurrentUser: boolean): any {
    const processedUser = { ...user };
    processedUser.photoURL = this.getImageUrl(user);
    return processedUser;
  }

  private getImageUrl(user: any): string {
    if (user.photoURL) {
      return user.photoURL;
    } else if (user.photo) {
      if (user.photo.startsWith('http')) {
        return user.photo;
      } else {
        return this.configService.getUploadUrl(user.photo);
      }
    } else {
      return 'assets/default-avatar.png';
    }
  }

  deleteUser(ID: any) {

if (!ID) {

this.snackBar.open('Invalid user ID', 'Close', { duration: 3000 });

return;

}

const dialogRef = this.dialog.open(RegistermatComponent, {

width: '400px',

data: {

isDeleteMode: true,   // ✅ FIXED

item: { _id: ID },

title: 'Confirm User Deletion',

message: 'Are you sure you want to delete this user?'

}

});

dialogRef.afterClosed().subscribe(result => {

if (result === 'confirm') {

this.performUserDeletion(ID);

}

});

}

  private async checkUserDependencies(userId: any): Promise<boolean> {
    try {
      // Check if user has any active tasks or projects
      // This is a placeholder - you would implement actual dependency checks based on your business logic
      // For example, check if user has assigned tasks, projects, etc.
      return false; // For now, allow deletion
    } catch (error) {
      console.error('Error fetching user dependencies:', error);
      return false; // Allow deletion if check fails
    }
  }

  private performUserDeletion(ID: any): void {
    this.isDeleting = true;
    
    this.userserives.deleteuser(ID).subscribe({
      next: (res) => {
        console.log('User deleted successfully:', res);
        this.snackBar.open('User deleted successfully!', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.getuserdata(); // Refresh users list
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Delete operation failed:', err);
        
        let errorMessage = 'Failed to delete user';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 404) {
          errorMessage = 'User not found';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to delete this user';
        } else if (err.status === 409) {
          errorMessage = 'Cannot delete user: User has active tasks or projects';
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

  showcreateuserss() {
    const dialogRef = this.dialog.open(RegistermatComponent, {
      width: '90vw',
      maxWidth: '65vw',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      disableClose:true,
      data: {}
    });
    
    dialogRef.afterClosed().subscribe((newUser: any) => {
      if (newUser) {
        console.log('New user created:', newUser);
        const processedUser = this.processUserImage(newUser, false);
        this.userdata.unshift(processedUser);
        this.filteredUsers.unshift(processedUser);
        this.updatePagination();
        setTimeout(() => {
          this.getuserdata();
        }, 100);
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

  getrole() {
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
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  onSubmit(form: any) {
  
  }
} 