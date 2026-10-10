import * as vscode from 'vscode';
import type { ScssClassIndex } from './scss-class-index';

const CLASS_WORD_PATTERN = /[\w-]+/;

export class ScssDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private readonly index: ScssClassIndex) {}

  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Location[] {
    const wordRange = document.getWordRangeAtPosition(position, CLASS_WORD_PATTERN);
    if (!wordRange) return [];

    return this.index.find(document.getText(wordRange)).map(
      (location) =>
        new vscode.Location(
          vscode.Uri.parse(location.fileKey),
          new vscode.Position(location.line, location.column),
        ),
    );
  }
}
