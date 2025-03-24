
// Utility functions for interacting with the Roblox API

/**
 * Get user information from Roblox by username
 */
export const getRobloxUserByUsername = async (username: string) => {
  try {
    // First get the user ID from username
    const response = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`);
    
    if (!response.ok) throw new Error('Failed to fetch Roblox user');
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      return null;
    }
    
    const userId = data.data[0].id;
    
    // Now get detailed user info
    const userResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!userResponse.ok) throw new Error('Failed to fetch Roblox user details');
    
    const userData = await userResponse.json();
    
    // Get user thumbnail
    const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`);
    const thumbnailData = await thumbnailResponse.json();
    const thumbnailUrl = thumbnailData.data[0]?.imageUrl;
    
    return {
      id: userData.id,
      name: userData.name,
      displayName: userData.displayName,
      hasVerifiedBadge: userData.hasVerifiedBadge,
      created: userData.created,
      description: userData.description,
      thumbnailUrl
    };
  } catch (error) {
    console.error('Error fetching Roblox user:', error);
    return null;
  }
};

/**
 * Get game information from Roblox by game ID or name
 */
export const getRobloxGameById = async (gameId: string) => {
  try {
    // Get game details
    const response = await fetch(`https://games.roblox.com/v1/games?universeIds=${gameId}`);
    
    if (!response.ok) throw new Error('Failed to fetch Roblox game');
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      return null;
    }
    
    const gameData = data.data[0];
    
    // Get game icon
    const iconResponse = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${gameId}&size=150x150&format=Png`);
    const iconData = await iconResponse.json();
    const iconImageUrl = iconData.data[0]?.imageUrl;
    
    return {
      id: gameData.id,
      name: gameData.name,
      description: gameData.description,
      creator: gameData.creator,
      playerCount: gameData.playing,
      visitCount: gameData.visits,
      iconImageUrl
    };
  } catch (error) {
    console.error('Error fetching Roblox game:', error);
    return null;
  }
};

/**
 * Calculate mock revenue data for demo purposes
 * (This is just for demonstration as the real revenue API would require authentication)
 */
export const getMockRobloxRevenue = (gameVisits: number) => {
  // Mock calculation based on visits (just for demonstration)
  const estimatedRobux = Math.floor(gameVisits * 0.01);
  const estimatedUsd = (estimatedRobux / 1000 * 3.5).toFixed(2);
  
  return {
    robuxAmount: estimatedRobux,
    usdAmount: estimatedUsd
  };
};
