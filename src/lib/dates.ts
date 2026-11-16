import type { DateInvite } from '@/api/types';

/*
  Utilitários de data para os dates (calendário, cards e formulário).
  Tudo no fuso do aparelho: o calendário mostra o dia em que o encontro acontece para quem está olhando.
*/

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Cabeçalho do calendário, começando na segunda (Figma: 07 · Dates)
export const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Índice de Date.getDay() (0 = domingo)
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const pad = (n: number) => String(n).padStart(2, '0');

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Chave do dia no fuso local ("2026-11-20"), para marcar dias com date
export function dayKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 6 semanas (42 dias) a partir da segunda que abre o mês: o calendário não muda de altura entre meses
export function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // segunda = 0
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
}

// Intervalo do mês inteiro para GET /dates?from=&to=
export function monthRange(month: Date): { from: string; to: string } {
  const from = startOfMonth(month);
  const to = new Date(addMonths(month, 1).getTime() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

// "20/11"
export function formatDayMonth(date: Date | string): string {
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

// "17:30"
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "Sex"
export function formatWeekday(date: Date | string): string {
  return WEEKDAYS[new Date(date).getDay()];
}

// "Sáb, 21/11"
export function formatShortDate(date: Date | string): string {
  return `${formatWeekday(date)}, ${formatDayMonth(date)}`;
}

// Minutos desde a meia-noite → "19:30"
export function formatMinutes(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// Dia escolhido no calendário + horário em minutos
export function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

export function isFuture(date: Date, now: Date = new Date()): boolean {
  return date.getTime() > now.getTime();
}

// Quem é a outra pessoa do date e se o convite é para mim
export function dateRoles(date: DateInvite, myId: string | null) {
  const invitedMe = date.invitee._id === myId;
  return { other: invitedMe ? date.inviter : date.invitee, invitedMe };
}
