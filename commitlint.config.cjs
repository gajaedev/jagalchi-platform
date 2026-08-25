module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'format',
        'docs',
        'action',
        'test',
        'ai',
        'chore',
        'empty',
        'revert',
        'wip',
        'hotfix',
      ],
    ],
    'subject-case': [0],
  },
};