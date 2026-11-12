import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { conversationsApi } from '@/api/endpoints';
import type { Message } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, SafeAreaView } from '@/components/ui';
import { useChat } from '@/hooks/use-chat';
import { cn } from '@/lib/cn';
import { firstName, formatMessageTime, mainPhoto, otherParticipant } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { useAuth } from '@/store/auth';

const MAX_LENGTH = 2000; // mesmo limite da API

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useAuth(state => state.userId);

  const conversation = useQuery({ queryKey: queryKeys.conversation(id), queryFn: () => conversationsApi.getById(id) });
  const chat = useChat(id);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const other = conversation.data ? otherParticipant(conversation.data.participants, myId) : undefined;
  const isActive = conversation.data?.isActive ?? true;
  const canSend = !!draft.trim() && !sending;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await chat.send(text);
      setDraft('');
    } catch (err) {
      setSendError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const header = (
    <Stack.Screen
      options={{
        headerTitle: () =>
          other ? (
            <View className="flex-row items-center gap-2">
              <Avatar uri={mainPhoto(other)} name={other.fullName} size={32} />
              <AppText variant="label">{firstName(other.fullName)}</AppText>
            </View>
          ) : null,
      }}
    />
  );

  if (conversation.isLoading || chat.isLoading) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }

  const loadError = conversation.error ?? chat.error;
  if (loadError) {
    return (
      <>
        {header}
        <CenteredState
          icon="alert-circle"
          title="Não foi possível abrir a conversa"
          message={getErrorMessage(loadError)}
          action={<Button title="Tentar novamente" onPress={() => conversation.refetch()} />}
        />
      </>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      {header}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          inverted
          data={chat.messages}
          keyExtractor={item => item._id}
          contentContainerClassName="w-full max-w-content grow gap-2 self-center p-4"
          onEndReached={chat.loadOlder}
          onEndReachedThreshold={0.3}
          ListFooterComponent={chat.isLoadingOlder ? <ActivityIndicator colorClassName="accent-primary" /> : undefined}
          ListEmptyComponent={
            // A lista é invertida: o "vazio" também é desenhado de cabeça para baixo
            <View className="flex-1 -scale-y-100 items-center justify-center gap-3 p-6">
              <View className="size-16 items-center justify-center rounded-full bg-surface">
                <Icon name="chatbubbles" size={28} colorClassName="accent-primary" />
              </View>
              <AppText variant="caption" className="text-center">
                Vocês deram match! Mande a primeira mensagem para {firstName(other?.fullName)}.
              </AppText>
            </View>
          }
          renderItem={({ item }) => <Bubble message={item} mine={item.sender === myId} />}
        />

        {!chat.connected ? (
          <AppText variant="caption" className="text-center">
            Reconectando… as mensagens serão enviadas mesmo assim.
          </AppText>
        ) : null}
        {sendError ? (
          <AppText variant="caption" tone="danger" className="text-center">
            {sendError}
          </AppText>
        ) : null}

        {isActive ? (
          <View className="w-full max-w-content flex-row items-end gap-2 self-center border-t-hairline border-line p-2">
            <TextInput
              accessibilityLabel="Mensagem"
              value={draft}
              onChangeText={setDraft}
              placeholder="Escreva uma mensagem"
              placeholderTextColorClassName="accent-muted"
              cursorColorClassName="accent-primary"
              multiline
              maxLength={MAX_LENGTH}
              className="max-h-[120px] min-h-11 flex-1 rounded-3xl bg-surface px-4 py-2.5 text-base text-foreground web:outline-none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              onPress={handleSend}
              disabled={!canSend}
              className="size-11 items-center justify-center rounded-full bg-primary active:opacity-80 disabled:opacity-50">
              {sending ? (
                <ActivityIndicator colorClassName="accent-on-primary" />
              ) : (
                <Icon name="send" size={20} colorClassName="accent-on-primary" />
              )}
            </Pressable>
          </View>
        ) : (
          <AppText variant="caption" className="p-4 text-center">
            Esta conversa foi encerrada.
          </AppText>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View className={cn('flex-row', mine ? 'justify-end' : 'justify-start')}>
      <View
        className={cn(
          'max-w-[80%] gap-0.5 rounded-2xl px-4 py-2',
          mine ? 'rounded-br-sm bg-bubble-mine' : 'rounded-bl-sm bg-bubble-theirs',
        )}>
        <AppText tone="none" className={mine ? 'text-bubble-mine-text' : 'text-bubble-theirs-text'}>{message.content}</AppText>
        <AppText
          variant="micro"
          tone="none"
          className={cn('self-end opacity-80', mine ? 'text-bubble-mine-text' : 'text-muted')}>
          {formatMessageTime(message.sentAt)}
          {message.editedAt ? ' · editada' : ''}
        </AppText>
      </View>
    </View>
  );
}
