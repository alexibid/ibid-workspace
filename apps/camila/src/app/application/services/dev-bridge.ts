import { EnvironmentProviders, inject, isDevMode, provideEnvironmentInitializer } from '@angular/core';
import { DiaryStore } from './diary-store';

export interface CamilaDevBridge {
  seed(startedAt?: number): Promise<void>;
  reset(): Promise<void>;
}

declare global {
  interface Window {
    camilaDev?: CamilaDevBridge;
  }
}

const EMPTIED_KEY = 'camila_emptied_on_purpose';

export function provideCamilaDevBridge(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    if (!isDevMode() || typeof window === 'undefined') return;

    const store = inject(DiaryStore);

    window.camilaDev = {
      seed: async (startedAt?: number) => {
        rememberEmptied(false);
        await store.seed(startedAt);
      },
      reset: async () => {
        rememberEmptied(true);
        await store.reset();
      },
    };

    if (!wasEmptiedOnPurpose()) void store.seedIfEmpty();
  });
}

function wasEmptiedOnPurpose(): boolean {
  try {
    return sessionStorage.getItem(EMPTIED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberEmptied(emptied: boolean): void {
  try {
    if (emptied) sessionStorage.setItem(EMPTIED_KEY, '1');
    else sessionStorage.removeItem(EMPTIED_KEY);
  } catch {
    return;
  }
}
