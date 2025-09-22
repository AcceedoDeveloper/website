import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { UserservicesService } from '../register/services/userservices.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  onSearch() {}
  onDepartmentChange($event: Event) {}
  
  @ViewChild('loginDropdown') loginDropdown!: ElementRef;

  userData: any = null;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;
  showEditModal = false;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  searchQuery = '';
  hasNotification = false;
  dateTime = '';
  roles: any[] = [];
  departments: any[] = [];
  subDepartmentsData: any[] = [];
  showDropdown = false; 
  dropdownOpen: any;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private userService: UserservicesService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);
  }

  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);

      this.processUserImage(this.userData);

      if (typeof this.userData.role === 'object' && this.userData.role?.role) {
        this.userData.role = this.userData.role.role;
      }
    }
  }

  private processUserImage(user: any): void {
    if (user.photoURL) {

      if (user.photoURL.startsWith('http')) {
        user.photoURL = user.photoURL;
      } else {

        user.photoURL = `http://localhost:3008/uploads/${user.photoURL}`;
      }
    } else if (user.photo) {

      if (user.photo.startsWith('http')) {
        user.photoURL = user.photo;
      } else {
        user.photoURL = `http://localhost:3008/uploads/${user.photo}`;
      }
    } else {

      user.photoURL = 'assets/default-avatar.png';
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    if (
      this.showDropdown &&
      this.loginDropdown &&
      !this.loginDropdown.nativeElement.contains(event.target)
    ) {
      this.showDropdown = false;
    }
  }

  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.previewImage = this.userData?.photoURL || null;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfilePicture() {
    if (!this.userData?._id) {
      alert('User not found. Please try logging in again.');
      return;
    }

    if (!this.selectedFile) {
      alert('Please select a photo to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', this.selectedFile);
    formData.append('userCode', this.userData.userCode || '');
    formData.append('name', this.userData.name || this.userData.UserName || '');
    formData.append('userName', this.userData.userName || this.userData.UserName || '');
    formData.append('emailId', this.userData.emailId || this.userData.Email || '');
    formData.append('phoneNumber', this.userData.phoneNumber || this.userData.Phone || '');
    formData.append('role', this.userData.role || '');
    formData.append('department', this.userData.departmentName || this.userData.department?.departmentName || '');
    formData.append('subDepartment', this.userData.subDepartment || '');
    formData.append('keepExistingImage', 'true');

    console.log('Updating profile picture for user:', this.userData._id);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        console.log('Profile picture update response:', res);
        
        if (res.photo) {
          this.userData.photo = res.photo;
          this.userData.photoURL = `http://localhost:3008/uploads/${res.photo}`;
        } else if (res.photoURL) {
          this.userData.photoURL = res.photoURL;
        }
        
        if (res.photoURL) {
          this.userData.photoURL = res.photoURL;
        }
        
        sessionStorage.setItem('user', JSON.stringify(this.userData));
        
        alert('Profile picture updated successfully!');

        this.showEditModal = false;
        this.previewImage = null;
        this.selectedFile = null;
        this.selectedFileName = '';

        this.getCurrentUser();
      },
      error: (err: any) => {
        console.error('Error updating profile picture:', err);
        
        let errorMessage = 'Failed to update profile picture.';
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        alert(errorMessage);
      }
    });
  }

  updateUserProfile() {
    if (!this.userData?._id) {
      alert('User not found. Please try logging in again.');
      return;
    }

    const formData = new FormData();

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    } else {

      formData.append('keepExistingImage', 'true');
    }


    formData.append('userCode', this.userData.userCode || '');
    formData.append('name', this.userData.name || this.userData.UserName || '');
    formData.append('userName', this.userData.userName || this.userData.UserName || '');
    formData.append('emailId', this.userData.emailId || this.userData.Email || '');
    formData.append('phoneNumber', this.userData.phoneNumber || this.userData.Phone || '');
    formData.append('role', this.userData.role || '');
    formData.append('department', this.userData.departmentName || this.userData.department?.departmentName || '');
    formData.append('subDepartment', this.userData.subDepartment || '');

    console.log('Updating user profile:', this.userData._id);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        console.log('User profile update response:', res);

        if (res.photo) {
          this.userData.photo = res.photo;
        }
        if (res.photoURL) {
          this.userData.photoURL = res.photoURL;
        }
        

        if (res.name) this.userData.name = res.name;
        if (res.userName) this.userData.userName = res.userName;
        if (res.emailId) this.userData.emailId = res.emailId;
        

        sessionStorage.setItem('user', JSON.stringify(this.userData));
        
        alert('Profile updated successfully!');
        this.showEditModal = false;
        this.getCurrentUser();
      },
      error: (err: any) => {
        console.error('Error updating profile:', err);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      sessionStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
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


  removeProfilePicture() {
    if (!this.userData?._id) {
      alert('User not found.');
      return;
    }

    if (confirm('Are you sure you want to remove your profile picture?')) {
      const formData = new FormData();
      formData.append('removePhoto', 'true');
      

      formData.append('userCode', this.userData.userCode || '');
      formData.append('name', this.userData.name || this.userData.UserName || '');
      formData.append('userName', this.userData.userName || this.userData.UserName || '');
      formData.append('emailId', this.userData.emailId || this.userData.Email || '');
      formData.append('phoneNumber', this.userData.phoneNumber || this.userData.Phone || '');
      formData.append('role', this.userData.role || '');
      formData.append('department', this.userData.departmentName || this.userData.department?.departmentName || '');
      formData.append('subDepartment', this.userData.subDepartment || '');

      this.userService.edituser(this.userData._id, formData).subscribe({
        next: (res: any) => {

          this.userData.photo = null;
          this.userData.photoURL = 'assets/default-avatar.png';
  
          sessionStorage.setItem('user', JSON.stringify(this.userData));
          

          this.previewImage = null;
          this.selectedFile = null;
          this.selectedFileName = '';
          
          alert('Profile picture removed successfully!');
        },
        error: (err: any) => {
          console.error('Error removing profile picture:', err);
          alert('Failed to remove profile picture.');
        }
      });
    }
  }
}