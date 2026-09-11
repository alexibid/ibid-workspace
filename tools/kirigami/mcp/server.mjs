import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import * as actions from './actions.mjs';

const server = new McpServer({ name: 'kirigami-blender', version: '1.0.0' });

const jobShape = {
  id: z.string().describe('Slug identifying the job, lowercase letters, digits and hyphens'),
  title: z.string().optional().describe('Human readable name of the model'),
  tier: z.enum(['tier-1', 'tier-2', 'tier-3', 'tier-4']).describe('Dexterity tier to build for'),
  script: z.string().describe('Python source exposing def build(studio) against the studio API'),
  page: z
    .object({
      preset: z.enum(['A4', 'A3', 'US_LETTER', 'US_LEGAL']).default('A4'),
      marginMm: z.number().min(0).max(30).default(5),
      tabStyle: z.enum(['STICKER', 'NONE']).default('STICKER'),
      numberStyle: z.enum(['INSIDE', 'OUTSIDE', 'NONE']).default('INSIDE'),
    })
    .optional(),
  timeoutMs: z.number().int().min(10_000).max(900_000).optional(),
};

register('kirigami_environment', {
  title: 'Probe the local Blender',
  description:
    'Reports the Blender binary this server drives, its version, whether the Export Paper Model '
    + 'extension is installed, and where jobs and published models are written. Call it once '
    + 'before the first build.',
}, () => actions.environment());

register('kirigami_tiers', {
  title: 'Read the tier contracts',
  description:
    'Returns the four dexterity tiers with the solids each one allows, its part and face '
    + 'ceilings, the minimum feature a child of that age can cut, and its palette. This is the '
    + 'authoritative budget the modeller writes against.',
}, () => actions.tiers());

register('kirigami_validate', {
  title: 'Build and check a model without exporting',
  description:
    'Runs the model script in headless Blender, welds every part with an EXACT boolean and '
    + 'reports the offender tally. Exports nothing, so it is the fast loop while the geometry '
    + 'is still moving.',
  inputSchema: jobShape,
}, (request) => actions.validate(request));

register('kirigami_preflight', {
  title: 'Check the geometry before it costs a full run',
  description:
    'Builds the solids, refuses any weld chain that would leave a loose shell or graze the '
    + 'mirror plane, and reports every solid bounding box, the overlap islands, the stance '
    + '(footprint, centre of mass, tipping margin) and the model proportions against the '
    + 'bands measured from the reference kits. Skips the bake, the unfolding and the export, '
    + 'so it costs seconds. Run it before kirigami_build, every time.',
  inputSchema: {
    ...jobShape,
    family: z.enum(['sitting-animal', 'quadruped', 'bird', 'tree', 'vehicle']).optional(),
  },
}, (request) => actions.preflight(request));

register('kirigami_build', {
  title: 'Build, check, unfold and export',
  description:
    'The full run. Welds the parts, refuses any mesh carrying offenders, then unfolds every part '
    + 'into its own print-ready PDF net and exports one GLB for the three.js viewer. Returns the '
    + 'path of every PDF.',
  inputSchema: jobShape,
}, (request) => actions.build(request));

register('kirigami_job', {
  title: 'Read one job back',
  description: 'Returns the manifest and the model script of a job that has already run.',
  inputSchema: { id: z.string() },
}, ({ id }) => actions.job(id));

register('kirigami_jobs', {
  title: 'List the jobs on this machine',
  description: 'Every job run by this server, newest first, with its state and tier.',
}, () => actions.jobs());

register('kirigami_runs', {
  title: 'Read the run history and the pace',
  description:
    'Every run this machine has done, newest first, with its mode, duration, outcome and '
    + 'face count, plus the median seconds per mode. Use it to compare variants after the '
    + 'fact and to know what a round trip actually costs instead of guessing.',
  inputSchema: { id: z.string().optional() },
}, ({ id }) => actions.runs(id));

register('kirigami_publish', {
  title: 'Publish a model onto a shelf',
  description:
    'Copies a finished job into the studio, defaulting to the draft shelf. The published '
    + 'folder carries the model script, the GLB, and every PDF and SVG net, so a draft can be '
    + 'reproduced and inspected. The three.js viewer shows draft and ready on separate tabs.',
  inputSchema: { id: z.string(), stage: z.enum(['draft', 'ready', 'backup']).optional() },
}, ({ id }) => actions.publishJob(id));

register('kirigami_approve', {
  title: 'Move a draft onto the ready shelf',
  description:
    'Promotes a draft to ready once it has been judged good enough to print. Moves the whole '
    + 'folder, so a model is only ever on one shelf.',
  inputSchema: { id: z.string() },
}, ({ id }) => actions.approveJob(id));

register('kirigami_learn', {
  title: 'Record what went wrong and what fixed it',
  description:
    'Appends one lesson to the durable ledger. Call it every time a run fails and you work '
    + 'out why: the diagnosis and the remedy are what later runs read instead of repeating '
    + 'the mistake. A lesson without both is refused.',
  inputSchema: {
    id: z.string(),
    tier: z.enum(['tier-1', 'tier-2', 'tier-3', 'tier-4']),
    subject: z.string().describe('What was being built, e.g. "sitting fox"'),
    stage: z.enum(['build', 'validate', 'unfold', 'preview', 'shape']),
    offenders: z.record(z.string(), z.number()).optional(),
    diagnosis: z.string().describe('Why it went wrong, in one or two sentences'),
    remedy: z.string().describe('What changed to fix it, concretely'),
  },
}, (entry) => actions.learn(entry));

register('kirigami_lessons', {
  title: 'Read the lessons that apply here',
  description:
    'Returns past failures narrowed to a tier, a subject or a stage, so a run loads only the '
    + 'mistakes that could bite it rather than the whole history. Call it before writing the '
    + 'first model script.',
  inputSchema: {
    tier: z.enum(['tier-1', 'tier-2', 'tier-3', 'tier-4']).optional(),
    subject: z.string().optional(),
    stage: z.enum(['build', 'validate', 'unfold', 'preview', 'shape']).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
}, (filter) => actions.recall(filter));

register('kirigami_catalogue', {
  title: 'Read the studio gallery',
  description: 'The models published to Kirigami Studio, optionally narrowed to one shelf.',
  inputSchema: { stage: z.enum(['draft', 'ready', 'backup']).optional() },
}, ({ stage }) => actions.catalogue(stage));

register('kirigami_reindex', {
  title: 'Rebuild the gallery from what is on the shelves',
  description:
    'Walks every shelf folder and rewrites gallery.json from the manifests it finds, newest '
    + 'first. Run it whenever model folders were moved, restored or deleted by hand, because '
    + 'the studio page reads the gallery and shows nothing when the two disagree.',
}, () => actions.reindex());

register('kirigami_unpublish', {
  title: 'Remove a model from the studio gallery',
  description: 'Drops one model from the gallery index without deleting its job artifacts.',
  inputSchema: { id: z.string() },
}, ({ id }) => actions.unpublish(id));

function register(name, config, handler) {
  server.registerTool(name, config, async (args) => {
    try {
      return asContent(await handler(args ?? {}));
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: describe(error) }] };
    }
  });
}

function asContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function describe(error) {
  const detail = error.detail ? `\n\n${error.detail}` : '';
  return `${error.name}: ${error.message}${detail}`;
}

await server.connect(new StdioServerTransport());
