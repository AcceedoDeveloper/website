import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, OnDestroy {
  todayDate!: string;
  dateTime: string = '';
  userData: any = null;

  tasks: any[] = [];
  showSuccessMessage: boolean = false;

  editUserData: any = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: '',
    mobile: '',
    photoURL: ''
  };

  loading = true;
  searchQuery: string = '';
  hasNotification = false;
  showEditModal = false;
  previewImage: string | null = null;
  selectedPhotoFile: File | null = null;

  task = {
    assignee: '',
    description: ''
  };

  users: any[] = [];
  showUserDropdown: boolean = false;

  showTaskBox = false;
  intervalId: any;
  isModalOpen: boolean = false;
  editComment: string = '';
  selectedFile: File | null = null;
  editTaskId: string | null = null;
  isProfileMenuOpen = false;

  @ViewChild('profileMenu', { static: false }) profileMenuRef!: ElementRef;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.todayDate = new Date().toDateString();
    this.updateDateTime();
    this.intervalId = setInterval(() => this.updateDateTime(), 1000);
    console.log('Modal state at init:', this.isModalOpen);

    this.afAuth.authState.subscribe(user => {
      if (user && user.email) {
        this.firestore
          .collection('users', ref => ref.where('email', '==', user.email))
          .get()
          .subscribe(snapshot => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const data: any = doc.data();

              this.userData = {
                username: data.username || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                email: data.email || user.email,
                role: data.role || 'User',
                photoURL: data.photoURL || user.photoURL || '',
                mobile: data.mobile || '',
                uid: data.uid || ''
              };

              Object.keys(this.userData).forEach(key => {
                const typedKey = key as keyof typeof this.userData;
                sessionStorage.setItem(key, this.userData[typedKey]);
              });
            } else {
              this.loadFromSession();
            }

            this.fetchTasks();
            this.loading = false;
          });
      } else {
        this.loadFromSession();
        this.fetchTasks();
        this.loading = false;
      }

      setTimeout(() => {
        this.hasNotification = true;
      }, 2000);
    });

    this.fetchUsers();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadFromSession() {
    this.userData = {
      firstName: sessionStorage.getItem('firstName') || '',
      lastName: sessionStorage.getItem('lastName') || '',
      username: sessionStorage.getItem('username') || 'Guest',
      email: sessionStorage.getItem('email') || '',
      role: sessionStorage.getItem('role') || 'User',
      photoURL: sessionStorage.getItem('photoURL') || '',
      mobile: sessionStorage.getItem('mobile') || ''
    };
  }

  signOut() {
    this.afAuth.signOut().then(() => {
      sessionStorage.clear();
      this.router.navigate(['/login']);
    }).catch(err => {
      console.error('Sign-out failed:', err);
    });
  }

  onSearch() {
    console.log('Searching:', this.searchQuery);
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
      assigneeUid: assignee
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

  cancel() {
    this.task = { assignee: '', description: '' };
    this.showTaskBox = false;
  }

  fetchTasks() {
    this.firestore
      .collection('tasks', ref => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges()
      .subscribe(res => {
        this.tasks = res.map((e: any) => {
          const data = e.payload.doc.data();
          const id = e.payload.doc.id;
          return { id, ...data };
        });
      });
  }

  getInitials(value: string = ''): string {
    if (!value) return '?';
    const trimmed = value.trim();
    const namePart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
    return namePart.charAt(0).toUpperCase();
  }

  updateDateTime() {
    this.dateTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  openEditProfile() {
    this.editUserData = {
      ...this.userData
    };
    this.previewImage = this.userData.photoURL || null;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedPhotoFile = null;
  }

  openEditModal(task: any) {
    console.log('button is on');
    this.isModalOpen = true;
    this.editComment = task.description || '';
    this.editTaskId = task.id;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editComment = '';
    this.editTaskId = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  saveEdit() {
    if (!this.editTaskId) return;

    const updatedTask: any = {
      description: this.editComment
    };

    if (this.selectedFile) {
      updatedTask.fileName = this.selectedFile.name;
    }
    console.log('edit data', this.editComment);
    this.firestore.collection('tasks').doc(this.editTaskId).update(updatedTask).then(() => {
      this.fetchTasks();
      this.closeModal();
    });
  }

  deleteTask(task: any) {
    this.firestore.collection('tasks').doc(task.id).delete().then(() => {
      this.fetchTasks();
    });
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhotoFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        this.previewImage = (e.target as FileReader).result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfilePicture() {
    if (!this.editUserData.email) return;

    const updatedData = {
      firstName: this.editUserData.firstName,
      lastName: this.editUserData.lastName,
      username: this.editUserData.username,
      email: this.editUserData.email,
      role: this.editUserData.role,
      mobile: this.editUserData.mobile,
      photoURL: this.previewImage || ''
    };

    try {
      const snapshot = await this.firestore
        .collection('users', ref => ref.where('email', '==', this.editUserData.email))
        .get()
        .toPromise();

      if (!snapshot || snapshot.empty) {
        alert('User record not found');
        return;
      }

      for (const doc of snapshot.docs) {
        await this.firestore.collection('users').doc(doc.id).update(updatedData);
      }

      this.userData = { ...updatedData };
      Object.keys(updatedData).forEach(key => {
        const typedKey = key as keyof typeof updatedData;
        sessionStorage.setItem(key, updatedData[typedKey] as string);
      });

      alert('✅ Profile updated successfully!');
      this.closeEditModal();
    } catch (error: any) {
      console.error('Update failed:', error);
      alert('⚠️ Update failed: ' + (error.message || error));
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onInsideClick(event: MouseEvent) {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this.profileMenuRef && !this.profileMenuRef.nativeElement.contains(target)) {
      this.isProfileMenuOpen = false;
    }

    if (!target.closest('.assignee-container')) {
      this.showUserDropdown = false;
    }
  }

  fetchUsers() {
    this.firestore
      .collection('users')
      .valueChanges({ idField: 'uid' })
      .subscribe(users => {
        this.users = users;
      });
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  selectAssignee(user: any) {
    this.task.assignee =
      user.username ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email;
    this.showUserDropdown = false;
  }
}
