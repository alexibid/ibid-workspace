import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';

export interface ThemeOption {
  readonly id: string;
  readonly label: string;
}

export interface ThemeConfig {
  readonly themes: readonly ThemeOption[];
  readonly defaultTheme: string;
}

export const THEME_CONFIG_TOKEN = new InjectionToken<ThemeConfig>('ibid-services.theme-config');

const THEME_STORAGE_KEY = 'ibid_theme';

const UNCONFIGURED: ThemeConfig = { themes: [], defaultTheme: '' };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly config = inject(THEME_CONFIG_TOKEN, { optional: true }) ?? UNCONFIGURED;
  private readonly document = inject(DOCUMENT);

  private readonly currentTheme = signal<string>(this.initialTheme());

  readonly theme = this.currentTheme.asReadonly();
  readonly themes = this.config.themes;

  constructor() {
    this.paint(this.currentTheme());
  }

  select(id: string): void {
    if (!this.knows(id)) {
      throw new Error(`Unknown theme "${id}". Declare it in the ThemeConfig of this app.`);
    }
    this.currentTheme.set(id);
    this.paint(id);
    this.store(id);
  }

  private initialTheme(): string {
    const stored = this.read();
    return stored && this.knows(stored) ? stored : this.config.defaultTheme;
  }

  private knows(id: string): boolean {
    return this.config.themes.some(theme => theme.id === id);
  }

  private paint(id: string): void {
    const body = this.document.body;
    if (!body) return;
    for (const theme of this.config.themes) body.classList.remove(theme.id);
    if (id) body.classList.add(id);
  }

  private read(): string | null {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private store(id: string): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
    }
  }
}
