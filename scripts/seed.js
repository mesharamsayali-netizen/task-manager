const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');
const User = require('../models/User');

dotenv.config();

const sampleTasks = [
  {
    title: 'Complete Database Architecture Design',
    description: 'Design MongoDB collections, indexes, and relationship schemas for the project.',
    category: 'Projects',
    priority: 'High',
    status: 'Completed',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Finalize Web Application REST APIs',
    description: 'Implement CRUD routes with error handling, validation, and JWT authentication.',
    category: 'Work',
    priority: 'High',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
  },
  {
    title: 'Study Distributed Systems Lecture Notes',
    description: 'Review CAP theorem, Raft consensus algorithm, and read chapter 4 of syllabus.',
    category: 'College',
    priority: 'Medium',
    status: 'To Do',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
  },
  {
    title: 'Weekly Grocery Shopping & Meal Prep',
    description: 'Purchase fresh vegetables, fruits, almond milk, and prep lunch boxes for the week.',
    category: 'Personal',
    priority: 'Low',
    status: 'To Do',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Fix Drag and Drop UI Glitch on Mobile',
    description: 'Improve touch events support for Kanban board columns and card reordering.',
    category: 'Projects',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: new Date(), // Today
  },
  {
    title: 'Submit Operating Systems Assignment 3',
    description: 'Simulate CPU scheduling algorithms (FCFS, SJF, Round Robin) in C++ and submit report.',
    category: 'College',
    priority: 'High',
    status: 'To Do',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue!
  },
  {
    title: 'Schedule Annual Dental Health Checkup',
    description: 'Call dentist clinic at 10 AM to book an appointment for next week.',
    category: 'Personal',
    priority: 'Low',
    status: 'Completed',
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Client Demo & Sprint Review Meeting',
    description: 'Prepare presentation slides and walk stakeholders through new dashboard analytics.',
    category: 'Work',
    priority: 'High',
    status: 'To Do',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  }
];

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing guest tasks
    await Task.deleteMany({ user: null });
    console.log('Existing demo tasks cleared.');

    // Insert sample tasks
    await Task.insertMany(sampleTasks);
    console.log(` Successfully inserted ${sampleTasks.length} sample tasks!`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
