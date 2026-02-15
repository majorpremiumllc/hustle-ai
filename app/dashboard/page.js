"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./aichat.module.css";

/* ── SVG Icons ──────────────────────────── */
const IconSend = () => (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const IconSparkle = () => (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <path d="M12 2L13.7 8.3L20 10L13.7 11.7L12 18L10.3 11.7L4 10L10.3 8.3L12 2Z" fill="url(#sparkGrad)" stroke="none" />
        <path d="M19 15L19.9 17.1L22 18L19.9 18.9L19 21L18.1 18.9L16 18L18.1 17.1L19 15Z" fill="url(#sparkGrad2)" stroke="none" />
        <path d="M5 2L5.6 3.4L7 4L5.6 4.6L5 6L4.4 4.6L3 4L4.4 3.4L5 2Z" fill="url(#sparkGrad3)" stroke="none" />
        <defs>
            <linearGradient id="sparkGrad" x1="4" y1="2" x2="20" y2="18"><stop stopColor="#A29BFE" /><stop offset="1" stopColor="#00D2FF" /></linearGradient>
            <linearGradient id="sparkGrad2" x1="16" y1="15" x2="22" y2="21"><stop stopColor="#6C5CE7" /><stop offset="1" stopColor="#00D2FF" /></linearGradient>
            <linearGradient id="sparkGrad3" x1="3" y1="2" x2="7" y2="6"><stop stopColor="#A29BFE" /><stop offset="1" stopColor="#00ff88" /></linearGradient>
        </defs>
    </svg>
);

const IconMic = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

/* ── Suggestion chips ──────────────────── */
const SUGGESTIONS = [
    { icon: "🚀", text: "Help me find new clients" },
    { icon: "📞", text: "Set up AI phone answering" },
    { icon: "📊", text: "Analyze my market" },
    { icon: "💰", text: "Create my first invoice" },
];

/* ── Render basic markdown ────────────── */
function renderMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
        .replace(/\n/g, "<br />");
}

/* ── Main Chat Page ──────────────────── */
export default function DashboardPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-resize textarea
    const handleTextareaChange = (e) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    // Send message
    const sendMessage = useCallback(async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage || isStreaming) return;

        setShowWelcome(false);
        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        const newMessages = [...messages, { role: "user", content: userMessage }];
        setMessages(newMessages);
        setIsStreaming(true);

        // Add empty assistant message for streaming
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    agent: "luna",
                    history: newMessages.slice(-10).map(m => ({
                        role: m.role,
                        parts: [{ text: m.content }],
                    })),
                }),
            });

            if (!res.ok) throw new Error("API error");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: fullResponse };
                    return updated;
                });
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    content: "I'm having a moment — please try again! 🚀",
                };
                return updated;
            });
        }

        setIsStreaming(false);
    }, [input, messages, isStreaming]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (text) => {
        sendMessage(text);
    };

    return (
        <div className={styles.chatPage}>
            {/* Ambient Glow Background */}
            <div className={styles.ambientGlow} />
            <div className={styles.ambientGlow2} />

            {/* Chat Messages Area */}
            <div className={styles.chatArea}>
                {showWelcome && messages.length === 0 ? (
                    <div className={styles.welcomeContainer}>
                        {/* Animated Logo */}
                        <div className={styles.welcomeLogo}>
                            <div className={styles.logoOrb}>
                                <div className={styles.orbPulse} />
                                <div className={styles.orbPulse2} />
                                <IconSparkle />
                            </div>
                        </div>

                        <h1 className={styles.welcomeTitle}>
                            What should we<br />
                            <span className={styles.gradientText}>build today?</span>
                        </h1>
                        <p className={styles.welcomeSubtitle}>
                            I&apos;m your AI business assistant. Ask me anything about
                            growing your business, managing leads, or setting up automations.
                        </p>

                        {/* Suggestion Chips */}
                        <div className={styles.suggestions}>
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    className={styles.suggestionChip}
                                    onClick={() => handleSuggestionClick(s.text)}
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                >
                                    <span className={styles.chipIcon}>{s.icon}</span>
                                    <span>{s.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.messageList}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`${styles.message} ${msg.role === "user" ? styles.messageUser : styles.messageBot}`}
                            >
                                {msg.role === "assistant" && (
                                    <div className={styles.botAvatar}>
                                        <IconSparkle />
                                    </div>
                                )}
                                <div className={styles.messageBubble}>
                                    {msg.role === "assistant" && msg.content === "" ? (
                                        <div className={styles.typingIndicator}>
                                            <span /><span /><span />
                                        </div>
                                    ) : (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: renderMarkdown(msg.content),
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={textareaRef}
                        className={styles.chatInput}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        rows={1}
                        disabled={isStreaming}
                    />
                    <div className={styles.inputActions}>
                        <button
                            className={styles.sendBtn}
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isStreaming}
                        >
                            <IconSend />
                        </button>
                    </div>
                </div>
                <p className={styles.inputHint}>
                    HustleAI can make mistakes. Verify important info.
                </p>
            </div>
        </div>
    );
}
