/**
 * TaskFlow Pro - Main Application Logic & UI Controllers
 */

// Application State
const state = {
  currentView: 'dashboard',
  selectedCategory: 'All',
  tasks: [],
  totalTasks: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 8,
  viewMode: 'grid', // 'grid' | 'list'
  stats: null,
  activeFilter: {
    search: '',
    status: 'All',
    priority: 'All',
    category: 'All',
    dueDateFilter: 'All',
    sort: 'createdAt_desc',
  },
  calendarDate: new Date(),
  editingTaskId: null,
  deletingTaskId: null,
  charts: {
    velocity: null,
    status: null,
    category: null,
    priority: null,
  },
};

// ==========================================
// Initialization & Lifecycle
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initEventListeners();
  initAuthUI();
  handleHashChange();
  loadDashboardData();
});

// ==========================================
// Theme Management (Dark / Light Mode)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('taskflow_theme', nextTheme);
      updateChartThemes();
      showToast(`Switched to ${nextTheme} theme`, 'info');
    });
  }
}

// ==========================================
// Navigation & Views Router
// ==========================================
function initNavigation() {
  // Hash Routing
  window.addEventListener('hashchange', handleHashChange);

  // Sidebar Nav Links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      const view = link.getAttribute('data-view');
      if (view) {
        switchView(view);
      }
      closeMobileSidebar();
    });
  });

  // Mobile Menu Toggle
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('sidebar');

  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Sidebar Category Filter Pills
  document.querySelectorAll('.category-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      state.selectedCategory = cat;
      state.activeFilter.category = cat;

      const filterCatSelect = document.getElementById('filterCategory');
      if (filterCatSelect) filterCatSelect.value = cat;

      // Switch to tasks view if on dashboard or update current view
      if (state.currentView !== 'tasks' && state.currentView !== 'kanban') {
        window.location.hash = 'tasks';
      } else {
        refreshCurrentView();
      }
    });
  });
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  switchView(hash);
}

function switchView(viewName) {
  const validViews = ['dashboard', 'tasks', 'kanban', 'calendar', 'analytics'];
  const targetView = validViews.includes(viewName) ? viewName : 'dashboard';
  state.currentView = targetView;

  // Update Nav Link Active States
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('data-view') === targetView) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update Sections
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.remove('active');
  });

  const activeSection = document.getElementById(`view${capitalize(targetView)}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Update Page Header Titles
  const pageTitles = {
    dashboard: { title: 'Dashboard Overview', sub: 'Track, organize and achieve your daily productivity targets' },
    tasks: { title: 'Task Repository', sub: 'Comprehensive searchable, filterable task backlog with full CRUD' },
    kanban: { title: 'Kanban Workflow', sub: 'Drag and drop task cards between stages to sync in real-time' },
    calendar: { title: 'Schedule & Calendar', sub: 'Visualize tasks, milestones, and deadlines across the month' },
    analytics: { title: 'Productivity Analytics', sub: 'Deep-dive into completion velocities, category mix and performance' },
  };

  const titleObj = pageTitles[targetView] || pageTitles.dashboard;
  document.getElementById('pageTitle').textContent = titleObj.title;
  document.getElementById('pageSubtitle').textContent = titleObj.sub;

  refreshCurrentView();
}

function refreshCurrentView() {
  if (state.currentView === 'dashboard') {
    loadDashboardData();
  } else if (state.currentView === 'tasks') {
    loadTasksData();
  } else if (state.currentView === 'kanban') {
    loadKanbanData();
  } else if (state.currentView === 'calendar') {
    renderCalendar();
  } else if (state.currentView === 'analytics') {
    loadAnalyticsData();
  }
}

// ==========================================
// Event Listeners for Controls & Modals
// ==========================================
function initEventListeners() {
  // Global search input keybinding ('/')
  const globalSearchInput = document.getElementById('globalSearchInput');
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== globalSearchInput && !document.querySelector('.modal-backdrop.active')) {
      e.preventDefault();
      globalSearchInput?.focus();
    }
  });

  globalSearchInput?.addEventListener('input', debounce((e) => {
    state.activeFilter.search = e.target.value;
    const taskSearch = document.getElementById('taskSearchInput');
    if (taskSearch) taskSearch.value = e.target.value;
    if (state.currentView !== 'tasks') {
      window.location.hash = 'tasks';
    } else {
      loadTasksData();
    }
  }, 350));

  // Task Filters in All Tasks View
  const taskSearchInput = document.getElementById('taskSearchInput');
  const filterStatus = document.getElementById('filterStatus');
  const filterPriority = document.getElementById('filterPriority');
  const filterCategory = document.getElementById('filterCategory');
  const filterDueDate = document.getElementById('filterDueDate');
  const sortTasks = document.getElementById('sortTasks');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  taskSearchInput?.addEventListener('input', debounce((e) => {
    state.activeFilter.search = e.target.value;
    state.currentPage = 1;
    loadTasksData();
  }, 300));

  filterStatus?.addEventListener('change', (e) => {
    state.activeFilter.status = e.target.value;
    state.currentPage = 1;
    loadTasksData();
  });

  filterPriority?.addEventListener('change', (e) => {
    state.activeFilter.priority = e.target.value;
    state.currentPage = 1;
    loadTasksData();
  });

  filterCategory?.addEventListener('change', (e) => {
    state.activeFilter.category = e.target.value;
    state.currentPage = 1;
    loadTasksData();
  });

  filterDueDate?.addEventListener('change', (e) => {
    state.activeFilter.dueDateFilter = e.target.value;
    state.currentPage = 1;
    loadTasksData();
  });

  sortTasks?.addEventListener('change', (e) => {
    state.activeFilter.sort = e.target.value;
    loadTasksData();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    state.activeFilter = {
      search: '',
      status: 'All',
      priority: 'All',
      category: 'All',
      dueDateFilter: 'All',
      sort: 'createdAt_desc',
    };
    if (taskSearchInput) taskSearchInput.value = '';
    if (globalSearchInput) globalSearchInput.value = '';
    if (filterStatus) filterStatus.value = 'All';
    if (filterPriority) filterPriority.value = 'All';
    if (filterCategory) filterCategory.value = 'All';
    if (filterDueDate) filterDueDate.value = 'All';
    if (sortTasks) sortTasks.value = 'createdAt_desc';
    state.currentPage = 1;
    loadTasksData();
    showToast('Filters cleared', 'info');
  });

  // View Mode Toggles (Grid / List)
  const modeGridBtn = document.getElementById('modeGridBtn');
  const modeListBtn = document.getElementById('modeListBtn');
  const tasksGridContainer = document.getElementById('tasksGridContainer');

  modeGridBtn?.addEventListener('click', () => {
    modeGridBtn.classList.add('active');
    modeListBtn?.classList.remove('active');
    tasksGridContainer?.classList.remove('list-mode');
    state.viewMode = 'grid';
  });

  modeListBtn?.addEventListener('click', () => {
    modeListBtn.classList.add('active');
    modeGridBtn?.classList.remove('active');
    tasksGridContainer?.classList.add('list-mode');
    state.viewMode = 'list';
  });

  // Pagination Buttons
  document.getElementById('prevPageBtn')?.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      loadTasksData();
    }
  });

  document.getElementById('nextPageBtn')?.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      state.currentPage++;
      loadTasksData();
    }
  });

  // Task Creation & Edit Modal Trigger Buttons
  document.getElementById('openCreateTaskBtn')?.addEventListener('click', () => openTaskModal());
  document.getElementById('quickAddRecentBtn')?.addEventListener('click', () => openTaskModal());
  document.getElementById('kanbanAddTaskBtn')?.addEventListener('click', () => openTaskModal());

  document.querySelectorAll('.quick-col-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-status');
      openTaskModal(null, { status });
    });
  });

  // Task Modal Form Submit
  const taskForm = document.getElementById('taskForm');
  taskForm?.addEventListener('submit', handleTaskFormSubmit);

  // Modal Close Buttons
  document.getElementById('closeTaskModalBtn')?.addEventListener('click', closeTaskModal);
  document.getElementById('cancelTaskModalBtn')?.addEventListener('click', closeTaskModal);
  document.getElementById('closeDetailsModalBtn')?.addEventListener('click', closeDetailsModal);
  document.getElementById('closeDetailsBtn')?.addEventListener('click', closeDetailsModal);
  document.getElementById('closeDeleteModalBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleConfirmDelete);
  document.getElementById('editFromDetailsBtn')?.addEventListener('click', () => {
    closeDetailsModal();
    if (state.previewingTask) {
      openTaskModal(state.previewingTask);
    }
  });

  // Calendar Controls
  document.getElementById('calPrevMonthBtn')?.addEventListener('click', () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('calNextMonthBtn')?.addEventListener('click', () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('calTodayBtn')?.addEventListener('click', () => {
    state.calendarDate = new Date();
    renderCalendar();
  });

  // Auth Modal
  document.getElementById('authBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);

  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabLoginBtn?.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn?.classList.remove('active');
    loginForm?.classList.add('active');
    registerForm?.classList.remove('active');
  });

  tabRegisterBtn?.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn?.classList.remove('active');
    registerForm?.classList.add('active');
    loginForm?.classList.remove('active');
  });

  loginForm?.addEventListener('submit', handleLoginSubmit);
  registerForm?.addEventListener('submit', handleRegisterSubmit);
}

// ==========================================
// 1. Dashboard View Logic
// ==========================================
async function loadDashboardData() {
  try {
    const res = await window.api.getStats();
    if (res.success && res.stats) {
      state.stats = res.stats;
      renderDashboardStats(res.stats);
      renderDashboardCharts(res.stats);
      renderDueTodayList(res.stats.upcomingTasks, res.stats.dueToday);
      renderRecentTasksList(res.stats.recentTasks);
    }
  } catch (error) {
    showToast('Failed to load dashboard metrics: ' + error.message, 'error');
  }
}

function renderDashboardStats(stats) {
  document.getElementById('statTotal').textContent = stats.total || 0;
  document.getElementById('statCompleted').textContent = stats.completed || 0;
  document.getElementById('statInProgress').textContent = stats.inProgress || 0;
  document.getElementById('statPending').textContent = stats.pending || 0;
  document.getElementById('statOverdue').textContent = stats.overdue || 0;

  const rate = stats.completionPercentage || 0;
  document.getElementById('statCompletionRateBadge').innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${rate}% Done`;

  // Sidebar Widget Update
  document.getElementById('sidebarProgressPercent').textContent = `${rate}%`;
  document.getElementById('sidebarProgressBar').style.width = `${rate}%`;
  document.getElementById('sidebarProgressText').textContent = `${stats.completed} of ${stats.total} tasks completed`;
  document.getElementById('sidebarTotalBadge').textContent = stats.total || 0;
}

function renderDueTodayList(upcomingTasks = [], dueTodayCount = 0) {
  const container = document.getElementById('dueTodayTaskList');
  if (!container) return;

  if (!upcomingTasks || upcomingTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem;">
        <i class="fa-regular fa-calendar-check empty-state-icon" style="font-size: 2rem;"></i>
        <h4>All clear!</h4>
        <p>No urgent deadlines or overdue tasks pending.</p>
      </div>`;
    return;
  }

  container.innerHTML = upcomingTasks.map((t) => {
    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed';
    const dueClass = isOverdue ? 'overdue' : '';
    const formattedDate = t.dueDate ? formatDate(t.dueDate) : 'No due date';

    return `
      <div class="dash-task-item" onclick="viewTaskDetails('${t._id}')">
        <div class="dash-task-left">
          <span class="badge badge-cat-${t.category.toLowerCase()}">${t.category}</span>
          <span class="dash-task-title">${escapeHtml(t.title)}</span>
        </div>
        <div class="dash-task-due ${dueClass}">
          <i class="fa-regular fa-clock"></i> ${formattedDate}
        </div>
      </div>`;
  }).join('');
}

function renderRecentTasksList(recentTasks = []) {
  const container = document.getElementById('recentTaskList');
  if (!container) return;

  if (!recentTasks || recentTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem;">
        <i class="fa-solid fa-list-check empty-state-icon" style="font-size: 2rem;"></i>
        <h4>No recent tasks</h4>
        <p>Start your day by creating your first task.</p>
      </div>`;
    return;
  }

  container.innerHTML = recentTasks.map((t) => {
    const statusClass = t.status.toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="dash-task-item" onclick="viewTaskDetails('${t._id}')">
        <div class="dash-task-left">
          <span class="badge badge-status-${statusClass}">${t.status}</span>
          <span class="dash-task-title">${escapeHtml(t.title)}</span>
        </div>
        <span class="badge badge-prio-${t.priority.toLowerCase()}">${t.priority}</span>
      </div>`;
  }).join('');
}

// Chart.js Visualizations
function renderDashboardCharts(stats) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // 1. Velocity Chart
  const velCanvas = document.getElementById('velocityChart');
  if (velCanvas) {
    if (state.charts.velocity) state.charts.velocity.destroy();

    // Prepare 7-day labels
    const days = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push(dayName);

      const match = (stats.completionTrend || []).find((item) => item._id === str);
      counts.push(match ? match.count : 0);
    }

    state.charts.velocity = new Chart(velCanvas, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Completed Tasks',
            data: counts,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  // 2. Status Breakdown Doughnut Chart
  const statusCanvas = document.getElementById('statusChart');
  if (statusCanvas) {
    if (state.charts.status) state.charts.status.destroy();

    const dataValues = [stats.pending || 0, stats.inProgress || 0, stats.completed || 0];

    state.charts.status = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: ['To Do', 'In Progress', 'Completed'],
        datasets: [
          {
            data: dataValues.every((v) => v === 0) ? [1, 1, 1] : dataValues,
            backgroundColor: ['#8b5cf6', '#f59e0b', '#10b981'],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor, padding: 15, font: { size: 12 } },
          },
        },
        cutout: '70%',
      },
    });
  }
}

function updateChartThemes() {
  if (state.stats) {
    renderDashboardCharts(state.stats);
    if (state.currentView === 'analytics') {
      renderAnalyticsCharts(state.stats);
    }
  }
}

// ==========================================
// 2. All Tasks View Logic (CRUD & Filters)
// ==========================================
async function loadTasksData() {
  const container = document.getElementById('tasksGridContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>`;

  try {
    const params = {
      search: state.activeFilter.search,
      status: state.activeFilter.status,
      priority: state.activeFilter.priority,
      category: state.activeFilter.category,
      dueDateFilter: state.activeFilter.dueDateFilter,
      sort: state.activeFilter.sort,
      page: state.currentPage,
      limit: state.limit,
    };

    const res = await window.api.getTasks(params);
    if (res.success) {
      state.tasks = res.data;
      state.totalTasks = res.total;
      state.totalPages = res.totalPages;
      state.currentPage = res.page;

      document.getElementById('currentTasksCount').textContent = res.data.length;
      document.getElementById('totalTasksCount').textContent = res.total;

      renderTasksCards(res.data);
      renderPagination(res.page, res.totalPages);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation empty-state-icon" style="color: #ef4444;"></i>
        <h4>Error loading tasks</h4>
        <p>${error.message}</p>
        <button class="btn btn-secondary" onclick="loadTasksData()">Retry</button>
      </div>`;
  }
}

function renderTasksCards(tasks = []) {
  const container = document.getElementById('tasksGridContainer');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass empty-state-icon"></i>
        <h4>No tasks found</h4>
        <p>Try clearing filters or search queries, or create a new task!</p>
        <button class="btn btn-primary" onclick="openTaskModal()">
          <i class="fa-solid fa-plus"></i> Create New Task
        </button>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map((task) => {
    const isCompleted = task.status === 'Completed';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
    const statusClass = task.status.toLowerCase().replace(/\s+/g, '-');
    const priorityClass = task.priority.toLowerCase();
    const categoryClass = task.category.toLowerCase();
    const dueDateFormatted = task.dueDate ? formatDate(task.dueDate) : 'No deadline';

    return `
      <div class="task-card ${isCompleted ? 'completed-card' : ''}" data-id="${task._id}">
        <div class="task-card-header">
          <div class="task-card-title-row">
            <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTaskStatus('${task._id}', this.checked, event)" aria-label="Toggle Complete">
            <h4 class="task-card-title" onclick="viewTaskDetails('${task._id}')">${escapeHtml(task.title)}</h4>
          </div>
          <div class="task-actions-dropdown">
            <button class="icon-btn" style="width: 30px; height: 30px;" onclick="openTaskModalById('${task._id}', event)" title="Edit Task">
              <i class="fa-solid fa-pen-to-square" style="font-size: 0.8rem;"></i>
            </button>
            <button class="icon-btn" style="width: 30px; height: 30px;" onclick="openDeleteModal('${task._id}', '${escapeHtml(task.title)}', event)" title="Delete Task">
              <i class="fa-solid fa-trash-can" style="font-size: 0.8rem; color: #ef4444;"></i>
            </button>
          </div>
        </div>

        ${task.description ? `<p class="task-card-desc" onclick="viewTaskDetails('${task._id}')">${escapeHtml(task.description)}</p>` : ''}

        <div class="task-card-tags">
          <span class="badge badge-cat-${categoryClass}"><i class="fa-solid fa-tag"></i> ${task.category}</span>
          <span class="badge badge-prio-${priorityClass}"><i class="fa-solid fa-flag"></i> ${task.priority}</span>
          <span class="badge badge-status-${statusClass}">${task.status}</span>
        </div>

        <div class="task-card-footer">
          <div class="task-due-info ${isOverdue ? 'overdue' : ''}">
            <i class="fa-regular fa-calendar"></i>
            <span>${dueDateFormatted}</span>
          </div>
          <span class="task-created-date">Created ${formatRelativeDate(task.createdAt)}</span>
        </div>
      </div>`;
  }).join('');
}

function renderPagination(page, totalPages) {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const numbersContainer = document.getElementById('paginationNumbers');

  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;

  if (numbersContainer) {
    let chipsHtml = '';
    for (let i = 1; i <= totalPages; i++) {
      chipsHtml += `
        <span class="page-chip ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
    }
    numbersContainer.innerHTML = chipsHtml;
  }
}

function goToPage(page) {
  state.currentPage = page;
  loadTasksData();
}

// Fast status toggle from checkbox
async function toggleTaskStatus(id, checked, event) {
  if (event) event.stopPropagation();
  try {
    const newStatus = checked ? 'Completed' : 'To Do';
    await window.api.updateTask(id, { status: newStatus });
    showToast(`Task marked as ${newStatus}!`, 'success');
    if (state.currentView === 'tasks') {
      loadTasksData();
    } else {
      refreshCurrentView();
    }
  } catch (error) {
    showToast('Failed to update status: ' + error.message, 'error');
  }
}

// ==========================================
// 3. Kanban Board Logic (HTML5 Drag & Drop)
// ==========================================
async function loadKanbanData() {
  const dropZoneToDo = document.getElementById('dropZoneToDo');
  const dropZoneInProgress = document.getElementById('dropZoneInProgress');
  const dropZoneCompleted = document.getElementById('dropZoneCompleted');

  dropZoneToDo.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  dropZoneInProgress.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  dropZoneCompleted.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  try {
    const res = await window.api.getTasks({ all: 'true', category: state.selectedCategory });
    if (res.success) {
      const allTasks = res.data;

      const todoTasks = allTasks.filter((t) => t.status === 'To Do');
      const inProgTasks = allTasks.filter((t) => t.status === 'In Progress');
      const compTasks = allTasks.filter((t) => t.status === 'Completed');

      document.getElementById('countColToDo').textContent = todoTasks.length;
      document.getElementById('countColInProgress').textContent = inProgTasks.length;
      document.getElementById('countColCompleted').textContent = compTasks.length;

      renderKanbanColumn(dropZoneToDo, todoTasks, 'To Do');
      renderKanbanColumn(dropZoneInProgress, inProgTasks, 'In Progress');
      renderKanbanColumn(dropZoneCompleted, compTasks, 'Completed');

      initKanbanDragEvents();
    }
  } catch (error) {
    showToast('Failed to load Kanban tasks: ' + error.message, 'error');
  }
}

function renderKanbanColumn(container, tasks, colStatus) {
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <i class="fa-regular fa-folder-open empty-state-icon" style="font-size: 1.8rem;"></i>
        <h4 style="font-size: 0.95rem;">No cards</h4>
        <p style="font-size: 0.78rem;">Drag cards here or click +</p>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map((task) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
    return `
      <div class="kanban-card" draggable="true" data-id="${task._id}" data-status="${task.status}">
        <div class="task-card-header">
          <h5 class="kanban-card-title">${escapeHtml(task.title)}</h5>
          <button class="icon-btn" style="width: 26px; height: 26px;" onclick="openTaskModalById('${task._id}', event)" title="Edit">
            <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i>
          </button>
        </div>
        ${task.description ? `<p class="task-card-desc" style="font-size: 0.8rem;">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-card-tags">
          <span class="badge badge-cat-${task.category.toLowerCase()}">${task.category}</span>
          <span class="badge badge-prio-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        <div class="task-card-footer">
          <span class="task-due-info ${isOverdue ? 'overdue' : ''}">
            <i class="fa-regular fa-clock"></i> ${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          </span>
        </div>
      </div>`;
  }).join('');
}

function initKanbanDragEvents() {
  const cards = document.querySelectorAll('.kanban-card');
  const dropZones = document.querySelectorAll('.kanban-drop-zone');

  cards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        viewTaskDetails(card.getAttribute('data-id'));
      }
    });
  });

  dropZones.forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = zone.getAttribute('data-status');

      if (!taskId || !newStatus) return;

      try {
        await window.api.updateTask(taskId, { status: newStatus });
        showToast(`Moved to ${newStatus}`, 'success');
        loadKanbanData();
      } catch (error) {
        showToast('Error moving card: ' + error.message, 'error');
      }
    });
  });
}

// ==========================================
// 4. Calendar View Logic
// ==========================================
async function renderCalendar() {
  const grid = document.getElementById('calendarDaysGrid');
  const title = document.getElementById('calMonthTitle');
  if (!grid || !title) return;

  const currentYear = state.calendarDate.getFullYear();
  const currentMonth = state.calendarDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';

  try {
    const res = await window.api.getTasks({ all: 'true' });
    const allTasks = res.success ? res.data : [];

    // Calculate calendar grid dates
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

    let daysHtml = '';
    const today = new Date();

    // Previous month filler days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevLastDay - x + 1;
      daysHtml += `
        <div class="calendar-day-cell other-month">
          <div class="day-header"><span class="day-number">${dayNum}</span></div>
        </div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      // Filter tasks matching this day
      const dayTasks = allTasks.filter((t) => {
        if (!t.dueDate) return false;
        const taskDue = new Date(t.dueDate).toISOString().split('T')[0];
        return taskDue === dateStr;
      });

      let tasksPills = '';
      dayTasks.forEach((t) => {
        const isDone = t.status === 'Completed';
        const prioClass = `prio-${t.priority.toLowerCase()}`;
        tasksPills += `
          <div class="cal-task-pill ${isDone ? 'status-completed' : prioClass}" onclick="viewTaskDetails('${t._id}')" title="${escapeHtml(t.title)} (${t.status})">
            ${escapeHtml(t.title)}
          </div>`;
      });

      daysHtml += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="day-header">
            <span class="day-number">${i}</span>
          </div>
          <div class="day-tasks-list">
            ${tasksPills}
          </div>
        </div>`;
    }

    // Next month filler days to complete grid
    const nextDays = (7 - ((firstDayIndex + lastDay) % 7)) % 7;
    for (let j = 1; j <= nextDays; j++) {
      daysHtml += `
        <div class="calendar-day-cell other-month">
          <div class="day-header"><span class="day-number">${j}</span></div>
        </div>`;
    }

    grid.innerHTML = daysHtml;
  } catch (error) {
    showToast('Failed to render calendar: ' + error.message, 'error');
  }
}

// ==========================================
// 5. Productivity & Analytics View Logic
// ==========================================
async function loadAnalyticsData() {
  try {
    const res = await window.api.getStats();
    if (res.success && res.stats) {
      renderAnalyticsCharts(res.stats);
      renderProductivityScorecard(res.stats);
    }
  } catch (error) {
    showToast('Failed to load analytics: ' + error.message, 'error');
  }
}

function renderAnalyticsCharts(stats) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';

  // 1. Category Chart
  const catCanvas = document.getElementById('categoryChart');
  if (catCanvas) {
    if (state.charts.category) state.charts.category.destroy();

    const categories = ['Work', 'College', 'Projects', 'Personal'];
    const catCounts = categories.map((cat) => {
      const match = (stats.categoryStats || []).find((c) => c._id === cat);
      return match ? match.count : 0;
    });

    state.charts.category = new Chart(catCanvas, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Tasks Count',
            data: catCounts,
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor } },
          y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 } },
        },
      },
    });
  }

  // 2. Priority Chart
  const prioCanvas = document.getElementById('priorityChart');
  if (prioCanvas) {
    if (state.charts.priority) state.charts.priority.destroy();

    const priorities = ['High', 'Medium', 'Low'];
    const prioCounts = priorities.map((p) => {
      const match = (stats.priorityStats || []).find((item) => item._id === p);
      return match ? match.count : 0;
    });

    state.charts.priority = new Chart(prioCanvas, {
      type: 'doughnut',
      data: {
        labels: priorities,
        datasets: [
          {
            data: prioCounts.every((v) => v === 0) ? [1, 1, 1] : prioCounts,
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } },
        },
        cutout: '65%',
      },
    });
  }
}

function renderProductivityScorecard(stats) {
  const container = document.getElementById('productivityScorecard');
  if (!container) return;

  const onTimePercentage = stats.total > 0
    ? Math.max(0, Math.round(((stats.completed) / (stats.total || 1)) * 100))
    : 100;

  container.innerHTML = `
    <div class="metric-box">
      <span class="metric-box-title">Completion Ratio</span>
      <span class="metric-box-val" style="color: #10b981;">${stats.completionPercentage}%</span>
      <span class="widget-subtext">${stats.completed} done out of ${stats.total} total</span>
    </div>
    <div class="metric-box">
      <span class="metric-box-title">Work-in-Flight</span>
      <span class="metric-box-val" style="color: #f59e0b;">${stats.inProgress}</span>
      <span class="widget-subtext">Active tasks progressing</span>
    </div>
    <div class="metric-box">
      <span class="metric-box-title">Overdue Backlog</span>
      <span class="metric-box-val" style="color: #ef4444;">${stats.overdue}</span>
      <span class="widget-subtext">Requires immediate resolution</span>
    </div>
    <div class="metric-box">
      <span class="metric-box-title">Due Today</span>
      <span class="metric-box-val" style="color: #6366f1;">${stats.dueToday}</span>
      <span class="widget-subtext">Scheduled for today</span>
    </div>`;
}

// ==========================================
// Task Modal Logic (Create & Edit)
// ==========================================
function openTaskModal(task = null, presets = {}) {
  const modal = document.getElementById('taskModal');
  const titleElem = document.getElementById('taskModalTitle');
  const idInput = document.getElementById('taskIdInput');
  const titleInput = document.getElementById('taskTitleInput');
  const descInput = document.getElementById('taskDescInput');
  const catInput = document.getElementById('taskCategoryInput');
  const prioInput = document.getElementById('taskPriorityInput');
  const statusInput = document.getElementById('taskStatusInput');
  const dueDateInput = document.getElementById('taskDueDateInput');

  if (task) {
    state.editingTaskId = task._id;
    titleElem.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
    idInput.value = task._id;
    titleInput.value = task.title || '';
    descInput.value = task.description || '';
    catInput.value = task.category || 'Work';
    prioInput.value = task.priority || 'Medium';
    statusInput.value = task.status || 'To Do';
    dueDateInput.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  } else {
    state.editingTaskId = null;
    titleElem.innerHTML = '<i class="fa-solid fa-plus"></i> Create New Task';
    idInput.value = '';
    titleInput.value = '';
    descInput.value = '';
    catInput.value = presets.category || (state.selectedCategory !== 'All' ? state.selectedCategory : 'Work');
    prioInput.value = presets.priority || 'Medium';
    statusInput.value = presets.status || 'To Do';
    dueDateInput.value = presets.dueDate || '';
  }

  modal.classList.add('active');
  titleInput.focus();
}

async function openTaskModalById(id, event) {
  if (event) event.stopPropagation();
  try {
    const res = await window.api.getTask(id);
    if (res.success && res.data) {
      openTaskModal(res.data);
    }
  } catch (error) {
    showToast('Failed to fetch task details: ' + error.message, 'error');
  }
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('active');
  state.editingTaskId = null;
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('taskIdInput').value;
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescInput').value.trim();
  const category = document.getElementById('taskCategoryInput').value;
  const priority = document.getElementById('taskPriorityInput').value;
  const status = document.getElementById('taskStatusInput').value;
  const dueDate = document.getElementById('taskDueDateInput').value;

  if (!title) {
    document.getElementById('titleError').textContent = 'Please enter a valid title';
    document.getElementById('titleError').style.display = 'block';
    return;
  }

  const payload = {
    title,
    description,
    category,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate) : null,
  };

  try {
    if (id) {
      await window.api.updateTask(id, payload);
      showToast('Task updated successfully!', 'success');
    } else {
      await window.api.createTask(payload);
      showToast('New task created!', 'success');
    }

    closeTaskModal();
    refreshCurrentView();
  } catch (error) {
    showToast('Error saving task: ' + error.message, 'error');
  }
}

// ==========================================
// Task Details Preview Modal
// ==========================================
async function viewTaskDetails(id) {
  try {
    const res = await window.api.getTask(id);
    if (res.success && res.data) {
      const t = res.data;
      state.previewingTask = t;

      const content = document.getElementById('taskDetailsContent');
      content.innerHTML = `
        <div class="detail-row">
          <div class="detail-label">Task Title</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(t.title)}</h2>
        </div>

        ${t.description ? `
        <div class="detail-row" style="margin-top: 1rem;">
          <div class="detail-label">Description</div>
          <p style="color: var(--text-secondary); white-space: pre-wrap; font-size: 0.92rem;">${escapeHtml(t.description)}</p>
        </div>` : ''}

        <div class="detail-meta-grid">
          <div>
            <div class="detail-label">Category</div>
            <span class="badge badge-cat-${t.category.toLowerCase()}">${t.category}</span>
          </div>
          <div>
            <div class="detail-label">Priority</div>
            <span class="badge badge-prio-${t.priority.toLowerCase()}">${t.priority}</span>
          </div>
          <div>
            <div class="detail-label">Current Status</div>
            <span class="badge badge-status-${t.status.toLowerCase().replace(/\s+/g, '-')}">${t.status}</span>
          </div>
          <div>
            <div class="detail-label">Due Date</div>
            <span style="font-weight: 600; font-size: 0.88rem;">${t.dueDate ? formatDate(t.dueDate) : 'No due date specified'}</span>
          </div>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1.25rem;">
          Created: ${new Date(t.createdAt).toLocaleString()} | Last modified: ${new Date(t.updatedAt).toLocaleString()}
        </div>`;

      document.getElementById('taskDetailsModal').classList.add('active');
    }
  } catch (error) {
    showToast('Failed to load task details: ' + error.message, 'error');
  }
}

function closeDetailsModal() {
  document.getElementById('taskDetailsModal').classList.remove('active');
}

// ==========================================
// Delete Task Confirmation Modal
// ==========================================
function openDeleteModal(id, title, event) {
  if (event) event.stopPropagation();
  state.deletingTaskId = id;
  document.getElementById('deleteTaskTitle').textContent = `"${title}"`;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  state.deletingTaskId = null;
}

async function handleConfirmDelete() {
  if (!state.deletingTaskId) return;

  try {
    await window.api.deleteTask(state.deletingTaskId);
    showToast('Task removed permanently from database', 'success');
    closeDeleteModal();
    refreshCurrentView();
  } catch (error) {
    showToast('Failed to delete task: ' + error.message, 'error');
  }
}

// ==========================================
// User Authentication (Login & Register)
// ==========================================
function initAuthUI() {
  const user = window.api.getUser();
  const userNameElem = document.getElementById('sidebarUserName');
  const userEmailElem = document.getElementById('sidebarUserEmail');
  const avatarElem = document.getElementById('sidebarAvatar');
  const authIcon = document.getElementById('authIcon');

  if (user && window.api.isAuthenticated()) {
    userNameElem.textContent = user.name || 'User';
    userEmailElem.textContent = user.email || '';
    avatarElem.textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (user.avatarColor) avatarElem.style.backgroundColor = user.avatarColor;
    authIcon.className = 'fa-solid fa-right-from-bracket';
    authIcon.title = 'Sign Out';
  } else {
    userNameElem.textContent = 'Guest Workspace';
    userEmailElem.textContent = 'Offline / Shared Mode';
    avatarElem.textContent = 'G';
    avatarElem.style.backgroundColor = '#6366f1';
    authIcon.className = 'fa-solid fa-right-to-bracket';
    authIcon.title = 'Sign In / Register';
  }
}

function openAuthModal() {
  if (window.api.isAuthenticated()) {
    // Already logged in -> Handle logout
    if (confirm('Are you sure you want to sign out?')) {
      window.api.clearAuth();
      initAuthUI();
      showToast('Signed out successfully', 'info');
      refreshCurrentView();
    }
    return;
  }
  document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await window.api.login({ email, password });
    if (res.success) {
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      closeAuthModal();
      initAuthUI();
      refreshCurrentView();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const res = await window.api.register({ name, email, password });
    if (res.success) {
      showToast(`Account created! Welcome, ${res.user.name}`, 'success');
      closeAuthModal();
      initAuthUI();
      refreshCurrentView();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================
// Toast Notification Engine
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// Utility Helper Functions
// ==========================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
