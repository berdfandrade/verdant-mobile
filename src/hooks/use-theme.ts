import { useCSSVariable } from 'uniwind';

// Tokens definidos em src/global.css. Use className sempre que possível;
// este hook é só para props que exigem cor em JS (navegação, ícones, RefreshControl…).
const TOKENS = ['primary', 'on-primary', 'foreground', 'muted', 'background', 'line', 'like', 'pass'] as const;

export type ThemeToken = (typeof TOKENS)[number];

const VARIABLES = TOKENS.map(token => `--color-${token}`);

export function useTheme(): Record<ThemeToken, string> {
  const values = useCSSVariable(VARIABLES);
  return Object.fromEntries(TOKENS.map((token, index) => [token, String(values[index] ?? '')])) as Record<
    ThemeToken,
    string
  >;
}
