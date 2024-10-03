const { decode } = require("punycode");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { count } = require("console");

// @route  GET /tasks
// @desc   Get tasks of the user
// @access Private
const getTasks = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const tasks = await Task.find({ user: decodedToken.user_id });
        res.json({
            tasks: tasks
        });
    } catch (err) {
        res.status(500).json('TaskModel error');
        console.log(err);
    }
};

// @route  GET /tasks/:id
// @desc   Get a task of _id=id of the user
// @access Private
const getTask = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const tasks = await Task.find({ user: decodedToken.user_id });
        const task = tasks.find((task) => task._id.toString() === req.params.id);
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve task from database" });
        console.log(err);

    }
};

// @route  POST /task
// @desc   Add user task
// @access Private
const addTask = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!req.body.title) {
            res.status(400);
            throw new Error("Please add a task!");
        }
        const task = await Task.create({
            title: req.body.title,
            description: req.body.description,
            dueDate: req.body.dueDate,
            user: decodedToken.user_id,
            status: req.body.status || 'To Do',
            // completed: false,
            priority: req.body.priority
        });
        res.json({
            task: task
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to add task to database" });
        console.log(err);
    }
};

// @route  PUT /updatecontent/:id
// @desc   Change user task content
// @access Private
const updateTaskContent = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decodedToken.user_id;
        const { title, description, dueDate, status, priority } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404);
            throw new Error("Task not found!");
        }

        // makes sure the logged in user matches the user of the task
        if (task.user.toString() !== userId) {
            res.status(401);
            throw new Error("User not authorized!");
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        // task.completed = false;
        await task.save();
        res.status(200).json({
            success: true,
            message: "Task content changed successfully!",
            task
        });
    } catch (err) {
        res.status(500).json({ message: err });
        console.log(err);
    }
};

// @route PUT /task/:id/move
// @desc  Update task status (e.g., moving between Kanban columns)
// @access Private
const moveTask = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(400).json({ message: 'Task not found' });
            return;
        }
        if (task.user.toString() !== decodedToken.user_id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        task.status = req.body.status;
        await task.save();
        res.status(200).json({ message: 'Task moved successfully', task });
    } catch (err) {
        res.status(500).json({ message: 'Failed to move task' });
        console.error(err);
    }
};

// @route  DELETE /task/:id
// @desc   Delete user task
// @access Private
const deleteTask = async (req, res) => {
    try {
        console.log("Received task ID:", req.params.id);
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(400);
            throw new Error("Task not found!");
        }
        const userId = decodedToken.user_id;
        // makes sure the logged in user matches the user of the task
        if (task.user.toString() !== userId) {
            res.status(401);
            throw new Error("User not authorized!");
        }

        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        res.json({ id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete task" });
        console.log(err);
    }
};

module.exports = {
    getTasks,
    getTask,
    addTask,
    updateTaskContent,
    deleteTask,
    moveTask
};
