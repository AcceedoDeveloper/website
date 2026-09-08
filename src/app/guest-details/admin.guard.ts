import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('token');
    const role = (sessionStorage.getItem('role') || '').trim().toLowerCase();

    if (!token) {
      this.router.navigate(['/signin']);
      return false;
    }

    if (role !== 'admin') {
      this.router.navigate(['/projects']);
      return false;
    }

    return true;
  }
}
