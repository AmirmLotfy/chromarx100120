
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Chat with Your Bookmarks</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions, search bookmarks, and discover related content
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
