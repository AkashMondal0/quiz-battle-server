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

export default MICRO_SERVICES_CONFIGS;
