import { basename, dirname } from 'node:path';

const AGENT_ARTIFACTS = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.agents/',
  '.claude/',
  '.codex/',
  '.cursor/',
  '.gemini/',
  '.opencode/',
  'opencode.json',
];

const BUILD_OUTPUT = ['dist', 'tmp', 'out-tsc', 'node_modules', '*.tsbuildinfo'];

const EDITOR_STATE = [
  '/.idea',
  '.vscode/*',
  '!.vscode/settings.json',
  '!.vscode/tasks.json',
  '!.vscode/launch.json',
  '!.vscode/extensions.json',
];

const OPERATING_SYSTEM = ['.DS_Store', 'Thumbs.db'];

const TOOLCHAIN_CACHE = ['.nx/', '.angular', 'vitest.config.*.timestamp*'];

const ENVIRONMENT_SECRETS = [
  '.env',
  '.env.production',
  '.env.development',
  '.env.local',
  '.env.*.local',
  '!.env.example',
];

const TEST_ARTIFACTS = [
  'test-results/',
  '.playwright-artifacts/',
  'playwright-report/',
  'playwright/.cache/',
  '.auth/',
  'user-data/',
  'coverage/',
];

const STORYBOOK_ARTIFACTS = ['storybook-static', 'documentation.json'];

const HOSTING_STATE = ['.firebase/'];

const USER_DATA_DROP_ZONES = ['uploads/*', '!uploads/.gitkeep', 'imports/*', '!imports/.gitkeep'];

const NATIVE_PLATFORM_OUTPUT = [
  'platforms/dist/',
  'platforms/mobile/node_modules/',
  'platforms/desktop/src-tauri/target/',
  'platforms/mobile/android/.gradle/',
  'platforms/mobile/android/build/',
  'platforms/mobile/android/app/build/',
  'platforms/mobile/android/local.properties',
  'platforms/mobile/android/app/local.properties',
  'platforms/mobile/android/app/src/main/assets/public/',
  'platforms/mobile/ios/Pods/',
  'platforms/mobile/ios/build/',
  'platforms/mobile/ios/.symlinks/',
  'platforms/mobile/ios/App/public/',
];

const LOG_OUTPUT = ['*.log'];

const APPLICATIONS_DIRECTORY = 'apps';

export function buildPackageGitignore(packagePath) {
  const blocks = [
    AGENT_ARTIFACTS,
    BUILD_OUTPUT,
    EDITOR_STATE,
    OPERATING_SYSTEM,
    TOOLCHAIN_CACHE,
    ENVIRONMENT_SECRETS,
    TEST_ARTIFACTS,
    STORYBOOK_ARTIFACTS,
    ...applicationBlocks(packagePath),
    LOG_OUTPUT,
  ];

  return `${blocks.map((block) => block.join('\n')).join('\n\n')}\n`;
}

function applicationBlocks(packagePath) {
  if (!isApplication(packagePath)) return [];

  return [HOSTING_STATE, USER_DATA_DROP_ZONES, NATIVE_PLATFORM_OUTPUT];
}

function isApplication(packagePath) {
  return basename(dirname(packagePath)) === APPLICATIONS_DIRECTORY;
}
