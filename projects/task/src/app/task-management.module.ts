import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { CreateprojectComponent } from './components/createproject/createproject.component';
import { ProjectDeleteConfirmationDialogComponent } from './components/createproject/project-delete-confirmation-dialog.component';
import { DepartmentComponent, FilterPipe } from './components/department/department.component';
import { DepartmentDialogComponent } from './components/department/department-dialog/department-dialog.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LoginComponent } from './components/login/login.component';
import { LoginheaderComponent } from './components/loginheader/loginheader.component';
import { PermissionComponent } from './components/permission/permission.component';
import { AddEditPermissionDialogComponent } from './components/permission/add-edit-permission-dialog/add-edit-permission-dialog.component';
import { AssignmentDeleteConfirmationDialogComponent } from './components/projects/assignment-delete-confirmation-dialog.component';
import { CalendarComponent } from './components/projects/calendar/calendar.component';
import { CompareComponent } from './components/projects/compare/compare.component';
import { DocumentsComponent } from './components/projects/documents/documents.component';
import { FileDeleteConfirmationDialogComponent } from './components/projects/file-delete-confirmation-dialog.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { RegisterComponent } from './components/projects/register/register.component';
import { RegistermatComponent } from './components/projects/register/registermat/registermat.component';
import { SummaryComponent } from './components/projects/summary/summary.component';
import { TaskComponent } from './components/projects/task/task.component';
import { TimelineComponent } from './components/projects/timeline/timeline.component';
import { RoleComponent } from './components/role/role.component';
import { RoledialogComponent } from './components/role/roledialog/roledialog.component';

@NgModule({
  declarations: [
    HeaderComponent,
    LoginheaderComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    RegistermatComponent,
    DepartmentComponent,
    DepartmentDialogComponent,
    FilterPipe,
    RoleComponent,
    RoledialogComponent,
    CreateprojectComponent,
    ProjectDeleteConfirmationDialogComponent,
    PermissionComponent,
    AddEditPermissionDialogComponent,
    ProjectsComponent,
    AssignmentDeleteConfirmationDialogComponent,
    FileDeleteConfirmationDialogComponent,
    TaskComponent,
    CalendarComponent,
    SummaryComponent,
    CompareComponent,
    DocumentsComponent,
    TimelineComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    DragDropModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    PdfViewerModule
  ],
  exports: [HeaderComponent]
})
export class TaskManagementModule { }
