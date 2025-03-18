
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function EnhancedAuthPanel() {
  const { isLoggedIn, isLoading, userInfo, login, logout, refreshUserInfo } = useAuth();

  // Format JSON for display
  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Authentication Status</CardTitle>
          <Badge variant={isLoggedIn ? "success" : "destructive"}>
            {isLoading ? 'Loading...' : (isLoggedIn ? 'Authenticated' : 'Not Authenticated')}
          </Badge>
        </div>
        <CardDescription>
          Chrome Identity with automatic token refresh
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoggedIn && userInfo && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userInfo.picture} alt={userInfo.name} />
                <AvatarFallback>{userInfo.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{userInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{userInfo.email}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">User Information</h4>
              <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-40">
                {formatJSON(userInfo)}
              </pre>
            </div>
          </div>
        )}
        
        {!isLoggedIn && !isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            <p>You are not currently authenticated.</p>
            <p className="text-sm mt-2">Sign in to access your account.</p>
          </div>
        )}
        
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Loading authentication status...</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isLoggedIn ? (
          <>
            <Button variant="outline" onClick={refreshUserInfo}>
              Refresh Info
            </Button>
            <Button variant="destructive" onClick={logout}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={login} disabled={isLoading}>
            Sign In with Google
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default EnhancedAuthPanel;
