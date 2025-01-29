import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Plus, X } from "lucide-react";

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
    // In a real implementation, this would integrate with the Chrome extension
    // to actually block the specified sites
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
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Focus Mode</h3>
            <p className="text-sm text-muted-foreground">
              Block distracting websites
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={toggleFocusMode}
          />
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter website to block"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
            />
            <Button onClick={addBlockedSite}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {blockedSites.map((site) => (
              <div
                key={site}
                className="flex items-center justify-between bg-muted p-2 rounded"
              >
                <span>{site}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlockedSite(site)}
                >
                  <X className="h-4 w-4" />
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