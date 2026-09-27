import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { RoomQuestion, RoomSession } from '../interface/room-session.interface';

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

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    code?: number;
  };
}

@Injectable()
export class QuizBattleQuestionService {
  private readonly logger = new Logger(QuizBattleQuestionService.name);

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    this.apiKey = apiKey;
    this.model = process.env.OPENROUTER_MODEL || 'openrouter/free';
    this.baseUrl =
      process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.maxRetries = Math.max(
      1,
      Number(process.env.OPENROUTER_MAX_RETRIES || 2),
    );
    this.timeoutMs = Math.max(
      10_000,
      Number(process.env.OPENROUTER_TIMEOUT_MS || 60_000),
    );

    this.logger.log(
      `OpenRouter initialized | model=${this.model} | retries=${this.maxRetries} | timeout=${this.timeoutMs}ms`,
    );
  }

  // ==========================================================
  // PUBLIC
  // ==========================================================

  async generateQuestions(
    options: GenerateQuestionsOptions = {},
    _room?: RoomSession,
  ): Promise<RoomQuestion[]> {
    const count = this.normalizeCount(options.count);
    const difficulty = this.normalizeDifficulty(options.difficulty);
    const topic = this.cleanText(options.topic) || 'General Knowledge';
    const prompt = this.cleanText(options.prompt) || '';
    const mode = this.cleanText(options.mode) || 'STANDARD';

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
        'OpenRouter quiz generation failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to generate quiz questions right now. Please try again.',
      );
    }
  }

  // ==========================================================
  // OPENROUTER REQUEST
  // ==========================================================

  private async requestQuestionsFromAI(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
  }): Promise<AIQuizResponse> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildUserPrompt(params);

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(
          `OpenRouter request attempt ${attempt}/${this.maxRetries}`,
        );

        const response = await this.generateContentWithTimeout(
          systemPrompt,
          userPrompt,
        );

        const content = this.extractContent(response);

        if (!content) {
          throw new Error('OpenRouter returned an empty response');
        }

        const jsonText = this.cleanJsonResponse(content);

        let parsed: unknown;

        try {
          parsed = JSON.parse(jsonText);
        } catch {
          if (response.choices?.[0]?.finish_reason === 'length') {
            throw new Error('OpenRouter response was truncated');
          }

          throw new Error('OpenRouter returned invalid JSON');
        }

        this.validateAIResponse(parsed, params.count);

        const usage = response.usage;

        if (usage) {
          this.logger.debug(
            `OpenRouter usage | prompt=${usage.prompt_tokens ?? 0} | completion=${usage.completion_tokens ?? 0} | total=${usage.total_tokens ?? 0}`,
          );
        }

        return parsed as AIQuizResponse;
      } catch (error) {
        lastError = error;

        const retryable = this.isRetryableError(error);

        this.logger.warn(
          `OpenRouter attempt ${attempt} failed | retryable=${retryable} | error=${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        if (!retryable || attempt >= this.maxRetries) {
          break;
        }

        const delay = this.calculateBackoff(attempt);

        await this.sleep(delay);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError));
  }

  // ==========================================================
  // OPENROUTER API CALL
  // ==========================================================

  private async generateContentWithTimeout(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(process.env.OPENROUTER_SITE_URL
            ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
            : {}),
          ...(process.env.OPENROUTER_APP_NAME
            ? { 'X-Title': process.env.OPENROUTER_APP_NAME }
            : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.4,
          response_format: {
            type: 'json_object',
          },
          stream: false,
        }),
        signal: controller.signal,
      });

      const rawText = await response.text();

      let data: OpenRouterResponse;

      try {
        data = JSON.parse(rawText) as OpenRouterResponse;
      } catch {
        throw new Error(
          `OpenRouter returned invalid API response | status=${response.status}`,
        );
      }

      if (!response.ok) {
        const message =
          data.error?.message ||
          `OpenRouter request failed with HTTP ${response.status}`;

        throw new Error(`OpenRouter ${response.status}: ${message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `OpenRouter request timed out after ${this.timeoutMs}ms`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ==========================================================
  // PROMPTS
  // ==========================================================

  private buildSystemPrompt(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    mode: string;
  }): string {
    return [
      'Generate high-quality multiple-choice quiz questions.',
      '',
      'Return ONLY one valid JSON object. No markdown or extra text.',
      '',
      `Generate exactly ${params.count} questions.`,
      `Difficulty: ${params.difficulty}.`,
      `Topic: ${params.topic}.`,
      `Mode: ${params.mode}.`,
      '',
      'Each question must contain:',
      '- question: clear factual question',
      '- options: exactly 4 unique strings',
      '- correctOptionIndex: integer 0-3',
      '- explanation: short factual explanation',
      '',
      'Rules:',
      '- exactly one correct answer',
      '- no duplicate questions',
      '- no duplicate options',
      '- no ambiguous or subjective questions',
      '- no "all of the above"',
      '- no "none of the above"',
      '- keep explanations short',
      '',
      'JSON shape:',
      '{"questions":[{"question":"...","options":["...","...","...","..."],"correctOptionIndex":0,"explanation":"..."}]}',
    ].join('\n');
  }

  private buildUserPrompt(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
  }): string {
    const additionalInstructions = params.prompt
      ? `\nAdditional instructions: ${params.prompt}`
      : '';

    return `Generate ${params.count} ${params.difficulty} MCQ questions for "${params.topic}" in "${params.mode}" mode.${additionalInstructions}`;
  }

  // ==========================================================
  // RESPONSE HELPERS
  // ==========================================================

  private extractContent(response: OpenRouterResponse): string {
    const content = response.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content.trim();
    }

    return '';
  }

  private cleanJsonResponse(content: string): string {
    let text = content.trim();

    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }

    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }

    text = text.trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (
      firstBrace !== -1 &&
      lastBrace !== -1 &&
      lastBrace > firstBrace
    ) {
      return text.slice(firstBrace, lastBrace + 1).trim();
    }

    return text;
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

      if (
        typeof question.question !== 'string' ||
        !question.question.trim()
      ) {
        throw new Error(`Question ${index + 1} has invalid text`);
      }

      const normalizedQuestion = this.normalizeForDuplicateCheck(
        question.question,
      );

      if (questionSet.has(normalizedQuestion)) {
        throw new Error(`Duplicate question detected`);
      }

      questionSet.add(normalizedQuestion);

      if (!Array.isArray(question.options)) {
        throw new Error(`Question ${index + 1} has no options`);
      }

      if (question.options.length !== 4) {
        throw new Error(
          `Question ${index + 1} must have exactly 4 options`,
        );
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
          throw new Error(
            `Question ${index + 1} contains duplicate options`,
          );
        }

        optionSet.add(normalizedOption);
      });

      if (
        typeof question.correctOptionIndex !== 'number' ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        throw new Error(
          `Question ${index + 1} correctOptionIndex must be 0-3`,
        );
      }

      if (
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        throw new Error(`Question ${index + 1} has invalid explanation`);
      }
    });
  }

  // ==========================================================
  // TRANSFORM
  // ==========================================================

  private transformQuestions(
    aiQuestions: AIQuizQuestion[],
    difficulty: Difficulty,
    topic: string,
  ): RoomQuestion[] {
    const settings = this.getDifficultySettings(difficulty);

    return aiQuestions.map((aiQuestion, questionIndex) => {
      const options: any[] = aiQuestion.options.map(
        (text, optionIndex) => ({
          id: this.generateOptionId(questionIndex, optionIndex),
          text: text.trim(),
        }),
      );

      const correctOption = options[aiQuestion.correctOptionIndex];

      if (!correctOption) {
        throw new Error(
          `Invalid correct option for question ${questionIndex + 1}`,
        );
      }

      const question: RoomQuestion = {
        id: this.generateQuestionId(questionIndex),
        index: questionIndex,
        type: 'MCQ',
        difficulty,
        topic,
        question: aiQuestion.question.trim(),
        media: null,
        options,
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
  // DIFFICULTY
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
  // IDS
  // ==========================================================

  private generateQuestionId(index: number): string {
    return [
      'question',
      Date.now(),
      index,
      Math.random().toString(36).slice(2, 8),
    ].join('_');
  }

  private generateOptionId(
    questionIndex: number,
    optionIndex: number,
  ): string {
    return [
      'option',
      Date.now(),
      questionIndex,
      optionIndex,
      Math.random().toString(36).slice(2, 8),
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

    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('abort')
    ) {
      return true;
    }

    if (
      message.includes('econnreset') ||
      message.includes('socket hang up') ||
      message.includes('network') ||
      message.includes('fetch failed')
    ) {
      return true;
    }

    if (
      message.includes('408') ||
      message.includes('409') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('rate limit') ||
      message.includes('temporarily unavailable') ||
      message.includes('truncated')
    ) {
      return true;
    }

    return false;
  }

  private calculateBackoff(attempt: number): number {
    const base = 800;
    const exponential = base * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 300);

    return Math.min(5000, exponential + jitter);
  }

  private async sleep(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
