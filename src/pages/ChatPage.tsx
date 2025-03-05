
import React from "react";
import ChatInterface from "@/components/ChatInterface";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <motion.div 
        className="h-full w-full flex flex-col bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AuthProvider>
          <ChatInterface />
        </AuthProvider>
      </motion.div>
    </Layout>
  );
};

export default ChatPage;
