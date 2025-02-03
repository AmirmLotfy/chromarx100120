import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { storage } from "@/lib/chrome-utils";

const RatingPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkRatingPrompt = async () => {
      const installDate = await storage.get('installDate');
      const hasRated = await storage.get('hasRated');
      const lastPrompt = await storage.get('lastRatingPrompt');
      
      if (!installDate) {
        await storage.set('installDate', Date.now());
        return;
      }

      if (hasRated || lastPrompt) {
        return;
      }

      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - installDate > oneWeek) {
        setShowPrompt(true);
      }
    };

    checkRatingPrompt();
  }, []);

  const handleRate = () => {
    const storeUrl = "https://chrome.google.com/webstore/detail/chromarx/your-extension-id/reviews";
    window.open(storeUrl, "_blank");
    storage.set('hasRated', true);
    setShowPrompt(false);
  };

  const handleRemindLater = () => {
    storage.set('lastRatingPrompt', Date.now());
    setShowPrompt(false);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Enjoying ChroMarx?
          </DialogTitle>
          <DialogDescription>
            If you're finding ChroMarx helpful, please consider rating us on the Chrome Web Store. Your feedback helps us improve!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleRemindLater}>
            Remind Me Later
          </Button>
          <Button onClick={handleRate} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600">
            Rate ChroMarx
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPrompt;