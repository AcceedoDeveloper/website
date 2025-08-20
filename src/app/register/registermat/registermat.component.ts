import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { UserservicesService } from '../services/userservices.service';
import { RoleserviceService } from '../../service/roleservice.service';
import { DepartmentserviceService } from '../../department/service/departmentservice.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-registermat',
  templateUrl: './registermat.component.html',
  styleUrls: ['./registermat.component.css']
})
export class RegistermatComponent implements OnInit {
  registerForm: FormGroup;
  roles: any[] = [];
  departments: any[] = [];
  subDepartmentsData: any[] = [];
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private userservice: UserservicesService,
    private httprole: RoleserviceService,
    private departmentservices: DepartmentserviceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<RegistermatComponent> // Add dialogRef for closing dialog
  ) {
    this.registerForm = this.fb.group({
      userCode: ['', Validators.required],
      name: ['', Validators.required],
      userName: ['', Validators.required],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]], 
      phoneNumber: ['', [Validators.required]],
      role: ['', Validators.required],
      department: this.fb.group({
        departmentName: ['', Validators.required],
        subDepartments: this.fb.array([])
      })
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadDepartments();

    if (this.data?.item) {
      this.isEdit = true;
      this.patchForm(this.data.item);
    }
  }

  patchForm(item: any) {
    this.registerForm.patchValue({
      userCode: item.UserCode,
      name: item.UserName, // Adjust field names based on backend
      userName: item.userName,
      password:item.password,
      emailId: item.emailId,
      phoneNumber: item.phoneNumber,
      role: item.role?.role,
      department: {
        departmentName: item.department?.departmentName
      }
    });

    // Clear existing subDepartments
    this.subDepartments.clear();

    // Patch subDepartment if exists
    if (item.subDepartment) {
      this.addSubDepartment(item.subDepartment);
    }

    // Preload department subDepartments options
    if (item.department) {
      this.subDepartmentsData = item.department.subDepartments || [];
    }
  }

  get subDepartments(): FormArray {
    return this.registerForm.get('department.subDepartments') as FormArray;
  }

  addSubDepartment(name: string = '') {
    this.subDepartments.push(this.fb.group({ name: [name, Validators.required] }));
  }

  removeSubDepartment(index: number) {
    this.subDepartments.removeAt(index);
  }

  loadRoles() {
    this.httprole.Loadrole().subscribe({
      next: (data: any) => {
        this.roles = data;
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }

  loadDepartments() {
    this.departmentservices.loaddm().subscribe({
      next: (data: any) => {
        this.departments = data;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  onDepartmentChange(event: any) {
    const deptName = event.target.value;
    const dept = this.departments.find(d => d.departmentName === deptName);
    this.subDepartmentsData = dept ? dept.subDepartments : [];
    this.subDepartments.clear();
    if (this.subDepartmentsData.length > 0) {
      this.addSubDepartment();
    }
  }
  cancel()
  {
    this.dialogRef.close(true);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      console.error('Form invalid', this.registerForm.value);
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.value;
    const roleObj = this.roles.find(r => r.role === formValue.role);
    if (!roleObj) {
      console.error('Invalid role selected');
      return;
    }

    const deptObj = this.departments.find(d => d.departmentName === formValue.department.departmentName);
    if (!deptObj) {
      console.error('Invalid department selected');
      return;
    }

    const subDepartmentName = formValue.department.subDepartments.length > 0 ? formValue.department.subDepartments[0].name : '';
    if (subDepartmentName && !deptObj.subDepartments.some((sd: any) => sd.name === subDepartmentName)) {
      console.error('Invalid subDepartment selected');
      return;
    }

    const payload = {
      userCode: formValue.userCode,
      name: formValue.name,
      userName: formValue.userName,
      emailId: formValue.emailId,
      password: formValue.password || undefined, // Exclude password if empty
      phoneNumber: formValue.phoneNumber,
      role: formValue.role,
      department: formValue.department.departmentName,
      subDepartment: subDepartmentName
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    if (this.isEdit) {
      // Update user
      this.userservice.edituser(this.data.item._id, payload).subscribe({
        next: (res) => {
          console.log('User updated:', res);
          this.dialogRef.close(true); // Close dialog on success
        },
        error: (err) => {
          console.error('Error updating user:', err);
          console.log('Server error details:', JSON.stringify(err.error, null, 2));
        }
      });
    } else {
      // Create user
      this.userservice.saveuser(payload).subscribe({
        next: (res) => {
          console.log('User saved:', res);
          this.registerForm.reset();
          this.dialogRef.close(true); // Close dialog on success
        },
        error: (err) => {
          console.error('Error saving user:', err);
          console.log('Server error details:', JSON.stringify(err.error, null, 2));
        }
      });
    }
  }

  // updateuser() {
  //   // This method might not be needed if handled in onSubmit
  //   this.onSubmit();
  // }
}