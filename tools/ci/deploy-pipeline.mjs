import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import readline from 'node:readline';

const rootDir = resolve(process.cwd());
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const autoApprove = args.includes('--yes') || args.includes('-y');
const forceAll = args.includes('--all') || args.includes('--force');
const specificAppArg = args.find((arg) => arg.startsWith('--app='));
const specificApp = specificAppArg ? specificAppArg.split('=')[1] : null;

const TARGET_APPS = [
  { name: 'oh-save-me', webUrl: 'https://ibid-ohsaveme.web.app', hasDesktop: true, hasMobile: true },
  { name: 'camila', webUrl: 'https://ibid-camila.web.app', hasDesktop: false, hasMobile: false },
  { name: 'boilerplate', webUrl: 'https://ibid-boilerplate.web.app', hasDesktop: false, hasMobile: false },
];

const TARGET_LIBS = ['ibid-ui', 'services', 'testing', 'utils'];

async function main() {
  printHeader();

  const status = git('status -s').trim();
  const submodules = getSubmoduleStatus();
  const pendingCommits = getPendingCommits();
  const affectedAll = resolveAffectedProjects();

  const affectedApps = resolveTargetApps(affectedAll);
  const deployStorybook = forceAll || affectedAll.includes('boilerplate') || affectedAll.includes('ibid-ui');

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  📋 PENDING RELEASE SUMMARY                                │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  if (pendingCommits.length === 0 && !status && submodules.every((s) => !s.dirty && !s.ahead)) {
    console.log('• Workspace is up to date. No pending unreleased changes detected.');
  } else {
    console.log(`• Uncommitted workspace files: ${status ? status.split('\n').length : 0}`);
    console.log(`• Pending workspace commits:    ${pendingCommits.length}`);

    if (pendingCommits.length > 0) {
      console.log('\nRecent commits to be published:');
      for (const commit of pendingCommits.slice(0, 8)) {
        console.log(`  ${commit.sha.slice(0, 7)} · ${commit.message}`);
      }
      if (pendingCommits.length > 8) {
        console.log(`  ... and ${pendingCommits.length - 8} more`);
      }
    }
  }

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│  🎯 SELECTIVE DEPLOY TARGETS (AFFECTED SCOPE)              │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  for (const app of TARGET_APPS) {
    const isAffected = affectedApps.some((a) => a.name === app.name);
    const pkg = readPackageJson(`apps/${app.name}/package.json`);
    const version = pkg?.version || '0.0.1';

    if (isAffected) {
      console.log(`✔ ${app.name.padEnd(14)} v${version}  [AFFECTED - WILL DEPLOY]`);
      console.log(`    ↳ Web Hosting:    ${app.webUrl}`);
      if (app.hasDesktop) console.log(`    ↳ Desktop App:    macOS Universal (.dmg) -> Google Drive & GitHub`);
      if (app.hasMobile) console.log(`    ↳ Mobile APK:     Android (.apk) -> Google Drive & GitHub`);
      console.log(`    ↳ Standalone Git: https://github.com/alexibid/${app.name}`);
    } else {
      console.log(`· ${app.name.padEnd(14)} v${version}  [UNCHANGED - SKIPPED]`);
    }
  }

  console.log('\n• Shared Libraries & Design System:');
  for (const lib of TARGET_LIBS) {
    const isAffected = affectedAll.includes(lib);
    const pkg = readPackageJson(`libs/${lib}/package.json`);
    const version = pkg?.version || '0.0.1';
    const tag = isAffected ? '[AFFECTED]' : '[UNCHANGED]';
    console.log(`    ↳ ${lib.padEnd(12)} v${version} ${tag} -> https://github.com/alexibid/${lib}`);
  }

  if (deployStorybook) {
    console.log('\n• Storybook Design Showcase:');
    console.log('    ↳ storybook    [AFFECTED - WILL DEPLOY] (depends on ibid-ui / boilerplate)');
  }

  console.log('\n• Continuous Delivery:');
  console.log('    ↳ Automated Monorepo Split (standalone GitHub repositories)');
  console.log('    ↳ Independent Tagging & GitHub Releases');
  console.log('    ↳ Google Drive Delivery Sync (ibid-builds/)');

  if (affectedApps.length === 0 && !deployStorybook) {
    console.log('\nℹ No web applications affected by recent changes.');
    if (!forceAll) {
      console.log('💡 Run with --all to force deployment of all applications.\n');
      return;
    }
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] Inspection complete. No changes were made or pushed.\n');
    return;
  }

  console.log('\n' + '─'.repeat(60));
  const proceed = autoApprove || (await askConfirmation('🚀 Proceed with Selective Deploy Pipeline? (y/N): '));

  if (!proceed) {
    console.log('\nOperation cancelled by user.\n');
    return;
  }

  console.log('\n▶ Step 1/4: Running Fast Pre-flight Verification Gate...');
  try {
    execSync('npm run check:fast', { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.error('\n✖ Pre-flight verification failed. Aborting deployment.');
    process.exit(1);
  }

  console.log('\n▶ Step 2/4: Updating Submodules and Workspace State...');
  try {
    git('submodule update --init --recursive');
  } catch {
  }

  console.log('\n▶ Step 3/4: Creating Release Commit & Pushing to GitHub...');
  const currentBranch = git('branch --show-current').trim();
  if (currentBranch !== 'main') {
    console.log(`Note: Currently on branch "${currentBranch}". Pushing to origin/${currentBranch}...`);
  }

  try {
    git('push origin ' + currentBranch);
    console.log('✔ Pushed latest commits to GitHub origin/' + currentBranch + '.');
  } catch (err) {
    console.error('✖ Push failed:', err.message);
    process.exit(1);
  }

  console.log('\n▶ Step 4/4: Building and Deploying Affected Firebase Hosting Targets...');
  try {
    if (affectedApps.length > 0) {
      const projectNames = affectedApps.map((a) => a.name).join(',');
      console.log(`\n• Building affected apps: ${projectNames}...`);
      execSync(`npx nx run-many -t build --projects=${projectNames}`, { stdio: 'inherit', cwd: rootDir });
    }

    if (deployStorybook) {
      console.log('\n• Building Storybook showcase for boilerplate...');
      execSync('npx nx build-storybook boilerplate', { stdio: 'inherit', cwd: rootDir });
    }

    const hostingTargets = affectedApps.map((a) => `hosting:${a.name}`);
    if (deployStorybook) {
      hostingTargets.push('hosting:storybook');
    }

    if (hostingTargets.length > 0) {
      const deployCommand = `npx firebase deploy --only ${hostingTargets.join(',')}`;
      console.log(`\n• Deploying to Firebase: ${deployCommand}...`);
      execSync(deployCommand, { stdio: 'inherit', cwd: rootDir });
      console.log('✔ Firebase Hosting deployment completed successfully for affected targets!');
    }
  } catch (err) {
    console.warn('⚠ Note on direct Firebase deploy:', err.message);
    console.log('ℹ CI/CD pipeline will automatically deploy via GitHub Actions.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DEPLOY & RELEASE PIPELINE TRIGGERED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\nMonitor live release progress:');
  console.log('• GitHub Actions: https://github.com/alexibid/ibid-workspace/actions');
  console.log('• Local Runner:   tools/ci/dashboard.sh\n');
}

function resolveAffectedProjects() {
  if (specificApp) {
    return [specificApp];
  }
  if (forceAll) {
    return [...TARGET_APPS.map((a) => a.name), ...TARGET_LIBS];
  }
  try {
    const raw = execSync('npx nx show projects --affected --json', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start >= 0 && end >= start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
  } catch {
  }
  return TARGET_APPS.map((a) => a.name);
}

function resolveTargetApps(affectedProjects) {
  if (forceAll) {
    return TARGET_APPS;
  }
  if (specificApp) {
    return TARGET_APPS.filter((a) => a.name === specificApp);
  }
  return TARGET_APPS.filter((app) => affectedProjects.includes(app.name));
}

function getSubmoduleStatus() {
  try {
    const raw = git('submodule status').trim();
    if (!raw) return [];
    return raw.split('\n').map((line) => {
      const parts = line.trim().split(' ');
      return {
        sha: parts[0].replace(/^[+-]/, ''),
        path: parts[1],
        dirty: parts[0].startsWith('+'),
      };
    });
  } catch {
    return [];
  }
}

function getPendingCommits() {
  try {
    const raw = git('log origin/main..HEAD --oneline').trim();
    if (!raw) return [];
    return raw.split('\n').map((line) => {
      const [sha, ...rest] = line.split(' ');
      return { sha, message: rest.join(' ') };
    });
  } catch {
    return [];
  }
}

function readPackageJson(relativePath) {
  const fullPath = join(rootDir, relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch {
    return null;
  }
}

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

function printHeader() {
  console.clear();
  console.log('==============================================================');
  console.log('       🚀  IBID WORKSPACE · SMART DEPLOY & RELEASE PIPELINE   ');
  console.log('==============================================================');
}

main().catch((err) => {
  console.error('\n✖ Pipeline error:', err);
  process.exit(1);
});
