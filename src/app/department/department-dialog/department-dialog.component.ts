import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DepartmentserviceService, Department, SubDepartmentPayload, DepartmentResponse } from '../service/departmentservice.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-department-dialog',
  templateUrl: './department-dialog.component.html',
  styleUrls: ['./department-dialog.component.css']
})
export class DepartmentDialogComponent implements OnInit {
  dmform!: FormGroup;
  isEdit = false;

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private dmservice: DepartmentserviceService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { department?: Department }
  ) {}

  ngOnInit(): void {
    this.dmform = this.fb.group({
      departmentName: ['', [Validators.required, Validators.minLength(1)]],
      subDepartments: this.fb.array([])
    });

    // Check if editing
    if (this.data?.department) {
      this.isEdit = true;
      this.patchForm(this.data.department);
    } else {
      // Initialize with one empty sub-department for create mode
      this.addSubDepartment();
    }
  }

  get name(): FormArray {
    return this.dmform.get('subDepartments') as FormArray;
  }

  createSubDepartment(name: string = ''): FormGroup {
    return this.fb.group({
      name: [name, [Validators.required, Validators.minLength(1)]],
      _id: [null] // Store sub-department ID for updates
    });
  }

  addSubDepartment(name: string = ''): void {
    this.name.push(this.createSubDepartment(name));
  }

  removeSubDepartment(index: number): void {
    this.name.removeAt(index);
  }

  patchForm(department: Department): void {
    this.dmform.patchValue({
      departmentName: department.departmentName
    });

    // Clear existing sub-departments
    this.name.clear();

    // Patch sub-departments if they exist
    if (department.subDepartments && department.subDepartments.length > 0) {
      department.subDepartments.forEach(subDept => {
        this.addSubDepartment(subDept.name);
        this.name.at(this.name.length - 1).patchValue({ _id: subDept._id });
      });
    } else {
      this.addSubDepartment(); // Add one empty sub-department
    }
  }

  savedmdata(): void {
    if (this.dmform.invalid) {
      this.dmform.markAllAsTouched();
      this.snackBar.open('Please fill out all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    const departmentName = this.dmform.value.departmentName.trim();
    const subDepartments = this.name.controls
      .map(ctrl => ({
        name: ctrl.get('name')?.value?.trim(),
        _id: ctrl.get('_id')?.value
      }))
      .filter(subDept => subDept.name && subDept.name.length > 0);

    console.log('📤 Payload:', { departmentName, subDepartments });

    if (this.isEdit) {
      // Update mode
      this.updateDepartment(departmentName, subDepartments);
    } else {
      // Create mode
      this.createDepartment(departmentName, subDepartments);
    }
  }

  private createDepartment(departmentName: string, subDepartments: { name: string; _id?: string }[]): void {
    this.dmservice.loaddm().subscribe({
      next: (departments: Department[]) => {
        if (departments.some(dept => dept.departmentName.toLowerCase() === departmentName.toLowerCase())) {
          this.snackBar.open('Department name already exists.', 'Close', { duration: 3000 });
          return;
        }

        this.dmservice.savedm({ departmentName }).subscribe({
          next: (response: DepartmentResponse) => {
            console.log('✅ Create department response:', response);
            const department = response.department;
            if (!department || !department._id) {
              this.snackBar.open('Failed to save department: No department ID returned.', 'Close', { duration: 3000 });
              return;
            }

            if (subDepartments.length > 0) {
              const subDepartmentPayload: SubDepartmentPayload = {
                subDepartments: subDepartments.map(sub => sub.name)
              };
              console.log('Payload for /addSubdepartments:', subDepartmentPayload);
              this.dmservice.addSubDepartment(department._id, subDepartmentPayload).subscribe({
                next: (subResponse: DepartmentResponse) => {
                  console.log('✅ Add subdepartment response:', subResponse);
                  this.snackBar.open('Department and subdepartments saved successfully!', 'Close', { duration: 3000 });
                  this.cleardm();
                  this.dialog.closeAll();
                  this.router.navigate(['/department']);
                },
                error: (error) => {
                  console.error('❌ Error adding subdepartments:', JSON.stringify(error, null, 2));
                  this.snackBar.open(`Failed to save subdepartments: ${error.error?.message || 'Server error'}`, 'Close', { duration: 3000 });
                }
              });
            } else {
              this.snackBar.open('Department saved successfully!', 'Close', { duration: 3000 });
              this.cleardm();
              this.dialog.closeAll();
              this.router.navigate(['/department']);
            }
          },
          error: (error) => {
            console.error('❌ Error saving department:', JSON.stringify(error, null, 2));
            const errorMessage = error.error?.message === 'Department name already exists'
              ? 'Department name already exists.'
              : error.error?.message || 'Server error';
            this.snackBar.open(`Failed to save department: ${errorMessage}`, 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('❌ Error fetching departments:', JSON.stringify(error, null, 2));
        this.snackBar.open('Failed to validate department name.', 'Close', { duration: 3000 });
      }
    });
  }

  private updateDepartment(departmentName: string, subDepartments: { name: string; _id?: string }[]): void {
    const deptId = this.data.department?._id;
    if (!deptId) {
      this.snackBar.open('Invalid department ID.', 'Close', { duration: 3000 });
      return;
    }

    this.dmservice.loaddm().subscribe({
      next: (departments: Department[]) => {
        if (departments.some(dept => dept.departmentName.toLowerCase() === departmentName.toLowerCase() && dept._id !== deptId)) {
          this.snackBar.open('Department name already exists.', 'Close', { duration: 3000 });
          return;
        }

        this.dmservice.editdm(deptId, { departmentName }).subscribe({
          next: (response: DepartmentResponse) => {
            console.log('✅ Update department response:', response);
            this.handleSubDepartments(deptId, subDepartments);
          },
          error: (error) => {
            console.error('❌ Error updating department:', JSON.stringify(error, null, 2));
            this.snackBar.open(`Failed to update department: ${error.error?.message || 'Server error'}`, 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error(' Error fetching departments:', JSON.stringify(error, null, 2));
        this.snackBar.open('Failed to validate department name.', 'Close', { duration: 3000 });
      }
    });
  }

  private handleSubDepartments(deptId: string, subDepartments: { name: string; _id?: string }[]): void {
    const existingSubIds = (this.data.department?.subDepartments || []).map(sub => sub._id).filter(id => id);
    const newSubNames = subDepartments.filter(sub => !sub._id).map(sub => sub.name);
    const updatedSubDepartments = subDepartments.filter(sub => sub._id);

    // Handle new sub-departments
    if (newSubNames.length > 0) {
      const subDepartmentPayload: SubDepartmentPayload = { subDepartments: newSubNames };
      this.dmservice.addSubDepartment(deptId, subDepartmentPayload).subscribe({
        next: (response) => {
          console.log('✅ Added new subdepartments:', response);
          this.updateExistingSubDepartments(deptId, updatedSubDepartments);
        },
        error: (error) => {
          console.error('❌ Error adding new subdepartments:', JSON.stringify(error, null, 2));
          this.snackBar.open(`Failed to add subdepartments: ${error.error?.message || 'Server error'}`, 'Close', { duration: 3000 });
        }
      });
    } else {
      this.updateExistingSubDepartments(deptId, updatedSubDepartments);
    }

    // Delete removed sub-departments
    const submittedSubIds = subDepartments.map(sub => sub._id).filter(id => id);
    const subIdsToDelete = existingSubIds.filter(id => !submittedSubIds.includes(id));
    if (subIdsToDelete.length > 0) {
      subIdsToDelete.forEach(subId => {
        this.dmservice.deleteSubDepartment(subId!).subscribe({
          next: (response) => {
            console.log('✅ Deleted subdepartment:', response);
          },
          error: (error) => {
            console.error('❌ Error deleting subdepartment:', JSON.stringify(error, null, 2));
            this.snackBar.open(`Failed to delete subdepartment: ${error.error?.message || 'Server error'}`, 'Close', { duration: 3000 });
          }
        });
      });
    }
  }

  private updateExistingSubDepartments(deptId: string, subDepartments: { name: string; _id?: string }[]): void {
    if (subDepartments.length === 0) {
      this.snackBar.open('Department updated successfully!', 'Close', { duration: 3000 });
      this.cleardm();
      this.dialog.closeAll();
      this.router.navigate(['/department']);
      return;
    }

    let completedUpdates = 0;
    subDepartments.forEach(sub => {
      if (sub._id) {
        this.dmservice.updateSubDepartment(sub._id, { name: sub.name }).subscribe({
          next: (response) => {
            console.log('✅ Updated subdepartment:', response);
            completedUpdates++;
            if (completedUpdates === subDepartments.length) {
              this.snackBar.open('Department and subdepartments updated successfully!', 'Close', { duration: 3000 });
              this.cleardm();
              this.dialog.closeAll();
              this.router.navigate(['/department']);
            }
          },
          error: (error) => {
            console.error('❌ Error updating subdepartment:', JSON.stringify(error, null, 2));
            this.snackBar.open(`Failed to update subdepartment: ${error.error?.message || 'Server error'}`, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  cleardm(): void {
    this.dmform.reset();
    const subDepartments = this.dmform.get('subDepartments') as FormArray;
    subDepartments.clear();
    this.addSubDepartment();
  }

  createcancel(): void {
    this.dialog.closeAll();
    this.router.navigate(['/department']);
  }
}