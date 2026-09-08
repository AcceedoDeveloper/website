import { Component, OnInit } from '@angular/core';
import { GuestDetails, GuestDetailsService } from './guest-details.service';

@Component({
  selector: 'app-guest-details',
  templateUrl: './guest-details.component.html',
  styleUrls: ['./guest-details.component.css']
})
export class GuestDetailsComponent implements OnInit {
  guests: GuestDetails[] = [];
  loading = true;
  error = '';

  constructor(private guestService: GuestDetailsService) {}

  ngOnInit(): void {
    this.guestService.getGuests().subscribe({
      next: (data) => {
        this.guests = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load guest details.';
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loading = true;
    this.error = '';
    this.guestService.getGuests().subscribe({
      next: (data) => {
        this.guests = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load guest details.';
        this.loading = false;
      }
    });
  }

  formatDate(value?: string): string {
    return value ? new Date(value).toLocaleString() : '-';
  }
}
