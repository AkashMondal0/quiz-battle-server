import { PipeTransform, BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: z.ZodType<T>) { }

  transform(value: unknown): T {
    // Guard: surface undefined/null body explicitly
    if (value === undefined || value === null) {
      throw new BadRequestException(
        'Request body is missing or empty. Ensure Content-Type is application/json.',
      );
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const field = issue.path.join('.') || 'root';
        const received = (issue as any).received ?? 'undefined';
        const expected = (issue as any).expected ?? 'unknown';

        if (issue.code === 'invalid_type') {
          return `'${field}': expected ${expected}, got ${received}`;
        }

        return `'${field}': ${issue.message}`;
      });

      // Single readable string → "username: expected string, got undefined | email: expected string, got undefined"
      throw new BadRequestException(errors.join(' | '));
    }

    return result.data;
  }
}