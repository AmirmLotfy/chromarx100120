
import { localStorageClient } from '@/lib/chrome-storage-client';
import { Conversation, Message, ConversationCategory } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

const mapDbConversation = (dbConvo: any): Conversation => {
  if (!dbConvo) return null as unknown as Conversation;
  
  return {
    id: dbConvo.id || '',
    name: dbConvo.name || '',
    messages: [], // Messages are loaded separately
    createdAt: dbConvo.created_at ? new Date(dbConvo.created_at).getTime() : Date.now(),
    updatedAt: dbConvo.updated_at ? new Date(dbConvo.updated_at).getTime() : Date.now(),
    pinned: dbConvo.pinned || false,
    bookmarkContext: dbConvo.bookmark_context,
    isBookmarkSearch: dbConvo.is_bookmark_search,
    category: (dbConvo.category as ConversationCategory) || 'General',
    archived: dbConvo.archived || false
  };
};

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

const mapDbMessage = (dbMessage: any): Message => {
  if (!dbMessage) return null as unknown as Message;
  
  return {
    id: dbMessage.id || '',
    content: dbMessage.content || '',
    sender: dbMessage.sender as "user" | "assistant",
    timestamp: dbMessage.timestamp ? new Date(dbMessage.timestamp).getTime() : Date.now(),
    isRead: dbMessage.is_read || false,
    bookmarks: dbMessage.bookmarks,
    webResults: dbMessage.web_results
  };
};

export const ConversationService = {
  async getConversations(archived: boolean = false): Promise<Conversation[]> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .eq('archived', archived)
        .order('updated_at', { ascending: false })
        .execute();

      const dbConversations = result.data || [];
      const error = result.error;

      if (error) throw error;

      const conversations: Conversation[] = [];
      for (const dbConvo of dbConversations) {
        if (!dbConvo) continue;
        
        const conversation = mapDbConversation(dbConvo);
        
        const messagesResult = await localStorageClient
          .from('messages')
          .eq('conversation_id', conversation.id)
          .order('timestamp', { ascending: true })
          .execute();
        
        const dbMessages = messagesResult.data || [];
        const messagesError = messagesResult.error;
        
        if (messagesError) throw messagesError;
        
        conversation.messages = dbMessages.map(mapDbMessage).filter(Boolean);
        conversations.push(conversation);
      }

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      return [];
    }
  },

  async createConversation(name: string, category: ConversationCategory, messages: Message[]): Promise<Conversation | null> {
    try {
      const conversationId = uuidv4();
      const now = Date.now();

      const result = await localStorageClient
        .from('conversations')
        .insert({
          id: conversationId,
          name,
          category,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString()
        })
        .execute();

      if (result.error) throw result.error;
      
      if (messages.length > 0) {
        const dbMessages = messages.map(msg => mapMessageToDb(msg, conversationId));
        const messagesResult = await localStorageClient
          .from('messages')
          .insert(dbMessages)
          .execute();

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

  async updateConversation(conversation: Conversation): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .update({
          name: conversation.name,
          category: conversation.category,
          pinned: conversation.pinned,
          bookmark_context: conversation.bookmarkContext,
          is_bookmark_search: conversation.isBookmarkSearch,
          updated_at: new Date(Date.now()).toISOString() // Convert to ISO string
        })
        .eq('id', conversation.id)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
      return false;
    }
  },

  async addMessage(conversationId: string, message: Message): Promise<Message | null> {
    try {
      const result = await localStorageClient
        .from('messages')
        .insert(mapMessageToDb(message, conversationId))
        .execute();

      if (result.error) throw result.error;

      await localStorageClient
        .from('conversations')
        .update({ updated_at: new Date(Date.now()).toISOString() }) // Convert to ISO string
        .eq('id', conversationId)
        .execute();

      return message;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
      return null;
    }
  },

  async markMessagesAsRead(conversationId: string): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender', 'assistant')
        .eq('is_read', false)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },

  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .update({ archived: true })
        .eq('id', conversationId)
        .execute();

      if (result.error) throw result.error;
      
      return true;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
      return false;
    }
  },

  async restoreConversation(conversationId: string): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .update({ archived: false })
        .eq('id', conversationId)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error restoring conversation:', error);
      toast.error('Failed to restore conversation');
      return false;
    }
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await localStorageClient
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
        .execute();

      const result = await localStorageClient
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
      return false;
    }
  },

  async updateCategory(conversationId: string, category: ConversationCategory): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .update({ category })
        .eq('id', conversationId)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
      return false;
    }
  },

  async togglePinned(conversationId: string, isPinned: boolean): Promise<boolean> {
    try {
      const result = await localStorageClient
        .from('conversations')
        .update({ pinned: isPinned })
        .eq('id', conversationId)
        .execute();

      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('Error toggling pinned status:', error);
      toast.error('Failed to update pinned status');
      return false;
    }
  }
};
