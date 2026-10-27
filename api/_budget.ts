export type Deadline = { remaining(): number; expired(): boolean };

export function makeDeadline(ms: number): Deadline {
  const end = Date.now() + ms;
  return { remaining: () => Math.max(0, end - Date.now()), expired: () => Date.now() >= end };
}
