import { Modal, Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { datesApi } from '@/api/endpoints';
import type { DateInvite } from '@/api/types';
import { AppText, Avatar, Button, Icon } from '@/components/ui';
import { dateRoles, formatDayMonth, formatTime, formatWeekday } from '@/lib/dates';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from '@/store/auth';

type Action = 'accept' | 'decline' | 'cancel';

/*
  Detalhe de um date (Figma: 07a · Convite de date).
  - Convite para mim, pendente: aceitar ou recusar
  - Qualquer outro (aceito, ou convite que eu fiz): cancelar
*/
export function DateSheet({ date, onClose }: { date: DateInvite | null; onClose: () => void }) {
  return (
    <Modal visible={!!date} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <Pressable accessibilityLabel="Fechar" onPress={onClose} className="absolute inset-0" />
        {/* key: cada date abre com o estado da resposta zerado */}
        {date ? <DateCard key={date._id} date={date} onClose={onClose} /> : null}
      </View>
    </Modal>
  );
}

function DateCard({ date, onClose }: { date: DateInvite; onClose: () => void }) {
  const myId = useAuth(state => state.userId);
  const queryClient = useQueryClient();
  const respond = useMutation({
    mutationFn: (action: Action) => datesApi[action](date._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dates });
      onClose();
    },
  });

  const { other, invitedMe } = dateRoles(date, myId);
  const name = firstName(other.fullName);
  const pending = date.status === 'pending';
  const canAnswer = pending && invitedMe;
  const busy = (action: Action) => respond.isPending && respond.variables === action;
  const run = (action: Action) => respond.mutate(action);

  const title = canAnswer
    ? `${name} te convidou para um date!`
    : pending
      ? `Esperando ${name} responder`
      : `Date com ${name}`;

  return (
    <View className="w-full max-w-[380px] items-center gap-4 rounded-3xl bg-surface p-5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        className="absolute right-4 top-4 size-8 items-center justify-center rounded-full bg-background active:opacity-70">
        <Icon name="close" size={18} colorClassName="accent-foreground" />
      </Pressable>

      <View className="rounded-full border-2 border-primary p-0.5">
        <Avatar uri={mainPhoto(other)} name={other.fullName} size={64} />
      </View>
      <AppText className="text-center text-lg font-bold">{title}</AppText>

      <View className="w-full flex-row gap-2">
        <View className="flex-1 justify-center gap-0.5 rounded-2xl bg-background px-4 py-3">
          <AppText className="font-bold" numberOfLines={2}>
            {date.place.name}
          </AppText>
          {date.place.address ? (
            <AppText variant="caption" numberOfLines={2}>
              {date.place.address}
            </AppText>
          ) : null}
        </View>
        <View className="w-[84px] items-center justify-center rounded-2xl bg-background py-3">
          <AppText variant="overline" tone="primary">
            {formatWeekday(date.scheduledAt)}
          </AppText>
          <AppText className="text-[22px] leading-7 font-extrabold">{formatDayMonth(date.scheduledAt)}</AppText>
          <AppText variant="micro">{formatTime(date.scheduledAt)}</AppText>
        </View>
      </View>

      {respond.error ? (
        <AppText variant="caption" tone="danger" className="text-center">
          {getErrorMessage(respond.error)}
        </AppText>
      ) : null}

      {canAnswer ? (
        <View className="w-full gap-1">
          <Button
            title="Aceitar convite"
            icon="checkmark"
            loading={busy('accept')}
            disabled={respond.isPending}
            onPress={() => run('accept')}
          />
          <Button
            title="Recusar"
            variant="danger"
            loading={busy('decline')}
            disabled={respond.isPending}
            onPress={() => run('decline')}
          />
        </View>
      ) : (
        <Button
          title={pending ? 'Cancelar convite' : 'Cancelar date'}
          variant="danger"
          className="w-full"
          loading={busy('cancel')}
          disabled={respond.isPending}
          onPress={() => run('cancel')}
        />
      )}
    </View>
  );
}
