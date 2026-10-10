import * as vscode from 'vscode';
import { ScssClassIndex } from './scss-class-index';
import { ScssDefinitionProvider } from './scss-definition-provider';

const SCSS_GLOB = '**/*.scss';
const EXCLUDE_GLOB = '**/{node_modules,dist,out-tsc,tmp,.angular,.nx}/**';
const SUPPORTED_LANGUAGES = [
  'html',
  'typescript',
  'javascript',
  'typescriptreact',
  'javascriptreact',
  'vue',
  'svelte',
];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const index = new ScssClassIndex();

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      SUPPORTED_LANGUAGES.map((language) => ({ scheme: 'file', language })),
      new ScssDefinitionProvider(index),
    ),
    createWatcher(index),
  );

  const indexedFiles = await indexWorkspace(index);
  const log = vscode.window.createOutputChannel('Nested SCSS Definition');
  context.subscriptions.push(log);
  log.appendLine(`Indexed ${indexedFiles} scss files`);
}

export const deactivate = (): void => undefined;

function createWatcher(index: ScssClassIndex): vscode.FileSystemWatcher {
  const watcher = vscode.workspace.createFileSystemWatcher(SCSS_GLOB);
  const reindex = (uri: vscode.Uri): Promise<void> => indexFile(index, uri);

  watcher.onDidCreate(reindex);
  watcher.onDidChange(reindex);
  watcher.onDidDelete((uri) => index.removeFile(uri.toString()));

  return watcher;
}

async function indexWorkspace(index: ScssClassIndex): Promise<number> {
  const files = await vscode.workspace.findFiles(SCSS_GLOB, EXCLUDE_GLOB);
  await Promise.all(files.map((uri) => indexFile(index, uri)));
  return files.length;
}

async function indexFile(index: ScssClassIndex, uri: vscode.Uri): Promise<void> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    index.indexFile(uri.toString(), Buffer.from(bytes).toString('utf8'));
  } catch {
    index.removeFile(uri.toString());
  }
}
