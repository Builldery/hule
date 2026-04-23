import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

interface Issue {
  path: Array<string | number>;
  message: string;
}

function flatten(
  errors: Array<ValidationError>,
  parentPath: Array<string | number> = [],
): Array<Issue> {
  const issues: Array<Issue> = [];
  for (const err of errors) {
    const path = [...parentPath, err.property];
    if (err.constraints) {
      for (const message of Object.values(err.constraints)) {
        issues.push({ path, message });
      }
    }
    if (err.children && err.children.length) {
      issues.push(...flatten(err.children, path));
    }
  }
  return issues;
}

export function validationExceptionFactory(errors: Array<ValidationError>): BadRequestException {
  return new BadRequestException({
    error: 'ValidationError',
    issues: flatten(errors),
  });
}
