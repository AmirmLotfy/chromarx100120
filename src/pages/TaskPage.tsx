import Layout from "@/components/Layout";

const TaskPage = () => {
  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 pb-20">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Create and manage your tasks efficiently
          </p>
        </div>
        <div className="space-y-8">
          {/* Content will be added later */}
        </div>
      </div>
    </Layout>
  );
};

export default TaskPage;
