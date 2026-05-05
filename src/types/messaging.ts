export interface ConversationSummary {
  userId: string;
  displayName: string;
  username: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export interface MessagePayload {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

export interface ConversationMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  payload: MessagePayload;
  delivered: boolean;
  createdAt: string;
  plaintext?: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
}
