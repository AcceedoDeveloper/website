import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GuestDetails, GuestDetailsService } from './guest-details.service';

@Component({
  selector: 'app-guest-details',
  templateUrl: './guest-details.component.html',
  styleUrls: ['./guest-details.component.css']
})
export class GuestDetailsComponent implements OnInit {
  guests: GuestDetails[] = [];
  pagedGuests: GuestDetails[] = [];
  loading = true;
  error = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  // Delete
  guestToDelete: GuestDetails | null = null;
  deleting = false;

  constructor(
    private guestService: GuestDetailsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGuests();
  }

  refresh(): void {
    this.loadGuests();
  }

  private loadGuests(): void {
    this.loading = true;
    this.error = '';
    this.guestService.getGuests().subscribe({
      next: (data) => {
        this.guests = data || [];
        this.currentPage = 1;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load guest details.';
        this.loading = false;
      }
    });
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  updatePagination(): void {
    this.itemsPerPage = Number(this.itemsPerPage) || 10;
    this.totalPages = Math.ceil(this.guests.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(this.startIndex + this.itemsPerPage, this.guests.length);
    this.pagedGuests = this.guests.slice(this.startIndex, this.endIndex);
  }

  onItemsPerPageChange(): void { this.currentPage = 1; this.updatePagination(); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePagination(); }
  }
  goToFirstPage(): void { this.goToPage(1); }
  goToLastPage(): void  { this.goToPage(this.totalPages); }
  previousPage(): void  { this.goToPage(this.currentPage - 1); }
  nextPage(): void      { this.goToPage(this.currentPage + 1); }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  askDelete(guest: GuestDetails): void {
    this.guestToDelete = guest;
  }

  cancelDelete(): void {
    if (!this.deleting) this.guestToDelete = null;
  }

  confirmDelete(): void {
    const guest = this.guestToDelete;

    if (!guest || !guest._id) {
      this.snackBar.open('Invalid guest id.', 'Close', { duration: 3000 });
      return;
    }

    if (this.deleting) return;

    this.deleting = true;

    this.guestService.deleteGuest(guest._id).subscribe({
      next: () => {
        this.guests = this.guests.filter((item) => item._id !== guest._id);
        this.updatePagination();
        this.deleting = false;
        this.guestToDelete = null;
        this.snackBar.open('Guest deleted successfully.', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        this.deleting = false;
        this.snackBar.open(
          err?.error?.message || 'Unable to delete guest details.',
          'Close',
          { duration: 4000 }
        );
      }
    });
  }

  formatDate(value?: string): string {
    return value ? new Date(value).toLocaleString() : '-';
  }
}
