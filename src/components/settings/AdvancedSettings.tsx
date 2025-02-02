import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";

const AdvancedSettings = () => {
  const { 
    experimentalFeatures, 
    setExperimentalFeatures,
    affiliateBannersEnabled,
    setAffiliateBannersEnabled
  } = useSettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Configure advanced features and experimental functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="experimental" className="flex flex-col space-y-1">
              <span>Experimental Features</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable experimental features and functionality
              </span>
            </Label>
            <Switch
              id="experimental"
              checked={experimentalFeatures}
              onCheckedChange={setExperimentalFeatures}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="affiliate-banners" className="flex flex-col space-y-1">
              <span>Affiliate Banners</span>
              <span className="font-normal text-sm text-muted-foreground">
                Show affiliate service recommendations
              </span>
            </Label>
            <Switch
              id="affiliate-banners"
              checked={affiliateBannersEnabled}
              onCheckedChange={setAffiliateBannersEnabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;