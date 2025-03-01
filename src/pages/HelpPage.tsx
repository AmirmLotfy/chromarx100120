
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ExternalLink, HelpCircle, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const HelpPage = () => {
  useEffect(() => {
    // Check if this is being run in a Chrome extension context
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    console.log("Running in extension context:", isExtension);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@chromarx.app");
    toast.success("Support email copied to clipboard");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">User Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find answers to common questions about ChroMarx</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I sync my bookmarks across devices?</AccordionTrigger>
                    <AccordionContent>
                      ChroMarx automatically syncs your bookmarks across devices when you sign in with the same account. Make sure you're signed in on all devices to enable sync.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Is my data secure?</AccordionTrigger>
                    <AccordionContent>
                      Yes, ChroMarx uses secure cloud storage and encryption to protect your bookmark data. Your data is only accessible to you when signed in to your account.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Do I need to be online to use ChroMarx?</AccordionTrigger>
                    <AccordionContent>
                      ChroMarx works offline but with limited functionality. You can view and manage your existing bookmarks, but syncing and AI features require an internet connection.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>How do I export my bookmarks?</AccordionTrigger>
                    <AccordionContent>
                      Go to the Export/Import page from the main navigation menu to download your bookmarks in various formats.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Can I organize bookmarks into folders?</AccordionTrigger>
                    <AccordionContent>
                      Yes, visit the Collections page to create and manage bookmark folders and collections.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Guides</CardTitle>
                <CardDescription>Learn how to use ChroMarx effectively</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="space-y-2">
                      <h3 className="font-medium">Getting Started Guide</h3>
                      <p className="text-sm text-muted-foreground">Learn the basics of ChroMarx</p>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="space-y-2">
                      <h3 className="font-medium">Advanced Organization Tips</h3>
                      <p className="text-sm text-muted-foreground">Master bookmark collections and tags</p>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="space-y-2">
                      <h3 className="font-medium">Sync Configuration</h3>
                      <p className="text-sm text-muted-foreground">Set up cross-device syncing</p>
                    </div>
                  </Card>
                  <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
                    <div className="space-y-2">
                      <h3 className="font-medium">Keyboard Shortcuts</h3>
                      <p className="text-sm text-muted-foreground">Boost your productivity</p>
                    </div>
                  </Card>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>View all guides</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>We're here to help you with any questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Email Support</h3>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">support@chromarx.app</span>
                    <Button variant="ghost" size="sm" onClick={handleCopyEmail}>Copy</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Response time: Within 24 hours</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Community Support</h3>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Join our Discord</span>
                  </Button>
                  <p className="text-sm text-muted-foreground">Get help from our community and team members</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default HelpPage;
