const ciPipeline = {
  title: 'CI · quality gate',
  groups: [
    { id: 'verify', label: 'Verify', jobs: [{ id: 'verify', label: 'Static, tests and build' }] },
    { id: 'journeys', label: 'Journeys', jobs: [{ id: 'journeys', label: 'E2E and accessibility' }] },
  ],
  flow: [['verify', 'journeys']],
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
        { id: 'desktop', label: 'Desktop macOS' },
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
