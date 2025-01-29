import Layout from "@/components/Layout";
import TimeManagement from "@/components/time-management/TimeManagement";

const TimerPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Time Management</h1>
          <p className="text-muted-foreground">
            Manage your time effectively with customizable timers and focus tools
          </p>
        </div>
        <TimeManagement />
      </div>
    </Layout>
  );
};

export default TimerPage;