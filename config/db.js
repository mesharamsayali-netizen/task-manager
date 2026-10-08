const mongoose = require('mongoose');

/**
 * Connects to MongoDB (Local MongoDB, MongoDB Atlas, or dev in-memory fallback)
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(` MongoDB Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(` Primary MongoDB (${uri}) not reachable: ${err.message}`);
    console.log(' Starting in-memory MongoDB instance for seamless development & testing...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(` Connected to MongoDB instance at: ${memUri}`);

      // Seed initial sample data if empty
      const Task = require('../models/Task');
      const count = await Task.countDocuments();
      if (count === 0) {
        console.log(' Seeding demo sample tasks...');
        const initialTasks = [
          {
            title: 'Design Database Architecture & Schemas',
            description: 'Define MongoDB collections, validation rules, Mongoose models and indexes.',
            category: 'Projects',
            priority: 'High',
            status: 'Completed',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Implement Express REST APIs & Authentication',
            description: 'Write robust CRUD controllers with error handling, JWT auth and validation.',
            category: 'Work',
            priority: 'High',
            status: 'In Progress',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Study Operating Systems & Memory Management',
            description: 'Review virtual memory, page replacement algorithms, and solve practice questions.',
            category: 'College',
            priority: 'Medium',
            status: 'To Do',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Weekly Grocery Shopping & Meal Prep',
            description: 'Buy organic greens, almond milk, coffee beans, and prepare healthy lunch boxes.',
            category: 'Personal',
            priority: 'Low',
            status: 'To Do',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Polish Drag & Drop Kanban UI Interactions',
            description: 'Add fluid transition animations and drop target highlights across board columns.',
            category: 'Projects',
            priority: 'Medium',
            status: 'In Progress',
            dueDate: new Date(),
          },
          {
            title: 'Submit Distributed Systems Lab Assignment',
            description: 'Complete Raft leader election simulation in C++ and submit lab documentation.',
            category: 'College',
            priority: 'High',
            status: 'To Do',
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Annual Dental Checkup & Cleaning Appointment',
            description: 'Routine dentist consultation and tooth clean.',
            category: 'Personal',
            priority: 'Low',
            status: 'Completed',
            dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            title: 'Stakeholder Sprint Review & Product Demo',
            description: 'Present the latest productivity metrics and task management features to the team.',
            category: 'Work',
            priority: 'High',
            status: 'To Do',
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          },
        ];
        await Task.insertMany(initialTasks);
        console.log(` Inserted ${initialTasks.length} initial tasks into MongoDB.`);
      }

      return conn;
    } catch (memErr) {
      console.error(' Error initializing MongoDB instance:', memErr.message);
      throw memErr;
    }
  }
};

module.exports = connectDB;
