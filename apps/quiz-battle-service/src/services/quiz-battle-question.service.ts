import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

import { RoomQuestion, RoomSession } from '../interface/room-session.interface';
import { _Questions } from './_Questions';

// ============================================================
// TYPES
// ============================================================

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface GenerateQuestionsOptions {
  count?: number;
  difficulty?: string;
  topic?: string;
  prompt?: string;
  mode?: string;
  numberOfQuestions?: number;
}

interface AIQuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface AIQuizResponse {
  questions: AIQuizQuestion[];
}

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class QuizBattleQuestionService {
  private readonly logger = new Logger(QuizBattleQuestionService.name);

  private readonly ai: GoogleGenAI;

  private readonly model: string;

  private readonly maxRetries: number;

  private readonly timeoutMs: number;

  constructor() {
    // Free API key from https://aistudio.google.com/apikey
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // gemini-2.5-flash and gemini-3.5-flash both have a free tier
    // via Google AI Studio (no billing/card required).
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    this.maxRetries = Math.max(1, Number(process.env.GEMINI_MAX_RETRIES || 2));

    this.timeoutMs = Math.max(
      10_000,
      Number(process.env.GEMINI_TIMEOUT_MS || 60_000),
    );

    this.ai = new GoogleGenAI({
      apiKey,
    });

    this.logger.log(
      `Gemini initialized | model=${this.model} | retries=${this.maxRetries} | timeout=${this.timeoutMs}ms`,
    );
  }

  // ==========================================================
  // PUBLIC
  // ==========================================================

  async generateQuestions(
    options: GenerateQuestionsOptions = {},
    room?: RoomSession,
  ): Promise<RoomQuestion[]> {
    const count = this.normalizeCount(options.count);

    const difficulty = this.normalizeDifficulty(options.difficulty);

    const topic = this.cleanText(options.topic) || 'General Knowledge';

    const prompt = this.cleanText(options.prompt) || '';

    const mode = this.cleanText(options.mode) || 'STANDARD';

    const numberOfQuestions = options.numberOfQuestions ?? 5;

    this.logger.log(
      `Generating quiz | count=${count} | difficulty=${difficulty} | topic="${topic}" | mode="${mode}"`,
    );

    try {
      const aiResponse = await this.requestQuestionsFromAI({
        count,
        difficulty,
        topic,
        prompt,
        mode,
        numberOfQuestions,
      });

      const questions = this.transformQuestions(
        aiResponse.questions,
        difficulty,
        topic,
      );

      if (questions.length !== count) {
        throw new Error(
          `Expected ${count} questions but received ${questions.length}`,
        );
      }

      this.logger.log(`Successfully generated ${questions.length} questions`);

      return questions;
    } catch (error) {
      this.logger.error(
        'Gemini quiz generation failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to generate quiz questions right now. Please try again.',
      );
    }
  }

  // ==========================================================
  // GEMINI REQUEST
  // ==========================================================

  private async requestQuestionsFromAI(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
    numberOfQuestions?: number;
  }): Promise<AIQuizResponse> {
    const systemPrompt = this.buildSystemPrompt(params);

    const userPrompt = this.buildUserPrompt(params);

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(`Gemini request attempt ${attempt}/${this.maxRetries}`);

        const content = await this.generateContentWithTimeout(
          systemPrompt,
          userPrompt,
        );

        this.logger.debug(`Gemini response length: ${content.length}`);

        if (!content.trim()) {
          throw new Error('Gemini returned an empty response');
        }

        if (content.trim().toLowerCase().startsWith('user safety:')) {
          throw new Error(
            `Gemini returned a safety response instead of quiz JSON: ${content}`,
          );
        }

        const jsonText = this.cleanJsonResponse(content);

        let parsed: unknown;

        try {
          parsed = JSON.parse(jsonText);
        } catch (error) {
          this.logger.error(`Invalid JSON returned by Gemini`);

          this.logger.error(`Raw response: ${content}`);

          throw new Error(`Gemini returned invalid JSON`);
        }

        this.validateAIResponse(parsed, params.count);

        return parsed as AIQuizResponse;
      } catch (error) {
        lastError = error;

        const retryable = this.isRetryableError(error);

        this.logger.warn(
          `Gemini attempt ${attempt} failed | retryable=${retryable} | error=${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        if (!retryable || attempt >= this.maxRetries) {
          break;
        }

        const delay = this.calculateBackoff(attempt);

        this.logger.warn(`Retrying Gemini request in ${delay}ms...`);

        await this.sleep(delay);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  // ==========================================================
  // GEMINI API CALL
  // ==========================================================

  private async generateContentWithTimeout(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const responsePromise = this.ai.models.generateContent({
        model: this.model,

        contents: userPrompt,

        config: {
          systemInstruction: systemPrompt,

          temperature: 0.7,

          maxOutputTokens: 8000,

          // Force Gemini to return raw JSON,
          // no markdown fences.
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(
            new Error(`Gemini request timed out after ${this.timeoutMs}ms`),
          );
        });
      });

      const response = await Promise.race([responsePromise, timeoutPromise]);

      const text = response.text;

      return typeof text === 'string' ? text : '';
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        throw error;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ==========================================================
  // SYSTEM PROMPT
  // ==========================================================

  private buildSystemPrompt(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    mode: string;
  }): string {
    return `
You are the QuizBattle AI question generator.

Generate high-quality multiple-choice questions.

STRICT OUTPUT RULE:

Return ONLY valid JSON.

Do NOT return markdown.
Do NOT return a code block.
Do NOT return explanations outside JSON.
Do NOT return any introductory text.
Do NOT return any text before or after the JSON.

The response MUST be directly parseable by JSON.parse().

The JSON MUST have exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctOptionIndex": 0,
      "explanation": "Short factual explanation."
    }
  ]
}

==================================================
REQUIREMENTS
==================================================

Generate EXACTLY ${params.count} questions.

Each question MUST have:

- question
- exactly 4 options
- correctOptionIndex
- explanation

correctOptionIndex MUST be:

0, 1, 2, or 3

There must be exactly ONE correct answer.

Do NOT use:

- All of the above
- None of the above
- Multiple correct answers
- Ambiguous answers
- Subjective answers
- Duplicate options
- Duplicate questions

==================================================
DIFFICULTY
==================================================

${params.difficulty}

EASY:
Simple/common knowledge.

MEDIUM:
Requires moderate knowledge or reasoning.

HARD:
Requires deeper knowledge.

==================================================
TOPIC
==================================================

${params.topic}

==================================================
GAME MODE
==================================================

${params.mode}

==================================================
QUESTION QUALITY
==================================================

Questions must be:

- factual
- clear
- unambiguous
- suitable for multiplayer quiz
- grammatically correct
- relevant to the topic

==================================================
FINAL RULE
==================================================

Return ONLY the JSON object.

No markdown.
No code fences.
No additional text.
`.trim();
  }

  // ==========================================================
  // USER PROMPT
  // ==========================================================

  private buildUserPrompt(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
  }): string {
    return `
Generate ${params.count} ${params.difficulty} quiz questions.

Topic:
${params.topic}

Game mode:
${params.mode}

Additional instructions:
${params.prompt || 'None'}

Requirements:

- Exactly ${params.count} questions
- Exactly 4 options per question
- Exactly one correct option
- correctOptionIndex must be 0, 1, 2, or 3
- Every question must have an explanation
- No duplicate questions
- No duplicate options
- No "all of the above"
- No "none of the above"
- No markdown
- Return ONLY JSON

Return the JSON now.
`.trim();
  }

  // ==========================================================
  // JSON CLEANER
  // ==========================================================

  private cleanJsonResponse(content: string): string {
    let text = content.trim();

    // Remove ```json
    if (text.startsWith('```json')) {
      text = text.substring(7);
    }

    // Remove ```
    if (text.startsWith('```')) {
      text = text.substring(3);
    }

    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }

    text = text.trim();

    // Find JSON object
    const firstBrace = text.indexOf('{');

    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return text.trim();
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validateAIResponse(
    response: unknown,
    expectedCount: number,
  ): asserts response is AIQuizResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('AI response is not an object');
    }

    const data = response as Record<string, unknown>;

    if (!Array.isArray(data.questions)) {
      throw new Error('AI response does not contain questions array');
    }

    if (data.questions.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} questions but received ${data.questions.length}`,
      );
    }

    const questionSet = new Set<string>();

    data.questions.forEach((rawQuestion, index) => {
      if (!rawQuestion || typeof rawQuestion !== 'object') {
        throw new Error(`Question ${index + 1} is invalid`);
      }

      const question = rawQuestion as Record<string, unknown>;

      // --------------------------------------------------
      // QUESTION TEXT
      // --------------------------------------------------

      if (typeof question.question !== 'string' || !question.question.trim()) {
        throw new Error(`Question ${index + 1} has invalid text`);
      }

      const normalizedQuestion = this.normalizeForDuplicateCheck(
        question.question,
      );

      if (questionSet.has(normalizedQuestion)) {
        throw new Error(`Duplicate question detected: ${question.question}`);
      }

      questionSet.add(normalizedQuestion);

      // --------------------------------------------------
      // OPTIONS
      // --------------------------------------------------

      if (!Array.isArray(question.options)) {
        throw new Error(`Question ${index + 1} has no options`);
      }

      if (question.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }

      const optionSet = new Set<string>();

      question.options.forEach((option, optionIndex) => {
        if (typeof option !== 'string' || !option.trim()) {
          throw new Error(
            `Question ${index + 1} option ${optionIndex + 1} is invalid`,
          );
        }

        const normalizedOption = this.normalizeForDuplicateCheck(option);

        if (optionSet.has(normalizedOption)) {
          throw new Error(`Question ${index + 1} contains duplicate options`);
        }

        optionSet.add(normalizedOption);
      });

      // --------------------------------------------------
      // CORRECT OPTION
      // --------------------------------------------------

      if (typeof question.correctOptionIndex !== 'number') {
        throw new Error(`Question ${index + 1} has invalid correctOptionIndex`);
      }

      if (
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        throw new Error(`Question ${index + 1} correctOptionIndex must be 0-3`);
      }

      // --------------------------------------------------
      // EXPLANATION
      // --------------------------------------------------

      if (
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        throw new Error(`Question ${index + 1} has invalid explanation`);
      }
    });
  }

  // ==========================================================
  // TRANSFORM AI QUESTION -> RoomQuestion
  // ==========================================================

  private transformQuestions(
    aiQuestions: AIQuizQuestion[],
    difficulty: Difficulty,
    topic: string,
  ): RoomQuestion[] {
    return aiQuestions.map((aiQuestion, questionIndex) => {
      const options: any[] = aiQuestion.options.map((text, optionIndex) => ({
        id: this.generateOptionId(questionIndex, optionIndex),

        text: text.trim(),
      }));

      const correctOption = options[aiQuestion.correctOptionIndex];

      if (!correctOption) {
        throw new Error(
          `Invalid correct option for question ${questionIndex + 1}`,
        );
      }

      const settings = this.getDifficultySettings(difficulty);

      const question: RoomQuestion = {
        id: this.generateQuestionId(questionIndex),

        index: questionIndex,

        type: 'MCQ',

        difficulty,

        topic,

        question: aiQuestion.question.trim(),

        media: null,

        options,

        /**
         * IMPORTANT:
         *
         * Keep this only on the SERVER.
         *
         * Never send correctOptionId
         * to the client in the active
         * question payload.
         */
        correctOptionId: correctOption.id,

        points: settings.points,

        timeLimitSeconds: settings.timeLimitSeconds,

        status: 'WAITING',

        explanation: aiQuestion.explanation.trim(),
      };

      return question;
    });
  }

  // ==========================================================
  // DIFFICULTY SETTINGS
  // ==========================================================

  private getDifficultySettings(difficulty: Difficulty): {
    points: number;
    timeLimitSeconds: number;
  } {
    switch (difficulty) {
      case 'EASY':
        return {
          points: 10,
          timeLimitSeconds: 15,
        };

      case 'HARD':
        return {
          points: 30,
          timeLimitSeconds: 30,
        };

      case 'MEDIUM':
      default:
        return {
          points: 20,
          timeLimitSeconds: 20,
        };
    }
  }

  // ==========================================================
  // ID GENERATORS
  // ==========================================================

  private generateQuestionId(index: number): string {
    return [
      'question',
      Date.now(),
      index,
      Math.random().toString(36).substring(2, 8),
    ].join('_');
  }

  private generateOptionId(questionIndex: number, optionIndex: number): string {
    return [
      'option',
      Date.now(),
      questionIndex,
      optionIndex,
      Math.random().toString(36).substring(2, 8),
    ].join('_');
  }

  // ==========================================================
  // NORMALIZATION
  // ==========================================================

  private normalizeCount(count?: number): number {
    if (typeof count !== 'number' || !Number.isFinite(count)) {
      return 5;
    }

    return Math.min(50, Math.max(1, Math.floor(count)));
  }

  private normalizeDifficulty(difficulty?: string): Difficulty {
    const value = difficulty?.trim().toUpperCase();

    if (value === 'EASY' || value === 'MEDIUM' || value === 'HARD') {
      return value;
    }

    return 'MEDIUM';
  }

  private cleanText(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const result = value.trim();

    return result.length ? result : undefined;
  }

  private normalizeForDuplicateCheck(value: string): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim();
  }

  // ==========================================================
  // RETRY
  // ==========================================================

  private isRetryableError(error: unknown): boolean {
    if (!error) {
      return false;
    }

    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase();

    // Timeout
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('abort')
    ) {
      return true;
    }

    // Network
    if (
      message.includes('econnreset') ||
      message.includes('socket hang up') ||
      message.includes('network')
    ) {
      return true;
    }

    // Temporary HTTP / quota errors
    if (
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('rate limit') ||
      message.includes('resource_exhausted') ||
      message.includes('temporarily unavailable')
    ) {
      return true;
    }

    // Invalid model response
    if (message.includes('invalid json') || message.includes('user safety:')) {
      return false;
    }

    return false;
  }

  private calculateBackoff(attempt: number): number {
    const base = 1000;

    const exponential = base * Math.pow(2, attempt - 1);

    const jitter = Math.floor(Math.random() * 500);

    return Math.min(8000, exponential + jitter);
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
