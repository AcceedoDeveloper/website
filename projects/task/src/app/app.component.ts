import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskManagementModule } from './task-management.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TaskManagementModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'task';
}
