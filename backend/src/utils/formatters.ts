export const formatCpf = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const formatCnpj = (cnpj: string): string => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 11) return digits;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatDate = (date: string): string => {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
};

export const unformatCpf = (cpf: string): string => cpf.replace(/\D/g, '');
export const unformatCnpj = (cnpj: string): string => cnpj.replace(/\D/g, '');
export const unformatPhone = (phone: string): string => phone.replace(/\D/g, '');

const validateCpfChecksum = (digits: string): boolean => {
  if (digits.length !== 11) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(digits[10])) return false;

  return true;
};

export const validateCpfNumber = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return validateCpfChecksum(digits);
};

export const validateCnpjNumber = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;

  let sum = 0;
  let remainder;

  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (14 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(digits[i]) * (15 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(digits[13])) return false;

  return true;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && /^[1-9]/.test(digits);
};

export const validateDateString = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};
