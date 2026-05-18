export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  purchasedSongs: string[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  _id: string;
  title: string;
  artistId: Artist | string;
  albumId?: Album | string;
  genre: Genre[] | string[];
  price: number;
  duration?: number;
  previewUrl?: string;
  driveFileId?: string;
  driveLink?: string;
  thumbnailId?: string;
  downloadCount: number;
  releaseYear?: number;
  description?: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Artist {
  _id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  country?: string;
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  _id: string;
  title: string;
  artistId: Artist | string;
  coverUrl?: string;
  releaseYear?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: 'weekly' | 'monthly';
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'rejected';
  startDate?: string;
  endDate?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SongQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  releaseYear?: number;
  sort?: string;
  artistId?: string;
  albumId?: string;
  featured?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CartItem {
  song: Song;
  addedAt: number;
}
