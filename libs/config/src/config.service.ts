import { Injectable } from '@nestjs/common';
import { writeFileSync } from 'fs';
import * as path from 'path';
import MICRO_SERVICES_CONFIGS from './service/services-configs';
import { spawn } from 'child_process';

@Injectable()
export class ConfigService {
    private readonly configFilePath = path.join(
        process.cwd(),
        'libs',
        'config',
        'src',
        'micro-services-configs.ts',
    );

    getConfig(): any {
        return MICRO_SERVICES_CONFIGS;
    }

    updateConfig(
        serviceName: string,
        key: string,
        value: any,
    ): any {
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
    ): any {
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