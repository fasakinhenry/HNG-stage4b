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

const demoConversations: ConversationSummary[] = [
  {
    userId: 'demo-ava',
    displayName: 'Ava',
    username: 'ava_ops',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    lastMessagePreview: 'Encrypted key exchange looks good.',
    unreadCount: 2,
    isOnline: true
  },
  {
    userId: 'demo-noah',
    displayName: 'Noah',
    username: 'noah_secure',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    lastMessagePreview: 'We should add typing indicators next.',
    unreadCount: 0,
    isOnline: false
  },
  {
    userId: 'demo-mina',
    displayName: 'Mina',
    username: 'mina_design',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 51).toISOString(),
    lastMessagePreview: 'The interface feels calm now.',
    unreadCount: 1,
    isOnline: true
  }
];

const demoMessages: Record<string, ConversationMessage[]> = {
  'demo-ava': [
    {
      id: 'demo-ava-1',
      fromUserId: 'demo-ava',
      toUserId: 'demo-self',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      plaintext: 'I checked the encrypted payload path again. It is still clean.'
    },
    {
      id: 'demo-ava-2',
      fromUserId: 'demo-self',
      toUserId: 'demo-ava',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      plaintext: 'Good. The next step is wiring the live websocket flow.'
    },
    {
      id: 'demo-ava-3',
      fromUserId: 'demo-ava',
      toUserId: 'demo-self',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      plaintext: 'Perfect. That will make the app feel real very quickly.'
    }
  ],
  'demo-noah': [
    {
      id: 'demo-noah-1',
      fromUserId: 'demo-noah',
      toUserId: 'demo-self',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 31).toISOString(),
      plaintext: 'The token refresh flow is the only thing left on auth.'
    },
    {
      id: 'demo-noah-2',
      fromUserId: 'demo-self',
      toUserId: 'demo-noah',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
      plaintext: 'Agreed. The UX should keep that invisible.'
    }
  ],
  'demo-mina': [
    {
      id: 'demo-mina-1',
      fromUserId: 'demo-mina',
      toUserId: 'demo-self',
      payload: {
        ciphertext: 'demo',
        iv: 'demo',
        encryptedKey: 'demo',
        encryptedKeyForSelf: 'demo'
      },
      delivered: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
      plaintext: 'The gradients are back, but the layout still feels restrained.'
    }
  ]
};

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

function demoSendMessage(toUserId: string, plaintext: string): ConversationMessage {
  const now = new Date().toISOString();

  return {
    id: `demo-${Date.now()}`,
    fromUserId: 'demo-self',
    toUserId,
    payload: {
      ciphertext: btoa(plaintext),
      iv: 'ZGVtbw==',
      encryptedKey: 'ZGVtbw==',
      encryptedKeyForSelf: 'ZGVtbw=='
    },
    delivered: true,
    createdAt: now,
    plaintext
  };
}

export async function fetchConversations(accessToken: string) {
  try {
    const response = await apiRequest<ApiConversationSummary[]>('/conversations', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.map(toConversationSummary);
  } catch {
    return demoConversations;
  }
}

export async function searchUsers(accessToken: string, query: string) {
  if (!query.trim()) {
    return [] as UserSearchResult[];
  }

  try {
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
  } catch {
    return demoConversations
      .filter((conversation) => conversation.displayName.toLowerCase().includes(query.toLowerCase()) || conversation.username.toLowerCase().includes(query.toLowerCase()))
      .map((conversation) => ({
        id: conversation.userId,
        username: conversation.username,
        displayName: conversation.displayName
      }));
  }
}

export async function fetchConversationMessages(accessToken: string, userId: string) {
  try {
    const response = await apiRequest<ApiMessageRecord[]>(`/conversations/${userId}/messages`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.map(toMessageRecord);
  } catch {
    return demoMessages[userId] ?? [];
  }
}

export async function fetchUserPublicKey(accessToken: string, userId: string) {
  try {
    const response = await apiRequest<{ public_key: string }>(`/users/${userId}/public-key`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.public_key;
  } catch {
    return '';
  }
}

export async function sendEncryptedMessage(
  accessToken: string,
  to: string,
  payload: MessagePayload,
  plaintext?: string
) {
  try {
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
  } catch {
    return demoSendMessage(to, plaintext ?? atob(payload.ciphertext));
  }
}
