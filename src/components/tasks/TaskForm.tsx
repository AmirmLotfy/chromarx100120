
import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskCategory } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateTaskSuggestions, suggestTimerDuration } from "@/utils/geminiUtils";
import { toast } from "sonner";
import { useLanguage } from "@/stores/languageStore";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export const TaskForm = ({
  onSubmit
}: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("work");
  const [dueDate, setDueDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [estimatedDuration, setEstimatedDuration] = useState(25);
  const {
    currentLanguage
  } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366F1");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('task_categories').select('*').order('name');
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add categories");
        return;
      }
      const {
        data,
        error
      } = await supabase.from('task_categories').insert({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        user_id: user.id
      }).select().single();
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
        dueDate: dueDate?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
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

  return (
    <div className="relative max-w-md mx-auto w-full px-4 pb-6">
      <div className="mb-5">
        <Progress value={step === 1 ? 50 : 100} className="h-1.5 bg-gray-200" indicatorClassName="bg-gradient-to-r from-primary to-purple-500" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Task info</span>
          <span>Details</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-medium">What's your task?</Label>
            <Input 
              id="title" 
              placeholder="Enter task title..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              maxLength={100} 
              required 
              className="h-14 text-base w-full rounded-xl border-input/60"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-medium">Description (optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Add details about your task..." 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="min-h-[120px] text-base w-full rounded-xl border-input/60 resize-y" 
              maxLength={500} 
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Priority</Label>
            <div className="grid grid-cols-3 gap-3">
              {["low", "medium", "high"].map(p => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? "default" : "outline"}
                  className={cn(
                    "h-14 text-base rounded-xl capitalize transition-all",
                    priority === p && (
                      p === "high" ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500" :
                      p === "medium" ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500" :
                      "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500"
                    )
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
            className="w-full h-14 mt-5 text-base rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary shadow-md"
            disabled={!title.trim()}
          >
            Continue
            <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-base font-medium">Category</Label>
            <div className="flex gap-2 w-full">
              <Select value={category} onValueChange={(value: TaskCategory) => setCategory(value)}>
                <SelectTrigger className="w-full h-14 rounded-xl border-input/60">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                          backgroundColor: cat.color
                        }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" type="button" className="h-14 w-14 rounded-xl">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[340px] w-[calc(100%-2rem)] max-w-full mx-auto rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-3">
                    <div className="grid gap-2">
                      <Label htmlFor="categoryName">Category name</Label>
                      <Input 
                        id="categoryName" 
                        placeholder="Enter category name" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)} 
                        className="h-12 rounded-lg" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoryColor">Color</Label>
                      <Input 
                        id="categoryColor" 
                        type="color" 
                        value={newCategoryColor} 
                        onChange={e => setNewCategoryColor(e.target.value)} 
                        className="h-12 px-2 rounded-lg" 
                      />
                    </div>
                    <Button 
                      onClick={handleAddCategory} 
                      className="mt-2 h-12 rounded-lg bg-gradient-to-r from-primary to-purple-600"
                    >
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-14 justify-start text-left font-normal rounded-xl border-input/60"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {dueDate ? format(dueDate, "PPP") : <span>Select due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={dueDate} 
                  onSelect={setDueDate} 
                  initialFocus 
                  disabled={date => date < new Date()} 
                  className="rounded-lg border shadow-lg"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Estimated Duration</Label>
            <div className="flex items-center gap-3 border rounded-xl p-4 bg-accent/20">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="w-full flex items-center gap-3">
                <Input 
                  type="number" 
                  min={5} 
                  max={120} 
                  value={estimatedDuration} 
                  onChange={e => setEstimatedDuration(Number(e.target.value))} 
                  className="w-20 h-12 text-center rounded-lg" 
                />
                <span className="text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-accent/30 to-accent/10 rounded-xl border border-accent">
              <h4 className="font-medium mb-2 flex items-center">
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full mr-2">AI</span>
                Suggestions
              </h4>
              <ul className="space-y-2 text-sm">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-1/3 h-14 rounded-xl" 
              onClick={handlePrevStep}
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              Back
            </Button>
            <Button 
              className="w-2/3 h-14 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary shadow-md"
              disabled={isLoading} 
              onClick={handleSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : "Create Task"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskForm;
