module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'test', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'ci', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'revert', release: 'patch' }
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES']
        }
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'docs', section: 'Documentation' },
            { type: 'style', section: 'Styles' },
            { type: 'refactor', section: 'Code Refactoring' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'test', section: 'Tests' },
            { type: 'chore', section: 'Chores' },
            { type: 'ci', section: 'Continuous Integration' },
            { type: 'build', section: 'Build System' },
            { type: 'revert', section: 'Reverts' }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog\n\nAll notable changes to this project will be documented in this file.'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        tarballDir: 'dist'
      }
    ]
  ]
};