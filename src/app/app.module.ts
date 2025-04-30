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
    CareerComponent
    
  
  
    
    
  
  ],
  imports: [
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
