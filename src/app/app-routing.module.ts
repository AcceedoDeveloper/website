import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PowerMetricsComponent } from './power-metrics/power-metrics.component';
import { HeatTreatmentComponent } from './heat-treatment/heat-treatment.component';
import { MeltingSoftwareComponent } from './melting-software/melting-software.component';
import { ContactasComponent } from './contactas/contactas.component';
import { CareerComponent } from './career/career.component';
import { ServicesComponent } from './services/services.component';
import { AboutasComponent } from './aboutas/aboutas.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { Product1Component } from './product1/product1.component';
import { Product2Component } from './product2/product2.component';
import { BlogComponent } from './blog/blog.component';
import { DwincontantComponent } from './dwincontant/dwincontant.component';
import { Dwincontant3Component } from './dwincontant3/dwincontant3.component';
import { Dwincontant4Component } from './dwincontant4/dwincontant4.component';
import { Dwincontant5Component } from './dwincontant5/dwincontant5.component';
import { Dwincontant6Component } from './dwincontant6/dwincontant6.component';
import { Dwincontant7Component } from './dwincontant7/dwincontant7.component';
import { Dwincontant8Component } from './dwincontant8/dwincontant8.component';
import { AdobeComponent } from './adobe/adobe.component';
import { ProductionMonitorComponent } from './production-monitor/production-monitor.component';
import { CardsComponent } from './cards/cards.component.spec';
import { Product3Component } from './product3/product3.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ProjectComponent } from './project/project.component';
import {CreateprojectComponent} from "./createproject/createproject.component";
import { ProjectsComponent } from './projects/projects.component';
import { RoleComponent } from './role/role.component';
import { NgrxComponent } from './ngrx/ngrx.component';
import { WebdevComponent } from './webdev/webdev.component';

import { NodeComponent } from './node/node.component';
import { ApiDatabaseComponent } from './api-database/api-database.component';
import { AngularDeveloperComponent } from './angular-developer/angular-developer.component';
import { LoginheaderComponent } from './loginheader/loginheader.component';
import { DepartmentComponent } from './department/department.component';
import { RoledialogComponent } from './role/roledialog/roledialog.component';
import { AuthGuard }from '../../src/app/guard/guards/auth.guard';




const routes: Routes = [
  { path: '', redirectTo: 'acceedo', pathMatch: 'full' },
  { path: 'acceedo', component: HomeComponent },
  { path: 'power-metrics', component: PowerMetricsComponent },
  { path: 'heat-treatment', component: HeatTreatmentComponent },
  { path: 'melting-software', component: MeltingSoftwareComponent },
  { path: 'product-monitor', component: ProductionMonitorComponent },
  { path: 'contactas', component: ContactasComponent },
  { path: 'career', component: CareerComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'aboutas', component: AboutasComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'product1', component: Product1Component },
  { path: 'product2', component: Product2Component },
  { path: 'blog', component: BlogComponent },
  { path: 'dwincontant', component: DwincontantComponent },
  { path: 'dwincontant3', component: Dwincontant3Component },
  { path: 'dwincontant4', component: Dwincontant4Component },
  { path: 'dwincontant5', component: Dwincontant5Component },
  { path: 'dwincontant6', component: Dwincontant6Component },
  { path: 'dwincontant7', component: Dwincontant7Component },
  { path: 'dwincontant8', component: Dwincontant8Component },
  { path: 'adobe', component: AdobeComponent },
  { path: 'cards', component: CardsComponent },
  { path: 'product3', component: Product3Component },

  { path: 'login', component: LoginComponent},
  {path:'signin', component:LoginComponent},
  {path:'project', component:ProjectComponent},

 {path:'projects',component:ProjectsComponent},
 {path:'role',component:RoleComponent},
{path:'ngrx',component:NgrxComponent},
{path:'webdev',component:WebdevComponent},
{path:'angulardeveloper',component:AngularDeveloperComponent},
{path:'node',component:NodeComponent},
{path:'api&database',component:ApiDatabaseComponent},
{path:'loginheader',component:LoginheaderComponent},
{path:'department',component:DepartmentComponent},
{path:'roledialog',component:RoledialogComponent},
{path:'role/edit/:id',component:RoledialogComponent},
 
  // Master (only admin can see + access)
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'department', component: DepartmentComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'role', component: RoleComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'create', component: CreateprojectComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },

  // Projects → all users
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },

  // Frontend → all users
  { path: 'webdev', component: WebdevComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },
  { path: 'angulardeveloper', component: AngularDeveloperComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },
  { path: 'ngrx', component: NgrxComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },

  // Backend → all users
  { path: 'node', component: NodeComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },
  { path: 'api&database', component: AppComponent, canActivate: [AuthGuard], data: { roles: ['admin','user'] } },

  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: '**', redirectTo: 'projects' }
];



@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled'  
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }