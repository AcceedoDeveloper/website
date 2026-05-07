import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../projects/task/src/app/services/service/auth.service.service';
import { UserservicesService } from '../../../projects/task/src/app/components/projects/register/services/userservices.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  message = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserservicesService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

 
    sessionStorage.clear();

 
    setTimeout(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach((input) => input.setAttribute('autocomplete', 'off'));
    }, 0);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }



  private extractRoleFromResponse(res: any): string {
    try {
     
      if (res?.role && typeof res.role === 'string') return res.role;

    
      const u = res?.user;
      if (u) {
        
        if (typeof u === 'string') return u;

       
        if (typeof u === 'object') {
    
          if (typeof u.role === 'string') return u.role;
          if (typeof u.role === 'object') {
     
            return (u.role.name || u.role.role || u.role.roleName || JSON.stringify(u.role));
          }
         
          if (Array.isArray(u.roles) && u.roles.length) {
            const r0 = u.roles[0];
            if (typeof r0 === 'string') return r0;
            if (typeof r0 === 'object') return (r0.name || r0.role || r0.roleName || '');
          }
    
          if (u.roleName && typeof u.roleName === 'string') return u.roleName;
          if (u.name && typeof u.name === 'string') return u.name;
          if (u.role_id) return String(u.role_id);
        }
      }


      if (res?.data) {
        const d = res.data;
        if (typeof d.role === 'string') return d.role;
        if (d?.user) {
  
          const u2 = d.user;
          if (typeof u2 === 'string') return u2;
          if (typeof u2 === 'object') {
            if (typeof u2.role === 'string') return u2.role;
            if (u2.roleName) return u2.roleName;
            if (Array.isArray(u2.roles) && u2.roles.length) {
              const r0 = u2.roles[0];
              if (typeof r0 === 'string') return r0;
              if (typeof r0 === 'object') return r0.name || r0.role || '';
            }
          }
        }
      }


      if (res?.userRole && typeof res.userRole === 'string') return res.userRole;
      if (Array.isArray(res?.roles) && res.roles.length) {
        const r0 = res.roles[0];
        if (typeof r0 === 'string') return r0;
        if (typeof r0 === 'object') return r0.name || r0.role || '';
      }


      return '';
    } catch (e) {
      console.warn('extractRoleFromResponse error', e);
      return '';
    }
  }


onSubmit(): void {
  if (!this.loginForm.valid) {
    this.message = 'Please fill username and password';
    this.loginForm.markAllAsTouched();
    return;
  }

  if (this.isSubmitting) {
    return;
  }

  const { username, password } = this.loginForm.value;
  this.message = '';
  this.isSubmitting = true;

  this.authService.login(username, password).subscribe({
    next: (res) => {
      // Store user data
      let userRaw = res?.user ?? res?.data?.user ?? null;
      if (userRaw) {
        // apply client-side cached photo if available
        try {
          const parsed = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw;
          const key =
            parsed._id || parsed.id || parsed.userCode || parsed.userName || parsed.emailId || '';
          if (key) {
            const cached = localStorage.getItem(`cachedPhoto_${key}`);
            if (cached) {
              parsed.photoURL = cached;
              userRaw = parsed; // update the reference
            }
          }
        } catch {}

        try {
          sessionStorage.setItem('user', JSON.stringify(userRaw));
        } catch {
          sessionStorage.setItem('user', String(userRaw));
        }
      }

      // Store token
      const token = res?.token || res?.accessToken || res?.data?.token || '';
      if (token) sessionStorage.setItem('token', token);

      // Extract and store role
      const rawRole = this.extractRoleFromResponse(res);
      const role = rawRole ? rawRole.toString().trim().toLowerCase() : '';
      if (role) {
        sessionStorage.setItem('role', role);
      } else {
        sessionStorage.removeItem('role');
      }

      // Also extract the raw role ID from the user object (when role is populated as an object)
      const userForPermission = res?.user ?? res?.data?.user ?? null;
      let rawRoleId = '';
      if (userForPermission && typeof userForPermission === 'object') {
        const ur = userForPermission?.role;
        if (typeof ur === 'string') {
          rawRoleId = ur;
        } else if (ur && typeof ur === 'object') {
          rawRoleId = ur._id || ur.id || ur.roleId || '';
        }
      }
      if (rawRoleId) {
        sessionStorage.setItem('roleId', rawRoleId);
      }

      // First preference: use permission from login payload directly
      const loginPermission = res?.user?.permission || res?.data?.user?.permission || null;
      if (loginPermission) {
        const screens = loginPermission?.screens || {};
        sessionStorage.setItem('permission', JSON.stringify(screens));

        const initialScreen = loginPermission?.initialScreen ? String(loginPermission.initialScreen).trim() : '';

        if (initialScreen) {
          sessionStorage.setItem('initialScreen', initialScreen);
          this.router.navigateByUrl(initialScreen);
        } else {
          sessionStorage.setItem('initialScreen', '/projects');
          this.router.navigate(['/projects']);
        }

        this.isSubmitting = false;
        return;
      }

      // Fetch permissions and store them for route guard, then navigate
      this.userService.getPermissions().pipe(
        catchError((err) => {
          console.error('getPermissions() failed:', err);
          return of([]);
        })
      ).subscribe((permissions: any[]) => {
        const matched = this.findPermissionForRole(permissions, rawRole, rawRoleId);

        // Admin bypass: no permission record + admin role → grant full access
        let screens = matched?.screens || null;
        if (!screens && role === 'admin') {
          screens = {
            master: { user: true, role: true, createProject: true, permission: true },
            project: true,
            frontend: { webdev: true, angularDeveloper: true, ngrx: true },
            backend: { node: true, apiDatabase: true }
          };
        }
        screens = screens || {};
        sessionStorage.setItem('permission', JSON.stringify(screens));

        // initialScreen is stored in DB as "/register", "/projects", etc.
        const initialScreen = matched?.initialScreen ? String(matched.initialScreen).trim() : '';

        if (initialScreen) {
          sessionStorage.setItem('initialScreen', initialScreen);
          this.router.navigateByUrl(initialScreen);
        } else {
          sessionStorage.setItem('initialScreen', '/projects');
          this.router.navigate(['/projects']);
        }

        this.isSubmitting = false;
      });
      
      
    },
    error: (err) => {
      console.error('❌ Login error:', err);
      this.message = err?.error?.message || 'Invalid username or password';
      this.isSubmitting = false;
    }
  });
}

  private findPermissionForRole(permissions: any[], roleValue: any, roleId?: string): any {
    const roleStr = String(roleValue || '').trim().toLowerCase();
    const idStr = String(roleId || '').trim();

    return permissions.find((p: any) => {
      const pRoleRaw = p?.role;
      const pRoleId = typeof pRoleRaw === 'object'
        ? String(pRoleRaw?._id || pRoleRaw?.id || pRoleRaw?.roleId || '').trim()
        : String(pRoleRaw || '').trim();
      const pRoleName = typeof pRoleRaw === 'object'
        ? String(pRoleRaw?.role || pRoleRaw?.name || '').trim().toLowerCase()
        : String(pRoleRaw || '').trim().toLowerCase();

      const byName = !!roleStr && pRoleName === roleStr;
      const byId = !!idStr && pRoleId === idStr;
      return byName || byId;
    }) || null;
  }

}

