import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';



// Owl Carousel
import { CarouselModule } from 'ngx-owl-carousel-o';


import {ConfigService} from './service/config.service';

// Components
import { AppComponent } from './app.component';
import { FooterComponent } from './footer/footer.component';
import { HomeComponent } from './home/home.component';
import { FootrComponent } from './footr/footr.component';
import { BrandComponent } from './brand/brand.component';
import { CardsComponent } from './cards/cards.component';
import { MeltingSoftwareComponent } from './melting-software/melting-software.component';
import { HeatTreatmentComponent } from './heat-treatment/heat-treatment.component';
import { PowerMetricsComponent } from './power-metrics/power-metrics.component';
import { CarouselComponent } from './carousel/carousel.component';
import { ContactasComponent } from './contactas/contactas.component';
import { CareerComponent } from './career/career.component';
import { ServicesComponent } from './services/services.component';
import { AboutasComponent } from './aboutas/aboutas.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { Product1Component } from './product1/product1.component';
import { Product2Component } from './product2/product2.component';
import { Product3Component } from './product3/product3.component';
import { ProductionMonitorComponent } from './production-monitor/production-monitor.component';
import { BlogComponent } from './blog/blog.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ProjectComponent } from './project/project.component';
import { UwbComponent } from './uwb/uwb.component';

import { AdobeComponent } from './adobe/adobe.component';
import { DwincontantComponent } from './dwincontant/dwincontant.component';
import { Dwincontant3Component } from './dwincontant3/dwincontant3.component';
import { Dwincontant4Component } from './dwincontant4/dwincontant4.component';
import { Dwincontant5Component } from './dwincontant5/dwincontant5.component';
import { Dwincontant6Component } from './dwincontant6/dwincontant6.component';
import { Dwincontant7Component } from './dwincontant7/dwincontant7.component';
import { Dwincontant8Component } from './dwincontant8/dwincontant8.component';
import { HttpservicesComponent } from './httpservices/httpservices.component';
import { FilterPipe } from './filter.pipe';
import { CreateprojectComponent } from './createproject/createproject.component';
import { ProjectsComponent } from './projects/projects.component';
import { RoleComponent } from './role/role.component';
import { NgrxComponent } from './ngrx/ngrx.component';
import { WebdevComponent } from './webdev/webdev.component';
import { MatDialogModule } from '@angular/material/dialog'; // ✅ Added for mat-dialog-content
import { MatInputModule } from '@angular/material/input';
import { NodeComponent } from './node/node.component';
import { ApiDatabaseComponent } from './api-database/api-database.component';
import { AngularDeveloperComponent } from './angular-developer/angular-developer.component';
import { LoginheaderComponent } from './loginheader/loginheader.component';
import { DepartmentComponent } from './department/department.component';
import { DepartmentDialogComponent } from './department/department-dialog/department-dialog.component';
import { RoledialogComponent } from './role/roledialog/roledialog.component';
import { HttpClientModule } from '@angular/common/http';
import { RegistermatComponent } from './register/registermat/registermat.component';
import { ProjectDeleteConfirmationDialogComponent } from './createproject/project-delete-confirmation-dialog.component';
import { AssignmentDeleteConfirmationDialogComponent } from './projects/assignment-delete-confirmation-dialog.component';
import { FileDeleteConfirmationDialogComponent } from './projects/file-delete-confirmation-dialog.component';
import { HeaderComponent } from './header/header.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TaskComponent } from './projects/task/task.component';
import { CalendarComponent } from './projects/calendar/calendar.component';
import { SummaryComponent } from './projects/summary/summary.component';
import { CompareComponent } from './projects/compare/compare.component';
import { DocumentsComponent } from './projects/documents/documents.component';
import { SharedComponent } from './shared/shared.component';
import { Product4Component } from './product4/product4.component';
import { Product5Component } from './product5/product5.component';
import { Product6Component } from './product6/product6.component';
import { Product7Component } from './product7/product7.component';
import { TimelineComponent } from './projects/timeline/timeline.component';






export function loadConfigFactory(configService: ConfigService) {
  return () => configService.load();
}


@NgModule({
  declarations: [
    AppComponent,
    FooterComponent,
    HomeComponent,
    FootrComponent,
    BrandComponent,
    CardsComponent,
    MeltingSoftwareComponent,
    HeatTreatmentComponent,
    PowerMetricsComponent,
    CarouselComponent,
    ContactasComponent,
    CareerComponent,
    ServicesComponent,
    AboutasComponent,
    PrivacyPolicyComponent,
    Product1Component,
    Product2Component,
    Product3Component,
    ProductionMonitorComponent,
    BlogComponent,
    RegisterComponent,
    LoginComponent,
    ProjectComponent,
    AdobeComponent,
    DwincontantComponent,
    Dwincontant3Component,
    Dwincontant4Component,
    Dwincontant5Component,
    Dwincontant6Component,
    Dwincontant7Component,
    Dwincontant8Component,
    HttpservicesComponent,
    FilterPipe,
    CreateprojectComponent,
    ProjectsComponent,
    RoleComponent,
    NgrxComponent,
    TimelineComponent,
    WebdevComponent,

    NodeComponent,
    ApiDatabaseComponent,
    AngularDeveloperComponent,
    LoginheaderComponent,
    DepartmentComponent,
   DepartmentDialogComponent,
   RoledialogComponent,
   RegistermatComponent,
   ProjectDeleteConfirmationDialogComponent,
   AssignmentDeleteConfirmationDialogComponent,
   FileDeleteConfirmationDialogComponent,
   HeaderComponent,
   TaskComponent, 
   CalendarComponent,
   SummaryComponent,
   CompareComponent,
   DocumentsComponent,
   SharedComponent,
   Product4Component,
   Product5Component,
   Product6Component,
   Product7Component,
   UwbComponent,
   
  ],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CarouselModule,
    DragDropModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PdfViewerModule,
  ],
  providers: [
    provideAnimationsAsync(),
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfigFactory,
      deps: [ConfigService],
      multi: true
    }
  ],

  bootstrap: [AppComponent],

  
})
export class AppModule {}
