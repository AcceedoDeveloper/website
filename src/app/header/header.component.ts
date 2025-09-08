import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router, ActivatedRoute } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] 
})
export class HeaderComponent implements OnInit {

  user = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: '',
    username: '',
    password: ''
  };

  confirmPassword = '';
  formSubmitted = false;

  userData: any = null;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;

  showEditModal = false;
  searchQuery = '';
  hasNotification = false;
  dateTime = '';
  currentDateTime = '';

  tasks: any[] = [];
  users: any[] = [];
  filteredTasks: any[] = [];

  task: any = {
    assignee: '',
    description: '',
    priority: '',
    status: 'todo',
    createdAt: null,
    dueDate: null,
    timeEstimate: '',
    attachment: '',
    fileName: ''
  };


  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}


  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchTasks();
    this.fetchUsers();
    this.updateTime();

    console.log('🔎 Role from Firestore/UserData:', this.userData?.role);
    console.log('🔎 Role from SessionStorage:', sessionStorage.getItem('role'));
  }

  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }


  onSearch() {
    const query = this.searchQuery.toLowerCase();
    this.filteredTasks = this.tasks.filter(task =>
      task.description.toLowerCase().includes(query)
    );
  }


  fetchTasks() {
    this.afs
      .collection('tasks', ref => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe(data => {
        this.tasks = data;
      });
  }

  fetchUsers() {
    this.afs
      .collection('users')
      .valueChanges({ idField: 'id' })
      .subscribe(users => {
        this.users = users;
      });
  }

  getCurrentUser() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.afs
          .collection('users')
          .doc(user.uid)
          .valueChanges()
          .subscribe(data => {
            this.userData = data;
          });
      }
    });
  }


  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfilePicture() {
    if (!this.userData?.uid) return;
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
    this.afAuth.signOut().then(() => {
      sessionStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
  }


  onSubmit(form: any) {
    if (form.valid && this.user.password === this.confirmPassword) {
  
      console.log('✅ User created:', this.user);

      sessionStorage.setItem('role', this.user.role);
      sessionStorage.setItem(
        'username',
        `${this.user.firstName} ${this.user.lastName}`
      );
      sessionStorage.setItem('email', this.user.email);

      this.snackBar.open('User created successfully!', 'Close', {
        duration: 3000
      });

      this.formSubmitted = true;
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    } else {
      this.snackBar.open(
        'Form invalid or passwords do not match!',
        'Close',
        { duration: 3000 }
      );
    }
  }
}
