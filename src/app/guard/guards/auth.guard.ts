
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const role = sessionStorage.getItem('role');
    const permissionStr = sessionStorage.getItem('permission');
    const permissionKey = route.data['permissionKey'] as string;

    if (!role) {
      this.router.navigate(['/signin']);
      return false;
    }

    if (role.toLowerCase() === 'admin') {
      return true;
    }

    if (permissionKey) {
      if (!permissionStr) {
        return true;
      }
      try {
        const screens = JSON.parse(permissionStr);

        if (!screens || (typeof screens === 'object' && Object.keys(screens).length === 0)) {
          return true;
        }

        const allowed = this.hasPermission(screens, permissionKey);
        if (!allowed) {
          this.redirectToInitialScreen();
          return false;
        }
      } catch (e) {
        console.error('failed to parse permission from sessionStorage:', e);
        this.router.navigate(['/signin']);
        return false;
      }
    }

    return true;
  }

  private hasPermission(screens: any, key: string): boolean {
    const parts = key.split('.');
    let current: any = screens;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return false;
      current = current[part];
    }
    return !!current;
  }

  private redirectToInitialScreen(): void {
    const initialScreen = sessionStorage.getItem('initialScreen');
    this.router.navigateByUrl(initialScreen || '/projects');
  }
}
