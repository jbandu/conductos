import { config } from '../config.js';
import pool from './pg-init.js';

const testCases = [
  {
    incident_date: '2024-11-10',
    description: 'Inappropriate comments made during team meeting about gender. The comments were directed at female team members and created an uncomfortable work environment. Multiple witnesses present.',
    is_anonymous: false,
    complainant_name: 'Sarah Johnson',
    complainant_email: 'sarah.johnson@company.com',
    conciliation_requested: false,
    status: 'investigating',
    days_ago: 25
  },
  {
    incident_date: '2024-11-15',
    description: 'Unwanted physical contact in the office pantry. The incident occurred multiple times despite being asked to stop. This behavior has been ongoing for two weeks.',
    is_anonymous: true,
    anonymous_alias: 'Employee-A',
    contact_method: 'employee-a-secure@company.com',
    conciliation_requested: false,
    status: 'under_review',
    days_ago: 20
  },
  {
    incident_date: '2024-10-05',
    description: 'Persistent unwelcome messages on company Slack after work hours. Messages contained inappropriate suggestions and made me feel unsafe. I have screenshots of all conversations.',
    is_anonymous: false,
    complainant_name: 'Michael Chen',
    complainant_email: 'michael.chen@company.com',
    conciliation_requested: true,
    status: 'decision_pending',
    days_ago: 61  // Overdue
  },
  {
    incident_date: '2024-09-15',
    description: 'Discriminatory remarks about my ethnicity during a project review meeting. The manager made several jokes that were offensive and created a hostile work environment in front of the entire team.',
    is_anonymous: false,
    complainant_name: 'Priya Sharma',
    complainant_email: 'priya.sharma@company.com',
    conciliation_requested: false,
    status: 'investigating',
    days_ago: 82  // Overdue
  },
  {
    incident_date: '2024-12-01',
    description: 'Received inappropriate emails with sexual content from a senior colleague. The emails were sent to my personal email address which was obtained without my consent.',
    is_anonymous: true,
    anonymous_alias: 'Complainant-B',
    contact_method: '+91-98765-43210',
    conciliation_requested: false,
    status: 'new',
    days_ago: 4
  },
  {
    incident_date: '2024-11-28',
    description: 'Subjected to quid pro quo harassment - told that project assignment depends on agreeing to after-work dinner. This happened in a one-on-one meeting with my supervisor.',
    is_anonymous: false,
    complainant_name: 'Jessica Martinez',
    complainant_email: 'jessica.m@company.com',
    conciliation_requested: true,
    status: 'conciliation',
    days_ago: 7
  },
  {
    incident_date: '2024-12-03',
    description: 'Witnessed inappropriate behavior towards intern during office party. The behavior included unwanted touching and inappropriate comments. Several other employees witnessed this incident.',
    is_anonymous: false,
    complainant_name: 'Robert Taylor',
    complainant_email: 'robert.taylor@company.com',
    conciliation_requested: false,
    status: 'new',
    days_ago: 2
  },
  {
    incident_date: '2024-11-20',
    description: 'Repeated staring and following me around the office. This has been happening for the past month. The person waits near my desk and tries to engage in unwanted conversations.',
    is_anonymous: true,
    anonymous_alias: 'Employee-C',
    contact_method: 'safe-channel@company.com',
    conciliation_requested: false,
    status: 'under_review',
    days_ago: 15
  },
  {
    incident_date: '2024-11-25',
    description: 'Gender-based discrimination in promotion decision. Despite meeting all criteria and having better performance reviews, I was passed over for promotion in favor of less qualified male colleague.',
    is_anonymous: false,
    complainant_name: 'Amanda Liu',
    complainant_email: 'amanda.liu@company.com',
    conciliation_requested: true,
    status: 'investigating',
    days_ago: 10
  },
  {
    incident_date: '2024-12-04',
    description: 'Inappropriate jokes and comments during video call with client present. The comments were sexual in nature and embarrassed me in front of an important client.',
    is_anonymous: false,
    complainant_name: 'David Kumar',
    complainant_email: 'david.kumar@company.com',
    conciliation_requested: false,
    status: 'new',
    days_ago: 1
  },
  {
    incident_date: '2024-11-18',
    description: 'Retaliation after rejecting advances from manager. My performance ratings suddenly dropped and I was excluded from important meetings after declining inappropriate dinner invitation.',
    is_anonymous: false,
    complainant_name: 'Emily Rodriguez',
    complainant_email: 'emily.r@company.com',
    conciliation_requested: false,
    status: 'decision_pending',
    days_ago: 17
  },
  {
    incident_date: '2024-12-05',
    description: 'Verbal harassment and intimidation for reporting previous incident. I am being threatened and told to withdraw my complaint. This is clear retaliation.',
    is_anonymous: true,
    anonymous_alias: 'Witness-X',
    contact_method: 'secure-line@company.com',
    conciliation_requested: false,
    status: 'new',
    days_ago: 0  // Due today
  }
];

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...');

    // Clear existing data
    await client.query('DELETE FROM status_history');
    await client.query('DELETE FROM cases');
    await client.query('ALTER SEQUENCE cases_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE status_history_id_seq RESTART WITH 1');

    console.log('Cleared existing data');

    // Insert test cases
    for (const testCase of testCases) {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - testCase.days_ago);

      const deadlineDate = new Date(createdDate);
      deadlineDate.setDate(deadlineDate.getDate() + 90);

      // Generate case code
      const year = createdDate.getFullYear();
      const caseNumber = testCases.indexOf(testCase) + 1;
      const caseCode = `KELP-${year}-${caseNumber.toString().padStart(4, '0')}`;

      const caseResult = await client.query(
        `INSERT INTO cases (
          case_code, status, incident_date, description, is_anonymous,
          anonymous_alias, contact_method, complainant_name, complainant_email,
          conciliation_requested, created_at, deadline_date, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          caseCode,
          testCase.status,
          testCase.incident_date,
          testCase.description,
          testCase.is_anonymous,
          testCase.anonymous_alias || null,
          testCase.contact_method || null,
          testCase.complainant_name || null,
          testCase.complainant_email || null,
          testCase.conciliation_requested,
          createdDate.toISOString(),
          deadlineDate.toISOString(),
          createdDate.toISOString()
        ]
      );

      const caseId = caseResult.rows[0].id;

      // Add status history
      await client.query(
        `INSERT INTO status_history (case_id, new_status, notes, changed_at)
        VALUES ($1, $2, $3, $4)`,
        [caseId, 'new', 'Case created', createdDate.toISOString()]
      );

      // Add status update if not "new"
      if (testCase.status !== 'new') {
        const statusUpdateDate = new Date(createdDate);
        statusUpdateDate.setDate(statusUpdateDate.getDate() + 2);

        await client.query(
          `INSERT INTO status_history (case_id, old_status, new_status, notes, changed_at)
          VALUES ($1, $2, $3, $4, $5)`,
          [caseId, 'new', testCase.status, `Status updated to ${testCase.status}`, statusUpdateDate.toISOString()]
        );
      }

      console.log(`✅ Created case: ${caseCode} - ${testCase.status}`);
    }

    console.log(`\n🎉 Successfully seeded ${testCases.length} test cases!`);
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
