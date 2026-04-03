export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeText = (value: unknown) => String(value ?? '').trim();

export const normalizeEmail = (value: unknown) => normalizeText(value).toLowerCase();

export const normalizeCpf = (value: unknown) => normalizeText(value).replace(/\D/g, '');