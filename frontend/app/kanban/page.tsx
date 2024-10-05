"use client";
import React, { useState, useEffect } from 'react';
import useApi from "../utils/useApi";
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  closestCorners,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  SortableContext,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable, UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [columns, setColumns] = useState<{ [key in ColumnKey]: Column }>({
    'to-do': { id: 'to-do', title: 'To Do', taskIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
    'completed': { id: 'completed', title: 'Completed', taskIds: [] },
  });

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

    setColumns(newColumns);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

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
      
      if (sourceColumnKey === destinationColumnKey) {
        const oldIndex = prevColumns[sourceColumnKey].taskIds.indexOf(activeTaskId);
        const newIndex = prevColumns[destinationColumnKey].taskIds.indexOf(overId);
        newColumns[destinationColumnKey].taskIds = arrayMove(
          prevColumns[destinationColumnKey].taskIds,
          oldIndex,
          newIndex
        );
      } else {
        const destinationIndex = newColumns[destinationColumnKey].taskIds.indexOf(overId);
        if (destinationIndex !== -1) {
          newColumns[destinationColumnKey].taskIds.splice(destinationIndex, 0, activeTaskId);
        } else {
          newColumns[destinationColumnKey].taskIds.push(activeTaskId);
        }
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

  const findColumnOfTask = (taskId: string): ColumnKey | undefined => {
    return Object.entries(columns).find(([_, column]) =>
      column.taskIds.includes(taskId)
    )?.[0] as ColumnKey | undefined;
  };

  const getActiveTask = () => {
    if (!activeId) return null;
    return tasks.find(task => task._id === activeId);
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

  const TaskCard: React.FC<{ task: Task; isDragging?: boolean }> = ({ task, isDragging = false }) => {
    return (
      <div className={`bg-gray-700 p-3 rounded shadow mb-2 transition-all duration-200 ${
        isDragging ? 'opacity-75 scale-105' : ''
      }`}>
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
    );
  };

  const DroppableColumn: React.FC<{ columnKey: ColumnKey; column: Column }> = ({ columnKey, column }) => {
    const { setNodeRef } = useDroppable({
      id: columnKey,
    });

    return (
      <Card
        className="w-full max-w-xs flex flex-col bg-gray-800 text-white transition-colors duration-200"
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
              <div className="flex-grow flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg transition-all duration-200">
                Drop tasks here
              </div>
            )}
          </CardContent>
        </SortableContext>
      </Card>
    );
  };

  const SortableTask: React.FC<{ task: Task }> = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task._id as UniqueIdentifier });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : undefined,
      cursor: 'grab',
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <TaskCard task={task} isDragging={isDragging} />
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div className="flex justify-center items-start gap-4 w-full max-w-7xl">
          {(Object.entries(columns) as [ColumnKey, Column][]).map(([key, column]) => (
            <DroppableColumn key={key} columnKey={key} column={column} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? <TaskCard task={getActiveTask()!} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default React.memo(KanbanBoard);
