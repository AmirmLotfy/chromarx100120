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

  // Spring animation variants for a fluid, modern feel
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const slideUpVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      } 
    },
    exit: { 
      y: 20, 
      opacity: 0,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Fixed Header - Modern Design */}
        <div className="h-16 w-full" aria-hidden="true" />
        <motion.div 
          className="fixed top-14 left-0 right-0 z-30 border-b border-border/10 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {!isSearchActive ? (
              <motion.div 
                key="title"
                className="flex items-center gap-2.5"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Settings className="h-5 w-5 text-primary" />
                <span className="text-xl font-medium">Settings</span>
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                className="w-full"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full"
              onClick={handleSearch}
              aria-label={isSearchActive ? "Close search" : "Search settings"}
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
                aria-label="Reset settings"
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

        {/* Tab Navigation - Modern Pills Design */}
        <div className="pt-6 px-4">
          <motion.div 
            className="rounded-full bg-muted/40 p-1 flex w-full overflow-x-auto hide-scrollbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {settingTabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm whitespace-nowrap transition-all flex-1 min-w-[25%]",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                    : "text-foreground/70 hover:text-foreground hover:bg-muted/80"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <span className={activeTab === tab.id ? "text-primary-foreground" : "text-foreground/60"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Content Area with Card Design */}
        <div className="mt-6 px-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideUpVariants}
              className="w-full rounded-xl overflow-hidden"
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
