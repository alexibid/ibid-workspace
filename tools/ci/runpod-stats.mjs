import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_DIR = process.cwd();
const ENV_FILE = join(WORKSPACE_DIR, 'apps/kirigami-studio/.env');

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

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('---');
    console.log('☁ RunPod: No API key found | font=Menlo color=#8b949e');
    return;
  }

  try {
    const data = await queryRunPod(
      apiKey,
      'query { myself { clientBalance endpoints { id name workersMin workersMax idleTimeout } } }'
    );

    const myself = data?.data?.myself;
    if (!myself) {
      console.log('---');
      console.log('☁ RunPod: Unavailable | font=Menlo color=#8b949e');
      return;
    }

    const balanceNum = typeof myself.clientBalance === 'number' ? myself.clientBalance : 0;
    const balanceStr = `$${balanceNum.toFixed(2)}`;
    const endpoints = Array.isArray(myself.endpoints) ? myself.endpoints : [];

    console.log('---');
    console.log(`☁ RunPod Serverless · Balance: ${balanceStr} | font=Menlo`);
    console.log(`-- 💳 Available Credits: ${balanceStr} USD | font=Menlo color=#3fb950 bash=/usr/bin/open param1="https://console.runpod.io/user/billing" terminal=false`);
    console.log('-- ⚡ Scale-to-Zero: $0.00/s when idle | font=Menlo color=#8b949e');
    console.log('-- ---');

    for (const ep of endpoints) {
      const health = await queryEndpointHealth(apiKey, ep.id);
      const workers = health?.workers;
      const initializing = workers?.initializing ? Number(workers.initializing) : 0;
      const running = workers?.running ? Number(workers.running) : 0;
      const unhealthy = workers?.unhealthy ? Number(workers.unhealthy) : 0;

      let statusIcon = '●';
      let statusColor = '#3fb950';
      let statusText = 'Ready (Idle $0.00)';

      if (unhealthy > 0) {
        statusIcon = '⚠';
        statusColor = '#f85149';
        statusText = 'Unhealthy';
      } else if (initializing > 0) {
        statusIcon = '⟳';
        statusColor = '#d29922';
        statusText = 'Initializing (Pulling image)';
      } else if (running > 0) {
        statusIcon = '⚡';
        statusColor = '#58a6ff';
        statusText = 'Running job';
      }

      const epUrl = `https://console.runpod.io/serverless/endpoint/${ep.id}`;
      const isTrellis = ep.name.includes('trellis');
      const icon = isTrellis ? '🧊' : '🎨';
      const costInfo = isTrellis
        ? '$0.00016/s (~$0.003/model)'
        : '$0.00015/s (Free on Mac M4)';

      console.log(`-- ${icon} ${ep.name}: ${statusIcon} ${statusText} | font=Menlo color=${statusColor} bash=/usr/bin/open param1="${epUrl}" terminal=false`);
      console.log(`---- 🌐 Open Endpoint on RunPod | bash=/usr/bin/open param1="${epUrl}" terminal=false`);
      console.log(`---- 💵 Compute Rate: ${costInfo} | font=Menlo`);
      console.log(`---- ⚙ Workers: Min ${ep.workersMin} / Max ${ep.workersMax} (Timeout: ${ep.idleTimeout}s) | font=Menlo color=#8b949e`);
      console.log(`---- 🔑 Endpoint ID: ${ep.id} | font=Menlo color=#8b949e`);
    }

    console.log('-- ---');
    console.log('-- ☁ RunPod Serverless Console | bash=/usr/bin/open param1="https://console.runpod.io/serverless" terminal=false');
    console.log('-- 💳 RunPod Billing & Payments | bash=/usr/bin/open param1="https://console.runpod.io/user/billing" terminal=false');
  } catch (err) {
    console.log('---');
    console.log(`☁ RunPod: Error (${String(err)}) | font=Menlo color=#f85149`);
  }
}

main();
