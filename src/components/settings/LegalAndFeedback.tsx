import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

const LegalAndFeedback = () => {
  const openDocument = (path: string) => {
    window.open(path, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>
            Review our privacy policy and terms of service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openDocument('/privacy-policy.html')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Privacy Policy
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => openDocument('/terms-of-service.html')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Terms of Service
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            Help us improve ChroMarx by sharing your thoughts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalAndFeedback;