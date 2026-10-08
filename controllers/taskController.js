const mongoose = require('mongoose');
const Task = require('../models/Task');

/**
 * Helper to build the user query filter
 */
const getUserFilter = (req) => {
  if (req.user && req.user._id) {
    return { user: req.user._id };
  }
  // If no logged in user, query tasks with null user (guest/demo pool)
  return { user: null };
};

/**
 * @desc    Get all tasks with search, filter, sort & pagination
 * @route   GET /api/tasks
 * @access  Public / Private
 */
exports.getTasks = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      dueDateFilter,
      sort = 'createdAt_desc',
      page = 1,
      limit = 10,
      all = 'false',
    } = req.query;

    const query = { ...getUserFilter(req) };

    // Search by title or description
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by dueDate
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dueDateFilter === 'today') {
      query.dueDate = { $gte: todayStart, $lte: todayEnd };
    } else if (dueDateFilter === 'upcoming') {
      query.dueDate = { $gt: todayEnd };
    } else if (dueDateFilter === 'overdue') {
      query.dueDate = { $lt: todayStart };
      query.status = { $ne: 'Completed' };
    } else if (dueDateFilter === 'this_week') {
      const endOfWeek = new Date(todayStart);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: todayStart, $lte: endOfWeek };
    }

    // Sorting options
    let sortOption = { createdAt: -1 };
    if (sort === 'createdAt_asc') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'createdAt_desc') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'dueDate_asc') {
      sortOption = { dueDate: 1 };
    } else if (sort === 'dueDate_desc') {
      sortOption = { dueDate: -1 };
    } else if (sort === 'priority_desc') {
      // High -> Medium -> Low
      // We will sort naturally or handle via aggregation if needed
      sortOption = { priority: 1, createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalTasks = await Task.countDocuments(query);

    let tasksQuery = Task.find(query).sort(sortOption);

    if (all !== 'true') {
      tasksQuery = tasksQuery.skip(skip).limit(limitNum);
    }

    const tasks = await tasksQuery.exec();

    res.status(200).json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      page: all === 'true' ? 1 : pageNum,
      totalPages: all === 'true' ? 1 : Math.ceil(totalTasks / limitNum) || 1,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public / Private
 */
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // If authenticated, ensure task ownership
    if (req.user && task.user && task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving task',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Public / Private
 */
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const taskData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Work',
      priority: priority || 'Medium',
      status: status || 'To Do',
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.user ? req.user._id : null,
    };

    if (taskData.status === 'Completed') {
      taskData.completedAt = new Date();
    }

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Validation failed for creating task',
    });
  }
};

/**
 * @desc    Update task details or status
 * @route   PUT /api/tasks/:id
 * @access  Public / Private
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    let task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Ownership check if user logged in
    if (req.user && task.user && task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    const { title, description, category, priority, status, dueDate } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (category !== undefined) task.category = category;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (status !== undefined) {
      task.status = status;
      if (status === 'Completed' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (status !== 'Completed') {
        task.completedAt = null;
      }
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating task',
    });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Public / Private
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (req.user && task.user && task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
      });
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      id: id,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task',
      error: error.message,
    });
  }
};

/**
 * @desc    Get comprehensive dashboard statistics from real MongoDB data
 * @route   GET /api/stats
 * @access  Public / Private
 */
exports.getStats = async (req, res) => {
  try {
    const userFilter = getUserFilter(req);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Total tasks
    const totalTasks = await Task.countDocuments(userFilter);

    // Status counts
    const completedTasks = await Task.countDocuments({ ...userFilter, status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ ...userFilter, status: 'In Progress' });
    const pendingTasks = await Task.countDocuments({ ...userFilter, status: 'To Do' });

    // Overdue tasks (due date before today and not completed)
    const overdueTasks = await Task.countDocuments({
      ...userFilter,
      dueDate: { $lt: todayStart, $ne: null },
      status: { $ne: 'Completed' },
    });

    // Tasks due today
    const dueTodayTasks = await Task.countDocuments({
      ...userFilter,
      dueDate: { $gte: todayStart, $lte: todayEnd },
    });

    // Overall completion percentage
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Category breakdown
    const categoryStats = await Task.aggregate([
      { $match: userFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: userFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent 5 tasks
    const recentTasks = await Task.find(userFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Upcoming 5 tasks with due dates
    const upcomingTasks = await Task.find({
      ...userFilter,
      dueDate: { $gte: todayStart },
      status: { $ne: 'Completed' },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .exec();

    // 7-day completion activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const completionTrend = await Task.aggregate([
      {
        $match: {
          ...userFilter,
          completedAt: { $gte: sevenDaysAgo },
          status: 'Completed',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        dueToday: dueTodayTasks,
        completionPercentage,
        categoryStats,
        priorityStats,
        recentTasks,
        upcomingTasks,
        completionTrend,
      },
    });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating stats',
      error: error.message,
    });
  }
};
