
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare, FileText, ArrowRight } from "lucide-react";
import FeedbackForm from "./FeedbackForm";
import { motion } from "framer-motion";
import { useSettings } from "@/stores/settingsStore";

const LegalAndFeedback = () => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const settings = useSettings();

  const openDocument = (path: string) => {
    window.open(path, '_blank');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Legal Documents</CardTitle>
            <CardDescription>
              Review our policies and terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal h-11"
              onClick={() => openDocument('/privacy-policy.html')}
            >
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Privacy Policy
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between text-sm font-normal h-11"
              onClick={() => openDocument('/terms-of-service.html')}
            >
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Terms of Service
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Feedback</CardTitle>
            <CardDescription>
              Help us improve ChroMarx
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showFeedbackForm ? (
              <Button
                variant="secondary"
                className="w-full justify-between bg-primary/10 hover:bg-primary/20 text-primary border-none"
                onClick={() => setShowFeedbackForm(true)}
              >
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Share your feedback
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FeedbackForm />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Reset Settings</CardTitle>
            <CardDescription>
              Restore default settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
              onClick={() => {
                settings.resetSettings();
                window.location.reload();
              }}
            >
              Reset All Settings
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LegalAndFeedback;
