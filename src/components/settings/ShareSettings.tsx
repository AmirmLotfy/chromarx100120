import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Twitter, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const ShareSettings = () => {
  const extensionUrl = `https://chrome.google.com/webstore/detail/chromarx/mdebkkihajajcidfnljlkkbcidcfbnii`;

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
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text + " " + extensionUrl)}`;
        break;
    }
    
    window.open(url, "_blank", "width=600,height=400");
    toast.success(`Sharing on ${platform}...`);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Share ChroMarx</CardTitle>
        <CardDescription>
          Help others discover ChroMarx by sharing it with your network
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Quick Share Button */}
          <Button
            size="lg"
            className="w-full justify-center gap-2 bg-primary text-primary-foreground shadow-lg hover:opacity-90"
            onClick={handleCopyLink}
          >
            <Share2 className="h-5 w-5" />
            Share ChroMarx
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or share via
              </span>
            </div>
          </div>

          {/* Social Media Sharing Grid */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Button
              variant="outline"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1DA1F2]/10 font-normal text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only md:not-sr-only">Twitter</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#4267B2]/10 font-normal text-[#4267B2] hover:bg-[#4267B2] hover:text-white"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="h-5 w-5" />
              <span className="sr-only md:not-sr-only">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0077B5]/10 font-normal text-[#0077B5] hover:bg-[#0077B5] hover:text-white"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="h-5 w-5" />
              <span className="sr-only md:not-sr-only">LinkedIn</span>
            </Button>

            <Button
              variant="outline"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 font-normal text-[#25D366] hover:bg-[#25D366] hover:text-white"
              onClick={() => handleShare("whatsapp")}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only md:not-sr-only">WhatsApp</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareSettings;