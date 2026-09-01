import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import type { StorybookConfig } from '@storybook/angular-vite';

const ADDONS = [
  '@chromatic-com/storybook',
  '@storybook/addon-vitest',
  '@storybook/addon-a11y',
  '@storybook/addon-docs',
  '@storybook/addon-onboarding',
  '@storybook/addon-mcp',
];

const DESIGN_SYSTEM_ASSETS = 'libs/ibid-ui/assets';

function viteAliasesFromTsconfig(projectRoot: string): Record<string, string> {
  const tsconfigPath = resolve(projectRoot, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) return {};

  const { config } = ts.parseConfigFileTextToJson(
    tsconfigPath,
    readFileSync(tsconfigPath, 'utf8'),
  );

  const paths: Record<string, string[]> = config?.compilerOptions?.paths ?? {};
  const aliases: Record<string, string> = {};

  for (const [pattern, targets] of Object.entries(paths)) {
    const target = targets[0];
    if (!target) continue;
    aliases[pattern.replace(/\/\*$/, '')] = resolve(projectRoot, target.replace(/\/\*$/, ''));
  }

  return aliases;
}

const DESIGN_SYSTEM_REF = {
  title: 'Design system',
  url: process.env['IBID_DESIGN_SYSTEM_STORYBOOK_URL'] ?? 'http://localhost:6006',
  expanded: false
};

export interface StorybookProjectOptions {
  readonly workspaceRoot?: string;
  readonly extraAliases?: Readonly<Record<string, string>>;
  readonly composeDesignSystem?: boolean;
  readonly extraStoryRoots?: readonly string[];
}

export function createStorybookConfig(
  configDirUrl: string,
  options?: StorybookProjectOptions,
): StorybookConfig {
  const projectRoot = resolve(dirname(fileURLToPath(configDirUrl)), '..');
  const workspaceRoot = options?.workspaceRoot ?? resolve(projectRoot, '../..');

  const staticDirs = [resolve(workspaceRoot, DESIGN_SYSTEM_ASSETS)];
  const publicDir = resolve(projectRoot, 'public');
  if (existsSync(publicDir)) staticDirs.unshift(publicDir);

  return {
    addons: ADDONS,
    refs: options?.composeDesignSystem ? { 'design-system': DESIGN_SYSTEM_REF } : {},
    framework: {
      name: '@storybook/angular-vite',
      options: {
        compodoc: true,
        compodocArgs: ['-e', 'json', '-d', projectRoot],
      },
    },
    stories: [projectRoot, ...(options?.extraStoryRoots ?? []).map((r) => resolve(workspaceRoot, r))]
      .flatMap((root) => [
        `${root}/src/**/*.mdx`,
        `${root}/src/**/*.stories.@(js|jsx|mjs|ts|tsx)`
      ]),
    staticDirs,
    viteFinal: async (viteConfig) => {
      viteConfig.css ??= {};
      viteConfig.css.preprocessorOptions ??= {};
      viteConfig.css.preprocessorOptions['scss'] = {
        ...(viteConfig.css.preprocessorOptions['scss'] ?? {}),
        loadPaths: [workspaceRoot],
      };

      viteConfig.resolve ??= {};
      viteConfig.resolve.alias = {
        ...(viteConfig.resolve.alias ?? {}),
        ...viteAliasesFromTsconfig(projectRoot),
        ...(options?.extraAliases ?? {}),
      };
      return viteConfig;
    },
  };
}
