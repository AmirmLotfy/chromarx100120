
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] w-full px-4 py-2">
        <div className="w-full max-w-3xl h-full">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
