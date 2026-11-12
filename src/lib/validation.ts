import type { RegisterPayload } from '@/api/types';

/* Mesmas regras do CreateUserDto da API, para dar feedback antes de enviar */

export type RegisterForm = Omit<RegisterPayload, 'showMe'> & { confirmPassword: string };
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164 com pelo menos 8 dígitos (a API aceita menos, mas nenhum celular real é tão curto)
const E164 = /^\+[1-9]\d{7,14}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const MIN_AGE = 18;

export function isValidEmail(email: string) {
  return EMAIL.test(email.trim());
}

// Aceita "(31) 99999-9999" e normaliza para "+5531999999999"
export function normalizePhone(phone: string, defaultCountry = '55'): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits.replace('+', '')) return '';
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`;
  return `+${defaultCountry}${digits}`;
}

// "15/06/1995" -> "1995-06-15"
export function parseBrDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(day)) return null;
  return iso;
}

export function validateRegister(form: RegisterForm, now: Date = new Date()): FieldErrors<RegisterForm> {
  const errors: FieldErrors<RegisterForm> = {};

  if (!form.fullName.trim()) errors.fullName = 'Informe seu nome';
  if (!isValidEmail(form.email)) errors.email = 'E-mail inválido';
  if (form.password.length < 6 || form.password.length > 64) errors.password = 'A senha deve ter de 6 a 64 caracteres';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'As senhas não conferem';
  if (!E164.test(form.phoneNumber)) errors.phoneNumber = 'Telefone inválido';
  if (!form.gender) errors.gender = 'Escolha uma opção';

  if (!ISO_DATE.test(form.birthDate)) {
    errors.birthDate = 'Use o formato DD/MM/AAAA';
  } else {
    const birth = new Date(`${form.birthDate}T12:00:00Z`);
    const adultSince = new Date(now);
    adultSince.setFullYear(adultSince.getFullYear() - MIN_AGE);
    if (birth > adultSince) errors.birthDate = `Você precisa ter pelo menos ${MIN_AGE} anos`;
  }

  return errors;
}
