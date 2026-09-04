import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '.angular',
      '.nx',
      'coverage',
      'test-results',
      '**/vitest.config.*.timestamp*',
      '**/platforms/**',
      '**/documentation.json',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['methods', 'asyncMethods', 'arrowFunctions', 'setters'] },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            // tools/ é configuração base partilhada, não um projeto do grafo: os ficheiros
            // de config das apps estendem-na por caminho relativo, e é assim que deve ser.
            '^.*/tools/.*$',
          ],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.stories.ts',
      '**/mocks/**/*.ts',
      '**/*.mock.ts',
      '**/.storybook/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
