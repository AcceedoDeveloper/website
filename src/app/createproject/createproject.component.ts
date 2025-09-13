import { Component, OnInit, HostListener } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CreatprojectService } from '../service/creatproject.service';
import { UserservicesService } from '../register/services/userservices.service';

@Component({
  selector: 'app-createproject',
  templateUrl: './createproject.component.html',
  styleUrls: ['./createproject.component.css']
})
export class CreateprojectComponent implements OnInit {
  projects: any[] = [];
  employees: any[] = [];
  userData: any = null;

  project: any = {
    projectName: '',
    teamLeads: [],
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
  
  // Team leads dropdown variables
  showTeamLeadsDropdown = false;
  teamLeadsSearchText = '';
  showEditTeamLeadsDropdown = false;
  editTeamLeadsSearchText = '';
  
  // Employees dropdown variables
  showEmployeeDropdown = false;
  employeeSearchText = '';
  showEditEmployeeDropdown = false;
  editEmployeeSearchText = '';

  dateTime: string = '';

  constructor(
    private afs: AngularFirestore, 
    private afAuth: AngularFireAuth,
    private projectService: CreatprojectService,
    private userserives: UserservicesService,
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchProjects();
    this.updateTime();
    this.getuserdata(); // Added to fetch employees
    
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
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
    this.projectService.getProjects().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.projects = response;
          this.filteredProjects = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.projects = response.data;
          this.filteredProjects = response.data;
        } else {
          console.error('Unexpected API response format:', response);
          this.fetchProjectsFromFirestore();
        }
      },
      error: (error: any) => {
        console.error('Error fetching projects from API:', error);
        this.fetchProjectsFromFirestore();
      }
    });
  }

  userdata: any;

  fetchProjectsFromFirestore() {
    this.afs
      .collection('projects', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        this.projects = data;
        this.filteredProjects = data;
      });
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
          this.employees = this.userdata; // Set employees data
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data)];
          this.employees = this.userdata; // Set employees data
        } else {
          console.warn('Unexpected response format:', data);
          this.userdata = [];
          this.employees = [];
        }
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
        processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photo}`;
      }
    } else {
      processedUser.photoURL = 'assets/default-avatar.png';
    }
    
    return processedUser;
  }

  // Team Leads Functions
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
    
    // Filter employees and exclude those already selected as regular employees
    const filtered = this.employees.filter(emp => {
      const isSelectedAsEmployee = this.isEmployeeSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsEmployee && matchesSearch;
    });
    
    return filtered;
  }

  // Employees Functions (excluding team leads)
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
    
    // Filter employees and exclude those already selected as team leads
    const filtered = this.employees.filter(emp => {
      const isSelectedAsTeamLead = this.isTeamLeadSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsTeamLead && matchesSearch;
    });
    
    return filtered;
  }

  // Edit Modal Functions for Team Leads
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
    
    // Filter employees and exclude those already selected as regular employees in edit
    const filtered = this.employees.filter(emp => {
      const isSelectedAsEmployee = this.isEditEmployeeSelected(emp);
      const matchesSearch = !q || (emp.username || emp.displayName || emp.UserName || emp.userName || '')
        .toLowerCase().includes(q);
      
      return !isSelectedAsEmployee && matchesSearch;
    });
    
    return filtered;
  }

  // Edit Modal Functions for Employees
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
    
    // Filter employees and exclude those already selected as team leads in edit
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
      alert('Please fill all required fields');
      return;
    }

    if (!this.project.startDate || !this.project.expectedEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    const projectData = {
      projectName: this.project.projectName,
      teamLeads: this.project.teamLeads.map((emp: any) => 
        emp.username || emp.displayName || emp.UserName || emp.userName
      ),
      employees: this.project.employees.map((emp: any) => 
        emp.username || emp.displayName || emp.UserName || emp.userName
      ),
      startDate: new Date(this.project.startDate).toISOString().split('T')[0],
      expectedEndDate: new Date(this.project.expectedEndDate).toISOString().split('T')[0]
    };

    this.projectService.createProject(projectData).subscribe({
      next: (response: any) => {
        console.log('Project created:', response);
        this.showSuccessMessage = true;

        const newProject = {
          ...projectData,
          _id: response._id || Date.now().toString(),
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
    this.selectedProject = JSON.parse(JSON.stringify(project));
    
    // Initialize teamLeads and employees arrays if they don't exist
    if (!Array.isArray(this.selectedProject.teamLeads)) {
      this.selectedProject.teamLeads = [];
    }
    
    if (!Array.isArray(this.selectedProject.employees)) {
      this.selectedProject.employees = [];
    }
    
    // Convert string arrays to employee objects for teamLeads
    if (this.selectedProject.teamLeads.length > 0 && typeof this.selectedProject.teamLeads[0] === 'string') {
      this.selectedProject.teamLeads = this.selectedProject.teamLeads.map((empName: string) => {
        const foundEmployee = this.employees.find(emp => {
          const empIdentifier = emp.username || emp.displayName || emp.UserName || emp.userName;
          return empIdentifier === empName;
        });
        return foundEmployee || { username: empName, displayName: empName, id: empName };
      });
    }
    
    // Convert string arrays to employee objects for employees
    if (this.selectedProject.employees.length > 0 && typeof this.selectedProject.employees[0] === 'string') {
      this.selectedProject.employees = this.selectedProject.employees.map((empName: string) => {
        const foundEmployee = this.employees.find(emp => {
          const empIdentifier = emp.username || emp.displayName || emp.UserName || emp.userName;
          return empIdentifier === empName;
        });
        return foundEmployee || { username: empName, displayName: empName, id: empName };
      });
    }
    
    this.isModalOpen = true;
  }

  saveEdit() {
    if (!this.selectedProject) return;

    const projectId = this.selectedProject._id || this.selectedProject.id;
    if (!projectId) {
      alert('Cannot update project: Missing project ID');
      return;
    }

    const formatDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    };

    const projectData = {
      projectName: this.selectedProject.projectName,
      teamLeads: this.selectedProject.teamLeads.map((emp: any) =>
        typeof emp === 'string'
          ? emp
          : emp.userName || emp.username || emp.displayName || emp.UserName
      ),
      employees: this.selectedProject.employees.map((emp: any) =>
        typeof emp === 'string'
          ? emp
          : emp.userName || emp.username || emp.displayName || emp.UserName
      ),
      startDate: formatDate(this.selectedProject.startDate),
      expectedEndDate: formatDate(this.selectedProject.expectedEndDate)
    };

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
        alert('Failed to update project. Please check backend.');
      }
    });
  }

  closeModal() {
    this.isModalOpen = false;
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
}