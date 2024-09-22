import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort } from '@fortawesome/free-solid-svg-icons';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';


const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
    </div>
);

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'To Do' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: string;
}



const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
axios.defaults.withCredentials = true;

const TaskList: React.FC = () => {

    // Function to check if a given date is valid
    // Adjusting date to IST
    const isValidDate = (dateString: string): boolean => {
        if (!dateString) return true;
        const inputDate = new Date(dateString);
        const currentDate = new Date();

        inputDate.setUTCHours(0, 0, 0, 0);
        currentDate.setUTCHours(0, 0, 0, 0);


        inputDate.setUTCHours(inputDate.getUTCHours() + 5);
        inputDate.setUTCMinutes(inputDate.getUTCMinutes() + 30);
        currentDate.setUTCHours(currentDate.getUTCHours() + 5);
        currentDate.setUTCMinutes(currentDate.getUTCMinutes() + 30);


        return inputDate >= currentDate;
    };

    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<{ status: string; priority: string }>({ status: 'All', priority: 'All' });
    const [sortField, setSortField] = useState<'dueDate' | 'priority' | 'default'>('default');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState<Task | null>({ _id: '', title: '', description: '', status: 'To Do', priority: 'Medium' });
    const [error, setError] = useState<string | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Function to fetch tasks from the API
    // Set loading state to true while fetching and handle any errors that occur
    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get<{ tasks: Task[] }>(`${API_URL}/tasks`);
            setTasks(response.data.tasks);
        } catch (error) {
            setError('Failed to fetch tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDelete = async (taskId: string) => {
        try {
            await axios.delete(`${API_URL}/task/${taskId}`);
            fetchTasks();
        } catch (error) {
            setError('Failed to delete task.');
        }
    };
    // Function to handle updating an existing task
    // Check if the updated date is valid before proceeding with the API request
    const handleUpdateTask = async () => {
        if (!selectedTask) return;
        if (!isValidDate(selectedTask.dueDate || '')) {
            setEditError('Please select a future date.');
            return;
        }
        try {
            await axios.put(`${API_URL}/updatecontent/${selectedTask._id}`, selectedTask);
            setSelectedTask(null);
            setEditDialogOpen(false);
            setEditError(null);
            fetchTasks();
        } catch (error) {
            setEditError('Failed to update task. Please try again.');
        }
    };
    // Function to handle adding a new task
    // Validate task data before sending a request to the API
    const handleAddTask = async () => {
        if (!newTask) return;
        if (!isValidDate(newTask.dueDate || '')) {
            setAddError('Please select a future date.');
            return;
        }
        try {
            await axios.post(`${API_URL}/task`, newTask);
            setNewTask({ _id: '', title: '', description: '', status: 'To Do', priority: 'Medium' });
            setAddError(null);
            setAddDialogOpen(false);
            fetchTasks();
        } catch (error) {
            setAddError('Failed to add task. Please try again.');
        }
    };

    const handleInputChange = (field: keyof Task, value: string) => {
        if (selectedTask) {
            setSelectedTask({ ...selectedTask, [field]: value });
        } else if (newTask) {
            setNewTask({ ...newTask, [field]: value });
        }
    };
    // Function to handle sorting tasks
    // Determine sort order based on user selection (e.g., due date, priority)
    const handleSort = (field: 'default' | 'dueDate' | 'priority') => {
        if (field === 'default') {

            setSortField('default');
            setSortOrder('asc');
            return;
        }


        setSortField(field);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };
    const handleLogout = async () => {
        try {
            await axios.get(`${API_URL}/logout`);
            router.push('/login');
        } catch (error) {
            setError('Failed to log out.');
        }
    };


    // Filter tasks based on search input and sort them
    // Only include tasks that match the search criteria and sort by due date or other criteria
    const filteredTasks = tasks
        .filter(task => {
            return (
                (filter.status !== 'All' ? task.status === filter.status : true) &&
                (filter.priority !== 'All' ? task.priority === filter.priority : true)
            );
        })
        .sort((a, b) => {
            if (sortField === 'default') return 0;

            let comparison = 0;
            if (sortField === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                comparison = dateA - dateB;
            } else if (sortField === 'priority') {
                const priorities = { Low: 1, Medium: 2, High: 3 };
                comparison = priorities[a.priority] - priorities[b.priority];
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-8">
            {/* Show loading spinner when loading */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6 relative">

                        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white">Task List</h1>
                        <div className="flex space-x-4 ml-auto">
                            <Button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-500 text-white"
                            >
                                Logout
                            </Button>
                            <Button
                                onClick={() => router.push('/kanban')}
                                className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                Go to Kanban Board
                            </Button>
                        </div>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-500 text-white mb-4">Add Task</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 text-gray-200">
                            <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                {addError && <p className="text-red-500">{addError}</p>}
                                <Input
                                    placeholder="Title"
                                    value={newTask?.title || ''}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="bg-gray-800 text-gray-200"
                                />
                                <Input
                                    placeholder="Description"
                                    value={newTask?.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="bg-gray-800 text-gray-200"
                                />
                                <Input
                                    type="date"
                                    placeholder="Due Date"
                                    value={newTask?.dueDate || ''}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                    className="bg-gray-800 text-gray-200"
                                />
                                <Select onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger className="bg-gray-800 text-gray-200">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 text-gray-200">
                                        <SelectItem value="To Do">To Do</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={(value) => handleInputChange('priority', value)}>
                                    <SelectTrigger className="bg-gray-800 text-gray-200">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 text-gray-200">
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTask} className="bg-green-600 hover:bg-green-500 text-white">Add Task</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>


                    <div className="flex space-x-4 mb-6">
                        <Select onValueChange={(value) => setFilter({ ...filter, status: value })}>
                            <SelectTrigger className="bg-gray-800 text-gray-200">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-200">
                                <SelectItem value="All">All Status</SelectItem>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => setFilter({ ...filter, priority: value })}>
                            <SelectTrigger className="bg-gray-800 text-gray-200">
                                <SelectValue placeholder="All Priority" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-200">
                                <SelectItem value="All">All Priority</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => handleSort(value as 'default' | 'dueDate' | 'priority')}>
                            <SelectTrigger className="bg-gray-800 text-gray-200 flex items-center">
                                <FontAwesomeIcon icon={faSort} className="mr-2" />
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 text-gray-200">
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="dueDate">Due Date</SelectItem>
                                <SelectItem value="priority">Priority</SelectItem>
                            </SelectContent>
                        </Select>


                        {sortField !== 'default' && (
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleSort(sortField)}>
                                {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                            </Button>
                        )}

                    </div>

                    {filteredTasks.length > 0 ? (
                        <Table className="w-full bg-gray-800 text-gray-200">
                            <TableHeader className="bg-gray-700">
                                <TableRow className='hover:bg-gray-700'>
                                    <TableHead className="p-4 text-center">S/N</TableHead>
                                    <TableHead className="p-4 text-center">Title</TableHead>
                                    <TableHead className="p-4 text-center">Description</TableHead>
                                    <TableHead className="p-4 text-center">Status</TableHead>
                                    <TableHead className="p-4 text-center">
                                        Priority
                                        {sortField === 'priority' && (
                                            <FontAwesomeIcon icon={sortOrder === 'asc' ? faArrowUp : faArrowDown} className="ml-2" />
                                        )}
                                    </TableHead>
                                    <TableHead className="p-4 text-center">
                                        Due Date
                                        {sortField === 'dueDate' && (
                                            <FontAwesomeIcon icon={sortOrder === 'asc' ? faArrowUp : faArrowDown} className="ml-2" />
                                        )}
                                    </TableHead>
                                    <TableHead className="p-4 text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTasks.map((task, index) => (
                                    <TableRow key={task._id} className="border-t border-gray-700 hover:bg-gray-800">
                                        <TableCell className="p-4 text-center">{index + 1}</TableCell>
                                        <TableCell className="p-4 text-center ">{task.title}</TableCell>
                                        <TableCell className="p-4 text-center">{task.description || 'N/A'}</TableCell>
                                        <TableCell className="p-4 text-center">{task.status}</TableCell>
                                        <TableCell className="p-4 text-center">{task.priority}</TableCell>
                                        <TableCell className="p-4 text-center">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="p-4 text-center space-x-2">
                                            <Button onClick={() => { setSelectedTask(task); setEditDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white">Edit</Button>
                                            <Button onClick={() => handleDelete(task._id)} className="bg-red-600 hover:bg-red-500 text-white">Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-gray-400 mt-4 text-center">No tasks available.</p>
                    )}
                    {selectedTask && (
                        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogContent className="bg-gray-900 text-gray-200">
                                <DialogHeader>
                                    <DialogTitle>Edit Task</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    {editError && <p className="text-red-500">{editError}</p>}
                                    <Input
                                        placeholder="Title"
                                        value={selectedTask.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className="bg-gray-800 text-gray-200"
                                    />
                                    <Input
                                        placeholder="Description"
                                        value={selectedTask.description || ''}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="bg-gray-800 text-gray-200"
                                    />
                                    <Input
                                        type="date"
                                        value={selectedTask.dueDate || ''}
                                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                        className="bg-gray-800 text-gray-200"
                                    />
                                    <Select value={selectedTask.status} onValueChange={(value) => handleInputChange('status', value)}>
                                        <SelectTrigger className="bg-gray-800 text-gray-200">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-gray-200">
                                            <SelectItem value="To Do">To Do</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedTask.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                                        <SelectTrigger className="bg-gray-800 text-gray-200">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-gray-200">
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleUpdateTask} className="bg-blue-600 hover:bg-blue-500 text-white">Update Task</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            )}
        </div>
    );
};
export default React.memo(TaskList);
