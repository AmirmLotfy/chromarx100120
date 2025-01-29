import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="space-y-4 pb-16">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your bookmarks and discover new content
          </p>
        </div>
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default ChatPage;