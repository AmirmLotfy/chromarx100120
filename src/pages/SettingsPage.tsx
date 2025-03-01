
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/stores/settingsStore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import PrivacySettings from "@/components/settings/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Settings,
  Search,
  RotateCcw,
  PaintBucket,
  Shield,
  Bell,
  FileText,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
    "animation": "appearance",
    
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
    { id: "appearance", label: "Appearance", icon: <PaintBucket size={20} /> },
    { id: "privacy", label: "Privacy", icon: <Shield size={20} /> },
    { id: "notifications", label: "Alerts", icon: <Bell size={20} /> },
    { id: "legal", label: "Legal", icon: <FileText size={20} /> },
  ];

  // Spring animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren", 
        staggerChildren: 0.1,
        duration: 0.3
      } 
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: { 
        duration: 0.2 
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header - Added pt-16 to account for the fixed top-14 header */}
        <motion.div 
          className="flex items-center justify-between px-4 py-3 sticky top-14 z-10 bg-background/80 backdrop-blur-md border-b border-border/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {!isSearchActive ? (
              <motion.div 
                key="title"
                className="flex items-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Settings className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-medium">Settings</h1>
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                className="w-full flex items-center"
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
                    className="pl-9 pr-8 h-10 text-sm w-full bg-muted/40 border-none rounded-full"
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
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full"
              onClick={handleSearch}
            >
              {!isSearchActive ? (
                <Search className="h-4.5 w-4.5" />
              ) : (
                <X className="h-4.5 w-4.5" />
              )}
            </Button>
            
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full"
                onClick={() => setResetDialogOpen(true)}
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </Button>
              <DialogContent className="sm:max-w-[425px] rounded-xl border-border/30 shadow-lg">
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

        {/* Navigation Pills - Added pt-6 instead of pt-4 to increase spacing */}
        <motion.div 
          className="pt-6 pb-2 px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
            {settingTabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <span className={cn(
                  "h-4 w-4",
                  activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {tab.icon}
                </span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content - Added pt-4 to create more space after the tab pills */}
        <div className="px-4 pb-24 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
