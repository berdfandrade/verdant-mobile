import { useState } from 'react';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api/client';
import { conversationsApi } from '@/api/endpoints';
import { useAuth } from '@/store/auth';

// Abre a conversa com um match (descobre o id da conversa entre os dois)
export function useOpenChat() {
  const myId = useAuth(state => state.userId);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openChat = async (otherUserId: string) => {
    if (!myId) return;
    setError(null);
    setOpeningId(otherUserId);
    try {
      const conversation = await conversationsApi.between(myId, otherUserId);
      router.push({ pathname: '/chat/[id]', params: { id: conversation._id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningId(null);
    }
  };

  return { openChat, openingId, error };
}
