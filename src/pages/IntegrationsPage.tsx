
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, Chrome, ExternalLink, Info, Link2, Plug, RefreshCw, Shield, Wrench } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { requestPermissions, removePermissions, hasPermissions } from "@/utils/permissionUtils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  status: "active" | "inactive" | "connected" | "error";
  permissions: string[];
  defaultEnabled: boolean;
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "chrome-sync",
      name: "Chrome Sync",
      description: "Sync with Chrome's native bookmarks",
      icon: <Chrome className="h-8 w-8" />,
      enabled: true,
      status: "active",
      permissions: ["bookmarks", "tabs"],
      defaultEnabled: true
    },
    {
      id: "browser-history",
      name: "Browsing History",
      description: "Analyze and recommend based on your history",
      icon: <RefreshCw className="h-8 w-8" />,
      enabled: false,
      status: "inactive",
      permissions: ["history"],
      defaultEnabled: false
    },
    {
      id: "tab-manager",
      name: "Tab Manager Integration",
      description: "Manage and organize your open tabs",
      icon: <Wrench className="h-8 w-8" />,
      enabled: false,
      status: "inactive",
      permissions: ["tabs"],
      defaultEnabled: false
    },
    {
      id: "content-blocker",
      name: "Content Blocker",
      description: "Block distracting content while you work",
      icon: <Shield className="h-8 w-8" />,
      enabled: false,
      status: "inactive",
      permissions: ["webRequest", "webRequestBlocking", "tabs"],
      defaultEnabled: false
    }
  ]);

  // Check which permissions are already granted on mount
  useEffect(() => {
    const checkExistingPermissions = async () => {
      const updatedIntegrations = [...integrations];
      let hasChanges = false;

      for (let i = 0; i < updatedIntegrations.length; i++) {
        const integration = updatedIntegrations[i];
        const hasRequiredPermissions = await hasPermissions({ 
          permissions: integration.permissions as chrome.permissions.Permissions['permissions']
        });

        if (hasRequiredPermissions && !integration.enabled) {
          updatedIntegrations[i] = {
            ...integration,
            enabled: true,
            status: "active"
          };
          hasChanges = true;
        } else if (!hasRequiredPermissions && integration.enabled) {
          updatedIntegrations[i] = {
            ...integration,
            enabled: false,
            status: "inactive"
          };
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setIntegrations(updatedIntegrations);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.permissions) {
      checkExistingPermissions();
    }
  }, []);

  const toggleIntegration = async (id: string) => {
    if (!user) {
      toast.error("Please sign in to manage integrations");
      return;
    }

    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    if (!integration.enabled) {
      // Request permissions using our utility
      if (typeof chrome !== 'undefined' && chrome.permissions) {
        toast.info(`Requesting permissions for ${integration.name}...`);
        
        const granted = await requestPermissions({ 
          permissions: integration.permissions as chrome.permissions.Permissions['permissions']
        });
        
        if (granted) {
          setIntegrations(integrations.map(i => 
            i.id === id ? { ...i, enabled: true, status: "active" } : i
          ));
        }
      } else {
        // In development or non-extension environment
        setIntegrations(integrations.map(i => 
          i.id === id ? { ...i, enabled: true, status: "active" } : i
        ));
        toast.success(`${integration.name} enabled successfully!`);
      }
    } else {
      // Remove permissions if possible
      if (typeof chrome !== 'undefined' && chrome.permissions) {
        await removePermissions({ 
          permissions: integration.permissions as chrome.permissions.Permissions['permissions']
        });
      }
      
      setIntegrations(integrations.map(i => 
        i.id === id ? { ...i, enabled: false, status: "inactive" } : i
      ));
      toast.info(`${integration.name} disabled`);
    }
  };

  const resetAllIntegrations = () => {
    setIntegrations(integrations.map(i => ({ 
      ...i, 
      enabled: i.defaultEnabled,
      status: i.defaultEnabled ? "active" : "inactive"
    })));
    toast.success("All integrations reset to default settings");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "connected":
        return <Badge variant="default" className="bg-blue-500">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "inactive":
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Plug className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Integrations</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetAllIntegrations}
            >
              Reset All
            </Button>
          </div>
        </div>

        {!user && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Sign in required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Some integrations require you to be signed in to manage permissions and settings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {integration.name}
                        {getStatusBadge(integration.status)}
                      </CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      Required Permissions
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {integration.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Info className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm mr-1">
                    {integration.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={integration.enabled}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Extension Permissions</CardTitle>
            <CardDescription>
              Information about permissions used by ChroMarx
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">bookmarks</h3>
                  <p className="text-sm text-muted-foreground">
                    Allows the extension to read and modify your bookmarks. This is essential for the core functionality of ChroMarx.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Needed to store your settings, preferences, and bookmarks metadata locally.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">identity</h3>
                  <p className="text-sm text-muted-foreground">
                    Used for Google authentication to sync your data across devices.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">tabs</h3>
                  <p className="text-sm text-muted-foreground">
                    Allows the extension to access the title and URL of open tabs (used for quick bookmarking).
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">sidePanel</h3>
                  <p className="text-sm text-muted-foreground">
                    Enables the extension to create and display a side panel interface.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm" className="gap-1">
              <ExternalLink className="h-4 w-4" />
              <span>Chrome Privacy Policy</span>
            </Button>
            <Button variant="outline" size="sm">Manage Chrome Permissions</Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default IntegrationsPage;
