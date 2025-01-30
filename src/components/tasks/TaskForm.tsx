import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "@/types/task";
import { CalendarIcon, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getTaskSuggestions } from "@/utils/taskSuggestions";
import { useToast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { useSubscription } from "@/hooks/use-subscription";

interface TaskFormProps {
  onSubmit: (task: Omit<Task, "id" | "createdAt">) => void;
  initialData?: Task;
}

const TaskForm = ({ onSubmit, initialData }: TaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priority, setPriority] = useState<Task["priority"]>(
    initialData?.priority || "medium"
  );
  const [category, setCategory] = useState(initialData?.category || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  );
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const { toast } = useToast();

  const { incrementUsage } = useSubscription();
  const { checkUsageLimit } = useFeatureAccess();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialData && !checkUsageLimit('tasks')) {
      return;
    }

    if (!dueDate) {
      toast({
        title: "Due date required",
        description: "Please select a due date for the task.",
      });
      return;
    }

    try {
      if (!initialData) {
        await incrementUsage('tasks');
      }
      
      onSubmit({
        title,
        description,
        priority,
        category,
        dueDate: dueDate.toISOString(),
        completed: initialData?.completed || false,
        timeSpent: initialData?.timeSpent || 0,
      });

      if (!initialData) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setCategory("");
        setDueDate(undefined);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
      });
    }
  };

  const handleGetSuggestions = async () => {
    if (!title) {
      toast({
        title: "Please enter a task title",
        description: "A title is required to get suggestions.",
      });
      return;
    }

    setIsGettingSuggestions(true);
    try {
      const suggestions = await getTaskSuggestions(title, description);
      setPriority(suggestions.suggestedPriority);
      setCategory(suggestions.suggestedCategory);
      toast({
        title: "Suggestions applied",
        description: "AI has suggested priority and category based on your task.",
      });
    } catch (error) {
      toast({
        title: "Error getting suggestions",
        description: "Failed to get AI suggestions. Please try again.",
      });
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full"
        />
        <Textarea
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[100px] resize-none"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select value={priority} onValueChange={(value: Task["priority"]) => setPriority(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        
        <Input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dueDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dueDate ? format(dueDate, "PPP") : <span>Due date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={setDueDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="w-full sm:w-auto">
          {initialData ? "Update" : "Add"} Task
        </Button>
        {!initialData && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGetSuggestions}
            disabled={isGettingSuggestions}
            className="w-full sm:w-auto"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Get AI Suggestions
          </Button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;