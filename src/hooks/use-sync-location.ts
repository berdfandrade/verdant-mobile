import * as Location from 'expo-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { profileApi } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-client';

export type LocationStatus = 'updating' | 'ok' | 'denied' | 'error';

/*
  Pede permissão de localização e envia a posição para a API (o feed depende dela).
  É uma query: roda uma vez por sessão (todas as telas compartilham o resultado)
  e `sync()` força uma nova atualização.
*/
export function useSyncLocation() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.locationSync,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<'ok' | 'denied'> => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return 'denied';

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await profileApi.updateLocation(position.coords.longitude, position.coords.latitude);

      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      return 'ok';
    },
  });

  const status: LocationStatus = query.isFetching ? 'updating' : query.isError ? 'error' : (query.data ?? 'updating');

  return { status, sync: () => query.refetch() };
}
