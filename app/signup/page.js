"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        companyName: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setLoading(false);
                return;
            }

            // Auto sign in after signup
            const result = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Account created but sign-in failed. Please log in.");
                setLoading(false);
            } else {
                router.push("/dashboard/onboarding");
            }
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authGlow} />
            <div className={styles.authCard}>
                <a href="/" className={styles.authLogo}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" style={{ color: "var(--primary-light)" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    {" "}Grow<span className="text-gradient">AI</span>
                </a>
                <h2>Create your account</h2>
                <p className={styles.authSub}>
                    Start your 7-day free trial. No credit card required.
                </p>

                {error && <div className={styles.authError}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className="input-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Mike's Handyman Services"
                            value={form.companyName}
                            onChange={update("companyName")}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={update("name")}
                        />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={update("email")}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={update("password")}
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-accent btn-lg"
                        style={{ width: "100%" }}
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Start Free Trial →"}
                    </button>
                </form>

                <p className={styles.authSwitch}>
                    Already have an account?{" "}
                    <a href="/login">Sign in →</a>
                </p>
            </div>
        </div>
    );
}
