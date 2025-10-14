import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-assignment-delete-confirmation-dialog',
  template: `
    <div class="delete-confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title || 'Confirm Deletion' }}</h2>
      
      <mat-dialog-content>
        <div class="delete-message">
          <p>{{ data.message || 'Are you sure you want to delete this assignment? This action cannot be undone.' }}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelDelete()">Cancel</button>
        <button mat-raised-button color="warn" (click)="confirmDelete()">Delete</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-confirmation-dialog {
      padding: 20px;
      min-width: 300px;
    }
    
    .delete-message {
      margin: 20px 0;
      padding: 16px;
      background: #fef2f2;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }
    
    .delete-message p {
      margin: 0;
      color: #7f1d1d;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    h2 {
      color: #ef4444;
      margin-bottom: 16px;
    }
  `]
})
export class AssignmentDeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AssignmentDeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title?: string; 
      message?: string; 
      assignmentId?: string; 
    }
  ) {}

  confirmDelete(): void {
    this.dialogRef.close('confirm');
  }

  cancelDelete(): void {
    this.dialogRef.close('cancel');
  }
}
