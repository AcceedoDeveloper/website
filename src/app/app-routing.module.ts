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
  { path: 'register', component: RegisterComponent },// ✅ NEW route for registration
  { path: 'login', component: LoginComponent},
  {path:'signin', component:LoginComponent},
  {path:'project', component:ProjectComponent},
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled'  
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }