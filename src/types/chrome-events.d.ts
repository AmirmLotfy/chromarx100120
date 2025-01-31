declare namespace chrome.bookmarks {
  interface BookmarkCreatedEvent extends chrome.events.Event<(id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => void> {
    addListener(callback: (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => void): void;
    removeListener(callback: (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => void): void;
  }
  
  interface BookmarkRemovedEvent extends chrome.events.Event<(id: string, removeInfo: chrome.bookmarks.RemoveInfo) => void> {
    addListener(callback: (id: string, removeInfo: chrome.bookmarks.RemoveInfo) => void): void;
    removeListener(callback: (id: string, removeInfo: chrome.bookmarks.RemoveInfo) => void): void;
  }
  
  interface BookmarkChangedEvent extends chrome.events.Event<(id: string, changeInfo: chrome.bookmarks.ChangeInfo) => void> {
    addListener(callback: (id: string, changeInfo: chrome.bookmarks.ChangeInfo) => void): void;
    removeListener(callback: (id: string, changeInfo: chrome.bookmarks.ChangeInfo) => void): void;
  }
  
  interface BookmarksAPI {
    onCreated: BookmarkCreatedEvent;
    onRemoved: BookmarkRemovedEvent;
    onChanged: BookmarkChangedEvent;
  }
}

declare namespace chrome.identity {
  interface SignInChangeEvent extends chrome.events.Event<(account: chrome.identity.AccountInfo, signedIn: boolean) => void> {
    addListener(callback: (account: chrome.identity.AccountInfo, signedIn: boolean) => void): void;
    removeListener(callback: (account: chrome.identity.AccountInfo, signedIn: boolean) => void): void;
  }
  
  interface IdentityAPI {
    onSignInChanged: SignInChangeEvent;
  }
}