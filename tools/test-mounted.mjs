import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));

  await page.goto('http://localhost:4400', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Mount/complete t-rex
  console.log('Mounting current figure...');
  await page.evaluate(() => {
    window.papikapi?.progress?.mountCurrent(100);
  });
  await page.waitForTimeout(1000);

  const shelfState = await page.evaluate(() => {
    const trophies = Array.from(document.querySelectorAll('papikapi-trophy')).map((t, idx) => ({
      idx,
      state: t.querySelector('.m-trophy--mounted') ? 'mounted' : t.querySelector('.m-trophy--building') ? 'building' : 'queued',
      hasPlus: !!t.querySelector('.m-trophy__action-btn--plus'),
      hasMinus: !!t.querySelector('.m-trophy__action-btn--minus'),
      hasRemove: !!t.querySelector('.m-trophy__remove-btn'),
    }));
    return {
      mountedIds: window.papikapi?.progress?.progress()?.mountedIds,
      currentId: window.papikapi?.progress?.progress()?.currentId,
      trophies
    };
  });
  console.log('Shelf state after mounting:', JSON.stringify(shelfState, null, 2));

  await page.screenshot({ path: '/Users/alexsantos/.gemini/antigravity/brain/898630ca-9289-457f-bbcf-a43da4189f0a/scratch/mounted-shelf.png' });

  await browser.close();
}

main().catch(console.error);
