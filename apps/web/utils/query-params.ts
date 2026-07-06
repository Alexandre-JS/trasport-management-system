export function cleanParams(
  params: Record<string, unknown>,
): Record<string, string | number> {
  const entries = Object.entries(params).filter(([, value]) => {
    return value !== undefined && value !== null && value !== "";
  });

  return Object.fromEntries(entries) as Record<string, string | number>;
}
