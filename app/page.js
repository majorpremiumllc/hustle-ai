"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ChatWidget from "./components/ChatWidget";
import AIActivityFeed from "./components/AIActivityFeed";
import MagneticButton from "./components/MagneticButton";
import HustleLogo from "./components/HustleLogo";
import AIModeSwitch from "./components/AIModeSwitch";
import UnlockSection, { NeuralRevealProvider } from "./components/UnlockSection";
import NeuralGuideSpine from "./components/NeuralGuideSpine";
import { CallPanel, RevenueDashPanel, FeaturePanel, IndustryPanel } from "./components/AIPanels";
import styles from "./page.module.css";

/* ── Lazy-loaded heavy components (performance) ── */
const ParticleNetwork = dynamic(() => import("./components/ParticleNetwork"), { ssr: false });
const CustomCursor = dynamic(() => import("./components/CustomCursor"), { ssr: false });
const HolographicOrb = dynamic(() => import("./components/HolographicOrb"), { ssr: false });
const VoiceDemo = dynamic(() => import("./components/VoiceDemo"), { ssr: false });
const RevenueCounter = dynamic(() => import("./components/RevenueCounter"), { ssr: false });
const DemoModal = dynamic(() => import("./components/DemoModal"), { ssr: false });
const LightningJourney = dynamic(() => import("./components/LightningJourney"), { ssr: false });
const NeuralProof = dynamic(() => import("./components/NeuralProof"), { ssr: false });
const LossSimulation = dynamic(() => import("./components/LossSimulation"), { ssr: false });
const RevenueSimulator = dynamic(() => import("./components/RevenueSimulator"), { ssr: false });
const AIGreeter = dynamic(() => import("./components/AIGreeter"), { ssr: false });
const TourOverlay = dynamic(() => import("./components/TourOverlay"), { ssr: false });
const NeuralPulse = dynamic(() => import("./components/NeuralPulse"), { ssr: false });
const NeuralEmpathy = dynamic(() => import("./components/NeuralEmpathy"), { ssr: false });
const HoloAssistant = dynamic(() => import("./components/HoloAssistant"), { ssr: false });
import TourProvider from "./components/TourManager";

/* ── SVG Icon Components ───────────────────────── */

const IconBolt = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const IconMinus = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const IconStar = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const IconArrowRight = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const IconShield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/* ── Industry SVG Icons ──────────────────────────── */

const IndustryIcon = ({ type }) => {
  const icons = {
    Handyman: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
    Electrician: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    Plumber: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v6m0 0a4 4 0 014 4v8a2 2 0 01-2 2h-4a2 2 0 01-2-2v-8a4 4 0 014-4z" /><path d="M6 8h12" /></svg>,
    HVAC: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /><circle cx="12" cy="12" r="4" /></svg>,
    Cleaning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /><path d="M9 9h1m-1 4h1m4-4h1m-1 4h1" /></svg>,
    Landscaping: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22V8M7 22l5-14 5 14" /><path d="M5 12a7 7 0 0114 0" /></svg>,
    Painting: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 3H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" /><path d="M12 11v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-1" /></svg>,
    Contractor: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M4 20V8l8-5 8 5v12" /><path d="M9 20v-6h6v6m-3-12v.01" /></svg>,
    "Pest Control": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>,
    "Auto Repair": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
    Salon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v18M18 3v18" /><path d="M6 8h12M6 15h12" /><circle cx="12" cy="5" r="2" /></svg>,
    "Pet Services": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
    Photography: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    Moving: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
    "Pool & Spa": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0" /><path d="M2 16c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0" /><path d="M6 12V4m12 8V4" /></svg>,
    Locksmith: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /><circle cx="12" cy="16" r="1" /></svg>,
    Legal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    Accounting: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    Wellness: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    Restaurant: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>,
  };
  return <div className={styles.svgIcon}>{icons[type] || icons.Handyman}</div>;
};

/* ── Data ──────────────────────────────────────── */

const PLANS = {
  month: [
    {
      name: "Starter",
      price: 49,
      desc: "For solo operators & small teams",
      features: [
        { text: "SMS + Voice AI auto-responder", included: true },
        { text: "Up to 100 leads/month", included: true },
        { text: "1 AI phone number", included: true },
        { text: "2 integration sources", included: true },
        { text: "Lead dashboard + basic analytics", included: true },
        { text: "24/7 AI answering", included: true },
        { text: "Custom AI scripts", included: false },
        { text: "Team members", included: false },
        { text: "CRM export & API", included: false },
      ],
    },
    {
      name: "Professional",
      price: 99,
      desc: "For growing service businesses",
      popular: true,
      features: [
        { text: "SMS + Voice AI calls", included: true },
        { text: "Up to 500 leads/month", included: true },
        { text: "2 AI phone numbers", included: true },
        { text: "All integrations (Yelp, Thumbtack, Google)", included: true },
        { text: "Full dashboard + advanced analytics", included: true },
        { text: "Custom AI scripts & tone", included: true },
        { text: "Up to 5 team members", included: true },
        { text: "CRM export + Zapier", included: true },
        { text: "Priority email support", included: true },
      ],
    },
    {
      name: "Business",
      price: 199,
      desc: "For teams, multi-location & agencies",
      features: [
        { text: "SMS + Voice AI calls", included: true },
        { text: "Unlimited leads", included: true },
        { text: "Up to 5 phone numbers", included: true },
        { text: "All integrations (Yelp, Thumbtack, Google)", included: true },
        { text: "Full dashboard + custom reports", included: true },
        { text: "Custom AI scripts & voice cloning", included: true },
        { text: "Unlimited team members", included: true },
        { text: "CRM export + API access + Zapier", included: true },
        { text: "White-label & dedicated support", included: true },
      ],
    },
  ],
  year: [
    {
      name: "Starter",
      price: 39,
      desc: "For solo operators & small teams",
      annual: 468,
      features: [
        { text: "SMS + Voice AI auto-responder", included: true },
        { text: "Up to 100 leads/month", included: true },
        { text: "1 AI phone number", included: true },
        { text: "2 integration sources", included: true },
        { text: "Lead dashboard + basic analytics", included: true },
        { text: "24/7 AI answering", included: true },
        { text: "Custom AI scripts", included: false },
        { text: "Team members", included: false },
        { text: "CRM export & API", included: false },
      ],
    },
    {
      name: "Professional",
      price: 79,
      desc: "For growing service businesses",
      popular: true,
      annual: 948,
      features: [
        { text: "SMS + Voice AI calls", included: true },
        { text: "Up to 500 leads/month", included: true },
        { text: "2 AI phone numbers", included: true },
        { text: "All integrations (Yelp, Thumbtack, Google)", included: true },
        { text: "Full dashboard + advanced analytics", included: true },
        { text: "Custom AI scripts & tone", included: true },
        { text: "Up to 5 team members", included: true },
        { text: "CRM export + Zapier", included: true },
        { text: "Priority email support", included: true },
      ],
    },
    {
      name: "Business",
      price: 159,
      desc: "For teams, multi-location & agencies",
      annual: 1908,
      features: [
        { text: "SMS + Voice AI calls", included: true },
        { text: "Unlimited leads", included: true },
        { text: "Up to 5 phone numbers", included: true },
        { text: "All integrations (Yelp, Thumbtack, Google)", included: true },
        { text: "Full dashboard + custom reports", included: true },
        { text: "Custom AI scripts & voice cloning", included: true },
        { text: "Unlimited team members", included: true },
        { text: "CRM export + API access + Zapier", included: true },
        { text: "White-label & dedicated support", included: true },
      ],
    },
  ],
};

const VALUE_PROPS = [
  {
    tag: "Never Lose a Customer",
    title: "62% of Calls Go Unanswered. Not Anymore.",
    desc: "Small businesses lose $126,000/year from missed calls. 85% of callers who don't get an answer go straight to your competitor. HustleAI picks up every single call in under 3 seconds — 24/7, 365 days a year.",
    stats: [
      { value: "$126K", label: "Average annual loss from missed calls" },
      { value: "85%", label: "Of callers won't call back" },
      { value: "<3s", label: "Our AI response time" },
    ],
    panel: "call",
    reverse: false,
  },
  {
    tag: "Boost Revenue",
    title: "Turn Every Call Into a Booked Job",
    desc: "Our AI doesn't just answer — it qualifies leads, schedules appointments, provides estimates, and captures all the details you need. Businesses using HustleAI see 40% more booked jobs in the first month.",
    stats: [
      { value: "+40%", label: "More booked jobs" },
      { value: "98%", label: "Lead capture rate" },
      { value: "24/7", label: "Always on, never sick" },
    ],
    panel: "revenue",
    reverse: true,
  },
];

const INDUSTRY_SHOWCASES = [
  {
    name: "Plumbers",
    desc: "AI dispatches emergency calls, schedules inspections, and gives accurate pricing estimates.",
  },
  {
    name: "Hair Salons",
    desc: "Automated appointment booking, service recommendations, and waitlist management.",
  },
  {
    name: "Electricians",
    desc: "AI handles electrical service requests, safety questions, and schedules diagnostic visits.",
  },
  {
    name: "Landscaping",
    desc: "Seasonal scheduling, lawn care quotes, and project consultation booking — all automated.",
  },
  {
    name: "Restaurants",
    desc: "Reservation booking, catering inquiries, and menu questions handled by AI instantly.",
  },
];

const ALL_INDUSTRIES = [
  "Handyman", "Electrician", "Plumber", "HVAC", "Cleaning",
  "Landscaping", "Painting", "Contractor", "Pest Control", "Auto Repair",
  "Salon", "Pet Services", "Photography", "Moving", "Pool & Spa",
  "Locksmith", "Legal", "Accounting", "Wellness", "Restaurant",
];

const FEATURES = [
  { type: "phone", title: "AI Phone Answering", desc: "AI answers calls in human-like voice, qualifies leads, and schedules appointments — instantly." },
  { type: "sms", title: "SMS Auto-Responder", desc: "Missed call? AI texts back within 5 seconds with a personalized message to keep the lead warm." },
  { type: "yelp", title: "Yelp & Thumbtack", desc: "Auto-respond to Yelp messages and Thumbtack leads before your competitors even see them." },
  { type: "google", title: "Google Integration", desc: "Capture leads from Google Business Profile and Local Services Ads directly into your pipeline." },
  { type: "dashboard", title: "Smart Dashboard", desc: "See all calls, messages, leads, and revenue in real-time. Know exactly what's working." },
  { type: "setup", title: "5-Minute Setup", desc: "Choose your number, customize AI, go live. No IT skills needed. No contracts." },
];

const STEPS = [
  { num: "01", title: "Sign Up", desc: "Create your account and pick a plan that fits." },
  { num: "02", title: "Get AI Number", desc: "Choose a local phone number — AI is ready instantly." },
  { num: "03", title: "Customize", desc: "Set your services, pricing, greeting, and tone." },
  { num: "04", title: "Go Live", desc: "AI starts answering calls and booking jobs." },
];

const TESTIMONIALS = [
  {
    quote: "I was losing jobs left and right because I couldn't answer calls while on a job site. HustleAI changed everything — booked 40% more jobs in the first month.",
    name: "Mike R.",
    role: "Master Plumber, Las Vegas",
    rating: 5,
    revenue: "+$4,200/mo",
  },
  {
    quote: "My Yelp response time went from 3 hours to 3 seconds. Customers were amazed they got an instant, helpful reply. Best investment I've made this year.",
    name: "Sarah K.",
    role: "Salon Owner, Miami",
    rating: 5,
    revenue: "+$2,800/mo",
  },
  {
    quote: "I run a 5-person crew and we used to miss 10+ calls a day. Now every single lead is captured. The AI even books the follow-up visit for us.",
    name: "James T.",
    role: "Pest Control, Dallas",
    rating: 5,
    revenue: "+$5,100/mo",
  },
];

const FAQ_DATA = [
  { q: "How does the AI actually answer my calls?", a: "When a call comes in, our AI answers instantly in a natural, human-like voice powered by advanced language models. It greets the caller, understands their request, qualifies the lead, provides basic info about your services, and can schedule appointments — all without you lifting a finger." },
  { q: "Will callers know they're talking to AI?", a: "Our AI sounds remarkably natural and conversational. Most callers won't notice the difference. If the AI encounters something complex, it smoothly offers to have you call back — just like a real receptionist would." },
  { q: "How long does setup take?", a: "About 5 minutes. Sign up, choose a local phone number, customize your greeting and services, and you're live. No technical skills needed. No contracts. You can forward your existing business number to the AI number instantly." },
  { q: "What happens to the leads the AI captures?", a: "Every call and message is logged in your dashboard in real-time. You'll see the caller's name, phone number, what they need, and the AI's transcript. You can also export leads to your CRM or get instant notifications via SMS/email." },
  { q: "Can I customize what the AI says?", a: "Absolutely. You control the greeting, tone, services list, pricing guidance, business hours, and booking rules. The AI adapts to your specific business type automatically — whether you're a plumber, salon, electrician, or any of 25+ industries." },
  { q: "Does it work with Yelp, Thumbtack, and Google?", a: "Yes! HustleAI auto-responds to Yelp messages and Thumbtack leads within seconds — before your competitors even see them. Google Business Profile leads are captured directly into your pipeline too." },
  { q: "What if I want to cancel?", a: "Cancel anytime with one click from your dashboard — no contracts, no cancellation fees, no questions asked. We also offer a free 7-day trial so you can test everything risk-free before committing." },
  { q: "How much does it cost compared to a receptionist?", a: "A full-time receptionist costs $2,500–$4,000/month. HustleAI starts at $49/month — that's less than $2/day — and works 24/7/365, weekends, holidays, and 3 AM emergency calls included. Most businesses see ROI within the first week from just one extra booked job." },
];

/* ── Component ─────────────────────────────────── */

export default function LandingPage() {
  const [billing, setBilling] = useState("month");
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroText, setHeroText] = useState("");
  const [heroTypingDone, setHeroTypingDone] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const plans = PLANS[billing];
  const heroFullText = "AI Answers Every Call & Message.";

  const handleCheckout = async (planName) => {
    setCheckoutLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, interval: billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Payment error. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Connection error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  /* ── Scroll progress bar (throttled via rAF) ──── */
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── Typewriter effect ──────────────────────── */
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setHeroText(heroFullText.slice(0, i + 1));
      i++;
      if (i >= heroFullText.length) {
        clearInterval(timer);
        setHeroTypingDone(true);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [heroFullText]);

  /* ── Scroll reveal observer ─────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Close mobile menu on resize ────────────── */
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── 3D tilt handler for cards ───────────────── */
  const handleTilt = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }, []);

  const handleTiltReset = useCallback((e) => {
    e.currentTarget.style.transform = "";
  }, []);

  /* old cursor-glow replaced by CustomCursor component */

  const Counter = ({ value }) => {
    const [display, setDisplay] = useState(value);
    const ref = useRef(null);
    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          const numericVal = parseInt(value.replace(/[^0-9]/g, ""));
          if (!numericVal) { setDisplay(value); return; }
          const duration = 1500;
          const startTime = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * numericVal);
            setDisplay(value.replace(/[0-9,]+/, current.toLocaleString()));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      }, { threshold: 0.5 });
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [value]);
    return <strong ref={ref}>{display}</strong>;
  };

  return (
    <NeuralRevealProvider sectionIds={["features", "industries", "loss", "calculator", "pricing", "cta"]}>
      <TourProvider>
        <div className={styles.landing}>
          <ParticleNetwork />
          <CustomCursor />
          <AIGreeter />
          <NeuralGuideSpine />
          <TourOverlay />
          <NeuralPulse />

          {/* ── Scroll Progress Bar ──────────────────────── */}
          <div className={styles.scrollProgress} style={{ width: `${scrollProgress}%` }} />

          {/* ── Navigation ──────────────────────────────── */}
          <nav className={styles.nav}>
            <div className={`container ${styles.navInner}`}>
              <a href="/" className={styles.logo}>
                <HustleLogo variant="full" size={30} />
              </a>
              <div className={styles.navLinks}>
                <a href="#features">Features</a>
                <a href="#industries">Industries</a>
                <a href="#pricing">Pricing</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className={styles.navActions}>
                <AIModeSwitch />
                <button
                  className="btn btn-ghost"
                  onClick={() => { if (window.__hustleStartTour) window.__hustleStartTour(); }}
                  style={{ fontSize: '0.85rem', gap: '4px' }}
                >
                  ▶ Tour
                </button>
                <a href="/login" className="btn btn-ghost">Log In</a>
                <a href="/signup" className="btn btn-primary">Start Free Trial</a>
              </div>
              {/* ── Hamburger ─────────────────────────────── */}
              <button
                className={`${styles.hamburger} ${mobileMenuOpen ? styles.hamburgerActive : ""}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span /><span /><span />
              </button>
            </div>
          </nav>

          {/* ── Mobile Menu Overlay ──────────────────────── */}
          <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#industries" onClick={() => setMobileMenuOpen(false)}>Industries</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <button
              className={styles.mobileTourBtn}
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => { if (window.__hustleStartTour) window.__hustleStartTour(); }, 350);
              }}
            >
              ▶ Tour
            </button>
            <div className={styles.mobileMenuActions}>
              <a href="/login" className="btn btn-ghost" onClick={() => setMobileMenuOpen(false)}>Log In</a>
              <a href="/signup" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</a>
            </div>
          </div>

          {/* ── Hero ────────────────────────────────────── */}
          <section className={styles.hero}>
            <div className={styles.heroGlow} />
            <div className="grid-bg" />
            <div className={`orb orb-primary ${styles.heroOrb1}`} />
            <div className={`orb orb-accent ${styles.heroOrb2}`} />

            <div className={`container ${styles.heroInner}`}>
              <div className="animate-fadeInUp">
                <div className={styles.heroBadge}>
                  <span className={styles.heroBadgeDot} />
                  Your Calls Answered. Your Revenue Protected.
                </div>
              </div>

              {/* AI Status Chip */}
              <div className={`animate-fadeInUp ${styles.statusChip}`}>
                <span className={styles.statusDot} />
                <span>AI Active</span>
                <span className={styles.statusSep}>•</span>
                <span>Answering Calls</span>
              </div>
              <h1 className="animate-fadeInUp delay-1">
                Your AI Employee That<br />
                <span className="text-gradient">{heroText}<span className={`${styles.typingCursor} ${heroTypingDone ? styles.typingDone : ""}`}>|</span></span>
              </h1>
              <p className={`animate-fadeInUp delay-2 ${styles.heroSub}`}>
                <strong style={{ color: "var(--text-white)" }}>85% of callers who reach voicemail never call back.</strong>{" "}
                HustleAI answers every call in under 3 seconds, qualifies leads, and books jobs — 24/7, on autopilot.
              </p>
              <div className={`animate-fadeInUp delay-3 ${styles.heroCtas}`}>
                <MagneticButton href="/signup" className="btn btn-accent btn-lg">
                  Start Free 7-Day Trial <IconArrowRight className={styles.btnIconInline} />
                </MagneticButton>
                <MagneticButton href="#how-it-works" className="btn btn-secondary btn-lg">
                  Watch How It Works
                </MagneticButton>
                <button onClick={() => setDemoOpen(true)} className={`btn btn-ghost btn-lg ${styles.demoBtn}`}>
                  ▶ Try a 10-sec Demo
                </button>
              </div>

              {/* AI Activity Feed */}
              <div className="animate-fadeInUp delay-5">
                <AIActivityFeed />
              </div>

              <div className={`animate-fadeInUp delay-4 ${styles.socialProof}`}>
                <div className={styles.avatarStack}>
                  <span className={styles.avatar} style={{ background: "linear-gradient(135deg, #6C5CE7, #A29BFE)" }}>M</span>
                  <span className={styles.avatar} style={{ background: "linear-gradient(135deg, #00B894, #55efc4)" }}>S</span>
                  <span className={styles.avatar} style={{ background: "linear-gradient(135deg, #00D2FF, #0984e3)" }}>J</span>
                  <span className={styles.avatar} style={{ background: "linear-gradient(135deg, #FDCB6E, #e17055)" }}>A</span>
                  <span className={styles.avatar} style={{ background: "linear-gradient(135deg, #FF6B6B, #e74c3c)" }}>R</span>
                </div>
                <span className={styles.socialProofText}>
                  <strong>2,500+</strong> businesses recovered revenue with HustleAI
                </span>
                <span className={styles.starsRow}>
                  {[...Array(5)].map((_, i) => <IconStar key={i} className={styles.starIcon} />)}
                </span>
              </div>
            </div>

            <div className={`animate-fadeInUp delay-5 ${styles.heroImage}`}>
              <HolographicOrb />
            </div>
          </section>

          {/* ── Revenue Counter ──────────────────────────── */}
          <RevenueCounter />

          {/* ── Value Propositions ──────────────────────── */}
          {VALUE_PROPS.map((vp, i) => (
            <section key={i} className={styles.valueSection}>
              <div className={`container ${styles.valueInner} ${vp.reverse ? styles.valueReverse : ""}`}>
                <div className={`${vp.reverse ? "reveal-right" : "reveal-left"} ${styles.valueContent}`}>
                  <span className={styles.valueTag}>{vp.tag}</span>
                  <h2>{vp.title}</h2>
                  <p className={styles.valueDesc}>{vp.desc}</p>
                  <div className={styles.valueStats}>
                    {vp.stats.map((s, j) => (
                      <div key={j} className={styles.valueStat}>
                        <Counter value={s.value} />
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${vp.reverse ? "reveal-left" : "reveal-right"} ${styles.valueImage}`}>
                  {vp.panel === "call" ? <CallPanel /> : <RevenueDashPanel />}
                </div>
              </div>
            </section>
          ))}

          <div className="glass-divider" />

          {/* ── Features ────────────────────────────────── */}
          <UnlockSection id="features">
            <section id="features" className={styles.features}>
              <div className="container">
                <div className="text-center reveal">
                  <span className={styles.sectionTag}>The Platform</span>
                  <h2>One System. <span className="text-gradient">Every Channel Covered.</span></h2>
                  <p className={styles.sectionSub}>
                    Phone calls, SMS, Yelp, Thumbtack, Google — every lead captured and converted.
                  </p>
                </div>
                <div className={`${styles.featuresGrid} stagger-children`}>
                  {FEATURES.map((f, i) => (
                    <div key={i} className={`card ${styles.featureCard} reveal`}
                      onMouseMove={handleTilt}
                      onMouseLeave={handleTiltReset}
                    >
                      <div className={`${styles.featureImageWrap} float-icon`}>
                        <FeaturePanel type={f.type} />
                      </div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  ))}
                </div>
                <div className={`text-center reveal ${styles.midCta}`}>
                  <p className={styles.midCtaText}>See it in action — go live in 5 minutes.</p>
                  <a href="/signup" className="btn btn-accent">Start Free Trial <IconArrowRight className={styles.btnIconInline} /></a>
                </div>
              </div>
            </section>
          </UnlockSection>

          <div className="glass-divider" />

          {/* ── Industry Showcases (with images) ─────── */}
          <UnlockSection id="industries">
            <section id="industries" className={styles.industriesSection}>
              <div className="container">
                <div className="text-center reveal">
                  <span className={styles.sectionTag}>25+ Industries</span>
                  <h2>Built for <span className="text-gradient">Every Industry</span></h2>
                  <p className={styles.sectionSub}>
                    From plumbers to salons, our AI adapts to your business type automatically.
                  </p>
                </div>

                <div className={styles.industryShowcases}>
                  {INDUSTRY_SHOWCASES.map((ind, i) => (
                    <div key={i} className={`${styles.industryCard} ${i % 2 === 1 ? "reveal-right" : "reveal-left"}`}>
                      <div className={styles.industryCardImage}>
                        <IndustryPanel name={ind.name} desc={ind.desc} />
                      </div>
                      <div className={styles.industryCardContent}>
                        <h3>{ind.name}</h3>
                        <p>{ind.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center reveal" style={{ marginTop: "48px" }}>
                  <h3 style={{ fontSize: "1.3rem", marginBottom: "24px" }}>...and <span className="text-gradient">15+ more</span></h3>
                </div>
                <div className={`${styles.allIndustriesGrid} ${styles.scanGrid} stagger-children`}>
                  {ALL_INDUSTRIES.map((name, i) => (
                    <div key={i} className={`${styles.miniIndustryCard} reveal`}>
                      <IndustryIcon type={name} />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </UnlockSection>

          <div className="glass-divider" />

          {/* ── Holographic AI Assistant ──────────────────── */}
          <HoloAssistant />

          <div className="glass-divider" />

          {/* ── Neural Empathy Engine ──────────────────────── */}
          <NeuralEmpathy />

          <div className="glass-divider" />

          {/* ── Neural Proof ──────────────────────────────── */}
          <NeuralProof />

          <div className="glass-divider" />

          {/* ── AI Voice Demo ────────────────────────────── */}
          <VoiceDemo />


          {/* ── Social Proof Counters ──────────────────────── */}
          <section className={styles.socialProof}>
            <div className="container">
              <div className={`text-center reveal ${styles.socialProofHeader}`}>
                <span className={styles.sectionTag}>Proven Results</span>
                <h2>Numbers That <span className="text-gradient">Speak For Themselves</span></h2>
                <p className={styles.sectionSub}>
                  Real businesses. Real results. Join the thousands already growing with AI.
                </p>
              </div>
              <div className={`${styles.proofCounters} stagger-children`}>
                {[
                  { value: "2,500+", label: "Businesses Automated", sub: "Across 25+ industries" },
                  { value: "$12M+", label: "Revenue Recovered", sub: "From missed calls alone" },
                  { value: "99.7%", label: "Uptime Guaranteed", sub: "Enterprise-grade reliability" },
                  { value: "<3 sec", label: "Average Response Time", sub: "Faster than any human" },
                ].map((stat, i) => (
                  <div key={i} className={`card ${styles.proofCounterCard} reveal`}
                    onMouseMove={handleTilt}
                    onMouseLeave={handleTiltReset}
                  >
                    <div className={styles.proofCounterValue}>{stat.value}</div>
                    <div className={styles.proofCounterLabel}>{stat.label}</div>
                    <div className={styles.proofCounterSub}>{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="glass-divider" />

          {/* ── How It Works: Lightning Journey ──────────── */}
          <LightningJourney />

          <div className="glass-divider" />

          {/* ── Loss Simulation ───────────────────────────── */}
          <UnlockSection id="loss">
            <LossSimulation />
          </UnlockSection>

          <div className="glass-divider" />

          {/* ── Revenue Leakage Simulator ─────────────────── */}
          <UnlockSection id="calculator">
            <RevenueSimulator />
          </UnlockSection>

          <div className="glass-divider" />

          {/* ── Pricing ─────────────────────────────────── */}
          <UnlockSection id="pricing">
            <section id="pricing" className={styles.pricing}>
              <div className="container">
                <div className="text-center reveal">
                  <span className={styles.sectionTag}>Transparent Pricing</span>
                  <h2>Plans That <span className="text-gradient">Pay For Themselves</span></h2>
                  <p className={styles.sectionSub}>
                    One missed call costs your business $100-$1,200. HustleAI pays for itself with the first answered call.
                  </p>
                  <div className={styles.billingToggle}>
                    <div className="pricing-toggle">
                      <button className={billing === "month" ? "active" : ""} onClick={() => setBilling("month")}>Monthly</button>
                      <button className={billing === "year" ? "active" : ""} onClick={() => setBilling("year")}>
                        Annual <span className={styles.saveBadge}>Save 20%</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`${styles.pricingGrid} stagger-children`}>
                  {plans.map((plan, i) => (
                    <div key={i} className={`pricing-card ${plan.popular ? "featured" : ""} reveal`}
                      onMouseMove={handleTilt}
                      onMouseLeave={handleTiltReset}
                    >
                      {plan.popular && <div className="popular-badge">Most Popular</div>}
                      <div className="plan-name">{plan.name}</div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>{plan.desc}</p>
                      <div className="price">${plan.price}<span>/mo</span></div>
                      {billing === "year" && plan.annual && <div className="price-annual">Billed ${plan.annual}/year</div>}
                      <div className="features-list">
                        {plan.features.map((f, j) => (
                          <div key={j} className="feature-item">
                            {f.included
                              ? <IconCheck className={styles.checkIcon} />
                              : <IconMinus className={styles.minusIcon} />
                            }
                            <span style={{ color: f.included ? "var(--text-primary)" : "var(--text-muted)" }}>{f.text}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCheckout(plan.name)}
                        disabled={checkoutLoading !== null}
                        className={`btn ${plan.popular ? "btn-accent" : "btn-secondary"} btn-lg`}
                        style={{ width: "100%", marginTop: "24px" }}
                      >
                        {checkoutLoading === plan.name ? "Redirecting..." : plan.popular ? "Start Free Trial" : "Get Started"}
                      </button>
                      <div className={styles.cancelNote}>Cancel anytime · No contracts</div>
                      {plan.popular && <div className={styles.roiHint}>Typical payback: 3–7 days</div>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </UnlockSection>

          {/* ── Testimonials ────────────────────────────── */}
          <section className={styles.testimonials}>
            <div className="container">
              <div className="text-center reveal">
                <span className={styles.sectionTag}>Real Results</span>
                <h2>They Tried It. <span className="text-gradient">Revenue Went Up.</span></h2>
              </div>
              <div className={`${styles.testimonialGrid} stagger-children`}>
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className={`card ${styles.testimonialCard} reveal`}>
                    <div className={styles.starsRow}>
                      {[...Array(t.rating)].map((_, j) => <IconStar key={j} className={styles.starIcon} />)}
                    </div>
                    <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
                    <div className={styles.testimonialRevenue}>{t.revenue}</div>
                    <div className={styles.author}>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="glass-divider" />

          {/* ── FAQ ──────────────────────────────────────── */}
          <section id="faq" className={styles.faqSection}>
            <div className="container">
              <div className="text-center reveal">
                <span className={styles.sectionTag}>Common Questions</span>
                <h2>Got Questions? <span className="text-gradient">We've Got Answers.</span></h2>
                <p className={styles.sectionSub}>
                  Everything you need to know about HustleAI before you get started.
                </p>
              </div>
              <div className={styles.faqGrid}>
                {FAQ_DATA.map((item, i) => (
                  <div
                    key={i}
                    className={`${styles.faqItem} ${openFaq === i ? styles.faqItemOpen : ""}`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <button
                      className={styles.faqQuestion}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      <span>{item.q}</span>
                      <svg className={styles.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div className={styles.faqAnswer}>
                      <div className={styles.faqAnswerInner}>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────── */}
          <UnlockSection id="cta">
            <section className={styles.cta}>
              <div className={styles.ctaGlow} />
              <div className="grid-bg" />
              <div className="container text-center reveal-scale">
                <h2 style={{ fontSize: "2.5rem" }}>
                  Stop Missing Calls.<br />
                  <span className="text-gradient">Start Growing Revenue.</span>
                </h2>
                <p className={styles.sectionSub} style={{ maxWidth: "500px", margin: "16px auto 0" }}>
                  Join 2,500+ business owners who automated their dispatch with AI. 7-day free trial. No credit card required.
                </p>
                <a href="/signup" className="btn btn-accent btn-lg" style={{ marginTop: "32px" }}>
                  Start Your Free Trial <IconArrowRight className={styles.btnIconInline} />
                </a>
                <div className={styles.ctaTrust}>
                  <span><IconShield className={styles.trustIcon} /> No credit card required</span>
                  <span><IconShield className={styles.trustIcon} /> Cancel anytime</span>
                  <span><IconShield className={styles.trustIcon} /> Setup in 5 minutes</span>
                </div>
              </div>
            </section>
          </UnlockSection>

          {/* ── Footer ──────────────────────────────────── */}
          <footer className={styles.footer}>
            <div className={`container ${styles.footerInner}`}>
              <div className={styles.footerBrand}>
                <div className={styles.footerLogo}>
                  <HustleLogo variant="full" size={26} />
                </div>
                <p style={{ marginTop: "8px", fontSize: "0.85rem" }}>AI-powered business growth platform.</p>
              </div>
              <div className={styles.footerLinks}>
                <div>
                  <h5>Product</h5>
                  <a href="#features">Features</a>
                  <a href="#pricing">Pricing</a>
                  <a href="#how-it-works">How It Works</a>
                </div>
                <div>
                  <h5>Company</h5>
                  <a href="#">About</a>
                  <a href="#">Contact</a>
                  <a href="/privacy">Privacy Policy</a>
                  <a href="/terms">Terms of Service</a>
                </div>
                <div>
                  <h5>Support</h5>
                  <a href="#">Help Center</a>
                  <a href="#">Status</a>
                  <a href="#">API Docs</a>
                </div>
              </div>
              <div className={styles.footerBottom}>
                <p>&copy; 2026 HustleAI. All rights reserved.</p>
              </div>
            </div>
          </footer>

          <ChatWidget />
          <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
        </div>
      </TourProvider>
    </NeuralRevealProvider>
  );
}
