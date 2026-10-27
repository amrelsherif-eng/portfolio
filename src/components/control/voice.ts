import { announce, goToSection, openPing, openResume, scrollByPx } from "./actions";

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as unknown as SpeechRecognitionWindow;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

export function isVoiceSupported(): boolean {
  return typeof window !== "undefined" && Boolean(getSpeechRecognition());
}

function executeCommand(transcript: string, stop: () => void): boolean {
  const t = transcript.toLowerCase().trim();

  if (t.includes("stop listening") || t === "stop") {
    announce("Stopped listening");
    stop();
    return true;
  }

  if (t.includes("scroll down")) {
    scrollByPx(600);
    announce("Scrolling down");
    return true;
  }

  if (t.includes("scroll up")) {
    scrollByPx(-600);
    announce("Scrolling up");
    return true;
  }

  if (t.includes("resume") || t.includes("cv")) {
    openResume();
    announce("Opening Resume");
    return true;
  }

  if (t.includes("chat") || t.includes("ping")) {
    openPing();
    announce("Opening Ping");
    return true;
  }

  if (t.includes("about")) {
    goToSection("about");
    announce("Going to About");
    return true;
  }

  if (t.includes("work") || t.includes("project")) {
    goToSection("work");
    announce("Going to Work");
    return true;
  }

  if (t.includes("stack") || t.includes("skill") || t.includes("tech")) {
    goToSection("techstack");
    announce("Going to Tech Stack");
    return true;
  }

  if (t.includes("certif") || t.includes("cert")) {
    goToSection("certifications");
    announce("Going to Certifications");
    return true;
  }

  if (t.includes("contact")) {
    goToSection("contact");
    announce("Going to Contact");
    return true;
  }

  if (t.includes("top") || t.includes("home")) {
    goToSection("top");
    announce("Going to Top");
    return true;
  }

  return false;
}

export function startVoice(
  onStatus: (s: "listening" | "heard" | "error" | "stopped", text?: string) => void
): () => void {
  const SpeechRec = getSpeechRecognition();
  if (!SpeechRec) {
    onStatus("error", "Voice recognition not supported");
    return () => {};
  }

  const recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let isActive = true;

  const stop = (): void => {
    if (!isActive) return;
    isActive = false;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
    onStatus("stopped");
  };

  recognition.onstart = () => {
    if (isActive) {
      onStatus("listening");
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "no-speech") {
      return;
    }
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      isActive = false;
      onStatus("error", event.error);
      return;
    }
    if (isActive) {
      onStatus("error", event.error);
    }
  };

  recognition.onend = () => {
    if (isActive) {
      try {
        recognition.start();
      } catch {
        setTimeout(() => {
          if (isActive) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        }, 150);
      }
    }
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result && result.isFinal) {
        const transcript = result[0]?.transcript?.trim();
        if (transcript) {
          onStatus("heard", transcript);
          const matched = executeCommand(transcript, stop);
          if (!matched) {
            announce('Try “go to work” or “scroll down”');
          }
        }
      }
    }
  };

  try {
    recognition.start();
  } catch (err) {
    isActive = false;
    onStatus("error", err instanceof Error ? err.message : String(err));
    return () => {};
  }

  return stop;
}
