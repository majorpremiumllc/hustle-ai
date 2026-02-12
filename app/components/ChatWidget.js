"use client";

import { useState, useRef, useEffect } from "react";
import AgentAvatar from "./AgentAvatar";
import AGENTS from "./agents";
import styles from "./ChatWidget.module.css";

/* ── SVG Icons ── */
const IconClose = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconSend = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const IconChat = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);
const IconBack = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

/* ── Markdown renderer ── */
function renderMarkdown(text) {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).map((seg, j) => {
            if (seg.startsWith("**") && seg.endsWith("**")) {
                return <strong key={j}>{seg.slice(2, -2)}</strong>;
            }
            return seg;
        });
        return (
            <span key={i}>
                {i > 0 && <br />}
                {parts}
            </span>
        );
    });
}

/* ── Main Widget ── */
export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [activeAgent, setActiveAgent] = useState(null);
    const [conversations, setConversations] = useState({});
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [greetAgent, setGreetAgent] = useState(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // Current conversation messages
    const messages = activeAgent ? conversations[activeAgent.id] || [] : [];

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (open && activeAgent && inputRef.current) inputRef.current.focus();
    }, [open, activeAgent]);

    const selectAgent = (agent) => {
        setActiveAgent(agent);
        setGreetAgent(agent.id);
        setTimeout(() => setGreetAgent(null), 1600);

        // Initialize conversation with greeting if empty
        if (!conversations[agent.id]) {
            setConversations((prev) => ({
                ...prev,
                [agent.id]: [{ role: "assistant", content: agent.greeting }],
            }));
        }
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading || !activeAgent) return;

        const userMsg = { role: "user", content: text };
        const updated = [...messages, userMsg];

        setConversations((prev) => ({ ...prev, [activeAgent.id]: updated }));
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: activeAgent.id,
                    messages: updated.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) throw new Error("Chat failed");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let content = "";

            // Add placeholder
            setConversations((prev) => ({
                ...prev,
                [activeAgent.id]: [...(prev[activeAgent.id] || []), { role: "assistant", content: "" }],
            }));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                content += decoder.decode(value, { stream: true });
                const captured = content;
                setConversations((prev) => {
                    const msgs = [...(prev[activeAgent.id] || [])];
                    msgs[msgs.length - 1] = { role: "assistant", content: captured };
                    return { ...prev, [activeAgent.id]: msgs };
                });
            }
        } catch (err) {
            console.error("Chat error:", err);
            setConversations((prev) => ({
                ...prev,
                [activeAgent.id]: [
                    ...(prev[activeAgent.id] || []),
                    { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again!" },
                ],
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                className={`${styles.fab} ${open ? styles.fabHidden : ""}`}
                onClick={() => setOpen(true)}
                aria-label="Open chat"
            >
                <IconChat />
                <span className={styles.fabPulse} />
            </button>

            {/* Chat Panel */}
            <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
                {!activeAgent ? (
                    /* ── Agent Selection ── */
                    <>
                        <div className={styles.header}>
                            <div className={styles.headerLeft}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.headerIcon}>
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                <div>
                                    <strong>HustleAI Assistants</strong>
                                    <span className={styles.headerStatus}>
                                        <span className={styles.statusDot} />
                                        5 agents online
                                    </span>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
                                <IconClose />
                            </button>
                        </div>

                        <div className={styles.agentList}>
                            <p className={styles.agentListTitle}>Choose your AI assistant</p>
                            {AGENTS.map((agent) => (
                                <button
                                    key={agent.id}
                                    className={styles.agentCard}
                                    onClick={() => selectAgent(agent)}
                                >
                                    <AgentAvatar agent={agent} size="sm" greet={greetAgent === agent.id} />
                                    <div className={styles.agentInfo}>
                                        <strong>{agent.name}</strong>
                                        <span>{agent.role}</span>
                                    </div>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.agentArrow}>
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    /* ── Active Chat ── */
                    <>
                        <div className={styles.header}>
                            <div className={styles.headerLeft}>
                                <button
                                    className={styles.backBtn}
                                    onClick={() => setActiveAgent(null)}
                                    aria-label="Back to agents"
                                >
                                    <IconBack />
                                </button>
                                <AgentAvatar agent={activeAgent} size="sm" greet={greetAgent === activeAgent.id} />
                                <div>
                                    <strong>{activeAgent.name}</strong>
                                    <span className={styles.headerStatus}>
                                        <span className={styles.statusDot} />
                                        {activeAgent.role}
                                    </span>
                                </div>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
                                <IconClose />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className={styles.messageList} ref={listRef}>
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`${styles.message} ${msg.role === "user" ? styles.messageUser : styles.messageBot}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className={styles.msgAvatar}>
                                            <AgentAvatar agent={activeAgent} size="sm" />
                                        </div>
                                    )}
                                    <div className={styles.msgBubble}>
                                        {msg.content ? (
                                            msg.role === "user" ? msg.content : renderMarkdown(msg.content)
                                        ) : (
                                            <span className={styles.typingDots}>
                                                <span /><span /><span />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && messages[messages.length - 1]?.role !== "assistant" && (
                                <div className={`${styles.message} ${styles.messageBot}`}>
                                    <div className={styles.msgAvatar}>
                                        <AgentAvatar agent={activeAgent} size="sm" />
                                    </div>
                                    <div className={styles.msgBubble}>
                                        <span className={styles.typingDots}>
                                            <span /><span /><span />
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className={styles.inputArea}>
                            <input
                                ref={inputRef}
                                className={styles.input}
                                type="text"
                                placeholder={`Ask ${activeAgent.name}...`}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                aria-label="Send"
                            >
                                <IconSend />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
