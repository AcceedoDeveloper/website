


import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Timestamp } from 'firebase/firestore';
import { Pipe, PipeTransform } from '@angular/core';


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
  selector: 'app-ngrx',
  templateUrl: './ngrx.component.html',
  styleUrl: './ngrx.component.css'
})
export class NgrxComponent {
    isNavOpen = false;
    isDropdownOpen=false;
    showrole=false;
  tasks: any[] = [];
  users: any[] = [];
  userData: any = null;
    onNavCheckChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.isNavOpen = target.checked;
    console.log('Hamburger menu toggled, nav open:', this.isNavOpen);
    if (!this.isNavOpen) {
      this.isDropdownOpen = false; 
      console.log('Dropdown closed due to hamburger menu closing');
    }
  }

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

  editComment: string = '';
  showTaskBox =false;
  showSuccessMessage = false;
  showUserDropdown = false;
  searchQuery: string = '';
  dropdownOpen = false;
  
  isModalOpen = false;
  selectedTask: any = null;
 
filteredTasks: any[] = [];

  // Profile Edit Modal
  showEditModal = false;
  editUserData: any = {};
  previewImage: string | ArrayBuffer | null = null;

  currentDateTime: string = '';
  dateTime: string = '';
  hasNotification = false;

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchTasks();
    this.fetchUsers();
    this.updateTime();
     this.fetchTasks();
  }


  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }

  toggleTaskBox() {
    this.showTaskBox = !this.showTaskBox;
  }
  

  isAdmin(): boolean {
  // Always read from sessionStorage first
  const role = sessionStorage.getItem('role') || this.userData?.role || '';
  return role?.toLowerCase() === 'admin';
}


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  //show role
  getrole()
  {
    this.showrole=!this.showrole;
  }

  

  cancel() {
    this.task = {
      assignee: '',
      description: '',
      status: 'todo',
      createdAt: null,
      dueDate: null,
      timeEstimate: '',
      attachment: ''
    };
    this.showTaskBox = false;
  }

 onSearch() {
  const query = this.searchQuery.toLowerCase();
  this.filteredTasks = this.tasks.filter(task =>
    task.description.toLowerCase().includes(query)
  );
}

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.task.attachment = file.name;
    }
  }

  onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    this.task.attachment = file;
    this.task.fileName = file.name;
  }
}

  fetchTasks() {
    this.afs
      .collection('tasks', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' })
      .subscribe((data) => {
        this.tasks = data;
      });
  }


  fetchUsers() {
    this.afs
      .collection('users')
      .valueChanges({ idField: 'id' })
      .subscribe((users) => {
        this.users = users;
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

  selectAssignee(user: any) {
    this.task.assignee =
      user.username ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email;
    this.showUserDropdown = false;
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  addTask() {
    if (!this.task.description || !this.task.assignee) return;

    const newTask = {
      ...this.task,
      createdAt: Timestamp.now(),
      assignedBy: this.userData?.uid || 'admin'
    };

    this.afs.collection('tasks').add(newTask).then(() => {
      this.showSuccessMessage = true;
      setTimeout(() => (this.showSuccessMessage = false), 2000);
      this.fetchTasks();
      this.cancel();
    });
  }

  deleteTask(task: any) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.afs.collection('tasks').doc(task.id).delete();
    }
  }

  openEditModal(task: any) {
    this.selectedTask = { ...task };
    this.editComment = task.description;
    this.isModalOpen = true;
  }

  saveEdit() {
    if (!this.selectedTask || !this.editComment) return;

    this.afs
      .collection('tasks')
      .doc(this.selectedTask.id)
      .update({
        description: this.editComment
      })
      .then(() => {
        this.isModalOpen = false;
        this.fetchTasks();
      });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  markAsCompleted(task: any) {
    this.afs
      .collection('tasks')
      .doc(task.id)
      .update({ status: 'done' })
      .then(() => {
        this.fetchTasks();
      });
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
