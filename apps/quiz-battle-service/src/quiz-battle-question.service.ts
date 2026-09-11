import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RoomQuestion,
  RoomSession,
} from './interface/room-session.interface';

@Injectable()
export class QuizBattleQuestionService {
  /**
   * Demo questions.
   *
   * In production:
   *
   * PostgreSQL / Drizzle
   *        ↓
   * QuestionRepository
   *        ↓
   * this service
   */
  private readonly questionBank: RoomQuestion[] = [
    {
      id: 'q1',
      question: 'What is the capital of India?',
      options: [
        'Mumbai',
        'New Delhi',
        'Kolkata',
        'Chennai',
      ],
      correctAnswerIndex: 1,
      category: 'Geography',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q2',
      question: 'Which planet is known as the Red Planet?',
      options: [
        'Earth',
        'Venus',
        'Mars',
        'Jupiter',
      ],
      correctAnswerIndex: 2,
      category: 'Science',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q3',
      question: 'What does CPU stand for?',
      options: [
        'Central Processing Unit',
        'Computer Personal Unit',
        'Central Program Utility',
        'Core Processing Utility',
      ],
      correctAnswerIndex: 0,
      category: 'Technology',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q4',
      question: 'Which language is primarily used with NestJS?',
      options: [
        'Python',
        'TypeScript',
        'Java',
        'C++',
      ],
      correctAnswerIndex: 1,
      category: 'Technology',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q5',
      question: 'How many continents are there?',
      options: [
        '5',
        '6',
        '7',
        '8',
      ],
      correctAnswerIndex: 2,
      category: 'Geography',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q6',
      question: 'Which data structure uses FIFO?',
      options: [
        'Stack',
        'Queue',
        'Tree',
        'Graph',
      ],
      correctAnswerIndex: 1,
      category: 'Computer Science',
      difficulty: 'MEDIUM',
      timeLimitSeconds: 15,
    },

    {
      id: 'q7',
      question: 'What is 12 × 12?',
      options: [
        '124',
        '132',
        '144',
        '154',
      ],
      correctAnswerIndex: 2,
      category: 'Mathematics',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q8',
      question: 'Which protocol is commonly used by Socket.IO?',
      options: [
        'WebSocket',
        'FTP',
        'SMTP',
        'SSH',
      ],
      correctAnswerIndex: 0,
      category: 'Technology',
      difficulty: 'MEDIUM',
      timeLimitSeconds: 15,
    },

    {
      id: 'q9',
      question: 'Which database is relational?',
      options: [
        'Redis',
        'PostgreSQL',
        'MongoDB',
        'Neo4j',
      ],
      correctAnswerIndex: 1,
      category: 'Database',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },

    {
      id: 'q10',
      question: 'What does HTTP stand for?',
      options: [
        'HyperText Transfer Protocol',
        'High Transfer Text Protocol',
        'Hyper Transfer Terminal Protocol',
        'Host Transfer Text Process',
      ],
      correctAnswerIndex: 0,
      category: 'Networking',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
    },
  ];

  async loadQuestions(
    session: RoomSession,
  ): Promise<RoomQuestion[]> {
    const requested =
      session.room.numberOfQuestions;

    if (this.questionBank.length === 0) {
      throw new NotFoundException(
        'No questions available',
      );
    }

    const shuffled =
      [...this.questionBank].sort(
        () => Math.random() - 0.5,
      );

    const questions =
      shuffled.slice(
        0,
        Math.min(
          requested,
          shuffled.length,
        ),
      );

    /**
     * Adjust question time according
     * to the room if needed.
     *
     * Here the question bank controls
     * the time.
     */
    return questions.map(
      question => ({
        ...question,

        options: [
          ...question.options,
        ],
      }),
    );
  }

  getQuestion(
    session: RoomSession,
    questionId: string,
  ): RoomQuestion | null {
    return (
      session.questions.find(
        question =>
          question.id === questionId,
      ) ?? null
    );
  }
}