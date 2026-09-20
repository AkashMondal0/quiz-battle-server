import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { GoogleGenAI, Type } from '@google/genai';

import { RoomQuestion, RoomSession } from '../interface/room-session.interface';

export interface GenerateQuizOptions {
  topic: string;

  difficulty: string;

  numberOfQuestions: number;

  prompt?: string;

  mode?: string;
}

interface AIQuizQuestion {
  question: string;

  options: {
    text: string;
  }[];

  correctOptionIndex: number;

  explanation: string;
}

interface AIQuizResponse {
  questions: AIQuizQuestion[];
}

@Injectable()
export class QuizBattleQuestionService {
  private readonly logger = new Logger(QuizBattleQuestionService.name);

  private readonly ai: GoogleGenAI;

  private readonly model: string;

  private readonly maxRetries: number;

  private readonly timeoutMs: number;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';

    this.maxRetries = this.parseNumber(process.env.GEMINI_MAX_RETRIES, 3);

    this.timeoutMs = this.parseNumber(process.env.GEMINI_TIMEOUT_MS, 30000);

    this.logger.log(
      `Gemini initialized | model=${this.model} | retries=${this.maxRetries} | timeout=${this.timeoutMs}ms`,
    );
  }

  async generateQuestions(
    options: GenerateQuizOptions,
  ): Promise<RoomQuestion[]> {
    const numberOfQuestions = this.normalizeQuestionCount(
      options.numberOfQuestions,
    );

    const difficulty = this.normalizeDifficulty(options.difficulty);

    const topic = options.topic?.trim() || 'General Knowledge';

    const prompt = options.prompt?.trim() || '';

    const mode = options.mode?.trim() || 'CLASSIC';

    this.logger.log(
      `Generating quiz | topic="${topic}" | difficulty=${difficulty} | questions=${numberOfQuestions} | mode=${mode}`,
    );

    const aiResponse = await this.requestQuestionsFromAI({
      topic,
      difficulty,
      numberOfQuestions,
      prompt,
      mode,
    });

    return this.transformQuestions(aiResponse.questions, {
      topic,
      difficulty,
    });
  }

  getQuestion(session: RoomSession, questionId: string): RoomQuestion | null {
    return (
      session.questions.find((question) => question.id === questionId) ?? null
    );
  }

  private async requestQuestionsFromAI(options: {
    topic: string;
    difficulty: string;
    numberOfQuestions: number;
    prompt: string;
    mode: string;
  }): Promise<AIQuizResponse> {
    const { topic, difficulty, numberOfQuestions, prompt, mode } = options;

    const systemPrompt = `
You are the official AI Quiz Generator for a
multiplayer game called QuizBattle.

Your task is to generate high-quality multiple-choice
quiz questions.

QUIZ CONFIGURATION:

Topic:
${topic}

Difficulty:
${difficulty}

Number of questions:
${numberOfQuestions}

Game mode:
${mode}

Additional user instructions:
${prompt || 'None'}

STRICT RULES:

1. Generate EXACTLY ${numberOfQuestions} questions.

2. Every question must contain EXACTLY 4 options.

3. Every question must have EXACTLY ONE correct option.

4. correctOptionIndex must be:
   0 = first option
   1 = second option
   2 = third option
   3 = fourth option

5. Options must be unique.

6. Questions must be unique.

7. Do not use:
   - All of the above
   - None of the above

8. Do not create subjective questions.

9. Do not create ambiguous questions.

10. Incorrect options should be plausible.

11. Questions must be factually accurate.

12. Do not put the answer inside the question itself.

13. Do not use markdown.

14. Keep explanations short and factual.

15. The output must contain ONLY the requested JSON.

DIFFICULTY:

EASY:
- Basic knowledge.
- Straightforward questions.
- Suitable for approximately 15 seconds.

MEDIUM:
- Requires reasonable knowledge or thinking.
- Suitable for approximately 20 seconds.

HARD:
- Requires deeper knowledge or reasoning.
- Suitable for approximately 30 seconds.

QUESTION TYPES:

Use normal competitive MCQ questions.

Do not generate:
- Yes/No questions.
- True/False questions.
- Multiple-correct questions.
- Subjective questions.

QUALITY:

Before returning the response, internally verify:

- Correct number of questions.
- Exactly 4 options per question.
- One correct answer.
- No duplicate questions.
- No duplicate options.
- Correct option index is 0-3.
`;

    const userPrompt = `
Generate the QuizBattle quiz now.

Topic:
${topic}

Difficulty:
${difficulty}

Questions:
${numberOfQuestions}

Mode:
${mode}

Additional instructions:
${prompt || 'None'}
`;

    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: systemPrompt + '\n\n' + userPrompt,
          },
        ],
      },
    ];

    const config = {
      temperature: 0.7,

      responseMimeType: 'application/json',

      responseSchema: this.getQuizResponseSchema(),
    };

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Gemini request attempt ${attempt}/${this.maxRetries}`,
        );

        const response = await this.generateContentWithTimeout(
          contents,
          config,
        );

        const text = response.text?.trim();

        if (!text) {
          throw new Error('Gemini returned an empty response');
        }

        this.logger.debug(`Gemini response received (${text.length} chars)`);

        let parsed: AIQuizResponse;

        try {
          parsed = JSON.parse(text) as AIQuizResponse;
        } catch {
          throw new Error('Gemini returned invalid JSON');
        }

        this.validateAIResponse(parsed, numberOfQuestions);

        return parsed;
      } catch (error) {
        lastError = error;

        const retryable = this.isRetryableError(error);

        this.logger.warn(
          `Gemini attempt ${attempt} failed | retryable=${retryable} | error=${this.getErrorMessage(error)}`,
        );

        /**
         * Do not retry authentication,
         * invalid request, etc.
         */
        if (!retryable) {
          break;
        }

        if (attempt >= this.maxRetries) {
          break;
        }

        const delay = this.calculateBackoff(attempt);

        this.logger.warn(`Retrying Gemini request in ${delay}ms...`);

        await this.sleep(delay);
      }
    }

    this.logger.error(
      'Gemini quiz generation failed after retries',
      lastError instanceof Error ? lastError.stack : String(lastError),
    );

    throw new InternalServerErrorException(
      'Unable to generate quiz questions right now. Please try again.',
    );
  }

  private getQuizResponseSchema() {
    return {
      type: Type.OBJECT,

      properties: {
        questions: {
          type: Type.ARRAY,

          items: {
            type: Type.OBJECT,

            properties: {
              question: {
                type: Type.STRING,
              },

              options: {
                type: Type.ARRAY,

                items: {
                  type: Type.OBJECT,

                  properties: {
                    text: {
                      type: Type.STRING,
                    },
                  },

                  required: ['text'],
                },
              },

              correctOptionIndex: {
                type: Type.INTEGER,
              },

              explanation: {
                type: Type.STRING,
              },
            },

            required: [
              'question',
              'options',
              'correctOptionIndex',
              'explanation',
            ],
          },
        },
      },

      required: ['questions'],
    };
  }

  private async generateContentWithTimeout(contents: any, config: any) {
    const request = this.ai.models.generateContent({
      model: this.model,

      contents,

      config,
    });

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Gemini request timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    return Promise.race([request, timeout]);
  }

  private isRetryableError(error: unknown): boolean {
    const message = this.getErrorMessage(error).toLowerCase();

    const status = this.getErrorStatus(error);

    /**
     * Temporary server errors.
     */
    if (status === 429 || status === 500 || status === 503 || status === 504) {
      return true;
    }

    /**
     * Network / temporary errors.
     */
    if (
      message.includes('unavailable') ||
      message.includes('overloaded') ||
      message.includes('high demand') ||
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('econnreset') ||
      message.includes('socket') ||
      message.includes('temporarily')
    ) {
      return true;
    }

    return false;
  }

  private getErrorStatus(error: any): number | undefined {
    return (
      error?.status ?? error?.code ?? error?.error?.status ?? error?.error?.code
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private calculateBackoff(attempt: number): number {
    const base = 1000 * Math.pow(2, attempt - 1);

    const jitter = Math.floor(Math.random() * 500);

    return Math.min(base + jitter, 8000);
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private validateAIResponse(
    response: AIQuizResponse,
    expectedCount: number,
  ): void {
    if (!response || !Array.isArray(response.questions)) {
      throw new Error('Invalid AI quiz response');
    }

    if (response.questions.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} questions but received ${response.questions.length}`,
      );
    }

    const questionTexts = new Set<string>();

    for (let i = 0; i < response.questions.length; i++) {
      const question = response.questions[i];

      /* -----------------------------
       * Question text
       * ----------------------------- */

      if (
        !question ||
        typeof question.question !== 'string' ||
        !question.question.trim()
      ) {
        throw new Error(`Question ${i + 1} has invalid text`);
      }

      const normalizedQuestion = this.normalizeText(question.question);

      if (questionTexts.has(normalizedQuestion)) {
        throw new Error(`Duplicate question detected at index ${i}`);
      }

      questionTexts.add(normalizedQuestion);

      /* -----------------------------
       * Options
       * ----------------------------- */

      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`Question ${i + 1} must contain exactly 4 options`);
      }

      const optionTexts = question.options.map((option) =>
        option?.text?.trim().toLowerCase(),
      );

      if (optionTexts.some((text) => !text)) {
        throw new Error(`Question ${i + 1} contains an empty option`);
      }

      if (new Set(optionTexts).size !== 4) {
        throw new Error(`Question ${i + 1} contains duplicate options`);
      }

      /* -----------------------------
       * Correct option
       * ----------------------------- */

      if (
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        throw new Error(`Question ${i + 1} has invalid correctOptionIndex`);
      }

      /* -----------------------------
       * Explanation
       * ----------------------------- */

      if (
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        throw new Error(`Question ${i + 1} has invalid explanation`);
      }
    }
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private transformQuestions(
    aiQuestions: AIQuizQuestion[],
    context: {
      topic: string;
      difficulty: string;
    },
  ): RoomQuestion[] {
    return aiQuestions.map((question, index) => {
      const questionId = this.createQuestionId();

      const options = question.options.map((option, optionIndex) => ({
        id: `${questionId}-option-${optionIndex + 1}`,

        text: option.text.trim(),
      }));

      const correctOptionId = options[question.correctOptionIndex]?.id;

      if (!correctOptionId) {
        throw new Error(`Invalid correct option for question ${index + 1}`);
      }

      const timeLimitSeconds = this.getTimeLimit(context.difficulty);

      const points = this.getPoints(context.difficulty);

      return {
        id: questionId,

        index,

        type: 'MCQ',

        difficulty: context.difficulty,

        topic: context.topic,

        question: question.question.trim(),

        media: null,

        options,

        /**
         * IMPORTANT:
         *
         * This stays on the server.
         * Do not send this field to Android.
         */
        correctOptionId,

        points,

        timeLimitSeconds,

        status: 'PENDING',

        startedAt: undefined,

        endsAt: undefined,

        explanation: question.explanation.trim(),

        stats: {
          totalAnswered: 0,

          correctCount: 0,

          optionDistribution: Object.fromEntries(
            options.map((option) => [option.id, 0]),
          ),
        },
      };
    });
  }

  private getTimeLimit(difficulty: string): number {
    switch (difficulty.toUpperCase()) {
      case 'EASY':
        return 15;

      case 'MEDIUM':
        return 20;

      case 'HARD':
        return 30;

      default:
        return 20;
    }
  }

  private getPoints(difficulty: string): number {
    switch (difficulty.toUpperCase()) {
      case 'EASY':
        return 10;

      case 'MEDIUM':
        return 20;

      case 'HARD':
        return 30;

      default:
        return 10;
    }
  }

  private normalizeQuestionCount(count: number): number {
    if (!Number.isFinite(count)) {
      return 5;
    }

    return Math.min(Math.max(Math.floor(count), 1), 50);
  }

  private normalizeDifficulty(difficulty: string): string {
    const normalized = difficulty?.trim().toUpperCase();

    if (['EASY', 'MEDIUM', 'HARD'].includes(normalized)) {
      return normalized;
    }

    return 'MEDIUM';
  }

  private parseNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private createQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
