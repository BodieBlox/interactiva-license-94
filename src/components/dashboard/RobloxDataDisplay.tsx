
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

interface RobloxUserProps {
  user: any;
}

export const RobloxUserDisplay = ({ user }: RobloxUserProps) => {
  if (!user) return null;
  
  return (
    <Card className="shadow-sm border rounded-lg overflow-hidden bg-white dark:bg-gray-900 mt-3 mb-3 hover-lift">
      <CardHeader className="bg-primary/5 p-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Roblox User</span>
          {user.hasVerifiedBadge && (
            <Badge variant="default" className="text-xs">Verified</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {user.thumbnailUrl && (
            <Avatar className="h-16 w-16 rounded-lg border">
              <img src={user.thumbnailUrl} alt={user.name} />
            </Avatar>
          )}
          <div>
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
            <p className="text-sm text-muted-foreground">Display Name: {user.displayName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RobloxGameProps {
  game: any;
}

export const RobloxGameDisplay = ({ game }: RobloxGameProps) => {
  if (!game) return null;
  
  return (
    <Card className="shadow-sm border rounded-lg overflow-hidden bg-white dark:bg-gray-900 mt-3 mb-3 hover-lift">
      <CardHeader className="bg-primary/5 p-4">
        <CardTitle className="text-lg">Roblox Game</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {game.iconImageUrl && (
            <Avatar className="h-16 w-16 rounded-lg border">
              <img src={game.iconImageUrl} alt={game.name} />
            </Avatar>
          )}
          <div>
            <h3 className="font-bold text-lg">{game.name}</h3>
            <p className="text-sm text-muted-foreground">Creator: {game.creator?.name}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{game.playerCount || 0} playing now</Badge>
              <Badge variant="outline">{game.visitCount || 0} total visits</Badge>
            </div>
          </div>
        </div>
        {game.description && (
          <p className="mt-3 text-sm">{game.description}</p>
        )}
      </CardContent>
    </Card>
  );
};

interface RobloxRevenueProps {
  revenue: any;
}

export const RobloxRevenueDisplay = ({ revenue }: RobloxRevenueProps) => {
  if (!revenue) return null;
  
  return (
    <Card className="shadow-sm border rounded-lg overflow-hidden bg-white dark:bg-gray-900 mt-3 mb-3 hover-lift">
      <CardHeader className="bg-primary/5 p-4">
        <CardTitle className="text-lg">Roblox Product Revenue</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold">R$ {revenue.robuxAmount || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">USD Equivalent</p>
            <p className="text-xl font-bold">${revenue.usdAmount || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
