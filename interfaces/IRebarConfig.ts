import '@Server/config/index.js';

// Extend NodeJS.ProcessEnv, so it will show you that it exists on process.env.SOME_ENV_VARIABLE.
declare global {
    namespace NodeJS {
        export interface ProcessEnv {
            DISCORD_APP_ID: string;
        }
    }
}

// Extend Config interface, don't forget to import module first to make TypeScript magic work.
declare module '@Server/config/index.js' {
    interface Config {
        // Name of key could be different from env variable, it doesn't matter.
        discord_app_id: string;
    }
}