
import { storage } from './storage';
import { isExtensionEnvironment, isBrowserEnvironment } from '@/utils/environmentUtils';

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

type MessageCallback = (data: any) => void;
type ServiceWorkerStatus = 'unregistered' | 'registered' | 'active' | 'error';

/**
 * Central controller for service worker communication and management
 */
class ServiceWorkerController {
  private registration: ServiceWorkerRegistration | null = null;
  private messageListeners: Map<string, Set<MessageCallback>> = new Map();
  private status: ServiceWorkerStatus = 'unregistered';
  private serviceWorkerPath: string;

  constructor() {
    // Use the appropriate service worker based on environment
    this.serviceWorkerPath = isExtensionEnvironment() 
      ? '/service-worker.js'  // Extension service worker
      : '/optimized-service-worker.js';  // Web app service worker
  }

  /**
   * Initialize and register the service worker
   */
  async initialize(customPath?: string): Promise<boolean> {
    if (!isBrowserEnvironment() || !('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this environment');
      this.status = 'error';
      return false;
    }

    try {
      // Use custom path if provided
      const swPath = customPath || this.serviceWorkerPath;
      console.log(`Registering service worker from: ${swPath}`);
      this.registration = await navigator.serviceWorker.register(swPath);
      
      this.status = this.registration.active ? 'active' : 'registered';
      console.log('Service worker registered successfully:', this.registration.scope);
      
      // Set up message listener
      navigator.serviceWorker.addEventListener('message', this.handleMessage);
      
      // Store registration information
      await storage.storage.set('serviceWorkerRegistration', {
        timestamp: Date.now(),
        scope: this.registration.scope,
        status: this.status
      });
      
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      this.status = 'error';
      return false;
    }
  }

  /**
   * Send a message to the service worker
   */
  async sendMessage(message: ServiceWorkerMessage): Promise<boolean> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      console.warn('Service worker not active, cannot send message');
      return false;
    }

    try {
      navigator.serviceWorker.controller.postMessage(message);
      return true;
    } catch (error) {
      console.error('Error sending message to service worker:', error);
      return false;
    }
  }

  /**
   * Create a two-way communication channel with the service worker
   * Returns a Promise that resolves with the response from the service worker
   */
  async sendMessageWithResponse(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      console.warn('Service worker not active, cannot send message');
      return null;
    }

    return new Promise((resolve) => {
      // Create a unique ID for this message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a one-time message listener
      const responseHandler = (event: MessageEvent) => {
        if (event.data && event.data.messageId === messageId) {
          navigator.serviceWorker.removeEventListener('message', responseHandler);
          resolve(event.data.payload);
        }
      };
      
      // Add the listener
      navigator.serviceWorker.addEventListener('message', responseHandler);
      
      // Send the message with the ID
      navigator.serviceWorker.controller.postMessage({
        ...message,
        messageId
      });
      
      // Set a timeout to clean up if no response is received
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', responseHandler);
        resolve(null);
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Subscribe to service worker messages of a specific type
   */
  subscribe(messageType: string, callback: MessageCallback): () => void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, new Set());
    }
    
    this.messageListeners.get(messageType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(messageType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Check if the service worker is ready and active
   */
  isReady(): boolean {
    return this.status === 'active' && !!this.registration?.active;
  }

  /**
   * Get current service worker status
   */
  getStatus(): ServiceWorkerStatus {
    return this.status;
  }

  /**
   * Update the service worker
   */
  async update(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Service worker update failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<boolean> {
    if (!this.registration || !this.registration.waiting) {
      return false;
    }

    try {
      // Send skip waiting message to the waiting service worker
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Service worker skip waiting failed:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      return await this.registration.unregister();
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Handle incoming messages from the service worker
   */
  private handleMessage = (event: MessageEvent): void => {
    const { type, payload } = event.data || {};
    
    if (!type) return;
    
    // Notify all listeners for this message type
    const listeners = this.messageListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in service worker message handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Get caching status from the service worker
   */
  async getCacheStatus(): Promise<any> {
    return this.sendMessageWithResponse({ type: 'GET_CACHE_STATUS' });
  }

  /**
   * Clear the service worker cache
   */
  async clearCache(): Promise<boolean> {
    return this.sendMessage({ type: 'CLEAR_CACHE' });
  }

  /**
   * Schedule a background task
   */
  async scheduleTask(taskType: string, taskData: any, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<string | null> {
    const response = await this.sendMessageWithResponse({
      type: 'SCHEDULE_TASK',
      payload: {
        taskType,
        taskData,
        priority,
        timestamp: Date.now()
      }
    });
    
    return response?.taskId || null;
  }

  /**
   * Process background tasks
   */
  async processTasks(): Promise<boolean> {
    return this.sendMessage({ type: 'PROCESS_TASKS' });
  }

  /**
   * Get list of pending background tasks
   */
  async getPendingTasks(): Promise<any[]> {
    const response = await this.sendMessageWithResponse({ type: 'GET_PENDING_TASKS' });
    return response?.tasks || [];
  }
}

// Export singleton instance
export const serviceWorkerController = new ServiceWorkerController();

// Auto-initialize when imported
serviceWorkerController.initialize();

export default serviceWorkerController;
