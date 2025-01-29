import Layout from "@/components/Layout";
import AffiliateSection from "@/components/affiliate/AffiliateSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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

          <Alert variant="default" className="bg-accent/50 border-accent">
            <Info className="h-4 w-4" />
            <AlertDescription>
              These are carefully selected services that we believe will help improve your productivity.
              We may earn a commission when you purchase through these links.
            </AlertDescription>
          </Alert>

          <AffiliateSection showAll={true} />

          <Separator className="my-6" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Why We Recommend These Services</h2>
            <p className="text-muted-foreground">
              Each service has been thoroughly evaluated based on:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Integration capabilities with ChroMarx</li>
              <li>User experience and interface design</li>
              <li>Value for money and pricing structure</li>
              <li>Customer support quality</li>
              <li>Security and privacy features</li>
            </ul>
          </div>

          <footer className="text-xs text-center text-muted-foreground mt-8">
            Disclosure: We may earn a commission when you purchase through these links.
            This helps support the development of ChroMarx.
          </footer>
        </section>
      </ScrollArea>
    </Layout>
  );
};

export default SuggestedServicesPage;