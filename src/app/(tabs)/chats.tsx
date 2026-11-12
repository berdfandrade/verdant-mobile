import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { conversationsApi } from '@/api/endpoints';
import type { ConversationSummary } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Loading, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { firstName, formatMessageTime, mainPhoto, otherParticipant } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from '@/store/auth';

export default function ChatsScreen() {
  const theme = useTheme();
  const conversations = useQuery({ queryKey: queryKeys.conversations, queryFn: conversationsApi.mine });

  if (conversations.isLoading) return <Loading />;

  if (conversations.error) {
    return (
      <Screen>
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível carregar"
          message={getErrorMessage(conversations.error)}
          action={<Button title="Tentar novamente" onPress={() => conversations.refetch()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={conversations.data ?? []}
        keyExtractor={item => item._id}
        contentContainerClassName="grow px-4 pb-6"
        refreshControl={
          <RefreshControl refreshing={conversations.isRefetching} onRefresh={() => void conversations.refetch()} tintColor={theme.primary} />
        }
        ListHeaderComponent={
          <AppText variant="subtitle" className="py-2">
            Conversas
          </AppText>
        }
        ListEmptyComponent={
          <CenteredState icon="chatbubbles-outline" title="Nenhuma conversa" message="Dê match com alguém para começar a conversar." />
        }
        ItemSeparatorComponent={() => <View className="ml-[72px] h-hairline bg-line" />}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
      />
    </Screen>
  );
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const myId = useAuth(state => state.userId);
  const other = otherParticipant(conversation.participants, myId);
  const last = conversation.lastMessage;
  const lastFromMe = last?.sender === myId;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversa com ${firstName(other?.fullName)}`}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conversation._id } })}
      className="flex-row items-center gap-4 py-4 active:opacity-70">
      <Avatar uri={mainPhoto(other)} name={other?.fullName} size={56} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <AppText variant="label" numberOfLines={1} className="flex-1">
            {other?.fullName ?? 'Conversa'}
          </AppText>
          {last ? <AppText variant="caption">{formatMessageTime(last.sentAt)}</AppText> : null}
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {last ? `${lastFromMe ? 'Você: ' : ''}${last.content}` : 'Novo match! Diga oi 👋'}
        </AppText>
      </View>
    </Pressable>
  );
}
