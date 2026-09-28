import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_DIR = process.cwd();
const ENV_FILE = join(WORKSPACE_DIR, 'apps/kirigami-studio/.env');
const CONSOLE_URL = 'https://console.runpod.io';
const SSH_KEY_PATH = '~/.ssh/id_ed25519';
const MUTED = 'font=Menlo color=#8b949e';

const ACCOUNT_QUERY = `query { myself {
  clientBalance
  currentSpendPerHr
  endpoints { id name workersMin workersMax idleTimeout }
  pods {
    id name desiredStatus costPerHr
    machine { gpuDisplayName }
    runtime { uptimeInSeconds ports { ip isIpPublic privatePort publicPort } }
  }
} }`;

function getApiKey() {
  if (!existsSync(ENV_FILE)) {
    return '';
  }
  const content = readFileSync(ENV_FILE, 'utf8');
  const match = content.match(/RUNPOD_API_KEY=([^\r\n]+)/);
  return match ? match[1].trim() : '';
}

async function queryRunPod(apiKey, query) {
  const res = await fetch('https://api.runpod.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL failed: ${res.status}`);
  }
  return res.json();
}

async function queryEndpointHealth(apiKey, endpointId) {
  try {
    const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/health`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

function formatUsd(amount) {
  return `$${amount.toFixed(2)}`;
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
}

function isPodRunning(pod) {
  return pod.desiredStatus === 'RUNNING';
}

function findSshCommand(pod) {
  const ports = pod.runtime?.ports ?? [];
  const sshPort = ports.find((port) => port.privatePort === 22 && port.isIpPublic);
  return sshPort ? `ssh root@${sshPort.ip} -p ${sshPort.publicPort} -i ${SSH_KEY_PATH}` : '';
}

function describeEndpointStatus(endpoint, health) {
  const workers = health?.workers;
  if (endpoint.workersMax === 0) {
    return { icon: '⏸', color: '#8b949e', text: 'Disabled (Max 0)' };
  }
  if (Number(workers?.unhealthy ?? 0) > 0) {
    return { icon: '⚠', color: '#f85149', text: 'Unhealthy' };
  }
  if (Number(workers?.initializing ?? 0) > 0) {
    return { icon: '⟳', color: '#d29922', text: 'Initializing (Pulling image)' };
  }
  if (Number(workers?.running ?? 0) > 0) {
    return { icon: '⚡', color: '#58a6ff', text: 'Running job' };
  }
  return { icon: '●', color: '#3fb950', text: 'Ready (Idle $0.00)' };
}

function printAccountHeader(myself) {
  const balance = formatUsd(Number(myself.clientBalance ?? 0));
  const spendPerHr = Number(myself.currentSpendPerHr ?? 0);
  const spendColor = spendPerHr > 0 ? '#f85149' : '#3fb950';

  console.log('---');
  console.log(`☁ RunPod · Balance ${balance} · Spend ${formatUsd(spendPerHr)}/h | font=Menlo color=${spendColor}`);
  console.log(`-- 💳 Available Credits: ${balance} USD | font=Menlo color=#3fb950 bash=/usr/bin/open param1="${CONSOLE_URL}/user/billing" terminal=false`);
  console.log(`-- 🔥 Current Spend: ${formatUsd(spendPerHr)}/h | font=Menlo color=${spendColor}`);
  console.log('-- ---');
}

function printPod(pod) {
  const running = isPodRunning(pod);
  const uptime = pod.runtime?.uptimeInSeconds ?? 0;
  const gpu = pod.machine?.gpuDisplayName ?? 'GPU';
  const podUrl = `${CONSOLE_URL}/pods?id=${pod.id}`;
  const sshCommand = findSshCommand(pod);
  const detail = running
    ? `RUNNING · ${formatUptime(uptime)} · ~${formatUsd((uptime / 3600) * pod.costPerHr)}`
    : `${pod.desiredStatus} · disk still billed`;
  const color = running ? '#d29922' : '#8b949e';

  console.log(`-- ${running ? '🟠' : '⚪'} ${pod.name} · ${gpu} · ${detail} | font=Menlo color=${color}`);
  console.log(`---- 🌐 Open Pod on RunPod | bash=/usr/bin/open param1="${podUrl}" terminal=false`);
  if (sshCommand) {
    console.log(`---- 📋 Copy SSH: ${sshCommand} | font=Menlo bash=/bin/bash param1=-c param2="printf %s '${sshCommand}' | pbcopy" terminal=false`);
  }
  console.log(`---- 💵 GPU Rate while running: ${formatUsd(pod.costPerHr)}/h | ${MUTED}`);
  console.log(`---- 🔑 Pod ID: ${pod.id} | ${MUTED}`);
}

function printPods(pods) {
  const runningPods = pods.filter(isPodRunning);
  const podsSpend = runningPods.reduce((total, pod) => total + pod.costPerHr, 0);

  if (pods.length === 0) {
    console.log(`-- 🖥 Pods · 0 running · none | ${MUTED}`);
    console.log('-- ---');
    return;
  }

  const summaryColor = runningPods.length > 0 ? '#f85149' : '#8b949e';
  console.log(`-- 🖥 Pods · ${runningPods.length} running · ${formatUsd(podsSpend)}/h | font=Menlo color=${summaryColor} bash=/usr/bin/open param1="${CONSOLE_URL}/pods" terminal=false`);
  pods.forEach(printPod);
  console.log('-- ---');
}

async function printEndpoint(apiKey, endpoint) {
  const health = await queryEndpointHealth(apiKey, endpoint.id);
  const status = describeEndpointStatus(endpoint, health);
  const endpointUrl = `${CONSOLE_URL}/serverless/endpoint/${endpoint.id}`;
  const isTrellis = endpoint.name.includes('trellis');
  const icon = isTrellis ? '🧊' : '🎨';
  const costInfo = isTrellis ? '$0.00031/s (~$0.04/model)' : '$0.00015/s (Free on Mac M4)';

  console.log(`-- ${icon} ${endpoint.name}: ${status.icon} ${status.text} | font=Menlo color=${status.color} bash=/usr/bin/open param1="${endpointUrl}" terminal=false`);
  console.log(`---- 🌐 Open Endpoint on RunPod | bash=/usr/bin/open param1="${endpointUrl}" terminal=false`);
  console.log(`---- 💵 Compute Rate: ${costInfo} | font=Menlo`);
  console.log(`---- ⚙ Workers: Min ${endpoint.workersMin} / Max ${endpoint.workersMax} (Timeout: ${endpoint.idleTimeout}s) | ${MUTED}`);
  console.log(`---- 🔑 Endpoint ID: ${endpoint.id} | ${MUTED}`);
}

function printConsoleLinks() {
  console.log('-- ---');
  console.log(`-- 🖥 RunPod Pods Console | bash=/usr/bin/open param1="${CONSOLE_URL}/pods" terminal=false`);
  console.log(`-- ☁ RunPod Serverless Console | bash=/usr/bin/open param1="${CONSOLE_URL}/serverless" terminal=false`);
  console.log(`-- 💳 RunPod Billing & Payments | bash=/usr/bin/open param1="${CONSOLE_URL}/user/billing" terminal=false`);
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('---');
    console.log(`☁ RunPod: No API key found | ${MUTED}`);
    return;
  }

  try {
    const data = await queryRunPod(apiKey, ACCOUNT_QUERY);
    const myself = data?.data?.myself;
    if (!myself) {
      console.log('---');
      console.log(`☁ RunPod: Unavailable | ${MUTED}`);
      return;
    }

    printAccountHeader(myself);
    printPods(myself.pods ?? []);
    for (const endpoint of myself.endpoints ?? []) {
      await printEndpoint(apiKey, endpoint);
    }
    printConsoleLinks();
  } catch (err) {
    console.log('---');
    console.log(`☁ RunPod: Error (${String(err)}) | font=Menlo color=#f85149`);
  }
}

main();
