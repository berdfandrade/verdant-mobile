/*
  Tipos das respostas da API (verdant-nest).
  Espelham os schemas/DTOs do backend: ao mudar um contrato na API,
  atualize aqui também.
*/

export type Id = string;

export interface Photo {
  url: string;
  uploadDate?: string;
}

export interface About {
  height?: number;
  physicalExercise?: string;
  education?: string;
  drinking?: string;
  smoking?: string;
  lookingFor?: string;
  children?: string;
  zodiacSign?: string;
  politics?: string;
  religion?: string;
}

export interface AdvancedFilters {
  verified?: boolean;
  height?: number[];
  education?: string[];
  alcohol?: string[];
  smoking?: string[];
  children?: string[];
  zodiacSign?: string[];
  politicalView?: string[];
  religion?: string[];
}

export interface Preferences {
  ageRange?: number[];
  /** Distância máxima em km ("50" ou "50km") */
  distance?: string;
  advancedFilters?: AdvancedFilters;
}

export interface GeoPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

/** Perfil público (feed, matches, participantes) */
export interface PublicProfile {
  _id: Id;
  fullName: string;
  username?: string;
  gender?: string;
  birthDate?: string;
  verified?: boolean;
  photos?: Photo[];
  description?: string[];
  interests?: string[];
  profession?: string[];
  languages?: string[];
  about?: About;
}

/** Item do feed: perfil + distância em metros */
export interface FeedProfile extends PublicProfile {
  distance: number;
}

/** O usuário logado (GET /users/me) */
export interface Me extends PublicProfile {
  email: string;
  phoneNumber: string;
  premium: boolean;
  active: boolean;
  location?: GeoPoint;
  preferences?: Preferences;
  showMe?: string[];
  matches: Id[];
  likedProfiles: Id[];
  likedYouProfiles: Id[];
  passedProfiles: Id[];
  conversations: Id[];
}

export interface Message {
  _id: Id;
  sender: Id;
  conversationId: Id;
  content: string;
  sentAt: string;
  editedAt?: string;
}

export interface Conversation {
  _id: Id;
  participants: PublicProfile[];
  startedAt: string;
  isActive: boolean;
  archivedAt?: string;
}

/** Item de GET /conversations/me */
export interface ConversationSummary extends Conversation {
  lastMessage: Message | null;
}

// ---- Auth ----

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: { id: Id; email: string };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  /** Formato E.164: +5511999998888 */
  phoneNumber: string;
  /** ISO (YYYY-MM-DD) */
  birthDate: string;
  gender: string;
  showMe?: string[];
}

// ---- Likes ----

export interface LikeResponse {
  liked: boolean;
  match?: boolean;
  alreadyLiked?: boolean;
  conversationId?: Id;
}

/** Erro padrão do NestJS */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
