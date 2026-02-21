import IndustryPage from "../components/IndustryPage";

export const metadata = {
    title: "AI for Roofing Companies — Win More Storm Damage Leads",
    description: "HustleAI answers roofing calls 24/7, captures storm damage leads, and books inspections automatically. Beat competitors to every lead. Start free.",
    keywords: ["AI for roofers", "roofing answering service", "roofing lead automation", "AI receptionist roofing"],
};

const DATA = {
    industry: "Roofing",
    headline: "AI That Wins Every Storm Damage Lead",
    subheadline: "After a storm, 100 homeowners call 5 roofers each. The one who answers first wins all 100.",
    problem: {
        title: "The Roofing Lead Race",
        points: [
            "Storm hits → your phone explodes with 200+ calls in 48 hours.",
            "You're on a roof doing an inspection. Can't answer. Can't call back fast enough.",
            "Each storm damage job is $8,000–$25,000. Missing 10 calls = $100K+ lost.",
        ],
    },
    solution: {
        title: "HustleAI: Storm-Ready Call Center",
        points: [
            "Answers every call — answers 200 calls simultaneously during storm surges",
            "Captures property address, damage description, insurance status",
            "Books roof inspections into your calendar by zone/area",
            "Sends follow-up texts with your license number and references",
            "Prioritizes insurance-ready leads with higher conversion potential",
        ],
    },
    stats: [
        { value: "$95K", label: "Avg revenue recovered per storm event" },
        { value: "200+", label: "Simultaneous calls during peak storm events" },
        { value: "12x", label: "Faster response than competitors" },
    ],
};

export default function Page() {
    return <IndustryPage data={DATA} />;
}
