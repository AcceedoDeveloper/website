// src/app/projects/projects.component.ts
import { Component, OnInit } from '@angular/core';
import { CreatprojectService } from '../service/creatproject.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  userData: any = null;
  displayName = 'User';
  username = '';
  projects: any[] = [];
  filteredProjects: any[] = [];
  searchQuery = '';
  loading = false;
  error = '';
dateTime: any;

  constructor(private projectService: CreatprojectService) { }

  ngOnInit(): void {
    this.loadUserFromSession();
  }

  private loadUserFromSession() {
    // Try to read JSON user object saved in sessionStorage under 'user'
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        this.userData = JSON.parse(userStr);
      } catch {
        // If stored as plain string, use it as displayName
        this.userData = { UserName: userStr };
      }
    } else {
      // fallback to 'username' key if your login uses it
      const usernameOnly = sessionStorage.getItem('username');
      if (usernameOnly) this.userData = { UserName: usernameOnly };
    }

    // Determine display name & username to call backend
    this.displayName =
      this.userData?.UserName ||
      this.userData?.username ||
      this.userData?.userName ||
      this.userData?.name ||
      'User';

    this.username = this.displayName;

    if (this.username) {
      this.fetchProjectsByEmployee(this.username);
    } else {
      this.error = 'No logged-in user found in sessionStorage.';
    }
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

  fetchProjectsByEmployee(userName: string) {
    this.loading = true;
    this.error = '';
    this.projectService.getProjectsByEmployee(userName).subscribe({
      next: (res: any) => {
        this.loading = false;

        // handle a few common response shapes
        if (Array.isArray(res)) {
          this.projects = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.projects = res.data;
        } else if (res?.projects && Array.isArray(res.projects)) {
          this.projects = res.projects;
        } else if (res?.result && Array.isArray(res.result)) {
          this.projects = res.result;
        } else if (res && typeof res === 'object' && Object.keys(res).length === 0) {
          this.projects = [];
        } else {
          // Last resort: wrap single object into array if it looks like a project
          if (res && (res.projectName || res.name)) {
            this.projects = [res];
          } else {
            this.projects = [];
          }
        }

        this.filteredProjects = [...this.projects];
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading projects by employee:', err);
        this.error = 'Failed to load projects — check console and backend API.';
        this.projects = [];
        this.filteredProjects = [];
      }
    });
  }

  filterProjects() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.filteredProjects = [...this.projects];
      return;
    }
    this.filteredProjects = this.projects.filter(p =>
      (p.projectName || p.name || '').toString().toLowerCase().includes(q) ||
      (p._id || p.id || '').toString().toLowerCase().includes(q)
    );
  }

  formatDate(d: any) {
    if (!d) return '';
    // Accept either ISO strings or Date objects
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime && dt.getTime())) return d;
    return dt.toLocaleDateString();
  }
}
