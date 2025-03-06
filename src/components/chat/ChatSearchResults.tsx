
import React from "react";
import { Message } from "@/types/chat";
import { BookmarkPlus, Globe } from "lucide-react";

interface ChatSearchResultsProps {
  message: Message;
}

const ChatSearchResults: React.FC<ChatSearchResultsProps> = ({ message }) => {
  if (!message.bookmarks?.length && !message.webResults?.length) return null;
  
  return (
    <div className="mt-3 pt-3 space-y-3 border-t border-primary/10">
      {message.bookmarks && message.bookmarks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
            <BookmarkPlus size={14} />
            Bookmarks
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {message.bookmarks.map((bookmark, idx) => (
              <a
                key={idx}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-xs"
              >
                <div className="font-medium line-clamp-1">{bookmark.title}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">{bookmark.url}</div>
                {bookmark.relevanceScore && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="h-1 bg-primary/10 rounded-full flex-1">
                      <div 
                        className="h-1 bg-primary rounded-full"
                        style={{ width: `${Math.min(bookmark.relevanceScore * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(bookmark.relevanceScore * 100)}%
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
      
      {message.webResults && message.webResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Globe size={14} />
            Web Results
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {message.webResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors text-xs"
              >
                <div className="font-medium line-clamp-1">{result.title}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">{result.url}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSearchResults;
