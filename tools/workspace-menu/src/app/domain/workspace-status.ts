export type RunnerId = 'docker' | 'mac';
export type RunnerState = 'off' | 'disconnected' | 'idle' | 'busy';
export type ProblemLevel = 'error' | 'warning';

export interface Runner {
  readonly id: RunnerId;
  readonly state: RunnerState;
  readonly installed: boolean;
}

export interface Container {
  readonly name: string;
  readonly exists: boolean;
  readonly running: boolean;
  readonly state: string;
  readonly health: string;
}

export interface DockerStatus {
  readonly running: boolean;
  readonly containers: readonly Container[];
}

export interface FailedJob {
  readonly name: string;
  readonly step: string;
  readonly url: string;
}

export interface PipelineRun {
  readonly id: number;
  readonly workflow: string;
  readonly title: string;
  readonly branch: string;
  readonly status: string;
  readonly conclusion: string;
  readonly url: string;
  readonly startedAt: string;
  readonly failedJob?: FailedJob;
}

export interface PullRequest {
  readonly repository: string;
  readonly number: number;
  readonly title: string;
  readonly url: string;
  readonly draft: boolean;
}

export interface RunningPod {
  readonly id: string;
  readonly name: string;
  readonly gpu: string;
  readonly costPerHour: number;
  readonly url: string;
}

export interface PodsSummary {
  readonly configured: boolean;
  readonly balance: number;
  readonly spendPerHour: number;
  readonly runningPods: readonly RunningPod[];
}

export interface Problem {
  readonly id: string;
  readonly level: ProblemLevel;
  readonly title: string;
  readonly detail?: string;
  readonly action?: string;
  readonly url?: string;
}

export interface WorkspaceStatus {
  readonly checkedAt: string;
  readonly online: boolean;
  readonly docker: DockerStatus;
  readonly runners: readonly Runner[];
  readonly pipeline: readonly PipelineRun[];
  readonly pullRequests: readonly PullRequest[];
  readonly pods: PodsSummary;
  readonly problems: readonly Problem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return (
    isRecord(value) &&
    typeof value['checkedAt'] === 'string' &&
    typeof value['online'] === 'boolean' &&
    isRecord(value['docker']) &&
    isRecord(value['pods']) &&
    Array.isArray(value['runners']) &&
    Array.isArray(value['pipeline']) &&
    Array.isArray(value['pullRequests']) &&
    Array.isArray(value['problems'])
  );
}
