export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  friendCode: string;
  friendIds: string[];
}

const users: AppUser[] = [
  {
    id: 'x',
    name: 'Usuario X',
    email: 'x@neuroxp.com',
    password: '123456',
    friendCode: '1234',
    friendIds: [],
  },
  {
    id: 'y',
    name: 'Usuario Y',
    email: 'y@neuroxp.com',
    password: '123456',
    friendCode: '12345',
    friendIds: [],
  },
];

let currentUserId: string | null = null;

function hasFriendCode(code: string): boolean {
  return users.some((user) => user.friendCode === code);
}

function generateFriendCode(): string {
  // Gera codigo de 4 ou 5 digitos sem repeticao.
  while (true) {
    const length = Math.random() < 0.5 ? 4 : 5;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const candidate = String(Math.floor(Math.random() * (max - min + 1)) + min);

    if (!hasFriendCode(candidate)) {
      return candidate;
    }
  }
}

export function registerUser(name: string, email: string, password: string): AppUser {
  const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('Este e-mail ja esta cadastrado.');
  }

  const newUser: AppUser = {
    id: String(Date.now()),
    name,
    email,
    password,
    friendCode: generateFriendCode(),
    friendIds: [],
  };

  users.push(newUser);
  currentUserId = newUser.id;
  return newUser;
}

export function signIn(email: string, password: string): AppUser {
  const user = users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
  );

  if (!user) {
    throw new Error('E-mail ou senha invalidos.');
  }

  currentUserId = user.id;
  return user;
}

export function getCurrentUser(): AppUser | null {
  if (!currentUserId) {
    return null;
  }

  return users.find((user) => user.id === currentUserId) ?? null;
}

export function getFriends(userId: string): AppUser[] {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return [];
  }

  return user.friendIds
    .map((friendId) => users.find((item) => item.id === friendId))
    .filter((friend): friend is AppUser => Boolean(friend));
}

export function addFriendByCode(userId: string, friendCode: string): AppUser {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error('Usuario atual nao encontrado.');
  }

  const normalizedCode = friendCode.trim();
  const friend = users.find((item) => item.friendCode === normalizedCode);

  if (!friend) {
    throw new Error('Codigo de amigo nao encontrado.');
  }

  if (friend.id === user.id) {
    throw new Error('Voce nao pode adicionar seu proprio codigo.');
  }

  if (user.friendIds.includes(friend.id)) {
    throw new Error('Esse usuario ja esta na sua lista de amigos.');
  }

  user.friendIds.push(friend.id);
  friend.friendIds.push(user.id);

  return friend;
}
