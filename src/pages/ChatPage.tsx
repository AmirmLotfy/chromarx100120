import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatPage = () => {
  const isMobile = useIsMobile();
  
  return (
    <Layout>
      <div className={`space-y-6 ${isMobile ? 'h-full pb-0' : 'pb-16'}`}>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">
            Chat with your bookmarks and discover new content
          </p>
        </div>
        <div className={`${isMobile ? 'h-[calc(100%-5rem)]' : ''}`}>
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;