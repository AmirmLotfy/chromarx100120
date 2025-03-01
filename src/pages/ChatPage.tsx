
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";

const ChatPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10 h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
            <p className="text-sm text-muted-foreground">
              Chat with your bookmarks and discover related content
            </p>
          </div>
          
          <div className="flex-1">
            <ChatInterface />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
