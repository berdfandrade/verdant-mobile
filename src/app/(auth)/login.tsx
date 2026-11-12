import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';

import { getErrorMessage } from '@/api/client';
import { AppText, Button, Image, Screen, TextField } from '@/components/ui';
import { isValidEmail } from '@/lib/validation';
import { useAuth } from '@/store/auth';

export default function LoginScreen() {
  const signIn = useAuth(state => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidEmail(email) && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="grow justify-center gap-4 py-8" keyboardShouldPersistTaps="handled">
          <View className="mb-4 items-center gap-1">
            <Image
              source={require('@/assets/images/logo.png')}
              className="h-16 w-[220px]"
              contentFit="contain"
              accessibilityLabel="Verdant"
            />
            <AppText variant="caption">Conheça pessoas perto de você</AppText>
          </View>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="voce@exemplo.com"
          />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            placeholder="Sua senha"
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <AppText tone="danger" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}

          <Button title="Entrar" onPress={handleLogin} loading={loading} disabled={!canSubmit} />

          <Link href="/register" asChild>
            <Button title="Não tem conta? Cadastre-se" variant="ghost" />
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
