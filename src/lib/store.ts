
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
  isRestricted: boolean; 
  streamUrl?: string; 
  seasons?: Season[]; 
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime' | 'custom';

export interface User {
  id: string;
  email?: string;
  pin: string; 
  role: 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; 
  maxScreens: number;
  activeDevices: string[]; 
  isBlocked: boolean;
  parentalPin?: string;
}

export let mockContent: ContentItem[] = [
  {
    id: 'm1',
    title: 'Sombras de Neon',
    type: 'movie',
    description: 'Um detetive em uma cidade futurista iluminada por neon descobre uma conspiração que ameaça a humanidade.',
    genre: 'Ficção Científica',
    thumbnail: 'https://picsum.photos/seed/movie1/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'c1',
    title: 'HBO Latino HD',
    type: 'channel',
    description: 'O melhor do cinema mundial e séries exclusivas 24 horas por dia.',
    genre: 'Premium',
    thumbnail: 'https://picsum.photos/seed/hbo/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'm2',
    title: 'Horizonte Perdido',
    type: 'movie',
    description: 'Uma jornada épica através de terras desconhecidas em busca de uma civilização antiga.',
    genre: 'Aventura',
    thumbnail: 'https://picsum.photos/seed/movie2/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export let mockUsers: User[] = [
  { 
    id: 'admin-master', 
    email: 'admin@leo.tv', 
    pin: 'adm77x2p',
    role: 'admin', 
    subscriptionTier: 'lifetime',
    maxScreens: 10,
    activeDevices: [],
    isBlocked: false,
    parentalPin: '1234'
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
