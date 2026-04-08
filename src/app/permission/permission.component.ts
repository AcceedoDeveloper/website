import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Permission } from './permission';
import { AddEditPermissionDialogComponent } from './add-edit-permission-dialog/add-edit-permission-dialog.component';
import { ProjectDeleteConfirmationDialogComponent } from '../createproject/project-delete-confirmation-dialog.component';
import { UserservicesService } from '../register/services/userservices.service';
import { RoleserviceService } from '../service/roleservice.service';
@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css'
})
export class PermissionComponent implements OnInit {

  permissions: Permission[] = [];
  displayedColumns: string[] = ['role', 'initialScreen', 'enabledPermissions', 'actions'];
  loading = false;
  private roleLookup = new Map<string, string>();

  constructor(
    private userService: UserservicesService,
    private roleService: RoleserviceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  private loadRoles(): void {
    this.roleService.Loadrole().subscribe({
      next: (response: any) => {
        const roles = this.extractRoles(response);
        this.roleLookup.clear();

        roles.forEach((role: any) => {
          const id = String(role?._id || role?.id || role?.roleId || '').trim();
          const name = String(role?.role || role?.name || role?.title || '').trim();
          if (id && name) {
            this.roleLookup.set(id, name);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load roles for table', err);
      }
    });
  }

  loadPermissions(): void {
  this.loading = true;
  this.userService.getPermissions().subscribe({
    next: (data: Permission[]) => {
      this.permissions = data || [];
      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load permissions', err);
      this.loading = false;
      this.snackBar.open('Failed to load permissions', 'Close', { duration: 4000 });
    }
  });
}
// ================= PERMISSION CRUD =================

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditPermissionDialogComponent, {
      minWidth: '820px',
      maxHeight: '90vh',
      data: null // null = Add mode
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPermissions();
        this.showSnackBar('Permission created successfully', 'success');
        // Emit event to refresh sidebar in header
      }
    });
  }

  openEditDialog(permission: Permission): void {
    const dialogRef = this.dialog.open(AddEditPermissionDialogComponent, {
      minWidth: '720px',
      maxHeight: '90vh',
      data: permission // pass data for edit
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPermissions();
        this.showSnackBar('Permission updated successfully', 'success');
        // Emit event to refresh sidebar in header
      }
    });
  }

  deletePermission(id: string | undefined): void {
    if (!id) return;

    const dialogRef = this.dialog.open(ProjectDeleteConfirmationDialogComponent, {
      width: '400px',
      height: 'auto',
      data: {
        title: 'Confirm Permission Deletion',
        message: 'Are you sure you want to delete this permission role? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== 'confirm') {
        return;
      }

      this.userService.deletePermission(id).subscribe({
        next: () => {
          this.loadPermissions();
          this.showSnackBar('Permission deleted successfully', 'success');
        },
        error: (err) => {
          console.error(err);
          this.showSnackBar('Failed to delete permission', 'error');
        }
      });
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: type === 'success' ? 'snack-success' : 'snack-error'
    });
  }

  getEnabledPermissions(permission: Permission): string {
    const enabled: string[] = [];
    const screens = permission?.screens;
    const master = screens?.master || (screens as any)?.sidebar?.master || (screens as any)?.SidebarPermission?.master;

    if (master?.user) enabled.push('User Management');
    if (master?.role) enabled.push('Role Management');
    if (master?.createProject) enabled.push('Create Project');
    if (master?.permission) enabled.push('Permission');

    const projectVisible = typeof screens?.project === 'boolean' ? screens.project : !!(screens as any)?.project?.visible;
    if (projectVisible) enabled.push('Project');

    if (screens?.frontend?.webdev) enabled.push('Web Development');
    if (screens?.frontend?.angularDeveloper) enabled.push('Angular Developer');
    if (screens?.frontend?.ngrx) enabled.push('NgRx / State Management');

    if (screens?.backend?.node) enabled.push('Node.js');
    if (screens?.backend?.apiDatabase) enabled.push('API + Database');

    return enabled.length ? enabled.join(', ') : '-';
  }

  getRoleDisplay(role: any): string {
    if (!role) return '-';

    if (typeof role === 'string') {
      return this.roleLookup.get(role) || role;
    }

    if (typeof role === 'object') {
      const name = role.role || role.name || role.title;
      if (name) return name;

      const roleId = role._id || role.id || role.roleId;
      if (roleId) {
        return this.roleLookup.get(String(roleId)) || String(roleId);
      }

      return '-';
    }

    return String(role);
  }

  private extractRoles(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    const candidates = [
      response?.roles,
      response?.data,
      response?.result,
      response?.items,
      response?.payload,
      response?.data?.roles,
      response?.result?.roles,
      response?.payload?.roles
    ];

    const found = candidates.find((item) => Array.isArray(item));
    return Array.isArray(found) ? found : [];
  }
}