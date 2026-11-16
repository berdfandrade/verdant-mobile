import { api } from './client';
import type {
  ConversationSummary,
  Conversation,
  CreateDateInvitePayload,
  Credentials,
  DateInvite,
  FeedProfile,
  Id,
  LikeResponse,
  LoginResponse,
  Me,
  Message,
  Preferences,
  PublicProfile,
  RegisterPayload,
} from './types';

/* Uma função por rota da API. Mantém as URLs num lugar só. */

export const authApi = {
  login: (credentials: Credentials) => api.post<LoginResponse>('/login', credentials).then(r => r.data),
  logout: () => api.post<{ message: string }>('/login/logout').then(r => r.data),
};

export const usersApi = {
  register: (payload: RegisterPayload) => api.post<Me>('/users', payload).then(r => r.data),
  me: () => api.get<Me>('/users/me').then(r => r.data),
  getById: (id: Id) => api.get<PublicProfile>(`/users/${id}`).then(r => r.data),
};

export const profileApi = {
  feed: () => api.get<FeedProfile[]>('/profile/feed').then(r => r.data),
  getPreferences: () => api.get<Preferences>('/profile/preferences').then(r => r.data),
  updatePreferences: (preferences: Preferences) =>
    api.put<{ message: string }>('/profile/preferences', preferences).then(r => r.data),
  updateLocation: (longitude: number, latitude: number) =>
    api.put('/profile/location', { longitude, latitude }).then(r => r.data),
};

export const likesApi = {
  like: (profileId: Id) => api.post<LikeResponse>('/likes', { profileToBeLikedId: profileId }).then(r => r.data),
  pass: (profileId: Id) => api.post<{ passed: boolean }>('/likes/pass', { profileToBeLikedId: profileId }).then(r => r.data),
  unlike: (profileId: Id) => api.post<{ unliked: boolean }>('/likes/unlike', { profileToBeLikedId: profileId }).then(r => r.data),
  matches: () => api.get<PublicProfile[]>('/likes/matches').then(r => r.data),
  received: () => api.get<PublicProfile[]>('/likes/received').then(r => r.data),
};

export const conversationsApi = {
  mine: () => api.get<ConversationSummary[]>('/conversations/me').then(r => r.data),
  getById: (id: Id) => api.get<Conversation>(`/conversations/${id}`).then(r => r.data),
  between: (user1: Id, user2: Id) =>
    api.get<Conversation>('/conversations/between/users', { params: { user1, user2 } }).then(r => r.data),
  messages: (id: Id, { limit = 30, skip = 0 } = {}) =>
    api.get<Message[]>(`/conversations/${id}/messages`, { params: { limit, skip } }).then(r => r.data),
};

export const messagesApi = {
  send: (conversationId: Id, content: string) =>
    api.post<Message>('/messages', { conversationId, content }).then(r => r.data),
};

export const datesApi = {
  invite: (payload: CreateDateInvitePayload) => api.post<DateInvite>('/dates', payload).then(r => r.data),
  /** Dates pendentes e aceitos no intervalo. Sem `from`, só a partir de agora */
  list: (range: { from?: string; to?: string } = {}) =>
    api.get<DateInvite[]>('/dates', { params: range }).then(r => r.data),
  /** Convites que recebi e ainda não respondi */
  invites: () => api.get<DateInvite[]>('/dates/invites').then(r => r.data),
  accept: (id: Id) => api.patch<DateInvite>(`/dates/${id}/accept`).then(r => r.data),
  decline: (id: Id) => api.patch<DateInvite>(`/dates/${id}/decline`).then(r => r.data),
  cancel: (id: Id) => api.patch<DateInvite>(`/dates/${id}/cancel`).then(r => r.data),
};
