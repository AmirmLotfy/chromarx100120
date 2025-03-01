
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-8rem)] w-full max-w-md mx-auto relative">
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default ChatPage;
