import { apiRequest } from '../lib/api';
import type { ConversationMessage, ConversationSummary, MessagePayload, UserSearchResult } from '../types/messaging';

interface ApiConversationSummary {
  user_id: string;
  display_name: string;
  username: string;
  last_message_at: string;
}

interface ApiMessageRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  payload: MessagePayload;
  delivered: boolean;
  created_at: string;
}

interface ApiUserSearchResult {
  id: string;
  username: string;
  display_name: string;
}

function toConversationSummary(item: ApiConversationSummary): ConversationSummary {
  return {
    userId: item.user_id,
    displayName: item.display_name,
    username: item.username,
    lastMessageAt: item.last_message_at
  };
}

function toMessageRecord(item: ApiMessageRecord): ConversationMessage {
  return {
    id: item.id,
    fromUserId: item.from_user_id,
    toUserId: item.to_user_id,
    payload: item.payload,
    delivered: item.delivered,
    createdAt: item.created_at
  };
}

export async function fetchConversations(accessToken: string) {
  const response = await apiRequest<ApiConversationSummary[]>('/conversations', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.map(toConversationSummary);
}

export async function searchUsers(accessToken: string, query: string) {
  if (!query.trim()) {
    return [] as UserSearchResult[];
  }

  const response = await apiRequest<ApiUserSearchResult[]>(`/users/search?q=${encodeURIComponent(query.trim())}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.map((item) => ({
    id: item.id,
    username: item.username,
    displayName: item.display_name
  }));
}

export async function fetchConversationMessages(accessToken: string, userId: string) {
  const response = await apiRequest<ApiMessageRecord[]>(`/conversations/${userId}/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.map(toMessageRecord);
}

export async function fetchUserPublicKey(accessToken: string, userId: string) {
  const response = await apiRequest<{ public_key: string }>(`/users/${userId}/public-key`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.public_key;
}

export async function sendEncryptedMessage(
  accessToken: string,
  to: string,
  payload: MessagePayload
) {
  const response = await apiRequest<ApiMessageRecord>('/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      to,
      payload
    })
  });

  return toMessageRecord(response);
}
