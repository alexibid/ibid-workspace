const FORBIDDEN = [
  { pattern: /\bimport\s+(os|sys|subprocess|shutil|socket|urllib|requests|http|ctypes)\b/, what: 'importing host modules' },
  { pattern: /\bfrom\s+(os|sys|subprocess|shutil|socket|urllib|requests|http|ctypes)\b/, what: 'importing host modules' },
  { pattern: /\b__import__\s*\(/, what: 'dynamic imports' },
  { pattern: /\b(eval|exec|compile)\s*\(/, what: 'evaluating generated source' },
  { pattern: /\bopen\s*\(/, what: 'touching the filesystem' },
  { pattern: /\bbpy\.ops\.wm\.(save|open|quit|url)/, what: 'driving the Blender session' },
  { pattern: /\bbpy\.app\.handlers\b/, what: 'installing Blender handlers' },
];

const REQUIRED = /\bdef\s+build\s*\(\s*studio\s*\)/;

export class ScriptRejected extends Error {}

export function screen(source) {
  if (!REQUIRED.test(source)) {
    throw new ScriptRejected(
      'The model script must expose exactly one entry point: def build(studio).'
    );
  }
  const offences = FORBIDDEN.filter(({ pattern }) => pattern.test(source)).map(({ what }) => what);
  if (offences.length > 0) {
    throw new ScriptRejected(
      `A model script only describes geometry through the studio API. Rejected for ${[...new Set(offences)].join(', ')}.`
    );
  }
  return source;
}
