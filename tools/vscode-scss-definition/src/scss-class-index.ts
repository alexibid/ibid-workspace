import { type ClassDefinition, parseScssClasses } from './scss-class-parser';

export interface ClassLocation {
  readonly fileKey: string;
  readonly line: number;
  readonly column: number;
}

export class ScssClassIndex {
  private readonly locationsByClass = new Map<string, ClassLocation[]>();
  private readonly classesByFile = new Map<string, Set<string>>();

  public indexFile(fileKey: string, sourceText: string): void {
    this.removeFile(fileKey);

    const definitions = parseScssClasses(sourceText);
    definitions.forEach((definition) => this.addDefinition(fileKey, definition));
  }

  public removeFile(fileKey: string): void {
    const classNames = this.classesByFile.get(fileKey);
    if (!classNames) return;

    classNames.forEach((name) => this.removeLocationsOfFile(name, fileKey));
    this.classesByFile.delete(fileKey);
  }

  public find(className: string): readonly ClassLocation[] {
    return this.locationsByClass.get(className) ?? [];
  }

  private addDefinition(fileKey: string, definition: ClassDefinition): void {
    const locations = this.locationsByClass.get(definition.name) ?? [];
    locations.push({ fileKey, line: definition.line, column: definition.column });
    this.locationsByClass.set(definition.name, locations);

    const fileClasses = this.classesByFile.get(fileKey) ?? new Set<string>();
    fileClasses.add(definition.name);
    this.classesByFile.set(fileKey, fileClasses);
  }

  private removeLocationsOfFile(className: string, fileKey: string): void {
    const remaining = (this.locationsByClass.get(className) ?? []).filter(
      (location) => location.fileKey !== fileKey,
    );

    if (remaining.length > 0) {
      this.locationsByClass.set(className, remaining);
    } else {
      this.locationsByClass.delete(className);
    }
  }
}
