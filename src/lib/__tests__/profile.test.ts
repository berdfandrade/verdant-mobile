import { ageFrom, firstName, formatDistance, formatMessageTime, mainPhoto, otherParticipant } from '../profile';

describe('🎂 ageFrom', () => {
  const now = new Date('2026-06-15T12:00:00');

  it('calcula a idade completa', () => {
    expect(ageFrom('1995-06-15', now)).toBe(31);
  });

  it('ainda não fez aniversário no ano', () => {
    expect(ageFrom('1995-06-16', now)).toBe(30);
  });

  it('retorna null sem data ou com data inválida', () => {
    expect(ageFrom(undefined, now)).toBeNull();
    expect(ageFrom('not-a-date', now)).toBeNull();
  });
});

describe('📍 formatDistance', () => {
  it('mostra metros abaixo de 1 km', () => {
    expect(formatDistance(347)).toBe('350 m');
    expect(formatDistance(2)).toBe('1 m');
  });

  it('mostra km com uma casa abaixo de 10 km', () => {
    expect(formatDistance(2430)).toBe('2,4 km');
  });

  it('arredonda a partir de 10 km', () => {
    expect(formatDistance(12_600)).toBe('13 km');
  });

  it('retorna vazio sem valor', () => {
    expect(formatDistance(undefined)).toBe('');
  });
});

describe('👤 helpers de perfil', () => {
  it('firstName pega o primeiro nome', () => {
    expect(firstName('  Maria   Oliveira ')).toBe('Maria');
    expect(firstName(undefined)).toBe('');
  });

  it('mainPhoto pega a primeira foto', () => {
    expect(mainPhoto({ photos: [{ url: 'a.jpg' }, { url: 'b.jpg' }] })).toBe('a.jpg');
    expect(mainPhoto({ photos: [] })).toBeUndefined();
  });

  it('otherParticipant devolve quem não sou eu', () => {
    const participants = [{ _id: 'me' }, { _id: 'maria' }];
    expect(otherParticipant(participants, 'me')).toEqual({ _id: 'maria' });
  });
});

describe('🕒 formatMessageTime', () => {
  const now = new Date('2026-06-15T18:00:00');

  it('mostra a hora para mensagens de hoje', () => {
    expect(formatMessageTime(new Date('2026-06-15T09:05:00').toISOString(), now)).toBe('09:05');
  });

  it('mostra a data para outros dias', () => {
    expect(formatMessageTime(new Date('2026-06-02T09:05:00').toISOString(), now)).toBe('02/06');
  });
});

describe('🌎 ageFrom com datas da API (UTC)', () => {
  it('não volta um dia em fuso negativo', () => {
    // A API devolve meia-noite UTC; no Brasil (UTC-3) isso seria 21h do dia anterior
    const now = new Date(2026, 5, 15, 12); // 15/06/2026 local
    expect(ageFrom('1995-06-16T00:00:00.000Z', now)).toBe(30);
    expect(ageFrom('1995-06-15T00:00:00.000Z', now)).toBe(31);
  });
});
