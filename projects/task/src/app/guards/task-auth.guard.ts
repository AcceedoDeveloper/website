import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const taskAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = sessionStorage.getItem('user');
  const token = sessionStorage.getItem('token');

  if (user || token) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
