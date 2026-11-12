import { normalizePhone, parseBrDate, validateRegister, type RegisterForm } from '../validation';

const validForm: RegisterForm = {
  fullName: 'Bernardo Silva',
  email: 'bernardo@example.com',
  password: 'securePass123',
  confirmPassword: 'securePass123',
  phoneNumber: '+5531999999999',
  birthDate: '1995-06-15',
  gender: 'Male',
};

const now = new Date('2026-06-15T12:00:00Z');

describe('✅ validateRegister', () => {
  it('aceita um formulário válido', () => {
    expect(validateRegister(validForm, now)).toEqual({});
  });

  it('aponta cada campo inválido', () => {
    const errors = validateRegister(
      {
        fullName: ' ',
        email: 'invalido',
        password: '123',
        confirmPassword: '456',
        phoneNumber: 'abc',
        birthDate: '15/06/1995',
        gender: '',
      },
      now,
    );

    expect(Object.keys(errors).sort()).toEqual(
      ['birthDate', 'confirmPassword', 'email', 'fullName', 'gender', 'password', 'phoneNumber'].sort(),
    );
  });

  it('rejeita telefone vazio ou curto demais', () => {
    expect(validateRegister({ ...validForm, phoneNumber: '' }, now).phoneNumber).toBeDefined();
    expect(validateRegister({ ...validForm, phoneNumber: '+55' }, now).phoneNumber).toBeDefined();
  });

  it('exige 18 anos', () => {
    const errors = validateRegister({ ...validForm, birthDate: '2010-01-01' }, now);
    expect(errors.birthDate).toContain('18');
  });
});

describe('☎️ normalizePhone', () => {
  it('converte o formato brasileiro para E.164', () => {
    expect(normalizePhone('(31) 99999-9999')).toBe('+5531999999999');
  });

  it('mantém vazio quando não há número', () => {
    expect(normalizePhone('   ')).toBe('');
  });

  it('mantém números que já têm código do país', () => {
    expect(normalizePhone('+1 (415) 555-0100')).toBe('+14155550100');
  });
});

describe('📅 parseBrDate', () => {
  it('converte DD/MM/AAAA para ISO', () => {
    expect(parseBrDate('15/06/1995')).toBe('1995-06-15');
  });

  it('rejeita datas impossíveis ou fora do formato', () => {
    expect(parseBrDate('31/02/1995')).toBeNull();
    expect(parseBrDate('1995-06-15')).toBeNull();
  });
});
