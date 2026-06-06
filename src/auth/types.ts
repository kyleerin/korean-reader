export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthConfig {
  enabled: boolean;
  googleClientId?: string;
}
