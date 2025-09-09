import { Component, OnInit, HostListener } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Timestamp } from 'firebase/firestore';
import { Pipe, PipeTransform } from '@angular/core';
import { CreatprojectService } from '../service/creatproject.service';
import { UserservicesService } from '../register/services/userservices.service';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) return items;

    const lower = searchText.toLowerCase();


    
    return items.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(lower)
      )
    );
  }
}

@Component({
  selector: 'app-createproject',
  templateUrl: './createproject.component.html',
  styleUrls: ['./createproject.component.css']
})
export class CreateprojectComponent implements OnInit {
[x: string]: any;
getActiveProjects() {
throw new Error('Method not implemented.');
}
getProjectProgress(_t240: any) {
throw new Error('Method not implemented.');
}
getProjectStatus(_t240: any) {
throw new Error('Method not implemented.');
}
onSearch() {
throw new Error('Method not implemented.');
}
getInitials(arg0: any) {
throw new Error('Method not implemented.');
}
openEditProfile() {
throw new Error('Method not implemented.');
}
signOut() {
throw new Error('Method not implemented.');
}
onPhotoSelected($event: Event) {
throw new Error('Method not implemented.');
}
saveProfilePicture() {
throw new Error('Method not implemented.');
}
closeEditModal() {
throw new Error('Method not implemented.');
}
  projects: any[] = [];
  employees: any[] = [];
  userData: any = null;

  project: any = {
    projectName: '',
    employees: [],
    startDate: '',
    expectedEndDate: ''
  };

  showCreateProjectBox = false;
  showSuccessMessage = false;
  searchQuery: string = '';
  isModalOpen = false;
  selectedProject: any = null;
  filteredProjects: any[] = [];
  showEmployeeDropdown = false;
  employeeSearchText = '';

  // Profile Edit Modal
  showEditModal = false;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;

  currentDateTime: string = '';
  dateTime: string = '';
  hasNotification = false;

  constructor(
    private afs: AngularFirestore, 
    private afAuth: AngularFireAuth,
    private projectService: CreatprojectService,
    private userService: UserservicesService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchProjects();
    this.fetchEmployees();
    this.updateTime();
    
    // Add click listener to close dropdown when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    // Remove event listener when component is destroyed
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  onDocumentClick(event: MouseEvent) {
    // Close dropdown if clicked outside
    if (this.showEmployeeDropdown) {
      const dropdown = document.querySelector('.employees-dropdown');
      const input = document.querySelector('.employees-input-container');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          input && !input.contains(event.target as Node)) {
        this.showEmployeeDropdown = false;
      }
    }
  }

  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }

  toggleCreateProjectBox() {
    this.showCreateProjectBox = !this.showCreateProjectBox;
    if (this.showCreateProjectBox) {
      this.project = {
        projectName: '',
        employees: [],
        startDate: '',
        expectedEndDate: ''
      };
    }
  }

  cancel() {
    this.project = {
      projectName: '',
      employees: [],
      startDate: '',
      expectedEndDate: ''
    };
    this.showCreateProjectBox = false;
    this.showEmployeeDropdown = false;
  }

  fetchProjects() {
    // Get projects from backend API instead of Firestore
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        console.log('Projects from API:', response);
        if (Array.isArray(response)) {
          this.projects = response;
          this.filteredProjects = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.projects = response.data;
          this.filteredProjects = response.data;
        } else {
          console.error('Unexpected API response format:', response);
          // Fallback to Firestore if API fails
          this.fetchProjectsFromFirestore();
        }
      },
      error: (error: any) => {
        console.error('Error fetching projects from API:', error);
        // Fallback to Firestore if API fails
        this.fetchProjectsFromFirestore();
      }
    });
  }

  fetchProjectsFromFirestore() {
    this.afs
      .collection('projects', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        this.projects = data;
        this.filteredProjects = data;
      });
  }

  filterProjects() {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.projects];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredProjects = this.projects.filter(project => 
      project.projectName.toLowerCase().includes(query) ||
      this.getEmployeeNames(project.employees).toLowerCase().includes(query)
    );
  }

  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
  }
fetchEmployees() {
  this.userService.getuser().subscribe({
    next: (response: any) => {
      let employeesData: any[] = [];

      if (Array.isArray(response)) {
        employeesData = response;
      } else if (response && typeof response === 'object') {
        if (response.data && Array.isArray(response.data)) {
          employeesData = response.data;
        } else {
          employeesData = Object.values(response);
        }
      }

      this.employees = employeesData
        .filter((u: any) => u && (u.UserName || u.userName || (u.firstName && u.lastName)))
        .map((u: any) => {
          const username = u.UserName || u.userName || '';
          const displayName = username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.UserCode || '';
          return {
            id: u.id || u._id || u.UserCode || Math.random().toString(36).substr(2, 9),
            username,          // canonical username (from DB: UserName or userName)
            displayName,       // fallback display name
            fullData: u
          };
        });

      // fallback if list empty
      if (!this.employees || this.employees.length === 0) {
        this.employees = [
          { id: '1', username: 'sabari', displayName: 'Sabari', fullData: { UserName: 'sabari' } },
          { id: '2', username: 'rushi', displayName: 'rushi', fullData: { UserName: 'rushi' } }
        ];
      }
    },
    error: (err) => {
      console.error('Error fetching employees:', err);
      this.employees = [
        { id: '1', username: 'sabari', displayName: 'Sabari', fullData: { UserName: 'sabari' } },
        { id: '2', username: 'rushi', displayName: 'rushi', fullData: { UserName: 'rushi' } }
      ];
    }
  });
}


  getCurrentUser() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.afs
          .collection('users')
          .doc(user.uid)
          .valueChanges()
          .subscribe((data) => {
            this.userData = data;
          });
      }
    });
  }

toggleEmployeeSelection(employee: any) {
  if (this.project.employees.length && this.project.employees[0].id === employee.id) {
    this.project.employees = [];
  } else {
    this.project.employees = [employee];
  }

  this.showEmployeeDropdown = false;
  this.employeeSearchText = '';
}
isEmployeeSelected(employee: any): boolean {
  return this.project.employees.length > 0 && this.project.employees[0].id === employee.id;
}


getSelectedEmployeesNames(): string {
  if (!this.project.employees || this.project.employees.length === 0) return '';
  const emp = this.project.employees[0];
  return emp?.username || emp?.displayName || '';
}
getFilteredEmployees(): any[] {
  if (!this.employees) return [];
  const q = (this.employeeSearchText || '').trim().toLowerCase();
  if (!q) return this.employees;
  return this.employees.filter(emp =>
    (emp.username || emp.displayName || '').toLowerCase().includes(q)
  );
}
createProject() {
  if (!this.project.projectName || this.project.employees.length === 0) {
    alert('Please fill all required fields');
    return;
  }

  if (!this.project.startDate || !this.project.expectedEndDate) {
    alert('Please select both start and end dates');
    return;
  }

  const projectData = {
    projectName: this.project.projectName,
    // send the canonical username strings to API
    employees: this.project.employees.map((emp: any) =>
      emp.fullData?.UserName || emp.fullData?.userName || emp.username || emp.displayName || ''
    ),
    startDate: new Date(this.project.startDate).toISOString().split('T')[0],
    expectedEndDate: new Date(this.project.expectedEndDate).toISOString().split('T')[0]
  };

  console.log('Sending project data (usernames):', projectData);

  this.projectService.createProject(projectData).subscribe({
    next: (response: any) => {
      console.log('Project created:', response);
      this.showSuccessMessage = true;

      // keep the UI list as objects (so dropdown still works)
      const newProject = {
        ...projectData,
        _id: response._id || Date.now().toString(),
        employees: [...this.project.employees]
      };

      this.projects.unshift(newProject);
      this.filteredProjects = [...this.projects];

      setTimeout(() => {
        this.showSuccessMessage = false;
        this.showCreateProjectBox = false;
        this.showEmployeeDropdown = false;
      }, 2000);
    },
    error: (err: any) => {
      console.error('Error creating project:', err);
      alert('Failed to create project: ' + (err.error?.message || err.message || 'Unknown error'));
    }
  });
}
deleteProject(project: any) {
  if (confirm('Are you sure you want to delete this project?')) {
    
    const projectId = project._id || project.id;

    if (!projectId) {
      console.error('Project ID is missing:', project);
      alert('Cannot delete project: Missing project ID');
      return;
    }

    this.projectService.deleteProject(projectId).subscribe({
      next: (response: any) => {
        console.log('Project deleted successfully:', response);
        this.projects = this.projects.filter(p => (p._id || p.id) !== projectId);
        this.filteredProjects = this.filteredProjects.filter(p => (p._id || p.id) !== projectId);
      },
      error: (error: any) => {
        console.error('Error deleting project:', error);
        alert('Failed to delete project: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }
}


  openEditModal(project: any) {
    this.selectedProject = { ...project };
    this.isModalOpen = true;
  }
saveEdit() {
  if (!this.selectedProject) return;

  const projectData = {
    projectName: this.selectedProject.projectName,
    employees: this.selectedProject.employees.map((emp: any) => 
      emp.fullData?.UserName || emp.UserName || emp.userName || emp.name
    ),
    startDate: this.selectedProject.startDate,
    expectedEndDate: this.selectedProject.expectedEndDate
  };

  this.projectService.updateProject(this.selectedProject._id, projectData).subscribe({
    next: (response: any) => {
      console.log('Project updated successfully:', response);
      const index = this.projects.findIndex(p => p._id === this.selectedProject._id);
      if (index > -1) {
        this.projects[index] = { ...this.projects[index], ...projectData };
      }
      this.filteredProjects = [...this.projects];
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
        this.isModalOpen = false;
      }, 2000);
    },
    error: (error: any) => {
      console.error('Error updating project:', error);
      alert('Failed to update project: ' + (error.error?.message || error.message || 'Unknown error'));
    }
  });
}


  closeModal() {
    this.isModalOpen = false;
  }

  // Helper function to display employee names in the template
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
}