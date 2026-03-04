import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreatprojectService } from '../service/creatproject.service';
import { UserservicesService } from '../register/services/userservices.service';
import { ConfigService } from '../service/config.service';
import { DateUtilsService } from '../service/date-utils.service';
import { ProjectDeleteConfirmationDialogComponent } from './project-delete-confirmation-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';


interface Employee {
  id: number;
  name: string;
}



@Component({
  selector: 'app-createproject',
  templateUrl: './createproject.component.html',
  styleUrls: ['./createproject.component.css'],
   
})

export class CreateprojectComponent implements OnInit, OnDestroy {
  projects: any[] = [];
  employees: any[] = [];
  userData: any = null;

  project: any = {
    projectName: '',
    teamLeads: [],
    employees:[],
    startDate: '',
    expectedEndDate: ''
  };

  showCreateProjectBox = false;
  showSuccessMessage = false;
  searchQuery: string = '';
  isModalOpen = false;
  selectedProject: any = null;
  filteredProjects: any[] = [];
  isLoading = false;
  isDeleting = false;
  
  showTeamLeadsDropdown = false;
  teamLeadsSearchText = '';
  showEditTeamLeadsDropdown = false;
  editTeamLeadsSearchText = '';
  
  showEmployeeDropdown = false;
  employeeSearchText = '';
  showEditEmployeeDropdown = false;
  editEmployeeSearchText = '';

  dateTime: string = '';


  private documentClickListener: (event: MouseEvent) => void;

  constructor(
 
    private projectService: CreatprojectService,
    private userserives: UserservicesService,
    private configService: ConfigService,
    private dateUtils: DateUtilsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Bind the method with the correct signature
    this.documentClickListener = this.onDocumentClick.bind(this);
  }

// Select project (for sidebar)
selectProject(project: any) {
  this.selectedProject = project;
}

// Close sidebar
closePanel() {
  this.selectedProject = null;
}

// Get first letter safely
getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : '';
}

// Project status
getProjectStatus(project: any): string {
  if (!project?.expectedEndDate) return 'Active';

  const today = new Date();
  const endDate = new Date(project.expectedEndDate);

  // remove time part
  today.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);

  if (endDate < today) {
    return 'Completed';
  } else {
    return 'Active';
  }
}

getStatusClass(project: any): string {
  const status = this.getProjectStatus(project);

  return status === 'Completed' ? 'completed' : 'active';
}


  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchProjects();
    this.updateTime();
    this.getuserdata(); 
    
    document.addEventListener('click', this.documentClickListener);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.documentClickListener);
  }

  onDocumentClick(event: MouseEvent) {
    // Handle team leads dropdown
    if (this.showTeamLeadsDropdown) {
      const dropdown = document.querySelector('.employees-dropdown');
      const input = document.querySelector('.employees-input-container');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          input && !input.contains(event.target as Node)) {
        this.showTeamLeadsDropdown = false;
      }
    }
    
    // Handle employees dropdown
    if (this.showEmployeeDropdown) {
      const dropdown = document.querySelector('.employees-dropdown');
      const input = document.querySelector('.employees-input-container');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          input && !input.contains(event.target as Node)) {
        this.showEmployeeDropdown = false;
      }
    }
    
    // Handle edit team leads dropdown
    if (this.showEditTeamLeadsDropdown) {
      const dropdown = document.querySelector('.edit-employees-dropdown');
      const input = document.querySelector('.edit-employees-input-container');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          input && !input.contains(event.target as Node)) {
        this.showEditTeamLeadsDropdown = false;
      }
    }
    
    // Handle edit employees dropdown
    if (this.showEditEmployeeDropdown) {
      const dropdown = document.querySelector('.edit-employees-dropdown');
      const input = document.querySelector('.edit-employees-input-container');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          input && !input.contains(event.target as Node)) {
        this.showEditEmployeeDropdown = false;
      }
    }
  }

  // New dropdown control methods
  closeAllDropdowns() {
    this.showTeamLeadsDropdown = false;
    this.showEmployeeDropdown = false;
    this.showEditTeamLeadsDropdown = false;
    this.showEditEmployeeDropdown = false;
  }

  closeTeamLeadsDropdown() {
    this.showTeamLeadsDropdown = false;
  }

  closeEmployeeDropdown() {
    this.showEmployeeDropdown = false;
  }

  toggleTeamLeadsDropdown() {
    this.showEmployeeDropdown = false; // Close other dropdown
    this.showTeamLeadsDropdown = !this.showTeamLeadsDropdown;
  }

  toggleEmployeeDropdown() {
    this.showTeamLeadsDropdown = false; // Close other dropdown
    this.showEmployeeDropdown = !this.showEmployeeDropdown;
  }

  // Rest of the code remains unchanged
  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
  }

  toggleCreateProjectBox() {
    this.showCreateProjectBox = !this.showCreateProjectBox;
    if (this.showCreateProjectBox) {
      this.project = {
        projectName: '',
        teamLeads: [],
        employees: [],
        startDate: '',
        expectedEndDate: ''
      };
    }
  }

  cancel() {
    this.project = {
      projectName: '',
      teamLeads: [],
      employees: [],
      startDate: '',
      expectedEndDate: ''
    };
    this.showCreateProjectBox = false;
    this.showTeamLeadsDropdown = false;
    this.showEmployeeDropdown = false;
  }

  fetchProjects() {
    console.log('Fetching projects...');
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        console.log('API Response for projects:', response);
        if (Array.isArray(response)) {
          this.projects = response;
          this.filteredProjects = [...response];
        } else if (response && response.data && Array.isArray(response.data)) {
          this.projects = response.data;
          this.filteredProjects = [...response.data];
        } else {
          console.error('Unexpected API response format:', response);
          this.fetchProjectsFromFirestore();
        }
      },
      error: (error: any) => {
        console.error('Error fetching projects from API:', error);
        alert(error.message || 'Failed to fetch projects from API. Falling back to Firestore.');
        this.fetchProjectsFromFirestore();
      }
    });
  }

  userdata: any;

  fetchProjectsFromFirestore() {
    console.log('Fetching projects from Firestore (fallback)...');
   
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      
      if (this.userData.photo) {
        if (this.userData.photo.startsWith('http')) {
          this.userData.photoURL = this.userData.photo;
        } else {
          this.userData.photoURL = this.configService.getUploadUrl(this.userData.photo);
        }
      } else {
        // this.userData.photoURL = 'assets/default-avatar.png';
      }
    }
  }

  avatarColors: string[] = [
  '#3624d4', // blue
  '#e11d48', // red
  '#16a34a', // green
  '#f59e0b', // orange
  '#0ea5e9', // sky blue
  '#9333ea', // purple
  '#14b8a6', // teal
  '#db2777', // pink
  '#65a30d', // lime
  '#475569'  // slate
];

private usedInitialsMap: Record<string, number> = {};


getUserInitials(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return '';

  const parts = fullName
    .trim()
    .split(' ')
    .filter(p => p.length > 0);

  // Single word → A
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  // Two or more words → AA
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}


// Avatar color (unchanged logic, but safe)
getAvatarColor(fullName: string): string {
  const initials = this.getUserInitials(fullName);

  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % this.avatarColors.length;
  return this.avatarColors[index];
}



// Function to get avatar color

status: string = '';

openProject(project: any) {
  this.selectedProject = project;
  this.calculateStatus(project.expectedEndDate);
}

calculateStatus(endDate: string) {
  const today = new Date();
  const end = new Date(endDate);

  if (end < today) {
    this.status = 'Completed';
  } else {
    this.status = 'Active';
  }
}


  getuserdata() {
    this.userserives.getuser().subscribe({
      next: (data: any) => {
        console.log('Users API response:', data);
        if (Array.isArray(data)) {
          this.userdata = data.map((user: any) => this.processUserImage(user));
          this.employees = [...this.userdata];
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data)];
          this.employees = [...this.userdata];
        } else {
          console.warn('Unexpected response format:', data);
          this.userdata = [];
          this.employees = [];
        }
        console.log('Processed employees:', this.employees);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userdata = [];
        this.employees = [];
      }
    });
  }

  private processUserImage(user: any): any {
    const processedUser = { ...user };
    
    if (processedUser.photo) {
      if (processedUser.photo.startsWith('http')) {
        processedUser.photoURL = processedUser.photo;
      } else {
        processedUser.photoURL = this.configService.getUploadUrl(processedUser.photo);
      }
    } else {
      // processedUser.photoURL = 'assets/default-avatar.png';
    }
    
    return processedUser;
  }

  toggleTeamLeadSelection(employee: any) {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    const index = this.project.teamLeads.findIndex((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
    
    if (index > -1) {
      this.project.teamLeads.splice(index, 1);
    } else {
      this.project.teamLeads.push(employee);
    }
  }

  isTeamLeadSelected(employee: any): boolean {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    return this.project.teamLeads.some((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
  }

  getSelectedTeamLeadsNames(): string {
    if (!this.project.teamLeads || this.project.teamLeads.length === 0) return '';
    return this.project.teamLeads.map((emp: any) => 
      emp.username || emp.displayName || emp.UserName || emp.userName || 'Unknown'
    ).join(', ');
  }

  getFilteredTeamLeads(): any[] {
    if (!this.employees) return [];
    const q = (this.teamLeadsSearchText || '').trim().toLowerCase();
    
    const filtered = this.employees.filter(emp => {
      const isSelectedAsEmployee = this.isEmployeeSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsEmployee && matchesSearch;
    });
    
    return filtered;
  }

  toggleEmployeeSelection(employee: any) {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    const index = this.project.employees.findIndex((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
    
    if (index > -1) {
      this.project.employees.splice(index, 1);
    } else {
      this.project.employees.push(employee);
    }
  }

  isEmployeeSelected(employee: any): boolean {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    return this.project.employees.some((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
  }

  getSelectedEmployeesNames(): string {
    if (!this.project.employees || this.project.employees.length === 0) return '';
    return this.project.employees.map((emp: any) => 
      emp.username || emp.displayName || emp.UserName || emp.userName || 'Unknown'
    ).join(', ');
  }

  getFilteredEmployees(): any[] {
    if (!this.employees) return [];
    const q = (this.employeeSearchText || '').trim().toLowerCase();
    
    const filtered = this.employees.filter(emp => {
      const isSelectedAsTeamLead = this.isTeamLeadSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsTeamLead && matchesSearch;
    });
    
    return filtered;
  }

  toggleEditTeamLeadSelection(employee: any) {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    const index = this.selectedProject.teamLeads.findIndex((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
    
    if (index > -1) {
      this.selectedProject.teamLeads.splice(index, 1);
    } else {
      this.selectedProject.teamLeads.push(employee);
    }
  }

  isEditTeamLeadSelected(employee: any): boolean {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    return this.selectedProject.teamLeads.some((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
  }

  getEditSelectedTeamLeadsNames(): string {
    if (!this.selectedProject.teamLeads || this.selectedProject.teamLeads.length === 0) return '';
    return this.selectedProject.teamLeads.map((emp: any) => 
      emp.username || emp.displayName || emp.UserName || emp.userName || 'Unknown'
    ).join(', ');
  }

  getEditFilteredTeamLeads(): any[] {
    if (!this.employees) return [];
    const q = (this.editTeamLeadsSearchText || '').trim().toLowerCase();
    
    const filtered = this.employees.filter(emp => {
      const isSelectedAsEmployee = this.isEditEmployeeSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsEmployee && matchesSearch;
    });
    
    return filtered;
  }

  toggleEditEmployeeSelection(employee: any) {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    const index = this.selectedProject.employees.findIndex((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
    
    if (index > -1) {
      this.selectedProject.employees.splice(index, 1);
    } else {
      this.selectedProject.employees.push(employee);
    }
  }

  isEditEmployeeSelected(employee: any): boolean {
    const employeeId = employee.id || employee._id || 
                      (employee.username || employee.displayName || employee.UserName || employee.userName);
    
    return this.selectedProject.employees.some((emp: any) => {
      const empId = emp.id || emp._id || 
                   (emp.username || emp.displayName || emp.UserName || emp.userName);
      return empId === employeeId;
    });
  }

  getEditSelectedEmployeesNames(): string {
    if (!this.selectedProject.employees || this.selectedProject.employees.length === 0) return '';
    return this.selectedProject.employees.map((emp: any) => 
      emp.username || emp.displayName || emp.UserName || emp.userName || 'Unknown'
    ).join(', ');
  }

  getEditFilteredEmployees(): any[] {
    if (!this.employees) return [];
    const q = (this.editEmployeeSearchText || '').trim().toLowerCase();
    
    const filtered = this.employees.filter(emp => {
      const isSelectedAsTeamLead = this.isEditTeamLeadSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsTeamLead && matchesSearch;
    });
    
    return filtered;
  }

  createProject() {
    if (!this.project.projectName || this.project.teamLeads.length === 0 || this.project.employees.length === 0) {
      alert('Please fill all required fields: Project Name, Team Leads, and Employees.');
      return;
    }

    if (!this.project.startDate || !this.project.expectedEndDate) {
      alert('Please select both start and end dates.');
      return;
    }

    this.isLoading = true;

    const projectData = {
      projectName: this.project.projectName,
      teamLeads: this.project.teamLeads.map((emp: any) => 
        emp.username || emp.displayName || emp.UserName || emp.userName
      ),
      employees: this.project.employees.map((emp: any) => 
        emp.username || emp.displayName || emp.UserName || emp.userName
      ),
      startDate: this.dateUtils.formatDateForBackend(this.project.startDate),
      expectedEndDate: this.dateUtils.formatDateForBackend(this.project.expectedEndDate)
    };

    console.log('Creating project with payload:', projectData);
    console.log('Original startDate:', this.project.startDate);
    console.log('Original expectedEndDate:', this.project.expectedEndDate);
    console.log('Formatted startDate:', this.dateUtils.formatDateForBackend(this.project.startDate));
    console.log('Formatted expectedEndDate:', this.dateUtils.formatDateForBackend(this.project.expectedEndDate));

    this.projectService.createProject(projectData).subscribe({
      next: (response: any) => {
        console.log('Project created successfully:', response);
        this.isLoading = false;
        this.showSuccessMessage = true;

        const newProject = {
          ...projectData,
          _id: response._id || response.id || Date.now().toString(),
          teamLeads: [...this.project.teamLeads],
          employees: [...this.project.employees]
        };

        this.projects.unshift(newProject);
        this.filteredProjects = [...this.projects];

        setTimeout(() => {
          this.showSuccessMessage = false;
          this.showCreateProjectBox = false;
          this.showTeamLeadsDropdown = false;
          this.showEmployeeDropdown = false;
          this.resetCreateForm();
        }, 300);
      },
      error: (err: any) => {
        console.error('Error creating project:', err);
        this.isLoading = false;
        alert('Failed to create project: ' + (err.message || 'Unknown error. Check console.'));
      }
    });
  }

  private resetCreateForm() {
    this.project = {
      projectName: '',
      teamLeads: [],
      employees: [],
      startDate: '',
      expectedEndDate: ''
    };
  }

deleteProject(project: any) {
  const projectId = project?._id || project?.id;

  if (!projectId) {
    console.error('Invalid project ID:', projectId);
    this.snackBar.open('Invalid project ID provided', 'Close', { duration: 3000 });
    return;
  }

  // Check if project has any active tasks or assignments
  this.checkProjectDependencies(projectId).then((hasDependencies) => {
    if (hasDependencies) {
      this.snackBar.open('Cannot delete project: It has active tasks or assignments', 'Close', { duration: 5000 });
      return;
    }

    // Use Material Dialog for confirmation
    const dialogRef = this.dialog.open(ProjectDeleteConfirmationDialogComponent, {
      width: '400px',
      height: 'auto',
      data: { 
        mode: 'delete',
        projectId: projectId,
        projectName: project?.projectName || 'Unknown Project',
        title: 'Confirm Project Deletion',
        message: `Are you sure you want to delete "${project?.projectName || 'this project'}"? This action cannot be undone and will remove all project data.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.performProjectDeletion(projectId);
      }
    });
  }).catch((error) => {
    console.error('Error checking project dependencies:', error);
    this.snackBar.open('Error checking project dependencies', 'Close', { duration: 3000 });
  });
}

private async checkProjectDependencies(projectId: any): Promise<boolean> {
  try {
    // Check if project has any active tasks or assignments
    // This is a placeholder - you would implement actual dependency checks based on your business logic
    // For example, check if project has assigned tasks, team members, etc.
    return false; // For now, allow deletion
  } catch (error) {
    console.error('Error fetching project dependencies:', error);
    return false; // Allow deletion if check fails
  }
}

private performProjectDeletion(projectId: any): void {
  this.isDeleting = true;
  
  this.projectService.deleteProject(projectId).subscribe({
    next: () => {
      console.log('Project deleted successfully');
      this.snackBar.open('Project deleted successfully!', 'Close', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.projects = this.projects.filter(p => (p._id || p.id) !== projectId);
      this.filteredProjects = [...this.projects];
      this.isDeleting = false;
    },
    error: (err) => {
      console.error('Delete operation failed:', err);
      
      let errorMessage = 'Failed to delete project';
      if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.status === 404) {
        errorMessage = 'Project not found';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to delete this project';
      } else if (err.status === 409) {
        errorMessage = 'Cannot delete project: It has active tasks or assignments';
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



  openEditModal(project: any) {
     
    console.log('Opening edit modal for project:', project);
    console.log('Original project startDate:', project.startDate);
    console.log('Original project expectedEndDate:', project.expectedEndDate);
    this.selectedProject = JSON.parse(JSON.stringify(project));
    console.log('After JSON copy startDate:', this.selectedProject.startDate);
    console.log('After JSON copy expectedEndDate:', this.selectedProject.expectedEndDate);
    
    if (!Array.isArray(this.selectedProject.teamLeads)) {
      this.selectedProject.teamLeads = [];
    }
    
    if (!Array.isArray(this.selectedProject.employees)) {
      this.selectedProject.employees = [];
    }
    
    if (this.selectedProject.teamLeads.length > 0 && typeof this.selectedProject.teamLeads[0] === 'string') {
      this.selectedProject.teamLeads = this.selectedProject.teamLeads.map((empName: string) => {
        const foundEmployee = this.employees.find(emp => {
          const empIdentifier = emp.username || emp.displayName || emp.UserName || emp.userName;
          return empIdentifier === empName;
        });
        return foundEmployee || { username: empName, displayName: empName, id: empName };
      });
    }
    
    if (this.selectedProject.employees.length > 0 && typeof this.selectedProject.employees[0] === 'string') {
      this.selectedProject.employees = this.selectedProject.employees.map((empName: string) => {
        const foundEmployee = this.employees.find(emp => {
          const empIdentifier = emp.username || emp.displayName || emp.UserName || emp.userName;
          return empIdentifier === empName;
        });
        return foundEmployee || { username: empName, displayName: empName, id: empName };
      });
    }
    
    console.log('Prepared edit project data:', this.selectedProject);
    this.isModalOpen = true;
  }



saveEdit() {
  if (!this.selectedProject) return;

  const projectId = this.selectedProject._id || this.selectedProject.id;
  if (!projectId) {
    alert('Cannot update project: Missing project ID');
    return;
  }


  // Use the same date formatting method to avoid timezone issues

  const projectData = {
    projectName: this.selectedProject.projectName,
    teamLeads: (this.selectedProject.teamLeads || []).map((emp: any) =>
      typeof emp === 'string'
        ? emp
        : (emp.username || emp.UserName || emp.userName || emp.displayName)
    ),
    employees: (this.selectedProject.employees || []).map((emp: any) =>
      typeof emp === 'string'
        ? emp
        : (emp.username || emp.UserName || emp.userName || emp.displayName)
    ),
    startDate: this.dateUtils.formatDateForBackend(this.selectedProject.startDate),
    expectedEndDate: this.dateUtils.formatDateForBackend(this.selectedProject.expectedEndDate),
  };

  console.log('Sending update payload:', projectData);
  console.log('Original startDate:', this.selectedProject.startDate);
  console.log('Original expectedEndDate:', this.selectedProject.expectedEndDate);
  console.log('Formatted startDate:', this.dateUtils.formatDateForBackend(this.selectedProject.startDate));
  console.log('Formatted expectedEndDate:', this.dateUtils.formatDateForBackend(this.selectedProject.expectedEndDate));

  this.projectService.updateProject(projectId, projectData).subscribe({
    next: (res: any) => {
      console.log('Project updated successfully:', res);

      const index = this.projects.findIndex(p => (p._id || p.id) === projectId);
      if (index > -1) {
        this.projects[index] = {
          ...this.projects[index],
          ...projectData,
          teamLeads: [...this.selectedProject.teamLeads],
          employees: [...this.selectedProject.employees]
        };
      }

      this.filteredProjects = [...this.projects];
      this.isModalOpen = false;
    },
    error: (err: any) => {
      console.error('Error updating project:', err);
      alert('Failed to update project: ' + (err.error?.message || err.message || 'Unknown error'));
    }
  });
}



  closeModal() {
    this.isModalOpen = false;
    this.selectedProject = null;
  }

  getTeamLeadsNames(teamLeads: any[]): string {
    if (!teamLeads || !Array.isArray(teamLeads)) return '';
    return teamLeads.map(emp => {
      if (typeof emp === 'string') return emp;
      if (emp?.fullData?.UserName) return emp.fullData.UserName;
      if (emp?.username) return emp.username;
      if (emp?.UserName) return emp.UserName;
      if (emp?.userName) return emp.userName;
      if (emp?.displayName) return emp.displayName;
      if (emp?.name) return emp.name;
      return 'Unknown';
    }).join(', ');
  }

  getEmployeeNames(employees: any[]): string {
    if (!employees || !Array.isArray(employees)) return '';
    return employees.map(emp => {
      if (typeof emp === 'string') return emp;
      if (emp?.fullData?.UserName) return emp.fullData.UserName;
      if (emp?.username) return emp.username;
      if (emp?.UserName) return emp.UserName;
      if (emp?.userName) return emp.userName;
      if (emp?.displayName) return emp.displayName;
      if (emp?.name) return emp.name;
      return 'Unknown';
    }).join(', ');
  }

  filterprojects() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredProjects = [...this.projects];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredProjects = this.projects.filter(project => 
        project.projectName.toLowerCase().includes(query) ||
        this.getTeamLeadsNames(project.teamLeads).toLowerCase().includes(query) ||
        this.getEmployeeNames(project.employees).toLowerCase().includes(query)
      );
    }
  }

}