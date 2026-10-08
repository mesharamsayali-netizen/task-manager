const mongoose = require('mongoose');

/**
 * Global cache for MongoDB connection across serverless invocations (e.g. Vercel)
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB (MongoDB Atlas, Local MongoDB, or in-memory fallback for local dev)
 */
const connectDB = async () => {
  // If already connected, return cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager';

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents Mongoose from buffering queries indefinitely on connection failure
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (conn) => {
        console.log(` MongoDB Connected successfully to: ${conn.connection.host}`);

        // Seed initial sample tasks if database is empty
        try {
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
            console.log(` Inserted ${initialTasks.length} initial tasks.`);
          }
        } catch (seedErr) {
          console.warn(' Notice: Initial seed check skipped:', seedErr.message);
        }

        return conn;
      })
      .catch(async (err) => {
        // Reset cached promise so retry can be attempted on subsequent requests
        cached.promise = null;

        // In local development, try in-memory server if available
        if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
          try {
            console.warn(` Primary MongoDB not reachable (${err.message}). Starting local in-memory fallback...`);
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const memUri = mongod.getUri();
            const conn = await mongoose.connect(memUri);
            console.log(` In-memory MongoDB running at: ${memUri}`);
            return conn;
          } catch (memErr) {
            console.error(' Error initializing in-memory MongoDB:', memErr.message);
          }
        }

        throw new Error(`MongoDB connection failed (${err.message}). Please ensure MONGODB_URI is set in your environment variables.`);
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};

module.exports = connectDB;
