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
selectedFile: File | null = null;
previewImage: string | ArrayBuffer | null = null;
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
    userCode: item.userCode || item.UserCode || '',  
    name: item.name || item.Name || '',               
    userName: item.userName || item.UserName || '',
    emailId: item.emailId || item.Email || '',
    phoneNumber: item.phoneNumber || item.Phone || '',
    role: item.role?.role || item.role || '',
    departmentName: item.department?.departmentName || item.departmentName || '',
    subDepartmentName: item.subDepartment || ''
  });


  if (item.department && item.department.subDepartments) {
    this.subDepartmentsData = item.department.subDepartments;
  } else {
    this.subDepartmentsData = [];
  }


  this.registerForm.get('password')?.reset('');
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



onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }


}
onSubmit() {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  const formValue = this.registerForm.value;
  const payload: any = {
    userCode: formValue.userCode,
    name: formValue.name,
    userName: formValue.userName,
    emailId: formValue.emailId,
    phoneNumber: formValue.phoneNumber,
    role: formValue.role,
    department: formValue.departmentName,
    subDepartment: formValue.subDepartmentName
  };

  if (formValue.password) payload.password = formValue.password;

  const formData = new FormData();
  Object.keys(payload).forEach(key => formData.append(key, payload[key]));

  // Only append the file if it exists
  if (this.selectedFile) {
    formData.append('profileImage', this.selectedFile); // must match multer field
  }

  if (this.isEdit) {
    this.userservice.edituser(this.data.item._id, formData).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Error updating user:', err)
    });
 } else {
    this.userservice.saveuser(payload).subscribe({
      next: () => {
        this.registerForm.reset();
        this.previewImage = null;
        this.dialogRef.close(true);
      },
    error: (err) => console.error('Error saving user:', err)
    });
  } 

}
}