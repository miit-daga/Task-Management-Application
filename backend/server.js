//server.js
const deadlineNotifier = require('./notifications/deadlineNotifier');
const cron = require('node-cron');
const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const port = process.env.PORT || 3000;
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const cookieParser = require('cookie-parser');


connectDB();
// Initialize the deadline notifier
deadlineNotifier.initialize().catch(console.error);
const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3001", "https://task-management-app-by-miit.vercel.app", "https://task-management-trial-r49l.vercel.app", "https://main.d2pqmc0gucozlx.amplifyapp.com"
  ],
  "Access-Control-Allow-Origin": ["https://task-management-app-by-miit.vercel.app", "http://localhost:3001", "https://task-management-trial-r49l.vercel.app", "https://main.d2pqmc0gucozlx.amplifyapp.com"],
  "Access-Control-Allow-Credentials": true,
  methods: "GET,POST,PUT,DELETE,PATCH",
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization", "set-cookie"],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// Ensure your app handles preflight requests
app.options('*', cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200).send({ message: "Welcome to Task Management - api!" });
});

app.use(authRoutes);
app.use(taskRoutes); // Ensure that the task routes can be accessed


// Schedule deadline checks to run daily at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running daily deadline check...');
  deadlineNotifier.checkDeadlines();
});

cron.schedule('*/1 * * * *', () => {
  console.log('Running deadline check every 1 minute...');
  deadlineNotifier.checkDeadlines();
});

app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});
