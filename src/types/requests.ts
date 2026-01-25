interface LoginRequest {
  email?: string;
  login?: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  date_of_birth: string;
  consent: boolean;
}
