"use client";
import React, { useEffect, useState } from 'react';
import useApi from '../utils/useApi'; //custom hook to create axios instance
import TaskList from "../components/Tasklist/TaskList";

const Task = () => {
    const api = useApi();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {

        // Function to fetch tasks from the API
        // Retrieves tasks and updates the state with the fetched data.
        const fetchTasks = async () => {
            try {
                const response = await api.get('/tasks');
                setTasks(response.data.tasks);
            } catch (error) {
                // Catches errors during the API call and logs them to the console
                console.error('Error fetching tasks:', error);
            }
        };

        fetchTasks();
    }, [api]);

    return (
        <div>
            {/*Renders the TaskList component*/}
            <TaskList />
        </div>
    );
};

export default Task;

