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
  

  tasks: any[] = []; // at the top of the class
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
  users: any[] = []; // ✅ All users for dropdown
  showUserDropdown: boolean = false; // ✅ Toggle dropdown

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

            sessionStorage.setItem('firstName', data.firstName || '');
            sessionStorage.setItem('lastName', data.lastName || '');
            sessionStorage.setItem('username', this.userData.username);
            sessionStorage.setItem('email', this.userData.email);
            sessionStorage.setItem('role', this.userData.role);
            sessionStorage.setItem('mobile', this.userData.mobile);
            sessionStorage.setItem('photoURL', this.userData.photoURL);
          } else {
            this.loadFromSession();
          }

          this.fetchTasks(); // ✅ fetch tasks after user data is loaded
          this.loading = false;
        });
    } else {
      this.loadFromSession();
      this.fetchTasks(); // ✅ still fetch even if no user document
      this.loading = false;
    }

    setTimeout(() => {
      this.hasNotification = true;
    }, 2000);
  });
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
  deleteTask(task: any) {
    this.firestore
      .collection('tasks')
      .doc(task.id)
      .delete()
      .then(() => {
        this.fetchTasks();
      });
  }
openEditModal(task: any) {
    this.isModalOpen = true;
    this.editComment = task.description || '';
    this.editTaskId = task.id;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.previewImage = null;
    this.selectedPhotoFile = null;
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
      sessionStorage.setItem('firstName', updatedData.firstName);
      sessionStorage.setItem('lastName', updatedData.lastName);
      sessionStorage.setItem('username', updatedData.username);
      sessionStorage.setItem('email', updatedData.email);
      sessionStorage.setItem('role', updatedData.role);
      sessionStorage.setItem('mobile', updatedData.mobile);
      sessionStorage.setItem('photoURL', updatedData.photoURL);

      alert('✅ Profile updated successfully!');
      this.closeEditModal();
    } catch (error: any) {
      console.error('Update failed:', error);
      alert('⚠️ Update failed: ' + (error.message || error));
    }
  }

  // ---------------------------
  // Profile Menu Dropdown Logic
  // ---------------------------
  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onInsideClick(event: MouseEvent) {
    event.stopPropagation(); // Do not close when clicking inside
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
  // ✅ Fetch user list from Firestore
  fetchUsers() {
    this.firestore
      .collection('users')
      .valueChanges({ idField: 'uid' })
      .subscribe(users => {
        this.users = users;
      });
  }
  // ✅ Toggle user dropdown
  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }
  // ✅ Set selected user as assignee
selectAssignee(user: any) {
  this.task.assignee = user.name;
  this.showUserDropdown = false;
}

}
