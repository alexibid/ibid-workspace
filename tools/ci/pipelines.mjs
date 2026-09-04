const ciPipeline = {
  title: 'CI · quality gate',
  groups: [
    { id: 'setup', label: 'Setup', jobs: [{ id: 'scope', label: 'Affected scope' }] },
    {
      id: 'static',
      label: 'Static analysis',
      jobs: [
        { id: 'lint', label: 'Lint' },
        { id: 'typecheck', label: 'Types' },
      ],
    },
    { id: 'tests', label: 'Tests', jobs: [{ id: 'unit', label: 'Unit' }] },
    { id: 'build', label: 'Build', jobs: [{ id: 'build', label: 'Apps and libraries' }] },
    {
      id: 'journeys',
      label: 'Journeys',
      jobs: [
        { id: 'e2e', label: 'E2E' },
        { id: 'a11y', label: 'Accessibility' },
      ],
    },
  ],
  flow: [
    ['setup', 'static'],
    ['setup', 'tests'],
    ['setup', 'build'],
    ['build', 'journeys'],
  ],
};

const releasePipeline = {
  title: 'Release · delivery',
  groups: [
    { id: 'inspect', label: 'Inspect', jobs: [{ id: 'inspect', label: 'Tag and target' }] },
    {
      id: 'package',
      label: 'Package',
      jobs: [
        { id: 'web', label: 'Web bundle' },
        { id: 'android', label: 'Android APK' },
        { id: 'desktop', label: 'Desktop installers' },
      ],
    },
    {
      id: 'deliver',
      label: 'Deliver',
      jobs: [
        { id: 'drive', label: 'Google Drive' },
        { id: 'hosting', label: 'Firebase Hosting' },
      ],
    },
  ],
  flow: [
    ['inspect', 'package'],
    ['package', 'deliver'],
  ],
};

export const PIPELINES = { ci: ciPipeline, release: releasePipeline };

export function readPipeline(name) {
  const pipeline = PIPELINES[name];
  if (!pipeline) throw new Error(`Unknown pipeline: ${name}`);
  return pipeline;
}
