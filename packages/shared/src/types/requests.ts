export interface LoginRequest {
  email?: string;
  login?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  date_of_birth: string;
  consent: boolean;
}
