
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const role = sessionStorage.getItem('role'); 

 
    const allowedRoles = route.data['roles'] as string[];

    if (!role) {
      this.router.navigate(['/signin']);
      return false;
    }

    if (allowedRoles && !allowedRoles.includes(role.toLowerCase())) {
   
      this.router.navigate(['/projects']);
      return false;
    }

    return true;
  }
}
