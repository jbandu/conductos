import { expect } from '@playwright/test';

const sampleCases = [
  {
    id: 1,
    case_code: 'KELP-2025-0001',
    status: 'under_review',
    incident_date: '2025-01-10',
    description: 'Allegation of inappropriate remarks in team meeting.',
    is_anonymous: true,
    conciliation_requested: false,
    is_overdue: false,
    days_remaining: 12,
    created_at: '2025-01-12',
    deadline_date: '2025-03-12',
    complainant_name: 'Anonymous Employee'
  },
  {
    id: 2,
    case_code: 'KELP-2025-0002',
    status: 'decision_pending',
    incident_date: '2024-12-05',
    description: 'Multiple reports regarding repeated inappropriate messages.',
    is_anonymous: false,
    conciliation_requested: true,
    is_overdue: true,
    days_remaining: -3,
    created_at: '2024-12-06',
    deadline_date: '2025-02-20',
    complainant_name: 'Ritu Malhotra'
  }
];

const caseHistory = [
  {
    id: 11,
    old_status: 'new',
    new_status: 'under_review',
    notes: 'IC acknowledged receipt and started review.',
    changed_at: '2025-01-13T10:00:00Z'
  },
  {
    id: 12,
    old_status: 'under_review',
    new_status: 'investigating',
    notes: 'Interviews scheduled with complainant and respondent.',
    changed_at: '2025-01-18T12:00:00Z'
  }
];

const knowledgeDocuments = [
  {
    id: 1,
    title: 'POSH Act 2013 - Complete Guide',
    summary: 'Everything IC members need to comply with the PoSH Act.',
    tags: ['posh', 'legal'],
    file_type: 'pdf',
    created_at: '2024-11-01'
  },
  {
    id: 2,
    title: 'Complaint Investigation Framework',
    summary: 'Standard operating procedure for investigations.',
    tags: ['investigation'],
    file_type: 'docx',
    created_at: '2024-11-10'
  }
];

const patternAnalysis = [
  {
    id: 31,
    title: 'Multiple complaints from Engineering dept',
    pattern_type: 'department',
    description: 'Spike in reports coming from the engineering floor.',
    severity: 'high',
    frequency_count: 4,
    related_cases: ['KELP-2025-0001', 'KELP-2025-0002']
  }
];

const insights = [
  {
    id: 41,
    title: 'IC Committee requires external member',
    description: 'Comply with PoSH by adding a new external member.',
    priority: 'high',
    status: 'new',
    recommendations: ['Invite external legal expert', 'Publish updated IC roster']
  }
];

const externalMembers = [
  {
    id: 51,
    full_name: 'Adv. Meera Krishnan',
    email: 'meera.krishnan@lawfirm.com',
    expertise: ['POSH Law', 'Labour Law'],
    organization: 'Krishnan Legal',
    is_active: true
  }
];

const adminUsers = [
  {
    id: 201,
    full_name: 'Asha Rao',
    email: 'asha.rao@demo.kelphr.com',
    role: 'hr_admin',
    is_active: true
  },
  {
    id: 202,
    full_name: 'Pranav Singh',
    email: 'pranav.singh@demo.kelphr.com',
    role: 'ic_member',
    is_active: true
  },
  {
    id: 203,
    full_name: 'Employee Test',
    email: 'employee@test.com',
    role: 'employee',
    is_active: false
  }
];

const icMembers = [
  {
    id: 301,
    name: 'Asha Rao',
    email: 'asha.rao@demo.kelphr.com',
    role: 'presiding_officer',
    is_active: true,
    appointed_date: '2024-01-01',
    term_end_date: '2027-01-01'
  },
  {
    id: 302,
    name: 'Pranav Singh',
    email: 'pranav.singh@demo.kelphr.com',
    role: 'internal_member',
    is_active: true,
    appointed_date: '2023-05-01',
    term_end_date: '2026-05-01'
  }
];

const eligibleICUsers = [
  {
    id: 204,
    full_name: 'Ritu Malhotra',
    email: 'ritu.malhotra@demo.kelphr.com',
    role: 'employee',
    is_ic_member: false
  }
];

const icCompliance = {
  compliant: true,
  composition: {
    presiding_officer: 1,
    internal_members: 1,
    external_members: 1,
    total: 3,
    total_active: 3
  },
  issues: [],
  warnings: []
};

const organizationSettings = {
  name: 'Kelphr Demo',
  domain: 'demo.kelphr.com',
  industry: 'Technology',
  employee_count: '200-500',
  district_officer_email: 'officer@kelphr.com',
  address: 'Remote',
  city: 'Bengaluru',
  state: 'Karnataka',
  postal_code: '560001'
};

const organizationStats = {
  totalUsers: adminUsers.length,
  totalCases: sampleCases.length,
  icMembers: icMembers.length
};

const auditLogEntries = {
  entries: [
    {
      id: 401,
      timestamp: '2025-02-01T10:00:00Z',
      admin_name: 'Asha Rao',
      admin_email: 'asha.rao@demo.kelphr.com',
      action: 'user_create',
      target_user_name: 'Employee Test',
      target_user_email: 'employee@test.com',
      details: 'Created employee account'
    }
  ],
  pagination: { total: 1 }
};

const auditLogStats = {
  summary: {
    total_actions: 12,
    active_admins: 2,
    action_types: 4,
    latest_entry: '2025-02-01T10:00:00Z'
  }
};

const auditLogActions = {
  actions: ['user_create', 'user_update', 'ic_member_add', 'organization_update']
};

const copilotSuggestions = {
  suggestions: [
    { id: 's1', text: 'Show all cases' },
    { id: 's2', text: 'Generate proactive insights' }
  ]
};

const monitoringDashboard = {
  apiHealth: {
    totalRequests: 20,
    errorRate: 0.02,
    avgResponseTime: 180
  },
  aiUsage: {
    totalInteractions: 10,
    estimatedCostUsd: 1.24
  },
  alerts: [
    {
      id: 61,
      severity: 'warning',
      message: 'Case KELP-2025-0002 approaching 90-day deadline'
    }
  ]
};

export async function setupApiMocks(page) {
  await page.route('**/api/auth/login', async (route) => {
    const { email, role } = route.request().postDataJSON();
    const user = {
      fullName: email.includes('admin') ? 'System Administrator' : 'Test User',
      email,
      role,
      is_super_admin: role === 'hr_admin'
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'mock-token', user })
    });
  });

  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON();
    const message = (body.message || '').toLowerCase();

    if (message.includes('report harassment')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, response: { type: 'intake_start', content: { message: 'Let\'s start the intake.' } } })
      });
      return;
    }

    if (message.includes('show all cases') || body.mode === 'ic') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: {
            type: 'case_list',
            content: {
              summary: 'Showing seeded IC cases',
              cases: sampleCases
            }
          }
        })
      });
      return;
    }

    if (message.startsWith('status kelp-2025-0001')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: {
            type: 'case_detail',
            content: {
              case: sampleCases[0],
              history: caseHistory
            }
          }
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, response: { type: 'text', content: 'Thanks for sharing.' } })
    });
  });

  await page.route('**/api/cases**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sampleCases) });
  });

  await page.route('**/api/documents**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(knowledgeDocuments) });
  });

  await page.route('**/api/patterns**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(patternAnalysis) });
  });

  await page.route('**/api/insights**', async (route) => {
    if (route.request().method() === 'PUT') {
      const updated = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...insights[0], ...updated }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(insights) });
  });

  await page.route('**/api/external/members**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(externalMembers) });
  });

  await page.route('**/api/monitoring/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(monitoringDashboard) });
  });

  await page.route('**/api/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalUsers: 8,
        activeCases: 3,
        icMembers: 4,
        closedThisMonth: 1
      })
    });
  });

  await page.route('**/api/admin/users**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: adminUsers }) });
      return;
    }

    if (method === 'PATCH' || method === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await page.route('**/api/admin/ic-composition/compliance-check', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(icCompliance) });
  });

  await page.route('**/api/admin/ic-composition/eligible-users', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: eligibleICUsers }) });
  });

  await page.route('**/api/admin/ic-composition/**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          members: icMembers,
          composition: icCompliance.composition
        })
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.route('**/api/admin/audit-log/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(auditLogStats) });
  });

  await page.route('**/api/admin/audit-log/actions', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(auditLogActions) });
  });

  await page.route('**/api/admin/audit-log**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(auditLogEntries) });
  });

  await page.route('**/api/admin/organization/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(organizationStats) });
  });

  await page.route('**/api/admin/organization**', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(organizationSettings) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(organizationSettings) });
  });

  await page.route('**/api/copilot/suggestions**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(copilotSuggestions) });
  });

  await page.route('**/api/copilot/chat**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        response: {
          type: 'text',
          content: 'Generated response from co-pilot'
        }
      })
    });
  });
}

export async function loginAs(page, role = 'employee') {
  await setupApiMocks(page);
  const credentials = {
    employee: { email: 'employee@test.com', password: 'password123', path: '/login/employee' },
    ic: { email: 'ic@test.com', password: 'password123', path: '/login/ic' },
    admin: { email: 'admin@demo.kelphr.com', password: 'Admin@123456', path: '/login/admin' }
  }[role];

  await page.goto(credentials.path);
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  if (role === 'admin') {
    await page.waitForURL('**/admin/**');
  } else {
    await page.waitForURL('**/chat');
  }

  await expect(page.getByRole('heading', { name: /ConductOS/ })).toBeVisible();
}
