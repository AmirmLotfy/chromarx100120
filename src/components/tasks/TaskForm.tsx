import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Loader2, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTaskSuggestions, suggestTimerDuration } from "@/utils/geminiUtils";
import { toast } from "sonner";
import { useLanguage } from "@/stores/languageStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface TaskFormProps {
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration">) => void;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export const TaskForm = ({ onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("work");
  const [dueDate, setDueDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [estimatedDuration, setEstimatedDuration] = useState(25);
  const { currentLanguage } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366F1");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to load categories");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add categories");
        return;
      }

      const { data, error } = await supabase
        .from('task_categories')
        .insert({
          name: newCategoryName.trim(),
          color: newCategoryColor,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setCategory(data.name as TaskCategory);
      setNewCategoryName("");
      setIsAddingCategory(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Failed to add category");
    }
  };

  const getAIRecommendations = async () => {
    setIsLoading(true);
    try {
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

      const validatedDuration = Math.min(Math.max(duration || 25, 5), 120);
      setEstimatedDuration(validatedDuration);
      
      if (taskSuggestions) {
        setSuggestions(taskSuggestions.split('\n').filter(Boolean));
      }
      
      return {
        estimatedDuration: validatedDuration,
        color: categories.find(c => c.name === category)?.color || `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      toast.error("Failed to get AI recommendations, using default values");
      return {
        estimatedDuration: estimatedDuration,
        color: categories.find(c => c.name === category)?.color || `hsl(${Math.random() * 360}, 70%, 50%)`
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
    if (step === 2 && !dueDate) {
      toast.error("Due date is required");
      return false;
    }
    if (step === 2 && dueDate && dueDate < new Date()) {
      toast.error("Due date cannot be in the past");
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateInput()) return;
    
    if (step === 1) {
      setStep(2);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    try {
      const aiRecommendations = await getAIRecommendations();

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate: dueDate?.toISOString() || new Date(Date.now() + 86400000).toISOString(), // Default to tomorrow
        status: "pending",
        ...aiRecommendations
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("work");
      setDueDate(undefined);
      setSuggestions([]);
      setStep(1);

      toast.success("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500"
  };

  return (
    <div className="relative pb-4">
      <div className="mb-6">
        <Progress value={step === 1 ? 50 : 100} className="h-1" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Basic info</span>
          <span>Details</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">Task Title</Label>
            <Input
              id="title"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base w-full"
              maxLength={100}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about your task"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] text-base w-full px-3 py-2.5 resize-y"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {["low", "medium", "high"].map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? "default" : "outline"}
                  className={cn(
                    "h-12 capitalize",
                    priority === p && priorityColors[p as TaskPriority]
                  )}
                  onClick={() => setPriority(p as TaskPriority)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleNextStep} 
            className="w-full h-12 mt-4 text-base"
            disabled={!title.trim()}
          >
            Continue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Category</Label>
            <div className="flex gap-2">
              <Select
                value={category}
                onValueChange={(value: TaskCategory) => setCategory(value)}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    type="button"
                    className="shrink-0 h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoryName">Category name</Label>
                      <Input
                        id="categoryName"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoryColor">Color</Label>
                      <Input
                        id="categoryColor"
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-12 px-2"
                      />
                    </div>
                    <Button 
                      onClick={handleAddCategory}
                      className="w-full"
                    >
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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

          <div className="space-y-2">
            <Label className="text-base font-medium">Estimated Duration</Label>
            <div className="flex items-center gap-3 border rounded-md p-3 bg-background">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="w-full flex gap-2 items-center">
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-20 h-10 text-center"
                />
                <span className="text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="p-4 bg-accent/30 rounded-lg border border-accent">
              <h4 className="font-medium mb-2">AI Suggestions:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-1/3 h-12"
              onClick={handlePrevStep}
            >
              Back
            </Button>
            <Button 
              className="w-2/3 h-12 text-base"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Task...
                </>
              ) : (
                "Add Task"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
