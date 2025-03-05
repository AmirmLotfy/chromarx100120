
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage } from "@/services/storageService";

interface FeatureTipProps {
  id: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function FeatureTip({
  id,
  title,
  description,
  position = "bottom",
  children,
}: FeatureTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  // Check if the tip has been seen before
  useEffect(() => {
    const checkIfSeen = async () => {
      try {
        const seenTips = await storage.get<string[]>("seenFeatureTips") || [];
        setHasBeenSeen(seenTips.includes(id));
      } catch (error) {
        console.error("Error checking if tip has been seen:", error);
      }
    };
    
    checkIfSeen();
  }, [id]);

  const handleDismiss = async () => {
    setIsVisible(false);
    try {
      const seenTips = await storage.get<string[]>("seenFeatureTips") || [];
      if (!seenTips.includes(id)) {
        await storage.set("seenFeatureTips", [...seenTips, id]);
      }
      setHasBeenSeen(true);
    } catch (error) {
      console.error("Error marking tip as seen:", error);
    }
  };

  // Positioning classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "bottom":
        return "top-full mt-2";
      case "left":
        return "right-full mr-2";
      case "right":
        return "left-full ml-2";
      default:
        return "top-full mt-2";
    }
  };

  return (
    <div
      className="relative inline-block"
      ref={setTarget}
      onMouseEnter={() => !hasBeenSeen && setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && target && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 bg-popover border shadow-md rounded-lg p-4 ${getPositionClasses()}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 rounded-full"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
