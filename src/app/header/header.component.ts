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
  isLoading = false;

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

    const timestamp = new Date().getTime();
    
    if (user.photoURL) {
      if (user.photoURL.startsWith('http')) {
        user.photoURL = this.addCacheBuster(user.photoURL, timestamp);
      } else {
        user.photoURL = this.addCacheBuster(`http://localhost:3008/uploads/${user.photoURL}`, timestamp);
      }
    } else if (user.photo) {
      if (user.photo.startsWith('http')) {
        user.photoURL = this.addCacheBuster(user.photo, timestamp);
      } else {
        user.photoURL = this.addCacheBuster(`http://localhost:3008/uploads/${user.photo}`, timestamp);
      }
    } else {
      user.photoURL = 'assets/default-avatar.png';
    }
  }

  private addCacheBuster(url: string, timestamp: number): string {
    if (url.includes('assets/default-avatar.png')) {
      return url;
    }
    return url + (url.includes('?') ? '&' : '?') + `t=${timestamp}`;
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

    this.previewImage = this.getCleanImageUrl(this.userData);
    this.selectedFile = null;
    this.selectedFileName = '';
    this.showEditModal = true;
  }

  private getCleanImageUrl(user: any): string {
    if (user.photoURL) {
      return user.photoURL.split('?')[0]; 
    } else if (user.photo) {
      if (user.photo.startsWith('http')) {
        return user.photo;
      } else {
        return `http://localhost:3008/uploads/${user.photo}`;
      }
    } else {
      return 'assets/default-avatar.png';
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isLoading = false;
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

  removeSelectedImage() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewImage = this.getCleanImageUrl(this.userData);
  }

  saveProfilePicture() {
    if (!this.userData?._id) {
      alert('User not found. Please try logging in again.');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();


    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    } else if (this.previewImage === 'assets/default-avatar.png') {
      formData.append('removePhoto', 'true');
    } else {
      formData.append('keepExistingImage', 'true');
    }

    this.appendUserDataToForm(formData);

    console.log('Updating profile picture for user:', this.userData._id);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        console.log('Profile picture update response:', res);
        this.isLoading = false;
        

        this.updateUserDataFromResponse(res);
        
 
        sessionStorage.setItem('user', JSON.stringify(this.userData));
        

        this.refreshUserData();
        
        this.showEditModal = false;
        this.selectedFile = null;
        this.selectedFileName = '';
        
        alert('Profile picture updated successfully!');
      },
      error: (err: any) => {
        this.isLoading = false;
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

    this.isLoading = true;

    const formData = new FormData();


    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    } else if (this.previewImage === 'assets/default-avatar.png') {
      formData.append('removePhoto', 'true');
    } else {
      formData.append('keepExistingImage', 'true');
    }


    this.appendUserDataToForm(formData);

    console.log('Updating user profile:', this.userData._id);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        console.log('User profile update response:', res);
        this.isLoading = false;


        this.updateUserDataFromResponse(res);
        

        sessionStorage.setItem('user', JSON.stringify(this.userData));
        
   
        this.refreshUserData();
        
        alert('Profile updated successfully!');
        this.showEditModal = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error updating profile:', err);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  private appendUserDataToForm(formData: FormData): void {
    formData.append('userCode', this.userData.userCode || '');
    formData.append('name', this.userData.name || this.userData.UserName || '');
    formData.append('userName', this.userData.userName || this.userData.UserName || '');
    formData.append('emailId', this.userData.emailId || this.userData.Email || '');
    formData.append('phoneNumber', this.userData.phoneNumber || this.userData.Phone || '');
    formData.append('role', this.userData.role || '');
    formData.append('department', this.userData.departmentName || this.userData.department?.departmentName || '');
    formData.append('subDepartment', this.userData.subDepartment || '');
  }

  private updateUserDataFromResponse(res: any): void {

    if (res.photo) {
      this.userData.photo = res.photo;
    }
    if (res.photoURL) {
      this.userData.photoURL = res.photoURL;
    }
    

    if (res.removePhoto === true || (!res.photo && !res.photoURL)) {
      this.userData.photo = null;
      this.userData.photoURL = 'assets/default-avatar.png';
    }


    if (res.name) this.userData.name = res.name;
    if (res.userName) this.userData.userName = res.userName;
    if (res.emailId) this.userData.emailId = res.emailId;
    if (res.phoneNumber) this.userData.phoneNumber = res.phoneNumber;
    if (res.role) this.userData.role = res.role;
    if (res.department) this.userData.department = res.department;
    if (res.subDepartment) this.userData.subDepartment = res.subDepartment;


    this.processUserImage(this.userData);
  }

  private refreshUserData(): void {

    this.userService.getuser().subscribe({
      next: (users: any) => {
        if (Array.isArray(users)) {
          const updatedUser = users.find((u: any) => u._id === this.userData._id);
          if (updatedUser) {
            this.userData = updatedUser;
            this.processUserImage(this.userData);
            sessionStorage.setItem('user', JSON.stringify(this.userData));
          }
        }
      },
      error: (err) => {
        console.error('Error refreshing user data:', err);
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
      this.isLoading = true;

      const formData = new FormData();
      formData.append('removePhoto', 'true');
      this.appendUserDataToForm(formData);

      this.userService.edituser(this.userData._id, formData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          

          this.userData.photo = null;
          this.userData.photoURL = 'assets/default-avatar.png';
          sessionStorage.setItem('user', JSON.stringify(this.userData));
          

          this.previewImage = 'assets/default-avatar.png';
          this.selectedFile = null;
          this.selectedFileName = '';
          

          this.refreshUserData();
          
          alert('Profile picture removed successfully!');
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error removing profile picture:', err);
          alert('Failed to remove profile picture.');
        }
      });
    }
  }
}