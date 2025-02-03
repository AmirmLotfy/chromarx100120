import { useEffect, useState } from "react";
import { storage } from "@/lib/chrome-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EXTENSION_ID = 'mdebkkihajajcidfnljlkkbcidcfbnii';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const RatingPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkRatingPrompt = async () => {
      const installDate = await storage.get<number>('installDate');
      const hasRated = await storage.get<boolean>('hasRated');
      const lastPrompt = await storage.get<number>('lastRatingPrompt');
      
      if (!installDate) {
        await storage.set('installDate', Date.now());
        return;
      }

      // Show prompt if:
      // 1. User hasn't rated yet
      // 2. It's been at least a week since installation
      // 3. It's been at least a week since last prompt (if any)
      const timeSinceInstall = Date.now() - installDate;
      const timeSinceLastPrompt = lastPrompt ? Date.now() - lastPrompt : Infinity;

      if (!hasRated && timeSinceInstall >= WEEK_IN_MS && timeSinceLastPrompt >= WEEK_IN_MS) {
        setShowPrompt(true);
      }
    };

    checkRatingPrompt();
  }, []);

  const handleRate = () => {
    chrome.tabs.create({
      url: `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`
    });
    storage.set('hasRated', true);
    setShowPrompt(false);
    toast.success("Thank you for rating ChroMarx!");
  };

  const handleRemindLater = () => {
    storage.set('lastRatingPrompt', Date.now());
    setShowPrompt(false);
    toast("We'll remind you later!");
  };

  const handleDismiss = () => {
    storage.set('hasRated', true);
    setShowPrompt(false);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enjoying ChroMarx?</DialogTitle>
          <DialogDescription>
            If you're finding ChroMarx helpful, we'd really appreciate your rating on the Chrome Web Store. It helps us grow and improve!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleRemindLater}>
            Remind me later
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Don't ask again
          </Button>
          <Button onClick={handleRate}>
            Rate ChroMarx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPrompt;