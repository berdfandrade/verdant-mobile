import type { DateInvite } from '@/api/types';

import {
  addMonths,
  atMinutes,
  dateRoles,
  dayKey,
  formatDayMonth,
  formatMinutes,
  formatShortDate,
  formatTime,
  isFuture,
  monthGrid,
  monthRange,
} from '../dates';

describe('📅 monthGrid', () => {
  it('começa na segunda e tem 6 semanas (Novembro de 2026 abre em 26/10)', () => {
    const grid = monthGrid(new Date(2026, 10, 16));
    expect(grid).toHaveLength(42);
    expect(dayKey(grid[0])).toBe('2026-10-26');
    expect(grid[0].getDay()).toBe(1);
    expect(dayKey(grid[41])).toBe('2026-12-06');
  });

  it('mês que começa na segunda não ganha semana vazia antes', () => {
    // 1º de junho de 2026 é segunda
    expect(dayKey(monthGrid(new Date(2026, 5, 10))[0])).toBe('2026-06-01');
  });
});

describe('🗓️ addMonths e monthRange', () => {
  it('vira o ano', () => {
    expect(dayKey(addMonths(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(dayKey(addMonths(new Date(2026, 0, 31), -1))).toBe('2025-12-01');
  });

  it('cobre o mês inteiro, do primeiro ao último instante', () => {
    const { from, to } = monthRange(new Date(2026, 10, 16));
    expect(new Date(from).getTime()).toBe(new Date(2026, 10, 1).getTime());
    expect(new Date(to).getTime()).toBe(new Date(2026, 11, 1).getTime() - 1);
  });
});

describe('🕖 formatação', () => {
  const date = new Date(2026, 10, 21, 19, 5);

  it('formata dia, hora e dia da semana', () => {
    expect(formatDayMonth(date)).toBe('21/11');
    expect(formatTime(date)).toBe('19:05');
    expect(formatShortDate(date)).toBe('Sáb, 21/11');
  });

  it('converte minutos do dia em horário e junta com o dia escolhido', () => {
    expect(formatMinutes(19 * 60 + 30)).toBe('19:30');
    expect(formatMinutes(0)).toBe('00:00');
    expect(atMinutes(new Date(2026, 10, 21), 19 * 60 + 30).getTime()).toBe(new Date(2026, 10, 21, 19, 30).getTime());
  });
});

describe('⏭️ isFuture', () => {
  const now = new Date(2026, 10, 16, 12, 0);
  it('só aceita horários depois de agora', () => {
    expect(isFuture(new Date(2026, 10, 16, 12, 30), now)).toBe(true);
    expect(isFuture(new Date(2026, 10, 16, 12, 0), now)).toBe(false);
    expect(isFuture(new Date(2026, 10, 16, 11, 30), now)).toBe(false);
  });
});

describe('👥 dateRoles', () => {
  const date = {
    inviter: { _id: 'juliana', fullName: 'Juliana' },
    invitee: { _id: 'me', fullName: 'Eu' },
  } as DateInvite;

  it('identifica convite recebido e a outra pessoa', () => {
    expect(dateRoles(date, 'me')).toEqual({ other: date.inviter, invitedMe: true });
    expect(dateRoles(date, 'juliana')).toEqual({ other: date.invitee, invitedMe: false });
  });
});
