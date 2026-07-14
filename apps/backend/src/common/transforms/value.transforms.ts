import type { TransformFnParams } from 'class-transformer';

function getTransformValue(params: TransformFnParams): unknown {
  const value: unknown = params.value;
  return value;
}

export function trimString(params: TransformFnParams): unknown {
  const value = getTransformValue(params);

  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail(params: TransformFnParams): unknown {
  const value = getTransformValue(params);

  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function numberWithDefault(defaultValue: number) {
  return (params: TransformFnParams): number => {
    const value = getTransformValue(params);

    return value === undefined ? defaultValue : Number(value);
  };
}
