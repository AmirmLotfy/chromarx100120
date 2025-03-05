
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="flex justify-center items-start h-[calc(100vh-4rem)] w-full p-0 sm:p-4">
        <div className="w-full h-full max-w-4xl bg-gradient-to-b from-background/95 to-background rounded-none sm:rounded-xl overflow-hidden shadow-xl border border-primary/10 relative">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
