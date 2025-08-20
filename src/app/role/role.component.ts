import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { MatDialog } from '@angular/material/dialog';
import{RoledialogComponent} from './roledialog/roledialog.component';
import{RoleserviceService} from '../service/roleservice.service'
import { Injectable } from '@angular/core';
// for edit --> get id
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrl: './role.component.css'
})
@Injectable({
  providedIn: 'root'
})
export class RoleComponent {
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

  showPassword = false;
  showConfirmPassword = false;

    // form edit
roleid:any;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore, 
    private router: Router,
    private dialog: MatDialog,
    private roleservices:RoleserviceService,
     private route:ActivatedRoute,
     private snackBar: MatSnackBar
     
   
  ) {

    //get data
    this.Loadroledata();


      

  }

  //getrole api ---> get

  roledata:any;

  Loadroledata()
  {
this.roleservices.Loadrole().subscribe(data => 
    {
this.roledata=data;
    }
    )
  }

  //edit data

 


editroles:any;
editrole(role: any) {
  console.log(role);  // you should see role object here with _id and role name
  this.dialog.open(RoledialogComponent, {
    width: '80vw',
    height: 'auto',
    maxHeight: '90vh',
    panelClass: 'custom-dialog',
    data: { role }  
  });
}

//delete role

 deleterole(ID: any) {
    if (!ID) {
      console.error(' Invalid role ID:', ID);
      this.snackBar.open('Invalid role ID', 'Close', { duration: 3000 });
      return;
    }

    
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleservices.deleterole(ID).subscribe({
        next: (data) => {
          console.log(' Role deleted:', data);
          this.snackBar.open('Role deleted successfully!', 'Close', { duration: 3000 });
          this.Loadroledata(); // Refresh roles list
        },
        error: (err) => {
          console.error('Delete failed:', JSON.stringify(err, null, 2));
          this.snackBar.open(`Failed to delete role: ${err.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    }
  }
















  //role 


    isNavOpen = false;
      isDropdownOpen=false;
      
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
  
  
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    }
  
    //show role
    getrole()

    {

      
      
     this.dialog.open(RoledialogComponent, {
  width: '800px',
  height: '500px',
  //  disableClose: false, 
  panelClass: 'custom-dialog',


});
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
                this.router.navigate(['/login']);
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