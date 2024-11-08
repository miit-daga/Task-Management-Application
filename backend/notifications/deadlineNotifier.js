const AWS = require('aws-sdk');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const sns = new AWS.SNS({
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class DeadlineNotifier {
    constructor() {
        this.topicArn = null;
    }

    async initialize() {
        try {
            // Create an SNS topic for deadline notifications if it doesn't exist
            const topicResponse = await sns.createTopic({
                Name: 'TaskDeadlineNotifications'
            }).promise();
            this.topicArn = topicResponse.TopicArn;
            console.log('SNS Topic created:', this.topicArn);
        } catch (error) {
            console.error('Failed to create SNS topic:', error);
            throw error;
        }
    }

    async subscribeUser(email) {
        try {
            if (!this.topicArn) {
                await this.initialize();
            }

            const subscribeResponse = await sns.subscribe({
                Protocol: 'email',
                TopicArn: this.topicArn,
                Endpoint: email
            }).promise();

            console.log(`Subscribed ${email} to notifications`);
            return subscribeResponse.SubscriptionArn;
        } catch (error) {
            console.error('Failed to subscribe user:', error);
            throw error;
        }
    }

    async sendNotification(task, user, daysBefore) {
        try {
            const message = daysBefore === 0 ?
                `Task "${task.title}" is due today!\n\nDescription: ${task.description}\nPriority: ${task.priority}\nStatus: ${task.status}` :
                `Task "${task.title}" is due tomorrow!\n\nDescription: ${task.description}\nPriority: ${task.priority}\nStatus: ${task.status}`;

            const subject = daysBefore === 0 ?
                `Task Due Today: ${task.title}` :
                `Task Due Tomorrow: ${task.title}`;

            await sns.publish({
                TopicArn: this.topicArn,
                Message: message,
                Subject: subject
            }).promise();

            console.log(`Sent deadline notification for task ${task._id}`);
        } catch (error) {
            console.error('Failed to send notification:', error);
            throw error;
        }
    }

    async checkDeadlines() {
        try {
            // Get all tasks
            const tasks = await Task.find();
            const today = new Date();

            for (const task of tasks) {
                if (task.status === 'Completed') continue;

                const dueDate = new Date(task.dueDate);
                const user = await User.findById(task.user);

                if (!user || !user.email) continue;

                // Calculate days until deadline
                const timeDiff = dueDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Send notification if due today or tomorrow
                if (daysDiff === 0 || daysDiff === 1) {
                    await this.sendNotification(task, user, daysDiff);
                }
            }
        } catch (error) {
            console.error('Error checking deadlines:', error);
        }
    }
}

module.exports = new DeadlineNotifier();
