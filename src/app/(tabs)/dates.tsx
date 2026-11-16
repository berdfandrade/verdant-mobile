import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { datesApi } from '@/api/endpoints';
import type { DateInvite } from '@/api/types';
import { DateSheet } from '@/components/date-sheet';
import { MonthCalendar } from '@/components/month-calendar';
import { AppText, Avatar, Button, CenteredState, Icon, Image, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import {
  dateRoles,
  dayKey,
  formatDayMonth,
  formatShortDate,
  formatTime,
  formatWeekday,
  isSameDay,
  monthRange,
  startOfMonth,
} from '@/lib/dates';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from '@/store/auth';

const openNewDate = () => router.push('/dates/new');

// Calendário, convites recebidos e próximos dates (Figma: 07 · Dates)
export default function DatesScreen() {
  const theme = useTheme();
  const myId = useAuth(state => state.userId);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [opened, setOpened] = useState<DateInvite | null>(null);

  const range = monthRange(month);
  // Mês inteiro (inclui dias que já passaram): pontos do calendário e filtro por dia
  const monthDates = useQuery({
    queryKey: queryKeys.datesList(range.from, range.to),
    queryFn: () => datesApi.list(range),
  });
  // Próximos dates, de agora em diante
  const upcoming = useQuery({ queryKey: queryKeys.datesList(), queryFn: () => datesApi.list() });
  const invites = useQuery({ queryKey: queryKeys.dateInvites, queryFn: datesApi.invites });

  const refreshing = monthDates.isRefetching || upcoming.isRefetching || invites.isRefetching;
  const refresh = () => {
    monthDates.refetch();
    upcoming.refetch();
    invites.refetch();
  };

  const markedDays = new Set((monthDates.data ?? []).map(date => dayKey(date.scheduledAt)));

  // Convites pendentes para mim já aparecem no banner verde, então saem da lista
  const notInviteToMe = (date: DateInvite) => !(date.status === 'pending' && dateRoles(date, myId).invitedMe);
  const myDates = (
    selectedDay
      ? (monthDates.data ?? []).filter(date => isSameDay(new Date(date.scheduledAt), selectedDay))
      : (upcoming.data ?? [])
  ).filter(notInviteToMe);
  const listLoading = selectedDay ? monthDates.isLoading : upcoming.isLoading;
  const listError = selectedDay ? monthDates.error : upcoming.error;

  const changeMonth = (next: Date) => {
    setMonth(next);
    setSelectedDay(null);
  };
  // Tocar no dia filtra a lista; tocar de novo volta para "próximos"
  const toggleDay = (day: Date) => setSelectedDay(current => (current && isSameDay(current, day) ? null : day));

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="grow gap-5 px-4 pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}>
        <AppText variant="title" className="pt-2">
          Dates
        </AppText>

        <MonthCalendar
          month={month}
          onChangeMonth={changeMonth}
          markedDays={markedDays}
          selectedDay={selectedDay}
          onSelectDay={toggleDay}
        />

        {(invites.data ?? []).map(invite => (
          <InviteBanner key={invite._id} invite={invite} onPress={() => setOpened(invite)} />
        ))}

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="subtitle">
              {selectedDay ? `Dates em ${formatShortDate(selectedDay)}` : 'Meus dates'}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar um date"
              onPress={openNewDate}
              className="size-10 items-center justify-center rounded-xl bg-surface active:opacity-70">
              <Icon name="add" size={22} colorClassName="accent-foreground" />
            </Pressable>
          </View>

          {listError ? (
            <CenteredState
              icon="cloud-offline"
              title="Não foi possível carregar"
              message={getErrorMessage(listError)}
              action={<Button title="Tentar novamente" onPress={refresh} />}
            />
          ) : listLoading ? null : myDates.length ? (
            myDates.map(date => (
              <DateCard key={date._id} date={date} myId={myId} onPress={() => setOpened(date)} />
            ))
          ) : selectedDay ? (
            <AppText variant="caption">Nenhum date neste dia.</AppText>
          ) : (
            <CenteredState
              icon="calendar-outline"
              title="Você ainda não tem dates"
              message="Convide alguém para sair!"
              action={<Button title="Marcar um date" icon="add" onPress={openNewDate} />}
            />
          )}
        </View>
      </ScrollView>

      <DateSheet date={opened} onClose={() => setOpened(null)} />
    </Screen>
  );
}

// "Juliana te convidou para um date" (Figma: 07 · Dates)
function InviteBanner({ invite, onPress }: { invite: DateInvite; onPress: () => void }) {
  const name = firstName(invite.inviter.fullName);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Convite de ${name}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-primary bg-primary-soft p-3 active:opacity-80">
      <Avatar uri={mainPhoto(invite.inviter)} name={invite.inviter.fullName} size={44} />
      <View className="flex-1">
        <AppText className="font-bold" numberOfLines={1}>
          {name} te convidou para um date
        </AppText>
        <AppText variant="caption" tone="primary" numberOfLines={1}>
          {invite.place.name} · {formatShortDate(invite.scheduledAt)}
        </AppText>
      </View>
      <Icon name="chevron-forward" size={20} colorClassName="accent-primary" />
    </Pressable>
  );
}

// Card escuro com a foto da pessoa ao fundo (no Figma é a foto do lugar, que a API não tem)
function DateCard({ date, myId, onPress }: { date: DateInvite; myId: string | null; onPress: () => void }) {
  const { other } = dateRoles(date, myId);
  const name = firstName(other.fullName);
  const photo = mainPhoto(other);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Date com ${name} em ${formatShortDate(date.scheduledAt)} às ${formatTime(date.scheduledAt)}`}
      onPress={onPress}
      className="overflow-hidden rounded-3xl bg-[#14171f] active:opacity-90">
      {photo ? <Image source={{ uri: photo }} className="absolute inset-0" contentFit="cover" blurRadius={12} /> : null}
      {/* Escurece a foto para o texto branco ter contraste em qualquer tema */}
      <View className="absolute inset-0 bg-black/65" />
      <View className="flex-row items-center gap-3 p-4">
        <View className="rounded-full border-2 border-white">
          <Avatar uri={photo} name={other.fullName} size={56} />
        </View>
        <View className="flex-1 gap-1">
          <AppText tone="white" className="text-lg font-bold" numberOfLines={1}>
            {name}
          </AppText>
          <View className="flex-row items-center gap-1">
            <Icon name="location-outline" size={14} colorClassName="accent-white" />
            <AppText variant="caption" tone="white-soft" numberOfLines={1} className="flex-1">
              {date.place.name}
            </AppText>
          </View>
          {date.status === 'pending' ? (
            <AppText variant="micro" tone="white-soft">
              Aguardando resposta
            </AppText>
          ) : null}
        </View>
        <View className="items-end">
          <AppText variant="overline" tone="none" className="text-[#5be39a]">
            {formatWeekday(date.scheduledAt)}
          </AppText>
          <AppText tone="white" className="text-[26px] leading-8 font-extrabold">
            {formatDayMonth(date.scheduledAt)}
          </AppText>
          <AppText variant="caption" tone="white-soft">
            {formatTime(date.scheduledAt)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
