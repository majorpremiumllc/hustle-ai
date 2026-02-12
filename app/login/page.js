"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Invalid email or password");
            setLoading(false);
        } else {
            router.push("/dashboard");
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
                <h2>Welcome back</h2>
                <p className={styles.authSub}>Log in to your dispatcher dashboard</p>

                {error && <div className={styles.authError}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: "100%" }}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className={styles.authSwitch}>
                    Don&apos;t have an account?{" "}
                    <a href="/signup">Create one →</a>
                </p>
            </div>
        </div>
    );
}
