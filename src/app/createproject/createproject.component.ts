import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CreatprojectService } from '../service/creatproject.service';
import { UserservicesService } from '../register/services/userservices.service';

@Component({
  selector: 'app-createproject',
  templateUrl: './createproject.component.html',
  styleUrls: ['./createproject.component.css']
})
export class CreateprojectComponent implements OnInit, OnDestroy {
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
    private afs: AngularFirestore, 
    private afAuth: AngularFireAuth,
    private projectService: CreatprojectService,
    private userserives: UserservicesService,
  ) {
    // Bind the method with the correct signature
    this.documentClickListener = this.onDocumentClick.bind(this);
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
    this.afs
      .collection('projects', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        console.log('Firestore projects:', data);
        this.projects = data;
        this.filteredProjects = [...data];
      });
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
        processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photo}`;
      }
    } else {
      processedUser.photoURL = 'assets/default-avatar.png';
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

    console.log('Creating project with payload:', projectData);

    this.projectService.createProject(projectData).subscribe({
      next: (response: any) => {
        console.log('Project created successfully:', response);
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
        }, 2000);
      },
      error: (err: any) => {
        console.error('Error creating project:', err);
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
    alert('Invalid project ID');
    return;
  }

  if (confirm('Are you sure you want to delete this project?')) {
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => (p._id || p.id) !== projectId);
        this.filteredProjects = [...this.projects];
        alert('Project deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting project:', err);
        alert('Failed to delete project. Please try again.');
      }
    });
  }
}



  openEditModal(project: any) {
    console.log('Opening edit modal for project:', project);
    this.selectedProject = JSON.parse(JSON.stringify(project));
    
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

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
  };

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
    startDate: formatDate(this.selectedProject.startDate),
    expectedEndDate: formatDate(this.selectedProject.expectedEndDate),
  };

  console.log('Sending update payload:', projectData);

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
}