import type { PublicProfile } from '@/api/types';

// Idade completa a partir da data de nascimento
export function ageFrom(birthDate?: string | Date, now: Date = new Date()): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  // A API guarda a data como meia-noite UTC: lemos o dia em UTC para não
  // "voltar" um dia em fusos negativos (ex.: Brasil)
  const year = birth.getUTCFullYear();
  const month = birth.getUTCMonth();
  const day = birth.getUTCDate();

  let age = now.getFullYear() - year;
  const beforeBirthday = now.getMonth() < month || (now.getMonth() === month && now.getDate() < day);
  if (beforeBirthday) age--;
  return age;
}

// "350 m", "2,4 km", "12 km"
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null || Number.isNaN(meters)) return '';
  if (meters < 1000) return `${Math.max(1, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`;
}

export function firstName(fullName?: string): string {
  return fullName?.trim().split(/\s+/)[0] ?? '';
}

export function mainPhoto(profile?: Pick<PublicProfile, 'photos'>): string | undefined {
  return profile?.photos?.[0]?.url;
}

// Participante da conversa que não é o usuário logado
export function otherParticipant<T extends { _id: string }>(participants: T[], myId: string | null): T | undefined {
  return participants.find(p => p._id !== myId) ?? participants[0];
}

// Hora (hoje) ou data curta (outros dias)
export function formatMessageTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const sameDay = date.toDateString() === now.toDateString();
  const pad = (n: number) => String(n).padStart(2, '0');
  return sameDay
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
