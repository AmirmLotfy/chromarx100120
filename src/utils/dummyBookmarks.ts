
import { ChromeBookmark } from "@/types/bookmark";

export const dummyBookmarks: ChromeBookmark[] = [
  {
    id: "1",
    title: "React Documentation",
    url: "https://react.dev",
    dateAdded: Date.now() - 86400000,
    category: "Development",
    preview: {
      description: "The official React documentation",
      favicon: "https://react.dev/favicon.ico"
    }
  },
  {
    id: "2",
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/",
    dateAdded: Date.now() - 172800000,
    category: "Development",
    preview: {
      description: "Your guide to TypeScript",
      favicon: "https://www.typescriptlang.org/favicon-32x32.png"
    }
  },
  {
    id: "3",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    dateAdded: Date.now() - 259200000,
    category: "Development",
    preview: {
      description: "Resources for developers, by developers",
      favicon: "https://developer.mozilla.org/favicon-48x48.png"
    }
  },
  {
    id: "4",
    title: "GitHub",
    url: "https://github.com",
    dateAdded: Date.now() - 345600000,
    category: "Development",
    preview: {
      description: "Where the world builds software",
      favicon: "https://github.com/favicon.ico"
    }
  },
  {
    id: "5",
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    dateAdded: Date.now() - 432000000,
    category: "Development",
    preview: {
      description: "Where developers learn, share & build careers",
      favicon: "https://stackoverflow.com/favicon.ico"
    }
  },
  {
    id: "6",
    title: "Netflix",
    url: "https://netflix.com",
    dateAdded: Date.now() - 518400000,
    category: "Entertainment",
    preview: {
      description: "Watch TV shows and movies online",
      favicon: "https://netflix.com/favicon.ico"
    }
  },
  {
    id: "7",
    title: "YouTube",
    url: "https://youtube.com",
    dateAdded: Date.now() - 604800000,
    category: "Entertainment",
    preview: {
      description: "Enjoy videos and music",
      favicon: "https://www.youtube.com/favicon.ico"
    }
  },
  {
    id: "8",
    title: "Amazon",
    url: "https://amazon.com",
    dateAdded: Date.now() - 691200000,
    category: "Shopping",
    preview: {
      description: "Online shopping from the earth's biggest selection",
      favicon: "https://amazon.com/favicon.ico"
    }
  },
  {
    id: "9",
    title: "CNN",
    url: "https://cnn.com",
    dateAdded: Date.now() - 777600000,
    category: "News",
    preview: {
      description: "Breaking news, latest news and videos",
      favicon: "https://cnn.com/favicon.ico"
    }
  },
  {
    id: "10",
    title: "BBC News",
    url: "https://bbc.com/news",
    dateAdded: Date.now() - 864000000,
    category: "News",
    preview: {
      description: "BBC News provides trusted World and UK news",
      favicon: "https://bbc.com/favicon.ico"
    }
  }
];
