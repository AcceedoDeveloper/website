import { importProvidersFrom, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SmartAttendanceComponent } from './smart-attendance/smart-attendance.component';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { PowerMetricsComponent } from './power-metrics/power-metrics.component';
import { HeatTreatmentComponent } from './heat-treatment/heat-treatment.component';
import { MeltingSoftwareComponent } from './melting-software/melting-software.component';
import { ContactasComponent } from './contactas/contactas.component';
import { CareerComponent } from './career/career.component';
import { ServicesComponent } from './services/services.component';
import { AboutasComponent } from './aboutas/aboutas.component';
import {PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { Product1Component } from './product1/product1.component';
import { Product2Component } from './product2/product2.component';

const routes: Routes = [
  { path: '' , redirectTo: 'acceedo', pathMatch: 'full' },
  { path: 'acceedo', component: HomeComponent },
  { path: 'smart-attendance', component: SmartAttendanceComponent },
  { path: 'power-metrics', component: PowerMetricsComponent },
  { path: 'heat-treatment', component: HeatTreatmentComponent },
  { path: 'melting-software', component: MeltingSoftwareComponent },
  { path: 'contactas', component: ContactasComponent },
  { path: 'career', component: CareerComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'aboutas', component: AboutasComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'product1', component: Product1Component },
  { path: 'product2', component: Product2Component },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
