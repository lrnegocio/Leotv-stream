
export type ContentType = 'movie' | 'series' | 'channel';

export interface Episode {
  id: string;
  title: string;
  number: number;
  streamUrl: string;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  genre: string;
  thumbnail: string;
  isRestricted: boolean; // For adult content / locked content
  streamUrl?: string; // For movies or channels
  seasons?: Season[]; // For series
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime' | 'custom';

export interface User {
  id: string;
  email?: string;
  pin: string; // The access code
  role: 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; // ISO string
  maxScreens: number;
  activeDevices: string[]; // List of device IDs
  isBlocked: boolean;
  parentalPin?: string;
}

// In-memory mock data
export let mockContent: ContentItem[] = [
  {
    id: 'm1',
    title: 'Neon Shadows',
    type: 'movie',
    description: 'A detective in a neon-lit futuristic city uncovers a conspiracy.',
    genre: 'Sci-Fi',
    thumbnail: 'https://picsum.photos/seed/movie1/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'c1',
    title: 'HBO Latino',
    type: 'channel',
    description: 'Canal de filmes e séries premiadas.',
    genre: 'Premium',
    thumbnail: 'https://picsum.photos/seed/hbo/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export let mockUsers: User[] = [
  { 
    id: 'u1', 
    email: 'admin@leo.tv', 
    pin: 'admin123',
    role: 'admin', 
    subscriptionTier: 'lifetime',
    maxScreens: 10,
    activeDevices: [],
    isBlocked: false,
    parentalPin: '1234'
  },
  { 
    id: 'u2', 
    pin: 'test1234',
    role: 'user', 
    subscriptionTier: 'test',
    expiryDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    maxScreens: 1,
    activeDevices: [],
    isBlocked: false,
    parentalPin: '0000'
  }
];

export const generateRandomPin = (length: number = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const addContent = (item: ContentItem) => {
  mockContent = [...mockContent, item];
};

export const updateContent = (item: ContentItem) => {
  mockContent = mockContent.map(c => c.id === item.id ? item : c);
};

export const deleteContent = (id: string) => {
  mockContent = mockContent.filter(c => c.id !== id);
};

export const addUser = (user: User) => {
  mockUsers = [...mockUsers, user];
};

export const updateUser = (user: User) => {
  mockUsers = mockUsers.map(u => u.id === user.id ? user : u);
};
