import type { User } from '@/types/users';

export const getDefaultAvatar = (user: Partial<User> | null | undefined) => {
  if (!user?.id) return '0e291f67c9274a1abdddeb3fd919cbaa';

  const index =
    user.discriminator && user.discriminator !== '0'
      ? parseInt(user.discriminator, 10) % 5
      : parseInt(user.id.slice(-1), 10) % 6;

  const assetHashes: Record<number, string> = {
    0: '6debd47ed13483642cf09e832ed0bc1b', // Blue
    1: '322c936a8c8be1b803cd94861bdfa868', // Gray
    2: 'dd4dbc0016779df1378e7812eabaa04d', // Green
    3: '0e291f67c9274a1abdddeb3fd919cbaa', // Yellow
    4: '1cbd08c76f8af6dddce02c5138971129', // Red
  };

  return assetHashes[index] ?? assetHashes[0];
};
