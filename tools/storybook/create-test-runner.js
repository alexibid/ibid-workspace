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
      `Visual TDD: a story "${storyId}" quebra o layout em ${device} (${viewport.width}px) — ` +
        `o scrollWidth excede a largura do ecrã.`,
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
