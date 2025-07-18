import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
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

  constructor(private firestore: AngularFirestore, private router: Router) {}

  onSubmit(form: any) {
    if (form.valid && this.user.password === this.confirmPassword) {
      this.firestore.collection('users').add(this.user).then((docRef) => {
        console.log('User data saved to Firebase!');
        this.formSubmitted = true;

        sessionStorage.setItem('userKey', docRef.id);
        sessionStorage.setItem('username', this.user.firstName + ' ' + this.user.lastName);

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      }).catch(error => {
        console.error('Error saving user data:', error);
      });
    } else {
      console.log('Form not valid');
    }
  }
}