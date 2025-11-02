import { supabase } from './supabaseClient';

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface StoredKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

const ENCRYPTION_ALGORITHM = 'RSA-OAEP';
const HASH_ALGORITHM = 'SHA-256';
const KEY_SIZE = 2048;
const SYMMETRIC_ALGORITHM = 'AES-GCM';
const SYMMETRIC_KEY_SIZE = 256;

export class ChatEncryptionService {
  private static instance: ChatEncryptionService;
  private keyPair: KeyPair | null = null;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): ChatEncryptionService {
    if (!ChatEncryptionService.instance) {
      ChatEncryptionService.instance = new ChatEncryptionService();
    }
    return ChatEncryptionService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadOrGenerateKeyPair();
  }

  private async loadOrGenerateKeyPair(): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const storedKeys = await this.loadKeysFromIndexedDB();

      if (storedKeys) {
        this.keyPair = {
          publicKey: await crypto.subtle.importKey(
            'jwk',
            storedKeys.publicKeyJwk,
            { name: ENCRYPTION_ALGORITHM, hash: HASH_ALGORITHM },
            true,
            ['encrypt']
          ),
          privateKey: await crypto.subtle.importKey(
            'jwk',
            storedKeys.privateKeyJwk,
            { name: ENCRYPTION_ALGORITHM, hash: HASH_ALGORITHM },
            true,
            ['decrypt']
          )
        };
        console.log('Loaded existing key pair from IndexedDB');
      } else {
        await this.generateNewKeyPair();
      }
    } catch (error) {
      console.error('Error loading keys, generating new pair:', error);
      await this.generateNewKeyPair();
    }
  }

  private async generateNewKeyPair(): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    console.log('Generating new RSA key pair...');

    this.keyPair = await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_ALGORITHM,
        modulusLength: KEY_SIZE,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: HASH_ALGORITHM
      },
      true,
      ['encrypt', 'decrypt']
    ) as KeyPair;

    await this.saveKeysToIndexedDB();
    await this.uploadPublicKey();

    console.log('New key pair generated and stored');
  }

  private async saveKeysToIndexedDB(): Promise<void> {
    if (!this.keyPair || !this.userId) return;

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', this.keyPair.privateKey);

    const storedKeys: StoredKeyPair = { publicKeyJwk, privateKeyJwk };

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChatEncryptionDB', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');

        store.put({ userId: this.userId, keys: storedKeys });

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };

        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'userId' });
        }
      };
    });
  }

  private async loadKeysFromIndexedDB(): Promise<StoredKeyPair | null> {
    if (!this.userId) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ChatEncryptionDB', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains('keys')) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const getRequest = store.get(this.userId);

        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result?.keys || null);
        };

        getRequest.onerror = () => {
          db.close();
          reject(getRequest.error);
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'userId' });
        }
      };
    });
  }

  private async uploadPublicKey(): Promise<void> {
    if (!this.keyPair || !this.userId) return;

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
    const publicKeyString = JSON.stringify(publicKeyJwk);

    const { error } = await supabase
      .from('user_encryption_keys')
      .upsert({
        user_id: this.userId,
        public_key: publicKeyString,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error uploading public key:', error);
      throw error;
    }

    console.log('Public key uploaded to server');
  }

  async getPublicKey(userId: string): Promise<CryptoKey> {
    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('public_key')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Public key not found for user ${userId}`);

    const publicKeyJwk = JSON.parse(data.public_key);

    return await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      { name: ENCRYPTION_ALGORITHM, hash: HASH_ALGORITHM },
      true,
      ['encrypt']
    );
  }

  async encryptMessage(plaintext: string, recipientUserId?: string): Promise<string> {
    if (recipientUserId) {
      const recipientPublicKey = await this.getPublicKey(recipientUserId);
      return await this.encryptWithPublicKey(plaintext, recipientPublicKey);
    } else {
      return await this.encryptWithSymmetricKey(plaintext);
    }
  }

  private async encryptWithPublicKey(plaintext: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM },
      publicKey,
      data
    );

    return this.arrayBufferToBase64(encrypted);
  }

  private async encryptWithSymmetricKey(plaintext: string): Promise<string> {
    const key = await crypto.subtle.generateKey(
      { name: SYMMETRIC_ALGORITHM, length: SYMMETRIC_KEY_SIZE },
      true,
      ['encrypt', 'decrypt']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: SYMMETRIC_ALGORITHM, iv },
      key,
      data
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);

    return JSON.stringify({
      ciphertext: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer),
      key: this.arrayBufferToBase64(exportedKey),
      algorithm: 'AES-GCM'
    });
  }

  async decryptMessage(encryptedData: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    try {
      const parsed = JSON.parse(encryptedData);

      if (parsed.algorithm === 'AES-GCM') {
        return await this.decryptWithSymmetricKey(parsed);
      }
    } catch {
    }

    return await this.decryptWithPrivateKey(encryptedData);
  }

  private async decryptWithPrivateKey(encryptedBase64: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const encrypted = this.base64ToArrayBuffer(encryptedBase64);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM },
      this.keyPair.privateKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private async decryptWithSymmetricKey(data: {
    ciphertext: string;
    iv: string;
    key: string;
  }): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      this.base64ToArrayBuffer(data.key),
      { name: SYMMETRIC_ALGORITHM },
      false,
      ['decrypt']
    );

    const iv = this.base64ToArrayBuffer(data.iv);
    const ciphertext = this.base64ToArrayBuffer(data.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: SYMMETRIC_ALGORITHM, iv: new Uint8Array(iv) },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async generateChannelKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      { name: SYMMETRIC_ALGORITHM, length: SYMMETRIC_KEY_SIZE },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  async encryptChannelKeyForUser(channelKey: string, userId: string): Promise<string> {
    const publicKey = await this.getPublicKey(userId);
    return await this.encryptWithPublicKey(channelKey, publicKey);
  }

  clearKeys(): void {
    this.keyPair = null;
    this.userId = null;
  }
}

export const chatEncryption = ChatEncryptionService.getInstance();
