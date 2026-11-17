import { Injectable } from '@angular/core';

type Unlisten = () => void;

interface DesktopEvent {
  readonly payload: unknown;
}

interface DesktopGlobal {
  readonly core: {
    invoke(command: string, args?: Record<string, unknown>): Promise<unknown>;
  };
  readonly event: {
    listen(name: string, handler: (event: DesktopEvent) => void): Promise<Unlisten>;
  };
}

function isDesktopGlobal(value: unknown): value is DesktopGlobal {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return 'core' in value && 'event' in value;
}

export class DesktopUnavailableError extends Error {
  constructor() {
    super('The menu is running outside the desktop app.');
  }
}

@Injectable({ providedIn: 'root' })
export class DesktopBridge {
  private desktop(): DesktopGlobal {
    const candidate: unknown = Reflect.get(window, '__TAURI__');
    if (!isDesktopGlobal(candidate)) {
      throw new DesktopUnavailableError();
    }
    return candidate;
  }

  invoke(command: string, args: Record<string, unknown> = {}): Promise<unknown> {
    return this.desktop().core.invoke(command, args);
  }

  listen(name: string, handler: (payload: unknown) => void): Promise<Unlisten> {
    return this.desktop().event.listen(name, (event) => handler(event.payload));
  }
}
