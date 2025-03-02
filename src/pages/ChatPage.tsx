
import React from "react";
import ChatInterface from "@/components/ChatInterface";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const ChatPage: React.FC = () => {
  return (
    <Layout>
      <motion.div 
        className="h-[calc(100vh-4rem)] w-full max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-full flex flex-col">
          <div className="h-full overflow-hidden flex flex-col rounded-2xl shadow-lg bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-sm border">
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
