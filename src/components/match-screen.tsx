import { Modal, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { likesApi } from '@/api/endpoints';
import type { PublicProfile } from '@/api/types';
import { AppText, Button, Icon, Image, SafeAreaView } from '@/components/ui';
import { useMe } from '@/hooks/use-me';
import { firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';

export interface MatchInfo {
  profile: PublicProfile;
  conversationId?: string;
}

// Tela cheia verde de match (Figma: 04 · Match)
export function MatchScreen({
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
