/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/api-gateway/src/api-gateway.controller.ts"
/*!********************************************************!*\
  !*** ./apps/api-gateway/src/api-gateway.controller.ts ***!
  \********************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiGatewayController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const api_gateway_service_1 = __webpack_require__(/*! ./api-gateway.service */ "./apps/api-gateway/src/api-gateway.service.ts");
const config_1 = __webpack_require__(/*! @app/config */ "./libs/config/src/index.ts");
let ApiGatewayController = class ApiGatewayController {
    apiGatewayService;
    configService;
    constructor(apiGatewayService, configService) {
        this.apiGatewayService = apiGatewayService;
        this.configService = configService;
    }
    getHello() {
        return this.apiGatewayService.getUsers();
    }
};
exports.ApiGatewayController = ApiGatewayController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ApiGatewayController.prototype, "getHello", null);
exports.ApiGatewayController = ApiGatewayController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof api_gateway_service_1.ApiGatewayService !== "undefined" && api_gateway_service_1.ApiGatewayService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], ApiGatewayController);


/***/ },

/***/ "./apps/api-gateway/src/api-gateway.module.ts"
/*!****************************************************!*\
  !*** ./apps/api-gateway/src/api-gateway.module.ts ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiGatewayModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const api_gateway_controller_1 = __webpack_require__(/*! ./api-gateway.controller */ "./apps/api-gateway/src/api-gateway.controller.ts");
const api_gateway_service_1 = __webpack_require__(/*! ./api-gateway.service */ "./apps/api-gateway/src/api-gateway.service.ts");
const config_1 = __webpack_require__(/*! @app/config */ "./libs/config/src/index.ts");
const services_configs_1 = __importDefault(__webpack_require__(/*! @app/config/service/services-configs */ "./libs/config/src/service/services-configs.ts"));
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
const database_1 = __webpack_require__(/*! @app/database */ "./libs/database/src/index.ts");
const MICROSERVICE_CLIENTS = Object.values(services_configs_1.default)
    .filter((service) => service.APP_NAME !== 'EVENT_SERVICE')
    .map((service) => ({
    name: service.APP_NAME,
    transport: service.TRANSPORT,
    options: {
        host: service.MICROSERVICE_HOST,
        port: service.MICROSERVICE_PORT,
    },
}));
let ApiGatewayModule = class ApiGatewayModule {
};
exports.ApiGatewayModule = ApiGatewayModule;
exports.ApiGatewayModule = ApiGatewayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register(MICROSERVICE_CLIENTS),
            config_1.ConfigModule,
            database_1.DatabaseModule.forRoot(),
        ],
        controllers: [api_gateway_controller_1.ApiGatewayController],
        providers: [api_gateway_service_1.ApiGatewayService, config_1.ConfigService],
    })
], ApiGatewayModule);


/***/ },

/***/ "./apps/api-gateway/src/api-gateway.service.ts"
/*!*****************************************************!*\
  !*** ./apps/api-gateway/src/api-gateway.service.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiGatewayService = void 0;
const notification_patterns_1 = __webpack_require__(/*! @app/config/patterns/notification-patterns */ "./libs/config/src/patterns/notification-patterns.ts");
const services_configs_1 = __importDefault(__webpack_require__(/*! @app/config/service/services-configs */ "./libs/config/src/service/services-configs.ts"));
const database_1 = __webpack_require__(/*! @app/database */ "./libs/database/src/index.ts");
const schemas_1 = __webpack_require__(/*! @app/database/db/schemas */ "./libs/database/src/db/schemas/index.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
const rxjs_1 = __webpack_require__(/*! rxjs */ "rxjs");
let ApiGatewayService = class ApiGatewayService {
    notificationClient;
    databaseService;
    constructor(notificationClient, databaseService) {
        this.notificationClient = notificationClient;
        this.databaseService = databaseService;
    }
    async getUsers() {
        const data = await this.databaseService.db.select().from(schemas_1.UsersSchema).limit(10);
        return data;
    }
    getHello() {
        return 'Hello World!';
    }
    async createEvent() {
        const data = await (0, rxjs_1.firstValueFrom)(this.notificationClient.send(notification_patterns_1.NOTIFICATION_PATTERNS.EVENT_CREATED, {
            name: 'New Event',
            description: 'This is a new event',
        }));
        return {
            success: true,
            message: 'Event processed successfully',
            data,
        };
    }
};
exports.ApiGatewayService = ApiGatewayService;
exports.ApiGatewayService = ApiGatewayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(services_configs_1.default.NOTIFICATION_SERVICE.APP_NAME)),
    __metadata("design:paramtypes", [typeof (_a = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _a : Object, typeof (_b = typeof database_1.DatabaseService !== "undefined" && database_1.DatabaseService) === "function" ? _b : Object])
], ApiGatewayService);


/***/ },

/***/ "./libs/config/src/config.module.ts"
/*!******************************************!*\
  !*** ./libs/config/src/config.module.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./libs/config/src/config.service.ts");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
        ],
        providers: [config_service_1.ConfigService],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);


/***/ },

/***/ "./libs/config/src/config.service.ts"
/*!*******************************************!*\
  !*** ./libs/config/src/config.service.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path = __importStar(__webpack_require__(/*! path */ "path"));
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const services_configs_1 = __importDefault(__webpack_require__(/*! ./service/services-configs */ "./libs/config/src/service/services-configs.ts"));
let ConfigService = class ConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    configFilePath = path.join(process.cwd(), 'libs', 'config', 'src', 'micro-services-configs.ts');
    getConfig() {
        return services_configs_1.default;
    }
    getEnv(key) {
        return this.configService.get(key);
    }
    getAllEnvs() {
        return {
            DATABASE_URL: process.env.DATABASE_URL,
            REDIS_URL: process.env.REDIS_URL,
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            TCP_HOST: process.env.TCP_HOST,
            TCP_PORT: process.env.TCP_PORT,
        };
    }
    getEnvKeys() {
        return [
            'DATABASE_URL',
            'REDIS_URL',
            'NODE_ENV',
            'PORT',
            'TCP_HOST',
            'TCP_PORT',
        ];
    }
    getEnvObject() {
        return this.getAllEnvs();
    }
    updateConfig(serviceName, key, value) {
        const config = this.getConfig();
        if (!config?.[serviceName]) {
            throw new Error(`Service config for "${serviceName}" not found.`);
        }
        config[serviceName][key] = value;
        this.persistConfig(config);
        setTimeout(() => {
            this.restartApp();
        }, 100);
        return config;
    }
    addAppConfig(serviceName, appConfig) {
        const config = this.getConfig();
        config[serviceName] = {
            ...(config[serviceName] ?? {}),
            ...appConfig,
        };
        this.persistConfig(config);
        return config;
    }
    persistConfig(config) {
        const fileContent = `const MICRO_SERVICES_CONFIGS = ${JSON.stringify(config, null, 4)};

export default MICRO_SERVICES_CONFIGS;
`;
        (0, fs_1.writeFileSync)(this.configFilePath, fileContent, 'utf8');
    }
    restartApp() {
        const child = (0, child_process_1.spawn)(process.argv[0], process.argv.slice(1), {
            detached: true,
            stdio: 'inherit',
        });
        child.unref();
        process.exit(0);
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ConfigService);


/***/ },

/***/ "./libs/config/src/index.ts"
/*!**********************************!*\
  !*** ./libs/config/src/index.ts ***!
  \**********************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./config.module */ "./libs/config/src/config.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./config.service */ "./libs/config/src/config.service.ts"), exports);


/***/ },

/***/ "./libs/config/src/patterns/notification-patterns.ts"
/*!***********************************************************!*\
  !*** ./libs/config/src/patterns/notification-patterns.ts ***!
  \***********************************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NOTIFICATION_PATTERNS = void 0;
exports.NOTIFICATION_PATTERNS = {
    EVENT_CREATED: 'event.created',
};


/***/ },

/***/ "./libs/config/src/service/services-configs.ts"
/*!*****************************************************!*\
  !*** ./libs/config/src/service/services-configs.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const MICRO_SERVICES_CONFIGS = {
    "EVENT_SERVICE": {
        "APP_NAME": "EVENT_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3003,
        "MICROSERVICE_PORT": 3300,
        "MICROSERVICE_HOST": "localhost"
    },
    "NOTIFICATION_SERVICE": {
        "APP_NAME": "NOTIFICATION_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3004,
        "MICROSERVICE_HOST": "localhost",
        "MICROSERVICE_PORT": 3400
    },
    "REALTIME_SERVICE": {
        "APP_NAME": "REALTIME_SERVICE",
        "TRANSPORT": 0,
        "APP_PORT": 3004,
        "MICROSERVICE_HOST": "localhost",
        "MICROSERVICE_PORT": 3500
    }
};
exports["default"] = MICRO_SERVICES_CONFIGS;


/***/ },

/***/ "./libs/database/src/database.module.ts"
/*!**********************************************!*\
  !*** ./libs/database/src/database.module.ts ***!
  \**********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const client_1 = __webpack_require__(/*! ./db/client */ "./libs/database/src/db/client.ts");
const database_service_1 = __webpack_require__(/*! ./database.service */ "./libs/database/src/database.service.ts");
const config_1 = __webpack_require__(/*! @app/config */ "./libs/config/src/index.ts");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    static forRoot() {
        return {
            module: DatabaseModule_1,
            imports: [
                config_1.ConfigModule,
            ],
            providers: [
                {
                    provide: 'DATABASE_INSTANCE',
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => {
                        const databaseUrl = configService.getEnv("DATABASE_URL");
                        if (!databaseUrl) {
                            throw new Error('DATABASE_URL environment variable is not defined');
                        }
                        return (0, client_1.createDatabase)(databaseUrl);
                    },
                },
                {
                    provide: client_1.DATABASE,
                    inject: ['DATABASE_INSTANCE'],
                    useFactory: (database) => {
                        return database.db;
                    },
                },
                {
                    provide: 'DATABASE_POOL',
                    inject: ['DATABASE_INSTANCE'],
                    useFactory: (database) => {
                        return database.pool;
                    },
                },
                database_service_1.DatabaseService,
            ],
            exports: [
                client_1.DATABASE,
                'DATABASE_POOL',
                database_service_1.DatabaseService,
            ],
        };
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], DatabaseModule);


/***/ },

/***/ "./libs/database/src/database.service.ts"
/*!***********************************************!*\
  !*** ./libs/database/src/database.service.ts ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DatabaseService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const client_1 = __webpack_require__(/*! ./db/client */ "./libs/database/src/db/client.ts");
let DatabaseService = class DatabaseService {
    database;
    pool;
    constructor(database, pool) {
        this.database = database;
        this.pool = pool;
    }
    get db() {
        return this.database;
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(client_1.DATABASE)),
    __param(1, (0, common_1.Inject)('DATABASE_POOL')),
    __metadata("design:paramtypes", [Object, Object])
], DatabaseService);


/***/ },

/***/ "./libs/database/src/db/client.ts"
/*!****************************************!*\
  !*** ./libs/database/src/db/client.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createDatabase = exports.DATABASE = void 0;
const pg_1 = __webpack_require__(/*! pg */ "pg");
const node_postgres_1 = __webpack_require__(/*! drizzle-orm/node-postgres */ "drizzle-orm/node-postgres");
const schema = __importStar(__webpack_require__(/*! ./schemas */ "./libs/database/src/db/schemas/index.ts"));
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
exports.DATABASE = Symbol('DATABASE');
const createDatabase = (databaseUrl) => {
    const pool = new pg_1.Pool({
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        allowExitOnIdle: true,
        ssl: process.env.NODE_ENV === 'production'
            ? {
                rejectUnauthorized: false,
            }
            : false,
    });
    pool.on('connect', () => {
        common_1.Logger.log('New PostgreSQL client connected');
    });
    pool.on('error', (err) => {
        common_1.Logger.error('Unexpected PostgreSQL Pool Error', err);
    });
    pool.on('remove', () => {
        common_1.Logger.warn('PostgreSQL client removed');
    });
    const db = (0, node_postgres_1.drizzle)(pool, {
        schema,
    });
    return {
        db,
        pool,
    };
};
exports.createDatabase = createDatabase;


/***/ },

/***/ "./libs/database/src/db/schemas/analytics.ts"
/*!***************************************************!*\
  !*** ./libs/database/src/db/schemas/analytics.ts ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditLogsSchema = exports.WebhookDeliveriesSchema = exports.WebhookEndpointsSchema = exports.NotificationTemplatesSchema = exports.NotificationsSchema = exports.TrafficAttributionSchema = exports.TicketSalesHourlySchema = exports.OrgRevenueSummarySchema = exports.OrgAnalyticsMonthlySchema = exports.EventAnalyticsDailySchema = exports.BookmarksSchema = exports.FollowsSchema = exports.ContentReportsSchema = exports.ReviewsSchema = void 0;
const drizzle_orm_1 = __webpack_require__(/*! drizzle-orm */ "drizzle-orm");
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
const enums_1 = __webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts");
const users_1 = __webpack_require__(/*! ./users */ "./libs/database/src/db/schemas/users.ts");
const events_1 = __webpack_require__(/*! ./events */ "./libs/database/src/db/schemas/events.ts");
const organizations_1 = __webpack_require__(/*! ./organizations */ "./libs/database/src/db/schemas/organizations.ts");
const payments_1 = __webpack_require__(/*! ./payments */ "./libs/database/src/db/schemas/payments.ts");
exports.ReviewsSchema = (0, pg_core_1.pgTable)('reviews', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    registrationId: (0, pg_core_1.uuid)('registration_id')
        .references(() => payments_1.RegistrationsSchema.id, { onDelete: 'set null' }),
    rating: (0, pg_core_1.smallint)('rating').notNull(),
    venueRating: (0, pg_core_1.smallint)('venue_rating'),
    organizationRating: (0, pg_core_1.smallint)('organization_rating'),
    valueRating: (0, pg_core_1.smallint)('value_rating'),
    title: (0, pg_core_1.text)('title'),
    comment: (0, pg_core_1.text)('comment'),
    status: (0, enums_1.reviewStatusEnum)('status').notNull().default('published'),
    flagCount: (0, pg_core_1.integer)('flag_count').notNull().default(0),
    replyText: (0, pg_core_1.text)('reply_text'),
    replyAt: (0, pg_core_1.timestamp)('reply_at'),
    replyBy: (0, pg_core_1.uuid)('reply_by').references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_reviews_user_event').on(t.userId, t.eventId),
    (0, pg_core_1.index)('idx_reviews_event').on(t.eventId),
    (0, pg_core_1.index)('idx_reviews_rating').on(t.rating),
    (0, pg_core_1.index)('idx_reviews_flagged')
        .on(t.flagCount)
        .where((0, drizzle_orm_1.sql) `${t.flagCount} > 0`),
]);
exports.ContentReportsSchema = (0, pg_core_1.pgTable)('content_reports', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    reportedBy: (0, pg_core_1.uuid)('reported_by').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    entityId: (0, pg_core_1.uuid)('entity_id').notNull(),
    reason: (0, enums_1.reportReasonEnum)('reason').notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    resolvedBy: (0, pg_core_1.uuid)('resolved_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at'),
    resolution: (0, pg_core_1.text)('resolution'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_reports_entity').on(t.entityType, t.entityId),
    (0, pg_core_1.index)('idx_reports_status').on(t.status),
    (0, pg_core_1.index)('idx_reports_reporter').on(t.reportedBy),
]);
exports.FollowsSchema = (0, pg_core_1.pgTable)('follows', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    followerId: (0, pg_core_1.uuid)('follower_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    entityType: (0, enums_1.followEntityEnum)('entity_type').notNull(),
    entityId: (0, pg_core_1.text)('entity_id').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_follows_unique').on(t.followerId, t.entityType, t.entityId),
    (0, pg_core_1.index)('idx_follows_follower').on(t.followerId),
    (0, pg_core_1.index)('idx_follows_entity').on(t.entityType, t.entityId),
]);
exports.BookmarksSchema = (0, pg_core_1.pgTable)('bookmarks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_bookmarks_unique').on(t.userId, t.eventId),
    (0, pg_core_1.index)('idx_bookmarks_user').on(t.userId),
    (0, pg_core_1.index)('idx_bookmarks_event').on(t.eventId),
]);
exports.EventAnalyticsDailySchema = (0, pg_core_1.pgTable)('event_analytics_daily', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    date: (0, pg_core_1.text)('date').notNull(),
    pageViews: (0, pg_core_1.integer)('page_views').notNull().default(0),
    uniqueVisitors: (0, pg_core_1.integer)('unique_visitors').notNull().default(0),
    ticketPageViews: (0, pg_core_1.integer)('ticket_page_views').notNull().default(0),
    checkoutStarts: (0, pg_core_1.integer)('checkout_starts').notNull().default(0),
    checkoutCompletions: (0, pg_core_1.integer)('checkout_completions').notNull().default(0),
    newRegistrations: (0, pg_core_1.integer)('new_registrations').notNull().default(0),
    cancellations: (0, pg_core_1.integer)('cancellations').notNull().default(0),
    waitlistAdds: (0, pg_core_1.integer)('waitlist_adds').notNull().default(0),
    grossRevenue: (0, pg_core_1.integer)('gross_revenue').notNull().default(0),
    netRevenue: (0, pg_core_1.integer)('net_revenue').notNull().default(0),
    refundsIssued: (0, pg_core_1.integer)('refunds_issued').notNull().default(0),
    bookmarks: (0, pg_core_1.integer)('bookmarks').notNull().default(0),
    shares: (0, pg_core_1.integer)('shares').notNull().default(0),
    trafficSources: (0, pg_core_1.jsonb)('traffic_sources')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    deviceBreakdown: (0, pg_core_1.jsonb)('device_breakdown')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    topCountries: (0, pg_core_1.jsonb)('top_countries')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    computedAt: (0, pg_core_1.timestamp)('computed_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_analytics_daily_event_date').on(t.eventId, t.date),
    (0, pg_core_1.index)('idx_analytics_daily_date').on(t.date),
]);
exports.OrgAnalyticsMonthlySchema = (0, pg_core_1.pgTable)('org_analytics_monthly', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'cascade' }),
    month: (0, pg_core_1.text)('month').notNull(),
    totalEvents: (0, pg_core_1.integer)('total_events').notNull().default(0),
    publishedEvents: (0, pg_core_1.integer)('published_events').notNull().default(0),
    cancelledEvents: (0, pg_core_1.integer)('cancelled_events').notNull().default(0),
    totalTicketsSold: (0, pg_core_1.integer)('total_tickets_sold').notNull().default(0),
    totalAttendees: (0, pg_core_1.integer)('total_attendees').notNull().default(0),
    newFollowers: (0, pg_core_1.integer)('new_followers').notNull().default(0),
    totalPageViews: (0, pg_core_1.integer)('total_page_views').notNull().default(0),
    grossRevenue: (0, pg_core_1.integer)('gross_revenue').notNull().default(0),
    netRevenue: (0, pg_core_1.integer)('net_revenue').notNull().default(0),
    platformFees: (0, pg_core_1.integer)('platform_fees').notNull().default(0),
    refundsIssued: (0, pg_core_1.integer)('refunds_issued').notNull().default(0),
    pendingPayouts: (0, pg_core_1.integer)('pending_payouts').notNull().default(0),
    completedPayouts: (0, pg_core_1.integer)('completed_payouts').notNull().default(0),
    averageRating: (0, pg_core_1.doublePrecision)('average_rating'),
    totalReviews: (0, pg_core_1.integer)('total_reviews').notNull().default(0),
    computedAt: (0, pg_core_1.timestamp)('computed_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_org_analytics_monthly').on(t.orgId, t.month),
    (0, pg_core_1.index)('idx_org_analytics_date').on(t.month),
]);
exports.OrgRevenueSummarySchema = (0, pg_core_1.pgTable)('org_revenue_summary', {
    orgId: (0, pg_core_1.uuid)('org_id').notNull().primaryKey()
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'cascade' }),
    totalGrossRevenue: (0, pg_core_1.integer)('total_gross_revenue').notNull().default(0),
    totalNetRevenue: (0, pg_core_1.integer)('total_net_revenue').notNull().default(0),
    totalRefunds: (0, pg_core_1.integer)('total_refunds').notNull().default(0),
    totalPayouts: (0, pg_core_1.integer)('total_payouts').notNull().default(0),
    pendingPayouts: (0, pg_core_1.integer)('pending_payouts').notNull().default(0),
    totalTicketsSold: (0, pg_core_1.integer)('total_tickets_sold').notNull().default(0),
    totalEventsHosted: (0, pg_core_1.integer)('total_events_hosted').notNull().default(0),
    averageTicketPrice: (0, pg_core_1.doublePrecision)('average_ticket_price'),
    lastUpdatedAt: (0, pg_core_1.timestamp)('last_updated_at').notNull().defaultNow(),
});
exports.TicketSalesHourlySchema = (0, pg_core_1.pgTable)('ticket_sales_hourly', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    ticketId: (0, pg_core_1.uuid)('ticket_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    hour: (0, pg_core_1.timestamp)('hour').notNull(),
    unitsSold: (0, pg_core_1.integer)('units_sold').notNull().default(0),
    revenue: (0, pg_core_1.integer)('revenue').notNull().default(0),
    computedAt: (0, pg_core_1.timestamp)('computed_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_ticket_hourly_unique').on(t.ticketId, t.hour),
    (0, pg_core_1.index)('idx_ticket_hourly_event').on(t.eventId),
    (0, pg_core_1.index)('idx_ticket_hourly_hour').on(t.hour),
]);
exports.TrafficAttributionSchema = (0, pg_core_1.pgTable)('traffic_attribution', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    orderId: (0, pg_core_1.uuid)('order_id')
        .references(() => payments_1.OrdersSchema.id, { onDelete: 'set null' }),
    utmSource: (0, pg_core_1.text)('utm_source'),
    utmMedium: (0, pg_core_1.text)('utm_medium'),
    utmCampaign: (0, pg_core_1.text)('utm_campaign'),
    utmContent: (0, pg_core_1.text)('utm_content'),
    referrer: (0, pg_core_1.text)('referrer'),
    sessionId: (0, pg_core_1.text)('session_id'),
    converted: (0, pg_core_1.boolean)('converted').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_attr_event').on(t.eventId),
    (0, pg_core_1.index)('idx_attr_source').on(t.utmSource, t.utmMedium),
    (0, pg_core_1.index)('idx_attr_event_source').on(t.eventId, t.utmSource),
]);
exports.NotificationsSchema = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    type: (0, enums_1.notificationTypeEnum)('type').notNull(),
    channel: (0, enums_1.notificationChannelEnum)('channel').notNull().default('in_app'),
    eventId: (0, pg_core_1.uuid)('event_id')
        .references(() => events_1.EventsSchema.id, { onDelete: 'cascade' }),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'cascade' }),
    orderId: (0, pg_core_1.uuid)('order_id')
        .references(() => payments_1.OrdersSchema.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    data: (0, pg_core_1.jsonb)('data').$type().default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    emailTemplateId: (0, pg_core_1.text)('email_template_id'),
    read: (0, pg_core_1.boolean)('read').notNull().default(false),
    readAt: (0, pg_core_1.timestamp)('read_at'),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    deliveredAt: (0, pg_core_1.timestamp)('delivered_at'),
    failedAt: (0, pg_core_1.timestamp)('failed_at'),
    failureReason: (0, pg_core_1.text)('failure_reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_notifs_user').on(t.userId),
    (0, pg_core_1.index)('idx_notifs_user_unread')
        .on(t.userId)
        .where((0, drizzle_orm_1.sql) `${t.read} = false`),
    (0, pg_core_1.index)('idx_notifs_created').on(t.createdAt),
    (0, pg_core_1.index)('idx_notifs_type').on(t.type),
    (0, pg_core_1.index)('idx_notifs_unsent')
        .on(t.createdAt)
        .where((0, drizzle_orm_1.sql) `${t.sentAt} IS NULL AND ${t.failedAt} IS NULL`),
]);
exports.NotificationTemplatesSchema = (0, pg_core_1.pgTable)('notification_templates', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    channel: (0, enums_1.notificationChannelEnum)('channel').notNull(),
    subjectTemplate: (0, pg_core_1.text)('subject_template'),
    bodyTemplate: (0, pg_core_1.text)('body_template').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
});
exports.WebhookEndpointsSchema = (0, pg_core_1.pgTable)('webhook_endpoints', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'cascade' }),
    url: (0, pg_core_1.text)('url').notNull(),
    secret: (0, pg_core_1.text)('secret').notNull(),
    events: (0, pg_core_1.text)('events').array().notNull().default((0, drizzle_orm_1.sql) `'{}'::text[]`),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastDeliveredAt: (0, pg_core_1.timestamp)('last_delivered_at'),
    failureCount: (0, pg_core_1.integer)('failure_count').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_webhooks_org').on(t.orgId)]);
exports.WebhookDeliveriesSchema = (0, pg_core_1.pgTable)('webhook_deliveries', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    endpointId: (0, pg_core_1.uuid)('endpoint_id').notNull()
        .references(() => exports.WebhookEndpointsSchema.id, { onDelete: 'cascade' }),
    event: (0, pg_core_1.text)('event').notNull(),
    payload: (0, pg_core_1.jsonb)('payload').$type().notNull(),
    attempt: (0, pg_core_1.smallint)('attempt').notNull().default(1),
    statusCode: (0, pg_core_1.integer)('status_code'),
    responseBody: (0, pg_core_1.text)('response_body'),
    success: (0, pg_core_1.boolean)('success').notNull().default(false),
    nextRetryAt: (0, pg_core_1.timestamp)('next_retry_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_webhook_deliveries_endpoint').on(t.endpointId),
    (0, pg_core_1.index)('idx_webhook_deliveries_retry')
        .on(t.nextRetryAt)
        .where((0, drizzle_orm_1.sql) `${t.success} = false`),
]);
exports.AuditLogsSchema = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    actorId: (0, pg_core_1.uuid)('actor_id')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    actorType: (0, pg_core_1.text)('actor_type').notNull().default('user'),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    entityId: (0, pg_core_1.text)('entity_id').notNull(),
    action: (0, enums_1.auditActionEnum)('action').notNull(),
    diff: (0, pg_core_1.jsonb)('diff')
        .$type()
        .default((0, drizzle_orm_1.sql) `'null'::jsonb`),
    metadata: (0, pg_core_1.jsonb)('metadata')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_audit_actor').on(t.actorId),
    (0, pg_core_1.index)('idx_audit_entity').on(t.entityType, t.entityId),
    (0, pg_core_1.index)('idx_audit_action').on(t.action),
    (0, pg_core_1.index)('idx_audit_created').on(t.createdAt),
    (0, pg_core_1.index)('idx_audit_actor_action').on(t.actorId, t.action),
]);


/***/ },

/***/ "./libs/database/src/db/schemas/enums.ts"
/*!***********************************************!*\
  !*** ./libs/database/src/db/schemas/enums.ts ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.discountTypeEnum = exports.refundReasonEnum = exports.payoutStatusEnum = exports.transactionTypeEnum = exports.currencyEnum = exports.paymentMethodTypeEnum = exports.paymentStatusEnum = exports.registrationStatusEnum = exports.ticketTransferStatusEnum = exports.ticketTypeEnum = exports.eventFormatEnum = exports.eventVisibilityEnum = exports.eventStatusEnum = exports.eventTypeEnum = exports.inviteStatusEnum = exports.orgPlanEnum = exports.orgRoleEnum = exports.twoFactorMethodEnum = exports.authProviderEnum = exports.accountRoleEnum = exports.userThemeEnum = exports._auditActionEnum = exports._notificationChannelEnum = exports._notificationTypeEnum = exports._followEntityEnum = exports._reportReasonEnum = exports._reviewStatusEnum = exports._payoutScheduleEnum = exports._promoCodeStatusEnum = exports._discountTypeEnum = exports._refundReasonEnum = exports._payoutStatusEnum = exports._transactionTypeEnum = exports._currencyEnum = exports._paymentMethodTypeEnum = exports._paymentStatusEnum = exports._registrationStatusEnum = exports._ticketTransferStatusEnum = exports._ticketTypeEnum = exports._eventFormatEnum = exports._eventVisibilityEnum = exports._eventStatusEnum = exports._eventTypeEnum = exports._inviteStatusEnum = exports._orgPlanEnum = exports._orgRoleEnum = exports._twoFactorMethodEnum = exports._authProviderEnum = exports._accountRoleEnum = exports._userThemeEnum = void 0;
exports.auditActionEnum = exports.notificationChannelEnum = exports.notificationTypeEnum = exports.followEntityEnum = exports.reportReasonEnum = exports.reviewStatusEnum = exports.payoutScheduleEnum = exports.promoCodeStatusEnum = void 0;
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
exports._userThemeEnum = [
    'light',
    'dark',
    'system',
];
exports._accountRoleEnum = [
    'superadmin',
    'admin',
    'user',
    'guest',
];
exports._authProviderEnum = [
    'email',
    'google',
    'github',
    'apple',
    'facebook',
];
exports._twoFactorMethodEnum = [
    'totp',
    'sms',
    'email',
    'backup_code',
];
exports._orgRoleEnum = [
    'owner',
    'admin',
    'manager',
    'member',
];
exports._orgPlanEnum = [
    'free',
    'starter',
    'pro',
    'enterprise',
];
exports._inviteStatusEnum = [
    'pending',
    'accepted',
    'declined',
    'expired',
    'revoked',
];
exports._eventTypeEnum = [
    'class', 'conference', 'festival', 'party', 'appearance',
    'attraction', 'convention', 'expo', 'gala', 'game',
    'networking', 'performance', 'race', 'rally', 'retreat',
    'screening', 'seminar', 'tournament', 'tour',
    'hackathon', 'workshop', 'meetup', 'webinar', 'other',
];
exports._eventStatusEnum = [
    'draft',
    'review',
    'published',
    'cancelled',
    'postponed',
    'completed',
    'archived',
];
exports._eventVisibilityEnum = [
    'public',
    'unlisted',
    'private',
];
exports._eventFormatEnum = [
    'in_person',
    'online',
    'hybrid',
];
exports._ticketTypeEnum = [
    'free',
    'paid',
    'donation',
    'comp',
];
exports._ticketTransferStatusEnum = [
    'pending',
    'accepted',
    'declined',
    'expired',
    'cancelled',
];
exports._registrationStatusEnum = [
    'pending',
    'confirmed',
    'waitlisted',
    'cancelled',
    'refunded',
    'no_show',
    'transferred',
];
exports._paymentStatusEnum = [
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'refunded',
    'partially_refunded',
    'disputed',
    'chargeback',
];
exports._paymentMethodTypeEnum = [
    'card',
    'upi',
    'net_banking',
    'wallet',
    'bank_transfer',
    'crypto',
    'cash',
];
exports._currencyEnum = [
    'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED',
];
exports._transactionTypeEnum = [
    'charge',
    'refund',
    'payout',
    'payout_reversal',
    'platform_fee',
    'tax',
    'adjustment',
];
exports._payoutStatusEnum = [
    'scheduled',
    'processing',
    'paid',
    'failed',
    'on_hold',
    'cancelled',
];
exports._refundReasonEnum = [
    'event_cancelled',
    'event_postponed',
    'buyer_request',
    'duplicate_purchase',
    'fraud',
    'chargeback',
    'organizer_issued',
    'other',
];
exports._discountTypeEnum = [
    'percentage',
    'fixed_amount',
];
exports._promoCodeStatusEnum = [
    'active',
    'inactive',
    'expired',
    'exhausted',
];
exports._payoutScheduleEnum = [
    'immediate',
    'weekly',
    'monthly',
    'manual',
];
exports._reviewStatusEnum = [
    'published',
    'hidden',
    'flagged',
    'deleted',
];
exports._reportReasonEnum = [
    'spam',
    'inappropriate_content',
    'false_information',
    'hate_speech',
    'scam',
    'other',
];
exports._followEntityEnum = [
    'user',
    'organization',
    'category',
    'tag',
];
exports._notificationTypeEnum = [
    'event_published',
    'event_update',
    'event_cancelled',
    'event_reminder_24h',
    'event_reminder_1h',
    'registration_confirmed',
    'registration_cancelled',
    'registration_waitlist_promoted',
    'ticket_transfer_received',
    'review_request',
    'review_response',
    'payment_succeeded',
    'payment_failed',
    'refund_issued',
    'payout_sent',
    'org_invite',
    'org_role_changed',
    'follow_new',
    'system',
];
exports._notificationChannelEnum = [
    'in_app',
    'email',
    'push',
    'sms',
    'webhook',
];
exports._auditActionEnum = [
    'create', 'update', 'delete', 'publish', 'cancel', 'postpone',
    'check_in', 'role_change', 'transfer', 'refund', 'payout',
    'ban', 'unban', 'flag', 'unflag',
];
exports.userThemeEnum = (0, pg_core_1.pgEnum)('user_theme', exports._userThemeEnum);
exports.accountRoleEnum = (0, pg_core_1.pgEnum)('account_role', exports._accountRoleEnum);
exports.authProviderEnum = (0, pg_core_1.pgEnum)('auth_provider', exports._authProviderEnum);
exports.twoFactorMethodEnum = (0, pg_core_1.pgEnum)('two_factor_method', exports._twoFactorMethodEnum);
exports.orgRoleEnum = (0, pg_core_1.pgEnum)('org_role', exports._orgRoleEnum);
exports.orgPlanEnum = (0, pg_core_1.pgEnum)('org_plan', exports._orgPlanEnum);
exports.inviteStatusEnum = (0, pg_core_1.pgEnum)('invite_status', exports._inviteStatusEnum);
exports.eventTypeEnum = (0, pg_core_1.pgEnum)('event_type', exports._eventTypeEnum);
exports.eventStatusEnum = (0, pg_core_1.pgEnum)('event_status', exports._eventStatusEnum);
exports.eventVisibilityEnum = (0, pg_core_1.pgEnum)('event_visibility', exports._eventVisibilityEnum);
exports.eventFormatEnum = (0, pg_core_1.pgEnum)('event_format', exports._eventFormatEnum);
exports.ticketTypeEnum = (0, pg_core_1.pgEnum)('ticket_type', exports._ticketTypeEnum);
exports.ticketTransferStatusEnum = (0, pg_core_1.pgEnum)('ticket_transfer_status', exports._ticketTransferStatusEnum);
exports.registrationStatusEnum = (0, pg_core_1.pgEnum)('registration_status', exports._registrationStatusEnum);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', exports._paymentStatusEnum);
exports.paymentMethodTypeEnum = (0, pg_core_1.pgEnum)('payment_method_type', exports._paymentMethodTypeEnum);
exports.currencyEnum = (0, pg_core_1.pgEnum)('currency', exports._currencyEnum);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)('transaction_type', exports._transactionTypeEnum);
exports.payoutStatusEnum = (0, pg_core_1.pgEnum)('payout_status', exports._payoutStatusEnum);
exports.refundReasonEnum = (0, pg_core_1.pgEnum)('refund_reason', exports._refundReasonEnum);
exports.discountTypeEnum = (0, pg_core_1.pgEnum)('discount_type', exports._discountTypeEnum);
exports.promoCodeStatusEnum = (0, pg_core_1.pgEnum)('promo_code_status', exports._promoCodeStatusEnum);
exports.payoutScheduleEnum = (0, pg_core_1.pgEnum)('payout_schedule', exports._payoutScheduleEnum);
exports.reviewStatusEnum = (0, pg_core_1.pgEnum)('review_status', exports._reviewStatusEnum);
exports.reportReasonEnum = (0, pg_core_1.pgEnum)('report_reason', exports._reportReasonEnum);
exports.followEntityEnum = (0, pg_core_1.pgEnum)('follow_entity', exports._followEntityEnum);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', exports._notificationTypeEnum);
exports.notificationChannelEnum = (0, pg_core_1.pgEnum)('notification_channel', exports._notificationChannelEnum);
exports.auditActionEnum = (0, pg_core_1.pgEnum)('audit_action', exports._auditActionEnum);


/***/ },

/***/ "./libs/database/src/db/schemas/events.ts"
/*!************************************************!*\
  !*** ./libs/database/src/db/schemas/events.ts ***!
  \************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PromoCodesSchema = exports.TicketsSchema = exports.EventPageViewsSchema = exports.EventUpdatesSchema = exports.EventFaqsSchema = exports.EventTagsSchema = exports.EventCategoriesSchema = exports.EventStaffSchema = exports.EventsSchema = exports.TagsSchema = exports.CategoriesSchema = exports.EventLocationsSchema = void 0;
const drizzle_orm_1 = __webpack_require__(/*! drizzle-orm */ "drizzle-orm");
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
const enums_1 = __webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts");
const users_1 = __webpack_require__(/*! ./users */ "./libs/database/src/db/schemas/users.ts");
const organizations_1 = __webpack_require__(/*! ./organizations */ "./libs/database/src/db/schemas/organizations.ts");
exports.EventLocationsSchema = (0, pg_core_1.pgTable)('event_locations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)('name'),
    address: (0, pg_core_1.text)('address').notNull(),
    city: (0, pg_core_1.text)('city').notNull(),
    state: (0, pg_core_1.text)('state'),
    country: (0, pg_core_1.text)('country').notNull(),
    postalCode: (0, pg_core_1.text)('postal_code'),
    lat: (0, pg_core_1.doublePrecision)('lat'),
    lng: (0, pg_core_1.doublePrecision)('lng'),
    timezone: (0, pg_core_1.text)('timezone'),
    placeId: (0, pg_core_1.text)('place_id'),
    h3R7: (0, pg_core_1.text)('h3_r7').notNull(),
    h3R6: (0, pg_core_1.text)('h3_r6').notNull(),
    h3R5: (0, pg_core_1.text)('h3_r5').notNull(),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_loc_h3_r7').on(t.h3R7),
    (0, pg_core_1.index)('idx_loc_h3_r6').on(t.h3R6),
    (0, pg_core_1.index)('idx_loc_h3_r5').on(t.h3R5),
    (0, pg_core_1.index)('idx_loc_country').on(t.country),
    (0, pg_core_1.index)('idx_loc_state').on(t.state),
    (0, pg_core_1.index)('idx_loc_city_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.city} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_loc_lat_lng').on(t.lat, t.lng),
]);
exports.CategoriesSchema = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.integer)('id').primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.text)('name').notNull().unique(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    icon: (0, pg_core_1.text)('icon'),
    parentId: (0, pg_core_1.integer)('parent_id'),
    displayOrder: (0, pg_core_1.smallint)('display_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_categories_slug').on(t.slug),
    (0, pg_core_1.index)('idx_categories_parent').on(t.parentId),
]);
exports.TagsSchema = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    usageCount: (0, pg_core_1.integer)('usage_count').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_tags_usage').on(t.usageCount)]);
exports.EventsSchema = (0, pg_core_1.pgTable)('events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    coverImage: (0, pg_core_1.text)('cover_image'),
    gallery: (0, pg_core_1.jsonb)('gallery').$type().notNull().default((0, drizzle_orm_1.sql) `'[]'::jsonb`),
    language: (0, pg_core_1.text)('language').notNull().default('en'),
    type: (0, enums_1.eventTypeEnum)('type').notNull().default('conference'),
    format: (0, enums_1.eventFormatEnum)('format').notNull().default('in_person'),
    visibility: (0, enums_1.eventVisibilityEnum)('visibility').notNull().default('public'),
    status: (0, enums_1.eventStatusEnum)('status').notNull().default('draft'),
    featured: (0, pg_core_1.boolean)('featured').notNull().default(false),
    organizerId: (0, pg_core_1.uuid)('organizer_id').notNull()
        .references(() => users_1.UsersSchema.id),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'set null' }),
    locationId: (0, pg_core_1.uuid)('location_id')
        .references(() => exports.EventLocationsSchema.id, { onDelete: 'set null' }),
    onlineUrl: (0, pg_core_1.text)('online_url'),
    onlinePlatform: (0, pg_core_1.text)('online_platform'),
    startDate: (0, pg_core_1.timestamp)('start_date').notNull(),
    endDate: (0, pg_core_1.timestamp)('end_date').notNull(),
    timezone: (0, pg_core_1.text)('timezone'),
    doorsOpen: (0, pg_core_1.timestamp)('doors_open'),
    registrationDeadline: (0, pg_core_1.timestamp)('registration_deadline'),
    capacity: (0, pg_core_1.integer)('capacity'),
    minAttendees: (0, pg_core_1.integer)('min_attendees'),
    ageRestriction: (0, pg_core_1.smallint)('age_restriction'),
    isRefundable: (0, pg_core_1.boolean)('is_refundable').notNull().default(true),
    refundDeadlineHours: (0, pg_core_1.integer)('refund_deadline_hours').default(48),
    waitlistEnabled: (0, pg_core_1.boolean)('waitlist_enabled').notNull().default(false),
    orderExpiryMinutes: (0, pg_core_1.integer)('order_expiry_minutes').notNull().default(15),
    customFormSchema: (0, pg_core_1.jsonb)('custom_form_schema')
        .$type()
        .default((0, drizzle_orm_1.sql) `'null'::jsonb`),
    metaTitle: (0, pg_core_1.text)('meta_title'),
    metaDescription: (0, pg_core_1.text)('meta_description'),
    tags: (0, pg_core_1.text)('tags').array().default((0, drizzle_orm_1.sql) `'{}'::text[]`),
    registrationCount: (0, pg_core_1.integer)('registration_count').notNull().default(0),
    confirmedCount: (0, pg_core_1.integer)('confirmed_count').notNull().default(0),
    waitlistCount: (0, pg_core_1.integer)('waitlist_count').notNull().default(0),
    reviewCount: (0, pg_core_1.integer)('review_count').notNull().default(0),
    averageRating: (0, pg_core_1.doublePrecision)('average_rating'),
    bookmarkCount: (0, pg_core_1.integer)('bookmark_count').notNull().default(0),
    viewCount: (0, pg_core_1.integer)('view_count').notNull().default(0),
    totalRevenue: (0, pg_core_1.text)('total_revenue').notNull().default('0'),
    netRevenue: (0, pg_core_1.text)('net_revenue').notNull().default('0'),
    publishedAt: (0, pg_core_1.timestamp)('published_at'),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    cancelReason: (0, pg_core_1.text)('cancel_reason'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_events_slug').on(t.slug),
    (0, pg_core_1.index)('idx_events_organizer').on(t.organizerId),
    (0, pg_core_1.index)('idx_events_org').on(t.orgId),
    (0, pg_core_1.index)('idx_events_location').on(t.locationId),
    (0, pg_core_1.index)('idx_events_title_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.title} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_events_desc_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.description} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_events_start_date').on(t.startDate),
    (0, pg_core_1.index)('idx_events_end_date').on(t.endDate),
    (0, pg_core_1.index)('idx_events_pub_start')
        .on(t.startDate)
        .where((0, drizzle_orm_1.sql) `${t.status} = 'published'`),
    (0, pg_core_1.index)('idx_events_pub_future')
        .on(t.status, t.startDate)
        .where((0, drizzle_orm_1.sql) `${t.status} = 'published'`),
    (0, pg_core_1.index)('idx_events_featured')
        .on(t.startDate)
        .where((0, drizzle_orm_1.sql) `${t.featured} = true AND ${t.status} = 'published'`),
    (0, pg_core_1.index)('idx_events_org_status').on(t.orgId, t.status),
    (0, pg_core_1.index)('idx_events_order_expiry').on(t.orderExpiryMinutes),
]);
exports.EventStaffSchema = (0, pg_core_1.pgTable)('event_staff', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    role: (0, pg_core_1.text)('role').notNull().default('co_organizer'),
    canViewRevenue: (0, pg_core_1.boolean)('can_view_revenue').notNull().default(false),
    canIssueRefunds: (0, pg_core_1.boolean)('can_issue_refunds').notNull().default(false),
    canCheckIn: (0, pg_core_1.boolean)('can_check_in').notNull().default(true),
    canEditEvent: (0, pg_core_1.boolean)('can_edit_event').notNull().default(false),
    addedBy: (0, pg_core_1.uuid)('added_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    addedAt: (0, pg_core_1.timestamp)('added_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_event_staff_unique').on(t.eventId, t.userId),
    (0, pg_core_1.index)('idx_event_staff_event').on(t.eventId),
    (0, pg_core_1.index)('idx_event_staff_user').on(t.userId),
]);
exports.EventCategoriesSchema = (0, pg_core_1.pgTable)('event_categories', {
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    categoryId: (0, pg_core_1.integer)('category_id').notNull()
        .references(() => exports.CategoriesSchema.id, { onDelete: 'cascade' }),
}, (t) => [
    (0, pg_core_1.primaryKey)({ columns: [t.eventId, t.categoryId] }),
    (0, pg_core_1.index)('idx_event_cat_category').on(t.categoryId),
]);
exports.EventTagsSchema = (0, pg_core_1.pgTable)('event_tags', {
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    tagId: (0, pg_core_1.text)('tag_id').notNull()
        .references(() => exports.TagsSchema.id, { onDelete: 'cascade' }),
}, (t) => [
    (0, pg_core_1.primaryKey)({ columns: [t.eventId, t.tagId] }),
    (0, pg_core_1.index)('idx_event_tags_tag').on(t.tagId),
]);
exports.EventFaqsSchema = (0, pg_core_1.pgTable)('event_faqs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    question: (0, pg_core_1.text)('question').notNull(),
    answer: (0, pg_core_1.text)('answer').notNull(),
    displayOrder: (0, pg_core_1.smallint)('display_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_faqs_event').on(t.eventId)]);
exports.EventUpdatesSchema = (0, pg_core_1.pgTable)('event_updates', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    authorId: (0, pg_core_1.uuid)('author_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    notifyAttendees: (0, pg_core_1.boolean)('notify_attendees').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_event_updates_event').on(t.eventId)]);
exports.EventPageViewsSchema = (0, pg_core_1.pgTable)('event_page_views', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    sessionId: (0, pg_core_1.text)('session_id'),
    referrer: (0, pg_core_1.text)('referrer'),
    utmSource: (0, pg_core_1.text)('utm_source'),
    utmMedium: (0, pg_core_1.text)('utm_medium'),
    utmCampaign: (0, pg_core_1.text)('utm_campaign'),
    ipCountry: (0, pg_core_1.text)('ip_country'),
    deviceType: (0, pg_core_1.text)('device_type'),
    viewedAt: (0, pg_core_1.timestamp)('viewed_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_page_views_event').on(t.eventId),
    (0, pg_core_1.index)('idx_page_views_event_time').on(t.eventId, t.viewedAt),
    (0, pg_core_1.index)('idx_page_views_viewed_at').on(t.viewedAt),
]);
exports.TicketsSchema = (0, pg_core_1.pgTable)('tickets', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    type: (0, enums_1.ticketTypeEnum)('type').notNull().default('free'),
    basePrice: (0, pg_core_1.text)('base_price').notNull().default('0'),
    currentPrice: (0, pg_core_1.text)('current_price').notNull().default('0'),
    maxPrice: (0, pg_core_1.text)('max_price'),
    dynamicPricing: (0, pg_core_1.boolean)('dynamic_pricing').notNull().default(false),
    minDonation: (0, pg_core_1.text)('min_donation'),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    available: (0, pg_core_1.integer)('available').notNull(),
    maxPerUser: (0, pg_core_1.integer)('max_per_user').notNull().default(1),
    minPerOrder: (0, pg_core_1.integer)('min_per_order').notNull().default(1),
    isHidden: (0, pg_core_1.boolean)('is_hidden').notNull().default(false),
    isTransferable: (0, pg_core_1.boolean)('is_transferable').notNull().default(true),
    saleStartsAt: (0, pg_core_1.timestamp)('sale_starts_at'),
    saleEndsAt: (0, pg_core_1.timestamp)('sale_ends_at'),
    earlyBirdPrice: (0, pg_core_1.text)('early_bird_price'),
    earlyBirdEndsAt: (0, pg_core_1.timestamp)('early_bird_ends_at'),
    earlyBirdQuantity: (0, pg_core_1.integer)('early_bird_quantity'),
    displayOrder: (0, pg_core_1.smallint)('display_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)('idx_tickets_event').on(t.eventId),
    (0, pg_core_1.index)('idx_tickets_active')
        .on(t.eventId)
        .where((0, drizzle_orm_1.sql) `${t.isHidden} = false AND ${t.available} > 0`),
]);
exports.PromoCodesSchema = (0, pg_core_1.pgTable)('promo_codes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => exports.EventsSchema.id, { onDelete: 'cascade' }),
    ticketId: (0, pg_core_1.uuid)('ticket_id')
        .references(() => exports.TicketsSchema.id, { onDelete: 'cascade' }),
    code: (0, pg_core_1.text)('code').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    discountType: (0, pg_core_1.text)('discount_type').notNull().default('percentage'),
    discountValue: (0, pg_core_1.text)('discount_value').notNull(),
    currency: (0, pg_core_1.text)('currency').default('INR'),
    maxUsage: (0, pg_core_1.integer)('max_usage'),
    usageCount: (0, pg_core_1.integer)('usage_count').notNull().default(0),
    maxPerUser: (0, pg_core_1.integer)('max_per_user').notNull().default(1),
    minOrderAmount: (0, pg_core_1.text)('min_order_amount'),
    startsAt: (0, pg_core_1.timestamp)('starts_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdBy: (0, pg_core_1.uuid)('created_by').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_promo_event_code').on(t.eventId, t.code),
    (0, pg_core_1.index)('idx_promo_event').on(t.eventId),
    (0, pg_core_1.index)('idx_promo_code').on(t.code),
]);


/***/ },

/***/ "./libs/database/src/db/schemas/index.ts"
/*!***********************************************!*\
  !*** ./libs/database/src/db/schemas/index.ts ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts"), exports);
__exportStar(__webpack_require__(/*! ./users */ "./libs/database/src/db/schemas/users.ts"), exports);
__exportStar(__webpack_require__(/*! ./organizations */ "./libs/database/src/db/schemas/organizations.ts"), exports);
__exportStar(__webpack_require__(/*! ./events */ "./libs/database/src/db/schemas/events.ts"), exports);
__exportStar(__webpack_require__(/*! ./payments */ "./libs/database/src/db/schemas/payments.ts"), exports);
__exportStar(__webpack_require__(/*! ./analytics */ "./libs/database/src/db/schemas/analytics.ts"), exports);


/***/ },

/***/ "./libs/database/src/db/schemas/organizations.ts"
/*!*******************************************************!*\
  !*** ./libs/database/src/db/schemas/organizations.ts ***!
  \*******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrgSubscriptionsSchema = exports.OrgPayoutAccountsSchema = exports.OrgInvitesSchema = exports.OrgMembersSchema = exports.OrganizationsSchema = void 0;
const drizzle_orm_1 = __webpack_require__(/*! drizzle-orm */ "drizzle-orm");
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
const enums_1 = __webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts");
const users_1 = __webpack_require__(/*! ./users */ "./libs/database/src/db/schemas/users.ts");
exports.OrganizationsSchema = (0, pg_core_1.pgTable)('organizations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    slug: (0, pg_core_1.text)('slug').notNull().unique(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    website: (0, pg_core_1.text)('website'),
    logo: (0, pg_core_1.text)('logo'),
    banner: (0, pg_core_1.text)('banner'),
    contactEmail: (0, pg_core_1.text)('contact_email'),
    contactPhone: (0, pg_core_1.text)('contact_phone'),
    country: (0, pg_core_1.text)('country'),
    city: (0, pg_core_1.text)('city'),
    plan: (0, enums_1.orgPlanEnum)('plan').notNull().default('free'),
    planExpiresAt: (0, pg_core_1.timestamp)('plan_expires_at'),
    verified: (0, pg_core_1.boolean)('verified').notNull().default(false),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    socialLinks: (0, pg_core_1.jsonb)('social_links')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    defaultCurrency: (0, enums_1.currencyEnum)('default_currency').notNull().default('INR'),
    payoutSchedule: (0, enums_1.payoutScheduleEnum)('payout_schedule').notNull().default('manual'),
    featureFlags: (0, pg_core_1.jsonb)('feature_flags')
        .$type()
        .notNull()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_orgs_slug').on(t.slug),
    (0, pg_core_1.index)('idx_orgs_name_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.name} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_orgs_active').on(t.createdAt)
        .where((0, drizzle_orm_1.sql) `${t.deletedAt} IS NULL`),
]);
exports.OrgMembersSchema = (0, pg_core_1.pgTable)('org_members', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => exports.OrganizationsSchema.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    role: (0, enums_1.orgRoleEnum)('role').notNull().default('member'),
    invitedBy: (0, pg_core_1.uuid)('invited_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    customPermissions: (0, pg_core_1.jsonb)('custom_permissions')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').notNull().defaultNow(),
    roleUpdatedAt: (0, pg_core_1.timestamp)('role_updated_at'),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_org_members_unique').on(t.orgId, t.userId),
    (0, pg_core_1.index)('idx_org_members_org').on(t.orgId),
    (0, pg_core_1.index)('idx_org_members_user').on(t.userId),
]);
exports.OrgInvitesSchema = (0, pg_core_1.pgTable)('org_invites', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => exports.OrganizationsSchema.id, { onDelete: 'cascade' }),
    email: (0, pg_core_1.text)('email').notNull(),
    role: (0, enums_1.orgRoleEnum)('role').notNull().default('member'),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    status: (0, enums_1.inviteStatusEnum)('status').notNull().default('pending'),
    invitedBy: (0, pg_core_1.uuid)('invited_by').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    acceptedAt: (0, pg_core_1.timestamp)('accepted_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_org_invites_org').on(t.orgId),
    (0, pg_core_1.index)('idx_org_invites_email').on(t.email),
    (0, pg_core_1.index)('idx_org_invites_token').on(t.token),
]);
exports.OrgPayoutAccountsSchema = (0, pg_core_1.pgTable)('org_payout_accounts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => exports.OrganizationsSchema.id, { onDelete: 'cascade' }),
    gateway: (0, pg_core_1.text)('gateway').notNull(),
    gatewayAccountId: (0, pg_core_1.text)('gateway_account_id').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    isDefault: (0, pg_core_1.boolean)('is_default').notNull().default(false),
    isVerified: (0, pg_core_1.boolean)('is_verified').notNull().default(false),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    maskedDetails: (0, pg_core_1.jsonb)('masked_details')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)('idx_payout_accounts_org').on(t.orgId),
    (0, pg_core_1.uniqueIndex)('idx_payout_accounts_default')
        .on(t.orgId)
        .where((0, drizzle_orm_1.sql) `${t.isDefault} = true`),
]);
exports.OrgSubscriptionsSchema = (0, pg_core_1.pgTable)('org_subscriptions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => exports.OrganizationsSchema.id, { onDelete: 'cascade' }),
    plan: (0, enums_1.orgPlanEnum)('plan').notNull(),
    previousPlan: (0, enums_1.orgPlanEnum)('previous_plan'),
    startsAt: (0, pg_core_1.timestamp)('starts_at').notNull(),
    endsAt: (0, pg_core_1.timestamp)('ends_at'),
    gatewaySubscriptionId: (0, pg_core_1.text)('gateway_subscription_id'),
    amountPaid: (0, pg_core_1.text)('amount_paid'),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_org_subs_org').on(t.orgId)]);


/***/ },

/***/ "./libs/database/src/db/schemas/payments.ts"
/*!**************************************************!*\
  !*** ./libs/database/src/db/schemas/payments.ts ***!
  \**************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaxRulesSchema = exports.PlatformFeeConfigSchema = exports.PayoutsSchema = exports.RefundsSchema = exports.TransactionsSchema = exports.TicketTransfersSchema = exports.RegistrationsSchema = exports.SavedPaymentMethodsSchema = exports.PaymentsSchema = exports.OrderItemsSchema = exports.OrdersSchema = void 0;
const drizzle_orm_1 = __webpack_require__(/*! drizzle-orm */ "drizzle-orm");
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
const enums_1 = __webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts");
const users_1 = __webpack_require__(/*! ./users */ "./libs/database/src/db/schemas/users.ts");
const events_1 = __webpack_require__(/*! ./events */ "./libs/database/src/db/schemas/events.ts");
const organizations_1 = __webpack_require__(/*! ./organizations */ "./libs/database/src/db/schemas/organizations.ts");
exports.OrdersSchema = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderNumber: (0, pg_core_1.text)('order_number').notNull().unique(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'restrict' }),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'restrict' }),
    subtotalAmount: (0, pg_core_1.integer)('subtotal_amount').notNull(),
    discountAmount: (0, pg_core_1.integer)('discount_amount').notNull().default(0),
    taxAmount: (0, pg_core_1.integer)('tax_amount').notNull().default(0),
    platformFeeAmount: (0, pg_core_1.integer)('platform_fee_amount').notNull().default(0),
    totalAmount: (0, pg_core_1.integer)('total_amount').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    promoCodeId: (0, pg_core_1.uuid)('promo_code_id')
        .references(() => events_1.PromoCodesSchema.id, { onDelete: 'set null' }),
    promoCodeSnapshot: (0, pg_core_1.jsonb)('promo_code_snapshot')
        .$type()
        .default((0, drizzle_orm_1.sql) `'null'::jsonb`),
    status: (0, enums_1.paymentStatusEnum)('status').notNull().default('pending'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_orders_number').on(t.orderNumber),
    (0, pg_core_1.index)('idx_orders_user').on(t.userId),
    (0, pg_core_1.index)('idx_orders_event').on(t.eventId),
    (0, pg_core_1.index)('idx_orders_status').on(t.status),
    (0, pg_core_1.index)('idx_orders_event_status_date').on(t.eventId, t.status, t.createdAt),
    (0, pg_core_1.index)('idx_orders_expires').on(t.expiresAt)
        .where((0, drizzle_orm_1.sql) `${t.status} = 'pending'`),
    (0, pg_core_1.index)('idx_orders_expires_status_date').on(t.expiresAt, t.status, t.createdAt)
        .where((0, drizzle_orm_1.sql) `${t.status} IN ('pending', 'processing')`),
]);
exports.OrderItemsSchema = (0, pg_core_1.pgTable)('order_items', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull()
        .references(() => exports.OrdersSchema.id, { onDelete: 'cascade' }),
    ticketId: (0, pg_core_1.uuid)('ticket_id').notNull()
        .references(() => events_1.TicketsSchema.id, { onDelete: 'restrict' }),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    unitPrice: (0, pg_core_1.integer)('unit_price').notNull(),
    totalPrice: (0, pg_core_1.integer)('total_price').notNull(),
    ticketSnapshot: (0, pg_core_1.jsonb)('ticket_snapshot')
        .$type()
        .notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_order_items_order').on(t.orderId),
    (0, pg_core_1.index)('idx_order_items_ticket').on(t.ticketId),
]);
exports.PaymentsSchema = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull()
        .references(() => exports.OrdersSchema.id, { onDelete: 'restrict' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'restrict' }),
    gateway: (0, pg_core_1.text)('gateway').notNull(),
    gatewayPaymentId: (0, pg_core_1.text)('gateway_payment_id').unique(),
    gatewayOrderId: (0, pg_core_1.text)('gateway_order_id'),
    gatewaySignature: (0, pg_core_1.text)('gateway_signature'),
    method: (0, enums_1.paymentMethodTypeEnum)('method').notNull().default('card'),
    status: (0, enums_1.paymentStatusEnum)('status').notNull().default('pending'),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    paymentMethodId: (0, pg_core_1.uuid)('payment_method_id')
        .references(() => exports.SavedPaymentMethodsSchema.id, { onDelete: 'set null' }),
    gatewayResponse: (0, pg_core_1.jsonb)('gateway_response')
        .$type()
        .default((0, drizzle_orm_1.sql) `'null'::jsonb`),
    failureCode: (0, pg_core_1.text)('failure_code'),
    failureMessage: (0, pg_core_1.text)('failure_message'),
    paidAt: (0, pg_core_1.timestamp)('paid_at'),
    failedAt: (0, pg_core_1.timestamp)('failed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.index)('idx_payments_order').on(t.orderId),
    (0, pg_core_1.index)('idx_payments_user').on(t.userId),
    (0, pg_core_1.index)('idx_payments_gateway_id').on(t.gatewayPaymentId),
    (0, pg_core_1.index)('idx_payments_status').on(t.status),
    (0, pg_core_1.index)('idx_payments_created').on(t.createdAt),
]);
exports.SavedPaymentMethodsSchema = (0, pg_core_1.pgTable)('saved_payment_methods', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'cascade' }),
    gateway: (0, pg_core_1.text)('gateway').notNull(),
    gatewayCustomerId: (0, pg_core_1.text)('gateway_customer_id'),
    gatewayMethodToken: (0, pg_core_1.text)('gateway_method_token').notNull(),
    type: (0, enums_1.paymentMethodTypeEnum)('type').notNull(),
    displayLabel: (0, pg_core_1.text)('display_label'),
    brand: (0, pg_core_1.text)('brand'),
    last4: (0, pg_core_1.text)('last_4'),
    expiryMonth: (0, pg_core_1.text)('expiry_month'),
    expiryYear: (0, pg_core_1.text)('expiry_year'),
    isDefault: (0, pg_core_1.boolean)('is_default').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_saved_pm_user').on(t.userId),
    (0, pg_core_1.uniqueIndex)('idx_saved_pm_default')
        .on(t.userId)
        .where((0, drizzle_orm_1.sql) `${t.isDefault} = true`),
]);
exports.RegistrationsSchema = (0, pg_core_1.pgTable)('registrations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull()
        .references(() => exports.OrdersSchema.id, { onDelete: 'restrict' }),
    orderItemId: (0, pg_core_1.uuid)('order_item_id').notNull()
        .references(() => exports.OrderItemsSchema.id, { onDelete: 'restrict' }),
    eventId: (0, pg_core_1.uuid)('event_id').notNull()
        .references(() => events_1.EventsSchema.id, { onDelete: 'restrict' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'restrict' }),
    ticketId: (0, pg_core_1.uuid)('ticket_id').notNull()
        .references(() => events_1.TicketsSchema.id, { onDelete: 'restrict' }),
    status: (0, enums_1.registrationStatusEnum)('status').notNull().default('pending'),
    qrCode: (0, pg_core_1.text)('qr_code').notNull().unique(),
    qrCodeExpiresAt: (0, pg_core_1.timestamp)('qr_code_expires_at'),
    checkedIn: (0, pg_core_1.boolean)('checked_in').notNull().default(false),
    checkedInAt: (0, pg_core_1.timestamp)('checked_in_at'),
    checkedInBy: (0, pg_core_1.uuid)('checked_in_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    formAnswers: (0, pg_core_1.jsonb)('form_answers')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    waitlistPosition: (0, pg_core_1.integer)('waitlist_position'),
    originalUserId: (0, pg_core_1.uuid)('original_user_id')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    transferredAt: (0, pg_core_1.timestamp)('transferred_at'),
    transferredFrom: (0, pg_core_1.uuid)('transferred_from')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    cancelledAt: (0, pg_core_1.timestamp)('cancelled_at'),
    cancelReason: (0, pg_core_1.text)('cancel_reason'),
    registeredAt: (0, pg_core_1.timestamp)('registered_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_regs_order').on(t.orderId),
    (0, pg_core_1.index)('idx_regs_event').on(t.eventId),
    (0, pg_core_1.index)('idx_regs_user').on(t.userId),
    (0, pg_core_1.index)('idx_regs_ticket').on(t.ticketId),
    (0, pg_core_1.index)('idx_regs_qr').on(t.qrCode),
    (0, pg_core_1.uniqueIndex)('idx_regs_qr_unique').on(t.qrCode),
    (0, pg_core_1.index)('idx_regs_event_status').on(t.eventId, t.status),
    (0, pg_core_1.index)('idx_regs_user_event_confirmed')
        .on(t.userId, t.eventId)
        .where((0, drizzle_orm_1.sql) `${t.status} = 'confirmed'`),
    (0, pg_core_1.index)('idx_regs_waitlist')
        .on(t.eventId, t.waitlistPosition)
        .where((0, drizzle_orm_1.sql) `${t.status} = 'waitlisted'`),
]);
exports.TicketTransfersSchema = (0, pg_core_1.pgTable)('ticket_transfers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    registrationId: (0, pg_core_1.uuid)('registration_id').notNull()
        .references(() => exports.RegistrationsSchema.id, { onDelete: 'cascade' }),
    fromUserId: (0, pg_core_1.uuid)('from_user_id').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'restrict' }),
    toUserId: (0, pg_core_1.uuid)('to_user_id')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    toEmail: (0, pg_core_1.text)('to_email'),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    message: (0, pg_core_1.text)('message'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    acceptedAt: (0, pg_core_1.timestamp)('accepted_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_transfers_registration').on(t.registrationId),
    (0, pg_core_1.index)('idx_transfers_from').on(t.fromUserId),
    (0, pg_core_1.index)('idx_transfers_to').on(t.toUserId),
]);
exports.TransactionsSchema = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    paymentId: (0, pg_core_1.uuid)('payment_id')
        .references(() => exports.PaymentsSchema.id, { onDelete: 'restrict' }),
    orderId: (0, pg_core_1.uuid)('order_id')
        .references(() => exports.OrdersSchema.id, { onDelete: 'restrict' }),
    refundId: (0, pg_core_1.uuid)('refund_id'),
    payoutId: (0, pg_core_1.uuid)('payout_id'),
    type: (0, enums_1.transactionTypeEnum)('type').notNull(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    userId: (0, pg_core_1.uuid)('user_id')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'set null' }),
    eventId: (0, pg_core_1.uuid)('event_id')
        .references(() => events_1.EventsSchema.id, { onDelete: 'set null' }),
    description: (0, pg_core_1.text)('description'),
    externalRef: (0, pg_core_1.text)('external_ref'),
    metadata: (0, pg_core_1.jsonb)('metadata')
        .$type()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_txn_payment').on(t.paymentId),
    (0, pg_core_1.index)('idx_txn_order').on(t.orderId),
    (0, pg_core_1.index)('idx_txn_type').on(t.type),
    (0, pg_core_1.index)('idx_txn_user').on(t.userId),
    (0, pg_core_1.index)('idx_txn_org').on(t.orgId),
    (0, pg_core_1.index)('idx_txn_event').on(t.eventId),
    (0, pg_core_1.index)('idx_txn_created').on(t.createdAt),
    (0, pg_core_1.index)('idx_txn_org_date').on(t.orgId, t.createdAt),
]);
exports.RefundsSchema = (0, pg_core_1.pgTable)('refunds', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull()
        .references(() => exports.OrdersSchema.id, { onDelete: 'restrict' }),
    paymentId: (0, pg_core_1.uuid)('payment_id').notNull()
        .references(() => exports.PaymentsSchema.id, { onDelete: 'restrict' }),
    initiatedBy: (0, pg_core_1.uuid)('initiated_by').notNull()
        .references(() => users_1.UsersSchema.id, { onDelete: 'restrict' }),
    reason: (0, enums_1.refundReasonEnum)('reason').notNull(),
    notes: (0, pg_core_1.text)('notes'),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    gateway: (0, pg_core_1.text)('gateway').notNull(),
    gatewayRefundId: (0, pg_core_1.text)('gateway_refund_id').unique(),
    status: (0, enums_1.paymentStatusEnum)('status').notNull().default('pending'),
    registrationId: (0, pg_core_1.uuid)('registration_id')
        .references(() => exports.RegistrationsSchema.id, { onDelete: 'restrict' }),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    failedAt: (0, pg_core_1.timestamp)('failed_at'),
    failureReason: (0, pg_core_1.text)('failure_reason'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_refunds_order').on(t.orderId),
    (0, pg_core_1.index)('idx_refunds_payment').on(t.paymentId),
    (0, pg_core_1.index)('idx_refunds_status').on(t.status),
    (0, pg_core_1.index)('idx_refunds_created').on(t.createdAt),
]);
exports.PayoutsSchema = (0, pg_core_1.pgTable)('payouts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id').notNull()
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'restrict' }),
    eventId: (0, pg_core_1.uuid)('event_id')
        .references(() => events_1.EventsSchema.id, { onDelete: 'restrict' }),
    payoutAccountId: (0, pg_core_1.uuid)('payout_account_id').notNull()
        .references(() => organizations_1.OrgPayoutAccountsSchema.id, { onDelete: 'restrict' }),
    grossAmount: (0, pg_core_1.integer)('gross_amount').notNull(),
    platformFee: (0, pg_core_1.integer)('platform_fee').notNull(),
    refundsDeducted: (0, pg_core_1.integer)('refunds_deducted').notNull().default(0),
    taxDeducted: (0, pg_core_1.integer)('tax_deducted').notNull().default(0),
    netAmount: (0, pg_core_1.integer)('net_amount').notNull(),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    status: (0, enums_1.payoutStatusEnum)('status').notNull().default('scheduled'),
    gateway: (0, pg_core_1.text)('gateway').notNull(),
    gatewayPayoutId: (0, pg_core_1.text)('gateway_payout_id').unique(),
    gatewayResponse: (0, pg_core_1.jsonb)('gateway_response')
        .$type()
        .default((0, drizzle_orm_1.sql) `'null'::jsonb`),
    scheduledAt: (0, pg_core_1.timestamp)('scheduled_at').notNull(),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    failedAt: (0, pg_core_1.timestamp)('failed_at'),
    failureReason: (0, pg_core_1.text)('failure_reason'),
    reversedAt: (0, pg_core_1.timestamp)('reversed_at'),
    reversalReason: (0, pg_core_1.text)('reversal_reason'),
    initiatedBy: (0, pg_core_1.uuid)('initiated_by')
        .references(() => users_1.UsersSchema.id, { onDelete: 'set null' }),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_payouts_org').on(t.orgId),
    (0, pg_core_1.index)('idx_payouts_event').on(t.eventId),
    (0, pg_core_1.index)('idx_payouts_status').on(t.status),
    (0, pg_core_1.index)('idx_payouts_scheduled').on(t.scheduledAt),
    (0, pg_core_1.index)('idx_payouts_created').on(t.createdAt),
]);
exports.PlatformFeeConfigSchema = (0, pg_core_1.pgTable)('platform_fee_config', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    orgId: (0, pg_core_1.uuid)('org_id')
        .references(() => organizations_1.OrganizationsSchema.id, { onDelete: 'cascade' }),
    feeRateBps: (0, pg_core_1.integer)('fee_rate_bps').notNull().default(500),
    feeFixedAmount: (0, pg_core_1.integer)('fee_fixed_amount').notNull().default(0),
    feeCap: (0, pg_core_1.integer)('fee_cap'),
    validFrom: (0, pg_core_1.timestamp)('valid_from').notNull().defaultNow(),
    validUntil: (0, pg_core_1.timestamp)('valid_until'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_fee_config_org').on(t.orgId),
    (0, pg_core_1.index)('idx_fee_config_valid').on(t.orgId, t.validFrom),
]);
exports.TaxRulesSchema = (0, pg_core_1.pgTable)('tax_rules', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    country: (0, pg_core_1.text)('country').notNull(),
    state: (0, pg_core_1.text)('state'),
    taxType: (0, pg_core_1.text)('tax_type').notNull(),
    rateBps: (0, pg_core_1.integer)('rate_bps').notNull(),
    appliesTo: (0, pg_core_1.text)('applies_to').notNull().default('paid'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    effectiveFrom: (0, pg_core_1.timestamp)('effective_from').notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_tax_country_state').on(t.country, t.state),
]);


/***/ },

/***/ "./libs/database/src/db/schemas/users.ts"
/*!***********************************************!*\
  !*** ./libs/database/src/db/schemas/users.ts ***!
  \***********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserSettingsSchema = exports.VerificationTokensSchema = exports.SessionsSchema = exports.BackupCodesSchema = exports.TwoFactorAuthSchema = exports.UserCredentialsSchema = exports.AuthProvidersSchema = exports.AccountsSchema = exports.UsersSchema = void 0;
const drizzle_orm_1 = __webpack_require__(/*! drizzle-orm */ "drizzle-orm");
const pg_core_1 = __webpack_require__(/*! drizzle-orm/pg-core */ "drizzle-orm/pg-core");
const enums_1 = __webpack_require__(/*! ./enums */ "./libs/database/src/db/schemas/enums.ts");
exports.UsersSchema = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    username: (0, pg_core_1.text)('username').notNull().unique(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    profilePicture: (0, pg_core_1.text)('profile_picture'),
    coverImage: (0, pg_core_1.text)('cover_image'),
    bio: (0, pg_core_1.text)('bio'),
    website: (0, pg_core_1.text)('website').array().notNull().default((0, drizzle_orm_1.sql) `'{}'::text[]`),
    publicKey: (0, pg_core_1.text)('public_key'),
    publicKeyFingerprint: (0, pg_core_1.text)('public_key_fingerprint'),
    isPrivate: (0, pg_core_1.boolean)('is_private').notNull().default(false),
    isVerified: (0, pg_core_1.boolean)('is_verified').notNull().default(false),
    isBanned: (0, pg_core_1.boolean)('is_banned').notNull().default(false),
    bannedAt: (0, pg_core_1.timestamp)('banned_at'),
    bannedReason: (0, pg_core_1.text)('banned_reason'),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_users_username').on(t.username),
    (0, pg_core_1.uniqueIndex)('idx_users_email').on(t.email),
    (0, pg_core_1.index)('idx_users_name_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.name} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_users_username_trgm').using('gin', (0, drizzle_orm_1.sql) `${t.username} gin_trgm_ops`),
    (0, pg_core_1.index)('idx_users_active').on(t.createdAt).where((0, drizzle_orm_1.sql) `${t.deletedAt} IS NULL AND ${t.isBanned} = false`),
]);
exports.AccountsSchema = (0, pg_core_1.pgTable)('accounts', {
    userId: (0, pg_core_1.uuid)('user_id').notNull().primaryKey()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    roles: (0, enums_1.accountRoleEnum)('roles').array().notNull()
        .default((0, drizzle_orm_1.sql) `ARRAY['user']::account_role[]`),
    latitude: (0, pg_core_1.text)('latitude'),
    longitude: (0, pg_core_1.text)('longitude'),
    city: (0, pg_core_1.text)('city'),
    country: (0, pg_core_1.text)('country'),
    locale: (0, pg_core_1.text)('locale').notNull().default('en'),
    timeZone: (0, pg_core_1.text)('time_zone').notNull().default('UTC'),
    phone: (0, pg_core_1.text)('phone'),
    phoneCountryCode: (0, pg_core_1.text)('phone_cc'),
    phoneVerified: (0, pg_core_1.boolean)('phone_verified').notNull().default(false),
    privateKey: (0, pg_core_1.text)('private_key'),
    locked: (0, pg_core_1.boolean)('locked').notNull().default(false),
    lockedReason: (0, pg_core_1.text)('locked_reason'),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$onUpdate(() => new Date()),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.AuthProvidersSchema = (0, pg_core_1.pgTable)('auth_providers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    provider: (0, enums_1.authProviderEnum)('provider').notNull(),
    providerUserId: (0, pg_core_1.text)('provider_user_id').notNull(),
    providerEmail: (0, pg_core_1.text)('provider_email'),
    accessToken: (0, pg_core_1.text)('access_token'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    tokenExpiresAt: (0, pg_core_1.timestamp)('token_expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.uniqueIndex)('idx_auth_provider_unique').on(t.provider, t.providerUserId),
    (0, pg_core_1.index)('idx_auth_providers_user').on(t.userId),
]);
exports.UserCredentialsSchema = (0, pg_core_1.pgTable)('user_credentials', {
    userId: (0, pg_core_1.uuid)('user_id').notNull().primaryKey()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    salt: (0, pg_core_1.text)('salt').notNull(),
    algorithm: (0, pg_core_1.text)('algorithm').notNull().default('argon2id'),
    lastChangedAt: (0, pg_core_1.timestamp)('last_changed_at').notNull().defaultNow(),
    mustReset: (0, pg_core_1.boolean)('must_reset').notNull().default(false),
});
exports.TwoFactorAuthSchema = (0, pg_core_1.pgTable)('two_factor_auth', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    method: (0, enums_1.twoFactorMethodEnum)('method').notNull(),
    secret: (0, pg_core_1.text)('secret'),
    isEnabled: (0, pg_core_1.boolean)('is_enabled').notNull().default(false),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_2fa_user').on(t.userId),
    (0, pg_core_1.uniqueIndex)('idx_2fa_user_method').on(t.userId, t.method),
]);
exports.BackupCodesSchema = (0, pg_core_1.pgTable)('backup_codes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    codeHash: (0, pg_core_1.text)('code_hash').notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('idx_backup_codes_user').on(t.userId)]);
exports.SessionsSchema = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    sessionToken: (0, pg_core_1.text)('session_token').notNull().unique(),
    refreshToken: (0, pg_core_1.text)('refresh_token').unique(),
    deviceName: (0, pg_core_1.text)('device_name'),
    deviceType: (0, pg_core_1.text)('device_type'),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    country: (0, pg_core_1.text)('country'),
    isTrusted: (0, pg_core_1.boolean)('is_trusted').notNull().default(false),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at').defaultNow(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_sessions_user').on(t.userId),
    (0, pg_core_1.index)('idx_sessions_expires').on(t.expiresAt),
    (0, pg_core_1.index)('idx_sessions_user_active')
        .on(t.userId)
        .where((0, drizzle_orm_1.sql) `${t.revokedAt} IS NULL`),
]);
exports.VerificationTokensSchema = (0, pg_core_1.pgTable)('verification_tokens', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    type: (0, pg_core_1.text)('type').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('idx_vtokens_user').on(t.userId),
    (0, pg_core_1.index)('idx_vtokens_expires').on(t.expiresAt),
]);
exports.UserSettingsSchema = (0, pg_core_1.pgTable)('user_settings', {
    userId: (0, pg_core_1.uuid)('user_id').notNull().primaryKey()
        .references(() => exports.UsersSchema.id, { onDelete: 'cascade' }),
    theme: (0, enums_1.userThemeEnum)('theme').notNull().default('system'),
    language: (0, pg_core_1.text)('language').notNull().default('en'),
    currency: (0, enums_1.currencyEnum)('currency').notNull().default('INR'),
    emailNotifications: (0, pg_core_1.boolean)('email_notifications').notNull().default(true),
    pushNotifications: (0, pg_core_1.boolean)('push_notifications').notNull().default(true),
    smsNotifications: (0, pg_core_1.boolean)('sms_notifications').notNull().default(false),
    marketingEmails: (0, pg_core_1.boolean)('marketing_emails').notNull().default(false),
    notifPreferences: (0, pg_core_1.jsonb)('notif_preferences')
        .$type()
        .notNull()
        .default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
});


/***/ },

/***/ "./libs/database/src/index.ts"
/*!************************************!*\
  !*** ./libs/database/src/index.ts ***!
  \************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./database.module */ "./libs/database/src/database.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./database.service */ "./libs/database/src/database.service.ts"), exports);


/***/ },

/***/ "@nestjs/common"
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/common");

/***/ },

/***/ "@nestjs/config"
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/config");

/***/ },

/***/ "@nestjs/core"
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
(module) {

module.exports = require("@nestjs/core");

/***/ },

/***/ "@nestjs/microservices"
/*!****************************************!*\
  !*** external "@nestjs/microservices" ***!
  \****************************************/
(module) {

module.exports = require("@nestjs/microservices");

/***/ },

/***/ "drizzle-orm"
/*!******************************!*\
  !*** external "drizzle-orm" ***!
  \******************************/
(module) {

module.exports = require("drizzle-orm");

/***/ },

/***/ "drizzle-orm/node-postgres"
/*!********************************************!*\
  !*** external "drizzle-orm/node-postgres" ***!
  \********************************************/
(module) {

module.exports = require("drizzle-orm/node-postgres");

/***/ },

/***/ "drizzle-orm/pg-core"
/*!**************************************!*\
  !*** external "drizzle-orm/pg-core" ***!
  \**************************************/
(module) {

module.exports = require("drizzle-orm/pg-core");

/***/ },

/***/ "pg"
/*!*********************!*\
  !*** external "pg" ***!
  \*********************/
(module) {

module.exports = require("pg");

/***/ },

/***/ "rxjs"
/*!***********************!*\
  !*** external "rxjs" ***!
  \***********************/
(module) {

module.exports = require("rxjs");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

module.exports = require("child_process");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

module.exports = require("path");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**************************************!*\
  !*** ./apps/api-gateway/src/main.ts ***!
  \**************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const api_gateway_module_1 = __webpack_require__(/*! ./api-gateway.module */ "./apps/api-gateway/src/api-gateway.module.ts");
async function bootstrap() {
    const app = await core_1.NestFactory.create(api_gateway_module_1.ApiGatewayModule);
    await app.listen(process.env.API_GATEWAY_PORT ?? 3001);
}
bootstrap();

})();

/******/ })()
;