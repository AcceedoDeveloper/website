import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GuestDetails, GuestDetailsService, GuestFormPayload } from './guest-details.service';

type FormMode = 'add' | 'edit';
type FormField = 'name' | 'email' | 'phone' | 'purpose';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[-\d\s()]{7,18}$/;

@Component({
  selector: 'app-guest-details',
  templateUrl: './guest-details.component.html',
  styleUrls: ['./guest-details.component.css']
})
export class GuestDetailsComponent implements OnInit {
  guests: GuestDetails[] = [];
  filteredGuests: GuestDetails[] = [];
  pagedGuests: GuestDetails[] = [];
  loading = true;
  error = '';
  
  // Search
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  // Add / Edit form
  showForm = false;
  formMode: FormMode = 'add';
  form: GuestFormPayload = this.emptyForm();
  editingGuest: GuestDetails | null = null;
  saving = false;
  formError = '';
  fieldErrors: Partial<Record<FormField, string>> = {};

  // Send email
  guestToSend: GuestDetails | null = null;
  sending = false;

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
    this.searchTerm = '';
    this.loadGuests();
  }

  private loadGuests(): void {
    this.loading = true;
    this.error = '';
    this.guestService.getGuests().subscribe({
      next: (data) => {
        this.guests = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load guest details.';
        this.loading = false;
      }
    });
  }

  // ── Search & Pagination ───────────────────────────────────────────────────
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      this.filteredGuests = [...this.guests];
    } else {
      this.filteredGuests = this.guests.filter((guest) =>
        (guest.name && guest.name.toLowerCase().includes(term)) ||
        (guest.email && guest.email.toLowerCase().includes(term)) ||
        (guest.phone && guest.phone.toLowerCase().includes(term)) ||
        (guest.purpose && guest.purpose.toLowerCase().includes(term))
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.itemsPerPage = Number(this.itemsPerPage) || 10;
    this.totalPages = Math.ceil(this.filteredGuests.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(this.startIndex + this.itemsPerPage, this.filteredGuests.length);
    this.pagedGuests = this.filteredGuests.slice(this.startIndex, this.endIndex);
  }

  onItemsPerPageChange(): void { 
    this.currentPage = 1; 
    this.updatePagination(); 
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { 
      this.currentPage = page; 
      this.updatePagination(); 
    }
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

  // ── Add / Edit ────────────────────────────────────────────────────────────
  openAdd(): void {
    this.formMode = 'add';
    this.editingGuest = null;
    this.form = this.emptyForm();
    this.resetFormErrors();
    this.showForm = true;
  }

  openEdit(guest: GuestDetails): void {
    this.formMode = 'edit';
    this.editingGuest = guest;
    this.form = {
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      purpose: guest.purpose || ''
    };
    this.resetFormErrors();
    this.showForm = true;
  }

  closeForm(): void {
    if (this.saving) return;
    this.showForm = false;
    this.editingGuest = null;
  }

saveForm(): void {
    if (this.saving) return;
    
    const rawEmail = (this.form.email || '').trim().toLowerCase();
    
    // If email is optional but backend strictly requires a valid email format, 
    // we can either omit it if backend allows, or provide a clean fallback if left blank.
    const payload: GuestFormPayload = {
      name: (this.form.name || '').trim(),
      email: rawEmail, // If backend throws error when empty, update backend or use a placeholder if needed
      phone: (this.form.phone || '').trim(),
      purpose: (this.form.purpose || '').trim()
    };
    
    this.resetFormErrors();

    if (!payload.name) {
      this.fieldErrors.name = 'Name is required.';
    }
    
    // Only validate email pattern if the user actually typed something
    if (rawEmail && !EMAIL_PATTERN.test(rawEmail)) {
      this.fieldErrors.email = 'Please enter a valid email address.';
    }

    if (payload.phone && !PHONE_PATTERN.test(payload.phone)) {
      this.fieldErrors.phone = 'Please enter a valid phone number.';
    }

    if (Object.keys(this.fieldErrors).length) return;

    const editingId = this.formMode === 'edit' ? this.editingGuest?._id : undefined;
    if (this.formMode === 'edit' && !editingId) {
      this.snackBar.open('Invalid guest id.', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    const request = editingId
      ? this.guestService.updateGuest(editingId, payload)
      : this.guestService.addGuest(payload);

    request.subscribe({
      next: (res) => {
        const saved: GuestDetails = res?.guest || { ...payload };
        if (editingId) {
          this.guests = this.guests.map((item) =>
            item._id === editingId ? { ...item, ...saved } : item
          );
        } else {
          this.guests = [saved, ...this.guests];
          this.currentPage = 1;
        }
        this.applyFilter();
        this.saving = false;
        this.showForm = false;
        this.editingGuest = null;
        this.snackBar.open(
          editingId ? 'Guest updated successfully.' : 'Guest added successfully.',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      },
      error: (err) => {
        this.saving = false;
        const field = err?.error?.field;
        const message = err?.error?.message || 'Unable to save guest details.';
        
        // If the backend controller still throws "Email is required", map it to the email field error smoothly
        if (message.toLowerCase().includes('email')) {
          this.fieldErrors.email = message;
        } else if (field === 'both') {
          this.fieldErrors.email = 'This email is already used.';
          this.fieldErrors.phone = 'This phone number is already used.';
        } else if (this.isFormField(field)) {
          this.fieldErrors[field] = message;
        } else {
          this.formError = message;
        }
      }
    });
  }

  private isFormField(value: unknown): value is FormField {
    return value === 'name' || value === 'email' || value === 'phone' || value === 'purpose';
  }

  private emptyForm(): GuestFormPayload {
    return { name: '', email: '', phone: '', purpose: '' };
  }

  private resetFormErrors(): void {
    this.formError = '';
    this.fieldErrors = {};
  }

  // ── Send email ────────────────────────────────────────────────────────────
  askSend(guest: GuestDetails): void {
    if (!guest.email) {
      this.snackBar.open('This guest does not have an email address.', 'Close', { duration: 3000 });
      return;
    }
    this.guestToSend = guest;
  }

  cancelSend(): void {
    if (!this.sending) this.guestToSend = null;
  }

  confirmSend(): void {
    const guest = this.guestToSend;
    if (!guest || !guest._id) {
      this.snackBar.open('Invalid guest id.', 'Close', { duration: 3000 });
      return;
    }
    if (this.sending) return;
    this.sending = true;
    this.guestService.sendGuestMail(guest._id).subscribe({
      next: (res) => {
        const sentAt: string = res?.guest?.lastEmailSentAt || new Date().toISOString();
        this.guests = this.guests.map((item) =>
          item._id === guest._id ? { ...item, lastEmailSentAt: sentAt } : item
        );
        this.applyFilter();
        this.sending = false;
        this.guestToSend = null;
        this.snackBar.open(res?.message || `Email sent to ${guest.email}.`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        this.sending = false;
        this.snackBar.open(
          err?.error?.message || 'Unable to send the email. Please try again.',
          'Close',
          { duration: 4000 }
        );
      }
    });
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
        this.applyFilter();
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

  formatDate(value?: string | null): string {
    return value ? new Date(value).toLocaleString() : '-';
  }
}