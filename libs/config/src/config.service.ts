import { Injectable } from '@nestjs/common';
import { ConfigService as CS } from '@nestjs/config';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

import MICRO_SERVICES_CONFIGS from './service/services-configs';

export interface AppEnv {
    DATABASE_URL: string;
    REDIS_URL: string;
    NODE_ENV?: string;
    PORT?: string;
    TCP_HOST?: string;
    TCP_PORT?: string;
}

@Injectable()
export class ConfigService {
    constructor(
        private readonly configService: CS,
    ) {}

    private readonly configFilePath = path.join(
        process.cwd(),
        'libs',
        'config',
        'src',
        'micro-services-configs.ts',
    );

    getConfig(): Record<string, any> {
        return MICRO_SERVICES_CONFIGS;
    }

    getEnv<K extends keyof AppEnv>(
        key: K,
    ): AppEnv[K] | undefined {
        return this.configService.get<AppEnv[K]>(key);
    }

    getAllEnvs(): Partial<AppEnv> {
        return {
            DATABASE_URL: process.env.DATABASE_URL,
            REDIS_URL: process.env.REDIS_URL,
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            TCP_HOST: process.env.TCP_HOST,
            TCP_PORT: process.env.TCP_PORT,
        };
    }

    getEnvKeys(): (keyof AppEnv)[] {
        return [
            'DATABASE_URL',
            'REDIS_URL',
            'NODE_ENV',
            'PORT',
            'TCP_HOST',
            'TCP_PORT',
        ];
    }

    getEnvObject(): Partial<AppEnv> {
        return this.getAllEnvs();
    }

    updateConfig(
        serviceName: string,
        key: string,
        value: any,
    ): Record<string, any> {
        const config = this.getConfig();

        if (!config?.[serviceName]) {
            throw new Error(
                `Service config for "${serviceName}" not found.`,
            );
        }

        config[serviceName][key] = value;

        this.persistConfig(config);

        setTimeout(() => {
            this.restartApp();
        }, 100);

        return config;
    }

    addAppConfig(
        serviceName: string,
        appConfig: Record<string, any>,
    ): Record<string, any> {
        const config = this.getConfig();

        config[serviceName] = {
            ...(config[serviceName] ?? {}),
            ...appConfig,
        };

        this.persistConfig(config);

        return config;
    }

    private persistConfig(
        config: Record<string, any>,
    ): void {
        const fileContent = `const MICRO_SERVICES_CONFIGS = ${JSON.stringify(
            config,
            null,
            4,
        )};

export default MICRO_SERVICES_CONFIGS;
`;

        writeFileSync(
            this.configFilePath,
            fileContent,
            'utf8',
        );
    }

    private restartApp(): void {
        const child = spawn(
            process.argv[0],
            process.argv.slice(1),
            {
                detached: true,
                stdio: 'inherit',
            },
        );

        child.unref();

        process.exit(0);
    }
}