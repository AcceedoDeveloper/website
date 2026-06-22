import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CareersService } from './careers.service';
import { CareersmatComponent } from './careersmat/careersmat.component';

export interface CareerData {
  _id: string;
  role: string;
  location: string;
  requirement: string;
  education: string;
  experience: string;
  jobdescription: string;
  jobtype: string;
  jobresponsibility: string;
}

@Component({
  selector: 'app-careers',
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.css']
})
export class CareersComponent implements OnInit {

  allCareers: CareerData[] = [];
  filteredCareers: CareerData[] = [];
  paginatedCareers: CareerData[] = [];

  searchQuery: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  startIndex: number = 0;
  endIndex: number = 0;
  showEllipsis: boolean = false;

  constructor(
    private dialog: MatDialog,
    private careersService: CareersService
  ) {}

  ngOnInit(): void {
    this.loadCareers();
  }

  loadCareers(): void {
    this.careersService.getAllCareers().subscribe({
      next: (data: CareerData[]) => {
        this.allCareers = data;
        this.filteredCareers = [...data];
        this.currentPage = 1;
        this.updatePagination();
      },
      error: (err) => console.error('Failed to load careers:', err)
    });
  }

  filterCareers(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredCareers = !query
      ? [...this.allCareers]
      : this.allCareers.filter(item =>
          (item.role?.toLowerCase().includes(query)) ||
          (item.location?.toLowerCase().includes(query)) ||
          (item.jobtype?.toLowerCase().includes(query)) ||
          (item.experience?.toLowerCase().includes(query)) ||
          (item.education?.toLowerCase().includes(query)) ||
          (item.requirement?.toLowerCase().includes(query))
        );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCareers.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = Math.min(this.startIndex + this.itemsPerPage, this.filteredCareers.length);
    this.paginatedCareers = this.filteredCareers.slice(this.startIndex, this.endIndex);
    this.showEllipsis = this.totalPages > 5;
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
    let end   = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  showCreateCareer(): void {
    const dialogRef = this.dialog.open(CareersmatComponent, {
      width: '820px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'career-dialog-panel',   // ← removes padding + scrollbar
      data: { isEdit: false }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => { if (result) this.loadCareers(); });
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  editCareer(item: CareerData): void {
    const dialogRef = this.dialog.open(CareersmatComponent, {
      width: '820px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'career-dialog-panel',   // ← removes padding + scrollbar
      data: { isEdit: true, career: item }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => { if (result) this.loadCareers(); });
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  deleteCareer(id: string): void {
    const dialogRef = this.dialog.open(CareersmatComponent, {
      width: '460px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'career-dialog-panel',   // ← removes padding + scrollbar
      data: {
        isDeleteMode: true,
        id,
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this career posting? This action cannot be undone.'
      }
    });
    dialogRef.afterClosed().subscribe((result: boolean) => { if (result) this.loadCareers(); });
  }
}