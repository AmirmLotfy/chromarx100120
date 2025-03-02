
import { ChromeBookmark } from "@/types/bookmark";

export const dummyBookmarks: ChromeBookmark[] = [
  {
    id: "1",
    title: "GitHub - Your Code Repository",
    url: "https://github.com",
    dateAdded: Date.now() - 86400000,
    category: "Development",
    preview: {
      description: "GitHub is where over 100 million developers shape the future of software, together.",
      favicon: "https://github.githubassets.com/favicons/favicon.svg",
      themeColor: "#1f2328"
    }
  },
  {
    id: "2",
    title: "Stack Overflow - Developer Community",
    url: "https://stackoverflow.com",
    dateAdded: Date.now() - 172800000,
    category: "Development",
    preview: {
      description: "Stack Overflow is the largest, most trusted online community for developers to learn and share programming knowledge.",
      favicon: "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico",
      themeColor: "#f48024"
    }
  },
  {
    id: "3",
    title: "MDN Web Docs - Frontend Resources",
    url: "https://developer.mozilla.org",
    dateAdded: Date.now() - 259200000,
    category: "Development",
    preview: {
      description: "The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs for both Web sites and progressive web apps.",
      favicon: "https://developer.mozilla.org/favicon-48x48.png",
      themeColor: "#000000"
    }
  },
  {
    id: "4",
    title: "Figma - Design Tool",
    url: "https://figma.com",
    dateAdded: Date.now() - 345600000,
    category: "Design",
    preview: {
      description: "Figma connects everyone in the design process so teams can deliver better products, faster.",
      favicon: "https://static.figma.com/app/icon/1/favicon.svg",
      themeColor: "#1e1e1e"
    }
  },
  {
    id: "5",
    title: "AWS - Cloud Services",
    url: "https://aws.amazon.com",
    dateAdded: Date.now() - 432000000,
    category: "Cloud",
    preview: {
      description: "Amazon Web Services offers reliable, scalable, and inexpensive cloud computing services.",
      favicon: "https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico",
      themeColor: "#232f3e"
    }
  },
  {
    id: "6",
    title: "YouTube - Video Platform",
    url: "https://youtube.com",
    dateAdded: Date.now() - 518400000,
    category: "Entertainment",
    preview: {
      description: "Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.",
      favicon: "https://www.youtube.com/s/desktop/ea542ad9/img/favicon.ico",
      themeColor: "#ff0000"
    }
  },
  {
    id: "7",
    title: "Medium - Reading Articles",
    url: "https://medium.com",
    dateAdded: Date.now() - 604800000,
    category: "Reading",
    preview: {
      description: "Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing on any topic.",
      favicon: "https://medium.com/favicon.ico",
      themeColor: "#000000"
    }
  },
  {
    id: "8",
    title: "Trello - Project Management",
    url: "https://trello.com",
    dateAdded: Date.now() - 691200000,
    category: "Productivity",
    preview: {
      description: "Trello helps teams move work forward. Collaborate, manage projects, and reach new productivity peaks.",
      favicon: "https://a.trellocdn.com/prgb/dist/images/ios/apple-touch-icon-152x152-precomposed.0307bc39ec6c9ff499c8.png",
      themeColor: "#0079bf"
    }
  },
  {
    id: "9",
    title: "Vercel - Deployment Platform",
    url: "https://vercel.com",
    dateAdded: Date.now() - 777600000,
    category: "Development",
    preview: {
      description: "Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.",
      favicon: "https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico",
      themeColor: "#000000"
    }
  },
  {
    id: "10",
    title: "ChatGPT - AI Assistant",
    url: "https://chat.openai.com",
    dateAdded: Date.now() - 864000000,
    category: "AI",
    preview: {
      description: "ChatGPT is a free-to-use AI system. Use it for engaging conversations, gain insights, automate tasks, and learn.",
      favicon: "https://chat.openai.com/apple-touch-icon.png",
      themeColor: "#10a37f"
    }
  }
];
