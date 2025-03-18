
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";
import { StorageManager } from "@/components/data-processing/StorageManager";
import { AlarmManager } from "@/components/data-processing/AlarmManager";
import { BackgroundStreamProcessor } from "@/components/BackgroundStreamProcessor";

export function ServiceWorkerDashboard() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Service Worker Orchestration</h1>
      <p className="text-muted-foreground">
        Manage background tasks, storage, and service worker operations
      </p>
      
      <Tabs defaultValue="service-worker">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="service-worker">Service Worker</TabsTrigger>
          <TabsTrigger value="background-tasks">Background Tasks</TabsTrigger>
          <TabsTrigger value="storage">Chrome Storage</TabsTrigger>
          <TabsTrigger value="alarms">Scheduled Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="service-worker" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Manage the service worker that powers background processing and offline capabilities.
          </p>
          <ServiceWorkerManager />
        </TabsContent>
        
        <TabsContent value="background-tasks" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Monitor and control background processing tasks using the Streams API.
          </p>
          <BackgroundStreamProcessor />
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Manage chrome.storage.local usage and see what's being stored.
          </p>
          <StorageManager />
        </TabsContent>
        
        <TabsContent value="alarms" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Schedule and manage recurring tasks using chrome.alarms.
          </p>
          <AlarmManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ServiceWorkerDashboard;
