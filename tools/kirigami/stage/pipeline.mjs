import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blenderBinary, STUDIO_RESOURCES, WORKSPACE_ROOT } from '../mcp/paths.mjs';

const APPLY_STAGE_SCRIPT = join(WORKSPACE_ROOT, 'tools', 'kirigami', 'stage', 'apply_stage.py');
const DEFAULT_BLEND = join(
  STUDIO_RESOURCES,
  'baby-broncosaurus-v3',
  'model_construct.blend'
);

const VALIDATED_STAGES = [
  { id: 0, label: 'Stage 0: Bounding Box & Clean Cutouts' },
  { id: 1, label: 'Stage 1: Face Extrusions & Mold Merge' },
  { id: 2, label: 'Stage 2: Orthogonal Raycast Tubes & Collisions' },
  { id: 3, label: 'Stage 3: Quadrant Collisions & Spheres' },
  { id: 4, label: 'Stage 4: Snapped Reconstructed Mesh' }
];

function executeStage(binary, blendPath, stageId, label) {
  const started = Date.now();
  console.log(`▶ Executing ${label}...`);
  execFileSync(
    binary,
    [
      '--background',
      blendPath,
      '--python',
      APPLY_STAGE_SCRIPT,
      '--',
      String(stageId),
      blendPath
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`✔ ${label} applied in ${elapsed}s`);
}

function run() {
  const args = process.argv.slice(2);
  const blendPath = args[1] ? resolve(process.cwd(), args[1]) : DEFAULT_BLEND;

  if (!existsSync(blendPath)) {
    console.error(`Blend file not found: ${blendPath}`);
    process.exit(1);
  }

  const binary = blenderBinary();
  const target = args[0];

  if (target !== undefined && target !== 'all' && target !== 'pipeline') {
    const stageId = Number.parseInt(target, 10);
    const stageInfo = VALIDATED_STAGES.find((s) => s.id === stageId) ?? {
      id: stageId,
      label: `Stage ${stageId}`
    };
    executeStage(binary, blendPath, stageInfo.id, stageInfo.label);
    console.log(`\nSingle stage ${stageId} completed on ${blendPath}`);
    return;
  }

  console.log(`=== Running Kirigami Construction Pipeline on ${blendPath} ===\n`);
  for (const stage of VALIDATED_STAGES) {
    executeStage(binary, blendPath, stage.id, stage.label);
  }
  console.log(`\n=== Pipeline successfully finished across ${VALIDATED_STAGES.length} stage(s) ===`);
}

run();
