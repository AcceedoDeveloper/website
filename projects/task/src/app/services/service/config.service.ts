import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AppConfig {
  baseUrl: string;
 costingUrl: string;
  backupUrl: string;
  uploadsUrl: string;
  liveTimeOut: number;
  urls: { name: string; url: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
private config: AppConfig = {
  baseUrl: '/',
  costingUrl: 'http://localhost:3008/',
  backupUrl: 'http://20.84.65.155:9011/',
  uploadsUrl: 'http://localhost:3008/',
  liveTimeOut: 0,
  urls: [
    { name: 'login', url: 'login' },
    { name: 'getProjects', url: 'getProjects' },
    { name: 'getProjectsByEmployee', url: 'by-employee' },
    { name: 'createProject', url: 'createProject' },
    { name: 'updateProject', url: 'updateProduct' },
    { name: 'deleteProject', url: 'deleteProduct' },
    { name: 'getDepartment', url: 'getDepartment' },
    { name: 'createDepartment', url: 'createDepartment' },
    { name: 'updateDepartment', url: 'updateDepartment' },
    { name: 'deleteDepartment', url: 'deleteDepartment' },
    { name: 'addSubdepartments', url: 'addSubdepartments' },
    { name: 'updateSubdepartments', url: 'updateSubdepartments' },
    { name: 'deleteSubdepartments', url: 'deleteSubdepartments' },
    { name: 'getUser', url: 'getUser' },
    { name: 'createUser', url: 'createUser' },
    { name: 'updateUser', url: 'updateUser' },
    { name: 'deleteUser', url: 'deleteUser' },
    { name: 'GetUsers', url: 'GetUsers' },
    { name: 'getRole', url: 'getrole' },
    { name: 'createRole', url: 'createRole' },
    { name: 'updateRole', url: 'updaterole' },
    { name: 'deleteRole', url: 'deleterole' },
    { name: 'CreateAssignWork', url: 'CreateAssignWork' },
    { name: 'UpdateAssignWork', url: 'UpdateAssignWork' },
    { name: 'DeleteAssignWork', url: 'DeleteAssignWork' },
    { name: 'GetAssignWork', url: 'GetAssignWork' },
    { name: 'getAssignWorkByProject', url: 'getAssignWorkByProject' },
    { name: 'getDocument', url: 'getDocument' },
    { name: 'createDocument', url: 'createDocument' },
    { name: 'updateDocument', url: 'updateDocument' },
    { name: 'deleteDocument', url: 'deleteDocument' },
    { name: 'deleteFile', url: 'deleteFile' },
    { name: 'createPermission', url: 'createPermission' },
    { name: 'getPermissions', url: 'getPermissions' },
    { name: 'updatePermission', url: 'updatePermission' },
    { name: 'deletePermission', url: 'deletePermission' }
  ]
}; 

  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    return this.http.get<AppConfig>('assets/config/development.json')
      .toPromise()
      .then((data) => {
        if (data) {
          this.config = data;
        }
      })
      .catch((error) => {
        console.warn('Config file could not be loaded. Using default task config.', error);
      });
  }

  getUrl(name: string): string {
    const found = this.config.urls.find((u) => u.name === name);
    return found ? found.url : '';
  }

getWebsiteUrl(name: string): string {
  return this.config.costingUrl + this.getUrl(name); 
}

getUploadsUrl(): string {
  return this.config.uploadsUrl;
}

getUploadUrl(filename: string): string {
  return this.config.uploadsUrl + filename;
}

}
