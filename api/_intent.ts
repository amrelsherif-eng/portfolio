export type IntentReply = {
  action: "goto" | "scroll" | "resume" | "chat";
  target?: "top" | "about" | "work" | "techstack" | "certifications" | "contact";
  direction?: "up" | "down";
  reply: string;
};

type IntentAction = "work" | "certifications" | "techstack" | "about" | "contact" | "top" | "resume" | "chat" | "scroll-down" | "scroll-up";

const englishKeywords: Record<IntentAction, string[]> = {
  work: ["projects", "project", "work", "works", "portfolio"],
  certifications: ["certifications", "certificates", "certs", "badges", "aws", "ccna"],
  techstack: ["skills", "stack", "tech stack", "tools", "technologies"],
  about: ["about", "about him", "bio"],
  contact: ["contact", "email", "reach him", "hire"],
  top: ["top", "home", "start", "beginning"],
  resume: ["resume", "cv", "c v"],
  chat: ["chat", "ping", "assistant"],
  "scroll-down": ["scroll down", "down", "next", "go down"],
  "scroll-up": ["scroll up", "up", "back up", "go up"],
};

const arabicKeywords: Record<IntentAction, string[]> = {
  work: ["مشاريع", "مشروع", "مشاريعه", "شغل", "شغله", "اعمال", "بروجكت", "بروجكتس", "بروجيكتس"],
  certifications: ["شهادات", "شهاده", "شهاداته", "كورسات", "سيرتفيكيت", "سيرتفيكيتس"],
  techstack: ["مهارات", "مهاراته", "تقنيات", "ادوات", "التكنولوجي", "سكيلز"],
  about: ["نبذه", "عنه"],
  contact: ["تواصل", "التواصل", "كونتاكت", "ايميل", "اكلمه"],
  top: ["فوق خالص", "البدايه", "الاول", "الرئيسيه"],
  resume: ["سي في", "سيفي", "السي في", "السيره", "السيره الذاتيه"],
  chat: ["شات", "بينج", "المساعد"],
  "scroll-down": ["انزل", "نزل", "تحت", "كمل"],
  "scroll-up": ["اطلع", "طلع", "فوق"],
};

const englishQuestions = ["what", "who", "where", "when", "why", "how", "which", "does", "did", "is he", "has he", "can he", "tell me about"];
const arabicQuestions = ["ايه", "مين", "فين", "امتى", "ليه", "ازاي", "هل", "كام", "بيدرس", "بيشتغل", "عنده", "اتكلم عن", "كلمني عن", "احكيلي"];
const actions: IntentAction[] = ["work", "certifications", "techstack", "about", "contact", "top", "resume", "chat", "scroll-down", "scroll-up"];

function normalize(value: string, lang: "en" | "ar"): string {
  let result = value.toLocaleLowerCase();
  if (lang === "ar") {
    result = result.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ـ/g, "").replace(/[\u064B-\u0652]/g, "");
  }
  result = result.replace(/[،؛؟.,!?]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (lang === "ar") result = result.split(" ").map((word) => word.startsWith("ال") ? word.slice(2) : word).join(" ");
  return result;
}

function includesPhrase(text: string, phrase: string): boolean {
  return (` ${text} `).includes(` ${phrase} `);
}

// Whisper often glues or swallows Arabic prefixes ("اشهادات", "للمشاريع", "والشهادات"), so a one-word
// Arabic keyword (4+ letters) also matches a word that is only a short prefix + the keyword.
const arabicPrefixes = ["ا", "ل", "لل", "ب", "و", "ف", "وال", "بال", "فال", "ال"];
function includesKeyword(text: string, phrase: string, lang: "en" | "ar"): boolean {
  if (includesPhrase(text, phrase)) return true;
  if (lang !== "ar" || phrase.includes(" ") || phrase.length < 4) return false;
  return text.split(" ").some((word) => word.endsWith(phrase) && arabicPrefixes.includes(word.slice(0, word.length - phrase.length)));
}

export function matchIntent(transcript: string, lang: "en" | "ar"): IntentReply | null {
  const text = normalize(transcript, lang);
  if (!text) return null;
  const words = text.split(" ");
  if (words.length > 7) return null;
  const questions = lang === "ar" ? arabicQuestions : englishQuestions;
  if (questions.some((phrase) => includesPhrase(text, normalize(phrase, lang)))) return null;

  if (lang === "ar" && includesPhrase(text, normalize("فوق خالص", "ar"))) {
    return { action: "goto", target: "top", reply: "تمام، رايح لأول الصفحة." };
  }

  // Egyptian speakers mix English words into Arabic ("وريني الـ projects"), so Arabic mode also checks the English list.
  const keywordsFor = (action: IntentAction) => lang === "ar" ? [...arabicKeywords[action], ...englishKeywords[action]] : englishKeywords[action];
  const matched = actions.filter((action) => keywordsFor(action).some((phrase) => includesKeyword(text, normalize(phrase, lang), lang)));
  if (matched.length !== 1) return null;
  const action = matched[0];
  if (!action) return null;

  const enGoto: Partial<Record<IntentAction, string>> = { work: "Projects", certifications: "Certifications", techstack: "Tech stack", about: "About", contact: "Contact", top: "the top" };
  const arGoto: Partial<Record<IntentAction, string>> = { work: "المشاريع", certifications: "الشهادات", techstack: "المهارات", about: "نبذة عن عمرو", contact: "التواصل", top: "أول الصفحة" };
  if (action in (lang === "ar" ? arGoto : enGoto)) {
    const section = (lang === "ar" ? arGoto : enGoto)[action];
    const arabicSection = section?.startsWith("ال") ? `ل${section.slice(1)}` : `ل${section}`;
    return { action: "goto", target: action as "work" | "certifications" | "techstack" | "about" | "contact" | "top", reply: lang === "ar" ? `تمام، رايح ${arabicSection}.` : `Going to ${section}.` };
  }
  if (action === "scroll-down" || action === "scroll-up") {
    const direction = action === "scroll-down" ? "down" : "up";
    return { action: "scroll", direction, reply: lang === "ar" ? direction === "down" ? "تمام، نازل." : "تمام، طالع." : direction === "down" ? "Scrolling down." : "Scrolling up." };
  }
  return action === "resume"
    ? { action: "resume", reply: lang === "ar" ? "بفتح السي في." : "Opening the CV." }
    : { action: "chat", reply: lang === "ar" ? "بفتح Ping." : "Opening Ping." };
}
