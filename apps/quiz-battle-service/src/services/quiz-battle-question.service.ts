import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomQuestion, RoomSession } from '../interface/room-session.interface';

@Injectable()
export class QuizBattleQuestionService {
  private readonly questionBank: RoomQuestion[] = [
    {
      id: 'q1',
      question: 'What is the capital of India?',
      options: [
        { id: 'q1-a', text: 'Mumbai' },
        { id: 'q1-b', text: 'New Delhi' },
        { id: 'q1-c', text: 'Kolkata' },
        { id: 'q1-d', text: 'Chennai' },
      ],
      correctOptionId: 'q1-b',
      topic: 'Geography',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q2',
      question: 'Which planet is known as the Red Planet?',
      options: [
        { id: 'q2-a', text: 'Earth' },
        { id: 'q2-b', text: 'Venus' },
        { id: 'q2-c', text: 'Mars' },
        { id: 'q2-d', text: 'Jupiter' },
      ],
      correctOptionId: 'q2-c',
      topic: 'Science',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q3',
      question: 'What does CPU stand for?',
      options: [
        { id: 'q3-a', text: 'Central Processing Unit' },
        { id: 'q3-b', text: 'Computer Personal Unit' },
        { id: 'q3-c', text: 'Central Program Utility' },
        { id: 'q3-d', text: 'Core Processing Utility' },
      ],
      correctOptionId: 'q3-a',
      topic: 'Technology',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q4',
      question: 'Which language is primarily used with NestJS?',
      options: [
        { id: 'q4-a', text: 'Python' },
        { id: 'q4-b', text: 'TypeScript' },
        { id: 'q4-c', text: 'Java' },
        { id: 'q4-d', text: 'C++' },
      ],
      correctOptionId: 'q4-b',
      topic: 'Technology',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q5',
      question: 'How many continents are there?',
      options: [
        { id: 'q5-a', text: '5' },
        { id: 'q5-b', text: '6' },
        { id: 'q5-c', text: '7' },
        { id: 'q5-d', text: '8' },
      ],
      correctOptionId: 'q5-c',
      topic: 'Geography',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q6',
      question: 'Which data structure uses FIFO?',
      options: [
        { id: 'q6-a', text: 'Stack' },
        { id: 'q6-b', text: 'Queue' },
        { id: 'q6-c', text: 'Tree' },
        { id: 'q6-d', text: 'Graph' },
      ],
      correctOptionId: 'q6-b',
      topic: 'Computer Science',
      difficulty: 'MEDIUM',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q7',
      question: 'What is 12 × 12?',
      options: [
        { id: 'q7-a', text: '124' },
        { id: 'q7-b', text: '132' },
        { id: 'q7-c', text: '144' },
        { id: 'q7-d', text: '154' },
      ],
      correctOptionId: 'q7-c',
      topic: 'Mathematics',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q8',
      question: 'Which protocol is commonly used by Socket.IO?',
      options: [
        { id: 'q8-a', text: 'WebSocket' },
        { id: 'q8-b', text: 'FTP' },
        { id: 'q8-c', text: 'SMTP' },
        { id: 'q8-d', text: 'SSH' },
      ],
      correctOptionId: 'q8-a',
      topic: 'Technology',
      difficulty: 'MEDIUM',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q9',
      question: 'Which database is relational?',
      options: [
        { id: 'q9-a', text: 'Redis' },
        { id: 'q9-b', text: 'PostgreSQL' },
        { id: 'q9-c', text: 'MongoDB' },
        { id: 'q9-d', text: 'Neo4j' },
      ],
      correctOptionId: 'q9-b',
      topic: 'Database',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },

    {
      id: 'q10',
      question: 'What does HTTP stand for?',
      options: [
        { id: 'q10-a', text: 'HyperText Transfer Protocol' },
        { id: 'q10-b', text: 'High Transfer Text Protocol' },
        { id: 'q10-c', text: 'Hyper Transfer Terminal Protocol' },
        { id: 'q10-d', text: 'Host Transfer Text Process' },
      ],
      correctOptionId: 'q10-a',
      topic: 'Networking',
      difficulty: 'EASY',
      timeLimitSeconds: 15,
      points: 10,
    },
  ];

  async loadQuestions(numberOfQuestions: number = 5): Promise<RoomQuestion[]> {
    if (this.questionBank.length === 0) {
      throw new NotFoundException('No questions available');
    }

    const shuffled = [...this.questionBank].sort(() => Math.random() - 0.5);

    const questions = shuffled.slice(
      0,
      Math.min(numberOfQuestions, shuffled.length),
    );

    return questions.map((question) => ({
      ...question,

      options: question.options
        ? question.options.map((option) => ({ ...option }))
        : [],
    }));
  }

  getQuestion(session: RoomSession, questionId: string): RoomQuestion | null {
    return (
      session.questions.find((question) => question.id === questionId) ?? null
    );
  }
}
