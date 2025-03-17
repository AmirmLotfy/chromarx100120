
import React from 'react';
import { Conversation } from '@/types/chat';

export interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  loadConversation: (conversation: Conversation) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  isOpen,
  onClose,
  conversations,
  loadConversation 
}) => {
  if (!isOpen) return null;

  return (
    <div className="chat-history">
      <button onClick={onClose}>Close</button>
      <h2>Chat History</h2>
      <ul>
        {conversations.map(conversation => (
          <li key={conversation.id}>
            <button onClick={() => loadConversation(conversation)}>
              {conversation.name || `Conversation ${conversation.id.slice(0, 5)}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistory;
