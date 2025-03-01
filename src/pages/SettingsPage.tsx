
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/stores/settingsStore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import { cn } from "@/lib/utils";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { 
  Settings,
  Search,
  RotateCcw,
  PaintBucket,
  Shield,
  Bell,
  FileText,
  ChevronRight,
  X
} from "lucide-react";
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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
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

  const handleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  };

  const settingTabs = [
    { id: "appearance", label: "Appearance", icon: <PaintBucket /> },
    { id: "privacy", label: "Privacy", icon: <Shield /> },
    { id: "notifications", label: "Alerts", icon: <Bell /> },
    { id: "legal", label: "Legal", icon: <FileText /> },
  ];

  return (
    <Layout>
      <div className="bg-background min-h-screen overflow-hidden">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between px-4 py-3 border-b border-border/30 backdrop-blur-md bg-background/90 fixed top-14 left-0 right-0 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {!isSearchActive ? (
              <motion.div 
                key="title"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Settings className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                className="w-full flex items-center gap-2"
                initial={{ opacity: 0, width: "50%" }}
                animate={{ opacity: 1, width: "100%" }}
                exit={{ opacity: 0, width: "50%" }}
              >
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    type="text"
                    placeholder="Search settings..."
                    className="pl-9 pr-8 h-9 text-sm w-full bg-muted/40 border-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleSearch}
            >
              {!isSearchActive ? (
                <Search className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
            
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-xl">
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
        </motion.div>

        {/* Navigation Pills */}
        <div className="pt-20 pb-2 px-4">
          <motion.div 
            className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {settingTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  "h-4 w-4",
                  activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {activeTab === "appearance" && <AppearanceSettings />}
              {activeTab === "privacy" && <PrivacySettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "legal" && <LegalAndFeedback />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
