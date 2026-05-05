export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  public_key: string;
  wrapped_private_key: string;
  pbkdf2_salt: string;
  created_at: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  user: UserProfile;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthRegistrationPayload extends AuthCredentials {
  display_name: string;
  public_key: string;
  wrapped_private_key: string;
  pbkdf2_salt: string;
}
