export const bootstrap = (): string => {
    const message = 'Bitbucket MCP Server ready';
    if (process.env.NODE_ENV !== 'test') {
        console.log(message);
    }
    return message;
};

if (require.main === module) {
    bootstrap();
}
