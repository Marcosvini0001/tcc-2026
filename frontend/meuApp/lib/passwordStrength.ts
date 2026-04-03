export type PasswordStrengthLevel = 'fraca' | 'media' | 'forte';

export const getPasswordScore = (value: string) => {
  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return score;
};

export const getPasswordLevel = (value: string): PasswordStrengthLevel => {
  const score = getPasswordScore(value);

  if (score <= 1) return 'fraca';
  if (score <= 3) return 'media';
  return 'forte';
};

export const validatePasswordStrength = (value: string) => {
  if (value.length < 8) {
    return 'A senha deve ter no minimo 8 caracteres';
  }

  if (getPasswordScore(value) < 4) {
    return 'A senha deve incluir letras maiusculas, minusculas, numeros e simbolos';
  }

  return null;
};