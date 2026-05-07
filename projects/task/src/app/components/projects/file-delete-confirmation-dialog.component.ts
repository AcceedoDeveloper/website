import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-file-delete-confirmation-dialog',
  template: `
    <div class="delete-confirmation-dialog">
      <h2 mat-dialog-title>{{ data.title || 'Confirm Deletion' }}</h2>
      
      <mat-dialog-content>
        <div class="delete-message">
          <p>{{ data.message || 'Are you sure you want to delete this file? This action cannot be undone.' }}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button class="btn cancel" (click)="cancelDelete()">Cancel</button>
        <button class="btn danger" (click)="confirmDelete()">Delete</button>
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

    .btn {
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      min-width: 80px;
      text-align: center;
      margin-left: 10px;
    }

    .btn.cancel {
      background: #f8f9fa;
      color: #6c757d;
      border: 1px solid #e9ecef;
    }

    .btn.cancel:hover {
      background: #e9ecef;
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn.danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }

    .btn.danger:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
    }
  `]
})
export class FileDeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FileDeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title?: string; 
      message?: string; 
      documentId?: string; 
      fileName?: string; 
    }
  ) {}

  confirmDelete(): void {
    this.dialogRef.close('confirm');
  }

  cancelDelete(): void {
    this.dialogRef.close('cancel');
  }
}
