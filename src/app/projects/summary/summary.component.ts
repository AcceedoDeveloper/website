import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { AssignWorkService, AssignWork, UserViewResponse } from '../../service/assignwork.service';
import { Subscription } from 'rxjs';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

// Extend AssignWork to include updatedAt
export interface AssignWorkExtended extends AssignWork {
  updatedAt?: string;
}

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading: boolean = false;
  errorMessage: string = '';
  showmaindocument = false;
  showdocumentpop = false;
  showinsummary = false;
  showMonthView = false;
  showmaintask = true;
  viewMode: 'today' | 'all' | 'month' = 'today'; // Default to today's tasks

  employees: any[] = [];
  assignments: AssignWorkExtended[] = [];
  filteredAssignments: AssignWorkExtended[] = [];
  selectedAssignee: string = '';
  selectedAssignedTo: string = '';
  selectedDate: string = ''; // Used for date or month filtering

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

  recentActivities: AssignWorkExtended[] = [];
  private chart: Chart | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private assignWorkService: AssignWorkService) {}

  ngOnInit(): void {
    console.log('SummaryComponent initialized');
    this.showinsummary = true;
    this.loadEmployees();
    this.loadAssignments();
  }

  ngAfterViewInit(): void {
    // Delay chart update to ensure DOM is ready
    setTimeout(() => {
      console.log('Attempting to update chart in ngAfterViewInit');
      this.updateChart();
    }, 0);
  }

  ngOnDestroy(): void {
    console.log('Destroying SummaryComponent');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chart) {
      this.chart.destroy();
      console.log('Chart destroyed');
    }
  }

  // Load employees from the service
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

  // Load all assignments and filter to today's tasks by default
  loadAssignments(): void {
    this.isLoading = true;
    console.log('Starting to load assignments...');
    this.subscriptions.push(
      this.assignWorkService.getAssignments().subscribe({
        next: (response: UserViewResponse) => {
          console.log('Assignments response:', response);
          this.assignments = response.works || [];
          // Filter to today's tasks by default
          const today = new Date().toDateString();
          this.filteredAssignments = this.assignments.filter(
            assignment => new Date(assignment.createdAt).toDateString() === today
          );
          if (!this.employees.length) {
            this.extractEmployeesFromAssignments();
          }
          this.updateSummary();
          this.updateRecentActivities();
          this.updateChartData();
          this.updateChart();
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

  // Extract unique employee IDs from assignments as a fallback
  extractEmployeesFromAssignments(): void {
    const uniqueIds = new Set<string>();
    this.assignments.forEach(assignment => {
      if (assignment.assignee) uniqueIds.add(assignment.assignee);
      if (assignment.assignedTo) uniqueIds.add(assignment.assignedTo);
    });
    this.employees = Array.from(uniqueIds).map(id => ({ _id: id, name: id }));
    console.log('Fallback employees extracted:', this.employees);
  }

  // Get employee name by ID, falling back to ID if name is unavailable
  getEmployeeName(id: string): string | undefined {
    const employee = this.employees.find(emp => emp._id === id);
    const name = employee ? (employee.name || employee.username || employee._id) : id;
    console.log(`Getting employee name for id ${id}: ${name}`);
    return name;
  }

  // Apply filters based on view mode, assignee, assignedTo, and date/month
  applyFilters(): void {
    console.log('Applying filters:', {
      viewMode: this.viewMode,
      assignee: this.selectedAssignee,
      assignedTo: this.selectedAssignedTo,
      date: this.selectedDate
    });

    this.filteredAssignments = this.assignments.filter(assignment => {
      const matchesAssignee = !this.selectedAssignee || assignment.assignee === this.selectedAssignee;
      const matchesAssignedTo = !this.selectedAssignedTo || assignment.assignedTo === this.selectedAssignedTo;
      let matchesDate = true;

      if (this.viewMode === 'today') {
        const today = new Date().toDateString();
        matchesDate = new Date(assignment.createdAt).toDateString() === today;
      } else if (this.viewMode === 'month' && this.selectedDate) {
        const selected = new Date(this.selectedDate);
        const assignmentDate = new Date(assignment.createdAt);
        matchesDate = assignmentDate.getFullYear() === selected.getFullYear() &&
                      assignmentDate.getMonth() === selected.getMonth();
      } else if (this.viewMode === 'all' && this.selectedDate) {
        matchesDate = new Date(assignment.createdAt).toDateString() === new Date(this.selectedDate).toDateString();
      }

      console.log(`Assignment ${assignment._id} matches: assignee=${matchesAssignee}, assignedTo=${matchesAssignedTo}, date=${matchesDate}`);
      return matchesAssignee && matchesAssignedTo && matchesDate;
    });

    console.log('Filtered assignments:', this.filteredAssignments);
    this.updateSummary();
    this.updateRecentActivities();
    this.updateChartData();
    this.updateChart();
  }

  // Clear filters and reset to today's tasks
  clearFilters(): void {
    console.log('Clearing filters');
    this.viewMode = 'today';
    this.selectedAssignee = '';
    this.selectedAssignedTo = '';
    this.selectedDate = '';
    const today = new Date().toDateString();
    this.filteredAssignments = this.assignments.filter(
      assignment => new Date(assignment.createdAt).toDateString() === today
    );
    this.updateSummary();
    this.updateRecentActivities();
    this.updateChartData();
    this.updateChart();
  }

  // Update summary metrics (completed, updated, created, due soon)
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

  // Update recent activities (sorted by createdAt, limited to 5)
  updateRecentActivities(): void {
    this.recentActivities = [...this.filteredAssignments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    console.log('Recent activities:', this.recentActivities);
  }

  // Update chart data based on assignment statuses
  updateChartData(): void {
    this.chartData = {
      done: this.filteredAssignments.filter(a => a.Status === 'Done').length,
      inProgress: this.filteredAssignments.filter(a => a.Status === 'InProgress').length,
      toDo: this.filteredAssignments.filter(a => a.Status === 'ToDo').length
    };

    console.log('Chart data:', this.chartData);
  }

  // Update the doughnut chart for status overview
  updateChart(): void {
    const canvas = document.getElementById('workItemsChart') as HTMLCanvasElement;
    console.log('Canvas element:', canvas);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (this.chart) {
          this.chart.destroy();
          console.log('Previous chart destroyed');
        }
        this.chart = new Chart(ctx, {
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
              tooltip: { enabled: true }
            }
          }
        });
        console.log('New chart created');
      } else {
        console.error('Failed to get 2D context for chart');
      }
    } else {
      console.warn('Canvas element not found for chart. Check if DOM is ready or *ngIf conditions.');
    }
  }
}