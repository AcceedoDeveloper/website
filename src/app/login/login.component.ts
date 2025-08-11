import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
   isDropdownOpen = false;
  isNavOpen = false;
  loginForm!: FormGroup;
  hidePassword: boolean = true;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // Ensure fields are blank
    this.loginForm.patchValue({
      username: '',
      password: ''
    });

    // Clear session storage if needed
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userKey');

    // Force browser to not autocomplete
    setTimeout(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach((input) => input.setAttribute('autocomplete', 'off'));
    }, 0);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

 onSubmit() {
  if (this.loginForm.valid) {
    const { username, password } = this.loginForm.value;

    this.firestore
      .collection('users', ref =>
        ref.where('username', '==', username).where('password', '==', password)
      )
      .get()
      .subscribe(
        (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData: any = userDoc.data();

            // Save user data to session storage
            sessionStorage.setItem('userKey', userDoc.id);
            sessionStorage.setItem('username', userData.firstName + ' ' + userData.lastName);
            sessionStorage.setItem('email', userData.email || '');
            sessionStorage.setItem('role', userData.role || '');

            console.log('Logged in as:', userData.firstName, userData.lastName);

            this.message = '';
            this.router.navigate(['/project']);
          } else {
            this.message = 'Invalid username or password ❌';
          }
        },
        (error) => {
          console.error('Login error:', error);
          this.message = 'Something went wrong ❌';
        }
      );
  } else {
    this.message = 'Please fill in all required fields ❌';
  }
}
 onNavCheckChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.isNavOpen = target.checked;
    console.log('Hamburger menu toggled, nav open:', this.isNavOpen);
    if (!this.isNavOpen) {
      this.isDropdownOpen = false; 
      console.log('Dropdown closed due to hamburger menu closing');
    }
  }
}