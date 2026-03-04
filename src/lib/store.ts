
export type ContentType = 'movie' | 'series';

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
  streamUrl?: string; // For movies
  seasons?: Season[]; // For series
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  subscriptionTier: 'free' | '30-day' | 'lifetime' | 'custom';
  expiryDate?: string;
}

// In-memory mock data
export let mockContent: ContentItem[] = [
  {
    id: 'm1',
    title: 'Neon Shadows',
    type: 'movie',
    description: 'A detective in a neon-lit futuristic city uncovers a conspiracy that goes deeper than the synthetic skin of its inhabitants.',
    genre: 'Sci-Fi',
    thumbnail: 'https://picsum.photos/seed/movie1/600/900',
    isRestricted: false,
    streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 's1',
    title: 'The Purple Code',
    type: 'series',
    description: 'A group of hackers discover an ancient digital language that allows them to manipulate reality itself.',
    genre: 'Thriller',
    thumbnail: 'https://picsum.photos/seed/series1/600/900',
    isRestricted: true,
    seasons: [
      {
        number: 1,
        episodes: [
          { id: 'e1', title: 'The Awakening', number: 1, streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { id: 'e2', title: 'Binary Soul', number: 2, streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
      }
    ]
  }
];

export let mockUsers: User[] = [
  { id: 'u1', email: 'admin@leo.tv', role: 'admin', subscriptionTier: 'lifetime' },
  { id: 'u2', email: 'user@leo.tv', role: 'user', subscriptionTier: 'free' }
];

export const addContent = (item: ContentItem) => {
  mockContent = [...mockContent, item];
};

export const updateContent = (item: ContentItem) => {
  mockContent = mockContent.map(c => c.id === item.id ? item : c);
};

export const deleteContent = (id: string) => {
  mockContent = mockContent.filter(c => c.id !== id);
};
