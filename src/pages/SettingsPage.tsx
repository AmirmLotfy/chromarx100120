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
  X,
  ChevronDown,
  ChevronRight
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const settings = useSettings();
  const { theme } = useTheme();
  const isMobile = useIsMobile();

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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId === activeTab ? "" : tabId);
  };

  const settingTabs = [
    { id: "appearance", label: "Appearance", icon: <PaintBucket size={20} /> },
    { id: "privacy", label: "Privacy", icon: <Shield size={20} /> },
    { id: "notifications", label: "Alerts", icon: <Bell size={20} /> },
    { id: "legal", label: "Legal", icon: <FileText size={20} /> },
  ];

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

        <div className="pt-8 px-5 pb-28">
          <div className="space-y-3">
            {settingTabs.map((tab) => (
              <div 
                key={tab.id}
                className="rounded-xl overflow-hidden shadow-sm border border-border/5"
              >
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-t-xl transition-all",
                    "bg-gradient-to-r touch-target min-h-[60px]",
                    activeTab === tab.id 
                      ? "from-primary/90 to-primary/70 text-primary-foreground font-medium" 
                      : "from-muted/50 to-muted/30 text-foreground hover:opacity-90"
                  )}
                  aria-expanded={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full",
                        activeTab === tab.id 
                          ? "bg-primary-foreground/20" 
                          : "bg-primary/10"
                      )}
                    >
                      <span className={activeTab === tab.id ? "text-primary-foreground" : "text-primary"}>
                        {tab.icon}
                      </span>
                    </div>
                    <span className="font-medium text-base">{tab.label}</span>
                  </div>
                  <div className="flex h-5 w-5 items-center justify-center">
                    {activeTab === tab.id ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {activeTab === tab.id && (
                    <motion.div
                      id={`panel-${tab.id}`}
                      key={`panel-${tab.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: "auto", 
                        opacity: 1,
                        transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: { duration: 0.2, ease: [0.33, 1, 0.68, 1] }
                      }}
                      className="overflow-hidden bg-card"
                    >
                      <div className="p-4">
                        {tab.id === "appearance" && <AppearanceSettings />}
                        {tab.id === "privacy" && <PrivacySettings />}
                        {tab.id === "notifications" && <NotificationSettings />}
                        {tab.id === "legal" && <LegalAndFeedback />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
