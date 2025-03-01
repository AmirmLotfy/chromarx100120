
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { useSettings } from "@/stores/settingsStore";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Sparkles, Globe, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { defaultAffiliateBanners } from "@/config/affiliateContent";
import { useIsMobile } from "@/hooks/use-mobile";

const ServiceCard = ({ 
  index, 
  title, 
  description, 
  icon: Icon, 
  color,
  onLearnMore
}) => {
  const staggerDelay = 0.1 * index;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: staggerDelay }}
    >
      <Card className="h-full overflow-hidden border-none shadow-md bg-card hover:shadow-lg transition-all duration-300">
        <CardContent className="p-5 space-y-3">
          <div className={`p-3 w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="font-medium text-base">{title}</h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          
          <button 
            className="flex items-center text-sm font-medium text-primary mt-2 hover:underline"
            onClick={onLearnMore}
          >
            Explore
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const popularServices = [
  {
    id: "vpn",
    title: "Premium VPN",
    description: "Secure your online presence with military-grade encryption and privacy tools",
    icon: Shield,
    color: "bg-blue-500",
    url: "https://example.com/vpn"
  },
  {
    id: "productivity",
    title: "Focus Suite",
    description: "Boost your productivity with AI-powered time management tools",
    icon: Zap,
    color: "bg-purple-500",
    url: "https://example.com/productivity"
  },
  {
    id: "storage",
    title: "Cloud Storage",
    description: "Store and access your files from anywhere with bank-level security",
    icon: Globe,
    color: "bg-emerald-500",
    url: "https://example.com/storage"
  },
  {
    id: "passwords",
    title: "Password Guard",
    description: "Keep your accounts secure with encrypted password management",
    icon: Shield,
    color: "bg-amber-500",
    url: "https://example.com/password"
  },
  {
    id: "ai",
    title: "AI Writing Assistant",
    description: "Create perfect content in seconds with advanced AI technology",
    icon: Sparkles,
    color: "bg-rose-500",
    url: "https://example.com/ai"
  },
  {
    id: "premium",
    title: "Premium Support",
    description: "Get 24/7 priority support from our dedicated team of experts",
    icon: Star,
    color: "bg-indigo-500",
    url: "https://example.com/support"
  }
];

const SuggestedServicesPage = () => {
  const { affiliateBannersEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLearnMore = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-[70vh]">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Discover Services
            </h1>
            <p className="text-sm text-muted-foreground">
              Enhance your browsing with these handpicked tools
            </p>
          </div>

          {affiliateBannersEnabled && defaultAffiliateBanners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pb-3"
            >
              <Card className="overflow-hidden border-none shadow-md rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-0">
                  <AffiliateBannerCarousel />
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 rounded-lg bg-muted/50 p-1">
              <TabsTrigger value="all" className="rounded-md text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="productivity" className="rounded-md text-xs">
                Productivity
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-md text-xs">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {popularServices.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    index={index}
                    title={service.title}
                    description={service.description}
                    icon={service.icon}
                    color={service.color}
                    onLearnMore={() => handleLearnMore(service.url)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="productivity" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {popularServices
                  .filter(s => ["productivity", "ai", "storage"].includes(s.id))
                  .map((service, index) => (
                    <ServiceCard
                      key={service.id}
                      index={index}
                      title={service.title}
                      description={service.description}
                      icon={service.icon}
                      color={service.color}
                      onLearnMore={() => handleLearnMore(service.url)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {popularServices
                  .filter(s => ["vpn", "passwords", "premium"].includes(s.id))
                  .map((service, index) => (
                    <ServiceCard
                      key={service.id}
                      index={index}
                      title={service.title}
                      description={service.description}
                      icon={service.icon}
                      color={service.color}
                      onLearnMore={() => handleLearnMore(service.url)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="py-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 h-12 rounded-xl border-dashed"
              onClick={() => {}}
            >
              <span>Request new service</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SuggestedServicesPage;
