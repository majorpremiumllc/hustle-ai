"use client";
import styles from "./TrustAuthority.module.css";

const TRUST_ITEMS = [
    {
        icon: "🏗",
        title: "Built by Operators",
        desc: "We run Major Premium LLC — a real service business in Las Vegas. HustleAI was built from our own pain. We use it daily.",
        badge: "Dogfooded",
    },
    {
        icon: "📞",
        title: "Works With Your Number",
        desc: "Keep your existing business number. Forward calls to your AI number, or port your number in. Zero disruption.",
        badge: "No Changes",
    },
    {
        icon: "🛡",
        title: "Enterprise-Grade Security",
        desc: "Per-client data isolation. Encrypted at rest and in transit. No cross-contamination between businesses. SOC 2 practices.",
        badge: "Isolated",
    },
    {
        icon: "✅",
        title: "Compliance Ready",
        desc: "A2P 10DLC registration, Toll-Free verification — we guide you through the process. No compliance surprises.",
        badge: "Guided",
    },
];

export default function TrustAuthority() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.tag}>Why Trust HustleAI</span>
                    <h2 className={styles.title}>
                        Built by People Who <span className={styles.gradient}>Actually Run a Business</span>
                    </h2>
                    <p className={styles.subtitle}>
                        We're not another Silicon Valley SaaS. We're operators who built the tool we needed — and now we're sharing it with you.
                    </p>
                </div>
                <div className={styles.grid}>
                    {TRUST_ITEMS.map((item, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>{item.icon}</span>
                                <span className={styles.cardBadge}>{item.badge}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{item.title}</h3>
                            <p className={styles.cardDesc}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
