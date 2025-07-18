
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(private firestore: AngularFirestore) {
    // You can now use this.firestore to read/write Firestore data
  }
 
  saveUserData() {
    this.firestore.collection('users').add({
      name: 'Arun',
      email: 'arun@example.com'
    }).then(() => {
      console.log('User data saved successfully!');
    }).catch(error => {
      console.error('Error saving user data:', error);
    });
  }
}