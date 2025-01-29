import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";
import { ScrollArea } from "@/components/ui/scroll-area";

const SuggestedServicesPage = () => {
  return (
    <Layout>
      <ScrollArea className="h-[calc(100vh-4rem)] w-full">
        <section className="p-6 space-y-6">
          <header>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Suggested Services
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Discover tools and services that can enhance your productivity
            </p>
          </header>

          <AffiliateSection showAll={true} />

          <footer className="text-xs text-center text-muted-foreground">
            We may earn a commission when you purchase through these links.
          </footer>
        </section>
      </ScrollArea>
    </Layout>
  );
};

export default SuggestedServicesPage;