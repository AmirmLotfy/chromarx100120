
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] w-full max-w-md mx-auto">
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default ChatPage;
