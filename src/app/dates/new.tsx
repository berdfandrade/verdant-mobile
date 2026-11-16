import { type ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { datesApi, likesApi } from '@/api/endpoints';
import { MonthCalendar } from '@/components/month-calendar';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, SafeAreaView, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import { atMinutes, formatMinutes, formatShortDate, isFuture, startOfMonth } from '@/lib/dates';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';

const STEP = 30; // minutos
const DAY = 24 * 60;
const DEFAULT_TIME = 19 * 60;

// Convite para um date: com quem, onde e quando ("Marcar encontro" no menu do chat)
export default function NewDateScreen() {
  const params = useLocalSearchParams<{ inviteeId?: string }>();
  const queryClient = useQueryClient();
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: likesApi.matches });

  const [inviteeId, setInviteeId] = useState(params.inviteeId ?? '');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<Date | null>(null);
  const [minutes, setMinutes] = useState(DEFAULT_TIME);
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: datesApi.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dates });
      router.back();
    },
  });

  if (matches.isLoading) return <Loading />;
  if (matches.error) {
    return (
      <CenteredState
        icon="cloud-offline"
        title="Não foi possível carregar seus matches"
        message={getErrorMessage(matches.error)}
        action={<Button title="Tentar novamente" onPress={() => matches.refetch()} />}
      />
    );
  }

  const people = matches.data ?? [];
  if (!people.length) {
    return (
      <CenteredState icon="heart-outline" title="Você ainda não tem matches" message="Só dá para convidar um match para um date." />
    );
  }

  const invitee = people.find(person => person._id === inviteeId);
  // Veio do chat: a pessoa já está escolhida
  const fromChat = params.inviteeId ? invitee : undefined;

  const submit = () => {
    setError(null);
    if (!invitee) return setError('Escolha com quem vai ser o date.');
    if (!placeName.trim()) return setError('Diga onde vai ser o encontro.');
    if (!day) return setError('Escolha o dia no calendário.');
    const when = atMinutes(day, minutes);
    if (!isFuture(when)) return setError('Escolha um horário que ainda não passou.');

    invite.mutate({
      inviteeId: invitee._id,
      place: { name: placeName.trim(), ...(address.trim() ? { address: address.trim() } : {}) },
      scheduledAt: when.toISOString(),
    });
  };

  const message = error ?? (invite.error ? getErrorMessage(invite.error) : null);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-content gap-6 self-center p-4">
          <Section title="Com quem?">
            {fromChat ? (
              <View className="flex-row items-center gap-3">
                <Avatar uri={mainPhoto(fromChat)} name={fromChat.fullName} size={48} />
                <AppText className="text-lg font-bold">{firstName(fromChat.fullName)}</AppText>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {people.map(person => {
                  const selected = person._id === inviteeId;
                  return (
                    <Pressable
                      key={person._id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={firstName(person.fullName)}
                      onPress={() => setInviteeId(person._id)}
                      className="w-[68px] items-center gap-1 active:opacity-70">
                      <View className={cn('rounded-full border-2 p-0.5', selected ? 'border-primary' : 'border-transparent')}>
                        <Avatar uri={mainPhoto(person)} name={person.fullName} size={56} />
                      </View>
                      <AppText
                        variant="caption"
                        tone={selected ? 'primary' : 'default'}
                        className="font-semibold"
                        numberOfLines={1}>
                        {firstName(person.fullName)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Section>

          <Section title="Onde?">
            <TextField
              label="Lugar"
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Ex.: Brewteco Leblon"
              maxLength={120}
            />
            <TextField
              label="Endereço (opcional)"
              value={address}
              onChangeText={setAddress}
              placeholder="Ex.: R. Dias Ferreira, 420"
              maxLength={200}
            />
          </Section>

          <Section title="Quando?">
            <MonthCalendar month={month} onChangeMonth={setMonth} selectedDay={day} onSelectDay={setDay} minDay={new Date()} />
            <View className="flex-row items-center justify-between rounded-2xl bg-surface p-3">
              <AppText variant="label">{day ? formatShortDate(day) : 'Horário'}</AppText>
              <View className="flex-row items-center gap-3">
                <TimeButton icon="remove" label="30 minutos antes" onPress={() => setMinutes(m => (m - STEP + DAY) % DAY)} />
                <AppText accessibilityLabel={`Horário ${formatMinutes(minutes)}`} className="w-16 text-center text-xl font-extrabold">
                  {formatMinutes(minutes)}
                </AppText>
                <TimeButton icon="add" label="30 minutos depois" onPress={() => setMinutes(m => (m + STEP) % DAY)} />
              </View>
            </View>
          </Section>

          {message ? (
            <AppText variant="caption" tone="danger" className="text-center">
              {message}
            </AppText>
          ) : null}

          <Button title="Enviar convite" icon="calendar" loading={invite.isPending} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <AppText variant="overline">{title}</AppText>
      {children}
    </View>
  );
}

function TimeButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-10 items-center justify-center rounded-full bg-primary-soft active:opacity-70">
      <Icon name={icon} size={20} colorClassName="accent-primary" />
    </Pressable>
  );
}
