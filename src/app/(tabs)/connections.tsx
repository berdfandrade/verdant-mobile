import { Fragment, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { conversationsApi, likesApi } from '@/api/endpoints';
import type { ConversationSummary, PublicProfile } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/cn';
import { firstName, formatMessageTime, mainPhoto, otherParticipant } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from '@/store/auth';

// Matches e conversas numa tela só (Figma: 06 · Conexões)
export default function ConnectionsScreen() {
  const theme = useTheme();
  const myId = useAuth(state => state.userId);
  const conversations = useQuery({ queryKey: queryKeys.conversations, queryFn: conversationsApi.mine });
  const received = useQuery({ queryKey: queryKeys.received, queryFn: likesApi.received });

  const refreshing = conversations.isRefetching || received.isRefetching;
  const refresh = () => {
    conversations.refetch();
    received.refetch();
  };

  if (conversations.isLoading) return <Loading />;

  if (conversations.error) {
    return (
      <Screen>
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível carregar"
          message={getErrorMessage(conversations.error)}
          action={<Button title="Tentar novamente" onPress={refresh} />}
        />
      </Screen>
    );
  }

  const all = conversations.data ?? [];
  // Match sem nenhuma mensagem ainda = "novo match"
  const newMatches = all.filter(conversation => !conversation.lastMessage);
  const active = all.filter(conversation => conversation.lastMessage);
  const likedYou = received.data ?? [];

  const openChat = (conversationId: string) => router.push({ pathname: '/chat/[id]', params: { id: conversationId } });

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerClassName="grow gap-6 px-4 pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}>
        <AppText variant="title" className="pt-2">
          Conexões
        </AppText>

        {newMatches.length ? (
          <Section title="Novos matches">
            <AvatarStrip
              people={newMatches.map(conversation => ({
                key: conversation._id,
                profile: otherParticipant(conversation.participants, myId),
                onPress: () => openChat(conversation._id),
              }))}
            />
          </Section>
        ) : null}

        {likedYou.length ? (
          <Section title={`Curtiram você (${likedYou.length})`}>
            <AvatarStrip people={likedYou.map(profile => ({ key: profile._id, profile }))} muted />
            <AppText variant="caption">Curta de volta no Descobrir para dar match.</AppText>
          </Section>
        ) : null}

        {active.length ? (
          <Section title="Conversas">
            <View className="overflow-hidden rounded-3xl bg-surface">
              {active.map((conversation, index) => (
                <Fragment key={conversation._id}>
                  {index > 0 ? <View className="ml-[76px] h-hairline bg-line" /> : null}
                  <ConversationRow conversation={conversation} myId={myId} onPress={() => openChat(conversation._id)} />
                </Fragment>
              ))}
            </View>
          </Section>
        ) : null}

        {!all.length && !likedYou.length ? (
          <CenteredState icon="heart-outline" title="Nenhuma conexão ainda" message="Quando alguém curtir você de volta, aparece aqui." />
        ) : null}
      </ScrollView>
    </Screen>
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

function AvatarStrip({
  people,
  muted = false,
}: {
  people: { key: string; profile?: PublicProfile; onPress?: () => void }[];
  muted?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
      {people.map(({ key, profile, onPress }) => (
        <Pressable
          key={key}
          disabled={!onPress}
          onPress={onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? `Conversar com ${firstName(profile?.fullName)}` : firstName(profile?.fullName)}
          className="w-[68px] items-center gap-1 active:opacity-70">
          <View className={cn('rounded-full border-2 p-0.5', muted ? 'border-line' : 'border-primary')}>
            <Avatar uri={mainPhoto(profile)} name={profile?.fullName} size={58} />
          </View>
          <AppText variant="caption" tone="default" className="font-semibold" numberOfLines={1}>
            {firstName(profile?.fullName)}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ConversationRow({
  conversation,
  myId,
  onPress,
}: {
  conversation: ConversationSummary;
  myId: string | null;
  onPress: () => void;
}) {
  const other = otherParticipant(conversation.participants, myId);
  const last = conversation.lastMessage;
  const lastFromMe = last?.sender === myId;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversa com ${firstName(other?.fullName)}`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
      <Avatar uri={mainPhoto(other)} name={other?.fullName} size={48} />
      <View className="flex-1 gap-0.5">
        <AppText variant="label" numberOfLines={1}>
          {firstName(other?.fullName) || 'Conversa'}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {last?.content}
        </AppText>
      </View>
      {last ? (
        <View className="items-end gap-1">
          <AppText variant="micro">{formatMessageTime(last.sentAt)}</AppText>
          {lastFromMe ? <Icon name="checkmark-done" size={14} colorClassName="accent-primary" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
