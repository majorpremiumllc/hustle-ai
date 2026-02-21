import IndustryPage from "../components/IndustryPage";

export const metadata = {
    title: "AI for HVAC Companies — Never Miss a Seasonal Rush Call",
    description: "HustleAI handles HVAC call volume surges during summer and winter. AI answers, qualifies, and books appointments automatically. Start free.",
    keywords: ["AI for HVAC", "HVAC answering service", "HVAC lead automation", "AI receptionist HVAC"],
};

const DATA = {
    industry: "HVAC",
    headline: "AI That Handles Your HVAC Call Surges",
    subheadline: "When AC breaks in July, every second counts. Be the first to answer.",
    problem: {
        title: "The HVAC Seasonal Nightmare",
        points: [
            "First heatwave hits — your phone rings 50 times in one hour.",
            "You can book maybe 8 jobs today. The other 42 callers? Gone to competitors.",
            "Hiring a temp receptionist for seasonal spikes costs $3,000/month. And they still miss calls.",
        ],
    },
    solution: {
        title: "HustleAI: Infinite Call Capacity",
        points: [
            "Handles unlimited simultaneous calls — never a busy signal",
            "Identifies urgent vs. routine: broken AC gets priority alert",
            "Books maintenance appointments weeks in advance automatically",
            "Captures equipment details: brand, model, age, warranty status",
            "Fills your schedule during off-season with tune-up bookings",
        ],
    },
    stats: [
        { value: "$24,300", label: "Avg recovered revenue/month for HVAC businesses" },
        { value: "5x", label: "Call volume increase during peak seasons" },
        { value: "∞", label: "Simultaneous calls handled — no busy signals" },
    ],
};

export default function Page() {
    return <IndustryPage data={DATA} />;
}
