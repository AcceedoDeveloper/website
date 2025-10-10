import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoleserviceService } from '../../service/roleservice.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-roledialog',
  templateUrl: './roledialog.component.html',
  styleUrls: ['./roledialog.component.css']
})
export class RoledialogComponent implements OnInit {
  roleform!: FormGroup;
  isEdit = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private roleservice: RoleserviceService,
    private dialogRef: MatDialogRef<RoledialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.initForm();

    // Detect edit mode
    if (this.data?.role) {
      this.isEdit = true;
      this.patchForm(this.data.role);
    }
  }

  /** Initialize form */
  private initForm() {
    this.roleform = this.fb.group({
      role: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  /** Patch form with existing role (edit) */
  private patchForm(item: any) {
    if (item?.role) {
      this.roleform.patchValue({ role: item.role });
    } else {
      console.error('Invalid role data:', item);
      this.snackBar.open('Invalid role data provided', 'Close', { duration: 3000 });
    }
  }

  /** Save or update role */
  saveroledata() {
    if (this.roleform.invalid) {
      this.roleform.markAllAsTouched();
      console.error('Form invalid:', this.roleform.errors, this.roleform.value);
      this.snackBar.open('Please fill out the form correctly', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    // Use `newName` for update to match backend API
    const payload = { newName: this.roleform.value.role }; // Changed from `role` to `newName`
    console.log('📤 Sending payload:', payload);

    if (this.isEdit) {
      console.log('✏️ Updating role with ID:', this.data.role._id);
      this.roleservice.edirole(this.data.role._id, payload).subscribe({
        next: (result) => {
          console.log('✅ Role updated:', result);
          this.isLoading = false;
          this.snackBar.open('Role updated successfully!', 'Close', { duration: 3000 });
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 300);
        },
        error: (err) => {
          console.error('❌ Update failed:', JSON.stringify(err, null, 2));
          this.isLoading = false;
          this.snackBar.open(`Failed to update role: ${err.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    } else {
      // For create, use `role` as per createRole API
      const createPayload = { role: this.roleform.value.role };
      this.roleservice.saverole(createPayload).subscribe({
        next: (result) => {
          console.log('✅ Role created:', result);
          this.isLoading = false;
          this.snackBar.open('Role created successfully!', 'Close', { duration: 3000 });
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 300);
        },
        error: (err) => {
          console.error('❌ Create failed:', JSON.stringify(err, null, 2));
          this.isLoading = false;
          this.snackBar.open(`Failed to create role: ${err.error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    }
   
  }

  /** Reset form (clear on add / restore original on edit) */
 
resetForm() {
  this.roleform.reset(); // Clears all values
  this.dialogRef.close(true);
}
  

  /** Getter for validation in template */
  get vrole() {
    return this.roleform.get('role');
  }
}