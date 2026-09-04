import * as fs from 'node:fs';
import * as path from 'node:path';
import { Page, TestInfo } from '@playwright/test';
import { AppShellSelectors, DEFAULT_APP_SHELL } from './app-shell-selectors';
import { getScreenshotPath } from './screenshot';

const CURTAIN_TIMEOUT_MS = 1_000;
const PAINT_SETTLE_MS = 50;

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
    return getScreenshotPath(this.testInfo, this.flowName, filename);
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
    await this.scrollToTop();
    await this.page.screenshot({ path: filePath, fullPage: true, timeout: 15000, animations: 'disabled' });
    return filePath;
  }

  private async scrollToTop(): Promise<void> {
    await this.page.evaluate((scrollContainer: string) => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const scrollable = document.querySelector(scrollContainer);
      if (scrollable) scrollable.scrollTop = 0;
    }, this.shell.scrollContainer);
  }

  private async waitForAnimationsToSettle(): Promise<void> {
    try {
      await this.page.waitForFunction(
        () => document.getAnimations()
          .filter((a) => (a.effect?.getTiming().iterations ?? 1) !== Infinity)
          .every((a) => a.playState !== 'running'),
        undefined,
        { polling: 50, timeout: 200 },
      );
    } catch {
    }
  }
}
