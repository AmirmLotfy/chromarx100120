declare namespace chrome.bookmarks {
  interface BookmarkCreatedEvent extends chrome.events.Event<(id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => void> {}
  interface BookmarkRemovedEvent extends chrome.events.Event<(id: string, removeInfo: chrome.bookmarks.RemoveInfo) => void> {}
  interface BookmarkChangedEvent extends chrome.events.Event<(id: string, changeInfo: chrome.bookmarks.ChangeInfo) => void> {}
  
  interface BookmarksAPI {
    onCreated: BookmarkCreatedEvent;
    onRemoved: BookmarkRemovedEvent;
    onChanged: BookmarkChangedEvent;
  }
}

declare namespace chrome.identity {
  interface SignInChangeEvent extends chrome.events.Event<(account: chrome.identity.AccountInfo, signedIn: boolean) => void> {}
  
  interface IdentityAPI {
    onSignInChanged: SignInChangeEvent;
  }
}