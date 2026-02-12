/**
 * Master list of industries and their services.
 * Used by onboarding wizard, AI prompts, and settings.
 * Based on Yelp, Thumbtack, and Google Local Services Ads categories.
 */

export const INDUSTRIES = [
    {
        id: "handyman",
        name: "Handyman",
        icon: "🔧",
        services: [
            "TV Mounting", "Drywall Repair", "Painting", "Furniture Assembly",
            "Shelf & Curtain Installation", "Door Repair", "Flooring Repair",
            "Minor Plumbing", "Minor Electrical", "Pressure Washing",
            "Fence Repair", "Deck Repair", "Accent Walls", "Caulking & Weatherproofing"
        ],
        greeting: "Hi! Thanks for calling {company}. I can help you schedule a handyman visit or get a quote. What do you need help with today?",
        questions: ["type of work", "photos of the area", "address", "timeline"],
    },
    {
        id: "electrician",
        name: "Electrician",
        icon: "🔌",
        services: [
            "Outlet & Switch Installation", "Panel Upgrade", "Wiring & Rewiring",
            "Lighting Installation", "Ceiling Fan Install", "EV Charger Installation",
            "Circuit Breaker Repair", "Smoke Detector Install", "Landscape Lighting",
            "Generator Installation", "Electrical Inspection", "Surge Protection"
        ],
        greeting: "Hi! Thanks for calling {company}. I can help you with any electrical work. What kind of electrical service do you need?",
        questions: ["type of electrical work", "residential or commercial", "address", "urgency"],
    },
    {
        id: "plumber",
        name: "Plumber",
        icon: "🚿",
        services: [
            "Leak Repair", "Drain Cleaning", "Water Heater Install/Repair",
            "Toilet Repair", "Faucet Install", "Pipe Repair", "Sewer Line",
            "Garbage Disposal", "Sump Pump", "Gas Line Repair",
            "Bathroom Remodel Plumbing", "Water Filtration"
        ],
        greeting: "Hi! Thanks for calling {company}. I can help with any plumbing issue. What's going on?",
        questions: ["plumbing issue description", "is it an emergency", "address", "when it started"],
    },
    {
        id: "hvac",
        name: "HVAC",
        icon: "❄️",
        services: [
            "AC Repair", "AC Installation", "Furnace Repair", "Furnace Installation",
            "Duct Cleaning", "Thermostat Install", "Mini-Split Installation",
            "Heat Pump", "Air Quality Testing", "Refrigerant Recharge",
            "Preventative Maintenance", "Ductwork Install"
        ],
        greeting: "Hi! Thanks for calling {company}. Is your AC or heating acting up? Tell me what's going on and we'll get it fixed.",
        questions: ["heating or cooling issue", "system type/age", "address", "urgency"],
    },
    {
        id: "cleaning",
        name: "Cleaning Service",
        icon: "🏠",
        services: [
            "Regular House Cleaning", "Deep Cleaning", "Move-In/Out Cleaning",
            "Office Cleaning", "Carpet Cleaning", "Window Cleaning",
            "Post-Construction Cleanup", "Airbnb Turnover", "Pressure Washing",
            "Upholstery Cleaning", "Tile & Grout Cleaning", "Janitorial Service"
        ],
        greeting: "Hi! Thanks for calling {company}. Looking for a cleaning service? I can help you get a quote. What type of cleaning do you need?",
        questions: ["type of cleaning", "square footage / rooms", "address", "preferred date"],
    },
    {
        id: "landscaping",
        name: "Landscaping & Lawn Care",
        icon: "🌿",
        services: [
            "Lawn Mowing", "Landscaping Design", "Tree Trimming", "Tree Removal",
            "Sprinkler Install/Repair", "Sod Installation", "Mulching",
            "Leaf Removal", "Hedge Trimming", "Hardscaping",
            "Patio/Walkway", "Retaining Walls", "Drainage Solutions"
        ],
        greeting: "Hi! Thanks for calling {company}. Need help with your yard or landscaping? Tell me what you're looking for.",
        questions: ["type of yard work", "property size", "address", "recurring or one-time"],
    },
    {
        id: "painting",
        name: "Painting",
        icon: "🎨",
        services: [
            "Interior Painting", "Exterior Painting", "Cabinet Painting",
            "Staining", "Wallpaper Removal", "Wallpaper Installation",
            "Drywall Texture", "Popcorn Ceiling Removal", "Trim & Baseboard Painting",
            "Commercial Painting", "Deck Staining", "Epoxy Garage Floor"
        ],
        greeting: "Hi! Thanks for calling {company}. Looking to get some painting done? Tell me about your project.",
        questions: ["interior or exterior", "number of rooms/area", "address", "preferred colors"],
    },
    {
        id: "general_contractor",
        name: "General Contractor",
        icon: "🏗️",
        services: [
            "Kitchen Remodel", "Bathroom Remodel", "Room Addition",
            "Basement Finishing", "Deck & Patio Building", "Garage Conversion",
            "ADU Construction", "Commercial Build-Out", "Structural Repair",
            "Permit Management", "Full Home Renovation", "Custom Carpentry"
        ],
        greeting: "Hi! Thanks for calling {company}. Tell me about your construction or remodeling project and we'll set up a consultation.",
        questions: ["project type", "scope & budget range", "address", "timeline"],
    },
    {
        id: "pest_control",
        name: "Pest Control",
        icon: "🪲",
        services: [
            "General Pest Control", "Termite Treatment", "Rodent Control",
            "Bed Bug Treatment", "Mosquito Treatment", "Ant Control",
            "Cockroach Control", "Wasp & Bee Removal", "Wildlife Removal",
            "Fumigation", "Preventative Pest Plans", "Commercial Pest Control"
        ],
        greeting: "Hi! Thanks for calling {company}. Having a pest problem? Tell me what you're dealing with and we'll take care of it.",
        questions: ["type of pest", "how long the issue", "address", "urgency"],
    },
    {
        id: "roofing",
        name: "Roofing",
        icon: "🏠",
        services: [
            "Roof Repair", "Roof Replacement", "Roof Inspection",
            "Gutter Installation", "Gutter Repair", "Gutter Cleaning",
            "Skylight Install", "Leak Repair", "Storm Damage Repair",
            "Flat Roof", "Metal Roofing", "Shingle Replacement"
        ],
        greeting: "Hi! Thanks for calling {company}. Need roofing work? Tell me what's going on with your roof.",
        questions: ["repair or replacement", "roof type", "was there storm damage", "address"],
    },
    {
        id: "auto_repair",
        name: "Auto Repair & Detailing",
        icon: "🚗",
        services: [
            "Oil Change", "Brake Service", "Engine Repair", "Transmission",
            "Tire Service", "Battery Replacement", "AC Repair",
            "Auto Detailing", "Dent Repair", "Paint Touch-Up",
            "Diagnostic", "Suspension & Alignment", "Pre-Purchase Inspection"
        ],
        greeting: "Hi! Thanks for calling {company}. Having car trouble? Tell me what's going on and we'll get you scheduled.",
        questions: ["vehicle year/make/model", "issue description", "drop-off or mobile", "urgency"],
    },
    {
        id: "beauty_salon",
        name: "Beauty & Salon",
        icon: "💇",
        services: [
            "Haircut", "Hair Color", "Highlights", "Blowout",
            "Manicure", "Pedicure", "Gel Nails", "Lash Extensions",
            "Waxing", "Facial", "Eyebrow Threading", "Barbershop Haircut",
            "Bridal Hair & Makeup", "Keratin Treatment"
        ],
        greeting: "Hi! Thanks for calling {company}. Would you like to book an appointment? What service are you interested in?",
        questions: ["service needed", "preferred date/time", "stylist preference", "first visit or returning"],
    },
    {
        id: "pet_services",
        name: "Pet Services",
        icon: "🐾",
        services: [
            "Dog Grooming", "Cat Grooming", "Pet Boarding", "Dog Walking",
            "Pet Sitting", "Dog Training", "Puppy Training",
            "Mobile Grooming", "Pet Daycare", "Pet Transportation",
            "Veterinary Checkup", "Pet Waste Removal"
        ],
        greeting: "Hi! Thanks for calling {company}. How can we help with your pet today?",
        questions: ["pet type & breed", "service needed", "preferred date", "any special needs"],
    },
    {
        id: "photography",
        name: "Photography & Video",
        icon: "📸",
        services: [
            "Portrait Photography", "Wedding Photography", "Headshots",
            "Real Estate Photography", "Product Photography", "Event Photography",
            "Family Photos", "Engagement Shoot", "Drone/Aerial",
            "Video Production", "Photo Editing", "Photo Booth Rental"
        ],
        greeting: "Hi! Thanks for calling {company}. What kind of photography or video project do you have in mind?",
        questions: ["type of shoot", "event date", "location", "number of people"],
    },
    {
        id: "moving",
        name: "Moving & Junk Removal",
        icon: "🚚",
        services: [
            "Local Moving", "Long Distance Moving", "Packing Service",
            "Unpacking", "Furniture Moving", "Piano Moving",
            "Junk Removal", "Estate Cleanout", "Storage",
            "Commercial Moving", "Pod Loading/Unloading", "Appliance Moving"
        ],
        greeting: "Hi! Thanks for calling {company}. Planning a move or need something hauled away? Tell me what you need.",
        questions: ["moving or junk removal", "from/to addresses", "size of move", "preferred date"],
    },
    {
        id: "pool_spa",
        name: "Pool & Spa",
        icon: "🏊",
        services: [
            "Pool Cleaning", "Pool Repair", "Pool Installation",
            "Hot Tub Maintenance", "Pool Equipment Repair", "Pool Resurfacing",
            "Water Chemistry", "Pool Opening/Closing", "Pool Heater Repair",
            "Leak Detection", "Pool Decking", "Spa Installation"
        ],
        greeting: "Hi! Thanks for calling {company}. Need help with your pool or spa? Tell me what's going on.",
        questions: ["pool or spa", "issue or service needed", "pool type/size", "address"],
    },
    {
        id: "locksmith",
        name: "Locksmith",
        icon: "🔒",
        services: [
            "Emergency Lockout", "Lock Rekey", "Lock Replacement",
            "Car Lockout", "Key Duplication", "Smart Lock Install",
            "Safe Opening", "Commercial Locks", "Master Key System",
            "Access Control", "Lock Repair", "Deadbolt Installation"
        ],
        greeting: "Hi! Thanks for calling {company}. Locked out or need lock service? Tell me your situation and we'll help right away.",
        questions: ["lockout or new install", "location type", "address", "urgency"],
    },
    {
        id: "real_estate",
        name: "Real Estate",
        icon: "🏡",
        services: [
            "Home Buying", "Home Selling", "Rental Listing",
            "Property Management", "Real Estate Appraisal", "Investment Properties",
            "First-Time Buyer Consultation", "Market Analysis",
            "Home Staging", "Short Sale", "Foreclosure", "Commercial Real Estate"
        ],
        greeting: "Hi! Thanks for calling {company}. Are you looking to buy, sell, or rent? I'd love to help you get started.",
        questions: ["buying, selling, or renting", "property type", "area/neighborhood", "budget range"],
    },
    {
        id: "legal",
        name: "Legal Services",
        icon: "⚖️",
        services: [
            "Family Law", "Immigration", "Personal Injury", "Business Law",
            "Estate Planning", "Criminal Defense", "Real Estate Law",
            "Bankruptcy", "Employment Law", "Tax Law",
            "Contract Review", "DUI Defense"
        ],
        greeting: "Hi! Thanks for calling {company}. I can help you schedule a consultation with our attorney. What area of law do you need help with?",
        questions: ["legal issue type", "brief description", "urgency", "preferred consultation time"],
    },
    {
        id: "accounting",
        name: "Accounting & Tax",
        icon: "📊",
        services: [
            "Tax Preparation", "Bookkeeping", "Payroll Services", "Tax Planning",
            "Business Formation", "Financial Statements", "Audit Preparation",
            "Quarterly Taxes", "IRS Resolution", "Financial Planning",
            "Sales Tax Filing", "Nonprofit Accounting"
        ],
        greeting: "Hi! Thanks for calling {company}. Need help with taxes, bookkeeping, or financial planning? I can get you set up with our team.",
        questions: ["service needed", "business or personal", "timeline/deadline", "preferred meeting time"],
    },
    {
        id: "health_wellness",
        name: "Health & Wellness",
        icon: "🏥",
        services: [
            "General Checkup", "Dental Cleaning", "Chiropractic", "Massage Therapy",
            "Physical Therapy", "Acupuncture", "Personal Training",
            "Yoga Classes", "Nutritionist", "Mental Health Counseling",
            "Dermatology", "Optometry"
        ],
        greeting: "Hi! Thanks for calling {company}. Would you like to schedule an appointment? I can help you find the right time.",
        questions: ["type of appointment", "new patient or returning", "insurance info", "preferred date/time"],
    },
    {
        id: "tutoring",
        name: "Tutoring & Lessons",
        icon: "📚",
        services: [
            "Math Tutoring", "English/Writing", "Science", "SAT/ACT Prep",
            "Music Lessons", "Piano Lessons", "Guitar Lessons",
            "Language Classes", "Dance Lessons", "Swimming Lessons",
            "Driving Lessons", "Art Classes"
        ],
        greeting: "Hi! Thanks for calling {company}. Looking for lessons or tutoring? Tell me what subject and who it's for.",
        questions: ["subject/instrument", "student age", "experience level", "preferred schedule"],
    },
    {
        id: "restaurant",
        name: "Restaurant & Catering",
        icon: "🍽️",
        services: [
            "Dine-In", "Takeout", "Delivery", "Catering",
            "Private Events", "Meal Prep", "Food Truck",
            "Wedding Catering", "Corporate Catering", "Bakery Orders",
            "Custom Cakes", "Party Platters"
        ],
        greeting: "Hi! Thanks for calling {company}. Would you like to place an order, make a reservation, or ask about catering?",
        questions: ["reservation, order, or catering", "number of guests", "date/time", "dietary requirements"],
    },
    {
        id: "solar",
        name: "Solar & Energy",
        icon: "⚡",
        services: [
            "Solar Panel Installation", "Solar Panel Repair", "Battery Storage",
            "Energy Audit", "EV Charger Installation", "Solar Consultation",
            "Net Metering Setup", "Inverter Replacement", "Panel Cleaning",
            "Commercial Solar", "Solar Financing Help", "Grid Tie-In"
        ],
        greeting: "Hi! Thanks for calling {company}. Interested in solar energy or energy solutions? I can help you learn more.",
        questions: ["own or rent home", "current electric bill", "address", "roof age/condition"],
    },
    {
        id: "windows_doors",
        name: "Windows & Doors",
        icon: "🪟",
        services: [
            "Window Replacement", "Window Repair", "Door Installation",
            "Sliding Door", "Storm Door", "French Door",
            "Window Tinting", "Window Screen Repair", "Glass Replacement",
            "Patio Door", "Garage Door Repair", "Garage Door Installation"
        ],
        greeting: "Hi! Thanks for calling {company}. Need new windows, doors, or repairs? Tell me about your project.",
        questions: ["windows or doors", "repair or new install", "how many", "address"],
    },
];

/**
 * Get industry by ID
 */
export function getIndustry(id) {
    return INDUSTRIES.find((i) => i.id === id);
}

/**
 * Industry display name → ID lookup
 */
export function getIndustryByName(name) {
    return INDUSTRIES.find((i) => i.name.toLowerCase() === name.toLowerCase());
}
