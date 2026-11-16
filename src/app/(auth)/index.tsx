import { View } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { AppText, Button, Logo, SafeAreaView } from '@/components/ui';

// Boas-vindas (Figma: 02 · Login). A API só tem login por e-mail, então os botões levam aos formulários.
export default function WelcomeScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-primary">
      <StatusBar style="light" />
      <View className="w-full max-w-content flex-1 self-center px-6">
        <View className="flex-1 items-center justify-center gap-3">
          <Logo size="lg" tone="white" />
          <AppText tone="white-soft" className="text-center">
            Conexões que florescem de verdade.
          </AppText>
        </View>

        <View className="gap-3 pb-4">
          <Link href="/login" asChild>
            <Button title="Entrar com e-mail" variant="light" icon="mail-outline" />
          </Link>
          <Link href="/register" asChild>
            <Button title="Criar conta" variant="black" icon="person-add-outline" />
          </Link>
          <AppText variant="micro" tone="white-soft" className="mt-4 text-center">
            Versão {Constants.expoConfig?.version ?? ''}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}
