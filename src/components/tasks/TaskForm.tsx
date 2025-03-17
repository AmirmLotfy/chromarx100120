import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Plus } from 'lucide-react';
import { generateTaskSuggestions, suggestTimerDuration } from '@/utils/geminiUtils';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskPriority } from '@/types/task';

export interface TaskFormProps {
  onTaskAdded: () => void;
  onCancel: () => void;
  onSubmit?: (taskData: Omit<Task, "progress" | "id" | "createdAt" | "updatedAt" | "actualDuration">) => Promise<void>;
  initialValues?: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    category?: string;
    estimatedDuration?: number;
  };
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  onTaskAdded, 
  onCancel, 
  onSubmit,
  initialValues 
}) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(initialValues?.dueDate || new Date());
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || 'medium');
  const [category, setCategory] = useState(initialValues?.category || 'Work');
  const [estimatedDuration, setEstimatedDuration] = useState(initialValues?.estimatedDuration || 60);
  const [categories, setCategories] = useState<{ name: string; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    generateSuggestions();
  }, []);

  useEffect(() => {
    if (title && description) {
      suggestDuration();
    }
  }, [title, description]);

  const fetchCategories = async () => {
    try {
      const result = await supabase
        .from('task_categories')
        .select('*')
        .execute();

      const data = result.data || [];
      const defaultCategories = [
        { name: 'Work', color: '#4f46e5' },
        { name: 'Personal', color: '#ec4899' },
        { name: 'Learning', color: '#8b5cf6' },
        { name: 'Health', color: '#10b981' },
      ];
      
      setCategories(data.length > 0 ? data : defaultCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { name: 'Work', color: '#4f46e5' },
        { name: 'Personal', color: '#ec4899' },
        { name: 'Learning', color: '#8b5cf6' },
        { name: 'Health', color: '#10b981' },
      ]);
    }
  };

  const generateSuggestions = async () => {
    try {
      const suggestions = await generateTaskSuggestions('');
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const suggestDuration = async () => {
    try {
      const context = `Task: ${title}. ${description}`;
      const suggestedDuration = await suggestTimerDuration(context, 'focus');
      setEstimatedDuration(suggestedDuration * 60); // Convert minutes to seconds
    } catch (error) {
      console.error('Error suggesting duration:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({
          title,
          description,
          dueDate: dueDate.toISOString(),
          priority,
          category,
          color: categories.find(c => c.name === category)?.color || '#4f46e5',
          estimatedDuration,
          status: 'pending'
        });
      } else {
        const categoryColor = categories.find(c => c.name === category)?.color || '#4f46e5';

        await supabase.from('tasks').insert({
          title,
          description,
          due_date: dueDate.toISOString(),
          priority,
          category,
          color: categoryColor,
          estimated_duration: estimatedDuration,
          status: 'pending',
          user_id: 'current-user', // In a real app, get from auth
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).single();

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      }
      
      onTaskAdded();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    setPriority(suggestion.priority);
    setCategory(suggestion.category);
  };

  const minutesToHumanReadable = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Task Name</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Due Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="duration">Estimated Duration</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="duration"
                type="number"
                min="1"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">minutes</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
      
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Suggested Tasks:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => applySuggestion(suggestion)}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      applySuggestion(suggestion);
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
