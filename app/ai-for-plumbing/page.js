import IndustryPage from "../components/IndustryPage";

export const metadata = {
    title: "AI for Plumbing Companies — Capture Every Emergency Call",
    description: "HustleAI answers plumbing emergency calls 24/7, qualifies leads, and books jobs automatically. Never lose a burst pipe call again. Start free.",
    keywords: ["AI for plumbers", "plumbing answering service", "plumber lead automation", "AI receptionist plumber"],
};

const DATA = {
    industry: "Plumbing",
    headline: "AI That Captures Every Emergency Plumbing Call",
    subheadline: "A burst pipe at 2 AM is a $2,000 job. Don't let voicemail lose it.",
    problem: {
        title: "Why Plumbers Lose Revenue",
        points: [
            "Emergency calls come at the worst times — weekends, holidays, 3 AM.",
            "A homeowner with a flooded basement calls 3 plumbers. First to answer wins.",
            "One missed emergency call = $800–$3,000 in lost revenue. Every. Single. Time.",
        ],
    },
    solution: {
        title: "HustleAI: Your 24/7 Emergency Dispatcher",
        points: [
            "Answers every call instantly — emergencies, estimates, scheduling",
            "Asks the right questions: leak location, severity, water shutoff status",
            "Prioritizes emergency calls and alerts you immediately via push notification",
            "Books routine jobs into your calendar automatically",
            "Sends confirmation texts with your company info and ETA",
        ],
    },
    stats: [
        { value: "$18,600", label: "Avg recovered revenue/month for plumbing businesses" },
        { value: "73%", label: "Of emergency plumbing calls happen after hours" },
        { value: "24/7", label: "AI coverage — holidays, weekends, 3 AM included" },
    ],
};

export default function Page() {
    return <IndustryPage data={DATA} />;
}
