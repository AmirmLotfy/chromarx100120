
import { useState } from "react";
import { Task, TaskPriority, TaskCategory } from "@/types/task";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTaskSuggestions, suggestTimerDuration } from "@/utils/geminiUtils";
import { toast } from "sonner";
import { useLanguage } from "@/stores/languageStore";

interface TaskFormProps {
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration">) => void;
}

export const TaskForm = ({ onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("work");
  const [dueDate, setDueDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { currentLanguage } = useLanguage();

  const getAIRecommendations = async () => {
    setIsLoading(true);
    try {
      // Get both duration and suggestions concurrently
      const [duration, taskSuggestions] = await Promise.all([
        suggestTimerDuration(
          `Task: ${title}\nDescription: ${description}\nPriority: ${priority}\nCategory: ${category}`,
          currentLanguage.code
        ),
        generateTaskSuggestions(
          `Task: ${title}\nDescription: ${description}\nPriority: ${priority}\nCategory: ${category}`,
          currentLanguage.code
        )
      ]);

      // Validate duration is within reasonable bounds
      const validatedDuration = Math.min(Math.max(duration || 25, 5), 120);
      
      if (taskSuggestions) {
        setSuggestions(taskSuggestions.split('\n').filter(Boolean));
      }
      
      return {
        estimatedDuration: validatedDuration,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations, using default values");
      return {
        estimatedDuration: 25,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return false;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return false;
    }
    if (dueDate < new Date()) {
      toast.error("Due date cannot be in the past");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    try {
      const aiRecommendations = await getAIRecommendations();

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate: dueDate.toISOString(),
        status: "pending",
        ...aiRecommendations
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("work");
      setDueDate(undefined);
      setSuggestions([]);

      toast.success("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
        maxLength={100}
        required
      />
      
      <Textarea
        placeholder="Task description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full"
        maxLength={500}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={priority}
          onValueChange={(value: TaskPriority) => setPriority(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(value: TaskCategory) => setCategory(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="study">Study</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[180px] justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {suggestions.length > 0 && (
        <div className="p-4 bg-accent/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">AI Suggestions:</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Task...
          </>
        ) : (
          "Add Task"
        )}
      </Button>
    </form>
  );
};

export default TaskForm;
