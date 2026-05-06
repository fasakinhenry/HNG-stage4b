/**
 * WhisperBox Crypto Module
 * Implements hybrid encryption: RSA-OAEP for key exchange, AES-GCM for data
 * Private keys NEVER leave the client in plaintext
 */

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt.buffer);
}

// ─── PBKDF2 Key Derivation ────────────────────────────────────────────────────

/**
 * Derive AES-KW wrapping key from password + salt using PBKDF2
 * Used to wrap/unwrap the RSA private key
 */
export async function deriveWrappingKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToArrayBuffer(saltBase64),
      iterations: 250_000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

// ─── RSA-OAEP Key Pair ────────────────────────────────────────────────────────

export interface GeneratedKeyPair {
  publicKeyBase64: string;
  wrappedPrivateKeyBase64: string;
  pbkdf2SaltBase64: string;
}

/**
 * Generate RSA-OAEP keypair, wrap private key with password-derived AES-KW
 */
export async function generateAndWrapKeyPair(password: string): Promise<GeneratedKeyPair> {
  // 1. Generate RSA-OAEP 2048-bit keypair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  // 2. Generate PBKDF2 salt
  const saltBase64 = generateSalt();

  // 3. Derive AES-KW wrapping key from password
  const wrappingKey = await deriveWrappingKey(password, saltBase64);

  // 4. Export public key as base64
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

  // 5. Wrap private key with AES-KW
  const wrappedPrivateKeyBuffer = await crypto.subtle.wrapKey(
    'pkcs8',
    keyPair.privateKey,
    wrappingKey,
    'AES-KW'
  );
  const wrappedPrivateKeyBase64 = arrayBufferToBase64(wrappedPrivateKeyBuffer);

  return {
    publicKeyBase64,
    wrappedPrivateKeyBase64,
    pbkdf2SaltBase64: saltBase64,
  };
}

/**
 * Unwrap (decrypt) the stored private key using password
 * Returns a CryptoKey that stays in memory only
 */
export async function unwrapPrivateKey(
  wrappedPrivateKeyBase64: string,
  pbkdf2SaltBase64: string,
  password: string
): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(password, pbkdf2SaltBase64);

  return crypto.subtle.unwrapKey(
    'pkcs8',
    base64ToArrayBuffer(wrappedPrivateKeyBase64),
    wrappingKey,
    'AES-KW',
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false, // NOT extractable — stays in memory
    ['decrypt']
  );
}

/**
 * Import a recipient's public key from base64 for encryption
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    base64ToArrayBuffer(publicKeyBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

// ─── Message Encryption ───────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  encryptedKey: string;
  encryptedKeyForSelf: string;
}

/**
 * Encrypt a plaintext message for a recipient
 * Also encrypts for self so sender can read their own sent messages
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();

  // 1. Generate AES-GCM key and IV
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable for wrapping
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt plaintext with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintext)
  );

  // 3. Export raw AES key for RSA wrapping
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);

  // 4. Encrypt AES key with recipient's RSA public key
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );

  // 5. Encrypt AES key with sender's own RSA public key (for self-read)
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPublicKey,
    rawAesKey
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    encryptedKeyForSelf: arrayBufferToBase64(encryptedKeyForSelf),
  };
}

/**
 * Decrypt a received message using the recipient's private key
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  isSentByMe: boolean
): Promise<string> {
  // Choose which encrypted key to use
  const encryptedKeyBase64 = isSentByMe ? payload.encryptedKeyForSelf : payload.encryptedKey;

  // 1. Decrypt AES key with private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(encryptedKeyBase64)
  );

  // 2. Import the raw AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 3. Decrypt ciphertext
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
    aesKey,
    base64ToArrayBuffer(payload.ciphertext)
  );

  const dec = new TextDecoder();
  return dec.decode(plaintext);
}

/**
 * Import sender's own public key from base64 (for encryptedKeyForSelf)
 */
export async function importOwnPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  return importPublicKey(publicKeyBase64);
}
