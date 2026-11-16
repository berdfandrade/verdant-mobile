import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { profileApi } from '@/api/endpoints';
import type { Preferences } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, Logo, Screen, TextField, type IconName } from '@/components/ui';
import { useMe } from '@/hooks/use-me';
import { useSyncLocation } from '@/hooks/use-sync-location';
import { cn } from '@/lib/cn';
import { ageFrom, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { currentThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme-preference';
import { useAuth } from '@/store/auth';

const MIN_AGE = 18;
const MAX_AGE = 99;
// Mesmo padrão da API quando o usuário não definiu distância
const DEFAULT_DISTANCE_KM = 10;

export default function ProfileScreen() {
  const signOut = useAuth(state => state.signOut);
  const me = useMe();
  const location = useSyncLocation();

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  if (me.isLoading) return <Loading />;

  if (me.error || !me.data) {
    return (
      <Screen>
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível carregar seu perfil"
          message={getErrorMessage(me.error)}
          action={<Button title="Tentar novamente" onPress={() => me.refetch()} />}
        />
      </Screen>
    );
  }

  const user = me.data;
  const age = ageFrom(user.birthDate);
  const locationLabel = {
    updating: 'Atualizando localização…',
    ok: 'Localização atualizada',
    denied: 'Permissão de localização negada',
    error: 'Não foi possível obter sua localização',
  }[location.status];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8" keyboardShouldPersistTaps="handled">
        <AppText variant="title" className="pt-2">
          Configurações
        </AppText>

        <View className="flex-row items-center gap-4 rounded-3xl bg-surface p-4">
          <Avatar uri={mainPhoto(user)} name={user.fullName} size={60} />
          <View className="flex-1 gap-0.5">
            <AppText className="font-bold" numberOfLines={1}>
              {user.fullName}
              {age !== null ? `, ${age}` : ''}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {user.email}
            </AppText>
            {user.verified ? (
              <View className="mt-1 flex-row items-center gap-1 self-start rounded-full bg-primary-soft px-2 py-0.5">
                <Icon name="checkmark-circle" size={12} colorClassName="accent-primary" />
                <AppText variant="micro" tone="primary" className="font-semibold">
                  Perfil verificado
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* key: recria o formulário com os valores do servidor ao trocar de usuário */}
        <PreferencesCard key={user._id} preferences={user.preferences} />

        <View className="rounded-3xl bg-surface px-4">
          <Row icon="location-outline" title="Localização" subtitle={locationLabel || 'Usada para mostrar pessoas perto de você.'}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atualizar localização"
              onPress={location.sync}
              disabled={location.status === 'updating'}
              className="size-9 items-center justify-center rounded-full bg-background active:opacity-70 disabled:opacity-50">
              <Icon name="refresh" size={18} colorClassName="accent-foreground" />
            </Pressable>
          </Row>
          <View className="ml-12 h-hairline bg-line" />
          <Row icon="sunny-outline" title="Tema">
            <ThemeSwitch />
          </Row>
        </View>

        <Button title="Sair" variant="ink" icon="log-out-outline" onPress={handleSignOut} loading={signingOut} />

        <View className="items-center gap-1 pt-2">
          <Logo size="sm" />
          <AppText variant="micro">Versão {Constants.expoConfig?.version ?? ''}</AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, title, subtitle, children }: { icon: IconName; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="size-9 items-center justify-center rounded-full bg-primary-soft">
        <Icon name={icon} size={18} colorClassName="accent-primary" />
      </View>
      <View className="flex-1">
        <AppText variant="label">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Auto', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
];

function ThemeSwitch() {
  const [value, setValue] = useState(currentThemePreference);

  const choose = (preference: ThemePreference) => {
    setValue(preference);
    setThemePreference(preference);
  };

  return (
    <View accessibilityRole="radiogroup" className="flex-row rounded-full bg-background p-0.5">
      {THEME_OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => choose(option.value)}
            className={cn('rounded-full px-3 py-1', selected && 'bg-surface shadow-sm')}>
            <AppText variant="caption" tone={selected ? 'default' : 'muted'} className="font-semibold">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <View className="gap-4 rounded-3xl bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-9 items-center justify-center rounded-full bg-primary-soft">
          <Icon name={icon} size={18} colorClassName="accent-primary" />
        </View>
        <AppText variant="label">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function PreferencesCard({ preferences }: { preferences?: Preferences }) {
  const queryClient = useQueryClient();

  const [distance, setDistance] = useState(() =>
    preferences?.distance ? String(parseFloat(preferences.distance) || '') : '',
  );
  const [minAge, setMinAge] = useState(() => String(preferences?.ageRange?.[0] ?? ''));
  const [maxAge, setMaxAge] = useState(() => String(preferences?.ageRange?.[1] ?? ''));
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const save = useMutation({
    mutationFn: () => {
      // Campo vazio = valor padrão
      const min = minAge.trim() ? Number(minAge) : MIN_AGE;
      const max = maxAge.trim() ? Number(maxAge) : MAX_AGE;
      const km = distance.trim() ? Number(distance) : DEFAULT_DISTANCE_KM;

      if (!Number.isFinite(km) || km < 1 || km > 500) throw new Error('A distância deve ser entre 1 e 500 km');
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < MIN_AGE || max > MAX_AGE || min > max) {
        throw new Error(`Faixa etária inválida (entre ${MIN_AGE} e ${MAX_AGE})`);
      }

      return profileApi.updatePreferences({ distance: String(km), ageRange: [min, max] });
    },
    onSuccess: () => {
      setMessage({ text: 'Preferências salvas' });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
    onError: err => setMessage({ text: getErrorMessage(err), error: true }),
  });

  return (
    <Card icon="options" title="Preferências do feed">
      <TextField
        label="Distância máxima (km)"
        value={distance}
        onChangeText={setDistance}
        keyboardType="number-pad"
        placeholder={`${DEFAULT_DISTANCE_KM} (padrão)`}
      />
      <View className="flex-row gap-4">
        <View className="flex-1">
          <TextField label="Idade mínima" value={minAge} onChangeText={setMinAge} keyboardType="number-pad" placeholder={String(MIN_AGE)} />
        </View>
        <View className="flex-1">
          <TextField label="Idade máxima" value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" placeholder={String(MAX_AGE)} />
        </View>
      </View>
      {message ? <AppText tone={message.error ? 'danger' : 'primary'}>{message.text}</AppText> : null}
      <Button title="Salvar preferências" onPress={() => save.mutate()} loading={save.isPending} />
    </Card>
  );
}
