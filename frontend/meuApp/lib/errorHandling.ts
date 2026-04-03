import { clearCurrentSession } from './sessionStore';

type NavigationTarget = {
  replace: (path: string) => void;
};

const AUTH_ERROR_MATCHERS = [
  'token',
  'auth',
  'authentication required',
  'invalid or expired token',
  'sessao expirada',
  'sessão expirada',
];

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  return error instanceof Error ? error.message : fallbackMessage;
};

export const isAuthenticationError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  return AUTH_ERROR_MATCHERS.some((matcher) => normalizedMessage.includes(matcher));
};

export const redirectToLoginOnAuthError = async (
  message: string,
  router: NavigationTarget
) => {
  if (!isAuthenticationError(message)) {
    return false;
  }

  await clearCurrentSession();
  router.replace('/login');
  return true;
};