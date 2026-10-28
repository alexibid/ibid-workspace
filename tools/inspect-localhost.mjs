import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[PAGE ERROR]`, err));

  await page.goto('http://localhost:4400', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('--- Step 1: Initial state ---');
  let state = await page.evaluate(() => {
    const cur = window.papikapi?.progress?.progress();
    return {
      currentId: cur?.currentId,
      allocations: cur?.allocations,
      unassignedCredit: cur?.unassignedCredit,
      tRexPts: window.papikapi?.progress?.allocation('t-rex'),
      pipsFilled: document.querySelectorAll('.m-progress-pips__pip--filled')?.length
    };
  });
  console.log('Initial state:', state);

  // Step 2: Click + on the second trophy (ankylosaurus)
  console.log('--- Step 2: Clicking + on second trophy ---');
  const secondTrophyPlus = page.locator('papikapi-trophy').nth(1).locator('.m-trophy__action-btn--plus');
  await secondTrophyPlus.click();
  await page.waitForTimeout(500);

  state = await page.evaluate(() => {
    const cur = window.papikapi?.progress?.progress();
    const secondTrophy = document.querySelectorAll('papikapi-trophy')[1];
    return {
      currentId: cur?.currentId,
      allocations: cur?.allocations,
      unassignedCredit: cur?.unassignedCredit,
      secondTrophyButtons: {
        hasPlus: !!secondTrophy.querySelector('.m-trophy__action-btn--plus'),
        hasMinus: !!secondTrophy.querySelector('.m-trophy__action-btn--minus'),
        hasRemove: !!secondTrophy.querySelector('.m-trophy__remove-btn'),
      }
    };
  });
  console.log('After clicking + on second trophy:', state);

  await page.screenshot({ path: '/Users/alexsantos/.gemini/antigravity/brain/898630ca-9289-457f-bbcf-a43da4189f0a/scratch/step2-plus-second.png' });

  // Step 3: Click - on the second trophy
  console.log('--- Step 3: Clicking - on second trophy ---');
  const secondTrophyMinus = page.locator('papikapi-trophy').nth(1).locator('.m-trophy__action-btn--minus');
  await secondTrophyMinus.click();
  await page.waitForTimeout(500);

  state = await page.evaluate(() => {
    const cur = window.papikapi?.progress?.progress();
    const secondTrophy = document.querySelectorAll('papikapi-trophy')[1];
    return {
      currentId: cur?.currentId,
      allocations: cur?.allocations,
      unassignedCredit: cur?.unassignedCredit,
      secondTrophyButtons: {
        hasPlus: !!secondTrophy.querySelector('.m-trophy__action-btn--plus'),
        hasMinus: !!secondTrophy.querySelector('.m-trophy__action-btn--minus'),
        hasRemove: !!secondTrophy.querySelector('.m-trophy__remove-btn'),
      }
    };
  });
  console.log('After clicking - on second trophy (back to 0):', state);

  await page.screenshot({ path: '/Users/alexsantos/.gemini/antigravity/brain/898630ca-9289-457f-bbcf-a43da4189f0a/scratch/step3-minus-second.png' });

  // Step 4: Click remove button on second trophy
  console.log('--- Step 4: Clicking remove on second trophy ---');
  const secondTrophyRemove = page.locator('papikapi-trophy').nth(1).locator('.m-trophy__remove-btn');
  await secondTrophyRemove.click();
  await page.waitForTimeout(500);

  state = await page.evaluate(() => {
    const cur = window.papikapi?.progress?.progress();
    const trophies = Array.from(document.querySelectorAll('papikapi-trophy')).map((t, idx) => ({
      idx,
      state: t.querySelector('.m-trophy--chosen') ? 'chosen' : t.querySelector('.m-trophy--building') ? 'building' : 'queued',
      hasRemove: !!t.querySelector('.m-trophy__remove-btn')
    }));
    return {
      hiddenShelfIds: cur?.hiddenShelfIds,
      trophiesCount: trophies.length,
      trophies
    };
  });
  console.log('After clicking remove:', state);

  await page.screenshot({ path: '/Users/alexsantos/.gemini/antigravity/brain/898630ca-9289-457f-bbcf-a43da4189f0a/scratch/step4-remove-second.png' });

  // Step 5: Test papikapi.removePoints() and papikapi.addPoints() in console
  console.log('--- Step 5: Calling window.papikapi.removePoints() ---');
  const bridgeTest = await page.evaluate(() => {
    const beforePts = window.papikapi?.progress?.allocation('t-rex');
    window.papikapi?.removePoints(1);
    const afterRemovePts = window.papikapi?.progress?.allocation('t-rex');
    window.papikapi?.addPoints(1);
    const afterAddPts = window.papikapi?.progress?.allocation('t-rex');
    return { beforePts, afterRemovePts, afterAddPts };
  });
  console.log('Console API bridge test:', bridgeTest);

  // Step 6: Test clicking on a trophy to switch active figure
  console.log('--- Step 6: Switching active figure to another trophy ---');
  const targetTrophy = page.locator('papikapi-trophy').nth(1);
  await targetTrophy.locator('.m-trophy__figure').click();
  await page.waitForTimeout(1000);

  state = await page.evaluate(() => {
    const cur = window.papikapi?.progress?.progress();
    return {
      currentId: cur?.currentId,
      pipsFilled: document.querySelectorAll('.m-progress-pips__pip--filled')?.length
    };
  });
  console.log('After switching figure:', state);

  await page.screenshot({ path: '/Users/alexsantos/.gemini/antigravity/brain/898630ca-9289-457f-bbcf-a43da4189f0a/scratch/step6-switched-figure.png' });

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
