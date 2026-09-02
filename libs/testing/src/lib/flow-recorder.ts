import * as fs from 'node:fs';
import * as path from 'node:path';
import { Page, TestInfo } from '@playwright/test';
import { AppShellSelectors, DEFAULT_APP_SHELL } from './app-shell-selectors';
import { getDeviceFolder } from './screenshot';

const CURTAIN_TIMEOUT_MS = 15_000;
const PAINT_SETTLE_MS = 150;
const ANIMATION_TIMEOUT_MS = 1_500;
const MAX_CAPTURE_HEIGHT_PX = 5_000;
const FALLBACK_VIEWPORT = { width: 390, height: 844 } as const;

export class FlowRecorder {
  private readonly shell: AppShellSelectors;

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
    private readonly flowName: string,
    shell: AppShellSelectors = DEFAULT_APP_SHELL,
  ) {
    this.shell = shell;
  }

  async step(stepNumber: number, action: string, expectedResult: string): Promise<string> {
    const filePath = this.buildStepPath(stepNumber, action, expectedResult);

    await this.waitForContentToLoad();
    const filePath_ = await this.captureFullPage(filePath);
    await this.waitForAnimationsToSettle();

    this.recordStepLog(stepNumber, action, expectedResult, filePath_);

    return filePath_;
  }

  private buildStepPath(stepNumber: number, action: string, expectedResult: string): string {
    const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const filename = `step-${stepNumber}-[${slug(action)}]-[${slug(expectedResult)}].png`;
    return `test-results/flows/${getDeviceFolder(this.testInfo)}/${this.flowName}/${filename}`;
  }

  private recordStepLog(
    stepNumber: number,
    action: string,
    expectedResult: string,
    screenshotPath: string
  ): void {
    try {
      const dir = path.dirname(screenshotPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const logFile = path.join(dir, 'flow-log.json');
      const entry = {
        flow: this.flowName,
        step: stepNumber,
        action,
        expectedResult,
        screenshot: screenshotPath,
        url: this.page.url(),
        viewport: this.page.viewportSize(),
        timestamp: new Date().toISOString()
      };

      let entries: unknown[] = [];
      if (fs.existsSync(logFile)) {
        try {
          entries = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
        } catch {
          entries = [];
        }
      }
      entries.push(entry);
      fs.writeFileSync(logFile, JSON.stringify(entries, null, 2), 'utf-8');
    } catch {
    }
  }

  private async waitForContentToLoad(): Promise<void> {
    try {
      await this.page.waitForFunction(
        (selector: string) => !document.querySelector(selector),
        this.shell.loadingCurtain,
        { timeout: CURTAIN_TIMEOUT_MS },
      );
    } catch {
    }
    await this.page.waitForTimeout(PAINT_SETTLE_MS);
  }

  private async captureFullPage(filePath: string): Promise<string> {
    const initialViewport = this.page.viewportSize() ?? FALLBACK_VIEWPORT;
    const fullHeight = await this.measureContentHeight();
    const needsResize = fullHeight > initialViewport.height;

    if (needsResize) {
      await this.page.setViewportSize({
        width: initialViewport.width,
        height: Math.min(fullHeight + 40, MAX_CAPTURE_HEIGHT_PX),
      });
      await this.page.waitForTimeout(50);
    }

    await this.scrollToTop();
    await this.page.screenshot({ path: filePath, fullPage: true });

    if (needsResize) {
      await this.page.setViewportSize(initialViewport);
    }

    return filePath;
  }

  private measureContentHeight(): Promise<number> {
    return this.page.evaluate(
      ({ scrollContainer, minimumHeight }) => {
        const scrollable = document.querySelector(scrollContainer) as HTMLElement | null;
        const mainEl = document.querySelector('main') as HTMLElement | null;
        return Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          scrollable ? scrollable.scrollHeight : 0,
          mainEl ? mainEl.scrollHeight : 0,
          minimumHeight,
        );
      },
      { scrollContainer: this.shell.scrollContainer, minimumHeight: FALLBACK_VIEWPORT.height },
    );
  }

  private async scrollToTop(): Promise<void> {
    await this.page.evaluate((scrollContainer: string) => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const scrollable = document.querySelector(scrollContainer);
      if (scrollable) scrollable.scrollTop = 0;
    }, this.shell.scrollContainer);
    await this.page.waitForTimeout(50);
  }

  private async waitForAnimationsToSettle(): Promise<void> {
    try {
      await this.page.waitForFunction(
        () => document.getAnimations().every((animation) => animation.playState !== 'running'),
        undefined,
        { polling: 100, timeout: ANIMATION_TIMEOUT_MS },
      );
    } catch {
    }
  }
}
