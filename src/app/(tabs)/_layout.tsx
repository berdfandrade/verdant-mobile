import { View } from 'react-native';
import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { useRealtime } from '@/hooks/use-realtime';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/cn';

// Ícone da aba: a ativa ganha a "pílula" verde clara atrás (Figma: Tab bar)
function icon(outline: IconName, filled: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return (
      <View className={cn('h-8 w-14 items-center justify-center rounded-full', focused && 'bg-primary-soft')}>
        <Icon name={focused ? filled : outline} size={22} colorClassName={focused ? 'accent-primary' : 'accent-muted'} />
      </View>
    );
  };
}

// Abre no Descobrir, mesmo com Perfil sendo a primeira aba
export const unstable_settings = { initialRouteName: 'index' };

export default function TabsLayout() {
  const theme = useTheme();
  // Socket ligado enquanto o usuário está logado
  useRealtime();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.line, paddingTop: 6 },
      }}>
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('person-outline', 'person') }} />
      <Tabs.Screen name="index" options={{ title: 'Descobrir', tabBarIcon: icon('heart-outline', 'heart') }} />
      <Tabs.Screen name="connections" options={{ title: 'Conexões', tabBarIcon: icon('chatbubbles-outline', 'chatbubbles') }} />
    </Tabs>
  );
}
