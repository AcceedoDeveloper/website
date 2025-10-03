import { Component, OnInit, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement } from 'chart.js';
import { AssignWorkService, AssignWork, UserViewResponse } from '../../service/assignwork.service';
import { Observable, Subscription } from 'rxjs';
import {

  CategoryScale,
  LinearScale,
  Title,

} from 'chart.js';

// Register components


// Register Chart.js components
Chart.register(DoughnutController, ArcElement, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export interface AssignWorkExtended extends AssignWork {
  updatedAt?: string;
}

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() selectedProjectId: string = '';
  @Input() projects: any[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  dateFilter: 'today' | 'all' | 'month' | 'custom' = 'today';
  employees: any[] = [];
  assignments: AssignWorkExtended[] = [];
  filteredAssignments: AssignWorkExtended[] = [];
  selectedAssignee: string = '';
  selectedDate: string = '';
  username: string = '';

  summary = {
    completed: 0,
    updated: 0,
    created: 0,
    dueSoon: 0
  };

  chartData = {
    done: 0,
    inProgress: 0,
    toDo: 0
  };

  assigneeData: { [key: string]: { count: number, percentage: string, color: string } } = {};

  recentActivities: AssignWorkExtended[] = [];
  private workItemsChart: Chart | null = null;
  private assigneeChart: Chart | null = null;
  private subscriptions: Subscription[] = [];

  private colors = ['#4285F4', '#7CB342', '#BA68C8', '#FF4444', '#FFBB33', '#00C851', '#33B5E5'];

  constructor(private assignWorkService: AssignWorkService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('SummaryComponent initialized');
    console.log('Projects available:', this.projects);
    this.loadUsername();
    this.loadEmployees();
    this.loadAssignments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProjectId']) {
      console.log('selectedProjectId changed:', this.selectedProjectId);
      console.log('Projects available:', this.projects);
      this.applyFilters();
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called, isLoading:', this.isLoading);
    this.cdr.detectChanges();
    this.updateWorkItemsChart();
    this.updateAssigneeChart();
    // Force redraw after delay to handle DOM timing issues
    setTimeout(() => {
      console.log('Forcing assignee chart redraw after delay');
      this.updateAssigneeChart();
    }, 100);
  }

  ngOnDestroy(): void {
    console.log('Destroying SummaryComponent');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.workItemsChart) {
      this.workItemsChart.destroy();
      console.log('Work items chart destroyed');
    }
    if (this.assigneeChart) {
      this.assigneeChart.destroy();
      console.log('Assignee chart destroyed');
    }
  }

  private loadUsername(): void {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        this.username = userData?.UserName || userData?.username || 'User';
      } catch {
        this.username = userStr;
      }
    } else {
      const usernameOnly = sessionStorage.getItem('username');
      this.username = usernameOnly || 'User';
    }
    console.log('Username loaded:', this.username);
  }

  loadEmployees(): void {
    this.isLoading = true;
    console.log('Starting to load employees...');
    this.subscriptions.push(
      this.assignWorkService.getEmployees().subscribe({
        next: (employees) => {
          console.log('Employees loaded successfully:', employees);
          this.employees = employees;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading employees:', err);
          this.errorMessage = 'Failed to load employees. Using assignment IDs for filtering.';
          this.isLoading = false;
          this.extractEmployeesFromAssignments();
        }
      })
    );
  }

  loadAssignments(): void {
    this.isLoading = true;
    console.log('Starting to load assignments...');
    this.subscriptions.push(
      (this.assignWorkService.getAssignments() as any as Observable<UserViewResponse>).subscribe({
        next: (response: UserViewResponse) => {
          console.log('Raw API response:', response);
          this.assignments = (response.works || []).map(a => ({
            ...a,
            projectName: a.projectName || this.getProjectNameById(a.projectId) || 'Unknown Project'
          }));
          console.log('Assignments with details:', this.assignments.map(a => ({
            title: a.title,
            projectId: a.projectId,
            projectName: a.projectName,
            assignee: a.assignee,
            status: a.Status
          })));
          this.applyFilters();
          if (!this.employees.length) {
            this.extractEmployeesFromAssignments();
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading assignments:', err);
          this.errorMessage = 'Failed to load assignments. Please check if the backend server is running.';
          this.isLoading = false;
        }
      })
    );
  }

  extractEmployeesFromAssignments(): void {
    const uniqueIds = new Set<string>();
    this.assignments.forEach(assignment => {
      if (assignment.assignee) uniqueIds.add(assignment.assignee);
    });
    this.employees = Array.from(uniqueIds).map(id => ({ _id: id, name: id }));
    console.log('Fallback employees extracted:', this.employees);
  }

  getEmployeeName(id: string): string | undefined {
    const employee = this.employees.find(emp => emp._id === id);
    const name = employee ? (employee.name || employee.username || employee._id) : id;
    console.log(`getEmployeeName for id ${id}:`, name);
    return name;
  }

  getProjectName(): string {
    const project = this.projects.find(p => String(p._id) === String(this.selectedProjectId));
    const name = project ? (project.projectName || project.name || 'Untitled Project') : 'All Projects';
    console.log(`getProjectName for selectedProjectId ${this.selectedProjectId}:`, name);
    return name;
  }

  getProjectNameById(projectId: string): string {
    const project = this.projects.find(p => String(p._id) === String(projectId));
    if (!project) {
      console.warn(`No project found for projectId: ${projectId}. Available projects:`, this.projects.map(p => ({ id: p._id, name: p.projectName || p.name })));
      return 'Unknown Project';
    }
    const name = project.projectName || project.name || 'Untitled Project';
    console.log(`getProjectNameById for projectId ${projectId}:`, name);
    return name;
  }

  applyFilters(): void {
    console.log('Applying filters:', {
      dateFilter: this.dateFilter,
      assignee: this.selectedAssignee,
      date: this.selectedDate,
      projectId: this.selectedProjectId,
      username: this.username
    });

    this.filteredAssignments = this.assignments.filter(assignment => {
      let matchesProject = true;
      if (this.selectedProjectId) {
        matchesProject =
          String(assignment.projectId) === String(this.selectedProjectId) ||
          String(assignment.projectId || '') === String(this.selectedProjectId) ||
          String(assignment.projectName || '').toLowerCase() ===
          String(this.projects.find(p => String(p._id) === String(this.selectedProjectId))?.projectName || '').toLowerCase();
      } else {
        matchesProject =
          String(assignment.assignedTo) === String(this.username) ||
          String(assignment.assignee) === String(this.username);
      }

      const matchesAssignee = !this.selectedAssignee || assignment.assignee === this.selectedAssignee;

      let matchesDate = true;
      if (this.dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(assignment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        matchesDate = dueDate.getTime() === today.getTime();
      } else if (this.dateFilter === 'month' && this.selectedDate) {
        const selected = new Date(this.selectedDate);
        const dueDate = new Date(assignment.dueDate);
        matchesDate =
          dueDate.getFullYear() === selected.getFullYear() &&
          dueDate.getMonth() === selected.getMonth();
      } else if (this.dateFilter === 'custom' && this.selectedDate) {
        const selected = new Date(this.selectedDate);
        selected.setHours(0, 0, 0, 0);
        const dueDate = new Date(assignment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        matchesDate = dueDate.getTime() === selected.getTime();
      }

      const matches = matchesAssignee && matchesProject && matchesDate;
      console.log(`Assignment filter check:`, {
        assignment: {
          projectId: assignment.projectId,
          projectName: assignment.projectName,
          assignee: assignment.assignee,
          dueDate: assignment.dueDate,
          title: assignment.title
        },
        matchesProject,
        matchesAssignee,
        matchesDate,
        matches
      });
      return matches;
    });

    console.log('Filtered assignments:', this.filteredAssignments);
    this.updateSummary();
    this.updateRecentActivities();
    this.updateChartData();
    this.updateWorkItemsChart();
    this.updateAssigneeChart();
  }

  clearFilters(): void {
    console.log('Clearing filters');
    this.dateFilter = 'today';
    this.selectedAssignee = '';
    this.selectedDate = '';
    this.applyFilters();
  }

  updateSummary(): void {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.summary = {
      completed: this.filteredAssignments.filter(a => a.Status === 'Done').length,
      updated: this.filteredAssignments.filter(a => a.updatedAt && new Date(a.updatedAt) > oneWeekAgo).length,
      created: this.filteredAssignments.length,
      dueSoon: this.filteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate <= oneWeekFromNow && dueDate >= now && a.Status !== 'Done';
      }).length
    };

    console.log('Updated summary:', this.summary);
  }

  updateRecentActivities(): void {
    this.recentActivities = [...this.filteredAssignments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    console.log('Recent activities:', this.recentActivities);
  }

  updateChartData(): void {
    console.log('Raw assignments for chart data:', this.filteredAssignments.map(a => ({
      title: a.title,
      projectId: a.projectId,
      projectName: a.projectName,
      assignee: a.assignee,
      status: a.Status
    })));

    this.chartData = {
      done: this.filteredAssignments.filter(a => a.Status === 'Done').length,
      inProgress: this.filteredAssignments.filter(a => a.Status === 'InProgress').length,
      toDo: this.filteredAssignments.filter(a => a.Status === 'ToDo').length
    };

    // Compute assignee data
    const assigneeCounts: { [key: string]: number } = {};
    this.filteredAssignments.forEach(a => {
      if (a.assignee) {
        assigneeCounts[a.assignee] = (assigneeCounts[a.assignee] || 0) + 1;
      }
    });

    const totalTasks = this.filteredAssignments.length;
    this.assigneeData = {};
    Object.keys(assigneeCounts).forEach((assignee, index) => {
      const count = assigneeCounts[assignee];
      const percentage = totalTasks > 0 ? ((count / totalTasks) * 100).toFixed(1) : '0.0';
      this.assigneeData[assignee] = {
        count,
        percentage,
        color: this.colors[index % this.colors.length]
      };
    });

    console.log('Chart data:', this.chartData);
    console.log('Assignee data:', this.assigneeData);
  }

  updateWorkItemsChart(): void {
    const canvas = document.getElementById('workItemsChart') as HTMLCanvasElement;
    console.log('Work items canvas element:', canvas);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (this.workItemsChart) {
          this.workItemsChart.destroy();
          console.log('Previous work items chart destroyed');
        }
        this.workItemsChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Done', 'In Progress', 'To Do'],
            datasets: [{
              data: [this.chartData.done, this.chartData.inProgress, this.chartData.toDo],
              backgroundColor: ['#4285F4', '#7CB342', '#BA68C8'],
              borderWidth: 0
            }]
          },
          options: {
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                callbacks: {
                  title: function(context) { return context[0].label; },
                  label: function(context) {
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${percentage}% (${value} tasks)`;
                  }
                }
              }
            },
            animation: {
              animateRotate: true,
              duration: 2000
            }
          },
          plugins: [{
            id: 'centerText',
            beforeDraw(chart) {
              const { ctx, chartArea: { width, height } } = chart;
              const total = chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              ctx.save();
              ctx.font = 'bold 16px Arial';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${total} Tasks`, chart.width / 2, chart.height / 2);

              ctx.restore();
            }
          }]
        });
        console.log('Work items chart created with data:', this.chartData);
      } else {
        console.error('Failed to get 2D context for work items chart');
      }
    } else {
      console.error('Work items canvas element not found. Check if DOM is ready or *ngIf conditions.');
    }
  }



updateAssigneeChart(): void {
  const canvas = document.getElementById('priorityChart') as HTMLCanvasElement;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (this.assigneeChart) {
        this.assigneeChart.destroy();
      }

      const labels = Object.keys(this.assigneeData).map(
        assignee => this.getEmployeeName(assignee) || assignee
      );
      const data = Object.values(this.assigneeData).map(d => d.count);
      const colors = Object.values(this.assigneeData).map(d => d.color);

      this.assigneeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Tasks',
            data,
            backgroundColor: colors,
            borderRadius: 8,  // ✅ Sleek rounded bars
            barThickness: 25,
            borderSkipped: false // ✅ Full rounded look
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: false, 
              grid: {
                
                drawTicks: false,
                display: false
              }
            },
            y: {
              grid: {
              
                drawTicks: false,
                display: false
              },
              ticks: {
                font: {
                     // ✅ modern clean font
                  size: 19,
                  
                   weight: "normal"
                 
                },
                 color: '#222', // softer than pure black
        padding: 20 // ✅ clean spacing instead of "gap"
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                 titleColor: '#111',
    bodyColor: '#333',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8, 
  
    displayColors: false, 
              callbacks: {
                title: function(context) { return context[0].label; },
                label: function(context) {
                  const value = context.parsed.x;
                  const dataset = context.dataset.data as number[];
                  const total = dataset.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return ` ${percentage}%  |  ${value} tasks`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            // easing: 'easeOutCubic'
          },
          layout: {
            padding: { left: 10, right: 20, top: 10, bottom: 10 }
          }
        },
        plugins: [{
          id: 'noData',
          beforeDraw(chart) {
            const { ctx, chartArea: { width, height }, data } = chart;
            if (data.datasets[0].data.length === 0) {
              ctx.save();
              ctx.font = 'bold 16px Arial';
              ctx.fillStyle = '#666';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('No Data', width / 2, height / 2);
              ctx.restore();
            }
          }
        }]
      });
    }
  }
}



  
}