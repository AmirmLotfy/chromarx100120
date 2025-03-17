
import { Conversation } from "@/types/chat";

export interface ConversationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  updateConversation: (conversation: Conversation) => void;
}
