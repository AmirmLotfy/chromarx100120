
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from '@/components/PageTitle';
import { EnhancedAuthPanel } from '@/components/auth/EnhancedAuthPanel';
import { useAuth } from '@/hooks/useAuth';

export function UserPage() {
  const { isLoggedIn, userInfo } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle>User Account</PageTitle>
      
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <EnhancedAuthPanel />
          
          {isLoggedIn && userInfo && (
            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold">Account Details</h2>
              <p className="text-muted-foreground">
                Additional account information and settings would appear here.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-6">
          <h2 className="text-xl font-semibold">User Preferences</h2>
          <p className="text-muted-foreground mt-2">
            Customize your experience with personalized settings.
          </p>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <h2 className="text-xl font-semibold">Security Settings</h2>
          <p className="text-muted-foreground mt-2">
            Manage your account security and privacy settings.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserPage;
