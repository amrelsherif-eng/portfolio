export type GestureStatus = "loading" | "ready" | "no-hand" | "error";
export async function startGesture(onStatus: (s: GestureStatus, detail?: string) => void): Promise<() => void> {
  onStatus("error", "Gesture module not built yet");
  return () => {};
}
