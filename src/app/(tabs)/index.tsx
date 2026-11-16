import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage, getStatus } from '@/api/client';
import { likesApi, profileApi } from '@/api/endpoints';
import type { FeedProfile } from '@/api/types';
import { SwipeCard, type SwipeDirection } from '@/components/swipe-deck';
import { AppText, Button, CenteredState, Icon, Image, Loading, Logo, SafeAreaView, Screen } from '@/components/ui';
import { useMe } from '@/hooks/use-me';
import { useSyncLocation } from '@/hooks/use-sync-location';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';

interface MatchInfo {
  profile: FeedProfile;
  conversationId?: string;
}

export default function DiscoverScreen() {
  const queryClient = useQueryClient();
  const location = useSyncLocation();

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

    const about = current.description?.[0];

    return (
      <View className="flex-1 gap-3 pb-3">
        <View className="flex-1">
          {/* O próximo perfil fica atrás, pronto para aparecer */}
          {next ? <SwipeCard key={next._id} profile={next} onSwiped={() => undefined} /> : null}
          <SwipeCard key={current._id} profile={current} onSwiped={handleSwiped} />
        </View>

        {actionError ? (
          <AppText tone="danger" className="text-center">
            {actionError}
          </AppText>
        ) : null}

        {about || current.interests?.length ? (
          <View className="gap-2 rounded-3xl bg-surface p-4">
            <AppText variant="overline">Sobre mim</AppText>
            {about ? <AppText numberOfLines={3}>{about}</AppText> : null}
            {current.interests?.length ? (
              <View className="flex-row flex-wrap gap-1.5">
                {current.interests.slice(0, 5).map(interest => (
                  <View key={interest} className="rounded-full bg-primary-soft px-3 py-1">
                    <AppText variant="caption" tone="primary" className="font-semibold">
                      {interest}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-3">
        <View className="size-10" />
        <Logo size="sm" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preferências do feed"
          onPress={() => router.navigate('/profile')}
          className="size-10 items-center justify-center rounded-full active:bg-surface">
          <Icon name="options-outline" size={22} colorClassName="accent-foreground" />
        </Pressable>
      </View>

      {renderBody()}

      <MatchScreen
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

// Tela cheia verde de match (Figma: 04 · Match)
function MatchScreen({
  match,
  onClose,
  onOpenChat,
}: {
  match: MatchInfo | null;
  onClose: () => void;
  onOpenChat: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const me = useMe();

  const undo = useMutation({
    mutationFn: (profileId: string) => likesApi.unlike(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      onClose();
    },
  });

  const close = () => {
    undo.reset();
    onClose();
  };

  return (
    <Modal visible={!!match} animationType="fade" onRequestClose={close}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 bg-primary">
        {match ? (
          <View className="w-full max-w-content flex-1 items-center justify-center gap-6 self-center px-6">
            <View className="h-[230px] w-full items-center justify-center">
              <Icon name="sparkles" size={22} colorClassName="accent-white" className="absolute left-6 top-4" />
              <Icon name="sparkles" size={16} colorClassName="accent-white/80" className="absolute bottom-2 right-10" />
              <MatchPhoto uri={mainPhoto(me.data)} name={me.data?.fullName} className="-mr-6 -rotate-[8deg]" />
              <MatchPhoto uri={mainPhoto(match.profile)} name={match.profile.fullName} className="-ml-6 mt-6 rotate-[8deg]" />
            </View>

            <View className="items-center gap-1">
              <AppText variant="display" tone="white">
                Match!
              </AppText>
              <AppText tone="white-soft" className="text-center">
                Rolou uma conexão entre você e {firstName(match.profile.fullName)}!
              </AppText>
            </View>

            <View className="w-full gap-2">
              {match.conversationId ? (
                <Button
                  title="Conversar agora"
                  variant="light"
                  icon="chatbubble-outline"
                  onPress={() => onOpenChat(match.conversationId!)}
                />
              ) : null}
              <Pressable accessibilityRole="button" onPress={close} className="items-center py-3 active:opacity-70">
                <AppText tone="white" className="font-bold">
                  Continuar descobrindo
                </AppText>
              </Pressable>
            </View>

            {undo.error ? (
              <AppText tone="white" className="text-center">
                {getErrorMessage(undo.error)}
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => undo.mutate(match.profile._id)}
              disabled={undo.isPending}
              className="flex-row items-center gap-1.5 rounded-full bg-black/80 px-4 py-2 active:opacity-80 disabled:opacity-60">
              <Icon name="close" size={14} colorClassName="accent-white" />
              <AppText variant="caption" tone="white" className="font-semibold">
                {undo.isPending ? 'Desfazendo…' : 'Desfazer o match'}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function MatchPhoto({ uri, name, className }: { uri?: string; name?: string; className: string }) {
  return (
    <View className={`h-[180px] w-[140px] overflow-hidden rounded-2xl border-4 border-white bg-white/20 shadow-lg ${className}`}>
      {uri ? (
        <Image source={{ uri }} className="flex-1" contentFit="cover" accessibilityLabel={name} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <AppText tone="white" className="text-[56px] leading-[64px] font-extrabold">
            {firstName(name).charAt(0)}
          </AppText>
        </View>
      )}
    </View>
  );
}
