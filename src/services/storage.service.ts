interface TelegramSecureStorage {
  getItem: (key: string, callback: (error: Error | null, value?: string) => void) => void;
  setItem: (key: string, value: string, callback: (error: Error | null) => void) => void;
  removeItem: (key: string, callback: (error: Error | null) => void) => void;
  clear: (callback: (error: Error | null) => void) => void;
}

export interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class TelegramStorageService implements StorageService {
  private secureStorage: TelegramSecureStorage;

  constructor(secureStorage: TelegramSecureStorage) {
    this.secureStorage = secureStorage;
  }

  getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        this.secureStorage.getItem(key, (error: Error | null, value?: string) => {
          if (error) {
            reject(error);
          } else {
            resolve(value || null);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  setItem(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.secureStorage.setItem(key, value, (error: Error | null) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.secureStorage.removeItem(key, (error: Error | null) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.secureStorage.clear((error: Error | null) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export class LocalStorageService implements StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set item in localStorage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      throw error;
    }
  }
}
