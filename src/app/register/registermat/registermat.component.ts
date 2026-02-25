import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserservicesService } from '../services/userservices.service';
import { RoleserviceService } from '../../service/roleservice.service';
import { DepartmentserviceService } from '../../department/service/departmentservice.service';
import { ConfigService } from '../../service/config.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-registermat',
  templateUrl: './registermat.component.html',
  styleUrls: ['./registermat.component.css']
})
export class RegistermatComponent implements OnInit {

  registerForm!: FormGroup;

  roles: any[] = [];
  departments: any[] = [];
  subDepartmentsData: any[] = [];

  isEdit = false;
  isDeleteMode = false;

  selectedFile: File | null = null;
  selectedFileName = '';

  previewImage: string | ArrayBuffer | null = null;
  existingImageUrl: string | null = null;
  existingPhotoField: string | null = null;

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userservice: UserservicesService,
    private httprole: RoleserviceService,
    private departmentservices: DepartmentserviceService,
    private configService: ConfigService,
    private dialogRef: MatDialogRef<RegistermatComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.registerForm = this.fb.group({

      userCode: ['', Validators.required],

      name: ['', Validators.required],

      userName: ['', Validators.required],

      emailId: ['', [Validators.required, Validators.email]],

      password: ['', Validators.minLength(5)],

      phoneNumber: ['', Validators.required],

      role: ['', Validators.required],

      departmentName: ['', Validators.required],

      subDepartmentName: ['', Validators.required]

    });

  }

  // ✅ INIT
  ngOnInit(): void {

    this.loadRoles();

    this.loadDepartments();


    // ✅ DELETE MODE
    this.isDeleteMode = this.data?.isDeleteMode || false;


    // ✅ EDIT MODE
    if (this.data?.item && !this.isDeleteMode) {

      this.isEdit = true;

      this.patchForm(this.data.item);

    }

  }


  // ✅ PATCH FORM
  patchForm(item: any) {

    this.registerForm.patchValue({

      userCode: item.userCode || '',

      name: item.name || '',

      userName: item.userName || '',

      emailId: item.emailId || '',

      phoneNumber: item.phoneNumber || '',

      role: item.role?.role || item.role || '',

      departmentName: item.department?.departmentName || '',

      subDepartmentName: item.subDepartment || ''

    });


    this.existingPhotoField = item.photo || null;


    if (item.photo) {

      this.previewImage = this.configService.getUploadUrl(item.photo);

    }
    else {

      this.previewImage = 'assets/default-avatar.png';

    }


    // password optional in edit

    this.registerForm.get('password')?.clearValidators();

    this.registerForm.get('password')?.updateValueAndValidity();

  }


  // ✅ LOAD ROLES
  loadRoles() {

    this.httprole.Loadrole().subscribe({

      next: (res: any) => this.roles = res,

      error: err => console.log(err)

    });

  }


  // ✅ LOAD DEPT
  loadDepartments() {

    this.departmentservices.loaddm().subscribe({

      next: (res: any) => this.departments = res,

      error: err => console.log(err)

    });

  }


  // ✅ DEPT CHANGE
  onDepartmentChange(event: any) {

    const deptName = event.target.value;

    const dept = this.departments.find(x => x.departmentName === deptName);

    this.subDepartmentsData = dept ? dept.subDepartments : [];

  }


  // ✅ FILE SELECT
  onFileSelected(event: any) {

    const file = event.target.files[0];

    if (!file) return;

    this.selectedFile = file;

    this.selectedFileName = file.name;


    const reader = new FileReader();

    reader.onload = e => this.previewImage = reader.result;

    reader.readAsDataURL(file);

  }


  // ✅ CANCEL
  cancel() {

    this.dialogRef.close(false);

  }


  // ✅ DELETE CONFIRM
  confirmDelete() {

    this.dialogRef.close('confirm');

  }


  // ✅ DELETE CANCEL
  cancelDelete() {

    this.dialogRef.close('cancel');

  }


  // ✅ SUBMIT
  onSubmit() {

    if (this.registerForm.invalid) {

      this.registerForm.markAllAsTouched();

      return;

    }


    this.isLoading = true;


    const value = this.registerForm.value;

    const formData = new FormData();


    formData.append('userCode', value.userCode);

    formData.append('name', value.name);

    formData.append('userName', value.userName);

    formData.append('emailId', value.emailId);

    formData.append('phoneNumber', value.phoneNumber);

    formData.append('role', value.role);

    formData.append('department', value.departmentName);

    formData.append('subDepartment', value.subDepartmentName);


    if (value.password)

      formData.append('password', value.password);


    if (this.selectedFile)

      formData.append('photo', this.selectedFile);


    if (this.isEdit)

      this.updateUser(formData);

    else

      this.createUser(formData);

  }


  // ✅ CREATE
  createUser(formData: FormData) {

    this.userservice.saveuser(formData).subscribe({

      next: res => {

        this.isLoading = false;

        this.dialogRef.close(res);

      },

      error: err => {

        this.isLoading = false;

        alert("Create Failed");

      }

    });

  }


  // ✅ UPDATE
  updateUser(formData: FormData) {

    this.userservice.edituser(this.data.item._id, formData).subscribe({

      next: res => {

        this.isLoading = false;

        this.dialogRef.close(res);

      },

      error: err => {

        this.isLoading = false;

        alert("Update Failed");

      }

    });

  }

}