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
  registerForm: FormGroup;
  roles: any[] = [];
  departments: any[] = [];
  subDepartmentsData: any[] = [];
  isEdit = false;
  selectedFile: File | null = null;
  selectedFileName: string = '';
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<RegistermatComponent>
  ) {
    this.registerForm = this.fb.group({
      userCode: ['', Validators.required],
      name: ['', Validators.required],
      userName: ['', Validators.required],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(5)]],
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
      name: item.name || item.UserName || '',
      userName: item.userName || item.userName || '',
      emailId: item.emailId || item.Email || '',
      phoneNumber: item.phoneNumber || item.Phone || '',
      role: item.role?.role || item.role || '',
      departmentName: item.department?.departmentName || item.departmentName || '',
      subDepartmentName: item.subDepartment || ''
    });

    this.existingPhotoField = item.photo || null;
    

    if (item.photoURL) {
      this.existingImageUrl = item.photoURL;
      this.previewImage = item.photoURL;
    } else if (item.photo) {
      if (item.photo.startsWith('http')) {
        this.existingImageUrl = item.photo;
        this.previewImage = item.photo;
      } else {
        this.existingImageUrl = this.configService.getUploadUrl(item.photo);
        this.previewImage = this.existingImageUrl;
      }
    } else {
      this.previewImage = 'assets/default-avatar.png';
    }

    if (item.department && item.department.subDepartments) {
      this.subDepartmentsData = item.department.subDepartments;
    } else {
      this.subDepartmentsData = [];
    }


    if (this.isEdit) {
      this.registerForm.get('password')?.clearValidators();
      this.registerForm.get('password')?.updateValueAndValidity();
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
    this.registerForm.patchValue({ subDepartmentName: '' });
  }

  cancel() {
    this.dialogRef.close(false);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.previewImage = this.existingImageUrl || 'assets/default-avatar.png';
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          console.log(`Invalid control: ${key}`, control.errors);
        }
      });
      return;
    }

    this.isLoading = true;

    const formValue = this.registerForm.value;
    const formData = new FormData();

  
    formData.append('userCode', formValue.userCode);
    formData.append('name', formValue.name);
    formData.append('userName', formValue.userName);
    formData.append('emailId', formValue.emailId);
    formData.append('phoneNumber', formValue.phoneNumber);
    formData.append('role', formValue.role);
    formData.append('department', formValue.departmentName);
    formData.append('subDepartment', formValue.subDepartmentName);

 
    if (formValue.password) {
      formData.append('password', formValue.password);
    }

 
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    } else if (this.previewImage === 'assets/default-avatar.png' || !this.previewImage) {

      formData.append('removeImage', 'true');
    } else {

      formData.append('keepExistingImage', 'true');
    }

    if (this.isEdit) {
      this.updateUser(formData);
    } else {
      this.createUser(formData);
    }
  }

  private updateUser(formData: FormData) {
    this.userservice.edituser(this.data.item._id, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('User updated successfully:', response);
        const updatedUser = this.processUserResponse(response);        
        setTimeout(() => {
          this.dialogRef.close(updatedUser);
        }, 300);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error updating user:', err);
        alert('Failed to update user. Please try again.');
      }
    });
  }

  private createUser(formData: FormData) {
    this.userservice.saveuser(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('User created successfully:', response);
        const newUser = this.processUserResponse(response);
        
        this.registerForm.reset();
        this.previewImage = null;
        this.selectedFile = null;
        setTimeout(() => {
          this.dialogRef.close(newUser);
        }, 300);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error saving user:', err);
        alert('Failed to create user. Please try again.');
      }
    });
  }

  private processUserResponse(response: any): any {
    let photoURL = response.photoURL;
    
    if (!photoURL && response.photo) {
      if (response.photo.startsWith('http')) {
        photoURL = response.photo;
      } else {
        photoURL = this.configService.getUploadUrl(response.photo);
      }
    } else if (!photoURL && !response.photo) {
      photoURL = 'assets/default-avatar.png';
    }

    return {
      ...response,
      photoURL: photoURL,
      photo: response.photo || this.existingPhotoField
    };
  }
}