import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {
  userData: any = null;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}
todayDate: string = '';
  ngOnInit() {
     this.todayDate = new Date().toDateString();
    this.afAuth.authState.subscribe(user => {
      if (user && user.uid) {
        // Fetch user document from Firestore using UID
        this.firestore.collection('users').doc(user.uid).valueChanges().subscribe(
          data => {
            if (data) {
              this.userData = data;
            } else {
              console.warn('User data not found in Firestore.');
              this.userData = { username: 'Unknown User' };
            }
          },
          error => {
            console.error('Error fetching user data:', error);
          }
        );
      } else {
        console.warn('No user logged in.');
        this.userData = { username: 'Guest' };
      }
    });
  }
  

  signOut() {
    this.afAuth.signOut().then(() => {
      sessionStorage.clear(); // Optional: clear session
      this.router.navigate(['/login']); // Optional: redirect to login
    }).catch(err => {
      console.error('Sign-out error:', err);
    });
  }
}
