import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css'],
})
export class ProjectComponent implements OnInit {
  userData: any = {}; // 🔧 Fix for userData
  dateTime: string = ''; // 🔧 Fix for dateTime
  searchQuery: string = '';
  hasNotification: boolean = false;

  showTaskBox = false;
  showSuccessMessage = false;
  tasks: any[] = [];
  task = {
    assignee: '',
    description: '',
  };

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000); // Live time update
    this.fetchTasks();
  }

  updateDateTime() {
    this.dateTime = new Date().toLocaleString();
  }

  loadUserData() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        const uid = user.uid;
        this.firestore
          .collection('users')
          .doc(uid)
          .valueChanges()
          .subscribe((data: any) => {
            this.userData = data;
          });
      }
    });
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase();
  }

  toggleTaskBox() {
    this.showTaskBox = !this.showTaskBox;
  }

  addTask() {
  const { assignee, description } = this.task;
  if (!assignee.trim() || !description.trim()) return;

  const newTask = {
    assignee,
    description,
    createdAt: new Date(),
    assignerUid: this.userData?.uid || '',
    assigneeUid: assignee, // Assuming this is the UID of the assignee
  };

  this.firestore
    .collection('tasks')
    .add(newTask)
    .then(() => {
      this.task = { assignee: '', description: '' };
      this.showSuccessMessage = true;
      setTimeout(() => (this.showSuccessMessage = false), 2000);
      this.fetchTasks();
    });
}


  fetchTasks() {
    this.firestore
      .collection('tasks', (ref) => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges()
      .subscribe((res) => {
        this.tasks = res.map((e: any) => {
          const data = e.payload.doc.data();
          const id = e.payload.doc.id;
          return { id, ...data }; // ✅ Your previous error fixed
        });
      });
  }

  onSearch() {
    // Optional: implement search logic
  }
}
