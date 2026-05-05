const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function toUtf8(value: string) {
  return textEncoder.encode(value);
}

function fromUtf8(buffer: ArrayBuffer) {
  return textDecoder.decode(buffer);
}

export async function generateRsaOaepKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKeyBase64(publicKey: CryptoKey) {
  return toBase64(await crypto.subtle.exportKey('spki', publicKey));
}

export async function exportPrivateKeyBase64(privateKey: CryptoKey) {
  return toBase64(await crypto.subtle.exportKey('pkcs8', privateKey));
}

export async function importPublicKeyBase64(publicKeyBase64: string) {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(publicKeyBase64),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  );
}

export async function importPrivateKeyBase64(privateKeyBase64: string) {
  return crypto.subtle.importKey(
    'pkcs8',
    fromBase64(privateKeyBase64),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['decrypt']
  );
}

export function generatePbkdf2Salt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return toBase64(salt.buffer);
}

async function deriveWrappingKey(password: string, saltBase64: string) {
  const passwordKey = await crypto.subtle.importKey('raw', toUtf8(password), 'PBKDF2', false, ['deriveKey']);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltBase64),
      iterations: 150000,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function generateRegistrationKeys(password: string) {
  const keyPair = await generateRsaOaepKeyPair();
  const salt = generatePbkdf2Salt();
  const wrappingKey = await deriveWrappingKey(password, salt);
  const publicKey = await exportPublicKeyBase64(keyPair.publicKey);
  const privateKeyBytes = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    wrappingKey,
    privateKeyBytes
  );

  return {
    public_key: publicKey,
    wrapped_private_key: `${toBase64(iv.buffer)}.${toBase64(encryptedPrivateKey)}`,
    pbkdf2_salt: salt
  };
}

export async function unwrapPrivateKeyWithPassword(
  wrappedPrivateKeyBase64: string,
  password: string,
  saltBase64: string
) {
  const wrappingKey = await deriveWrappingKey(password, saltBase64);
  const [ivBase64, encryptedPrivateKeyBase64] = wrappedPrivateKeyBase64.split('.');

  if (!ivBase64 || !encryptedPrivateKeyBase64) {
    throw new Error('Invalid wrapped private key format.');
  }

  const decryptedPrivateKey = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(fromBase64(ivBase64))
    },
    wrappingKey,
    fromBase64(encryptedPrivateKeyBase64)
  );

  return crypto.subtle.importKey(
    'pkcs8',
    decryptedPrivateKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['decrypt']
  );
}

export async function createEncryptedPayload(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderPublicKeyBase64: string
) {
  const aesKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const recipientPublicKey = await importPublicKeyBase64(recipientPublicKeyBase64);
  const senderPublicKey = await importPublicKeyBase64(senderPublicKeyBase64);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    toUtf8(plaintext)
  );
  const encryptedKey = await crypto.subtle.wrapKey('raw', aesKey, recipientPublicKey, 'RSA-OAEP');
  const encryptedKeyForSelf = await crypto.subtle.wrapKey('raw', aesKey, senderPublicKey, 'RSA-OAEP');

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv.buffer),
    encryptedKey: toBase64(encryptedKey),
    encryptedKeyForSelf: toBase64(encryptedKeyForSelf)
  };
}

export async function decryptPayload(
  payload: { ciphertext: string; iv: string; encryptedKey: string; encryptedKeyForSelf?: string },
  privateKey: CryptoKey,
  preferSelfKey = false
) {
  const wrappedKeyBase64 = preferSelfKey && payload.encryptedKeyForSelf ? payload.encryptedKeyForSelf : payload.encryptedKey;
  const aesKey = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(wrappedKeyBase64),
    privateKey,
    'RSA-OAEP',
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(fromBase64(payload.iv))
    },
    aesKey,
    fromBase64(payload.ciphertext)
  );

  return fromUtf8(plaintext);
}
