import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { TbRobot } from "react-icons/tb";
import "./styles/SherifChat.css";

type Message = { role: "user" | "model"; text: string; isError?: boolean };
const suggestions = ["What is Amr working on now?", "Show me his projects", "How can I contact him?"];
const welcome: Message = { role: "model", text: "Hi! I'm Ping — ask me about Amr's skills, projects or experience.\nأهلاً! أنا Ping، اسألني عن خبرات عمرو ومشاريعه." };
const GENERIC_ERROR = "Sorry, I couldn't connect right now. Please try again, or email amrelsherif.eng@gmail.com.";

export default function SherifChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("sherif:open", show);
    return () => window.removeEventListener("sherif:open", show);
  }, []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const send = async (text = draft) => {
    const value = text.trim();
    if (!value || pending) return;
    const next = [...messages.filter((message) => message !== welcome), { role: "user" as const, text: value }];
    setMessages(next);
    setDraft("");
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send only real turns: no welcome text, no error bubbles
        body: JSON.stringify({ messages: next.filter((message) => !message.isError).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await response.json() as { reply?: string };
      if (!response.ok) {
        const reply = data.reply?.trim();
        setMessages((current) => [...current, { role: "model", text: reply || GENERIC_ERROR, isError: true }]);
      } else {
        setMessages((current) => [...current, { role: "model", text: data.reply || GENERIC_ERROR }]);
      }
    } catch {
      setMessages((current) => [...current, { role: "model", text: GENERIC_ERROR, isError: true }]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(); };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); }
  };

  return <>
    <button className="sherif-launcher" type="button" aria-label="Chat with Ping" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-cursor="disable">
      <TbRobot aria-hidden="true" /><span className="sherif-pulse" />
    </button>
    {open && <>
      <div className="sherif-backdrop" onClick={() => setOpen(false)} />
      <section className="sherif-panel" ref={panelRef} role="dialog" aria-label="Chat with Ping" aria-modal="false">
      <header className="sherif-header"><div><span className="sherif-online" /><span>Ping <i>·</i> Amr's assistant</span></div>
        <button type="button" className="sherif-close" aria-label="Close chat" onClick={() => setOpen(false)} data-cursor="disable">×</button></header>
      <div className="sherif-messages" ref={listRef} aria-live="polite">
        {messages.map((message, index) => <div className={`sherif-message sherif-${message.role}${message.isError ? " sherif-error" : ""}`} key={`${index}-${message.role}`}>{message.text.split("\n").map((line, i) => <p dir="auto" key={i}>{line}</p>)}</div>)}
        {messages.length === 1 && <div className="sherif-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(suggestion)} data-cursor="disable">{suggestion}</button>)}</div>}
        {pending && <div className="sherif-message sherif-model sherif-typing" aria-label="Ping is typing"><span /><span /><span /></div>}
      </div>
      <form className="sherif-form" onSubmit={submit}><textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={keyDown} placeholder="Message Ping…" rows={1} maxLength={800} aria-label="Your message" data-cursor="disable" />
        <button type="submit" disabled={pending || !draft.trim()} aria-label="Send message" data-cursor="disable">Send</button></form>
      <div className="sherif-meta">Answers use information from Amr's portfolio</div>
    </section>
    </>}
  </>;
}
