/* ============================================
   RE/MAX Inmomás — Firebase Configuration
   ============================================ 
   
   SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use existing)
   3. Enable Authentication (Email/Password)
   4. Enable Cloud Firestore
   5. Enable Cloud Storage
   6. Copy your config values below
   7. Set App.demoMode = false in this file
   ============================================ */

// ---- DEMO MODE ----
// Set to false once Firebase is configured
window.App = window.App || {};
App.demoMode = false;

// ---- Firebase Configuration ----
const firebaseConfig = {
  apiKey: "AIzaSyDbGxO4nw7r63pEZqgyCoH0UyM7h3Bl7lw",
  authDomain: "proyecto-internacional.firebaseapp.com",
  projectId: "proyecto-internacional",
  storageBucket: "proyecto-internacional.firebasestorage.app",
  messagingSenderId: "742675229560",
  appId: "1:742675229560:web:b35d82bc92d9cc393cb68d",
  measurementId: "G-NJHX0T2GZW"
};

// Initialize Firebase (only if not in demo mode)
if (!App.demoMode && typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  App.db = firebase.firestore();
  App.storage = firebase.storage();
  App.firebaseAuth = firebase.auth();
  console.log('[Firebase] Initialized successfully');
} else {
  console.log('[App] Running in DEMO MODE — no Firebase connection');
  App.db = null;
  App.storage = null;
  App.firebaseAuth = null;
}

// ---- Demo Data Store ----
// Used when App.demoMode is true
App.demoData = {
  users: [
    {
      id: 'admin-001',
      email: 'admin@remax-inmomas.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      firstName: 'Maia',
      lastName: 'Honczaryk',
      agencyName: 'RE/MAX Inmomás',
      phone: '+34 965 123 456',
      country: 'Spain',
      profileImage: null,
      createdAt: '2025-01-15T10:00:00Z'
    },
    {
      id: 'broker-001',
      email: 'john.broker@remaxusa.com',
      password: 'broker123',
      role: 'broker',
      status: 'active',
      firstName: 'John',
      lastName: 'Mitchell',
      agencyName: 'RE/MAX Premier - Miami',
      phone: '+1 305 555 0101',
      country: 'United States',
      referralCode: 'BRK-MITCHELL',
      profileImage: null,
      agreementSigned: true,
      agreementSignedAt: '2025-03-01T14:30:00Z',
      createdAt: '2025-02-10T09:00:00Z'
    },
    {
      id: 'broker-002',
      email: 'sarah.broker@century21.com',
      password: 'broker123',
      role: 'broker',
      status: 'active',
      firstName: 'Sarah',
      lastName: 'Williams',
      agencyName: 'Century 21 - Dallas',
      phone: '+1 214 555 0202',
      country: 'United States',
      referralCode: 'BRK-WILLIAMS',
      profileImage: null,
      agreementSigned: true,
      agreementSignedAt: '2025-04-15T11:00:00Z',
      createdAt: '2025-03-20T12:00:00Z'
    },
    {
      id: 'broker-003',
      email: 'pending.broker@example.com',
      password: 'broker123',
      role: 'broker',
      status: 'pending_broker',
      firstName: 'Mark',
      lastName: 'Thompson',
      agencyName: 'Keller Williams - Phoenix',
      phone: '+1 602 555 0303',
      country: 'United States',
      referralCode: 'BRK-THOMPSON',
      profileImage: null,
      agreementSigned: false,
      createdAt: '2025-06-25T16:00:00Z'
    },
    {
      id: 'realtor-001',
      email: 'mike.agent@remaxusa.com',
      password: 'realtor123',
      role: 'realtor',
      status: 'active',
      firstName: 'Mike',
      lastName: 'Reynolds',
      agencyName: 'RE/MAX Premier - Miami',
      phone: '+1 305 555 1001',
      country: 'United States',
      brokerId: 'broker-001',
      referralCode: 'REA-REYNOLDS',
      profileImage: null,
      agreementSigned: true,
      agreementSignedAt: '2025-03-15T10:00:00Z',
      createdAt: '2025-03-05T14:00:00Z'
    },
    {
      id: 'realtor-002',
      email: 'lisa.agent@remaxusa.com',
      password: 'realtor123',
      role: 'realtor',
      status: 'active',
      firstName: 'Lisa',
      lastName: 'Chen',
      agencyName: 'RE/MAX Premier - Miami',
      phone: '+1 305 555 1002',
      country: 'United States',
      brokerId: 'broker-001',
      referralCode: 'REA-CHEN',
      profileImage: null,
      agreementSigned: true,
      agreementSignedAt: '2025-04-01T09:00:00Z',
      createdAt: '2025-03-18T11:00:00Z'
    },
    {
      id: 'realtor-pending-1',
      email: 'new.agent@remaxusa.com',
      password: 'realtor123',
      role: 'realtor',
      status: 'pending_broker',
      firstName: 'Tom',
      lastName: 'Hanks',
      agencyName: 'RE/MAX Premier - Miami',
      phone: '+1 305 555 1003',
      country: 'United States',
      brokerId: 'broker-001',
      referralCode: 'REA-HANKS',
      profileImage: null,
      agreementSigned: false,
      createdAt: '2025-07-01T11:00:00Z'
    },
    {
      id: 'realtor-003',
      email: 'david.agent@century21.com',
      password: 'realtor123',
      role: 'realtor',
      status: 'active',
      firstName: 'David',
      lastName: 'Torres',
      agencyName: 'Century 21 - Dallas',
      phone: '+1 214 555 2001',
      country: 'United States',
      brokerId: 'broker-002',
      referralCode: 'REA-TORRES',
      profileImage: null,
      agreementSigned: false,
      createdAt: '2025-05-10T08:00:00Z'
    },
    {
      id: 'realtor-004',
      email: 'pending.realtor@example.com',
      password: 'realtor123',
      role: 'realtor',
      status: 'pending_broker',
      firstName: 'Emily',
      lastName: 'Johnson',
      agencyName: 'Coldwell Banker - Chicago',
      phone: '+1 312 555 3001',
      country: 'United States',
      brokerId: null,
      referralCode: 'REA-JOHNSON',
      profileImage: null,
      agreementSigned: false,
      createdAt: '2025-06-28T15:00:00Z'
    },
    {
      id: 'agent-inmomas-001',
      email: 'carlos.agent@remax-inmomas.com',
      password: 'agent123',
      role: 'agent_inmomas',
      status: 'active',
      firstName: 'Carlos',
      lastName: 'García',
      agencyName: 'RE/MAX Inmomás',
      phone: '+34 965 999 111',
      country: 'Spain',
      profileImage: null,
      createdAt: '2025-01-20T10:00:00Z'
    },
    {
      id: 'agent-inmomas-002',
      email: 'ana.agent@remax-inmomas.com',
      password: 'agent123',
      role: 'agent_inmomas',
      status: 'active',
      firstName: 'Ana',
      lastName: 'Martínez',
      agencyName: 'RE/MAX Inmomás',
      phone: '+34 965 999 222',
      country: 'Spain',
      profileImage: null,
      createdAt: '2025-02-01T10:00:00Z'
    }
  ],

  clients: [
    {
      id: 'client-001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@gmail.com',
      phone: '+1 415 555 7001',
      referredBy: 'realtor-001',
      brokerId: 'broker-001',
      localAgentId: 'agent-inmomas-001',
      localAgentName: 'Carlos García',
      status: 'properties_visited',
      budget: '€200,000 - €350,000',
      interestArea: 'Alicante City',
      notes: 'Interested in 2-bed apartment near the beach. Planning retirement.',
      statusHistory: [
        { status: 'contacted', date: '2025-04-01T10:00:00Z', note: 'Registered via referral link' },
        { status: 'options_sent', date: '2025-04-15T18:00:00Z', note: 'Attended April webinar' },
        { status: 'properties_visited', date: '2025-05-01T12:00:00Z', note: 'Booked VIP trip for May' },
        { status: 'properties_visited', date: '2025-05-15T16:00:00Z', note: 'Visited 8 properties' }
      ],
      createdAt: '2025-04-01T10:00:00Z'
    },
    {
      id: 'client-002',
      firstName: 'Michael',
      lastName: 'Wong',
      email: 'mwong@outlook.com',
      phone: '+1 212 555 8001',
      referredBy: 'realtor-001',
      brokerId: 'broker-001',
      localAgentId: 'agent-inmomas-002',
      localAgentName: 'Ana Martínez',
      status: 'notary_pending',
      budget: '€400,000 - €600,000',
      interestArea: 'Jávea',
      notes: 'Looking for a villa with sea views. Digital nomad, needs good internet.',
      statusHistory: [
        { status: 'contacted', date: '2025-03-10T08:00:00Z', note: 'Registered via referral link' },
        { status: 'options_sent', date: '2025-03-20T18:00:00Z', note: 'Attended March webinar' },
        { status: 'properties_visited', date: '2025-04-10T16:00:00Z', note: 'Loved Villa Amanecer' },
        { status: 'offer_made', date: '2025-04-25T14:00:00Z', note: 'Offer €485,000 on Villa Amanecer' },
        { status: 'notary_pending', date: '2025-05-20T11:00:00Z', note: 'Fuster handling contracts' }
      ],
      createdAt: '2025-03-10T08:00:00Z'
    },
    {
      id: 'client-003',
      firstName: 'Jennifer',
      lastName: 'Adams',
      email: 'jadams@yahoo.com',
      phone: '+1 713 555 9001',
      referredBy: 'realtor-002',
      brokerId: 'broker-001',
      localAgentId: 'agent-inmomas-001',
      localAgentName: 'Carlos García',
      status: 'closed',
      budget: '€150,000 - €250,000',
      interestArea: 'Elche',
      notes: 'Investment property. Bought 2-bed apartment in Elche center.',
      statusHistory: [
        { status: 'contacted', date: '2025-02-01T09:00:00Z', note: 'Registered via referral link' },
        { status: 'options_sent', date: '2025-02-15T18:00:00Z', note: '' },
        { status: 'properties_visited', date: '2025-03-05T16:00:00Z', note: '' },
        { status: 'offer_made', date: '2025-03-15T10:00:00Z', note: 'Offer €195,000' },
        { status: 'notary_pending', date: '2025-03-28T14:00:00Z', note: '' },
        { status: 'closed', date: '2025-04-20T12:00:00Z', note: 'Sale completed. Keys handed over.' }
      ],
      createdAt: '2025-02-01T09:00:00Z'
    },
    {
      id: 'client-004',
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'rdavis@gmail.com',
      phone: '+1 469 555 4001',
      referredBy: 'realtor-003',
      brokerId: 'broker-002',
      localAgentId: null,
      localAgentName: null,
      status: 'options_sent',
      budget: '€300,000 - €500,000',
      interestArea: 'Benidorm',
      notes: 'Looking for holiday home with rental potential.',
      statusHistory: [
        { status: 'contacted', date: '2025-05-20T14:00:00Z', note: 'Registered via referral link' },
        { status: 'options_sent', date: '2025-06-01T18:00:00Z', note: 'Very interested in Benidorm area' }
      ],
      createdAt: '2025-05-20T14:00:00Z'
    },
    {
      id: 'client-005',
      firstName: 'Amanda',
      lastName: 'Lee',
      email: 'alee@hotmail.com',
      phone: '+1 818 555 5001',
      referredBy: 'realtor-001',
      brokerId: 'broker-001',
      localAgentId: null,
      localAgentName: null,
      status: 'contacted',
      budget: '€250,000 - €400,000',
      interestArea: 'Alicante / Costa Blanca',
      notes: 'Just exploring options. Early stage.',
      statusHistory: [
        { status: 'contacted', date: '2025-06-20T10:00:00Z', note: 'Registered via referral link' }
      ],
      createdAt: '2025-06-20T10:00:00Z'
    },
    {
      id: 'client-006',
      firstName: 'Thomas',
      lastName: 'Brown',
      email: 'tbrown@proton.me',
      phone: '+1 503 555 6001',
      referredBy: 'realtor-003',
      brokerId: 'broker-002',
      localAgentId: 'agent-inmomas-002',
      localAgentName: 'Ana Martínez',
      status: 'properties_visited',
      budget: '€500,000 - €800,000',
      interestArea: 'Jávea / Moraira',
      notes: 'Premium property. Pre-approved for UCI mortgage.',
      statusHistory: [
        { status: 'contacted', date: '2025-04-05T11:00:00Z', note: '' },
        { status: 'options_sent', date: '2025-04-18T18:00:00Z', note: '' },
        { status: 'properties_visited', date: '2025-05-08T16:00:00Z', note: 'Visited 10 properties' },
        { status: 'properties_visited', date: '2025-05-25T09:00:00Z', note: 'Narrowed to 3 options in Moraira' }
      ],
      createdAt: '2025-04-05T11:00:00Z'
    }
  ],

  commissions: [
    {
      id: 'comm-001',
      clientId: 'client-003',
      clientName: 'Jennifer Adams',
      realtorId: 'realtor-002',
      brokerId: 'broker-001',
      agentId: 'agent-inmomas-001',
      salePrice: 195000,
      totalCommission: 9750,
      realtorSharePct: 25,
      brokerSharePct: 10,
      agentSharePct: 75,
      realtorAmount: 2437.50,
      brokerAmount: 975,
      agentAmount: 7312.50,
      status: 'paid',
      propertyAddress: 'Calle Mayor 15, 3ºB, Elche',
      closingDate: '2025-04-20T12:00:00Z',
      createdAt: '2025-04-20T12:00:00Z'
    },
    {
      id: 'comm-002',
      clientId: 'client-002',
      clientName: 'Michael Wong',
      realtorId: 'realtor-001',
      brokerId: 'broker-001',
      agentId: 'agent-inmomas-002',
      salePrice: 485000,
      totalCommission: 24250,
      realtorSharePct: 25,
      brokerSharePct: 10,
      agentSharePct: 75,
      realtorAmount: 6062.50,
      brokerAmount: 2425,
      agentAmount: 18187.50,
      status: 'pending_payment',
      propertyAddress: 'Villa Amanecer, Jávea',
      closingDate: '2025-06-15T00:00:00Z',
      createdAt: '2025-05-20T11:00:00Z'
    },
    {
      id: 'comm-003',
      clientId: 'client-006',
      clientName: 'Thomas Brown',
      realtorId: 'realtor-003',
      brokerId: 'broker-002',
      agentId: 'agent-inmomas-002',
      salePrice: 650000,
      totalCommission: 32500,
      realtorSharePct: 25,
      brokerSharePct: 10,
      agentSharePct: 75,
      realtorAmount: 8125,
      brokerAmount: 3250,
      agentAmount: 24375,
      status: 'projected',
      propertyAddress: 'TBD — Moraira area',
      closingDate: null,
      createdAt: '2025-05-25T09:00:00Z'
    }
  ],
  dossier_leads: [
    {
      id: 'lead-001',
      firstName: 'Emily',
      lastName: 'Smith',
      email: 'emily.smith@example.com',
      phone: '+1 617 555 9001',
      createdAt: '2026-07-05T10:30:00Z'
    },
    {
      id: 'lead-002',
      firstName: 'Jean-Pierre',
      lastName: 'Dubois',
      email: 'jp.dubois@example.fr',
      phone: '+33 6 1234 5678',
      createdAt: '2026-07-06T08:15:00Z'
    }
  ]
};
