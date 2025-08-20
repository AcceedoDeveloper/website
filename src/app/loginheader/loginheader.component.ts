


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
  selector: 'app-loginheader',
  templateUrl: './loginheader.component.html',
  styleUrl: './loginheader.component.css'
})
export class LoginheaderComponent {
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
  // function

   onSearch() {
  const query = this.searchQuery.toLowerCase();
  this.filteredTasks = this.tasks.filter(task =>
    task.description.toLowerCase().includes(query)
  );
}
  ngOnInit(): void {
    this.getCurrentUser();
    this.fetchTasks();
    this.fetchUsers();
    this.updateTime();
     this.fetchTasks();
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
  updateTime() {
    const now = new Date();
    this.dateTime = now.toLocaleString();
    this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
  }

  // Profile Modal Methods
  openEditProfile() {
    this.editUserData = { ...this.userData };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
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

     newTask = {
        ...this.task,
        createdAt: Timestamp.now(),
        assignedBy: this.userData?.uid || 'admin'
      };

      // Profile Modal Methods
    

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

    getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
getrole()
{
  
}
   signOut() {
    this.afAuth.signOut();
  }
 
}
