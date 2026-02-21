import IndustryPage from "../components/IndustryPage";

export const metadata = {
    title: "AI for Handyman Businesses — Never Miss a Service Call Again",
    description: "HustleAI answers every call, text, and lead for handyman businesses. Automated scheduling, AI estimates, and 24/7 customer support. Start free.",
    keywords: ["AI for handyman", "handyman phone answering", "handyman lead automation", "AI receptionist handyman"],
};

const DATA = {
    industry: "Handyman",
    headline: "AI That Runs Your Handyman Business While You Work",
    subheadline: "Stop losing $500+ jobs because you couldn't answer the phone from under a sink.",
    problem: {
        title: "The Handyman's Dilemma",
        points: [
            "You're on a ladder installing a ceiling fan when your phone rings — and goes to voicemail.",
            "That caller needed drywall repair and had a $600 budget. They called the next result on Google.",
            "By the time you call back 2 hours later, the job is gone. Sound familiar?",
        ],
    },
    solution: {
        title: "HustleAI Answers While You Work",
        points: [
            "AI picks up every call in under 3 seconds — professional, friendly, human-like",
            "Qualifies the lead: what service, when, how urgent, budget range",
            "Books the appointment on your calendar based on your availability",
            "Sends the customer a confirmation text with your business info",
            "You get a push notification with all the details — ready to go",
        ],
    },
    stats: [
        { value: "$12,400", label: "Avg recovered revenue/month for handyman businesses" },
        { value: "62%", label: "Of handyman calls go unanswered during work hours" },
        { value: "< 3 sec", label: "AI response time — faster than any receptionist" },
    ],
};

export default function Page() {
    return <IndustryPage data={DATA} />;
}
