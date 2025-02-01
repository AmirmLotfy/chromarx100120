import Layout from "@/components/Layout";
import TimeManagement from "@/components/time-management/TimeManagement";

const TimerPage = () => {
  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Timer</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage your time effectively with customizable timers
          </p>
        </div>
        <TimeManagement />
      </div>
    </Layout>
  );
};

export default TimerPage;