const TIERS = [
  { id: 't0', name: 'lint', targets: ['lint'] },
  { id: 't1', name: 'test', targets: ['test'] },
  { id: 't2', name: 'build', targets: ['build'] },
  { id: 't3', name: 'e2e', targets: ['e2e', 'test-a11y'], serial: true },
];

const FAST_TIERS = ['t0', 't1', 't2'];
const DEFAULT_PARALLEL = 3;

export function parseOptions(argv) {
  const flags = toFlagMap(argv);
  const requested = flags.tier ?? flags.tiers;

  return {
    projects: splitList(flags.project ?? flags.projects),
    everyProject: has(flags, 'all'),
    base: flags.base,
    tiers: resolveTiers(requested, has(flags, 'e2e')),
    stopOnFailure: !has(flags, 'full'),
    parallel: Number(flags.parallel ?? DEFAULT_PARALLEL),
  };
}

export function describeScope({ projects, everyProject }) {
  if (projects.length > 0) return projects.join(', ');
  return everyProject ? 'all projects' : 'affected';
}

function resolveTiers(requested, includeBrowserTier) {
  if (!requested) {
    return TIERS.filter((tier) => FAST_TIERS.includes(tier.id) || includeBrowserTier);
  }

  const wanted = splitList(requested);
  const matched = TIERS.filter((tier) => wanted.includes(tier.id) || wanted.includes(tier.name));

  if (matched.length === 0) throw new Error(`Unknown tier: ${requested}`);
  return matched;
}

function toFlagMap(argv) {
  return Object.fromEntries(
    argv
      .filter((argument) => argument.startsWith('--'))
      .map((argument) => {
        const [name, ...rest] = argument.slice(2).split('=');
        return [name, rest.length === 0 ? true : rest.join('=')];
      })
  );
}

function splitList(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function has(flags, name) {
  return flags[name] === true;
}
