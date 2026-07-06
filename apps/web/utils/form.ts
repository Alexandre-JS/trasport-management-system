export function emptyToUndefined(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}
