import { Routes } from '@angular/router';

import { CreateprojectComponent } from './components/createproject/createproject.component';
import { DepartmentComponent } from './components/department/department.component';
import { LoginComponent } from './components/login/login.component';
import { PermissionComponent } from './components/permission/permission.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { RegisterComponent } from './components/projects/register/register.component';
import { RoleComponent } from './components/role/role.component';
import { taskAuthGuard } from './guards/task-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signin', component: LoginComponent },
  { path: 'register', component: RegisterComponent, canActivate: [taskAuthGuard] },
  { path: 'department', component: DepartmentComponent, canActivate: [taskAuthGuard] },
  { path: 'role', component: RoleComponent, canActivate: [taskAuthGuard] },
  { path: 'create', component: CreateprojectComponent, canActivate: [taskAuthGuard] },
  { path: 'permission', component: PermissionComponent, canActivate: [taskAuthGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [taskAuthGuard] },
  { path: 'webdev', redirectTo: 'projects' },
  { path: 'angulardeveloper', redirectTo: 'projects' },
  { path: 'ngrx', redirectTo: 'projects' },
  { path: 'node', redirectTo: 'projects' },
  { path: 'api&database', redirectTo: 'projects' },
  { path: '**', redirectTo: 'login' }
];
