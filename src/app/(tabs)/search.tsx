import { Fragment, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/api/client';
import { conversationsApi, likesApi, profileApi } from '@/api/endpoints';
import type { SearchResult } from '@/api/types';
import { MatchScreen, type MatchInfo } from '@/components/match-screen';
import { SwipeCard, type SwipeDirection } from '@/components/swipe-deck';
import { AppText, Avatar, Button, CenteredState, Icon, Loading, Screen } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/cn';
import { formatDistance } from '@/lib/profile';
import { queryKeys } from '@/lib/query-client';
import { searchableTerm, splitHighlight } from '@/lib/search';
import { useAuth } from '@/store/auth';

type Filter = 'nearest' | 'online';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'nearest', label: 'Mais próximas' },
  { value: 'online', label: 'Online' },
];

// Busca de pessoas por nome (Figma: 08 · Pesquisar)
export default function SearchScreen() {
  const queryClient = useQueryClient();
  const myId = useAuth(state => state.userId);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('nearest');
  const [opened, setOpened] = useState<SearchResult | null>(null);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const term = searchableTerm(useDebouncedValue(text));
  const online = filter === 'online';
  const results = useQuery({
    queryKey: queryKeys.search(term ?? '', online),
    queryFn: () => profileApi.search(term!, { online }),
    enabled: !!term,
  });

  // Já é match: abre a conversa direto
  const openChat = useMutation({
    mutationFn: (profileId: string) => conversationsApi.between(myId!, profileId),
    onSuccess: conversation => router.push({ pathname: '/chat/[id]', params: { id: conversation._id } }),
    onError: err => setActionError(getErrorMessage(err)),
  });

  const decide = useMutation({
    mutationFn: ({ profile, direction }: { profile: SearchResult; direction: SwipeDirection }) =>
      direction === 'like' ? likesApi.like(profile._id) : likesApi.pass(profile._id).then(() => null),
    onSuccess: (result, { profile }) => {
      if (result?.match) {
        setMatch({ profile, conversationId: result.conversationId });
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      }
      // A pessoa pode ter virado match, e o feed não deve mais mostrá-la
      queryClient.invalidateQueries({ queryKey: queryKeys.search() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
    onError: err => setActionError(getErrorMessage(err)),
  });

  const handlePress = (person: SearchResult) => {
    setActionError(null);
    if (person.isMatch) openChat.mutate(person._id);
    else setOpened(person);
  };

  const handleSwiped = (profile: SearchResult, direction: SwipeDirection) => {
    setOpened(null);
    decide.mutate({ profile, direction });
  };

  const renderResults = () => {
    if (!term) {
      return (
        <CenteredState
          icon="search"
          title="Encontre alguém pelo nome"
          message="Digite pelo menos 2 letras do nome ou do username."
        />
      );
    }
    if (results.isLoading) return <Loading />;
    if (results.error) {
      return (
        <CenteredState
          icon="cloud-offline"
          title="Não foi possível pesquisar"
          message={getErrorMessage(results.error)}
          action={<Button title="Tentar novamente" onPress={() => results.refetch()} />}
        />
      );
    }

    const people = results.data ?? [];
    if (!people.length) {
      return (
        <CenteredState
          icon="person-outline"
          title="Ninguém encontrado"
          message={online ? `Ninguém chamado "${term}" está online agora.` : `Nenhum perfil com "${term}".`}
        />
      );
    }

    return (
      <View className="gap-3">
        <AppText variant="overline">
          {people.length} {people.length === 1 ? 'resultado' : 'resultados'}
        </AppText>
        <View className="overflow-hidden rounded-3xl bg-surface">
          {people.map((person, index) => (
            <Fragment key={person._id}>
              {index > 0 ? <View className="ml-[76px] h-hairline bg-line" /> : null}
              <ResultRow person={person} term={term} onPress={() => handlePress(person)} />
            </Fragment>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Screen padded={false}>
      <View className="gap-3 px-4 pb-3 pt-2">
        <View className="min-h-12 flex-row items-center gap-2 rounded-full border-2 border-primary bg-surface px-4">
          <Icon name="search" size={18} colorClassName="accent-muted" />
          <TextInput
            accessibilityLabel="Pesquisar pelo nome"
            value={text}
            onChangeText={setText}
            placeholder="Pesquisar pelo nome"
            placeholderTextColorClassName="accent-muted"
            cursorColorClassName="accent-primary"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            maxLength={50}
            className="flex-1 py-3 text-base text-foreground web:outline-none"
          />
          {text ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar pesquisa"
              onPress={() => setText('')}
              className="size-7 items-center justify-center rounded-full bg-background active:opacity-70">
              <Icon name="close" size={16} colorClassName="accent-foreground" />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row gap-2">
          {FILTERS.map(option => {
            const selected = option.value === filter;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setFilter(option.value)}
                className={cn(
                  'flex-row items-center gap-1.5 rounded-full border px-4 py-2 active:opacity-80',
                  selected ? 'border-ink bg-ink' : 'border-line bg-surface',
                )}>
                {option.value === 'online' ? <View className="size-2 rounded-full bg-primary" /> : null}
                <AppText tone="none" className={cn('font-semibold', selected ? 'text-on-ink' : 'text-foreground')}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow gap-3 px-4 pb-6">
        {actionError ? (
          <AppText variant="caption" tone="danger" className="text-center">
            {actionError}
          </AppText>
        ) : null}
        {renderResults()}
      </ScrollView>

      <Modal visible={!!opened} transparent animationType="fade" onRequestClose={() => setOpened(null)}>
        <View className="flex-1 items-center justify-center bg-black/70 p-4">
          <Pressable accessibilityLabel="Fechar" onPress={() => setOpened(null)} className="absolute inset-0" />
          <View className="aspect-[3/4.4] w-full max-w-[420px]">
            {opened ? <SwipeCard key={opened._id} profile={opened} onSwiped={handleSwiped} /> : null}
          </View>
          <Button title="Fechar" variant="light" className="mt-4 self-center" onPress={() => setOpened(null)} />
        </View>
      </Modal>

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

function ResultRow({ person, term, onPress }: { person: SearchResult; term: string; onPress: () => void }) {
  const { before, match, after } = splitHighlight(person.fullName, term);
  const distance = formatDistance(person.distance);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${person.fullName}${person.online ? ', online' : ''}${person.isMatch ? ', match' : ''}`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
      <View>
        <Avatar uri={person.photos?.[0]?.url} name={person.fullName} size={48} />
        {person.online ? (
          <View className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface bg-primary" />
        ) : null}
      </View>
      <View className="flex-1 gap-0.5">
        <AppText numberOfLines={1}>
          {before}
          <AppText className="font-bold">{match}</AppText>
          {after}
        </AppText>
        {distance ? (
          <View className="flex-row items-center gap-1">
            <Icon name="location-outline" size={13} colorClassName="accent-muted" />
            <AppText variant="caption">a {distance} de você</AppText>
          </View>
        ) : null}
      </View>
      {person.isMatch ? (
        <View className="rounded-full bg-primary-soft px-2.5 py-1">
          <AppText variant="micro" tone="primary" className="font-bold">
            Match
          </AppText>
        </View>
      ) : null}
      <Icon name="chevron-forward" size={18} colorClassName="accent-muted" />
    </Pressable>
  );
}
