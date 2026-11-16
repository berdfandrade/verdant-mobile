import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ headerShown: true, title: 'Entrar', headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="register" options={{ headerShown: true, title: 'Criar conta', headerBackTitle: 'Voltar' }} />
    </Stack>
  );
}
