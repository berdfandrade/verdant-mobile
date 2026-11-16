import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { conversationsApi, likesApi } from '@/api/endpoints';
import type { Message } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, SafeAreaView, type IconName } from '@/components/ui';
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
  const [menuOpen, setMenuOpen] = useState(false);

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
              <Avatar uri={mainPhoto(other)} name={other.fullName} size={36} />
              <AppText className="font-bold">
                {firstName(other.fullName)}
              </AppText>
            </View>
          ) : null,
        headerRight: () =>
          other ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Opções da conversa"
              onPress={() => setMenuOpen(true)}
              className="size-10 items-center justify-center rounded-full active:opacity-60">
              <Icon name="ellipsis-vertical" size={20} colorClassName="accent-foreground" />
            </Pressable>
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
          contentContainerClassName="w-full max-w-content grow gap-3 self-center p-4"
          onEndReached={chat.loadOlder}
          onEndReachedThreshold={0.3}
          ListFooterComponent={chat.isLoadingOlder ? <ActivityIndicator colorClassName="accent-primary" /> : undefined}
          ListEmptyComponent={
            // A lista é invertida: o "vazio" também é desenhado de cabeça para baixo
            <View className="flex-1 -scale-y-100 items-center justify-center gap-3 p-6">
              <View className="size-16 items-center justify-center rounded-full bg-primary-soft">
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
          <View className="w-full max-w-content flex-row items-end gap-2 self-center border-t-hairline border-line bg-surface px-3 py-2">
            <TextInput
              accessibilityLabel="Mensagem"
              value={draft}
              onChangeText={setDraft}
              placeholder="Escreva uma mensagem"
              placeholderTextColorClassName="accent-muted"
              cursorColorClassName="accent-primary"
              multiline
              maxLength={MAX_LENGTH}
              className="max-h-[120px] min-h-11 flex-1 rounded-3xl bg-background px-4 py-2.5 text-base text-foreground web:outline-none"
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
      {other ? (
        <ConversationMenu
          visible={menuOpen}
          otherId={other._id}
          otherName={firstName(other.fullName)}
          canInvite={isActive}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  // Hora fica fora do balão, embaixo (Figma: 05 · Chat)
  return (
    <View className={cn('max-w-[80%] gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
      <View className={cn('rounded-2xl px-4 py-2.5', mine ? 'rounded-br-md bg-bubble-mine' : 'rounded-bl-md bg-bubble-theirs')}>
        <AppText tone="none" className={mine ? 'text-bubble-mine-text' : 'text-bubble-theirs-text'}>
          {message.content}
        </AppText>
      </View>
      <View className="flex-row items-center gap-1 px-1">
        <AppText variant="micro">
          {formatMessageTime(message.sentAt)}
          {message.editedAt ? ' · editada' : ''}
        </AppText>
        {mine ? <Icon name="checkmark-done" size={13} colorClassName="accent-primary" /> : null}
      </View>
    </View>
  );
}

// Folha de opções (Figma: 05a · Menu do chat): marcar um date e desfazer o match
function ConversationMenu({
  visible,
  otherId,
  otherName,
  canInvite,
  onClose,
}: {
  visible: boolean;
  otherId: string;
  otherName: string;
  /** Conversa encerrada = não é mais match, então não dá para convidar */
  canInvite: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const unmatch = useMutation({
    mutationFn: () => likesApi.unlike(otherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      onClose();
      router.back();
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Fechar" onPress={onClose} className="flex-1 bg-black/40" />
      <SafeAreaView edges={['bottom']} className="rounded-t-3xl bg-surface">
        <View className="w-full max-w-content gap-2 self-center px-4 pb-4 pt-3">
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-line" />
          <AppText variant="subtitle">
            Opções da conversa
          </AppText>
          {canInvite ? (
            <MenuItem
              icon="calendar-outline"
              title="Marcar encontro"
              subtitle={`Convide ${otherName} para um date`}
              onPress={() => {
                onClose();
                router.push({ pathname: '/dates/new', params: { inviteeId: otherId } });
              }}
            />
          ) : null}
          <MenuItem
            icon="ban-outline"
            title={unmatch.isPending ? 'Desemparelhando…' : 'Desemparelhar'}
            subtitle={`Encerra a conexão e o chat com ${otherName}`}
            disabled={unmatch.isPending}
            onPress={() => unmatch.mutate()}
          />
          {unmatch.error ? (
            <AppText variant="caption" tone="danger">
              {getErrorMessage(unmatch.error)}
            </AppText>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  disabled,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-3 rounded-2xl py-2 active:opacity-70 disabled:opacity-60">
      <View className="size-11 items-center justify-center rounded-xl bg-background">
        <Icon name={icon} size={20} colorClassName="accent-foreground" />
      </View>
      <View className="flex-1">
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
    </Pressable>
  );
}
