import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

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