import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENV_FILE = 'apps/papikapi-studio/.env';

const ACCOUNT_QUERY = `query { myself {
  clientBalance
  currentSpendPerHr
  pods { id name desiredStatus costPerHr machine { gpuDisplayName } }
} }`;

function readApiKey(workspaceDir) {
  const envFile = join(workspaceDir, ENV_FILE);
  if (!existsSync(envFile)) {
    return '';
  }
  const match = readFileSync(envFile, 'utf8').match(/RUNPOD_API_KEY=([^\r\n]+)/);
  return match ? match[1].trim() : '';
}

async function queryAccount(apiKey) {
  const response = await fetch('https://api.runpod.io/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: ACCOUNT_QUERY }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`RunPod answered ${response.status}`);
  }
  const body = await response.json();
  const account = body?.data?.myself;
  if (!account) {
    throw new Error('RunPod returned no account');
  }
  return account;
}

export async function readRunPodSummary(workspaceDir) {
  const apiKey = readApiKey(workspaceDir);
  if (!apiKey) {
    return { configured: false, balance: 0, spendPerHour: 0, runningPods: [] };
  }
  const account = await queryAccount(apiKey);
  const runningPods = (account.pods ?? [])
    .filter((pod) => pod.desiredStatus === 'RUNNING')
    .map((pod) => ({
      id: pod.id,
      name: pod.name,
      gpu: pod.machine?.gpuDisplayName ?? '',
      costPerHour: Number(pod.costPerHr ?? 0),
      url: `https://console.runpod.io/pods?id=${pod.id}`,
    }));
  return {
    configured: true,
    balance: Number(account.clientBalance ?? 0),
    spendPerHour: Number(account.currentSpendPerHr ?? 0),
    runningPods,
  };
}
