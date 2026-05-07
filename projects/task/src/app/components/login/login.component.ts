import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { UserservicesService } from '../projects/register/services/userservices.service';
import { AuthService } from '../../services/service/auth.service.service';

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
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
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
      next: (res) => this.handleLoginSuccess(res),
      error: (err) => {
        console.error('Login error:', err);
        this.message = err?.error?.message || 'Invalid username or password';
        this.isSubmitting = false;
      }
    });
  }

  private handleLoginSuccess(res: any): void {
    const userRaw = res?.user ?? res?.data?.user ?? null;
    if (userRaw) {
      sessionStorage.setItem('user', typeof userRaw === 'string' ? userRaw : JSON.stringify(userRaw));
    }

    const token = res?.token || res?.accessToken || res?.data?.token || '';
    if (token) {
      sessionStorage.setItem('token', token);
    }

    const rawRole = this.extractRoleFromResponse(res);
    const role = rawRole ? rawRole.toString().trim().toLowerCase() : '';
    if (role) {
      sessionStorage.setItem('role', role);
    }

    const rawRoleId = this.extractRoleId(userRaw);
    if (rawRoleId) {
      sessionStorage.setItem('roleId', rawRoleId);
    }

    const loginPermission = res?.user?.permission || res?.data?.user?.permission || null;
    if (loginPermission) {
      const screens = loginPermission?.screens || {};
      sessionStorage.setItem('permission', JSON.stringify(screens));
      this.goToInitialScreen(loginPermission?.initialScreen);
      return;
    }

    this.userService.getPermissions().pipe(
      catchError((err) => {
        console.error('getPermissions() failed:', err);
        return of([]);
      })
    ).subscribe((permissions: any[]) => {
      const matched = this.findPermissionForRole(permissions, rawRole, rawRoleId);
      let screens = matched?.screens || null;

      if (!screens && role === 'admin') {
        screens = {
          master: { visible: true, user: true, role: true, createProject: true, permission: true },
          project: true,
          frontend: { visible: true, webdev: true, angularDeveloper: true, ngrx: true },
          backend: { visible: true, node: true, apiDatabase: true }
        };
      }

      sessionStorage.setItem('permission', JSON.stringify(screens || {}));
      this.goToInitialScreen(matched?.initialScreen);
    });
  }

  private goToInitialScreen(initialScreen: any): void {
    const target = initialScreen ? String(initialScreen).trim() : '/projects';
    sessionStorage.setItem('initialScreen', target);
    this.isSubmitting = false;
    this.router.navigateByUrl(target);
  }

  private extractRoleId(userRaw: any): string {
    const user = typeof userRaw === 'string' ? this.safeParse(userRaw) : userRaw;
    const role = user?.role;

    if (typeof role === 'string') {
      return role;
    }

    if (role && typeof role === 'object') {
      return role._id || role.id || role.roleId || '';
    }

    return '';
  }

  private extractRoleFromResponse(res: any): string {
    const user = res?.user ?? res?.data?.user ?? null;
    const role = user?.role ?? res?.role ?? res?.data?.role ?? '';

    if (typeof role === 'string') {
      return role;
    }

    if (role && typeof role === 'object') {
      return role.role || role.name || role.roleName || '';
    }

    return '';
  }

  private findPermissionForRole(permissions: any[], roleValue: any, roleId?: string): any {
    const roleStr = String(roleValue || '').trim().toLowerCase();
    const idStr = String(roleId || '').trim();

    return permissions.find((permission: any) => {
      const permissionRole = permission?.role;
      const permissionRoleId = typeof permissionRole === 'object'
        ? String(permissionRole?._id || permissionRole?.id || permissionRole?.roleId || '').trim()
        : String(permissionRole || '').trim();
      const permissionRoleName = typeof permissionRole === 'object'
        ? String(permissionRole?.role || permissionRole?.name || '').trim().toLowerCase()
        : String(permissionRole || '').trim().toLowerCase();

      return (!!roleStr && permissionRoleName === roleStr) || (!!idStr && permissionRoleId === idStr);
    }) || null;
  }

  private safeParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
