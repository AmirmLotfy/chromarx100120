
import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskCategory } from "@/types/task";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { chromeStorage } from "@/services/chromeStorageService";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  estimatedDuration: number;
  color: string;
}

interface TaskTemplatesProps {
  onUseTemplate: (template: Omit<Task, "id" | "createdAt" | "updatedAt" | "progress" | "actualDuration" | "status" | "dueDate">) => void;
}

const TaskTemplates = ({ onUseTemplate }: TaskTemplatesProps) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const result = await chromeStorage.get<TaskTemplate[]>('task_templates') || [];
      setTemplates(result);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error("Failed to load templates");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const updatedTemplates = templates.filter(template => template.id !== id);
      await chromeStorage.set('task_templates', updatedTemplates);
      setTemplates(updatedTemplates);
      toast.success("Template deleted successfully");
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error("Failed to delete template");
    }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    onUseTemplate({
      title: template.title,
      description: template.description,
      priority: template.priority,
      category: template.category,
      estimatedDuration: template.estimatedDuration,
      color: template.color,
    });
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Templates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{template.title}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: template.color }}
              />
              <span className="text-sm">{template.category}</span>
            </div>
            <Button 
              onClick={() => handleUseTemplate(template)}
              className="w-full mt-2"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskTemplates;
