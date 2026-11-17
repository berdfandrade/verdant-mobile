/*
  Destaque do nome na busca (Figma: 08 · Pesquisar deixa em negrito o trecho digitado).
  Segue a regra da API: começo de qualquer palavra, sem diferenciar maiúsculas e acentos.
*/

// Letra a letra, sem acento e minúscula: mantém os índices alinhados com o texto original
const fold = (text: string) => [...text].map(char => char.normalize('NFD')[0].toLowerCase()).join('');

export const MIN_SEARCH_LENGTH = 2;

export function searchableTerm(term: string): string | null {
  const trimmed = term.trim().replace(/\s+/g, ' ');
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : null;
}

export function splitHighlight(name: string, term: string): { before: string; match: string; after: string } {
  const folded = fold(name);
  const needle = fold(term.trim().replace(/\s+/g, ' '));
  let index = -1;
  if (needle) {
    for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + 1)) {
      if (at === 0 || /\s/.test(folded[at - 1])) {
        index = at;
        break;
      }
    }
  }
  if (index === -1) return { before: name, match: '', after: '' };
  return { before: name.slice(0, index), match: name.slice(index, index + needle.length), after: name.slice(index + needle.length) };
}
