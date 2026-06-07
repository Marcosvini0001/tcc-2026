import React from 'react';
import { useRouter } from 'expo-router';
import { loadCurrentSession } from '@/lib/sessionStore';

export default function IndexRedirectScreen() {
  const router = useRouter();

  React.useEffect(() => {
    void (async () => {
      const currentSession = await loadCurrentSession();
      router.replace(currentSession ? '/dashboard' : '/login');
    })();
  }, [router]);

  return null;
}
