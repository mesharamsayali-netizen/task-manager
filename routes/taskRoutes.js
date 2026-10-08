const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
} = require('../controllers/taskController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Apply optionalAuth so user tasks can be isolated if authenticated or available for guest
router.use(optionalAuth);

// Dashboard Statistics endpoint
router.get('/stats', getStats);

// Task CRUD endpoints
router.route('/tasks')
  .get(getTasks)
  .post(createTask);

router.route('/tasks/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
