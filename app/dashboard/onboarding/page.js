"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INDUSTRIES } from "@/lib/industries";
import styles from "../dashboard.module.css";

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [industrySearch, setIndustrySearch] = useState("");
    const [data, setData] = useState({
        industry: null,
        companyName: "",
        serviceArea: "",
        phone: "",
        email: "",
        services: [],
        twilioSid: "",
        twilioToken: "",
        twilioNumber: "",
        yelpEmail: "",
        thumbtackEmail: "",
        googleConnected: false,
        aiGreeting: "",
        aiTone: "friendly",
    });

    const update = (field) => (e) =>
        setData((prev) => ({ ...prev, [field]: e.target.value }));

    const selectIndustry = (industry) => {
        setData((prev) => ({
            ...prev,
            industry,
            services: [],
            aiGreeting: industry.greeting.replace("{company}", prev.companyName || "our company"),
        }));
    };

    const toggleService = (service) => {
        setData((prev) => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter((s) => s !== service)
                : [...prev.services, service],
        }));
    };

    const selectAllServices = () => {
        if (!data.industry) return;
        setData((prev) => ({
            ...prev,
            services: prev.services.length === data.industry.services.length ? [] : [...data.industry.services],
        }));
    };

    const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    const prev = () => setStep((s) => Math.max(s - 1, 0));

    const finish = async () => {
        console.log("Onboarding complete:", data);
        router.push("/dashboard");
    };

    const filteredIndustries = INDUSTRIES.filter((ind) =>
        ind.name.toLowerCase().includes(industrySearch.toLowerCase())
    );

    const steps = [
        // Step 0: Choose Industry + Company Info
        <>
            <div className={styles.onboardingStep}>
                <h2>🏢 Your Business</h2>
                <p>Select your industry and tell us about your company.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="input-group">
                    <label>Business Type</label>
                    <input
                        className="input"
                        placeholder="Search industries..."
                        value={industrySearch}
                        onChange={(e) => setIndustrySearch(e.target.value)}
                        style={{ marginBottom: "12px" }}
                    />
                    <div className={styles.industryGrid}>
                        {filteredIndustries.map((ind) => (
                            <div
                                key={ind.id}
                                className={`${styles.industryCard} ${data.industry?.id === ind.id ? styles.selected : ""}`}
                                onClick={() => selectIndustry(ind)}
                            >
                                <span className={styles.industryIcon}>{ind.icon}</span>
                                <span className={styles.industryName}>{ind.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="input-group">
                    <label>Company Name</label>
                    <input
                        className="input"
                        placeholder={data.industry ? `e.g. ${data.industry.name === "Beauty & Salon" ? "Glamour Studio" : data.industry.name === "Restaurant & Catering" ? "Tony's Pizzeria" : `Mike's ${data.industry.name}`}` : "e.g. Your Business Name"}
                        value={data.companyName}
                        onChange={update("companyName")}
                    />
                </div>
                <div className="input-group">
                    <label>Service Area</label>
                    <input className="input" placeholder="e.g. Las Vegas & Henderson" value={data.serviceArea} onChange={update("serviceArea")} />
                </div>
                <div className="input-group">
                    <label>Business Phone</label>
                    <input className="input" placeholder="+1 (702) 555-0100" value={data.phone} onChange={update("phone")} />
                </div>
                <div className="input-group">
                    <label>Business Email</label>
                    <input className="input" placeholder="contact@company.com" value={data.email} onChange={update("email")} />
                </div>

                {data.industry && (
                    <div className="input-group">
                        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Services You Offer</span>
                            <button
                                type="button"
                                onClick={selectAllServices}
                                style={{
                                    background: "none", border: "none", color: "var(--primary-light)",
                                    cursor: "pointer", fontSize: "0.8rem", padding: 0,
                                }}
                            >
                                {data.services.length === data.industry.services.length ? "Deselect All" : "Select All"}
                            </button>
                        </label>
                        <div className={styles.checkList}>
                            {data.industry.services.map((s) => (
                                <div
                                    key={s}
                                    className={`${styles.checkItem} ${data.services.includes(s) ? styles.selected : ""}`}
                                    onClick={() => toggleService(s)}
                                >
                                    <div className={styles.checkBox}>
                                        {data.services.includes(s) && "✓"}
                                    </div>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>,

        // Step 1: Connect Twilio
        <>
            <div className={styles.onboardingStep}>
                <h2>📞 Connect Phone Number</h2>
                <p>Connect your Twilio account so the AI can answer calls and send SMS.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="card-flat" style={{ padding: "20px", marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                        <strong style={{ color: "var(--text-white)" }}>Don&apos;t have Twilio?</strong><br />
                        1. Sign up at <strong>twilio.com</strong> (free trial available)<br />
                        2. Buy a phone number (~$1/month)<br />
                        3. Copy your Account SID and Auth Token from the console
                    </p>
                </div>
                <div className="input-group">
                    <label>Twilio Account SID</label>
                    <input className="input" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={data.twilioSid} onChange={update("twilioSid")} />
                </div>
                <div className="input-group">
                    <label>Twilio Auth Token</label>
                    <input className="input" type="password" placeholder="Your auth token" value={data.twilioToken} onChange={update("twilioToken")} />
                </div>
                <div className="input-group">
                    <label>Twilio Phone Number</label>
                    <input className="input" placeholder="+17025550100" value={data.twilioNumber} onChange={update("twilioNumber")} />
                </div>
            </div>
        </>,

        // Step 2: Connect Yelp
        <>
            <div className={styles.onboardingStep}>
                <h2>⭐ Connect Yelp</h2>
                <p>Auto-respond to new Yelp leads instantly.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="card-flat" style={{ padding: "20px", marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                        <strong style={{ color: "var(--text-white)" }}>How it works:</strong><br />
                        1. Go to your Yelp for Business account<br />
                        2. Set up email forwarding for new leads<br />
                        3. Forward lead emails to the address below<br />
                        4. Our AI will auto-respond within seconds
                    </p>
                </div>
                <div className="input-group">
                    <label>Your Yelp Business Email</label>
                    <input className="input" placeholder="your-yelp-email@gmail.com" value={data.yelpEmail} onChange={update("yelpEmail")} />
                </div>
                <div className="card-flat" style={{ padding: "16px", background: "rgba(108, 92, 231, 0.08)" }}>
                    <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--primary-light)" }}>
                        📧 Forward Yelp notifications to: <strong>leads@servicebot.ai</strong>
                    </p>
                </div>
            </div>
        </>,

        // Step 3: Connect Thumbtack
        <>
            <div className={styles.onboardingStep}>
                <h2>📌 Connect Thumbtack</h2>
                <p>Auto-respond to new Thumbtack leads before competitors.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="card-flat" style={{ padding: "20px", marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                        <strong style={{ color: "var(--text-white)" }}>How it works:</strong><br />
                        1. Go to your Thumbtack Pro account<br />
                        2. Set up email forwarding for new leads<br />
                        3. Forward lead emails to the address below<br />
                        4. Our AI will respond through SMS automatically
                    </p>
                </div>
                <div className="input-group">
                    <label>Your Thumbtack Email</label>
                    <input className="input" placeholder="your-thumbtack-email@gmail.com" value={data.thumbtackEmail} onChange={update("thumbtackEmail")} />
                </div>
                <div className="card-flat" style={{ padding: "16px", background: "rgba(108, 92, 231, 0.08)" }}>
                    <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--primary-light)" }}>
                        📧 Forward Thumbtack notifications to: <strong>leads@servicebot.ai</strong>
                    </p>
                </div>
            </div>
        </>,

        // Step 4: Connect Google
        <>
            <div className={styles.onboardingStep}>
                <h2>📍 Connect Google</h2>
                <p>Capture leads from Google Business Profile and Google Ads.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="card-flat" style={{ padding: "20px", marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                        <strong style={{ color: "var(--text-white)" }}>Google Business Profile:</strong><br />
                        Messages from Google Maps will be routed to your AI dispatcher. Set up call forwarding from your Google number to your Twilio number.
                    </p>
                </div>
                <div className="card-flat" style={{ padding: "20px" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                        <strong style={{ color: "var(--text-white)" }}>Google Ads (optional):</strong><br />
                        If you run Google Ads with call extensions, forward those calls to your Twilio number for AI handling.
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ marginTop: "8px" }}
                    onClick={() => setData((prev) => ({ ...prev, googleConnected: true }))}
                >
                    {data.googleConnected ? "✓ Marked as Connected" : "I've Set Up Forwarding"}
                </button>
            </div>
        </>,

        // Step 5: Customize AI
        <>
            <div className={styles.onboardingStep}>
                <h2>🤖 Customize Your AI</h2>
                <p>Set how the AI greets callers and handles conversations.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="input-group">
                    <label>Phone Greeting</label>
                    <textarea
                        className="input"
                        rows={3}
                        value={data.aiGreeting}
                        onChange={update("aiGreeting")}
                        placeholder="The AI will use this greeting when answering calls..."
                    />
                </div>
                <div className="input-group">
                    <label>AI Tone</label>
                    <select className="input" value={data.aiTone} onChange={update("aiTone")}>
                        <option value="friendly">Friendly & Professional</option>
                        <option value="formal">Formal & Corporate</option>
                        <option value="casual">Casual & Relaxed</option>
                    </select>
                </div>
                {data.industry && (
                    <div className="card-flat" style={{ padding: "16px" }}>
                        <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-secondary)" }}>
                            💡 <strong style={{ color: "var(--text-white)" }}>AI is optimized for {data.industry.name}.</strong> It will ask about:{" "}
                            {data.industry.questions.join(", ")}. You can fine-tune this later in Settings.
                        </p>
                    </div>
                )}
            </div>
        </>,

        // Step 6: Test & Launch
        <>
            <div className={styles.onboardingStep}>
                <h2>🚀 Ready to Launch!</h2>
                <p>Let&apos;s test your AI dispatcher to make sure everything works.</p>
            </div>
            <div className={styles.onboardingForm}>
                <div className="card-flat" style={{ padding: "20px", textAlign: "center" }}>
                    <p style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</p>
                    <h4>Setup Complete</h4>
                    <p style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "8px auto 0" }}>
                        Your AI dispatcher is configured for <strong>{data.industry?.name || "your business"}</strong> and ready to go.
                        It will answer calls, respond to messages, and capture leads automatically.
                    </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                    <div className="card-flat" style={{ padding: "16px", textAlign: "center" }}>
                        <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📞</p>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>
                            <strong style={{ color: "var(--text-white)" }}>Test Call</strong><br />
                            Call your Twilio number to hear the AI
                        </p>
                    </div>
                    <div className="card-flat" style={{ padding: "16px", textAlign: "center" }}>
                        <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>💬</p>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>
                            <strong style={{ color: "var(--text-white)" }}>Test SMS</strong><br />
                            Text your Twilio number to test
                        </p>
                    </div>
                </div>
            </div>
        </>,
    ];

    return (
        <div className={styles.onboardingPage}>
            <div className={styles.onboardingCard}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-white)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" style={{ color: "var(--primary-light)" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Grow<span className="text-gradient">AI</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>
                        Step {step + 1} of {TOTAL_STEPS}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className={styles.onboardingProgress}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.onboardingProgressBar} ${i < step ? styles.completed : i === step ? styles.active : ""
                                }`}
                        />
                    ))}
                </div>

                {/* Step Content */}
                {steps[step]}

                {/* Navigation */}
                <div className={styles.onboardingActions}>
                    {step > 0 ? (
                        <button className="btn btn-ghost" onClick={prev}>
                            ← Back
                        </button>
                    ) : (
                        <a href="/dashboard" className="btn btn-ghost">Skip for now</a>
                    )}
                    {step < TOTAL_STEPS - 1 ? (
                        <button className="btn btn-primary" onClick={next}>
                            Continue →
                        </button>
                    ) : (
                        <button className="btn btn-accent" onClick={finish}>
                            Launch Dispatcher 🚀
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
