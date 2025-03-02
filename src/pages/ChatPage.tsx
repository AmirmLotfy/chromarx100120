
import React from "react";
import ChatInterface from "@/components/ChatInterface";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <motion.div 
        className="container mx-auto h-full p-0 max-w-5xl" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col rounded-xl shadow-lg bg-gradient-to-b from-background/60 to-background/95 backdrop-blur-sm border">
            <AuthProvider>
              <ChatInterface />
            </AuthProvider>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default ChatPage;
