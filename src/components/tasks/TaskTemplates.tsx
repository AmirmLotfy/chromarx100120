
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TaskTemplatesProps {
  onUseTemplate: () => void;
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({ onUseTemplate }) => {
  const templates = [
    {
      id: '1',
      title: 'Daily Work Routine',
      description: 'Standard daily work tasks for productivity',
      tasks: [
        { title: 'Check emails', priority: 'high', estimated_time: 30 },
        { title: 'Team standup meeting', priority: 'high', estimated_time: 15 },
        { title: 'Project planning', priority: 'medium', estimated_time: 45 },
      ],
    },
    {
      id: '2',
      title: 'Weekly Review',
      description: 'End of week review and planning tasks',
      tasks: [
        { title: 'Review completed tasks', priority: 'medium', estimated_time: 30 },
        { title: 'Plan next week', priority: 'high', estimated_time: 60 },
        { title: 'Send progress report', priority: 'high', estimated_time: 30 },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-lg">Task Templates</CardTitle>
        <CardDescription>
          Save time by using pre-defined task templates
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-0 space-y-2">
        {templates.map((template) => (
          <Card key={template.id} className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{template.title}</h3>
                <p className="text-xs text-gray-500">{template.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {template.tasks.length} tasks · {template.tasks.reduce((acc, task) => acc + task.estimated_time, 0)} min
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={onUseTemplate}>
                Use
              </Button>
            </div>
          </Card>
        ))}
      </CardContent>
    </div>
  );
};

export default TaskTemplates;
