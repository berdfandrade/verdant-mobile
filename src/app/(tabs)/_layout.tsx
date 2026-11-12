import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useRealtime } from '@/hooks/use-realtime';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
  };
}

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
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.line },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Descobrir', tabBarIcon: icon('flame') }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('heart') }} />
      <Tabs.Screen name="chats" options={{ title: 'Conversas', tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
