import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { RegistermatComponent } from './registermat/registermat.component';
import { MatDialog } from '@angular/material/dialog';
import { UserservicesService } from './services/userservices.service';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  [x: string]: any;
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
  selectedFile: File | null = null;
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
    this.updateTime();
    this.getCurrentUser();
    this.getuserdata();
    
    // Update time every minute
    setInterval(() => {
      this.updateTime();
    }, 60000);
  }

  updateTime() {
    const now = new Date();
    this.currentDateTime = now.toLocaleString();
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      this.userData = JSON.parse(userStr);
      
      // Process user image URL
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

  getuserdata() {
    this.userserives.getuser().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.userdata = data.map((user: any) => this.processUserImage(user));
        } else if (data && typeof data === 'object') {
          this.userdata = [this.processUserImage(data)];
        } else {
          console.warn('Unexpected response format:', data);
          this.userdata = [];
        }
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userdata = [];
      }
    });
  }

  private processUserImage(user: any): any {
    const processedUser = { ...user };
    
    if (processedUser.photo) {
      if (processedUser.photo.startsWith('http')) {
        processedUser.photoURL = processedUser.photo;
      } else {
        processedUser.photoURL = `http://localhost:3008/uploads/${processedUser.photo}`;
      }
    } else {
      processedUser.photoURL = 'assets/default-avatar.png';
    }
    
    return processedUser;
  }

  editUser(item: any) {
    this.dialog.open(RegistermatComponent, {
      width: '80vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: { item }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getuserdata(); // Refresh the user list
      }
    });
  }

  deleteUser(ID: any) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userserives.deleteuser(ID).subscribe({
        next: (res) => {
          console.log('User deleted successfully:', res);
          this.getuserdata(); // Refresh the user list
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  showcreateuserss() {
    this.dialog.open(RegistermatComponent, {
      width: '90vw',
      maxWidth: '65vw',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: {}
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getuserdata(); // Refresh the user list
      }
    });
  }

  isAdmin(): boolean {
    const role = sessionStorage.getItem('role') || this.userData?.role || '';
    return role?.toLowerCase() === 'admin';
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
  if (!this.selectedFile) return;

  const filePath = `profileImages/${this.userData.uid}_${Date.now()}_${this.selectedFile.name}`;
  const fileRef = this['storage'].ref(filePath);
  const task = this['storage'].upload(filePath, this.selectedFile);

  task.snapshotChanges().pipe(
    finalize(() => {
      fileRef.getDownloadURL().subscribe((url: any) => {
        this.editUserData.photoURL = url; 

        
        this.afs.collection('users').doc(this.userData.uid)
          .update({ photoURL: url })
          .then(() => {
            console.log('✅ Profile image updated');
            this.userData.photoURL = url; 
            this.showEditModal = false;
          })
          .catch(err => console.error('❌ Firestore update error', err));
      });
    })
  ).subscribe();
}

  

onPhotoSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;

    // Show preview
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


function finalize(arg0: () => void): any {
  throw new Error('Function not implemented.');
}

