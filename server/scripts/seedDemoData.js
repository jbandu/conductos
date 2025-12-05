import { config } from '../config.js';
import db from '../db/pg-init.js';

console.log('✅ Environment variables loaded successfully');
console.log('DATABASE_URL:', config.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', config.NODE_ENV);

/**
 * Generate case code in format KELP-YYYY-NNNN
 */
function generateCaseCode(index) {
  const year = new Date().getFullYear();
  const paddedNumber = (index + 1).toString().padStart(4, '0');
  return `KELP-${year}-${paddedNumber}`;
}

/**
 * Demo Data Seed Script
 * Creates 15 realistic demo cases with variety for pilot testing
 */

const DEMO_CASES = [
  // 3 NEW cases (filed in last 7 days)
  {
    status: 'new',
    incidentDate: '2025-11-28',
    description: 'Employee reported receiving inappropriate comments during team meeting regarding personal appearance. The comments were made repeatedly despite requesting to stop. Seeking guidance on next steps for formal complaint.',
    isAnonymous: false,
    complainantName: 'Priya Sharma',
    complainantEmail: 'priya.sharma@company.com',
    contactMethod: 'Email preferred, available for video call',
    conciliationRequested: false,
    daysFromCreation: 2
  },
  {
    status: 'new',
    incidentDate: '2025-11-25',
    description: 'Witnessed inappropriate behavior in the workplace cafeteria. A senior team member made unwelcome physical contact with a junior colleague. The incident made several people uncomfortable. Reporting on behalf of the group.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-A',
    contactMethod: 'Anonymous - please use case portal for communication',
    conciliationRequested: false,
    daysFromCreation: 5
  },
  {
    status: 'new',
    incidentDate: '2025-11-30',
    description: 'During a project review meeting, experienced persistent interruptions and dismissive comments about ideas presented. This has been an ongoing pattern over the past month. Would like to discuss resolution options.',
    isAnonymous: false,
    complainantName: 'Rajesh Kumar',
    complainantEmail: 'rajesh.kumar@company.com',
    contactMethod: 'Phone: +91-98765-43210',
    conciliationRequested: true,
    daysFromCreation: 1
  },

  // 2 UNDER_REVIEW cases
  {
    status: 'under_review',
    incidentDate: '2025-10-15',
    description: 'Received multiple messages on company communication platform after working hours with inappropriate suggestions for personal meetings. Have screenshots as evidence. Request confidential handling of this matter.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-B',
    contactMethod: 'Secure portal only',
    conciliationRequested: false,
    daysFromCreation: 45,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 45, notes: 'Initial complaint filed' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 40, notes: 'Case assigned to IC for preliminary review' }
    ]
  },
  {
    status: 'under_review',
    incidentDate: '2025-10-20',
    description: 'Manager made inappropriate remarks about personal relationships during performance review discussion. Comments were unprofessional and created hostile work environment. Seeking formal investigation.',
    isAnonymous: false,
    complainantName: 'Anita Desai',
    complainantEmail: 'anita.desai@company.com',
    contactMethod: 'Email and phone: +91-98123-45678',
    conciliationRequested: false,
    daysFromCreation: 40,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 40, notes: 'Complaint registered' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 37, notes: 'Preliminary assessment started' }
    ]
  },

  // 2 CONCILIATION cases
  {
    status: 'conciliation',
    incidentDate: '2025-09-10',
    description: 'Team lead made repeated comments about appearance and clothing choices. While uncomfortable, complainant prefers to resolve through conciliation if possible. Open to mediated discussion.',
    isAnonymous: false,
    complainantName: 'Meera Patel',
    complainantEmail: 'meera.patel@company.com',
    contactMethod: 'Email preferred',
    conciliationRequested: true,
    daysFromCreation: 82,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 82, notes: 'Complaint filed with conciliation request' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 78, notes: 'Initial review completed' },
      { oldStatus: 'under_review', newStatus: 'conciliation', daysAgo: 70, notes: 'Both parties agreed to conciliation process' }
    ]
  },
  {
    status: 'conciliation',
    incidentDate: '2025-09-05',
    description: 'Colleague made unwelcome advances and persistent requests for personal meetings outside work. Complainant wishes to attempt resolution through conciliation before formal investigation.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-C',
    contactMethod: 'Secure communication through case portal',
    conciliationRequested: true,
    daysFromCreation: 87,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 87, notes: 'Anonymous complaint received' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 83, notes: 'Case review initiated' },
      { oldStatus: 'under_review', newStatus: 'conciliation', daysAgo: 75, notes: 'Conciliation proceedings scheduled' }
    ]
  },

  // 3 INVESTIGATING cases
  {
    status: 'investigating',
    incidentDate: '2025-08-15',
    description: 'Senior manager created hostile environment through persistent microaggressions and exclusion from important meetings. Multiple team members have similar experiences. Formal investigation requested.',
    isAnonymous: false,
    complainantName: 'Sanjay Reddy',
    complainantEmail: 'sanjay.reddy@company.com',
    contactMethod: 'Phone: +91-98765-11223, Email',
    conciliationRequested: false,
    daysFromCreation: 108,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 108, notes: 'Formal complaint registered' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 105, notes: 'Preliminary investigation scope defined' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 98, notes: 'Full investigation initiated, witnesses being interviewed' }
    ]
  },
  {
    status: 'investigating',
    incidentDate: '2025-08-20',
    description: 'Experienced quid pro quo situation where project assignments were linked to acceptance of personal invitations. Have documented instances over several weeks. Request thorough investigation.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-D',
    contactMethod: 'Anonymous portal communication only',
    conciliationRequested: false,
    daysFromCreation: 103,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 103, notes: 'Anonymous complaint with documentation' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 98, notes: 'Evidence review completed' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 90, notes: 'Formal inquiry proceedings started' }
    ]
  },
  {
    status: 'investigating',
    incidentDate: '2025-07-25',
    description: 'Department head made inappropriate physical contact during team celebration event. Multiple witnesses present. Complainant has provided detailed timeline and witness list for investigation.',
    isAnonymous: false,
    complainantName: 'Kavita Singh',
    complainantEmail: 'kavita.singh@company.com',
    contactMethod: 'Email: kavita.singh@company.com, Mobile: +91-98123-99887',
    conciliationRequested: false,
    daysFromCreation: 129,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 129, notes: 'Incident reported with witness statements' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 124, notes: 'Witness interviews scheduled' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 115, notes: 'Comprehensive investigation underway' }
    ]
  },

  // 2 DECISION_PENDING cases
  {
    status: 'decision_pending',
    incidentDate: '2025-07-10',
    description: 'Supervisor created pattern of discriminatory behavior and made inappropriate comments about personal life choices. Investigation completed, awaiting Internal Committee decision on findings.',
    isAnonymous: false,
    complainantName: 'Deepak Malhotra',
    complainantEmail: 'deepak.malhotra@company.com',
    contactMethod: 'Email and phone: +91-98765-55443',
    conciliationRequested: false,
    daysFromCreation: 144,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 144, notes: 'Complaint lodged' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 140, notes: 'Initial assessment' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 130, notes: 'Investigation commenced' },
      { oldStatus: 'investigating', newStatus: 'decision_pending', daysAgo: 95, notes: 'Investigation report submitted to IC, decision pending' }
    ]
  },
  {
    status: 'decision_pending',
    incidentDate: '2025-06-28',
    description: 'Experienced retaliation after declining social invitations from team lead. Performance reviews became unfairly negative. Investigation findings compiled, awaiting committee recommendations.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-E',
    contactMethod: 'Secure portal',
    conciliationRequested: false,
    daysFromCreation: 156,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 156, notes: 'Anonymous complaint with performance records' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 150, notes: 'Case evaluation' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 140, notes: 'Full inquiry initiated' },
      { oldStatus: 'investigating', newStatus: 'decision_pending', daysAgo: 100, notes: 'Investigation concluded, IC deliberating' }
    ]
  },

  // 2 CLOSED cases
  {
    status: 'closed',
    incidentDate: '2025-06-01',
    description: 'Colleague made uncomfortable remarks during lunch break. After conciliation, both parties reached mutual understanding. Appropriate workplace behavior guidelines reinforced. Case resolved satisfactorily.',
    isAnonymous: false,
    complainantName: 'Neha Kapoor',
    complainantEmail: 'neha.kapoor@company.com',
    contactMethod: 'Email',
    conciliationRequested: true,
    daysFromCreation: 183,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 183, notes: 'Complaint filed' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 179, notes: 'Review completed' },
      { oldStatus: 'under_review', newStatus: 'conciliation', daysAgo: 170, notes: 'Conciliation initiated' },
      { oldStatus: 'conciliation', newStatus: 'closed', daysAgo: 155, notes: 'Successful resolution through conciliation, both parties satisfied' }
    ]
  },
  {
    status: 'closed',
    incidentDate: '2025-05-20',
    description: 'Reported inappropriate messaging from contractor working on project. Investigation confirmed policy violations. Contractor access terminated, complainant satisfied with outcome and preventive measures.',
    isAnonymous: true,
    anonymousAlias: 'Complainant-F',
    contactMethod: 'No further contact needed',
    conciliationRequested: false,
    daysFromCreation: 195,
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 195, notes: 'Anonymous report received' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 190, notes: 'Evidence reviewed' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 180, notes: 'Investigation started' },
      { oldStatus: 'investigating', newStatus: 'decision_pending', daysAgo: 165, notes: 'Investigation complete' },
      { oldStatus: 'decision_pending', newStatus: 'closed', daysAgo: 150, notes: 'Action taken, case closed per committee decision' }
    ]
  },

  // 1 OVERDUE case (deadline passed)
  {
    status: 'investigating',
    incidentDate: '2025-05-15',
    description: 'Manager engaged in pattern of exclusionary behavior and made derogatory remarks about background. Investigation has exceeded standard timeline due to complexity and multiple witnesses.',
    isAnonymous: false,
    complainantName: 'Amit Verma',
    complainantEmail: 'amit.verma@company.com',
    contactMethod: 'Phone: +91-98123-77665, Email',
    conciliationRequested: false,
    daysFromCreation: 200, // Will be marked as overdue
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 200, notes: 'Formal complaint filed' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 195, notes: 'Case assessment' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 185, notes: 'Investigation ongoing - complex case with multiple parties' }
    ]
  },

  // 1 DEADLINE TODAY case
  {
    status: 'decision_pending',
    incidentDate: '2025-09-08',
    description: 'Team member made repeated unwanted advances and created uncomfortable work environment. Investigation completed yesterday. Committee meeting scheduled today to finalize decision and recommendations.',
    isAnonymous: false,
    complainantName: 'Lakshmi Iyer',
    complainantEmail: 'lakshmi.iyer@company.com',
    contactMethod: 'Email: lakshmi.iyer@company.com, Phone: +91-98765-22334',
    conciliationRequested: false,
    daysFromCreation: 85, // Will set deadline to today
    statusHistory: [
      { oldStatus: null, newStatus: 'new', daysAgo: 85, notes: 'Complaint registered' },
      { oldStatus: 'new', newStatus: 'under_review', daysAgo: 80, notes: 'Preliminary review' },
      { oldStatus: 'under_review', newStatus: 'investigating', daysAgo: 70, notes: 'Formal investigation' },
      { oldStatus: 'investigating', newStatus: 'decision_pending', daysAgo: 5, notes: 'Investigation report submitted, decision due today' }
    ]
  }
];

async function seedDemoData() {
  console.log('\n🌱 Starting demo data seed...\n');

  try {
    // Clear existing data
    await db.query('DELETE FROM status_history');
    await db.query('DELETE FROM cases');
    await db.query('ALTER SEQUENCE cases_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE status_history_id_seq RESTART WITH 1');
    console.log('✅ Cleared existing data\n');

    // Insert cases
    for (let i = 0; i < DEMO_CASES.length; i++) {
      const caseData = DEMO_CASES[i];
      const caseCode = generateCaseCode(i + 1);

      // Calculate dates
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - caseData.daysFromCreation);

      const incidentDate = new Date(caseData.incidentDate);

      // Calculate deadline (90 days from creation)
      let deadlineDate = new Date(createdAt);
      deadlineDate.setDate(deadlineDate.getDate() + 90);

      // Special handling for overdue and deadline today cases
      if (i === 13) { // Overdue case
        deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() - 5); // 5 days overdue
      } else if (i === 14) { // Deadline today case
        deadlineDate = new Date(); // Today
      }

      // Insert case
      const result = await db.query(`
        INSERT INTO cases (
          case_code, status, incident_date, description,
          is_anonymous, anonymous_alias, contact_method,
          complainant_name, complainant_email, conciliation_requested,
          created_at, deadline_date, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        caseCode,
        caseData.status,
        incidentDate,
        caseData.description,
        caseData.isAnonymous,
        caseData.anonymousAlias || null,
        caseData.contactMethod,
        caseData.complainantName || null,
        caseData.complainantEmail || null,
        caseData.conciliationRequested,
        createdAt,
        deadlineDate,
        new Date()
      ]);

      const caseId = result.rows[0].id;

      // Insert status history if exists
      if (caseData.statusHistory) {
        for (const historyEntry of caseData.statusHistory) {
          const changedAt = new Date();
          changedAt.setDate(changedAt.getDate() - historyEntry.daysAgo);

          await db.query(`
            INSERT INTO status_history (case_id, old_status, new_status, changed_at, notes)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            caseId,
            historyEntry.oldStatus,
            historyEntry.newStatus,
            changedAt,
            historyEntry.notes
          ]);
        }
      }

      const statusEmoji = {
        'new': '🆕',
        'under_review': '👀',
        'conciliation': '🤝',
        'investigating': '🔍',
        'decision_pending': '⏳',
        'closed': '✅'
      }[caseData.status];

      console.log(`${statusEmoji} Created case: ${caseCode} - ${caseData.status}`);
    }

    console.log('\n🎉 Successfully seeded 15 demo cases!');
    console.log('\n📊 Case Distribution:');
    console.log('   • 3 New cases (filed in last 7 days)');
    console.log('   • 2 Under Review');
    console.log('   • 2 In Conciliation');
    console.log('   • 3 Under Investigation');
    console.log('   • 2 Decision Pending');
    console.log('   • 2 Closed');
    console.log('   • 1 Overdue (KELP-2025-0014)');
    console.log('   • 1 Deadline Today (KELP-2025-0015)');
    console.log('\n🎭 Anonymous: 6 cases | Named: 9 cases');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await db.end();
    process.exit(0);
  }
}

seedDemoData();
