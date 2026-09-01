import { Page, expect } from '@playwright/test';
import { source as axeSource } from 'axe-core';

export interface A11yViolation {
  readonly id: string;
  readonly impact?: string;
  readonly description: string;
  readonly help: string;
  readonly nodes: readonly { html: string; target: readonly string[] }[];
}

export interface UndersizedTextNode {
  readonly selector: string;
  readonly fontSize: string;
  readonly text: string;
}

export interface A11yAuditResult {
  readonly violations: readonly A11yViolation[];
  readonly sub12pxFontNodes: readonly UndersizedTextNode[];
}

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

const MINIMUM_FONT_SIZE_PX = 11.9;

export class A11yAuditor {
  static async injectAxe(page: Page): Promise<void> {
    const alreadyInjected = await page.evaluate(
      () => typeof (window as unknown as { axe?: unknown }).axe !== 'undefined',
    );
    if (alreadyInjected) return;

    await page.addScriptTag({ content: axeSource });
  }

  static async auditPage(page: Page): Promise<A11yAuditResult> {
    await this.injectAxe(page);

    const axeResults = await page.evaluate(async (tags: readonly string[]) => {
      const win = window as unknown as {
        axe: { run: (doc: Document, options: unknown) => Promise<{ violations: unknown[] }> };
      };
      if (!win.axe) {
        throw new Error('Axe is not injected');
      }
      return await win.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    }, WCAG_AA_TAGS);

    const sub12pxFonts = await page.evaluate((minimumFontSize: number) => {
      const elements = Array.from(document.querySelectorAll('body *'));
      const failing: Array<{ selector: string; fontSize: string; text: string }> = [];

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const fontSizePx = parseFloat(style.fontSize);
        const hasDirectText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim().length > 0,
        );

        if (hasDirectText && fontSizePx > 0 && fontSizePx < minimumFontSize) {
          const tagName = el.tagName.toLowerCase();
          const className =
            el.className && typeof el.className === 'string'
              ? `.${el.className.split(' ').join('.')}`
              : '';
          failing.push({
            selector: `${tagName}${className}`,
            fontSize: `${fontSizePx}px`,
            text: (el.textContent || '').trim().slice(0, 40),
          });
        }
      }
      return failing;
    }, MINIMUM_FONT_SIZE_PX);

    return {
      violations: axeResults.violations as readonly A11yViolation[],
      sub12pxFontNodes: sub12pxFonts,
    };
  }

  static async assertAccessible(page: Page, contextName: string): Promise<void> {
    const result = await this.auditPage(page);
    const blocking = result.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      blocking,
      `Accessibility critical/serious violations found in ${contextName}: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([]);

    expect(
      result.sub12pxFontNodes,
      `Elements with font-size < 12px found in ${contextName}: ${JSON.stringify(result.sub12pxFontNodes, null, 2)}`,
    ).toEqual([]);
  }
}
