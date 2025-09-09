
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatButtonModule } from "@angular/material/button";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],



})
export class RegisterComponent {
userData: any;
showcreateuserss() {
throw new Error('Method not implemented.');
}
editUser(_t82: any) {
throw new Error('Method not implemented.');
}
deleteUser(arg0: any) {
throw new Error('Method not implemented.');
}
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