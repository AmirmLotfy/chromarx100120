
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Shield, Bell, PaintBucket, FileText, User, ChevronRight, Settings, Search, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/stores/settingsStore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const settings = useSettings();
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  // Settings map for search functionality
  const settingsMap = {
    "theme": "appearance",
    "dark mode": "appearance",
    "light mode": "appearance",
    "color": "appearance",
    "scheme": "appearance",
    "purple": "appearance",
    "blue": "appearance",
    "green": "appearance",
    "contrast": "appearance",
    "high contrast": "appearance",
    
    "privacy": "privacy",
    "data": "privacy",
    "collection": "privacy",
    "analytics": "privacy",
    "affiliate": "privacy",
    "banner": "privacy",
    "bookmarks": "privacy",
    "auto detect": "privacy",
    "experimental": "privacy",
    "beta": "privacy",
    "cloud": "privacy",
    "backup": "privacy",
    "sync": "privacy",
    
    "notification": "notifications",
    "alert": "notifications",
    "update": "notifications",
    "reminder": "notifications",
    
    "legal": "legal",
    "feedback": "legal",
    "terms": "legal",
    "policy": "legal",
    "service": "legal",
  };

  // Effect to set active tab based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") return;
    
    const query = searchQuery.toLowerCase();
    for (const [key, value] of Object.entries(settingsMap)) {
      if (key.includes(query)) {
        setActiveTab(value);
        return;
      }
    }
  }, [searchQuery]);

  const handleResetSettings = () => {
    settings.resetSettings();
    setResetDialogOpen(false);
    toast.success("Settings have been reset to defaults");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Create a smaller icon size for very small screens
  const iconSize = isMobile ? 16 : 20;

  return (
    <Layout>
      <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} h-full flex flex-col`}>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1 flex-shrink-0 pt-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold tracking-tight`}>Settings</h1>
            </div>
            
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {!isMobile && <span>Reset</span>}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reset Settings</DialogTitle>
                  <DialogDescription>
                    This will reset all settings to their default values. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleResetSettings}>Reset Settings</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
            Customize your experience
          </p>
          
          <div className={`relative mt-3 ${isMobile ? 'mb-2' : 'mb-3'}`}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search settings..."
              className={`pl-9 ${isMobile ? 'h-9 text-sm' : 'h-10'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        <div className="flex-1 overflow-hidden mt-1 pb-16">
          <Tabs defaultValue="appearance" className="h-full flex flex-col" 
            value={activeTab} 
            onValueChange={setActiveTab}
          >
            <TabsList className={`justify-start overflow-x-auto px-0 ${isMobile ? 'h-10' : 'h-12'} w-full bg-transparent space-x-1.5 mb-4`}>
              {[
                { value: "appearance", label: "Appearance", icon: <PaintBucket className={`h-${isMobile ? '3.5' : '4'} w-${isMobile ? '3.5' : '4'}`} /> },
                { value: "privacy", label: "Privacy", icon: <Shield className={`h-${isMobile ? '3.5' : '4'} w-${isMobile ? '3.5' : '4'}`} /> },
                { value: "notifications", label: "Alerts", icon: <Bell className={`h-${isMobile ? '3.5' : '4'} w-${isMobile ? '3.5' : '4'}`} /> },
                { value: "legal", label: "Legal", icon: <FileText className={`h-${isMobile ? '3.5' : '4'} w-${isMobile ? '3.5' : '4'}`} /> }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className={cn(
                    "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
                    "rounded-full flex items-center gap-1.5",
                    "transition-all duration-200",
                    isMobile ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm gap-2"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className={`flex-1 overflow-y-auto max-w-[550px] mx-auto w-full ${isMobile ? 'pb-4' : 'pb-8'}`}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <TabsContent value="appearance" className="mt-0">
                  <AppearanceSettings />
                </TabsContent>

                <TabsContent value="privacy" className="mt-0">
                  <PrivacySettings />
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                  <NotificationSettings />
                </TabsContent>

                <TabsContent value="legal" className="mt-0">
                  <LegalAndFeedback />
                </TabsContent>
              </motion.div>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
