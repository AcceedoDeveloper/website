import {
Component,
OnInit,
ViewChild,
ElementRef
} from '@angular/core';

import { UserservicesService } from '../../register/services/userservices.service';

import { Chart, registerables } from 'chart.js';

import { Location } from '@angular/common';

Chart.register(...registerables);


@Component({

selector: 'app-compare',

templateUrl: './compare.component.html',

styleUrls: ['./compare.component.css']

})

export class CompareComponent implements OnInit {


/* ========================= */
/* USER DATA */
/* ========================= */

users: any[] = [];


/* ========================= */
/* DROPDOWN CONTROL */
/* ========================= */

showDropdown:boolean=false;


toggleDropdown(){

this.showDropdown=!this.showDropdown;

}



/* ========================= */
/* MULTIPLE USER SELECT */
/* ========================= */

selectedUsers: string[] = [];


/* ========================= */
/* TABLE DATA */
/* ========================= */

compareData: any[] = [];


/* ========================= */
/* FILTER */
/* ========================= */

selectedMonth = '';

selectedProject = '';


projects: string[] = [];


/* ========================= */
/* CHART */
/* ========================= */

chart: Chart | null = null;


@ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;



/* ========================= */
/* MONTH LIST */
/* ========================= */

months = [

'January','February','March','April','May','June',

'July','August','September','October','November','December'

];



constructor(

private userService: UserservicesService,

private location: Location

){}



/* ========================= */
/* INIT */
/* ========================= */

ngOnInit(){

this.loadData();

}



/* ========================= */
/* LOAD DATA */
/* ========================= */

loadData(){

this.userService.getuser().subscribe((res:any[])=>{

this.users = res;


this.projects = Array.from(

new Set(res.map(x=>x.projectName))

) as string[];

});

}



/* ========================= */
/* CHECKBOX SELECT */
/* ========================= */

onUserChange(event:any){

const value = event.target.value;

const checked = event.target.checked;


if(checked){

this.selectedUsers.push(value);

}else{

this.selectedUsers = this.selectedUsers.filter(x=>x!==value);

}

}



/* ========================= */
/* COMPARE FUNCTION */
/* ========================= */

compare(){


this.compareData = [];


const labels:string[] = [];

const completedData:number[] = [];


const sum = (arr:any[], field:string)=>

arr.reduce((t,i)=>t+(i[field]||0),0);



this.selectedUsers.forEach(userName=>{


const userList = this.users.filter(x=>

x.userName===userName &&

x.month===this.selectedMonth &&

(this.selectedProject=='' ||

x.projectName===this.selectedProject)

);



const total = sum(userList,'totalTasks');

const completed = sum(userList,'taskCompleted');

const pending = sum(userList,'taskPending');



this.compareData.push({

name:userName,

total:total,

completed:completed,

pending:pending

});


labels.push(userName);

completedData.push(completed);


});



/* ========================= */
/* DATASET */
/* ========================= */

const datasets = [

{

label: 'Completed %',

data: this.compareData.map(x =>

x.total ? Math.round((x.completed / x.total) * 100) : 0

),

backgroundColor: [

'#4CAF50',

'#2196F3',

'#FF9800',

'#9C27B0',

'#F44336',

'#009688',

'#3F51B5',

'#E91E63'

]

}

];



/* ========================= */
/* DESTROY OLD CHART */
/* ========================= */

if(this.chart){

this.chart.destroy();

}


setTimeout(()=>{this.chart=new Chart(this.chartRef.nativeElement,{
type:'bar',
data:{labels:labels,datasets:datasets},
options:{responsive:true,maintainAspectRatio:false,
plugins:{
legend:{
position:'top'
},

title:{

display:true,

text:'User Task Percent Compare'

}

},

scales:{

y:{

beginAtZero:true,

max:100,

title:{

display:true,

text:'Percent %'

}

},

x:{

title:{

display:true,

text:'Users'

}

}

}

}

});


},100);


}

goBack(){

this.location.back();

}



}