import { Component, ElementRef, HostListener, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserservicesService } from '../register/services/userservices.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { ConfigService } from '../service/config.service';
import { RoleserviceService } from '../service/roleservice.service';
import { DepartmentserviceService } from '../department/service/departmentservice.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  onSearch() {}

  
  
  onDepartmentChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedDepartment = target.value;
    
    console.log('Department changed to:', selectedDepartment);
    
    // Update the form data
    this.editUserData.departmentName = selectedDepartment;
    
    if (selectedDepartment) {
      // Load sub-departments for the selected department
      this.loadSubDepartmentsForDepartment(selectedDepartment);
      
      // Clear sub-department selection if it doesn't belong to the new department
      if (this.editUserData.subDepartmentName) {
        const subDeptExists = this.subDepartmentsData.some((sd: any) => sd.name === this.editUserData.subDepartmentName);
        if (!subDeptExists) {
          this.editUserData.subDepartmentName = '';
        }
      }
    } else {
      this.subDepartmentsData = [];
      this.editUserData.subDepartmentName = '';
    }
  }
  
  @ViewChild('loginDropdown') loginDropdown!: ElementRef;

  userData: any = null;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;
  showEditModal = false;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  searchQuery = '';
  hasNotification = false;
  notificationCount = 0;
  todaysTasks: AssignWork[] = [];
  showNotificationPopup = false;
  dateTime = '';
  roles: any[] = [];
  departments: any[] = [];
  subDepartmentsData: any[] = [];
  showDropdown = false; 
  dropdownOpen: any;
  isLoading = false;
  showWelcomeCard=true;
  sidebarOpen = false;
  navSections: { [key: string]: boolean } = {
    admin: false,
    development: false,
    tools: false,
    resources: false
  };
  private subscriptions = new Subscription();

  constructor(
    
    private router: Router,
    private userService: UserservicesService,
    private assignWorkService: AssignWorkService,
    private elementRef: ElementRef,
    private configService: ConfigService,
    private roleService: RoleserviceService,
    private departmentService: DepartmentserviceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);
    
    // Load tasks after a short delay to ensure user data is loaded
    setTimeout(() => {
      this.loadTodaysTasks();
    }, 1000);

    // Start auto-refresh for notifications
    this.startNotificationAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  loadTodaysTasks() {
    if (!this.userData) {
      return;
    }

    const subscription = this.assignWorkService.getAssignments().subscribe({
      next: (res: any) => {
        let allAssignments: AssignWork[] = [];
        
        if (Array.isArray(res)) {
          allAssignments = res;
        } else if (res?.works && Array.isArray(res.works)) {
          allAssignments = res.works;
        } else if (res?.data && Array.isArray(res.data)) {
          allAssignments = res.data;
        } else if (res?.assignments && Array.isArray(res.assignments)) {
          allAssignments = res.assignments;
        } else {
          // Try to find any array property
          for (const key in res) {
            if (Array.isArray(res[key])) {
              allAssignments = res[key];
              break;
            }
          }
        }

        // Filter tasks assigned to current user for today
        this.todaysTasks = this.filterTodaysTasks(allAssignments);
        this.updateNotificationStatus();
      },
      error: (err) => {
        console.error('Error loading tasks for notifications:', err);
        this.todaysTasks = [];
        this.updateNotificationStatus();
      }
    });

    this.subscriptions.add(subscription);
  }

  private filterTodaysTasks(allAssignments: AssignWork[]): AssignWork[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all possible user identifiers
    const userIdentifiers = [
      this.userData?.username,
      this.userData?.UserName,
      this.userData?.userName,
      this.userData?.email,
      this.userData?.emailId,
      this.userData?.userCode
    ].filter(Boolean); // Remove null/undefined values
    
    return allAssignments.filter(task => {
      // Check if task is assigned to current user - focus on assignee field
      const isAssignedToUser = userIdentifiers.some(userId => {
        return String(task.assignee) === String(userId);
      });
      
      if (!isAssignedToUser) {
        return false;
      }

      // Check if task is due today, was created today, or is active
      const isTodayTask = this.isTaskForToday(task, today);
      
      return isTodayTask;
    });
  }

  private isTaskForToday(task: AssignWork, today: Date): boolean {
    // Check if task is due today
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate.getTime() === today.getTime()) {
        return true;
      }
    }

    // Check if task was created today
    if (task.createdAt) {
      const createdDate = new Date(task.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      if (createdDate.getTime() === today.getTime()) {
        return true;
      }
    }

    // Check if task has start date today
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() === today.getTime()) {
        return true;
      }
    }

    // Only show tasks that have a specific date assigned for today
    // Don't show all active tasks - only those specifically assigned for today
    return false;
  }

  private updateNotificationStatus() {
    this.notificationCount = this.todaysTasks.length;
    this.hasNotification = this.notificationCount > 0;
  }

  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
  }

  onNotificationClick() {
    this.toggleNotificationPopup();
  }

  private processUserImage(user: any): void {

    const timestamp = new Date().getTime();
    
    if (user.photoURL) {
      if (user.photoURL.startsWith('http')) {
        user.photoURL = this.addCacheBuster(user.photoURL, timestamp);
      } else {
        user.photoURL = this.addCacheBuster(this.configService.getUploadUrl(user.photoURL), timestamp);
      }
    } else if (user.photo) {
      if (user.photo.startsWith('http')) {
        user.photoURL = this.addCacheBuster(user.photo, timestamp);
      } else {
        user.photoURL = this.addCacheBuster(this.configService.getUploadUrl(user.photo), timestamp);
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

  onOverlayClick(event: MouseEvent) {
    // Only close if clicking on the overlay background (not on the content)
    if (event.target === event.currentTarget) {
      this.showDropdown = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close dropdown when clicking outside
    if (
      this.showDropdown &&
      this.loginDropdown &&
      !this.loginDropdown.nativeElement.contains(target)
    ) {
      this.showDropdown = false;
    }
    
    // Close notification popup when clicking outside
    const notificationElement = this.elementRef.nativeElement.querySelector('.notification-icon');
    if (
      this.showNotificationPopup &&
      notificationElement &&
      !notificationElement.contains(target)
    ) {
      this.showNotificationPopup = false;
    }
    
    // Close sidebar when clicking outside
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    
    if (this.sidebarOpen && 
        !sidebar?.contains(target) && 
        !toggleButton?.contains(target)) {
      this.closeSidebar();
    }
  }


  private getCleanImageUrl(user: any): string {
    if (user.photoURL) {
      return user.photoURL.split('?')[0]; 
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

  openEditProfile() {
    console.log('Opening edit profile for user:', this.userData);
    
    // Load roles and departments first
    this.loadRolesAndDepartments();
    
    // Reset form data
    this.editUserData = {};
    
    // Map user data to form fields with comprehensive fallbacks
    this.editUserData = {
      name: this.getUserField('name') || this.getUserField('UserName') || this.getUserField('firstName') || '',
      userName: this.getUserField('userName') || this.getUserField('UserName') || this.getUserField('username') || '',
      userCode: this.getUserField('userCode') || this.getUserField('UserCode') || '',
      role: this.getRoleValue(this.userData?.role) || '',
      emailId: this.getUserField('emailId') || this.getUserField('Email') || this.getUserField('email') || '',
      phoneNumber: this.getUserField('phoneNumber') || this.getUserField('Phone') || this.getUserField('mobile') || '',
      departmentName: this.getDepartmentName() || '',
      subDepartmentName: this.getSubDepartmentName() || '',
      password: '' // Don't populate password for security
    };

    console.log('Mapped edit user data:', this.editUserData);

    // Set up image preview
    this.previewImage = this.getCleanImageUrl(this.userData);
    this.selectedFile = null;
    this.selectedFileName = '';
    
    // Show modal
    this.showEditModal = true;
  }

  private getUserField(fieldName: string): string {
    if (!this.userData) return '';
    return this.userData[fieldName] || '';
  }

  private getDepartmentName(): string {
    if (!this.userData) return '';
    
    // Try different possible department field names
    if (this.userData.departmentName) return this.userData.departmentName;
    if (this.userData.department?.departmentName) return this.userData.department.departmentName;
    if (this.userData.Department) return this.userData.Department;
    if (this.userData.department) return String(this.userData.department);
    
    return '';
  }

  private getSubDepartmentName(): string {
    if (!this.userData) return '';
    
    // Try different possible sub-department field names
    if (this.userData.subDepartmentName) return this.userData.subDepartmentName;
    if (this.userData.subDepartment) return this.userData.subDepartment;
    if (this.userData.SubDepartment) return this.userData.SubDepartment;
    if (this.userData.department?.subDepartments?.[0]?.name) return this.userData.department.subDepartments[0].name;
    
    return '';
  }

  loadRolesAndDepartments() {
    console.log('Loading roles and departments...');
    
    // Load roles
    this.roleService.Loadrole().subscribe({
      next: (roles: any) => {
        console.log('Roles loaded:', roles);
        this.roles = Array.isArray(roles) ? roles : (roles?.roles || []);
        
        // If user has a role, ensure it's properly set in editUserData
        if (this.editUserData.role && this.roles.length > 0) {
          const userRoleValue = this.getRoleValue(this.userData?.role);
          if (userRoleValue) {
            this.editUserData.role = userRoleValue;
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading roles:', err);
        this.roles = [];
      }
    });

    // Load departments
    this.departmentService.loaddm().subscribe({
      next: (departments: any) => {
        console.log('Departments loaded:', departments);
        this.departments = Array.isArray(departments) ? departments : (departments?.departments || []);
        
        // Load sub-departments if user has a department selected
        if (this.editUserData.departmentName && this.departments.length > 0) {
          this.loadSubDepartmentsForDepartment(this.editUserData.departmentName);
        }
      },
      error: (err: any) => {
        console.error('Error loading departments:', err);
        this.departments = [];
      }
    });
  }

  private loadSubDepartmentsForDepartment(departmentName: string) {
    const department = this.departments.find((dept: any) => dept.departmentName === departmentName);
    if (department && department.subDepartments) {
      this.subDepartmentsData = department.subDepartments;
      console.log('Sub-departments loaded for', departmentName, ':', this.subDepartmentsData);
    } else {
      this.subDepartmentsData = [];
    }
  }

  closeEditModal() {
    console.log('Closing edit modal');
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isLoading = false;
    
    // Reset form data
    this.editUserData = {};
    this.subDepartmentsData = [];
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Photo selected:', file.name, 'Size:', file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }
      
      this.selectedFile = file;
      this.selectedFileName = file.name;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
        console.log('Image preview loaded');
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
    console.log('Saving profile with data:', this.editUserData);
    
    if (!this.userData?._id) {
      alert('User not found. Please try logging in again.');
      return;
    }

    // Basic form validation
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const formData = new FormData();

    // Handle profile image
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
      console.log('Adding new photo file:', this.selectedFile.name);
    } else if (this.previewImage === 'assets/default-avatar.png') {
      formData.append('removePhoto', 'true');
      console.log('Removing profile photo');
    } else {
      formData.append('keepExistingImage', 'true');
      console.log('Keeping existing image');
    }

    // Append user data to form
    this.appendUserDataToForm(formData);

    console.log('Updating profile picture for user:', this.userData._id);

    this.userService.edituser(this.userData._id, formData).subscribe({
      next: (res: any) => {
        console.log('Profile picture update response:', res);
        this.isLoading = false;
        
        // Update user data from response
        this.updateUserDataFromResponse(res);
        
        // Update session storage
        sessionStorage.setItem('user', JSON.stringify(this.userData));
        
        // Refresh user data
        this.refreshUserData();
        
        // Close modal and reset form
        this.showEditModal = false;
        this.selectedFile = null;
        this.selectedFileName = '';
        
        this.openSnackBar('Profile updated successfully!', 'Close');
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error updating profile picture:', err);
        
        let errorMessage = 'Failed to update profile.';
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.openSnackBar(errorMessage, 'Close', 'error');
      }
    });
  }

  updateUserProfile() {
    if (!this.userData?._id) {
      this.openSnackBar('User not found. Please try logging in again.', 'Close', 'error');
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
        
        this.openSnackBar('Profile updated successfully!', 'Close');
        this.showEditModal = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error updating profile:', err);
        this.openSnackBar('Failed to update profile. Please try again.', 'Close', 'error');
      }
    });
  }

  private appendUserDataToForm(formData: FormData): void {
    formData.append('userCode', this.editUserData.userCode || '');
    formData.append('name', this.editUserData.name || '');
    formData.append('userName', this.editUserData.userName || '');
    formData.append('emailId', this.editUserData.emailId || '');
    formData.append('phoneNumber', this.editUserData.phoneNumber || '');
    formData.append('role', this.editUserData.role || '');
    formData.append('department', this.editUserData.departmentName || '');
    formData.append('subDepartment', this.editUserData.subDepartmentName || '');
    if (this.editUserData.password) {
      formData.append('password', this.editUserData.password);
    }
  }

  private updateUserDataFromResponse(res: any): void {
    // Update photo data
    if (res.photo) {
      this.userData.photo = res.photo;
    }
    if (res.photoURL) {
      this.userData.photoURL = res.photoURL;
    }
    
    // Handle photo removal
    if (res.removePhoto === true || (!res.photo && !res.photoURL)) {
      this.userData.photo = null;
      this.userData.photoURL = 'assets/default-avatar.png';
    }

    // Update user profile data from editUserData (the form data)
    if (this.editUserData.name) this.userData.name = this.editUserData.name;
    if (this.editUserData.userName) this.userData.userName = this.editUserData.userName;
    if (this.editUserData.userCode) this.userData.userCode = this.editUserData.userCode;
    if (this.editUserData.emailId) this.userData.emailId = this.editUserData.emailId;
    if (this.editUserData.phoneNumber) this.userData.phoneNumber = this.editUserData.phoneNumber;
    if (this.editUserData.role) this.userData.role = this.editUserData.role;
    if (this.editUserData.departmentName) this.userData.departmentName = this.editUserData.departmentName;
    if (this.editUserData.subDepartmentName) this.userData.subDepartmentName = this.editUserData.subDepartmentName;

    // Also update legacy field names for compatibility
    if (this.editUserData.name) this.userData.UserName = this.editUserData.name;
    if (this.editUserData.emailId) this.userData.Email = this.editUserData.emailId;
    if (this.editUserData.phoneNumber) this.userData.Phone = this.editUserData.phoneNumber;

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
   
  }

  private openSnackBar(message: string, action: string = 'Close', panelClass: 'success' | 'error' | 'info' = 'success') {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: panelClass ? [`snackbar-${panelClass}`] : undefined
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

  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getTaskPriority(task: AssignWork): string | null {
    return (task as any).priority || null;
  }

  getRoleLabel(role: any): string {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (Array.isArray(role)) {
      return role
        .map((r) => this.getRoleLabel(r))
        .filter((v) => !!v)
        .join(', ');
    }
    if (typeof role === 'object') {
      if (role.role) return String(role.role);
      if (role.name) return String(role.name);
      if (role.title) return String(role.title);
    }
    return String(role);
  }

  getRoleValue(role: any): string {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (typeof role === 'object') {
      if (role.role) return String(role.role);
      if (role.name) return String(role.name);
      if (role.title) return String(role.title);
    }
    return String(role);
  }

  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
  }

  removeProfilePicture() {
    if (!this.userData?._id) {
      this.openSnackBar('User not found.', 'Close', 'error');
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
          
          this.openSnackBar('Profile picture removed successfully!', 'Close');
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error removing profile picture:', err);
          this.openSnackBar('Failed to remove profile picture.', 'Close', 'error');
        }
      });
    }
  }



  // Close sidebar on escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.sidebarOpen) {
      this.closeSidebar();
    }
  }

  // Handle window resize
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    const windowWidth = window.innerWidth;
    
    // Auto-close sidebar on mobile when resizing to desktop
    if (windowWidth > 991 && this.sidebarOpen) {
      this.closeSidebar();
    }
  }


  // Close notification popup
  closeNotificationPopup(): void {
    this.showNotificationPopup = false;
  }

  // Mark notification as read
  markNotificationAsRead(): void {
    this.hasNotification = false;
    // You can add API call here to mark notifications as read
  }

  // Refresh notifications
  refreshNotifications(): void {
    this.loadTodaysTasks();
  }

  // Auto-refresh notifications every 5 minutes
  startNotificationAutoRefresh(): void {
    setInterval(() => {
      this.refreshNotifications();
    }, 300000); // 5 minutes
  }

  // Form validation
  validateForm(): boolean {
    console.log('Validating form with data:', this.editUserData);
    
    if (!this.editUserData.name || this.editUserData.name.trim() === '') {
      this.openSnackBar('Please enter your full name.', 'Close', 'error');
      return false;
    }

    if (!this.editUserData.userName || this.editUserData.userName.trim() === '') {
      this.openSnackBar('Please enter a username.', 'Close', 'error');
      return false;
    }

    if (!this.editUserData.emailId || this.editUserData.emailId.trim() === '') {
      this.openSnackBar('Please enter your email address.', 'Close', 'error');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editUserData.emailId)) {
      this.openSnackBar('Please enter a valid email address.', 'Close', 'error');
      return false;
    }

    // Optional: Validate phone number if provided
    if (this.editUserData.phoneNumber && this.editUserData.phoneNumber.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(this.editUserData.phoneNumber.replace(/\s/g, ''))) {
        this.openSnackBar('Please enter a valid phone number.', 'Close', 'error');
        return false;
      }
    }

    // Department and SubDepartment validation - optional for admin users
    const isAdmin = this.editUserData.role?.toLowerCase() === 'admin';
    
    if (!isAdmin) {
      // For non-admin users, department is required
      if (!this.editUserData.departmentName || this.editUserData.departmentName.trim() === '') {
        this.openSnackBar('Please select a department.', 'Close', 'error');
        return false;
      }
      
      // For non-admin users, sub-department is required if department is selected
      if (this.editUserData.departmentName && this.editUserData.departmentName.trim() !== '') {
        if (!this.editUserData.subDepartmentName || this.editUserData.subDepartmentName.trim() === '') {
          this.openSnackBar('Please select a sub-department.', 'Close', 'error');
          return false;
        }
      }
    }
    // For admin users, department and sub-department are optional (no validation needed)

    console.log('Form validation passed');
    return true;
  }

  // Reset form to original values
  resetForm(): void {
    this.editUserData = { ...this.userData };
    this.previewImage = this.getCleanImageUrl(this.userData);
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  // Check if current route is /projects
  isProjectsRoute(): boolean {
    return this.router.url === '/projects';
  }

  // Get project count for badge display
  getProjectCount(): number {
    // This would typically come from a service
    // For now, return a placeholder value
    return 0;
  }

  // Enhanced navigation section toggle
  toggleNavSection(section: string): void {
    this.navSections[section] = !this.navSections[section];
    
    // Optional: Auto-expand section if it contains the current route
    if (this.navSections[section]) {
      this.autoExpandCurrentSection();
    }
  }

  // Auto-expand section containing current route
  private autoExpandCurrentSection(): void {
    const currentRoute = this.router.url;
    
    // Define route mappings to sections
    const routeToSectionMap: { [key: string]: string } = {
      '/register': 'admin',
      '/department': 'admin',
      '/role': 'admin',
      '/create': 'admin',
      '/webdev': 'development',
      '/angulardeveloper': 'development',
      '/ngrx': 'development',
      '/node': 'development',
      '/api&database': 'development',
      '/smart-attendance': 'tools',
      '/production-monitor': 'tools',
      '/power-metrics': 'tools',
      '/heat-treatment': 'tools',
      '/melting-software': 'tools',
      '/blog': 'resources',
      '/career': 'resources',
      '/services': 'resources',
      '/aboutas': 'resources',
      '/contactas': 'resources',
      '/privacy-policy': 'resources'
    };

    const section = routeToSectionMap[currentRoute];
    if (section && !this.navSections[section]) {
      this.navSections[section] = true;
    }
  }

  // Initialize navigation state based on current route
  private initializeNavigationState(): void {
    this.autoExpandCurrentSection();
  }

  // Enhanced sidebar toggle with animation
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    
    // Initialize navigation state when opening sidebar
    if (this.sidebarOpen) {
      this.initializeNavigationState();
    }
  }

  // Close sidebar with animation
  closeSidebar(): void {
    this.sidebarOpen = false;
  }
  // Handle route changes to update navigation state
  onRouteChange(): void {
    this.initializeNavigationState();
  }
}