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
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { toast } from "sonner";

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

  const getAIRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await getGeminiResponse({
        prompt: `Task: ${title}\nDescription: ${description}`,
        type: "timer",
        language: "en"
      });
      
      const duration = parseInt(response.result);
      return {
        estimatedDuration: duration,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations");
      return {
        estimatedDuration: 25,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const aiRecommendations = await getAIRecommendations();

    onSubmit({
      title,
      description,
      priority,
      category,
      dueDate: dueDate.toISOString(),
      status: "pending",
      ...aiRecommendations
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("work");
    setDueDate(undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
        required
      />
      
      <Textarea
        placeholder="Task description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full"
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
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Getting AI recommendations..." : "Add Task"}
      </Button>
    </form>
  );
};

export default TaskForm;