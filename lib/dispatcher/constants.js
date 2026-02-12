// ─────────────────────────────────────────────
// Major Premium LLC — Centralized Constants
// ─────────────────────────────────────────────

const COMPANY = {
  name: 'Major Premium LLC',
  industry: 'Handyman & Home Improvement Services',
  serviceArea: 'Las Vegas & nearby areas',
  phone: process.env.TWILIO_PHONE_NUMBER,
  ownerPhone: process.env.OWNER_PHONE_NUMBER,
  ownerEmail: process.env.OWNER_EMAIL,
};

const JOB_CATEGORIES = [
  'TV mounting',
  'Drywall repair',
  'Painting',
  'Flooring repair',
  'Door repair / replacement',
  'Furniture assembly',
  'Accent walls',
  'Plumbing minor repairs',
  'Electrical minor work',
  'General handyman services',
];

const ESCALATION_TRIGGERS = {
  budgetThreshold: 2000,
  keywords: [
    'full remodel',
    'remodeling',
    'renovation',
    'gutting',
    'speak to owner',
    'talk to owner',
    'manager',
    'supervisor',
  ],
  complexCategories: [
    'complex electrical',
    'complex plumbing',
    'panel upgrade',
    'rewiring',
    'main line',
    'sewer',
    'water heater replacement',
  ],
};

const URGENCY_OPTIONS = ['ASAP', 'Flexible', 'Specific date'];

const LEAD_STATUSES = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  ESTIMATE_SCHEDULED: 'Estimate Scheduled',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};

const LEAD_SOURCES = {
  YELP: 'Yelp',
  THUMBTACK: 'Thumbtack',
  DIRECT_CALL: 'Direct Call',
  SMS: 'SMS',
  UNKNOWN: 'Unknown',
};

const CONVERSATION_TTL = (parseInt(process.env.CONVERSATION_TTL_MINUTES) || 30) * 60 * 1000;

module.exports = {
  COMPANY,
  JOB_CATEGORIES,
  ESCALATION_TRIGGERS,
  URGENCY_OPTIONS,
  LEAD_STATUSES,
  LEAD_SOURCES,
  CONVERSATION_TTL,
};
