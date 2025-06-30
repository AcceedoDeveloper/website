import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon'; 
import { MatCardModule } from '@angular/material/card'; 
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';  
import { MatSidenavModule } from '@angular/material/sidenav';  
import { MatButtonModule } from '@angular/material/button';    
import { MatListModule } from '@angular/material/list';
import { FooterComponent } from './footer/footer.component';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { FootrComponent } from './footr/footr.component';

import { BrandComponent } from './brand/brand.component';

import { CarouselComponent } from './carousel/carousel.component';
import { CardsComponent } from './cards/cards.component';
import { SmartAttendanceComponent } from './smart-attendance/smart-attendance.component';
import { MeltingSoftwareComponent } from './melting-software/melting-software.component';
import { HeatTreatmentComponent } from './heat-treatment/heat-treatment.component';
import { PowerMetricsComponent } from './power-metrics/power-metrics.component';
import { ContactasComponent } from './contactas/contactas.component';
import { CareerComponent } from './career/career.component';
import { ServicesComponent } from './services/services.component';
import { AboutasComponent } from './aboutas/aboutas.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { Product1Component } from './product1/product1.component';
import { Product2Component } from './product2/product2.component';

import { ReactiveFormsModule } from '@angular/forms';
import { ProductionMonitorComponent } from './production-monitor/production-monitor.component';

import { FormsModule,  } from '@angular/forms';
import { BlogComponent } from './blog/blog.component';
import { DiwndisplayComponent } from './diwndisplay/diwndisplay.component';
import { DwincontantComponent } from './dwincontant/dwincontant.component';
import { Dwincontant2Component } from './dwincontant2/dwincontant2.component';
import { Dwincontant3Component } from './dwincontant3/dwincontant3.component';
import { Dwincontant4Component } from './dwincontant4/dwincontant4.component';
import { Dwincontant5Component } from './dwincontant5/dwincontant5.component';
import { Dwincontant6Component } from './dwincontant6/dwincontant6.component';
import { Dwincontant7Component } from './dwincontant7/dwincontant7.component';
import { Dwincontant8Component } from './dwincontant8/dwincontant8.component';






@NgModule({
  declarations: [
    AppComponent,
    
    FooterComponent,
    HomeComponent,
    FootrComponent,

    BrandComponent,
   
    CardsComponent,
    SmartAttendanceComponent,
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
    ProductionMonitorComponent,
    BlogComponent,
    DiwndisplayComponent,
    DwincontantComponent,
    Dwincontant2Component,
    Dwincontant3Component,
    Dwincontant4Component,
    Dwincontant5Component,
    Dwincontant6Component,
    Dwincontant7Component,
    Dwincontant8Component,
   
  
    
  
  
    
    
  
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule, 
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule, 
    MatSidenavModule,
    MatButtonModule,
    MatListModule,
    CarouselModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }