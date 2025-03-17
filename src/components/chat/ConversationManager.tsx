
import React from 'react';
import { Conversation, ConversationCategory } from '@/types/chat';

export interface ConversationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversation?: Conversation;
  updateConversation: (conversation: Conversation) => Promise<void>;
  deleteConversation?: (conversationId: string) => Promise<void>;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversation,
  updateConversation,
  deleteConversation
}) => {
  if (!isOpen) return null;

  return (
    <div className="conversation-manager">
      <button onClick={onClose}>Close</button>
      <h2>Manage Conversations</h2>
      <ul>
        {conversations.map(conversation => (
          <li key={conversation.id} className={activeConversation?.id === conversation.id ? 'active' : ''}>
            <span>{conversation.name}</span>
            <div>
              <select 
                value={conversation.category} 
                onChange={(e) => updateConversation({ 
                  ...conversation, 
                  category: e.target.value as ConversationCategory 
                })}
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Research">Research</option>
                <option value="Personal">Personal</option>
                <option value="Bookmarks">Bookmarks</option>
              </select>
              {deleteConversation && (
                <button onClick={() => deleteConversation(conversation.id)}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationManager;
