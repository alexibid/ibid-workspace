const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const REPAINT_MS = 200;

async function captureAt(page, viewport, device, fileName, storyId) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(REPAINT_MS);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflows) {
    throw new Error(
      `Visual TDD: story "${storyId}" breaks the layout on ${device} (${viewport.width}px) — ` +
        `scrollWidth exceeds the screen width.`,
    );
  }

  await page.screenshot({
    path: `test-results/components/${device}/${fileName}.png`,
    fullPage: true,
  });
}

function createTestRunner(stripPrefixes = []) {
  return {
    async postVisit(page, context) {
      const fileName = stripPrefixes.reduce((id, re) => id.replace(re, ''), context.id);
      await captureAt(page, MOBILE, 'mobile', fileName, context.id);
      await captureAt(page, DESKTOP, 'desktop', fileName, context.id);
    },
  };
}

module.exports = { createTestRunner };
