import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    private dialogRef: MatDialogRef<RegistermatComponent>
  ) {
    this.registerForm = this.fb.group({
      userCode: ['', Validators.required],
      name: ['', Validators.required],
      userName: ['', Validators.required],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required]],
      role: ['', Validators.required],
      departmentName: ['', Validators.required],
      subDepartmentName: ['', Validators.required]
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
      userCode: item.userCode,
      name: item.name,
      userName: item.userName,
      password: item.password,
      emailId: item.emailId,
      phoneNumber: item.phoneNumber,
      role: item.role?.role,
      departmentName: item.department?.departmentName,
      subDepartmentName: item.subDepartment || ''
    });

    // Preload department subDepartments options
    if (item.department) {
      this.subDepartmentsData = item.department.subDepartments || [];
    }
  }

  loadRoles() {
    this.httprole.Loadrole().subscribe({
      next: (data: any) => {
        this.roles = data;
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  loadDepartments() {
    this.departmentservices.loaddm().subscribe({
      next: (data: any) => {
        this.departments = data;
      },
      error: (err) => console.error('Error loading departments:', err)
    });
  }

  onDepartmentChange(event: any) {
    const deptName = event.target.value;
    const dept = this.departments.find(d => d.departmentName === deptName);
    this.subDepartmentsData = dept ? dept.subDepartments : [];
    this.registerForm.patchValue({ subDepartmentName: '' }); // reset subDept
  }

  cancel() {
    this.dialogRef.close(true);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.value;
    const payload = {
      userCode: formValue.userCode,
      name: formValue.name,
      userName: formValue.userName,
      emailId: formValue.emailId,
      password: formValue.password || undefined,
      phoneNumber: formValue.phoneNumber,
      role: formValue.role,
      department: formValue.departmentName,
      subDepartment: formValue.subDepartmentName
    };

    if (this.isEdit) {
      this.userservice.edituser(this.data.item._id, payload).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error updating user:', err)
      });
    } else {
      this.userservice.saveuser(payload).subscribe({
        next: () => {
          this.registerForm.reset();
          this.dialogRef.close(true);
        },
        error: (err) => console.error('Error saving user:', err)
      });
    }
  }
}
