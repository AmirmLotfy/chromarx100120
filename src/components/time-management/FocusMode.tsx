import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

const FocusMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [blockedSites, setBlockedSites] = useState<string[]>([
    "facebook.com",
    "twitter.com",
    "instagram.com"
  ]);
  const [newSite, setNewSite] = useState("");

  const toggleFocusMode = () => {
    setIsActive(!isActive);
  };

  const addBlockedSite = () => {
    if (newSite && !blockedSites.includes(newSite)) {
      setBlockedSites([...blockedSites, newSite]);
      setNewSite("");
    }
  };

  const removeBlockedSite = (site: string) => {
    setBlockedSites(blockedSites.filter(s => s !== site));
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium md:text-lg">Focus Mode</h3>
            <p className="text-xs text-muted-foreground md:text-sm">
              Block distracting websites
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={toggleFocusMode}
            className="h-[22px] w-[36px] md:h-[24px] md:w-[42px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
          />
        </div>

        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter website to block"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              className="h-9 md:h-10"
            />
            <Button 
              onClick={addBlockedSite}
              size="sm"
              className="h-9 w-9 md:h-10 md:w-10 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {blockedSites.map((site) => (
              <div
                key={site}
                className="flex items-center justify-between bg-muted p-2 rounded-md"
              >
                <span className="text-sm">{site}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlockedSite(site)}
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FocusMode;