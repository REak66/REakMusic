export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'guest' | 'guest_user' | 'customer' | 'admin' | 'producer';
  isVerified: boolean;
  purchasedSongs: string[];
  avatarUrl?: string;
  artistId?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  _id: string;
  title: string;
  artistId: Artist | string;
  albumId?: Album | string;
  genre: Genre[] | string[];
  duration?: number;
  previewUrl?: string;
  driveFileId?: string;
  driveLink?: string;
  thumbnailId?: string;
  downloadCount: number;
  releaseYear?: number;
  description?: string;
  isFeatured: boolean;
  uploadedBy?: string;
  price?: number;
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
  color?: string;
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
  search?: string;
  limit?: number;
  page?: number;
  sort?: string;
  role?: string;
  owner?: string;
  featured?: boolean;
  ownerOnly?: boolean;
  albumId?: string;
  artistId?: string;
  genre?: string;
  releaseYear?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  role?: string;
}

export interface CartItem {
  song: Song;
  addedAt: number;
}
