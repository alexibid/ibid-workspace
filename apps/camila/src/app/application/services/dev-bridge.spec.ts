import { TestBed } from '@angular/core/testing';
import { CamilaDatabaseService } from '@infrastructure/rxdb/camila-database.service';
import { DEMO_ENTRY_COUNT } from '@application/testing/demo-seed';
import { DiaryStore } from './diary-store';
import { provideCamilaDevBridge } from './dev-bridge';

describe('the development bridge', () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete window.camilaDev;
    TestBed.configureTestingModule({ providers: [provideCamilaDevBridge()] });
  });

  afterEach(async () => {
    await TestBed.inject(CamilaDatabaseService).close();
    delete window.camilaDev;
  });

  it('exposes seeding and resetting on the window', () => {
    TestBed.inject(DiaryStore);

    expect(typeof window.camilaDev?.seed).toBe('function');
    expect(typeof window.camilaDev?.reset).toBe('function');
  });

  it('fills an empty database so the first run is never a blank app', async () => {
    const store = TestBed.inject(DiaryStore);

    await store.seedIfEmpty();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
    expect(store.tree().badges.length).toBeGreaterThan(6);
  });

  it('leaves an existing history alone', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await store.seedIfEmpty();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
  });

  it('seeds on demand through the bridge', async () => {
    const store = TestBed.inject(DiaryStore);
    await window.camilaDev?.reset();

    await window.camilaDev?.seed();

    expect(store.entries()).toHaveLength(DEMO_ENTRY_COUNT);
  });

  it('does not refill a database the user emptied on purpose', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await window.camilaDev?.reset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideCamilaDevBridge()] });
    const revived = TestBed.inject(DiaryStore);
    await revived.load();

    expect(revived.entries()).toHaveLength(0);
  });

  it('clears everything through the bridge', async () => {
    const store = TestBed.inject(DiaryStore);
    await store.seedIfEmpty();

    await window.camilaDev?.reset();

    expect(store.entries()).toHaveLength(0);
    expect(store.tree().badges).toHaveLength(0);
  });
});
