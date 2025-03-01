
import React from "react";
import ChatInterface from "@/components/ChatInterface";
import Layout from "@/components/Layout";

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto h-full p-0">
        <div className="h-full flex flex-col sm:p-4">
          <div className="flex-1 bg-card rounded-lg shadow-sm overflow-hidden flex flex-col">
            <ChatInterface />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
