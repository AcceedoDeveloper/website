import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {
  todayDate!: string;
  dateTime: string = '';
  userData: any = null;
  loading: boolean = true;
  searchQuery: string = '';
  hasNotification = false;

  // Task Logic
  task = {
    assignee: '',
    description: ''
  };
  showTaskBox = false;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.todayDate = new Date().toDateString();

    const now = new Date();
    this.dateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.afAuth.authState.subscribe(user => {
      if (user && user.uid) {
        const uid = user.uid;

        this.firestore.collection('users').doc(uid).valueChanges().subscribe(
          (data: any) => {
            if (data) {
              this.userData = {
                username: data.username || 'Unknown User',
                email: data.email || user.email || '',
                role: data.role || 'Viewer',
                photoURL: data.photoURL || ''
              };
              console.log('Firestore data:', data);
              console.log('userData:', this.userData);
            } else {
              this.userData = {
                username: 'Unknown',
                email: user.email || '',
                role: 'Viewer',
                photoURL: ''
              };
            }
            this.loading = false;
          },
          error => {
            console.error('Error fetching user data:', error);
            this.loading = false;
          }
        );

        // Simulate notification (for demo)
        setTimeout(() => {
          this.hasNotification = true;
        }, 2000);
      } else {
        this.loading = false;
        this.userData = null;
      }
    });
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      sessionStorage.clear();
      this.router.navigate(['/login']);
    }).catch(err => {
      console.error('Sign-out error:', err);
    });
  }

  onSearch() {
    console.log('Searching for:', this.searchQuery);
  }

  toggleTaskBox() {
    this.showTaskBox = !this.showTaskBox;
  }

  addTask() {
    if (this.task.assignee && this.task.description) {
      console.log('New Task:', this.task);
      this.task = { assignee: '', description: '' };
      this.showTaskBox = false;
    } else {
      alert('Please fill in all required fields.');
    }
  }

  // ✅ Get initials from email or name
  getInitials(value: string = ''): string {
    if (!value) return '?';

    const trimmed = value.trim();
    const namePart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
    return namePart.charAt(0).toUpperCase();
  }
}
