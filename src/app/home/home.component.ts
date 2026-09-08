import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  GuestDetails,
  GuestDetailsService
} from '../guest-details/guest-details.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  // --------------------------------------------------
  // Guest popup
  // --------------------------------------------------

  showGuestPopup = false;

  submitted = false;

  submitting = false;

  errorMessage = '';


  // --------------------------------------------------
  // Duplicate field states
  // --------------------------------------------------

  emailAlreadyUsed = false;

  phoneAlreadyUsed = false;


  // --------------------------------------------------
  // PDF toast
  // --------------------------------------------------

  showPdfToast = false;


  // --------------------------------------------------
  // Guest data
  // --------------------------------------------------

  guest: GuestDetails = {

    name: '',

    email: '',

    phone: '',

    source: 'website-popup'
  };


  constructor(
    private route: ActivatedRoute,
    private guestService: GuestDetailsService
  ) {}


  // --------------------------------------------------
  // Page initialization
  // --------------------------------------------------

  ngOnInit(): void {

    this.route.queryParamMap.subscribe(
      params => {

        if (
          params.get('guest') === '1'
        ) {

          this.showGuestPopup = true;


          // Automatically download PDF
          setTimeout(() => {

            this.downloadPortfolio();

          }, 700);
        }
      }
    );
  }


  // --------------------------------------------------
  // Submit Guest
  // --------------------------------------------------

  submitGuest(): void {

    // Reset previous messages
    this.errorMessage = '';

    this.emailAlreadyUsed = false;

    this.phoneAlreadyUsed = false;


    // Trim values
    this.guest.name =
      this.guest.name.trim();

    this.guest.email =
      this.guest.email.trim();

    this.guest.phone =
      this.guest.phone.trim();


    // --------------------------------------------------
    // Required validation
    // --------------------------------------------------

    if (
      !this.guest.name ||
      !this.guest.email ||
      !this.guest.phone
    ) {

      this.errorMessage =
        'Please enter your name, email and phone number.';

      return;
    }


    // --------------------------------------------------
    // Email validation
    // --------------------------------------------------

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.guest.email
      )
    ) {

      this.emailAlreadyUsed = false;

      this.errorMessage =
        'Please enter a valid email address.';

      return;
    }


    // --------------------------------------------------
    // Phone validation
    // --------------------------------------------------

    if (
      !/^[+]?[-\d\s()]{7,18}$/.test(
        this.guest.phone
      )
    ) {

      this.phoneAlreadyUsed = false;

      this.errorMessage =
        'Please enter a valid phone number.';

      return;
    }


    // Prevent double click
    if (this.submitting) {
      return;
    }


    this.submitting = true;


    // --------------------------------------------------
    // API call
    // --------------------------------------------------

    this.guestService
      .saveGuest(this.guest)
      .subscribe({

        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        next: () => {

          this.submitting = false;

          this.submitted = true;

          this.errorMessage = '';

          this.emailAlreadyUsed = false;

          this.phoneAlreadyUsed = false;
        },


        // ----------------------------------------------
        // ERROR
        // ----------------------------------------------

        error: (err) => {

          this.submitting = false;


          const status =
            err?.status;


          const field =
            err?.error?.field;


          const message =
            err?.error?.message ||
            'Unable to save your details. Please try again.';


          // ------------------------------------------
          // DUPLICATE EMAIL
          // ------------------------------------------

          if (
            status === 409 &&
            field === 'email'
          ) {

            this.emailAlreadyUsed = true;

            this.phoneAlreadyUsed = false;

            this.errorMessage =
              'This email is already used.';

            return;
          }


          // ------------------------------------------
          // DUPLICATE PHONE
          // ------------------------------------------

          if (
            status === 409 &&
            field === 'phone'
          ) {

            this.phoneAlreadyUsed = true;

            this.emailAlreadyUsed = false;

            this.errorMessage =
              'This phone number is already used.';

            return;
          }


          // ------------------------------------------
          // BOTH EMAIL + PHONE
          // ------------------------------------------

          if (
            status === 409 &&
            field === 'both'
          ) {

            this.emailAlreadyUsed = true;

            this.phoneAlreadyUsed = true;

            this.errorMessage =
              'This email and phone number are already used.';

            return;
          }


          // ------------------------------------------
          // OTHER ERROR
          // ------------------------------------------

          this.errorMessage =
            message;
        }
      });
  }


  // --------------------------------------------------
  // Skip popup
  // --------------------------------------------------

  skipGuest(): void {

    this.showGuestPopup = false;

    this.emailAlreadyUsed = false;

    this.phoneAlreadyUsed = false;

    this.errorMessage = '';
  }


  // --------------------------------------------------
  // Download PDF
  // --------------------------------------------------

  downloadPortfolio(): void {

    const pdfUrl =
      'assets/Acceedo%20Product%20Portfolio.pdf';


    const link =
      document.createElement('a');


    link.href = pdfUrl;

    link.download =
      'Acceedo Product Portfolio.pdf';

    link.target = '_blank';

    link.rel = 'noopener';


    document.body.appendChild(link);

    link.click();

    link.remove();


    // --------------------------------------------------
    // Show toast
    // --------------------------------------------------

    this.showPdfToast = true;


    // Automatically hide toast
    setTimeout(() => {

      this.showPdfToast = false;

    }, 3000);
  }
}