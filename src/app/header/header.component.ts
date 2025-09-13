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
onSearch() {
throw new Error('Method not implemented.');
}
onDepartmentChange($event: Event) {
throw new Error('Method not implemented.');
}
  @ViewChild('loginDropdown') loginDropdown!: ElementRef;

  userData: any = null;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;
  showEditModal = false;
  selectedFile: File | null = null;

  searchQuery = '';
  hasNotification = false;
  dateTime = '';
  roles: any;
  departments: any;
  subDepartmentsData: any;
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

      if (this.userData.photo) {
        if (this.userData.photo.startsWith('http')) {
          this.userData.photoURL = this.userData.photo;
        } else {
          this.userData.photoURL = `http://localhost:3008/uploads/${this.userData.photo}`;
        }
      } else {
        this.userData.photoURL = 'assets/default-avatar.png';
      }

      if (typeof this.userData.role === 'object' && this.userData.role?.role) {
        this.userData.role = this.userData.role.role;
      }
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
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedFile = null;
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfilePicture() {
    if (!this.userData?._id || !this.selectedFile) {
      alert('No file selected or user not found.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', this.selectedFile);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        if (res.photo) {
          this.userData.photo = res.photo;
          this.userData.photoURL = `http://localhost:3008/uploads/${res.photo}`;
        }
        sessionStorage.setItem('user', JSON.stringify(this.userData));
        this.showEditModal = false;
        this.previewImage = null;
        this.selectedFile = null;
      },
      error: (err: any) => {
        console.error(err);
        alert('Failed to update profile picture.');
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
}
