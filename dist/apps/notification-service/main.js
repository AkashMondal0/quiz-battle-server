/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/notification-service/src/notification-service.controller.ts"
/*!**************************************************************************!*\
  !*** ./apps/notification-service/src/notification-service.controller.ts ***!
  \**************************************************************************/
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationServiceController = void 0;
const notification_patterns_1 = __webpack_require__(/*! @app/config/patterns/notification-patterns */ "./libs/config/src/patterns/notification-patterns.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
let NotificationServiceController = class NotificationServiceController {
    async handleEventCreated(data) {
        console.log('Received:', data);
        return {
            success: true,
            data,
            message: 'Event processed successfully',
        };
    }
};
exports.NotificationServiceController = NotificationServiceController;
__decorate([
    (0, microservices_1.MessagePattern)(notification_patterns_1.NOTIFICATION_PATTERNS.EVENT_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationServiceController.prototype, "handleEventCreated", null);
exports.NotificationServiceController = NotificationServiceController = __decorate([
    (0, common_1.Controller)()
], NotificationServiceController);


/***/ },

/***/ "./apps/notification-service/src/notification-service.module.ts"
/*!**********************************************************************!*\
  !*** ./apps/notification-service/src/notification-service.module.ts ***!
  \**********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationServiceModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const notification_service_controller_1 = __webpack_require__(/*! ./notification-service.controller */ "./apps/notification-service/src/notification-service.controller.ts");
const notification_service_service_1 = __webpack_require__(/*! ./notification-service.service */ "./apps/notification-service/src/notification-service.service.ts");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
let NotificationServiceModule = class NotificationServiceModule {
};
exports.NotificationServiceModule = NotificationServiceModule;
exports.NotificationServiceModule = NotificationServiceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: 'NOTIFICATION_SERVICE',
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: 'localhost',
                        port: 3400,
                    },
                },
            ])
        ],
        controllers: [notification_service_controller_1.NotificationServiceController],
        providers: [notification_service_service_1.NotificationServiceService],
    })
], NotificationServiceModule);


/***/ },

/***/ "./apps/notification-service/src/notification-service.service.ts"
/*!***********************************************************************!*\
  !*** ./apps/notification-service/src/notification-service.service.ts ***!
  \***********************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationServiceService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
let NotificationServiceService = class NotificationServiceService {
    getHello() {
        return 'Hello World! Notification';
    }
};
exports.NotificationServiceService = NotificationServiceService;
exports.NotificationServiceService = NotificationServiceService = __decorate([
    (0, common_1.Injectable)()
], NotificationServiceService);


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

/***/ "@nestjs/common"
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
(module) {

module.exports = require("@nestjs/common");

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
/*!***********************************************!*\
  !*** ./apps/notification-service/src/main.ts ***!
  \***********************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const microservices_1 = __webpack_require__(/*! @nestjs/microservices */ "@nestjs/microservices");
const notification_service_module_1 = __webpack_require__(/*! ./notification-service.module */ "./apps/notification-service/src/notification-service.module.ts");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(notification_service_module_1.NotificationServiceModule);
    app.connectMicroservice({
        transport: microservices_1.Transport.TCP,
        options: {
            host: '0.0.0.0',
            port: Number(process.env.NOTIFICATION_SERVICE_MICROSERVICE_PORT ?? 3400),
        },
    });
    await app.startAllMicroservices();
    await app.listen(Number(process.env.NOTIFICATION_SERVICE_APP_PORT ?? 3004));
    common_1.Logger.log(`🌐 Notification Service HTTP running on port ${process.env.NOTIFICATION_SERVICE_APP_PORT ?? 3004}`);
    common_1.Logger.log(`🔌 Notification Service TCP running on port ${process.env.NOTIFICATION_SERVICE_MICROSERVICE_PORT ?? 3400}`);
}
bootstrap();

})();

/******/ })()
;