
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { Conversation, Message, ConversationCategory } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

// Convert Supabase conversation to our app's Conversation type
const mapDbConversation = (dbConvo: any): Conversation => {
  return {
    id: dbConvo.id,
    name: dbConvo.name,
    messages: [], // Messages are loaded separately
    createdAt: new Date(dbConvo.created_at).getTime(),
    updatedAt: new Date(dbConvo.updated_at).getTime(),
    pinned: dbConvo.pinned,
    bookmarkContext: dbConvo.bookmark_context,
    isBookmarkSearch: dbConvo.is_bookmark_search,
    category: (dbConvo.category as ConversationCategory) || 'General',
    archived: dbConvo.archived
  };
};

// Convert our app's Message type to Supabase format
const mapMessageToDb = (message: Message, conversationId: string) => {
  return {
    id: message.id,
    conversation_id: conversationId,
    content: message.content,
    sender: message.sender,
    timestamp: new Date(message.timestamp).toISOString(), // Convert to ISO string for Supabase
    is_read: message.isRead,
    bookmarks: message.bookmarks ? JSON.stringify(message.bookmarks) : null,
    web_results: message.webResults ? JSON.stringify(message.webResults) : null
  };
};

// Convert Supabase message to our app's Message type
const mapDbMessage = (dbMessage: any): Message => {
  return {
    id: dbMessage.id,
    content: dbMessage.content,
    sender: dbMessage.sender as "user" | "assistant",
    timestamp: new Date(dbMessage.timestamp).getTime(),
    isRead: dbMessage.is_read,
    bookmarks: dbMessage.bookmarks,
    webResults: dbMessage.web_results
  };
};

export const ConversationService = {
  // Fetch all conversations for the current user
  async getConversations(archived: boolean = false): Promise<Conversation[]> {
    try {
      const result = await supabase
        .from('conversations')
        .select('*')
        .eq('archived', archived)
        .order('updated_at', { ascending: false });

      // Manually access and check data and error
      const dbConversations = result.data || [];
      const error = result.error;

      if (error) throw error;

      const conversations: Conversation[] = [];
      for (const dbConvo of dbConversations) {
        const conversation = mapDbConversation(dbConvo);
        
        // Get messages for this conversation
        const messagesResult = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', dbConvo.id)
          .order('timestamp', { ascending: true });
        
        // Manually access and check data and error
        const dbMessages = messagesResult.data || [];
        const messagesError = messagesResult.error;
        
        if (messagesError) throw messagesError;
        
        conversation.messages = dbMessages.map(mapDbMessage);
        conversations.push(conversation);
      }

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      return [];
    }
  },

  // Create a new conversation
  async createConversation(name: string, category: ConversationCategory, messages: Message[]): Promise<Conversation | null> {
    try {
      const conversationId = uuidv4();
      const now = Date.now();

      // Insert conversation
      const result = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          name,
          category,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString()
        })
        .select();

      // Manually check for error
      if (result.error) throw result.error;
      const newConversation = result.data?.[0];

      // Insert messages
      if (messages.length > 0) {
        const dbMessages = messages.map(msg => mapMessageToDb(msg, conversationId));
        const messagesResult = await supabase
          .from('messages')
          .insert(dbMessages);

        if (messagesResult.error) throw messagesResult.error;
      }

      const conversation: Conversation = {
        id: conversationId,
        name,
        messages,
        createdAt: now,
        updatedAt: now,
        category
      };

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  },

  // Update an existing conversation
  async updateConversation(conversation: Conversation): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          name: conversation.name,
          category: conversation.category,
          pinned: conversation.pinned,
          bookmark_context: conversation.bookmarkContext,
          is_bookmark_search: conversation.isBookmarkSearch,
          updated_at: new Date(Date.now()).toISOString() // Convert to ISO string
        })
        .eq('id', conversation.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
      return false;
    }
  },

  // Add a message to a conversation
  async addMessage(conversationId: string, message: Message): Promise<Message | null> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert(mapMessageToDb(message, conversationId));

      if (error) throw error;

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date(Date.now()).toISOString() }) // Convert to ISO string
        .eq('id', conversationId);

      return message;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
      return null;
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender', 'assistant')
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },

  // Archive a conversation
  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ archived: true })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
      return false;
    }
  },

  // Restore an archived conversation
  async restoreConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ archived: false })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error restoring conversation:', error);
      toast.error('Failed to restore conversation');
      return false;
    }
  },

  // Permanently delete a conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // First delete all messages (though this should cascade automatically)
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
      return false;
    }
  },

  // Update conversation category
  async updateCategory(conversationId: string, category: ConversationCategory): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ category })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
      return false;
    }
  },
  
  // Toggle conversation pinned status
  async togglePinned(conversationId: string, isPinned: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ pinned: isPinned })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling pinned status:', error);
      toast.error('Failed to update pinned status');
      return false;
    }
  }
};
