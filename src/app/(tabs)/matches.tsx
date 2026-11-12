import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { likesApi } from '@/api/endpoints';
import type { PublicProfile } from '@/api/types';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, Screen } from '@/components/ui';
import { useOpenChat } from '@/hooks/use-open-chat';
import { useTheme } from '@/hooks/use-theme';
import { ageFrom, firstName, mainPhoto } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';

export default function MatchesScreen() {
  const theme = useTheme();
  const matches = useQuery({ queryKey: queryKeys.matches, queryFn: likesApi.matches });
  const received = useQuery({ queryKey: queryKeys.received, queryFn: likesApi.received });
  const { openChat, openingId, error } = useOpenChat();

  const refreshing = matches.isRefetching || received.isRefetching;
  const refresh = () => {
    matches.refetch();
    received.refetch();
  };

  if (matches.isLoading) return <Loading />;

  if (matches.error) {
    return (
      <Screen>
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível carregar"
          message={getErrorMessage(matches.error)}
          action={<Button title="Tentar novamente" onPress={refresh} />}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={matches.data ?? []}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
        contentContainerClassName="grow gap-2 px-4 pb-6"
        ListHeaderComponent={
          <View className="gap-4 py-2">
            <AppText variant="subtitle">Matches</AppText>
            {received.data?.length ? (
              <View className="gap-2 rounded-3xl bg-surface p-4">
                <View className="flex-row items-center gap-2">
                  <Icon name="sparkles" size={16} colorClassName="accent-primary" />
                  <AppText variant="label">Curtiram você ({received.data.length})</AppText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
                  {received.data.map(profile => (
                    <View key={profile._id} className="w-[72px] items-center gap-1">
                      <View className="rounded-full border-2 border-primary p-0.5">
                        <Avatar uri={mainPhoto(profile)} name={profile.fullName} size={60} />
                      </View>
                      <AppText variant="caption" numberOfLines={1}>
                        {firstName(profile.fullName)}
                      </AppText>
                    </View>
                  ))}
                </ScrollView>
                <AppText variant="caption">Curta de volta no Descobrir para dar match.</AppText>
              </View>
            ) : null}
            {error ? <AppText tone="danger">{error}</AppText> : null}
          </View>
        }
        ListEmptyComponent={
          <CenteredState icon="heart-outline" title="Nenhum match ainda" message="Quando alguém curtir você de volta, aparece aqui." />
        }
        renderItem={({ item }) => (
          <MatchRow profile={item} loading={openingId === item._id} onPress={() => openChat(item._id)} />
        )}
      />
    </Screen>
  );
}

function MatchRow({ profile, loading, onPress }: { profile: PublicProfile; loading: boolean; onPress: () => void }) {
  const age = ageFrom(profile.birthDate);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversar com ${firstName(profile.fullName)}`}
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center gap-4 rounded-2xl bg-surface p-4 active:opacity-70 disabled:opacity-70">
      <Avatar uri={mainPhoto(profile)} name={profile.fullName} size={56} />
      <View className="flex-1 gap-0.5">
        <AppText variant="label">
          {firstName(profile.fullName)}
          {age !== null ? `, ${age}` : ''}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {profile.description?.[0] ?? 'Diga oi! 👋'}
        </AppText>
      </View>
      <AppText tone="primary" variant="label">
        {loading ? 'Abrindo…' : 'Conversar'}
      </AppText>
    </Pressable>
  );
}
