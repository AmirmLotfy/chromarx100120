
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const UserPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Guest User</CardTitle>
              <CardDescription>
                You are currently using the app as a guest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Features are limited in guest mode.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;
