import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CareersService } from '../careers.service'; // adjust path as needed

export interface CareerDialogData {
  isEdit?: boolean;
  isDeleteMode?: boolean;
  career?: {
    _id: string;
    role: string;
    location: string;
    requirement: string;
    education: string;
    experience: string;
    jobdescription: string;
    jobtype: string;
    jobresponsibility: string;
  };
  id?: string;
  title?: string;
  message?: string;
}

@Component({
  selector: 'app-careersmat',
  templateUrl: './careersmat.component.html',
  styleUrls: ['./careersmat.component.css']
})
export class CareersmatComponent implements OnInit {

  careerForm!: FormGroup;
  isEdit: boolean = false;
  isDeleteMode: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CareersmatComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CareerDialogData,
    private careersService: CareersService
  ) {}

  ngOnInit(): void {
    this.isEdit       = this.data?.isEdit       ?? false;
    this.isDeleteMode = this.data?.isDeleteMode ?? false;

    if (!this.isDeleteMode) {
      this.initForm();

      // Pre-fill form when editing
      if (this.isEdit && this.data?.career) {
        this.careerForm.patchValue({
          role:            this.data.career.role,
          location:        this.data.career.location,
          jobtype:         this.data.career.jobtype,
          experience:      this.data.career.experience,
          education:       this.data.career.education,
          requirement:     this.data.career.requirement,
          jobdescription:  this.data.career.jobdescription,
          jobresponsibility: this.data.career.jobresponsibility
        });
      }
    }
  }

  // ── Build the reactive form ────────────────────────────────────────────────
  private initForm(): void {
    this.careerForm = this.fb.group({
      role:              ['', [Validators.required, Validators.minLength(2)]],
      location:          ['', Validators.required],
      jobtype:           ['', Validators.required],
      experience:        ['', Validators.required],
      education:         ['', Validators.required],
      requirement:       ['', Validators.required],
      jobdescription:    ['', Validators.required],
      jobresponsibility: ['', Validators.required]
    });
  }

  // ── Submit (create or update) ──────────────────────────────────────────────
  onSubmit(): void {
    if (this.careerForm.invalid) {
      this.careerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.careerForm.value;

    if (this.isEdit && this.data?.career?._id) {
      // ── UPDATE ──
      this.careersService.updateCareer(this.data.career._id, formValue).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.isLoading = false;
        }
      });

    } else {
      // ── CREATE ──
      this.careersService.createCareer(formValue).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Create failed:', err);
          this.isLoading = false;
        }
      });
    }
  }

  // ── Delete flow ────────────────────────────────────────────────────────────
  confirmDelete(): void {
    if (!this.data?.id) return;

    this.isLoading = true;
    this.careersService.deleteCareer(this.data.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.isLoading = false;
      }
    });
  }

  cancelDelete(): void {
    this.dialogRef.close(false);
  }

  // ── Cancel / close ─────────────────────────────────────────────────────────
  cancel(): void {
    this.dialogRef.close(false);
  }
}