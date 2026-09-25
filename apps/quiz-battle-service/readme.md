quiz-battle-server/
│
├── src/
│   │
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── env.schema.ts
│   │   ├── configuration.ts
│   │   └── constants.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ws-auth.guard.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── ws-exception.filter.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   │
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts
│   │   │
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── socket.types.ts
│   │   │   └── common.types.ts
│   │   │
│   │   └── utils/
│   │       ├── pagination.ts
│   │       ├── errors.ts
│   │       └── crypto.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   ├── drizzle/
│   │   │   └── index.ts
│   │   └── schema/
│   │       ├── users.schema.ts
│   │       ├── refresh-tokens.schema.ts
│   │       ├── rooms.schema.ts
│   │       ├── room-members.schema.ts
│   │       ├── matches.schema.ts
│   │       ├── questions.schema.ts
│   │       ├── match-questions.schema.ts
│   │       ├── answers.schema.ts
│   │       ├── rankings.schema.ts
│   │       ├── chat-messages.schema.ts
│   │       ├── notifications.schema.ts
│   │       └── index.ts
│   │
│   ├── redis/
│   │   ├── redis.module.ts
│   │   ├── redis.service.ts
│   │   ├── redis.keys.ts
│   │   └── redis.types.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── access-token.strategy.ts
│   │   │   └── refresh-token.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── schemas/
│   │       └── auth.schemas.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── schemas/
│   │
│   ├── rooms/
│   │   ├── rooms.module.ts
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts
│   │   ├── rooms.repository.ts
│   │   ├── rooms.gateway.ts
│   │   ├── room-state.service.ts
│   │   ├── room-presence.service.ts
│   │   ├── dto/
│   │   └── schemas/
│   │
│   ├── matches/
│   │   ├── matches.module.ts
│   │   ├── matches.controller.ts
│   │   ├── matches.service.ts
│   │   ├── matches.repository.ts
│   │   ├── match-engine.service.ts
│   │   ├── match-state.service.ts
│   │   ├── answer.service.ts
│   │   ├── scoring.service.ts
│   │   ├── ranking.service.ts
│   │   ├── matches.gateway.ts
│   │   ├── dto/
│   │   └── schemas/
│   │
│   ├── questions/
│   │   ├── questions.module.ts
│   │   ├── questions.controller.ts
│   │   ├── questions.service.ts
│   │   ├── questions.repository.ts
│   │   └── schemas/
│   │
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   ├── ai-provider.interface.ts
│   │   ├── providers/
│   │   │   ├── openai.provider.ts
│   │   │   └── ...
│   │   ├── ai-question.service.ts
│   │   └── schemas/
│   │
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.service.ts
│   │   ├── chat.repository.ts
│   │   ├── chat.gateway.ts
│   │   └── schemas/
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.repository.ts
│   │   └── schemas/
│   │
│   ├── leaderboard/
│   │   ├── leaderboard.module.ts
│   │   ├── leaderboard.controller.ts
│   │   ├── leaderboard.service.ts
│   │   └── leaderboard.repository.ts
│   │
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   │
│   └── admin/
│       ├── admin.module.ts
│       ├── admin.controller.ts
│       └── admin.service.ts
│
├── drizzle/
│   └── migrations/
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── postgres/
│   └── redis/
│
├── .env
├── .env.example
├── drizzle.config.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md