import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class UserservicesService {

  constructor( private httpuser:HttpClient) { }

  //http --> user

  getuserapi='http://localhost:3008/getUser';
  saveuserapi='http://localhost:3008/createUser';
  edituserapi='http://localhost:3008/updateUser';
  deleteuserapi='http://localhost:3008/deleteUser';


  //get user
  getuser()
  {
    return this.httpuser.get(this.getuserapi)
  }

  //save user

  saveuser(datas:any)
  {
    return this.httpuser.post(this.saveuserapi,datas)
  }

//update
  edituser(_id:any,data:any)
  {
    return this.httpuser.put(this.edituserapi+'/'+_id,data);
  }

  //delete

  deleteuser(_id:any)
  {
    return this.httpuser.delete(this.deleteuserapi+'/'+_id);
  }

}
