import { Component, ElementRef, HostListener, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router ,NavigationEnd} from '@angular/router';
import { UserservicesService } from '../register/services/userservices.service';
import { AssignWorkService, AssignWork } from '../service/assignwork.service';
import { ConfigService } from '../service/config.service';
import { RoleserviceService } from '../service/roleservice.service';
import { DepartmentserviceService } from '../department/service/departmentservice.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';
import { Meta,Title } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
    currentLabel = '';
    

    
  onSearch() {}
  
  
  private getCurrentIndex(): number {
    const pages = this.getCurrentGroup();
    return pages.findIndex(p => p.path === this.router.url);
  }

  get isFirstPage(): boolean {
    return this.getCurrentIndex() === 0;
  }

  get isLastPage(): boolean {
    const pages = this.getCurrentGroup();
    const index = this.getCurrentIndex();
    return index === pages.length - 1;
  }

 

     getCurrentGroup() {
    const url = this.router.url;

    if (this.masterPages.some(p => p.path === url)) return this.masterPages;
    if (this.frontendPages.some(p => p.path === url)) return this.frontendPages;
    if (this.backendPages.some(p => p.path === url)) return this.backendPages;
   

    return [];
  }

   getAllPages() {
    return [
      ...this.masterPages,
      ...this.frontendPages,
      ...this.backendPages,
     
    ];
  }
  

  
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
  selectedFile: File | null = null;
  selectedFileName: string = '';
  showEditModal = false;

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
    private snackBar: MatSnackBar,
    private meta: Meta, private title: Title,
    
  ) {this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentLabel();
      });}
  updateCurrentLabel() {
    const url = this.router.url;

    const page = this.getAllPages().find(p => p.path === url);
    this.currentLabel = page ? page.label : '';
  }

  previousPage() {
  if (this.isFirstPage) {
    return; 
  }

  const pages = this.getCurrentGroup();
  const index = pages.findIndex(p => p.path === this.router.url);

  if (index > 0) {
    this.router.navigate([pages[index - 1].path]);
  }
}


nextPage() {
  if (this.isLastPage) {
    return;
  }

  const pages = this.getCurrentGroup();
  const index = pages.findIndex(p => p.path === this.router.url);

  if (index !== -1 && index < pages.length - 1) {
    this.router.navigate([pages[index + 1].path]);
  }
}

   masterPages = [
    { path: '/register', label: 'User' },
    { path: '/department', label: 'Department' },
    { path: '/role', label: 'Role' },
    { path: '/create', label: 'Create Project' },
    { path: '/careers', label: 'Careers' }
  ];

  frontendPages = [
    { path: '/webdev', label: 'WebDev' },
    { path: '/angulardeveloper', label: 'Angular' },
    { path: '/ngrx', label: 'NGRX' }
  ];

  backendPages = [
    { path: '/node', label: 'Node.js' },
    { path: '/api&database', label: 'API & Database' }
  ];

 

  
  ngOnInit(): void {
    this.getCurrentUser();
    this.updateTime();
    this.getUserInitial()
    setInterval(() => this.updateTime(), 60000);
    
    
    setTimeout(() => {
      this.loadTodaysTasks();
    }, 1000);

    this.startNotificationAutoRefresh();

    // Subscribe to permission refresh events
   

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
  }

  private extractCacheKey(user: any): string {
    if (!user || typeof user !== 'object') return '';
    // prefer stable unique identifiers
    return (
      user._id ||
      user.id ||
      user.userCode ||
      user.userName ||
      user.emailId ||
      ''
    ).toString();
  }

  private getCachedPhoto(user: any): string | null {
    const key = this.extractCacheKey(user);
    if (!key) return null;
    const cached = localStorage.getItem(`cachedPhoto_${key}`);
    if (cached) console.log('🔁 found cache entry for', key, cached);
    return cached;
  }

  private applyCachedPhoto(user: any): void {
    const key = this.extractCacheKey(user);
    const cached = this.getCachedPhoto(user);
    if (cached) {
      console.log('🔁 Applying cached photo for', key, cached);
      user.photoURL = cached;
    }
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      console.log('🔍 getCurrentUser read from sessionStorage', this.userData);

      // apply client-side cache before processing image
      this.applyCachedPhoto(this.userData);
      console.log('🔍 after cache lookup userData.photoURL=', this.userData.photoURL);

      this.processUserImage(this.userData);
      console.log('🔍 after processUserImage userData.photoURL=', this.userData.photoURL);

      if (typeof this.userData.role === 'object' && this.userData.role?.role) {
        this.userData.role = this.userData.role.role;
      }
    }
  }

  /**
   * Refresh user data from backend and update sessionStorage
   * This is called when permissions are updated to show the new sidebar menu
   */
  refreshUserDataFromBackend(): void {
    if (!this.userData?._id && !this.userData?.userCode) {
      console.warn('⚠️ Cannot refresh: current user ID not found');
      return;
    }

    this.userService.getuser().subscribe({
      next: (users: any[]) => {
        // Find the current user in the list
        const currentUserId = this.userData?._id;
        const currentUserCode = this.userData?.userCode;
        
        const refreshedUser = users.find(u => 
          u._id === currentUserId || u.userCode === currentUserCode
        );

        if (refreshedUser) {
          // Update userData with fresh backend data
          this.userData = { ...this.userData, ...refreshedUser };
          
          // Update sessionStorage
          sessionStorage.setItem('user', JSON.stringify(this.userData));
          
          console.log('✅ User data refreshed from backend, sidebar will update', this.userData);
          
          // Update user service subject
          this.userService.setUser(this.userData);
        } else {
          console.warn('⚠️ Current user not found in users list');
        }
      },
      error: (err) => {
        console.error('❌ Failed to refresh user data from backend:', err);
        this.snackBar.open('Failed to refresh permissions', 'Close', { duration: 3000 });
      }
    });
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
    
    const userIdentifiers = [
      this.userData?.username,
      this.userData?.UserName,
      this.userData?.userName,
      this.userData?.email,
      this.userData?.emailId,
      this.userData?.userCode
    ].filter(Boolean);
    
    return allAssignments.filter(task => {
      const isAssignedToUser = userIdentifiers.some(userId => {
        return String(task.assignee) === String(userId);
      });
      
      if (!isAssignedToUser) {
        return false;
      }

      const isTodayTask = this.isTaskForToday(task, today);
      
      return isTodayTask;
    });
  }

  private isTaskForToday(task: AssignWork, today: Date): boolean {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate.getTime() === today.getTime()) {
        return true;
      }
    }


    if (task.createdAt) {
      const createdDate = new Date(task.createdAt);
      createdDate.setHours(0, 0, 0, 0);
      if (createdDate.getTime() === today.getTime()) {
        return true;
      }
    }

    if (task.startDate) {
      const startDate = new Date(task.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() === today.getTime()) {
        return true;
      }
    }

    return false;
  }

  private updateNotificationStatus() {
    this.notificationCount = this.todaysTasks.length;
    this.hasNotification = this.notificationCount > 0;
  }

 getUserInitial(): string {

  const fullName =
    this.userData?.name ??
    this.userData?.userName ??
    this.userData?.UserName ??
    this.userData?.username ??
    '';

  if (!fullName || typeof fullName !== 'string') {
    return 'U'; // default avatar
  }

  const nameParts = fullName.trim().split(/\s+/);

  // Single name → R
  if (nameParts.length === 1) {
    return nameParts[0][0].toUpperCase();
  }

  // Multiple names → RG
  return (
    nameParts[0][0] +
    nameParts[nameParts.length - 1][0]
  ).toUpperCase();
}


  toggleNotificationPopup() {
    this.showNotificationPopup = !this.showNotificationPopup;
  }

  onNotificationClick() {
    this.toggleNotificationPopup();
  }

// in header.component.ts - processUserImage()
private processUserImage(user: any): void {
  const timestamp = new Date().getTime();

  let photoField = user.photo || user.photoURL || user.imagePath || user.image || user.avatar;

  if (photoField) {
    // Assume files are in /uploads/
    let baseUrl = 'http://localhost:3008/uploads/';   
    if (photoField.startsWith('http')) {
      user.photoURL = this.addCacheBuster(photoField, timestamp);
    } else if (photoField.startsWith('/')) {
      user.photoURL = this.addCacheBuster('http://localhost:3008' + photoField, timestamp);
    } else {
      user.photoURL = this.addCacheBuster(baseUrl + photoField, timestamp);
    }
    console.log('Constructed photo URL:', user.photoURL);
  }
}

  private addCacheBuster(url: string, timestamp: number): string {

    return url + (url.includes('?') ? '&' : '?') + `t=${timestamp}`;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Called when avatar image fails to load (404, network error, etc.)
   * Clears the photoURL so the template will render initials instead.
   */
  onAvatarError(): void {
    console.warn('⚠️ Avatar image failed to load, falling back to initials');
    if (this.userData) {
      this.userData.photoURL = null;
    }
  }

  /**
   * Called when modal preview image fails to load.
   * Clears the preview so initials placeholder is shown.
   */
  onProfileImageError(): void {
    console.warn('⚠️ Profile preview image failed to load, showing initials');
    this.previewImage = null;
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.showDropdown = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (
      this.showDropdown &&
      this.loginDropdown &&
      !this.loginDropdown.nativeElement.contains(target)
    ) {
      this.showDropdown = false;
    }
    
    const notificationElement = this.elementRef.nativeElement.querySelector('.notification-icon');
    if (
      this.showNotificationPopup &&
      notificationElement &&
      !notificationElement.contains(target)
    ) {
      this.showNotificationPopup = false;
    }
    
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
      return '';
    }
  }

 openEditProfile() {
  console.log('📝 Opening edit profile modal for user:', this.userData);
  
  // Show loading state and modal
  this.isLoading = true;
  this.showEditModal = true;
  
  // Clear previous preview when opening modal
  this.previewImage = null;

  // Load roles and departments, then populate form
  this.loadRolesAndDepartmentsIfNeeded().then(() => {
    console.log('✅ Data ready, populating form...');
    this.populateEditForm();
    
    // Populate previewImage with existing user photo
    if (this.userData?.photoURL) {
      // Use the existing photoURL so we can preview the saved photo
      this.previewImage = this.userData.photoURL;
      console.log('📷 Loaded existing photo for preview:', this.previewImage);
    } else {
      // No existing photo, show initials placeholder
      this.previewImage = null;
    }
    
    this.isLoading = false;
  }).catch(err => {
    console.error('❌ Error loading data:', err);
    this.populateEditForm();
    this.previewImage = this.userData?.photoURL || null;
    this.isLoading = false;
  });
}

/**
 * Load roles and departments if not already loaded
 */
private loadRolesAndDepartmentsIfNeeded(): Promise<void> {
  return new Promise((resolve) => {
    // If we already have data, resolve immediately
    if (this.roles.length > 0 && this.departments.length > 0) {
      console.log('✅ Roles and departments already in memory');
      resolve();
      return;
    }

    let rolesReady = false;
    let departmentsReady = false;
    
    const checkAllReady = () => {
      if (rolesReady && departmentsReady) {
        resolve();
      }
    };

    // Load Roles
    console.log('📥 Fetching roles from server...');
    this.roleService.Loadrole().subscribe({
      next: (data: any) => {
        console.log('✅ Roles fetched:', data);
        this.roles = Array.isArray(data) ? data : (data?.roles || []);
        rolesReady = true;
        checkAllReady();
      },
      error: (err) => {
        console.error('❌ Failed to load roles:', err);
        this.roles = [];
        rolesReady = true;
        checkAllReady();
      }
    });

    // Load Departments
    console.log('📥 Fetching departments from server...');
    this.departmentService.loaddm().subscribe({
      next: (data: any) => {
        console.log('✅ Departments fetched:', data);
        this.departments = Array.isArray(data) ? data : (data?.departments || []);
        departmentsReady = true;
        checkAllReady();
      },
      error: (err) => {
        console.error('❌ Failed to load departments:', err);
        this.departments = [];
        departmentsReady = true;
        checkAllReady();
      }
    });

    // Timeout fallback - resolve after 5 seconds anyway
    setTimeout(() => {
      console.warn('⏱️ Loading timeout - proceeding with available data');
      rolesReady = true;
      departmentsReady = true;
      checkAllReady();
    }, 5000);
  });
}

/**
 * Populate the edit form with current user data
 */
private populateEditForm() {
  console.log('📋 Populating form with user data:', this.userData);

  // Helper to extract first non-empty value from multiple possible field names
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      const val = this.userData?.[k];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return '';
  };

  // Extract department and subdepartment
  const deptName = this.getDepartmentName();
  const subDeptName = this.getSubDepartmentName();
  console.log('📍 Extracted - Department:', deptName, 'SubDepartment:', subDeptName);

  // Get the proper role value
  let initialRole: any = this.userData?.role || '';
  initialRole = this.getRoleValue(initialRole);
  console.log('👤 Extracted - Role:', initialRole);

  // Build the edit data object
  this.editUserData = {
    name: getFirst(['name', 'Name', 'UserName', 'lowerCaseName']),
    userName: getFirst(['userName', 'UserName']),
    userCode: getFirst(['userCode', 'UserCode']),
    role: initialRole,
    emailId: getFirst(['emailId', 'email']),
    phoneNumber: getFirst(['phoneNumber', 'phone']),
    departmentName: deptName || '',
    subDepartmentName: subDeptName || '',
    password: '',
    removePhoto: false
  };

  console.log('✏️ Form populated with:', this.editUserData);

  // Load sub-departments for selected department
  if (deptName && this.departments.length > 0) {
    console.log('🔄 Loading sub-departments for:', deptName);
    this.loadSubDepartmentsForDepartment(deptName);
  } else {
    console.log('⚠️ No department selected or departments not loaded yet');
    this.subDepartmentsData = [];
  }

  // Set image preview
  this.previewImage = this.userData?.photoURL || this.userData?.photo || null;
  this.selectedFile = null;
  this.selectedFileName = '';
  
  console.log('✅ Form setup complete - ready for editing');
}

  getProfileImage(): string | null {

  if (!this.userData) return null;

  const image =
    this.userData.profileImage ||
    this.userData.photoURL ||
    this.userData.image ||
    this.userData.avatar;

  if (!image) return null;

  if (!image.startsWith('http')) {
    return `http://localhost:3000/${image}`;
  }

  return image;
}
  private getUserField(fieldName: string): string {
    if (!this.userData) return '';
    return this.userData[fieldName] || '';
  }

  private getDepartmentName(): string {
    if (!this.userData) return '';
    
    // Try all possible field names for department name
    if (this.userData.departmentName && typeof this.userData.departmentName === 'string') return this.userData.departmentName;
    if (this.userData.department?.departmentName) return this.userData.department.departmentName;
    if (this.userData.department?.name) return this.userData.department.name;
    if (this.userData.Department) return this.userData.Department;
    if (this.userData.department?._id) return this.userData.department._id;
    
    return '';
  }

  private getSubDepartmentName(): string {
    if (!this.userData) return '';
    
    // Try all possible field names for sub-department
    if (this.userData.subDepartmentName && typeof this.userData.subDepartmentName === 'string') return this.userData.subDepartmentName;
    if (this.userData.subDepartment && typeof this.userData.subDepartment === 'string') return this.userData.subDepartment;
    if (this.userData.SubDepartment) return this.userData.SubDepartment;
    if (this.userData.department?.subDepartments?.[0]?.name) return this.userData.department.subDepartments[0].name;
    if (this.userData.department?.subDepartmentName) return this.userData.department.subDepartmentName;
    
    return '';
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
    this.editUserData = {};
    this.subDepartmentsData = [];
  }

 onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) {
    console.warn('⚠️ No files selected');
    return;
  }

  const file = input.files[0];
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('❌ Invalid file type:', file.type);
    this.openSnackBar('Please select a valid image file (JPG, PNG, GIF, etc)', 'Close', 'error');
    return;
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    console.error('❌ File too large:', file.size, 'bytes (max', maxSize, ')');
    this.openSnackBar(`Image is too large (${Math.round(file.size / 1024 / 1024)}MB). Max 5MB.`, 'Close', 'error');
    return;
  }

  console.log('✅ File selected:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Store the file object for later upload
  this.selectedFile = file;
  this.selectedFileName = file.name;
  this.editUserData.removePhoto = false;

  // Read for preview only
  const reader = new FileReader();
  reader.onload = (e) => {
    this.previewImage = e.target?.result as string;
    console.log('✅ Preview image loaded');
  };
  reader.onerror = (error) => {
    console.error('❌ Error reading file for preview:', error);
    this.openSnackBar('Error reading image file', 'Close', 'error');
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewImage = null;
  };
  
  reader.readAsDataURL(file);
}

  removeProfilePicture() {
    // Clear selected file and preview
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewImage = null;

    // Mark for backend removal when saving
    this.editUserData.removePhoto = true;

    // Immediately update header data so initials show
    if (this.userData) {
      this.userData.photoURL = null;
      // also clear any alternate fields that might be used by template
      this.userData.photo = null;
      this.userData.imagePath = null;
      this.userData.imageUrl = null;
    }
  }

  removeSelectedImage() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewImage = this.getCleanImageUrl(this.userData);
  }

saveProfilePicture() {
  if (!this.userData?._id) {
    this.openSnackBar('User not found', 'Close', 'error');
    return;
  }

  // Validate required form data
  if (!this.editUserData.name?.trim()) {
    this.openSnackBar('Name is required', 'Close', 'error');
    return;
  }
  if (!this.editUserData.userName?.trim()) {
    this.openSnackBar('Username is required', 'Close', 'error');
    return;
  }
  if (!this.editUserData.emailId?.trim()) {
    this.openSnackBar('Email is required', 'Close', 'error');
    return;
  }

  this.isLoading = true;
  const formData = new FormData();

  // === APPEND FILE FIRST (IMPORTANT FOR MULTIPART) ===
  if (this.selectedFile && this.selectedFile.size > 0) {
    try {
      console.log('📁 Appending file to FormData:', {
        name: this.selectedFile.name,
        size: this.selectedFile.size,
        type: this.selectedFile.type
      });
      formData.append('photo', this.selectedFile, this.selectedFile.name);
    } catch (e) {
      console.error('❌ Error appending file:', e);
      this.isLoading = false;
      this.openSnackBar('Error processing image file', 'Close', 'error');
      return;
    }
  } else if (this.editUserData.removePhoto) {
    console.log('🗑️ Removing photo');
    formData.append('removePhoto', 'true');
  } else {
    console.log('📷 Keeping existing image');
    formData.append('keepExistingImage', 'true');
  }

  // === NORMALIZE AND APPEND TEXT FIELDS ===
  const normalized = { ...this.editUserData };
  normalized.role = this.getRoleValue(normalized.role);
  
  if (normalized.departmentName && typeof normalized.departmentName !== 'string') {
    normalized.departmentName = String(normalized.departmentName);
  }
  if (normalized.subDepartmentName && typeof normalized.subDepartmentName !== 'string') {
    normalized.subDepartmentName = String(normalized.subDepartmentName);
  }

  // Append each field ONCE (lowercase primary key)
  const fieldsToAppend = [
    'userCode',
    'name',
    'userName',
    'emailId',
    'phoneNumber',
    'role',
    'departmentName',
    'subDepartmentName',
    'password'
  ];

  console.log('📋 EditUserData before normalization:', this.editUserData);
  console.log('📋 Normalized values:', normalized);

  fieldsToAppend.forEach(key => {
    const value = normalized[key];
    if (value !== undefined && value !== null && value !== '') {
      const strVal = String(value).trim();
      if (strVal && strVal !== 'undefined') {  // Extra check for 'undefined' string
        // Map field names to match backend expectations
        let fieldName = key;
        if (key === 'departmentName') fieldName = 'department';
        if (key === 'subDepartmentName') fieldName = 'subDepartment';
        
        formData.append(fieldName, strVal);
        console.log(`  ✓ ${fieldName}: ${strVal.substring(0, 50)}${strVal.length > 50 ? '...' : ''}`);
      } else {
        console.log(`  ⊘ ${key}: SKIPPED (empty/invalid)`);
      }
    } else {
      console.log(`  ⊘ ${key}: SKIPPED (null/undefined)`);
    }
  });

  // === LOG FINAL FORMDATA ===
  console.log('📤 === FINAL FORMDATA TO SEND ===');
  if (this.selectedFile && this.selectedFile.size > 0) {
    console.log(`  [FILE] photo: ${this.selectedFile.name} (${this.selectedFile.size} bytes)`);
  }
  
  console.log('🔍 === ACTUAL FORMDATA CONTENTS ===');
  const formDataEntries: any[] = [];
  fieldsToAppend.forEach(field => {
    const val = normalized[field];  // Check from normalized, not editUserData
    if (val !== undefined && val !== null && val !== '') {
      const strVal = String(val).trim();
      if (strVal && strVal !== 'undefined') {
        formDataEntries.push({ field, value: strVal.substring(0, 40) });
        console.log(`  [ACTUAL] ${field}: ${strVal.substring(0, 40)}`);
      }
    }
  });
  console.log(`✅ FormData ready: ${formDataEntries.length} fields`);

  // === SEND REQUEST ===
  console.log('Sending profile update to:', `/updateUser/${this.userData._id}`);
  console.log('Complete normalized data:', normalized);
  
  this.userService.edituser(this.userData._id, formData).subscribe({
    next: (res: any) => {
      console.log('✅ Profile update success!');
      console.log('📦 Response data:', res);
      this.isLoading = false;
      
      // STEP 1: Merge response into existing userData so we don't lose fields
      const prevPhoto = this.userData?.photoURL || this.userData?.photo || this.userData?.imagePath || this.userData?.imageUrl || null;
      this.userData = { ...this.userData, ...res };
      console.log('✏️ userData updated (merged):', this.userData);
      
      // STEP 2: Ensure photoURL is set or preserved
      if (!this.userData.photoURL && !this.userData.photo && !this.userData.imagePath && !this.userData.imageUrl) {
        // nothing returned from server; preserve previous if not removing
        if (!this.editUserData.removePhoto && prevPhoto) {
          console.log('🔒 preserving previous photo URL');
          this.userData.photoURL = prevPhoto;
        }
      }

      // convert other fields to photoURL if available
      if (!this.userData.photoURL) {
        if (this.userData.photo) {
          this.userData.photoURL = this.userData.photo;
        } else if (this.userData.imagePath) {
          this.userData.photoURL = this.userData.imagePath;
        } else if (this.userData.imageUrl) {
          this.userData.photoURL = this.userData.imageUrl;
        }
      }
      console.log('📸 photoURL is now:', this.userData.photoURL);

      // STEP 2a: if we asked to remove the photo, clear it regardless of server response
      if (this.editUserData.removePhoto) {
        console.log('🗑️ Removing photo on client after save');
        this.userData.photoURL = null;
        this.userData.photo = null;
        this.userData.imagePath = null;
        this.userData.imageUrl = null;
      }
      
      // STEP 3: Save to sessionStorage so avatar persists
      sessionStorage.setItem('user', JSON.stringify(this.userData));
      console.log('💾 User saved to sessionStorage');

      // also cache the photo separately for long‑term persistence
      if (this.userData.photoURL) {
        const key = this.extractCacheKey(this.userData);
        if (key) {
          localStorage.setItem(`cachedPhoto_${key}`, this.userData.photoURL);
          console.log('💾 Cached photo for user', key, this.userData.photoURL);
        }
      } else if (this.editUserData.removePhoto) {
        // clear the cached entry when the user deleted their photo
        const key = this.extractCacheKey(this.userData);
        if (key) {
          localStorage.removeItem(`cachedPhoto_${key}`);
          console.log('🧹 Removed cached photo for user', key);
        }
      }

      // STEP 4: Add cache buster to image URL to refresh display
      this.processUserImage(this.userData);
      console.log('🎨 Image processed with cache buster:', this.userData.photoURL);
      
      // STEP 5: Close modal and clear form
      this.showEditModal = false;
      this.selectedFile = null;
      this.selectedFileName = '';
      // reset removal flag so subsequent opens start fresh
      this.editUserData.removePhoto = false;
      
      // STEP 6: Show success message
      this.openSnackBar('Profile updated successfully!', 'Close');
      
      // STEP 7: No reload needed - update is already live in the UI
      console.log('✅ Profile saved and UI updated immediately (no reload)');
    },
    error: (err: any) => {
      console.error('❌ Profile update failed');
      console.error('  Status:', err.status);
      console.error('  Error:', err.error?.message || err.statusText);
      
      this.isLoading = false;
      
      // Extract error message
      let msg = 'Failed to save profile';
      if (err?.error?.message) msg = err.error.message;
      else if (err?.error?.error) msg = err.error.error;
      else if (err?.statusText) msg = err.statusText;
      
      this.openSnackBar(`Error: ${msg}`, 'Close', 'error');
    }
  });
}



  signOut() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  private openSnackBar(message: string, action: string = 'Close', panelClass: 'success' | 'error' | 'info' = 'success') {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: panelClass ? [`snackbar-${panelClass}`] : undefined
    });
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

  private isAllowed(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (value && typeof value === 'object' && 'visible' in value) {
      return !!value.visible;
    }
    return false;
  }

  private getScreensPermissions(): any {
    const screensFromUser = this.userData?.permission?.screens;

    let screensFromSession: any = null;
    const permissionStr = sessionStorage.getItem('permission');
    if (permissionStr) {
      try {
        screensFromSession = JSON.parse(permissionStr);
      } catch {
        screensFromSession = null;
      }
    }

    const screens = screensFromUser || screensFromSession || {};
    const hasPermissionConfig = Object.keys(screens).length > 0;

    // If user has no permission config, show full sidebar by default.
    if (!hasPermissionConfig) {
      return {
        master: {
          visible: true,
          user: true,
          role: true,
          createProject: true,
          permission: true
        },
        project: true,
        frontend: {
          visible: true,
          webdev: true,
          angularDeveloper: true,
          ngrx: true
        },
        backend: {
          visible: true,
          node: true,
          apiDatabase: true
        }
      };
    }

    return {
      master: screens?.master  || {},
      project: screens?.project,
      frontend: screens?.frontend || {},
      backend: screens?.backend || {}
    };
  }

  canShowMasterSection(): boolean {
    if (this.isAdmin()) return true;
    const master = this.getScreensPermissions().master;
    return !!(master?.visible || master?.user || master?.role || master?.createProject || master?.permission);
  }

  canShowUserMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().master?.user;
  }

  canShowDepartmentMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().master?.visible;
  }

  canShowRoleMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().master?.role;
  }

  canShowCreateProjectMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().master?.createProject;
  }

  canShowPermissionMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().master?.permission;
  }

  canShowProjectsMenu(): boolean {
    if (this.isAdmin()) return true;
    return this.isAllowed(this.getScreensPermissions().project);
  }

  canShowFrontendSection(): boolean {
    if (this.isAdmin()) return true;
    const frontend = this.getScreensPermissions().frontend;
    return !!(frontend?.visible || frontend?.webdev || frontend?.angularDeveloper || frontend?.ngrx);
  }

  canShowWebdevMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().frontend?.webdev;
  }

  canShowAngularMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().frontend?.angularDeveloper;
  }

  canShowNgrxMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().frontend?.ngrx;
  }

  canShowBackendSection(): boolean {
    if (this.isAdmin()) return true;
    const backend = this.getScreensPermissions().backend;
    return !!(backend?.visible || backend?.node || backend?.apiDatabase);
  }

  canShowNodeMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().backend?.node;
  }

  canShowApiDatabaseMenu(): boolean {
    if (this.isAdmin()) return true;
    return !!this.getScreensPermissions().backend?.apiDatabase;
  }



  // Close sidebar on escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
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
      '/aboutus': 'resources',
      '/contact': 'resources',
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