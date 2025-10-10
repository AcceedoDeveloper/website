import { Component, ElementRef, HostListener, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserservicesService } from '../register/services/userservices.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
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
    private elementRef: ElementRef
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

  onNotificationHover() {
    if (this.notificationCount > 0) {
      this.showNotificationPopup = true;
    }
  }

  onNotificationLeave() {
    // Add a small delay to prevent flickering
    setTimeout(() => {
      this.showNotificationPopup = false;
    }, 300);
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
    
    // Close notification popup when clicking outside
    const notificationElement = this.elementRef.nativeElement.querySelector('.notification-icon');
    if (
      this.showNotificationPopup &&
      notificationElement &&
      !notificationElement.contains(event.target)
    ) {
      this.showNotificationPopup = false;
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

    // Basic form validation
    if (!this.validateForm()) {
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


  // Close sidebar when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    
    if (this.sidebarOpen && 
        !sidebar?.contains(target) && 
        !toggleButton?.contains(target)) {
      this.closeSidebar();
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
    if (!this.editUserData.name || this.editUserData.name.trim() === '') {
      alert('Please enter your full name.');
      return false;
    }

    if (!this.editUserData.userName || this.editUserData.userName.trim() === '') {
      alert('Please enter a username.');
      return false;
    }

    if (!this.editUserData.emailId || this.editUserData.emailId.trim() === '') {
      alert('Please enter your email address.');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editUserData.emailId)) {
      alert('Please enter a valid email address.');
      return false;
    }

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