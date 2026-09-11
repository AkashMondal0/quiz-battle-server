import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  QuizBattleService,
} from './quiz-battle-service.service';

import {
  ZodValidationPipe,
} from 'libs/pipes/ZodValidationPipe';

import {
  CreateRoomSchema,
  RoomHostSchema,
  type CreateRoomInput,
} from './dto/CreateRoomDto';

@Controller()
export class QuizBattleServiceController {
  constructor(
    private readonly quizBattleService:
      QuizBattleService,
  ) {}

  // ============================================================
  // GET ROOM
  // ============================================================

  @Get(
    'rooms/:roomId',
  )
  async getRoom(
    @Param('roomId')
    roomId: string,
  ) {
    console.log(
      'QuizBattleServiceController.getRoom',
      roomId,
    );
    const session =
      await this.quizBattleService
        .getRoom(
          roomId,
        );

    return this.quizBattleService
      .createRoomState(
        session,
      );
  }

  // ============================================================
  // CREATE ROOM
  // ============================================================

  // @Post(
  //   'create-room',
  // )
  // async createRoom(
  //   @Body(
  //     new ZodValidationPipe(
  //       CreateRoomSchema,
  //     ),
  //   )
  //   body: CreateRoomInput,
  // ) {
  //   return this.quizBattleService
  //     .createRoom(
  //       body,
  //     );
  // }

  // ============================================================
  // JOIN ROOM
  // ============================================================

  // @Patch(
  //   'join-room/:roomId',
  // )
  // async joinRoom(
  //   @Param('roomId')
  //   roomId: string,

  //   @Body(
  //     new ZodValidationPipe(
  //       RoomHostSchema,
  //     ),
  //   )
  //   body: CreateRoomInput['host'],
  // ) {
  //   return this.quizBattleService
  //     .joinRoom(
  //       roomId,
  //       {
  //         userId:
  //           body.userId,

  //         username:
  //           body.username,

  //         avatar:
  //           body.avatar,

  //         avatarId:
  //           body.avatarId,
  //       },
  //     );
  // }

  // ============================================================
  // LEAVE
  // ============================================================

  @Patch(
    'leave-room/:roomId/:userId',
  )
  async leaveRoom(
    @Param('roomId')
    roomId: string,

    @Param('userId')
    userId: string,
  ) {
    return this.quizBattleService
      .leaveRoom(
        roomId,
        userId,
      );
  }
}