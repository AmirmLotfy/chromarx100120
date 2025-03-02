
import { ChromeBookmark } from "@/types/bookmark";

export const dummyBookmarks: ChromeBookmark[] = [
  {
    id: "1",
    title: "Google",
    url: "https://www.google.com",
    dateAdded: Date.now() - 86400000, // 1 day ago
    category: "Search Engine",
    preview: {
      description: "Google search engine",
      favicon: "https://www.google.com/favicon.ico"
    }
  },
  {
    id: "2",
    title: "GitHub",
    url: "https://github.com",
    dateAdded: Date.now() - 172800000, // 2 days ago
    category: "Development",
    preview: {
      description: "Where developers build, ship, and maintain software",
      favicon: "https://github.githubassets.com/favicons/favicon.svg"
    }
  },
  {
    id: "3",
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    dateAdded: Date.now() - 259200000, // 3 days ago
    category: "Development",
    preview: {
      description: "Where developers learn and share knowledge",
      favicon: "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico"
    }
  },
  {
    id: "4",
    title: "YouTube",
    url: "https://www.youtube.com",
    dateAdded: Date.now() - 345600000, // 4 days ago
    category: "Entertainment",
    preview: {
      description: "Video sharing platform",
      favicon: "https://www.youtube.com/s/desktop/8219628d/img/favicon.ico"
    }
  },
  {
    id: "5",
    title: "Netflix",
    url: "https://www.netflix.com",
    dateAdded: Date.now() - 432000000, // 5 days ago
    category: "Entertainment",
    preview: {
      description: "Streaming platform for movies and TV shows",
      favicon: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico"
    }
  },
  {
    id: "6",
    title: "Amazon",
    url: "https://www.amazon.com",
    dateAdded: Date.now() - 518400000, // 6 days ago
    category: "Shopping",
    preview: {
      description: "Online shopping platform",
      favicon: "https://www.amazon.com/favicon.ico"
    }
  },
  {
    id: "7",
    title: "Twitter",
    url: "https://twitter.com",
    dateAdded: Date.now() - 604800000, // 7 days ago
    category: "Social Media",
    preview: {
      description: "Social networking platform",
      favicon: "https://abs.twimg.com/responsive-web/client-web/icon-svg.168b89d5.svg"
    }
  },
  {
    id: "8",
    title: "LinkedIn",
    url: "https://www.linkedin.com",
    dateAdded: Date.now() - 691200000, // 8 days ago
    category: "Professional",
    preview: {
      description: "Professional networking platform",
      favicon: "https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca"
    }
  },
  {
    id: "9",
    title: "Reddit",
    url: "https://www.reddit.com",
    dateAdded: Date.now() - 777600000, // 9 days ago
    category: "Social Media",
    preview: {
      description: "Social news aggregation platform",
      favicon: "https://www.reddit.com/favicon.ico"
    }
  },
  {
    id: "10",
    title: "Microsoft",
    url: "https://www.microsoft.com",
    dateAdded: Date.now() - 864000000, // 10 days ago
    category: "Technology",
    preview: {
      description: "Technology company",
      favicon: "https://www.microsoft.com/favicon.ico"
    }
  },
  {
    id: "11",
    title: "Apple",
    url: "https://www.apple.com",
    dateAdded: Date.now() - 950400000, // 11 days ago
    category: "Technology",
    preview: {
      description: "Technology company specializing in consumer electronics",
      favicon: "https://www.apple.com/favicon.ico"
    }
  },
  {
    id: "12",
    title: "Wikipedia",
    url: "https://www.wikipedia.org",
    dateAdded: Date.now() - 1036800000, // 12 days ago
    category: "Reference",
    preview: {
      description: "Online encyclopedia",
      favicon: "https://www.wikipedia.org/static/favicon/wikipedia.ico"
    }
  },
  {
    id: "13",
    title: "Medium",
    url: "https://medium.com",
    dateAdded: Date.now() - 1123200000, // 13 days ago
    category: "Reading",
    preview: {
      description: "Online publishing platform",
      favicon: "https://medium.com/favicon.ico"
    }
  },
  {
    id: "14",
    title: "Spotify",
    url: "https://www.spotify.com",
    dateAdded: Date.now() - 1209600000, // 14 days ago
    category: "Music",
    preview: {
      description: "Digital music streaming service",
      favicon: "https://www.scdn.co/i/_global/favicon.png"
    }
  },
  {
    id: "15",
    title: "Airbnb",
    url: "https://www.airbnb.com",
    dateAdded: Date.now() - 1296000000, // 15 days ago
    category: "Travel",
    preview: {
      description: "Online marketplace for lodging and tourism",
      favicon: "https://a0.muscache.com/airbnb/static/logotype_favicon-21cc8e6c6a2cca43f061d2dcabdf6e58.ico"
    }
  }
];
