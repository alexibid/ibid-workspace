import { Injectable, inject, signal } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';

export type SyncState = 'disconnected' | 'syncing' | 'synced' | 'error';

export interface DriveVaultFile {
  readonly id: string;
  readonly name: string;
  readonly modifiedTime: string;
  readonly isShared: boolean;
}

export interface DriveFolderStructure {
  readonly rootFolderId: string;
  readonly privateImportsFolderId: string;
  readonly sharedFolderId: string;
  readonly sharedImportsFolderId: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveSyncService {
  private readonly LAST_SYNC_KEY = 'savvy_last_sync_time';
  private readonly PRIVATE_VAULT_FILENAME = 'vault-private.json';
  private readonly JOINT_VAULT_FILENAME = 'vault-joint.json';
  private readonly LEGACY_VAULT_FILENAME = 'savvy-vault.json';
  private readonly ROOT_FOLDER_NAME = 'savvy-app';
  private readonly SHARED_FOLDER_NAME = 'shared';
  private readonly IMPORTS_FOLDER_NAME = 'imports';

  public readonly syncStatus = signal<SyncState>('disconnected');
  public readonly lastSyncTime = signal<string>('');
  public readonly activePrivateVault = signal<DriveVaultFile | null>(null);
  public readonly activeJointVault = signal<DriveVaultFile | null>(null);
  public readonly activeVaultFile = signal<DriveVaultFile | null>(null);
  public readonly errorMessage = signal<string | null>(null);

  private cachedFolderStructure: DriveFolderStructure | null = null;

  private readonly auth = inject(GoogleAuthService);

  constructor() {
    this.restoreLastSyncTime();
  }

  private restoreLastSyncTime(): void {
    if (typeof window === 'undefined') return;
    const savedTime = localStorage.getItem(this.LAST_SYNC_KEY);
    if (savedTime) {
      this.lastSyncTime.set(savedTime);
    }
  }

  private getAuthHeaders(): HeadersInit | null {
    const token = this.auth.accessToken();
    if (!token || !this.auth.isAuthenticated()) {
      this.syncStatus.set('error');
      this.errorMessage.set('Not authenticated with Google.');
      return null;
    }
    return {
      Authorization: `Bearer ${token}`
    };
  }

  public async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      let queryStr = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentFolderId) {
        queryStr += ` and '${parentFolderId}' in parents`;
      }
      const query = encodeURIComponent(queryStr);
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

      const listResponse = await fetch(listUrl, { headers });
      if (listResponse.ok) {
        const listResult = (await listResponse.json()) as { readonly files?: ReadonlyArray<{ readonly id: string; readonly name: string }> };
        if (listResult.files && listResult.files.length > 0) {
          return listResult.files[0].id;
        }
      }

      const createBody: { readonly name: string; readonly mimeType: string; readonly parents?: readonly string[] } = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createBody)
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create folder '${folderName}' on Google Drive: ${createResponse.statusText}`);
      }

      const createResult = (await createResponse.json()) as { readonly id: string };
      return createResult.id;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async ensureAppFolders(): Promise<DriveFolderStructure | null> {
    if (this.cachedFolderStructure) {
      return this.cachedFolderStructure;
    }

    const rootFolderId = await this.findOrCreateFolder(this.ROOT_FOLDER_NAME);
    if (!rootFolderId) return null;

    const privateImportsFolderId = await this.findOrCreateFolder(this.IMPORTS_FOLDER_NAME, rootFolderId);
    if (!privateImportsFolderId) return null;

    const sharedFolderId = await this.findOrCreateFolder(this.SHARED_FOLDER_NAME, rootFolderId);
    if (!sharedFolderId) return null;

    const sharedImportsFolderId = await this.findOrCreateFolder(this.IMPORTS_FOLDER_NAME, sharedFolderId);
    if (!sharedImportsFolderId) return null;

    this.cachedFolderStructure = {
      rootFolderId,
      privateImportsFolderId,
      sharedFolderId,
      sharedImportsFolderId
    };
    return this.cachedFolderStructure;
  }

  public async findPrivateVaultFile(): Promise<DriveVaultFile | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const query = encodeURIComponent(`(name = '${this.PRIVATE_VAULT_FILENAME}' or name = '${this.LEGACY_VAULT_FILENAME}') and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,sharedWithMeTime)&orderBy=modifiedTime%20desc&spaces=drive`;

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        readonly files?: ReadonlyArray<{
          readonly id: string;
          readonly name: string;
          readonly modifiedTime: string;
          readonly sharedWithMeTime?: string;
        }>;
      };

      if (!result.files || result.files.length === 0) {
        this.activePrivateVault.set(null);
        return null;
      }

      const file = result.files[0];
      const vault: DriveVaultFile = {
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        isShared: false
      };

      this.activePrivateVault.set(vault);
      return vault;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async findJointVaultFile(): Promise<DriveVaultFile | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const query = encodeURIComponent(`name = '${this.JOINT_VAULT_FILENAME}' and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,sharedWithMeTime)&orderBy=modifiedTime%20desc&spaces=drive`;

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        readonly files?: ReadonlyArray<{
          readonly id: string;
          readonly name: string;
          readonly modifiedTime: string;
          readonly sharedWithMeTime?: string;
        }>;
      };

      if (!result.files || result.files.length === 0) {
        this.activeJointVault.set(null);
        return null;
      }

      const file = result.files[0];
      const vault: DriveVaultFile = {
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        isShared: !!file.sharedWithMeTime
      };

      this.activeJointVault.set(vault);
      return vault;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async findVaultFile(): Promise<DriveVaultFile | null> {
    return this.findPrivateVaultFile();
  }

  public async createPrivateVault(contentJson: string): Promise<string | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const folders = await this.ensureAppFolders();
      const parentId = folders?.rootFolderId;

      const metadata = {
        name: this.PRIVATE_VAULT_FILENAME,
        mimeType: 'application/json',
        description: 'Savvy Private Individual Vault',
        parents: parentId ? [parentId] : undefined
      };

      const fileId = await this.uploadMultipart(metadata, contentJson);
      if (fileId) {
        this.activePrivateVault.set({
          id: fileId,
          name: this.PRIVATE_VAULT_FILENAME,
          modifiedTime: new Date().toISOString(),
          isShared: false
        });
      }
      return fileId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async createJointVault(contentJson: string): Promise<string | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const folders = await this.ensureAppFolders();
      const parentId = folders?.sharedFolderId;

      const metadata = {
        name: this.JOINT_VAULT_FILENAME,
        mimeType: 'application/json',
        description: 'Savvy Joint Household Shared Vault',
        parents: parentId ? [parentId] : undefined
      };

      const fileId = await this.uploadMultipart(metadata, contentJson);
      if (fileId) {
        this.activeJointVault.set({
          id: fileId,
          name: this.JOINT_VAULT_FILENAME,
          modifiedTime: new Date().toISOString(),
          isShared: true
        });
      }
      return fileId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async createVaultFile(contentJson: string): Promise<string | null> {
    return this.createPrivateVault(contentJson);
  }

  private async uploadMultipart(
    metadata: { readonly name: string; readonly mimeType: string; readonly parents?: readonly string[]; readonly description?: string },
    bodyContent: string
  ): Promise<string | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    const boundary = '-------savvy_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${metadata.mimeType}\r\n\r\n` +
      bodyContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive upload error: ${response.statusText}`);
    }

    const result = (await response.json()) as { readonly id: string };
    return result.id;
  }

  public async uploadImportBatchCsv(
    fileName: string,
    csvContent: string,
    isJoint = false
  ): Promise<string | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const folders = await this.ensureAppFolders();
      const parentId = isJoint ? folders?.sharedImportsFolderId : folders?.privateImportsFolderId;

      const metadata = {
        name: fileName,
        mimeType: 'text/csv',
        parents: parentId ? [parentId] : undefined
      };

      return await this.uploadMultipart(metadata, csvContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorMessage.set(msg);
      return null;
    }
  }

  public async updateVaultFile(fileId: string, contentJson: string): Promise<boolean> {
    const headers = this.getAuthHeaders();
    if (!headers) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: contentJson
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update vault file on Google Drive: ${response.statusText}`);
      }

      const result = (await response.json()) as { readonly id: string; readonly name?: string; readonly modifiedTime?: string };
      const now = result.modifiedTime || new Date().toISOString();

      if (this.activePrivateVault()?.id === fileId) {
        this.activePrivateVault.update(v => (v ? { ...v, modifiedTime: now } : null));
      }
      if (this.activeJointVault()?.id === fileId) {
        this.activeJointVault.update(v => (v ? { ...v, modifiedTime: now } : null));
      }

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return false;
    }
  }

  public async downloadVaultFile<TSnapshot>(fileId: string): Promise<TSnapshot | null> {
    const headers = this.getAuthHeaders();
    if (!headers) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          method: 'GET',
          headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download vault file from Google Drive: ${response.statusText}`);
      }

      const snapshot = (await response.json()) as TSnapshot;
      return snapshot;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.syncStatus.set('error');
      this.errorMessage.set(msg);
      return null;
    }
  }

  public markSynced(): void {
    const now = new Date().toISOString();
    this.lastSyncTime.set(now);
    this.syncStatus.set('synced');
    this.errorMessage.set(null);

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.LAST_SYNC_KEY, now);
    }
  }
}
