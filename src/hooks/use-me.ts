import { useQuery } from '@tanstack/react-query';

import { usersApi } from '@/api/endpoints';
import { queryKeys } from '@/lib/query-client';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: usersApi.me });
}
