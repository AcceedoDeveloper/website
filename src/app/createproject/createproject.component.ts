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
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase();
    this.filteredProjects = this.projects.filter(project =>
      project.projectName.toLowerCase().includes(query)
    );
  }

  fetchProjects() {
    this.afs
      .collection('projects', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        this.projects = data;
        this.filteredProjects = data;
      });
  }

  fetchEmployees() {
    this.userService.getuser().subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        
        // Extract usernames from the response
        if (Array.isArray(response)) {
          this.employees = response
            .filter(user => user && user.userName) // Filter out undefined/null users
            .map(user => user.userName);
        } else if (response && typeof response === 'object') {
          // Handle object response
          if (response.data && Array.isArray(response.data)) {
            this.employees = response.data
              .filter((user: { userName: any; }) => user && user.userName)
              .map((user: { userName: any; }) => user.userName);
          } else {
            // Convert object values to array
            this.employees = Object.values(response)
              .filter(user => user && (user as any).userName)
              .map(user => (user as any).userName);
          }
        }
        
        console.log('Processed employees:', this.employees);
        
        // If still empty, use fallback data
        if (this.employees.length === 0) {
          this.employees = ['Sabari', 'rushi'];
          console.log('Using fallback employee data:', this.employees);
        }
      },
      error: (error: any) => {
        console.error('Error fetching employees:', error);
        // Fallback data
        this.employees = ['Sabari', 'rushi'];
        console.log('Using fallback employee data due to error:', this.employees);
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

  toggleEmployeeSelection(employee: string) {
    const index = this.project.employees.indexOf(employee);
    
    if (index > -1) {
      this.project.employees.splice(index, 1);
    } else {
      this.project.employees.push(employee);
    }
  }

  isEmployeeSelected(employee: string): boolean {
    return this.project.employees.includes(employee);
  }

  getSelectedEmployeesNames(): string {
    return this.project.employees.join(', ');
  }

  getFilteredEmployees() {
    if (!this.employeeSearchText) {
      return this.employees;
    }
    
    return this.employees.filter(employee => 
      employee.toLowerCase().includes(this.employeeSearchText.toLowerCase())
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

    // Format dates properly
    const projectData = {
      projectName: this.project.projectName,
      employees: this.project.employees,
      startDate: new Date(this.project.startDate).toISOString().split('T')[0],
      expectedEndDate: new Date(this.project.expectedEndDate).toISOString().split('T')[0]
    };

    console.log('Sending project data:', projectData);

    this.projectService.createProject(projectData).subscribe({
      next: (response: any) => {
        console.log('Project created successfully:', response);
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.showSuccessMessage = false;
          this.showCreateProjectBox = false;
        }, 2000);
        
        // Also save to Firestore if needed
        this.afs.collection('projects').add({
          ...projectData,
          createdAt: Timestamp.now(),
          createdBy: this.userData?.uid || 'admin'
        }).then(() => {
          this.fetchProjects();
        });
      },
      error: (error: { error: { message: any; }; message: any; }) => {
        console.error('Error creating project:', error);
        console.error('Error details:', error.error);
        alert('Failed to create project: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  deleteProject(project: any) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.afs.collection('projects').doc(project.id).delete();
    }
  }

  openEditModal(project: any) {
    this.selectedProject = { ...project };
    this.isModalOpen = true;
  }

  saveEdit() {
    if (!this.selectedProject) return;

    this.afs
      .collection('projects')
      .doc(this.selectedProject.id)
      .update({
        projectName: this.selectedProject.projectName
      })
      .then(() => {
        this.isModalOpen = false;
        this.fetchProjects();
      });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // Profile Modal Methods
  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfilePicture() {
    this.afs
      .collection('users')
      .doc(this.userData.uid)
      .update(this.editUserData)
      .then(() => {
        this.showEditModal = false;
        this.getCurrentUser();
      });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
        this.editUserData.photoURL = this.previewImage;
      };
      reader.readAsDataURL(file);
    }
  }

  signOut() {
    this.afAuth.signOut();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.employees-dropdown-container')) {
      this.showEmployeeDropdown = false;
    }
  }
}