import { Injectable } from '@angular/core';

export interface SyncRecord {
  id: string;
  updatedAt: number;
  deleted?: boolean;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ConflictResolverService {
  resolve<T extends SyncRecord>(local: T | null, remote: T): T | null {
    if (!local) {
      return remote;
    }
    if (remote.updatedAt >= local.updatedAt) {
      return remote;
    }
    return local;
  }
}
