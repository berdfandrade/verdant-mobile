import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { getErrorMessage } from '@/api/client';
import { usersApi } from '@/api/endpoints';
import { AppText, Button, ChipGroup, Screen, TextField } from '@/components/ui';
import { normalizePhone, parseBrDate, validateRegister, type FieldErrors, type RegisterForm } from '@/lib/validation';
import { useAuth } from '@/store/auth';

const GENDERS = [
  { label: 'Mulher', value: 'Female' },
  { label: 'Homem', value: 'Male' },
  { label: 'Não binário', value: 'Non-binary' },
] as const;

const SHOW_ME = [
  { label: 'Mulheres', value: 'women' },
  { label: 'Homens', value: 'men' },
  { label: 'Todos', value: 'everyone' },
] as const;

type Gender = (typeof GENDERS)[number]['value'];
type ShowMe = (typeof SHOW_ME)[number]['value'];

export default function RegisterScreen() {
  const signIn = useAuth(state => state.signIn);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [showMe, setShowMe] = useState<ShowMe | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<FieldErrors<RegisterForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const form: RegisterForm = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: normalizePhone(phone),
      birthDate: parseBrDate(birthDate) ?? birthDate,
      gender,
      password,
      confirmPassword,
    };

    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const { confirmPassword: _, ...payload } = form;
      await usersApi.register({ ...payload, showMe: showMe ? [showMe] : undefined });
      // Cadastro ok: entra direto (a localização é pedida na primeira tela)
      await signIn({ email: form.email, password: form.password });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="gap-4 py-6" keyboardShouldPersistTaps="handled">
          <TextField label="Nome completo" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" />
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label="Celular"
            value={phone}
            onChangeText={setPhone}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            placeholder="(31) 99999-9999"
            autoComplete="tel"
          />
          <TextField
            label="Data de nascimento"
            value={birthDate}
            onChangeText={setBirthDate}
            error={errors.birthDate}
            keyboardType="numbers-and-punctuation"
            placeholder="DD/MM/AAAA"
            maxLength={10}
          />
          <ChipGroup label="Eu sou" options={[...GENDERS]} value={gender} onChange={setGender} error={errors.gender} />
          <ChipGroup label="Quero conhecer" options={[...SHOW_ME]} value={showMe} onChange={setShowMe} />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete="new-password"
          />
          <TextField
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
          />

          {submitError ? (
            <AppText tone="danger" accessibilityRole="alert">
              {submitError}
            </AppText>
          ) : null}

          <Button title="Criar conta" onPress={handleRegister} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

