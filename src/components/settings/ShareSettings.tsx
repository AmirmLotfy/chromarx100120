import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Twitter, Facebook, Linkedin } from "lucide-react";
import { toast } from "sonner";

const ShareSettings = () => {
  const extensionUrl = "https://chrome.google.com/webstore/detail/chromarx/your-extension-id";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(extensionUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async (platform: string) => {
    const text = "Check out ChroMarx - A powerful bookmark manager for Chrome!";
    const shareUrl = encodeURIComponent(extensionUrl);
    
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${shareUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
    }
    
    window.open(url, "_blank", "width=600,height=400");
    toast.success(`Sharing on ${platform}...`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share ChroMarx</CardTitle>
        <CardDescription>
          Help others discover ChroMarx by sharing it with your network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
            onClick={() => handleShare("twitter")}
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-[#4267B2] text-white hover:bg-[#4267B2]/90"
            onClick={() => handleShare("facebook")}
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-[#0077B5] text-white hover:bg-[#0077B5]/90"
            onClick={() => handleShare("linkedin")}
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareSettings;