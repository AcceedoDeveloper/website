
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
filterUsers() {
throw new Error('Method not implemented.');
}
onItemsPerPageChange() {
throw new Error('Method not implemented.');
}
goToFirstPage() {
throw new Error('Method not implemented.');
}
previousPage() {
throw new Error('Method not implemented.');
}
goToPage(_t67: any) {
throw new Error('Method not implemented.');
}
nextPage() {
throw new Error('Method not implemented.');
}
goToLastPage() {
throw new Error('Method not implemented.');
}
userData: any;
dateTime: any;
searchQuery: any;
startIndex: any;
endIndex: any;
filteredUsers: any;
itemsPerPage: any;
currentPage: any;
totalPages: any;
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