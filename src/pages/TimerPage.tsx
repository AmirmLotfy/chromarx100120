import Layout from "@/components/Layout";

const TimerPage = () => {
  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Focus Timer</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage your time effectively with AI-powered timers and focus tools
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TimerPage;