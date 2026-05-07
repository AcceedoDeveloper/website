import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, forkJoin, of } from 'rxjs';
import { Permission } from '../permission';
import { UserservicesService } from '../../projects/register/services/userservices.service';
import { RoleserviceService } from '../../../services/service/roleservice.service';

@Component({
  selector: 'app-add-edit-permission-dialog',
  templateUrl: './add-edit-permission-dialog.component.html',
  styleUrl: './add-edit-permission-dialog.component.css'
})
export class AddEditPermissionDialogComponent implements OnInit {

  permissionForm: FormGroup;
  isEditMode = false;
  loading = false;
  roles: any[] = [];

  initialScreenOptions: Array<{ route: string; label: string }> = [];

  private readonly screenControlMap: Array<{ path: string; label: string; route: string }> = [
    { path: 'screens.master.user',               label: 'User Management',        route: 'register' },
    { path: 'screens.master.role',               label: 'Role Management',         route: 'role' },
    { path: 'screens.master.createProject',      label: 'Create Project',          route: 'create' },
    { path: 'screens.master.permission',         label: 'Permission',              route: 'permission' },
    { path: 'screens.project',                   label: 'Project',                 route: 'projects' },
    { path: 'screens.frontend.webdev',           label: 'Web Development',         route: 'webdev' },
    { path: 'screens.frontend.angularDeveloper', label: 'Angular Developer',       route: 'angulardeveloper' },
    { path: 'screens.frontend.ngrx',             label: 'NgRx / State Management', route: 'ngrx' },
    { path: 'screens.backend.node',              label: 'Node.js',                 route: 'node' },
    { path: 'screens.backend.apiDatabase',       label: 'API + Database',          route: 'api&database' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserservicesService,
    private roleService: RoleserviceService,
    private dialogRef: MatDialogRef<AddEditPermissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Permission | null
  ) {
    this.isEditMode = !!data;

    this.permissionForm = this.fb.group({
      role: ['', Validators.required],
      initialScreen: ['',Validators.required],
      screens: this.fb.group({
        master: this.fb.group({
          user: [false],
          role: [false],
          createProject: [false],
          permission: [false]
        }),
        project: [false],
        frontend: this.fb.group({
          webdev: [false],
          angularDeveloper: [false],
          ngrx: [false]
        }),
        backend: this.fb.group({
          node: [false],
          apiDatabase: [false]
        })
      })
    });
  }

  ngOnInit(): void {
    this.loadRoles();

    if (this.data) {
      this.permissionForm.patchValue(this.normalizeIncomingPermissionData(this.data));
      this.normalizeRoleControlToId();
    }

    this.bindInitialScreenOptions();
  }

  // Load Roles for Dropdown
  loadRoles(): void {
    forkJoin({
      rolesResponse: this.roleService.Loadrole(),
      permissions: this.userService.getPermissions().pipe(
        catchError((err) => {
          console.error('Failed to load permissions for role filtering', err);
          return of([] as Permission[]);
        })
      )
    }).subscribe({
      next: ({ rolesResponse, permissions }) => {
        const availableRoles = this.extractRoles(rolesResponse);
        this.roles = this.filterAvailableRoles(availableRoles, permissions || []);
        this.normalizeRoleControlToId();
      },
      error: (err) => {
        console.error('Failed to load roles', err);
    
      }
    });
  }

  private bindInitialScreenOptions(): void {
    const screensGroup = this.permissionForm.get('screens');
    screensGroup?.valueChanges.subscribe(() => {
      this.updateInitialScreenOptions();
    });

    this.updateInitialScreenOptions();
  }

  updateInitialScreenOptions(): void {
    this.initialScreenOptions = this.screenControlMap
      .filter((item) => !!this.permissionForm.get(item.path)?.value)
      .map((item) => ({ route: item.route, label: item.label }));

    const selectedInitialScreen = this.permissionForm.get('initialScreen')?.value;
    if (selectedInitialScreen && !this.initialScreenOptions.some((s) => s.route === selectedInitialScreen)) {
      this.permissionForm.get('initialScreen')?.setValue('', { emitEvent: false });
    }
  }

  private extractRoles(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    const commonPaths = [
      response?.roles,
      response?.data,
      response?.result,
      response?.items,
      response?.payload,
      response?.data?.roles,
      response?.result?.roles,
      response?.payload?.roles
    ];

    const found = commonPaths.find((item) => Array.isArray(item));
    return Array.isArray(found) ? found : [];
  }

  private filterAvailableRoles(roles: any[], permissions: Permission[]): any[] {
    const currentRoleKeys = new Set(this.getRoleKeys(this.data?.role));
    const assignedRoleKeys = new Set<string>();

    permissions.forEach((permission) => {
      this.getRoleKeys(permission?.role)
        .filter((key) => !currentRoleKeys.has(key))
        .forEach((key) => assignedRoleKeys.add(key));
    });

    return roles.filter((role) => {
      const roleKeys = this.getRoleKeys(role);
      return !roleKeys.some((key) => assignedRoleKeys.has(key));
    });
  }

  private getRoleKeys(value: any): string[] {
    if (!value) return [];

    if (typeof value === 'object') {
      return [value._id, value.id, value.roleId, value.role, value.name, value.title]
        .map((item) => String(item || '').trim())
        .filter((item) => !!item);
    }

    const normalizedValue = String(value).trim();
    return normalizedValue ? [normalizedValue] : [];
  }

  private normalizeIncomingPermissionData(data: any): Permission {
    const screens = data?.screens || {};
    const normalizedMaster =
      screens?.master ||
      screens?.sidebar?.master ||
      screens?.SidebarPermission?.master ||
      {};

    const normalizedProject =
      typeof screens?.project === 'boolean'
        ? screens.project
        : !!screens?.project?.visible;

    return {
      ...data,
      initialScreen: this.normalizeInitialScreenToRoute(data?.initialScreen || ''),
      screens: {
        master: {
          user: !!normalizedMaster?.user,
          role: !!normalizedMaster?.role,
          createProject: !!normalizedMaster?.createProject,
          permission: !!normalizedMaster?.permission
        },
        project: normalizedProject,
        frontend: {
          webdev: !!screens?.frontend?.webdev,
          angularDeveloper: !!screens?.frontend?.angularDeveloper,
          ngrx: !!screens?.frontend?.ngrx
        },
        backend: {
          node: !!screens?.backend?.node,
          apiDatabase: !!screens?.backend?.apiDatabase
        }
      }
    };
  }

  private normalizeInitialScreenToRoute(stored: string): string {
    if (!stored) return '';
    if (this.screenControlMap.some((s) => s.route === stored)) return stored;
    const byLabel = this.screenControlMap.find((s) => s.label === stored);
    return byLabel ? byLabel.route : stored;
  }

  onSubmit(): void {
    if (this.permissionForm.invalid) return;

    const formValue = this.permissionForm.value;
    const resolvedRoleId = this.resolveRoleId(formValue.role);

    if (!resolvedRoleId) {
      console.error('Create/Update blocked: role id could not be resolved from selection', formValue.role);
      return;
    }

    this.loading = true;
    const payload: Permission = {
      ...formValue,
      role: resolvedRoleId
    };

    if (this.isEditMode && this.data?._id) {
      this.userService.updatePermission(this.data._id, payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error('Update failed', err);
          this.loading = false;
        }
      });
    } else {
      this.userService.createPermission(payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          console.error('Create failed', err);
          this.loading = false;
        }
      });
    }
  }

  private normalizeRoleControlToId(): void {
    const roleControl = this.permissionForm.get('role');
    if (!roleControl) return;

    const currentValue = roleControl.value;
    if (!currentValue) return;

    const resolved = this.resolveRoleId(currentValue);
    if (resolved && resolved !== currentValue) {
      roleControl.setValue(resolved, { emitEvent: false });
    }
  }

  private resolveRoleId(value: any): string {
    if (!value) return '';

    if (typeof value === 'object') {
      return value._id || value.id || value.roleId || '';
    }

    const stringValue = String(value).trim();

    const directIdMatch = this.roles.find((r: any) => {
      const roleId = String(r?._id || r?.id || r?.roleId || '');
      return roleId && roleId === stringValue;
    });
    if (directIdMatch) {
      return String(directIdMatch._id || directIdMatch.id || directIdMatch.roleId);
    }

    const labelMatch = this.roles.find((r: any) => {
      const label = String(r?.role || r?.name || '').trim();
      return label && label === stringValue;
    });

    return labelMatch ? String(labelMatch._id || labelMatch.id || labelMatch.roleId || '') : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}