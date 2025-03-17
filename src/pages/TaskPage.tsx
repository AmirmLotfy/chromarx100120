
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Trash, Edit, Filter, CheckCircle, Circle, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks/TaskForm";
import TaskAnalytics from "@/components/tasks/TaskAnalytics";
import TaskTemplates from "@/components/tasks/TaskTemplates";
import { localStorageClient as supabase } from "@/lib/local-storage-client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Task } from "@/types/task";

const TaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewingTask, setIsViewingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [channel, setChannel] = useState<any>(null);

  // Fetch tasks
  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription
    const taskChannel = supabase.channel('task-changes');
    const subscription = taskChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        fetchTasks();
      }
    );

    setChannel(taskChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete project proposal',
          description: 'Finish drafting the proposal for the new client project',
          priority: 'high',
          category: 'Work',
          status: 'pending',
          dueDate: new Date().toISOString(),
          estimatedDuration: 120,
          actualDuration: null,
          color: '#4f46e5',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'demo-user'
        },
        {
          id: '2',
          title: 'Weekly team meeting',
          description: 'Regular sync-up with the development team',
          priority: 'medium',
          category: 'Work',
          status: 'in-progress',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          estimatedDuration: 60,
          actualDuration: null,
          color: '#4f46e5',
          progress: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'demo-user'
        }
      ];
      
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (taskData: Omit<Task, "progress" | "id" | "createdAt" | "updatedAt" | "actualDuration">) => {
    try {
      // Simulate adding a task
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        progress: 0,
        actualDuration: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'demo-user'
      };
      
      setTasks([...tasks, newTask]);
      toast.success('Task added successfully');
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return false;
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      );
      setTasks(updatedTasks);
      toast.success('Task updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return false;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return task.status === "pending";
    if (activeTab === "in-progress") return task.status === "in-progress";
    if (activeTab === "completed") return task.status === "completed";
    return true;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setIsAddingTask(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading state
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="opacity-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Loading...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No tasks found</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddingTask(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first task
                </Button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <Card 
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTask(task);
                    setIsViewingTask(true);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md">{task.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setIsEditingTask(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          {task.status !== 'completed' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTask(task.id, { status: 'completed', progress: 100 });
                            }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(new Date(task.dueDate), 'PPP')}
                    </div>
                    
                    <div className="flex space-x-2 mb-3">
                      <Badge style={{ backgroundColor: task.color }}>
                        {task.category}
                      </Badge>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm 
            onCancel={() => setIsAddingTask(false)}
            onTaskAdded={() => {
              setIsAddingTask(false);
              fetchTasks();
            }}
            onSubmit={handleAddTask}
          />
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      {selectedTask && (
        <Dialog open={isViewingTask} onOpenChange={setIsViewingTask}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Badge style={{ backgroundColor: selectedTask.color }}>
                  {selectedTask.category}
                </Badge>
                <Badge variant={
                  selectedTask.priority === 'high' ? 'destructive' : 
                  selectedTask.priority === 'medium' ? 'secondary' : 'outline'
                }>
                  {selectedTask.priority}
                </Badge>
                <Badge variant="outline">{selectedTask.status}</Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Due: {format(new Date(selectedTask.dueDate), 'PPP')}
              </div>
              
              {selectedTask.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTask.description}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-1">Progress</h3>
                <Progress value={selectedTask.progress} className="h-2 mb-1" />
                <div className="flex justify-between text-xs">
                  <span>{selectedTask.progress}% complete</span>
                  <span>
                    Estimated: {selectedTask.estimatedDuration} minutes
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewingTask(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewingTask(false);
                  setIsEditingTask(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Task Dialog */}
      {selectedTask && (
        <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm 
              initialValues={{
                title: selectedTask.title,
                description: selectedTask.description,
                dueDate: new Date(selectedTask.dueDate),
                priority: selectedTask.priority,
                category: selectedTask.category,
                estimatedDuration: selectedTask.estimatedDuration
              }}
              onCancel={() => setIsEditingTask(false)}
              onTaskAdded={() => {
                setIsEditingTask(false);
                fetchTasks();
              }}
              onSubmit={async (taskData) => {
                await handleUpdateTask(selectedTask.id, taskData);
                return true;
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskPage;
