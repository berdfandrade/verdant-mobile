import { Uniwind } from 'uniwind';

import { storage } from '@/lib/storage';

/* Tema escolhido em Configurações. "system" segue o aparelho (padrão). */

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'verdant.theme';

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

// Aplica o tema salvo; chamado uma vez na abertura do app
export async function restoreThemePreference(): Promise<void> {
  const saved = await storage.get(KEY);
  if (isPreference(saved)) Uniwind.setTheme(saved);
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  Uniwind.setTheme(preference);
  await storage.set(KEY, preference);
}

export function currentThemePreference(): ThemePreference {
  return Uniwind.hasAdaptiveThemes ? 'system' : Uniwind.currentTheme;
}
