export type UserType = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar?: string | null;
  address?: string | null;
  phone?: string | null;
  gender?: string | null;
  provider?: string | null;
  googleId?: string | null;
  githubId?: string | null;
  deletedAt?: Date | null;
};
