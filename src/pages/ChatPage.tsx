
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";

const ChatPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 pb-16 space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your bookmarks and discover related content
          </p>
        </div>
        <Card className="border-none shadow-none bg-transparent">
          <ChatInterface />
        </Card>
      </div>
    </Layout>
  );
};

export default ChatPage;
