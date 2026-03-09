import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { UserservicesService } from '../../register/services/userservices.service';
import { AssignWorkService } from '../../service/assignwork.service';
import { Chart, registerables } from 'chart.js';
import { Location } from '@angular/common';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';

Chart.register(...registerables);

interface UserViewResponse {
  works?: any[];
  data?: any[];
  assignments?: any[];
  // Feel free to add more possible shapes if needed
}

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css']
})
export class CompareComponent implements OnInit, OnChanges, AfterViewChecked {

  // inputs from parent (optional)
  @Input() selectedProjectId: string = '';
  @Input() selectedProjectName: string = '';
  @Input() projects: any[] = [];
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;



  // local copy used by the form - starts with parent's values
  projectSelectionId: string = '';
  projectSelectionName: string = '';

  // Filters
  dateFilter: 'today' | 'all' | 'month' | 'custom' = 'all';
  selectedDate: string = '';     // yyyy-mm-dd
  selectedMonth: string = '';    // yyyy-mm

  selectedUsers: string[] = [];
  showDropdown = false;
  isAllSelected = false;
  dropdownInteraction = false;

  // Data
  users: any[] = [];             // { userName: string }[]
  compareData: any[] = [];

  // Chart type
chartType: 'bar' | 'line' | 'pie' = 'bar';   // ← changed
  showChartDropdown = false;

  chart: Chart | null = null;
  @ViewChild('chart') chartRef!: ElementRef;

  loading = false;
  errorMessage: string | null = null;

  private needsRender = false;
  private renderLabels: string[] = [];
  private renderData: number[] = [];

  constructor(
    private userService: UserservicesService,
    private assignService: AssignWorkService,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('[DEBUG] CompareComponent ngOnInit called');
    // initialise local selection from incoming inputs
    this.projectSelectionId = this.selectedProjectId;
    this.projectSelectionName = this.selectedProjectName;

    console.log('CompareComponent ngOnInit → initial project:', {
      id: this.projectSelectionId,
      name: this.projectSelectionName
    });
    this.loadUsersForProject();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[DEBUG] CompareComponent ngOnChanges called with changes:', changes);
    if (changes['selectedProjectId'] || changes['selectedProjectName']) {
      // update local copy too
      this.projectSelectionId = this.selectedProjectId;
      this.projectSelectionName = this.selectedProjectName;

      console.log('Project changed from parent → reloading users', {
        newId: this.projectSelectionId,
        newName: this.projectSelectionName
      });

      this.loadUsersForProject();

      // Reset UI when project changes
      this.selectedUsers = [];
      this.compareData = [];
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsRender && this.chartRef) {
      console.log('[DEBUG] ngAfterViewChecked: rendering chart');
      this.renderChart(this.renderLabels, this.renderData);
      this.needsRender = false;
      this.renderLabels = [];
      this.renderData = [];
    }
  }

  focusInput() {
  this.userInput?.nativeElement.focus();
}

onBlur() {
  // Only close dropdown if not interacting with it
  setTimeout(() => {
    if (!this.showDropdown || this.dropdownInteraction) {
      this.dropdownInteraction = false;
      return;
    }
    this.showDropdown = false;
  }, 100);
}

onDropdownMouseDown() {
  // Prevent blur from closing dropdown
  this.dropdownInteraction = true;
  this.userInput?.nativeElement.focus();
}

toggleUser(username: string, checked: boolean) {
  if (checked) {
    if (!this.selectedUsers.includes(username)) {
      this.selectedUsers = [...this.selectedUsers, username];
    }
  } else {
    this.selectedUsers = this.selectedUsers.filter(u => u !== username);
  }
  // Update isAllSelected flag
  this.updateAllSelectedFlag();
}

private updateAllSelectedFlag() {
  this.isAllSelected = this.users.length > 0 && this.selectedUsers.length === this.users.length;
}

  // ────────────────────────────────────────────────
  // Load users (project-specific or all if no project selected)
  // ────────────────────────────────────────────────

loadUsersForProject() {
  console.log('[DEBUG] loadUsersForProject called');
  // use whichever ID/name is currently selected (local takes precedence)
  const projectId = this.projectSelectionId || this.selectedProjectId;
  const projectName = this.projectSelectionName || this.selectedProjectName;
  this.loading = true;
  this.errorMessage = null;
  this.users = []; // reset first

  this.assignService.getAssignments().subscribe({
    next: (response: any) => {
      console.log('[DEBUG] getAssignments response received:', response);
   

      // ── Extract tasks array ────────────────────────────────────────
      let allTasks: any[] = [];

      if (Array.isArray(response)) {
        allTasks = response;
      } else if (response && typeof response === 'object') {
        allTasks =
          response.works ||
          response.data ||
          response.assignments ||
          response.results ||
          response.tasks ||
          response.payload ||
          [];
      }

      console.log('[DEBUG] Extracted allTasks:', allTasks.length, 'tasks');
    
      if (allTasks.length > 0) {
        console.log('First task example:', allTasks[0]);
      }

      // ── Apply project filter only if project is selected ──────────
      let filteredTasks = allTasks;

      if (this.selectedProjectId || this.selectedProjectName) {
        console.log('[DEBUG] Applying project filter for:', { projectId, projectName });

        filteredTasks = allTasks.filter((task: any) => {
          // Try many possible field names & formats
          const taskProjectId = 
            task.projectId ||
            task.project?._id ||
            task.projectId?._id ||
            task.project?.id ||
            null;

          const taskProjectName = 
            task.projectName ||
            task.project?.projectName ||
            task.project?.name ||
            null;

          const idMatch = projectId && 
            (String(taskProjectId) === String(projectId) ||
             String(taskProjectId) === projectId);

          const nameMatch = projectName && 
            (taskProjectName === projectName ||
             taskProjectName?.toLowerCase() === projectName.toLowerCase());

          return idMatch || nameMatch;
        });

        console.log(`Tasks after project filter: ${filteredTasks.length}`);
        if (filteredTasks.length > 0) {
          console.log('First filtered task:', filteredTasks[0]);
        }
      } else {
        // console.log('No specific project selected → using ALL tasks');
      }

      // ── Extract unique assignees ──────────────────────────────────
      const assigneeSet = new Set<string>();

      filteredTasks.forEach((task: any) => {
        const assignee = 
          task.assignee ||
          task.assignedTo ||
          task.user ||
          task.employee ||
          null;

        if (assignee && typeof assignee === 'string' && assignee.trim()) {
          assigneeSet.add(assignee.trim());
        }
      });

      const uniqueAssignees = Array.from(assigneeSet);
    //   console.log('Unique assignees found:', uniqueAssignees);

      // Set users for dropdown
      this.users = uniqueAssignees.map(name => ({ userName: name }));

      // Auto-select all users when project is loaded
      this.selectedUsers = [...uniqueAssignees];
      this.isAllSelected = this.users.length > 0;

      this.loading = false;

      console.log('[DEBUG] loadUsersForProject completed. Users:', this.users.length, 'Selected:', this.selectedUsers.length);

      if (this.users.length === 0) {
        this.errorMessage = this.selectedProjectName
          ? `No users found in project: ${this.selectedProjectName}`
          : 'No users found with any tasks';
      }
    },
    error: (err) => {
      console.error('[DEBUG] getAssignments failed:', err);
      this.loading = false;
      this.errorMessage = 'Failed to load tasks / users';
    }
  });
}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    console.log('Dropdown toggled:', this.showDropdown, 'Users available:', this.users.length);
  }

  /** return initials for display chips */
  user: string[] = [
  'Anbu',
  'Sanjay Kumar',
  'Ravi',
  'Vijay',
  'Karthik',
  'Arun',
  'Bala',
  'Suresh'
];

getInitials(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(' ').filter(Boolean);

  // Multiple words: take first letter of each word
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  // Single word: just first letter
  return parts[0][0].toUpperCase();
}

  /** remove user from selection */
  removeUser(user: string) {
    this.selectedUsers = this.selectedUsers.filter(u => u !== user);
    this.updateAllSelectedFlag();
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedUsers = [];
      this.isAllSelected = false;
    } else {
      this.selectedUsers = [...this.users.map(u => u.userName)];
      this.isAllSelected = true;
    }
  }

  clearSelections() {
    this.selectedUsers = [];
    this.isAllSelected = false;
  }

  onUserChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;

    if (checked) {
      if (!this.selectedUsers.includes(value)) this.selectedUsers.push(value);
    } else {
      this.selectedUsers = this.selectedUsers.filter(x => x !== value);
    }

    this.isAllSelected = this.selectedUsers.length === this.users.length;
  }

  doneSelection() {
    this.showDropdown = false;
  }

  toggleChartDropdown() {
    this.showChartDropdown = !this.showChartDropdown;
  }

  setChartType(type: 'bar' | 'line' | 'pie') {
    this.chartType = type;
    this.showChartDropdown = false;
    // Re-render chart with new type if data exists
    if (this.compareData.length > 0) {
      const labels = this.compareData.map(user => user.name);
      const data = this.compareData.map(user => user.percent);
      this.renderChart(labels, data);
    }
  }

 getChartTypeLabel(): string {
  const map: Record<string, string> = {
    bar:  'Bar Chart',
    line: 'Line Chart',
    pie:  'Pie Chart'
  };
  return map[this.chartType] || 'Bar Chart';
}

  get isCompareEnabled(): boolean {
    return this.selectedUsers.length > 0;
  }

  applyFilters() {
    this.compareData = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Called when the project selector in the compare card changes.
   * Updates the name, clears previous selection and reloads users/tasks.
   */
  onProjectSelectLocal() {
    // look up the name if we have an id
    if (this.projectSelectionId) {
      const sel = this.projects.find(p =>
        String(p._id) === String(this.projectSelectionId) ||
        String(p.id) === String(this.projectSelectionId)
      );
      this.projectSelectionName = sel ? (sel.projectName || sel.name || '') : '';
    } else {
      this.projectSelectionName = '';
    }

    // clear existing state
    this.selectedUsers = [];
    this.compareData = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.loadUsersForProject();
  }

  compare() {
    console.log('[DEBUG] compare() called. Selected users:', this.selectedUsers);
    if (!this.isCompareEnabled) {
      console.log('[DEBUG] Compare not enabled, returning');
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.compareData = [];

    const labels: string[] = [];
    const completedPercent: number[] = [];

    this.assignService.getAssignments().subscribe({
      next: (response: UserViewResponse) => {
        console.log('[DEBUG] compare() getAssignments response:', response);
        let tasks = response.works || response.data || response.assignments || [];

        console.log('All tasks loaded:', tasks.length, 'tasks');
        if (tasks.length > 0) {
          console.log('Sample task:', tasks[0]);
        }

        // Project filter - use robust matching like loadUsersForProject does
        const projectId = this.projectSelectionId || this.selectedProjectId;
        const projectName = this.projectSelectionName || this.selectedProjectName;

        if (projectId || projectName) {
          tasks = tasks.filter((task: any) => {
            // Try many possible field names & formats for project ID
            const taskProjectId = 
              task.projectId ||
              task.project?._id ||
              task.projectId?._id ||
              task.project?.id ||
              null;

            // Try many possible field names for project name
            const taskProjectName = 
              task.projectName ||
              task.project?.projectName ||
              task.project?.name ||
              null;

            const idMatch = projectId && 
              (String(taskProjectId) === String(projectId) ||
               String(taskProjectId) === projectId);

            const nameMatch = projectName && 
              (taskProjectName === projectName ||
               taskProjectName?.toLowerCase() === projectName.toLowerCase());

            return idMatch || nameMatch;
          });

          console.log(`Tasks after project filter (${projectId || projectName}): ${tasks.length}`);
        }

        // Date filter
        if (this.dateFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          tasks = tasks.filter((t: any) => t.dueDate?.startsWith(today));
        }
        else if (this.dateFilter === 'month' && this.selectedMonth) {
          tasks = tasks.filter((t: any) => t.dueDate?.startsWith(this.selectedMonth));
        }
        else if (this.dateFilter === 'custom' && this.selectedDate) {
          tasks = tasks.filter((t: any) => t.dueDate?.startsWith(this.selectedDate));
        }

        // Stats by user
        const userStats = new Map<string, { total: number; completed: number }>();

        tasks.forEach((task: any) => {
          const assignee = task.assignee?.trim();
          if (!assignee) return;

          if (!userStats.has(assignee)) {
            userStats.set(assignee, { total: 0, completed: 0 });
          }

          const stats = userStats.get(assignee)!;
          stats.total++;

          // Check if task is completed - handle multiple status formats
          const status = (task.Status || '').toLowerCase().trim();
          if (status === 'done' || 
              status === 'completed' || 
              status.includes('done') || 
              status.includes('complete')) {
            stats.completed++;
            console.log(`✓ Task marked complete: "${task.title}" | Status: "${task.Status}" | Assignee: ${assignee}`);
          }
        });

        // Build result for selected users
        this.selectedUsers.forEach(user => {
          const stats = userStats.get(user) || { total: 0, completed: 0 };
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          console.log(`User: ${user}, Total: ${stats.total}, Completed: ${stats.completed}, Percent: ${percent}%`);

          this.compareData.push({
            name: user,
            total: stats.total,
            completed: stats.completed,
            pending: stats.total - stats.completed,
            percent
          });

          labels.push(user);
          completedPercent.push(percent);
        });

        console.log('[DEBUG] compareData built:', this.compareData);
        this.renderLabels = labels;
        this.renderData = completedPercent;
        this.needsRender = true;
        this.cdr.detectChanges();
        this.loading = false;

        if (this.compareData.length === 0) {
          this.errorMessage = 'No matching tasks found for selected users/filters.';
        }
      },
      error: (err) => {
        console.error('[DEBUG] Compare failed:', err);
        this.errorMessage = 'Failed to load comparison data.';
        this.loading = false;
      }
    });
  }

private renderChart(labels: string[], data: number[]) {
  console.log('[DEBUG] renderChart called with chartType:', this.chartType, 'labels:', labels, 'data:', data);

  if (!this.chartRef) {
    console.log('[DEBUG] chartRef not available, skipping render');
    return;
  }

  const chartDom = this.chartRef.nativeElement;
  console.log('[DEBUG] chartDom:', chartDom);

  // Destroy previous chart instance if it exists
  try {
    const existingChart = echarts.getInstanceByDom(chartDom);
    if (existingChart) {
      console.log('[DEBUG] Destroying existing chart');
      existingChart.dispose();
    }
  } catch (e) {
    console.log('[DEBUG] No existing chart to destroy');
  }

  const myChart = echarts.init(chartDom);
  console.log('[DEBUG] New chart initialized');

  let option: any;

  if (this.chartType === 'bar') {
    console.log('[DEBUG] Rendering bar chart');
    option = this.getBarChartOption(labels, data);
  } else if (this.chartType === 'line') {
    console.log('[DEBUG] Rendering line chart');
    option = this.getLineChartOption(labels, data);
  } else if (this.chartType === 'pie') {
    console.log('[DEBUG] Rendering pie chart');
    option = this.getPieChartOption(labels, data);
  } else {
    console.log('[DEBUG] Defaulting to bar chart');
    option = this.getBarChartOption(labels, data);
  }

  myChart.setOption(option as any);
  console.log('[DEBUG] Chart option set');

  // Resize to ensure it's visible
  setTimeout(() => myChart.resize(), 100);
}

private getCustomChartOption(labels: string[], data: number[]) {
  const option = {
    backgroundColor: '#ffffff',

    title: {
      text: 'Task Completion Comparison',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 20,
        fontWeight: '700',
       
      }
    },

    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        margin: 18
      }
    },

    yAxis: {
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 12,
        color: '#6c757d'
      },
      splitLine: {
        lineStyle: { color: '#eef1f5' }
      }
    },

    grid: {
      left: '6%',
      right: '6%',
      bottom: '18%',
      top: '20%'
    },

    series: [
      {
        type: 'custom',

        renderItem: (params: any, api: any) => {

          const value = api.value(1);
          const x = api.coord([api.value(0), 0])[0];
          const baseY = api.coord([api.value(0), 0])[1];

          const radius = 44;

          /* RULE */
          const discUnit = 2.5;   // 1 disc = 2.5%
          let discCount = Math.round(value / discUnit);
          const isCompleted = value >= 50;

          const topColor = isCompleted ? '#b6f5b1' : '#ffd6d6';
          const midColor = isCompleted ? '#6bcf63' : '#ff8a8a';

          const children: any[] = [];

          // calculate dynamic vertical spacing so bars scale to axis
          const topY = api.coord([api.value(0), value])[1];
          const totalHeight = baseY - topY; // pixel height for this value
          // avoid division by zero
          const discGap = discCount > 1 ? totalHeight / (discCount - 1) : 0;

          // bottom ground shadow has been removed per request


          /* ========================= */
          /* 0% = PROFESSIONAL EMPTY DISC */
          /* ========================= */
          if (value === 0) {

            // base disc
            children.push({
              type: 'ellipse',
              shape: {
                cx: x,
                cy: baseY,
                rx: radius,
                ry: 12
              },
              style: {
                fill: {
                  type: 'linear',
                  x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: '#dcdcdc' },
                    { offset: 0.5, color: '#f5f5f5' },
                    { offset: 1, color: '#cfcfcf' }
                  ]
                },
                shadowBlur: 22,
                shadowColor: 'rgba(0,0,0,0.25)'
              }
            });

            // soft top shine
            children.push({
              type: 'ellipse',
              shape: {
                cx: x,
                cy: baseY - 2,
                rx: radius - 6,
                ry: 8
              },
              style: {
                fill: 'rgba(255,255,255,0.6)'
              }
            });

            // 0% badge
            children.push({
              type: 'rect',
              shape: {
                x: x - 42,
                y: baseY - 70,
                width: 84,
                height: 38,
                r: 12
              },
              style: {
                fill: '#95a5a6',
                shadowBlur: 12,
                shadowColor: 'rgba(0,0,0,0.3)'
              }
            });

            children.push({
              type: 'text',
              style: {
                text: '0%',
                x: x,
                y: baseY - 51,
                textAlign: 'center',
                textVerticalAlign: 'middle',
                font: '700 16px sans-serif',
                fill: '#ffffff'
              }
            });

            return {
              type: 'group',
              children
            };
          }

          /* ========================= */
          /* NORMAL STACKED DISCS */
          /* ========================= */

          for (let i = 0; i < discCount; i++) {
            const yOffset = baseY - (i * discGap);

            children.push({
              type: 'ellipse',
              shape: {
                cx: x,
                cy: yOffset,
                rx: radius,
                ry: 12
              },
              style: {
                fill: i === discCount - 1 ? topColor : midColor,
                shadowBlur: 18,
                shadowColor: 'rgba(0,0,0,0.35)'
              }
            });
          }

          const topDiscY = baseY - ((discCount - 1) * discGap);

          /* Value badge */
          children.push({
            type: 'rect',
            shape: {
              x: x - 42,
              y: topDiscY - 55,
              width: 84,
              height: 38,
              r: 12
            },
            style: {
              fill: isCompleted ? '#6bcf63' : '#e74c3c',
              shadowBlur: 14,
              shadowColor: 'rgba(0,0,0,0.35)'
            }
          });

          children.push({
            type: 'text',
            style: {
              text: value + '%',
              x: x,
              y: topDiscY - 36,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              font: '700 16px sans-serif',
              fill: '#ffffff'
            }
          });

          return {
            type: 'group',
            children
          };
        },

        data: data.map((v, i) => [i, v])
      }
    ],

    animationDuration: 1500,
    animationEasing: 'cubicOut'
  };

  return option;
}

private getBarChartOption(labels: string[], data: number[]) {
  return {
    backgroundColor: '#ffffff',
    title: {
      text: 'Task Completion Comparison - Bar Chart',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50'
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        fontSize: 12,
        color: '#2c3e50'
      }
    },
    yAxis: {
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 12,
        color: '#6c757d'
      },
      splitLine: {
        lineStyle: { color: '#eef1f5' }
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    series: [
      {
        data: data,
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: '#6bcf63' },
            { offset: 1, color: '#b6f5b1' }
          ])
        },
        radius: [8, 8, 0, 0]
      }
    ],
    animationDuration: 1500,
animationEasing: 'cubicOut'
  };
}

private getLineChartOption(labels: string[], data: number[]) {
  return {
    backgroundColor: '#ffffff',
    title: {
      text: 'Task Completion Comparison - Line Chart',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50'
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        fontSize: 12,
        color: '#2c3e50'
      }
    },
    yAxis: {
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 12,
        color: '#6c757d'
      },
      splitLine: {
        lineStyle: { color: '#eef1f5' }
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    series: [
      {
        data: data,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#6bcf63'
        },
        lineStyle: {
          color: '#6bcf63',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: 'rgba(107, 207, 99, 0.1)' },
            { offset: 1, color: 'rgba(107, 207, 99, 0.5)' }
          ])
        }
      }
    ],
   animationDuration: 1500,
animationEasing: 'cubicOut'
  };
}

private getPieChartOption(labels: string[], data: number[]) {
  const pieData = labels.map((label, index) => ({
    value: data[index],
    name: label + ' (' + data[index] + '%)'
  }));

  return {
    backgroundColor: '#ffffff',
    title: {
      text: 'Task Completion Comparison - Pie Chart',
      left: 'center',
      top: 40,
      textStyle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2c3e50'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        name: 'Completion',
        type: 'pie',
        radius: '50%',
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: '#6bcf63' },
            { offset: 1, color: '#b6f5b1' }
          ])
        }
      }
    ],
    animationDuration: 1500,
animationEasing: 'cubicOut'
  };
}
  goBack() {
    this.location.back();
  }
}