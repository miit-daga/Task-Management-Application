const mongoose = require('mongoose');
const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter a task.']
    },
    description: {
        type: String,
        default: 'No description provided.'
    },
    dueDate: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Completed'],
        default: 'To Do',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: [true, 'Please set a priority for the task.']
    },
},
    {
        timestamps: true,
        collection: "Tasks",
    })

module.exports = mongoose.model('Task', taskSchema);