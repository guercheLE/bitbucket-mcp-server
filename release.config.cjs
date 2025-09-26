module.exports = {
    branches: [
        'main',
        {
            name: 'develop',
            channel: 'beta',
            prerelease: 'beta',
        },
    ],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/changelog',
            {
                changelogFile: 'CHANGELOG.md',
            },
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: true,
                pkgRoot: '.',
            },
        ],
        [
            '@semantic-release/github',
            {
                successComment: false,
                failComment: false,
            },
        ],
        [
            '@semantic-release/git',
            {
                assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
                message:
                    'chore(release): ${nextRelease.version}\n\n${nextRelease.notes}',
            },
        ],
    ],
};
