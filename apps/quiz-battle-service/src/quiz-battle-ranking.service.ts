import { Injectable } from '@nestjs/common';

import {
  RankingUser,
  RoomRanking,
  RoomSession,
} from './interface/room-session.interface';

@Injectable()
export class QuizBattleRankingService {
  updateRanking(
    session: RoomSession,
  ): void {
    const users =
      [...session.users.values()]
        .filter(
          user =>
            user.status !== 'LEFT',
        )
        .sort(
          (a, b) => {
            if (
              b.score !== a.score
            ) {
              return (
                b.score - a.score
              );
            }

            if (
              b.correctAnswers !==
              a.correctAnswers
            ) {
              return (
                b.correctAnswers -
                a.correctAnswers
              );
            }

            if (
              b.answeredQuestions !==
              a.answeredQuestions
            ) {
              return (
                b.answeredQuestions -
                a.answeredQuestions
              );
            }

            return (
              a.joinedAt -
              b.joinedAt
            );
          },
        );

    const rankings =
      users.map(
        (
          user,
          index,
        ): RankingUser => {
          user.rank =
            index + 1;

          return {
            userId:
              user.userId,

            username:
              user.username,

            avatar:
              user.profilePicture,

            avatarId:
              user.avatarId,

            score:
              user.score,

            correctAnswers:
              user.correctAnswers,

            answeredQuestions:
              user.answeredQuestions,

            rank:
              user.rank,

            status:
              user.status,
          };
        },
      );

    session.ranking = {
      roomId:
        session.room.roomId,

      rankings,

      updatedAt:
        Date.now(),
    };
  }

  getRanking(
    session: RoomSession,
  ): RoomRanking {
    return session.ranking;
  }
}