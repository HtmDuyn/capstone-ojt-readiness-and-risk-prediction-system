export interface UserSessionRecord {
  session_id: string;

  user_id: number;

  token_hash: string;

  created_at: Date;

  expires_at: Date;

  revoked_at: Date | null;
}