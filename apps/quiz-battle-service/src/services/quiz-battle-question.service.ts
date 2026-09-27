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

/**
 * Intentionally minimal. The AI only generates:
 * question, options, correctOptionIndex.
 * Everything else (ids, points, timing) is generated server-side.
 */
interface AIQuizQuestion {
  question: string;
  options: Array<{ text: string }>;
  correctOptionIndex: number;
}

interface AIQuizResponse {
  questions: AIQuizQuestion[];
}

interface OpenRouterResponse {
  id?: string;
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; code?: number };
}

/**
 * Thrown for failures that are worth retrying with a fresh AI call
 * (bad/partial/truncated output) as opposed to hard failures
 * (network down, auth error, etc.) which get their own check.
 */
class RetryableAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableAIError';
  }
}

// Approx tokens the model needs to emit one question object as JSON.
// Used to size max_tokens so we don't over/under-allocate per request.
const TOKENS_PER_QUESTION = 70;
const MAX_TOKENS_FLOOR = 300;
const MAX_TOKENS_CEILING = 4000;

// JSON string escapes that are actually valid — anything else after a
// backslash inside a string is something the model meant literally
// (regex \d, Windows paths \U..., etc.) and must be re-escaped.
const VALID_JSON_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);

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
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    // Bumped default 2 -> 3: JSON/parse failures are now retried too,
    // so an extra attempt buys real reliability on flaky free models.
    this.maxRetries = Math.max(1, Number(process.env.OPENROUTER_MAX_RETRIES || 3));
    this.timeoutMs = Math.max(10_000, Number(process.env.OPENROUTER_TIMEOUT_MS || 60_000));

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
    const count = this.normalizeCount(options.count ?? options.numberOfQuestions);
    const difficulty = this.normalizeDifficulty(options.difficulty);
    const topic = this.cleanText(options.topic) || 'General Knowledge';
    const prompt = this.cleanText(options.prompt) || '';
    const mode = this.cleanText(options.mode) || 'STANDARD';

    this.logger.log(
      `Generating quiz | count=${count} | difficulty=${difficulty} | topic="${topic}" | mode="${mode}"`,
    );

    try {
      const aiResponse = await this.requestQuestionsFromAI({ count, difficulty, topic, prompt, mode });
      const questions = this.transformQuestions(aiResponse.questions, difficulty, topic);

      if (questions.length !== count) {
        throw new Error(`Expected ${count} questions but received ${questions.length}`);
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
  // OPENROUTER
  // ==========================================================

  private async requestQuestionsFromAI(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
  }): Promise<AIQuizResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);
    const maxTokens = this.calculateMaxTokens(params.count);

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(`OpenRouter request attempt ${attempt}/${this.maxRetries}`);

        const response = await this.generateContentWithTimeout(systemPrompt, userPrompt, maxTokens);
        const content = this.extractContent(response);

        if (!content) {
          throw new RetryableAIError('OpenRouter returned an empty response');
        }

        const parsed = this.parseAIJson(content, response);
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
        const retryable = error instanceof RetryableAIError || this.isRetryableError(error);

        this.logger.warn(
          `OpenRouter attempt ${attempt} failed | retryable=${retryable} | error=${
            error instanceof Error ? error.message : String(error)
          }`,
        );

        if (!retryable || attempt >= this.maxRetries) {
          break;
        }

        await this.sleep(this.calculateBackoff(attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  // ==========================================================
  // API REQUEST
  // ==========================================================

  private async generateContentWithTimeout(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          // Low temperature keeps factual quiz generation consistent.
          temperature: 0.2,
          // Sized to the request so we never pay for unused headroom
          // and never truncate a legitimately larger batch.
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          stream: false,
        }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data: OpenRouterResponse;

      try {
        data = JSON.parse(rawText) as OpenRouterResponse;
      } catch {
        throw new Error(`OpenRouter returned invalid API response | status=${response.status}`);
      }

      if (!response.ok) {
        const message = data.error?.message || `OpenRouter request failed with HTTP ${response.status}`;
        throw new Error(`OpenRouter ${response.status}: ${message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ==========================================================
  // PROMPTS (token-optimized, code-safe)
  // ==========================================================
  //
  // Fixed, compact system prompt shared across every request (cheap to
  // send, and identical text is what lets provider-side prompt caching
  // kick in). The user prompt carries only the variable fields.
  //
  // The two extra rules ("single quotes", "no multi-line code blocks")
  // exist specifically to stop programming-topic questions from
  // producing unescaped double quotes / raw newlines inside JSON string
  // values — the #1 cause of "invalid JSON" failures on code content.

  private buildSystemPrompt(): string {
    return (
      'You generate factual multiple-choice quiz questions. ' +
      'Reply with ONLY strict JSON, no markdown or commentary, matching exactly:\n' +
      '{"questions":[{"question":"","options":[{"text":""},{"text":""},{"text":""},{"text":""}],"correctOptionIndex":0}]}\n' +
      'Rules: 4 unique options per question, exactly one correct (index 0-3), ' +
      'unique questions, clear and unambiguous, no "all/none of the above", no extra fields. ' +
      'If the topic involves code/programming: keep any code inline and under 100 characters, ' +
      "never use multi-line snippets, and always use single quotes (') instead of double quotes " +
      'inside question/option text so the JSON stays valid.'
    );
  }

  private buildUserPrompt(params: {
    count: number;
    difficulty: Difficulty;
    topic: string;
    prompt: string;
    mode: string;
  }): string {
    const extra = params.prompt ? ` Extra: ${params.prompt}` : '';
    return `${params.count} ${params.difficulty} MCQs on "${params.topic}" (mode: ${params.mode}).${extra}`;
  }

  private calculateMaxTokens(count: number): number {
    const estimated = count * TOKENS_PER_QUESTION + MAX_TOKENS_FLOOR;
    return Math.min(MAX_TOKENS_CEILING, estimated);
  }

  // ==========================================================
  // RESPONSE PARSING
  // ==========================================================

  private extractContent(response: OpenRouterResponse): string {
    const content = response.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : '';
  }

  /**
   * Parses the model's JSON, repairing it first if needed.
   * Any remaining failure is thrown as RetryableAIError so the caller
   * retries with a fresh generation instead of hard-failing.
   */
  private parseAIJson(content: string, response: OpenRouterResponse): unknown {
    const extracted = this.extractJsonObject(content);

    try {
      return JSON.parse(extracted);
    } catch {
      // First pass failed — most likely raw newlines/tabs or invalid
      // escape sequences from an embedded code snippet. Repair and retry.
    }

    const repaired = this.repairJsonEscaping(extracted);

    try {
      return JSON.parse(repaired);
    } catch {
      if (response.choices?.[0]?.finish_reason === 'length') {
        throw new RetryableAIError('OpenRouter response was truncated');
      }
      throw new RetryableAIError('OpenRouter returned invalid JSON');
    }
  }

  /** Strips markdown code fences and trims to the outermost {...} block. */
  private extractJsonObject(content: string): string {
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

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1).trim();
    }

    return text;
  }

  /**
   * Walks the JSON text char-by-char and fixes the two failure modes
   * that code/programming content triggers:
   *  - raw control characters (literal newline/tab from a multi-line
   *    snippet) sitting unescaped inside a string value
   *  - backslashes that aren't valid JSON escapes (regex `\d`, Windows
   *    paths `\Users`, etc.) which JSON.parse rejects outright
   * Anything outside a string value is left untouched.
   */
  private repairJsonEscaping(text: string): string {
    let result = '';
    let inString = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"') {
        result += char;
        inString = !inString;
        continue;
      }

      if (!inString) {
        result += char;
        continue;
      }

      if (char === '\\') {
        const next = text[i + 1];

        if (next !== undefined && VALID_JSON_ESCAPES.has(next)) {
          result += char + next;
          i++;
          continue;
        }

        // Not a valid JSON escape — the model meant a literal backslash
        // (regex, file path, etc.). Escape it properly.
        result += '\\\\';
        continue;
      }

      const code = char.charCodeAt(0);

      if (code === 10) {
        result += '\\n';
        continue;
      }
      if (code === 13) {
        continue; // drop bare CR, \n (above) already breaks the line
      }
      if (code === 9) {
        result += '\\t';
        continue;
      }
      if (code < 0x20) {
        continue; // drop other stray control characters
      }

      result += char;
    }

    return result;
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validateAIResponse(
    response: unknown,
    expectedCount: number,
  ): asserts response is AIQuizResponse {
    if (!response || typeof response !== 'object') {
      throw new RetryableAIError('AI response is not an object');
    }

    const data = response as Record<string, unknown>;

    if (!Array.isArray(data.questions)) {
      throw new RetryableAIError('AI response does not contain questions array');
    }

    if (data.questions.length !== expectedCount) {
      throw new RetryableAIError(
        `Expected ${expectedCount} questions but received ${data.questions.length}`,
      );
    }

    const questionSet = new Set<string>();

    data.questions.forEach((rawQuestion, questionIndex) => {
      if (!rawQuestion || typeof rawQuestion !== 'object') {
        throw new RetryableAIError(`Question ${questionIndex + 1} is invalid`);
      }

      const question = rawQuestion as Record<string, unknown>;

      if (typeof question.question !== 'string' || !question.question.trim()) {
        throw new RetryableAIError(`Question ${questionIndex + 1} has invalid text`);
      }

      const normalizedQuestion = this.normalizeForDuplicateCheck(question.question);

      if (questionSet.has(normalizedQuestion)) {
        throw new RetryableAIError('Duplicate question detected');
      }
      questionSet.add(normalizedQuestion);

      if (!Array.isArray(question.options)) {
        throw new RetryableAIError(`Question ${questionIndex + 1} has no options`);
      }

      if (question.options.length !== 4) {
        throw new RetryableAIError(`Question ${questionIndex + 1} must have exactly 4 options`);
      }

      const optionSet = new Set<string>();

      question.options.forEach((option, optionIndex) => {
        if (!option || typeof option !== 'object') {
          throw new RetryableAIError(`Question ${questionIndex + 1} option ${optionIndex + 1} is invalid`);
        }

        const optionData = option as Record<string, unknown>;

        if (typeof optionData.text !== 'string' || !optionData.text.trim()) {
          throw new RetryableAIError(
            `Question ${questionIndex + 1} option ${optionIndex + 1} has invalid text`,
          );
        }

        const normalizedOption = this.normalizeForDuplicateCheck(optionData.text);

        if (optionSet.has(normalizedOption)) {
          throw new RetryableAIError(`Question ${questionIndex + 1} contains duplicate options`);
        }
        optionSet.add(normalizedOption);
      });

      if (
        typeof question.correctOptionIndex !== 'number' ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3
      ) {
        throw new RetryableAIError(`Question ${questionIndex + 1} correctOptionIndex must be 0-3`);
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
      const questionId = this.generateQuestionId(questionIndex);

      const options = aiQuestion.options.map((option, optionIndex) => ({
        id: this.generateOptionId(questionIndex, optionIndex),
        text: option.text.trim(),
      }));

      const correctOption = options[aiQuestion.correctOptionIndex];

      if (!correctOption) {
        throw new Error(`Invalid correct option for question ${questionIndex + 1}`);
      }

      return {
        id: questionId,
        index: questionIndex,
        type: 'MCQ',
        difficulty,
        topic,
        question: aiQuestion.question.trim(),
        media: null,
        options,
        // AI gives an index; backend converts it to the generated option ID.
        correctOptionId: correctOption.id,
        points: settings.points,
        timeLimitSeconds: settings.timeLimitSeconds,
        status: 'WAITING',
        // Explanation is optional in RoomQuestion — skip it to save AI tokens.
        explanation: '',
      };
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
        return { points: 10, timeLimitSeconds: 15 };
      case 'HARD':
        return { points: 30, timeLimitSeconds: 30 };
      case 'MEDIUM':
      default:
        return { points: 20, timeLimitSeconds: 20 };
    }
  }

  // ==========================================================
  // IDS
  // ==========================================================

  private generateQuestionId(index: number): string {
    return ['question', Date.now(), index, Math.random().toString(36).slice(2, 8)].join('_');
  }

  private generateOptionId(questionIndex: number, optionIndex: number): string {
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

    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('abort') ||
      message.includes('econnreset') ||
      message.includes('socket hang up') ||
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('408') ||
      message.includes('409') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('rate limit') ||
      message.includes('temporarily unavailable') ||
      message.includes('truncated') ||
      message.includes('invalid json') ||
      message.includes('invalid api response')
    );
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