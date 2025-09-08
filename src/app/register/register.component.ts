import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { RegistermatComponent } from './registermat/registermat.component';
import { MatDialog } from '@angular/material/dialog';
import { LoginheaderComponent } from '../loginheader/loginheader.component';
import { UserservicesService } from './services/userservices.service';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth.service.service'; // ✅ correct path

// import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
@Injectable({
  providedIn: 'root'
})
export class RegisterComponent {
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
showcreateuser=false;
showuser=true;
openMenu: string | null = null;
  userRole: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  
  authService: any;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore, 
    private router: Router,
    private dialog:MatDialog,
    private userserives:UserservicesService,
      private route:ActivatedRoute,
  
    
  ) {

    //get data

    this.getuserdata();
  }



  //get data
  userdata:any;
  
  getuserdata()
  {
    this.userserives. getuser().subscribe(data=>
    {
 this.userdata=data;
    }
    )
  }

  

  editUser(item : any) {
    console.log('data', item);
    
   this.dialog.open(RegistermatComponent, {
      width: '80vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: { item }
    });

  }

  

  //delete user

  deleteUser(ID: any) {
  if (confirm('Are you sure you want to delete this user?')) {
    this.userserives.deleteuser(ID).subscribe({
      next: (res) => {
        console.log('✅ User deleted successfully:', res);
        this.getuserdata(); 
      },
      error: (err) => {
        console.error('❌ Error deleting user:', err);
        if (err.error) {
          console.error('🔎 Server error details:', JSON.stringify(err.error, null, 2));
        }
        alert('Failed to delete user. Please try again.');
      }
    });
  }
}

  

showcreateuserss() {
  const ref = this.dialog.open(RegistermatComponent, {
    width: '90vw',        
    maxWidth: '65vw',   
    height: '75vh',      
    maxHeight: '100vh',
    panelClass: 'custom-dialog',
    data: {}
  });
}


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
  

    showEditModal = false;
    editUserData: any = {};
    previewImage: string | ArrayBuffer | null = null;
  
    currentDateTime: string = '';
    dateTime: string = '';
    hasNotification = false;
  
  
   
    ngOnInit(): void {
      this.getCurrentUser();
      this.fetchTasks();
      this.fetchUsers();
      this.updateTime();
       this.fetchTasks();

         this.userRole = this.authService.getUserRole();
    console.log('🔎 Current Role:', this.userRole);
  }
isAdmin(): boolean {
  const role = sessionStorage.getItem('role') || this.userData?.role || '';
  return role?.toLowerCase() === 'admin';
}


    
  
  
    updateTime() {
      const now = new Date();
      this.dateTime = now.toLocaleString();
      this.currentDateTime = now.toDateString() + ' ' + now.toLocaleTimeString();
    }
  
    toggleTaskBox() {
      this.showTaskBox = !this.showTaskBox;
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

    
toggleMenu(menu: string) {
  this.openMenu = this.openMenu === menu ? null : menu;
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
  
  onSubmit(form: any) {
    if (form.valid && this.user.password === this.confirmPassword) {
      this.afAuth.createUserWithEmailAndPassword(this.user.email, this.user.password)
        .then((userCredential) => {
          const uid = userCredential.user?.uid;
          if (uid) {
            const userData = {
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              email: this.user.email,
              mobile: this.user.mobile,
              role: this.user.role,
              username: this.user.username,
              password: this.user.password
            };

            this.firestore.collection('users').doc(uid).set(userData).then(() => {
              console.log('User data saved to Firestore!');

              sessionStorage.setItem('uid', uid);
              sessionStorage.setItem('username', `${this.user.firstName} ${this.user.lastName}`);
              sessionStorage.setItem('email', this.user.email);
              sessionStorage.setItem('role', this.user.role);

              this.formSubmitted = true;
              setTimeout(() => {
                this.router.navigate(['/register']);
              }, 1000);
            });
          }
        })
        .catch(error => {
          console.error('Error during Firebase Auth or Firestore:', error);
        });
    } else {
      console.log('Form not valid or passwords do not match.');
    }
  }
}


