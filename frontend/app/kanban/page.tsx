"use client";
import React, { useState, useEffect } from 'react';
import useApi from "../utils/useApi"; //custom hook to create axios instance
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import { useDroppable, UniqueIdentifier, } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
}

type ColumnKey = 'to-do' | 'in-progress' | 'completed';

type Column = {
  id: ColumnKey;
  title: string;
  taskIds: string[];
};

const KanbanBoard: React.FC = () => {
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<{ [key in ColumnKey]: Column }>({
    'to-do': { id: 'to-do', title: 'To Do', taskIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
    'completed': { id: 'completed', title: 'Completed', taskIds: [] },
  });

  // Function to fetch tasks from the API
  // This updates the local state with tasks retrieved from the server.
  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const newColumns: { [key in ColumnKey]: Column } = {
      'to-do': { id: 'to-do', title: 'To Do', taskIds: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
      'completed': { id: 'completed', title: 'Completed', taskIds: [] },
    };

    tasks.forEach(task => {
      const columnId = task.status.toLowerCase().replace(' ', '-') as ColumnKey;
      newColumns[columnId].taskIds.push(task._id);
    });

    // Effect to update columns based on the fetched tasks
    // Maps tasks to their respective columns based on status.
    setColumns(newColumns);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle the end of a drag-and-drop event
  // Updates the task's column and status when dragged to a new location.
  // Sends an API request to update the task status on the server.
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const sourceColumnKey = findColumnOfTask(activeTaskId);
    const destinationColumnKey = findColumnOfTask(overId) || (overId as ColumnKey);

    if (!sourceColumnKey || !destinationColumnKey) return;

    if (sourceColumnKey === destinationColumnKey && activeTaskId === overId) {
      return;
    }

    setColumns(prevColumns => {
      const newColumns = JSON.parse(JSON.stringify(prevColumns));
      newColumns[sourceColumnKey].taskIds = newColumns[sourceColumnKey].taskIds.filter((id: string) => id !== activeTaskId);
      const destinationIndex = newColumns[destinationColumnKey].taskIds.indexOf(overId);
      if (destinationIndex !== -1) {
        newColumns[destinationColumnKey].taskIds.splice(destinationIndex, 0, activeTaskId);
      } else {
        newColumns[destinationColumnKey].taskIds.push(activeTaskId);
      }
      return newColumns;
    });

    if (sourceColumnKey !== destinationColumnKey) {
      const newStatus = columns[destinationColumnKey].title as Task['status'];
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === activeTaskId
            ? { ...task, status: newStatus }
            : task
        )
      );

      try {
        await api.put(`/task/${activeTaskId}/move`, { status: newStatus });
      } catch (error) {
        console.error('Failed to update task status:', error);
      }
    }
  };

  // Helper function to find the column of a given task ID
  // Searches through columns to determine where the task currently resides.
  const findColumnOfTask = (taskId: string): ColumnKey | undefined => {
    return Object.entries(columns).find(([_, column]) =>
      column.taskIds.includes(taskId)
    )?.[0] as ColumnKey | undefined;
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Low':
        return 'bg-blue-600 text-white';
      case 'Medium':
        return 'bg-yellow-600 text-white';
      case 'High':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Component representing a droppable column for tasks
  // Uses useDroppable to allow tasks to be dropped in this column.
  const DroppableColumn: React.FC<{ columnKey: ColumnKey; column: Column }> = ({ columnKey, column }) => {
    const { setNodeRef } = useDroppable({
      id: columnKey,
    });

    return (
      <Card
        className="w-full max-w-xs flex flex-col bg-gray-800 text-white"
        ref={setNodeRef}
      >
        <CardHeader>
          <CardTitle>{column.title}</CardTitle>
        </CardHeader>
        <SortableContext
          id={columnKey}
          items={column.taskIds}
          strategy={verticalListSortingStrategy}
        >
          <CardContent
            className="flex-grow flex flex-col p-2 overflow-y-auto scrollbar-hide"
            style={{ minHeight: '300px', maxHeight: '300px' }}
          >
            {column.taskIds.map((taskId) => {
              const task = tasks.find(t => t._id === taskId);
              if (!task) return null;
              return (
                <SortableTask key={`${columnKey}-${taskId}`} task={task} />
              );
            })}

            {column.taskIds.length === 0 && (
              <div className="flex-grow flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg">
                Drop tasks here
              </div>
            )}
          </CardContent>
        </SortableContext>
      </Card>
    );
  };

  // Component for rendering individual sortable tasks
  // Utilizes useSortable to enable dragging and dropping of tasks within the board.
  const SortableTask: React.FC<{ task: Task }> = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: task._id as UniqueIdentifier });

    const style = {
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <div className="bg-gray-700 p-3 rounded shadow mb-2">
          <h3 className="font-semibold mb-1 text-white">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(task.dueDate)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col justify-center items-center relative">
      <Button
        className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
        onClick={() => router.push('/tasklist')}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to Task List
      </Button>
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="flex justify-center items-start gap-4 w-full max-w-7xl">
          {(Object.entries(columns) as [ColumnKey, Column][]).map(([key, column]) => (
            <DroppableColumn key={key} columnKey={key} column={column} />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default React.memo(KanbanBoard);