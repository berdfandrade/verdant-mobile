import { searchableTerm, splitHighlight } from '../search';

describe('🔎 searchableTerm', () => {
  it('exige 2 caracteres e junta espaços', () => {
    expect(searchableTerm(' a ')).toBeNull();
    expect(searchableTerm('  lari   and ')).toBe('lari and');
  });
});

describe('✨ splitHighlight', () => {
  it('destaca o começo do nome ignorando maiúsculas e acentos', () => {
    expect(splitHighlight('Letícia Moreira', 'LETI')).toEqual({ before: '', match: 'Letí', after: 'cia Moreira' });
  });

  it('destaca o começo de outra palavra', () => {
    expect(splitHighlight('Larissa Andrade', 'and')).toEqual({ before: 'Larissa ', match: 'And', after: 'rade' });
  });

  it('não destaca no meio de uma palavra (achou pelo username)', () => {
    expect(splitHighlight('Larissa Andrade', 'issa')).toEqual({ before: 'Larissa Andrade', match: '', after: '' });
  });
});
