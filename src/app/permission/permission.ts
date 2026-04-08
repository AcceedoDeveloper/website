export interface Permission {
  _id?: string;
  role: string;
  initialScreen?: string;
  screens: Screen;
}

export interface Screen {
   master:  MasterPermission;
  project: boolean;
  frontend: FrontendPermission;
  backend: BackendPermission;
}

export interface MasterPermission {
    user: boolean;
    role: boolean;
    createProject: boolean;
    permission: boolean;

}
export interface FrontendPermission {
  webdev: boolean;
  angularDeveloper: boolean;
  ngrx: boolean;
}

export interface BackendPermission {
  node: boolean;
  apiDatabase: boolean;
}