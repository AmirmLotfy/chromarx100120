
import { useState } from "react";
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

const ChatPage = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] w-full">
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default ChatPage;
