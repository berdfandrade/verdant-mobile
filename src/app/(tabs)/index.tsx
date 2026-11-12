import { useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage, getStatus } from '@/api/client';
import { likesApi, profileApi } from '@/api/endpoints';
import type { FeedProfile } from '@/api/types';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '@/components/swipe-deck';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, Screen, type IconName } from '@/components/ui';
import { useSyncLocation } from '@/hooks/use-sync-location';
import { cn } from '@/lib/cn';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';

interface MatchInfo {
  profile: FeedProfile;
  conversationId?: string;
}

export default function DiscoverScreen() {
  const queryClient = useQueryClient();
  const location = useSyncLocation();
  const cardRef = useRef<SwipeCardHandle>(null);

  // Perfis já decididos nesta sessão saem da pilha na hora (sem esperar o refetch)
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const feed = useQuery({ queryKey: queryKeys.feed, queryFn: profileApi.feed });

  const decide = useMutation({
    mutationFn: ({ profile, direction }: { profile: FeedProfile; direction: SwipeDirection }) =>
      direction === 'like' ? likesApi.like(profile._id) : likesApi.pass(profile._id).then(() => null),
    onSuccess: (result, { profile }) => {
      if (result?.match) {
        setMatch({ profile, conversationId: result.conversationId });
        queryClient.invalidateQueries({ queryKey: queryKeys.matches });
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      }
    },
    onError: err => setActionError(getErrorMessage(err)),
  });

  const handleSwiped = (profile: FeedProfile, direction: SwipeDirection) => {
    setActionError(null);
    setDecided(prev => new Set(prev).add(profile._id));
    decide.mutate({ profile, direction });
  };

  const queue = (feed.data ?? []).filter(profile => !decided.has(profile._id));
  const current = queue[0];
  const next = queue[1];

  const reload = () => {
    setDecided(new Set());
    feed.refetch();
  };

  const renderBody = () => {
    if (feed.isLoading) return <Loading />;

    // A API responde 404 quando o usuário ainda não tem localização salva.
    // (Se a permissão foi negada mas já existe uma localização salva, o feed funciona.)
    if (getStatus(feed.error) === 404) {
      const denied = location.status === 'denied';
      return (
        <CenteredState
          icon="location"
          title="Precisamos da sua localização"
          message={
            denied
              ? 'O acesso à localização foi negado. Libere nas configurações do aparelho e tente de novo.'
              : 'O Verdant mostra pessoas perto de você. Permita o acesso à localização para ver o feed.'
          }
          action={<Button title="Permitir localização" onPress={location.sync} loading={location.status === 'updating'} />}
        />
      );
    }

    if (feed.error) {
      return (
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível carregar"
          message={getErrorMessage(feed.error)}
          action={<Button title="Tentar novamente" onPress={reload} />}
        />
      );
    }

    if (!current) {
      return (
        <CenteredState
          icon="leaf"
          title="Por enquanto é só"
          message="Você já viu todo mundo por perto. Aumente a distância nas preferências ou volte mais tarde."
          action={<Button title="Atualizar" variant="secondary" icon="refresh" onPress={reload} loading={feed.isFetching} />}
        />
      );
    }

    return (
      <>
        <View className="my-2 flex-1">
          {/* O próximo perfil fica atrás, pronto para aparecer */}
          {next ? <SwipeCard key={next._id} profile={next} onSwiped={() => undefined} /> : null}
          <SwipeCard key={current._id} ref={cardRef} profile={current} onSwiped={handleSwiped} />
        </View>

        {actionError ? (
          <AppText tone="danger" className="text-center">
            {actionError}
          </AppText>
        ) : null}

        <View className="flex-row justify-center gap-8 py-4">
          <RoundAction icon="close" tone="pass" label="Passar" onPress={() => cardRef.current?.swipe('pass')} />
          <RoundAction icon="heart" tone="like" label="Curtir" onPress={() => cardRef.current?.swipe('like')} />
        </View>
      </>
    );
  };

  return (
    <Screen>
      <View className="py-2">
        <AppText variant="subtitle">Descobrir</AppText>
      </View>

      {renderBody()}

      <MatchModal
        match={match}
        onClose={() => setMatch(null)}
        onOpenChat={conversationId => {
          setMatch(null);
          router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
        }}
      />
    </Screen>
  );
}

const roundTones = {
  like: { border: 'border-like', accent: 'accent-like' },
  pass: { border: 'border-pass', accent: 'accent-pass' },
} as const;

function RoundAction({
  icon,
  tone,
  label,
  onPress,
}: {
  icon: IconName;
  tone: keyof typeof roundTones;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'size-[68px] items-center justify-center rounded-full border-2 bg-background shadow-md active:scale-95 active:opacity-70',
        roundTones[tone].border,
      )}>
      <Icon name={icon} size={32} colorClassName={roundTones[tone].accent} />
    </Pressable>
  );
}

function MatchModal({
  match,
  onClose,
  onOpenChat,
}: {
  match: MatchInfo | null;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}) {
  return (
    <Modal visible={!!match} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w-[380px] items-center gap-4 rounded-3xl bg-background p-6">
          <AppText variant="title" tone="primary">
            É um match!
          </AppText>
          {match ? (
            <>
              <Avatar uri={mainPhoto(match.profile)} name={match.profile.fullName} size={112} />
              <AppText className="text-center">
                Você e {firstName(match.profile.fullName)} se curtiram. Que tal mandar a primeira mensagem?
              </AppText>
              {match.conversationId ? (
                <Button
                  title="Mandar mensagem"
                  icon="chatbubble"
                  className="self-stretch"
                  onPress={() => onOpenChat(match.conversationId!)}
                />
              ) : null}
            </>
          ) : null}
          <Button title="Continuar descobrindo" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
