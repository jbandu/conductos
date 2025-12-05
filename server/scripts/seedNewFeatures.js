import db from '../db/pg-init.js';
import { generateEmbedding } from '../services/embeddingService.js';

console.log('🚀 Setting up new features with test data...\n');

async function setupNewFeatureTables() {
  console.log('📊 Creating tables for new features...');

  try {
    // Documents table (Knowledge Base)
    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        title VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INTEGER,
        content TEXT,
        summary TEXT,
        uploaded_by INTEGER REFERENCES users(id),
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Documents table created');

    // Document chunks table (for embeddings)
    // Note: embedding stored as TEXT/JSONB instead of vector type for compatibility
    await db.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Document chunks table created');

    // Patterns table (Pattern Analysis)
    await db.query(`
      CREATE TABLE IF NOT EXISTS patterns (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        pattern_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        frequency_count INTEGER DEFAULT 0,
        related_cases INTEGER[],
        metadata JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'monitoring', 'resolved'))
      )
    `);
    console.log('  ✓ Patterns table created');

    // Insights table (Proactive Insights)
    await db.query(`
      CREATE TABLE IF NOT EXISTS insights (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        insight_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        recommendations TEXT[],
        priority VARCHAR(20) CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(50) DEFAULT 'new' CHECK(status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP
      )
    `);
    console.log('  ✓ Insights table created');

    // Evidence table (Evidence Management)
    await db.query(`
      CREATE TABLE IF NOT EXISTS evidence (
        id SERIAL PRIMARY KEY,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        evidence_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INTEGER,
        collected_by INTEGER REFERENCES users(id),
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        tags TEXT[],
        chain_of_custody JSONB DEFAULT '[]'
      )
    `);
    console.log('  ✓ Evidence table created');

    // Interviews table
    await db.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        interviewee_name VARCHAR(255),
        interviewee_role VARCHAR(100),
        interviewee_email VARCHAR(255),
        scheduled_date TIMESTAMP,
        conducted_date TIMESTAMP,
        conducted_by INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'postponed')),
        notes TEXT,
        transcript TEXT,
        recording_path VARCHAR(500),
        key_findings TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Interviews table created');

    // External members table (External Member Portal)
    await db.query(`
      CREATE TABLE IF NOT EXISTS external_members (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        organization VARCHAR(255),
        expertise TEXT[],
        bio TEXT,
        credentials JSONB DEFAULT '{}',
        access_token VARCHAR(500) UNIQUE,
        token_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_access TIMESTAMP
      )
    `);
    console.log('  ✓ External members table created');

    // API request logs (Monitoring)
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_request_logs (
        id SERIAL PRIMARY KEY,
        method VARCHAR(10),
        path VARCHAR(500),
        status_code INTEGER,
        response_time_ms INTEGER,
        user_id INTEGER REFERENCES users(id),
        organization_id INTEGER REFERENCES organizations(id),
        ip_address VARCHAR(45),
        user_agent TEXT,
        error_message TEXT,
        request_size INTEGER,
        response_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ API request logs table created');

    // AI usage logs (Monitoring)
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        user_id INTEGER REFERENCES users(id),
        case_id INTEGER REFERENCES cases(id),
        model VARCHAR(100),
        agent_type VARCHAR(50),
        input_tokens INTEGER,
        output_tokens INTEGER,
        total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
        estimated_cost_usd DECIMAL(10,6),
        response_time_ms INTEGER,
        tool_calls INTEGER DEFAULT 0,
        request_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ AI usage logs table created');

    // Monitoring alerts
    await db.query(`
      CREATE TABLE IF NOT EXISTS monitoring_alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
        triggered_value DECIMAL,
        threshold_value DECIMAL,
        organization_id INTEGER REFERENCES organizations(id),
        affected_resource VARCHAR(255),
        message TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved')),
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Monitoring alerts table created');

    // Business metrics daily
    await db.query(`
      CREATE TABLE IF NOT EXISTS business_metrics_daily (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        metric_date DATE NOT NULL,
        total_cases INTEGER DEFAULT 0,
        new_cases INTEGER DEFAULT 0,
        closed_cases INTEGER DEFAULT 0,
        overdue_cases INTEGER DEFAULT 0,
        compliance_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, metric_date)
      )
    `);
    console.log('  ✓ Business metrics daily table created');

    // Push subscriptions (PWA)
    await db.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        keys JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, endpoint)
      )
    `);
    console.log('  ✓ Push subscriptions table created');

    // Create useful indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_patterns_org ON patterns(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_insights_org ON insights(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_interviews_case ON interviews(case_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_request_logs(created_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_ai_logs_org ON ai_usage_logs(organization_id, created_at DESC)`);
    console.log('  ✓ Indexes created\n');

  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }
}

async function seedTestData() {
  console.log('🌱 Seeding test data for new features...\n');

  try {
    // Get organization and users
    const orgResult = await db.query('SELECT id FROM organizations LIMIT 1');
    if (!orgResult.rows || orgResult.rows.length === 0) {
      console.log('⚠️  No organization found. Please run seedAdmin first.');
      return;
    }
    const org = orgResult.rows[0];

    const usersResult = await db.query('SELECT id, email, role FROM users WHERE organization_id = $1', [org.id]);
    if (usersResult.rows.length === 0) {
      console.log('⚠️  No users found. Please run seedAdmin first.');
      return;
    }

    const hrAdmin = usersResult.rows.find(u => u.role === 'hr_admin') || usersResult.rows[0];
    const icMember = usersResult.rows.find(u => u.role === 'ic_member') || usersResult.rows[0];

    // Get some cases to link data to
    const casesResult = await db.query('SELECT id, case_code FROM cases LIMIT 5');
    const cases = casesResult;
    const caseIds = cases.rows.map(c => c.id);

    // Seed Documents (Knowledge Base)
    console.log('📚 Seeding Knowledge Base documents...');
    const documents = [
      {
        title: 'POSH Act 2013 - Complete Guide',
        content: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 is a legislative act in India that seeks to protect women from sexual harassment at their place of work. Key provisions include: Definition of sexual harassment, Constitution of Internal Complaints Committee, Redressal process, and Penalties for non-compliance.',
        tags: ['posh', 'legal', 'compliance'],
        summary: 'Comprehensive guide to POSH Act 2013 compliance requirements'
      },
      {
        title: 'IC Committee Best Practices',
        content: 'Best practices for Internal Committee operations: Ensure timely response to complaints, Maintain confidentiality, Follow due process, Document all proceedings, Provide regular training to committee members, Conduct awareness programs.',
        tags: ['ic', 'best-practices', 'training'],
        summary: 'Guidelines for effective IC committee operations'
      },
      {
        title: 'Complaint Investigation Framework',
        content: 'Standard framework for investigating complaints: Initial assessment within 3 days, Preliminary inquiry within 7 days, Full investigation within 90 days, Evidence collection procedures, Interview protocols, Report preparation standards.',
        tags: ['investigation', 'procedures', 'compliance'],
        summary: 'Step-by-step investigation procedures'
      },
      {
        title: 'Annual Compliance Checklist',
        content: 'Annual POSH compliance requirements: File annual report with District Officer, Conduct awareness programs (minimum 4 per year), Review IC committee composition, Update policies, Train new employees, Maintain complaint records for 7 years.',
        tags: ['compliance', 'annual', 'checklist'],
        summary: 'Year-end compliance verification checklist'
      }
    ];

    for (const doc of documents) {
      const docResult = await db.query(
        `INSERT INTO documents (organization_id, title, content, summary, tags, uploaded_by, file_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 'document', '{"source": "seed"}')
         RETURNING id`,
        [org.id, doc.title, doc.content, doc.summary, doc.tags, hrAdmin.id]
      );
      console.log(`  ✓ Added: ${doc.title}`);

      // Try to generate embedding for the document (will fail gracefully if OpenAI key not set)
      try {
        const embedding = await generateEmbedding(doc.content.substring(0, 8000));
        await db.query(
          `INSERT INTO document_chunks (document_id, chunk_index, content, embedding_data)
           VALUES ($1, 0, $2, $3)`,
          [docResult.rows[0].id, doc.content, JSON.stringify(embedding)]
        );
        console.log(`    → Generated embedding`);
      } catch (embErr) {
        console.log(`    ⚠️  Skipped embedding (${embErr.message})`);
      }
    }

    // Seed Patterns (Pattern Analysis)
    console.log('\n🔍 Seeding patterns...');
    const patterns = [
      {
        type: 'department_cluster',
        title: 'Multiple complaints from Engineering dept',
        description: 'Pattern detected: 5 complaints from Engineering department in last 3 months',
        severity: 'high',
        count: 5,
        cases: caseIds.slice(0, 3)
      },
      {
        type: 'time_pattern',
        title: 'Complaints spike after office parties',
        description: 'Historical data shows 40% increase in complaints within 2 weeks of office events',
        severity: 'medium',
        count: 8,
        cases: caseIds.slice(1, 3)
      },
      {
        type: 'respondent_repeat',
        title: 'Same respondent in multiple cases',
        description: 'One respondent appears in 3 separate complaints',
        severity: 'critical',
        count: 3,
        cases: caseIds.slice(0, 3)
      }
    ];

    for (const pattern of patterns) {
      await db.query(
        `INSERT INTO patterns (organization_id, pattern_type, title, description, severity, frequency_count, related_cases, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '{"auto_detected": true}')`,
        [org.id, pattern.type, pattern.title, pattern.description, pattern.severity, pattern.count, pattern.cases]
      );
      console.log(`  ✓ Pattern: ${pattern.title}`);
    }

    // Seed Insights (Proactive Insights)
    console.log('\n💡 Seeding proactive insights...');
    const insights = [
      {
        type: 'compliance_risk',
        title: 'IC Committee requires external member',
        description: 'Your IC committee does not have an external member as required by POSH Act',
        recommendations: ['Appoint external member', 'Update IC composition', 'Notify District Officer'],
        priority: 'high'
      },
      {
        type: 'training_gap',
        title: 'Awareness training overdue for 45% of employees',
        description: 'Significant portion of workforce has not completed annual POSH training',
        recommendations: ['Schedule training sessions', 'Send reminders to pending employees', 'Track completion rates'],
        priority: 'medium'
      },
      {
        type: 'case_delay',
        title: '2 cases approaching 90-day deadline',
        description: 'Cases CASE-2025-003 and CASE-2025-005 are at risk of missing the statutory 90-day resolution timeline',
        recommendations: ['Expedite investigation', 'Schedule IC meeting', 'Prepare interim report'],
        priority: 'critical'
      }
    ];

    for (const insight of insights) {
      await db.query(
        `INSERT INTO insights (organization_id, insight_type, title, description, recommendations, priority, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, '{"auto_generated": true}')`,
        [org.id, insight.type, insight.title, insight.description, insight.recommendations, insight.priority]
      );
      console.log(`  ✓ Insight: ${insight.title}`);
    }

    // Seed Evidence
    console.log('\n📎 Seeding evidence items...');
    if (caseIds.length > 0) {
      const evidenceItems = [
        {
          caseId: caseIds[0],
          type: 'email',
          title: 'Email chain showing inappropriate messages',
          description: 'Series of emails with inappropriate content sent over 3 weeks'
        },
        {
          caseId: caseIds[0],
          type: 'screenshot',
          title: 'Screenshots of chat messages',
          description: 'WhatsApp screenshots showing harassing messages'
        },
        {
          caseId: caseIds[1],
          type: 'witness_statement',
          title: 'Statement from colleague witness',
          description: 'Written statement from witness who observed the incident'
        },
        {
          caseId: caseIds[1],
          type: 'document',
          title: 'Complainant written statement',
          description: 'Detailed account of the incident from complainant'
        }
      ];

      for (const evidence of evidenceItems) {
        await db.query(
          `INSERT INTO evidence (case_id, evidence_type, title, description, collected_by, metadata, tags)
           VALUES ($1, $2, $3, $4, $5, '{"verified": true}', ARRAY['important'])`,
          [evidence.caseId, evidence.type, evidence.title, evidence.description, icMember.id]
        );
      }
      console.log(`  ✓ Added ${evidenceItems.length} evidence items`);
    }

    // Seed Interviews
    console.log('\n🎤 Seeding interviews...');
    if (caseIds.length > 0) {
      const interviews = [
        {
          caseId: caseIds[0],
          name: 'Complainant Interview',
          role: 'Complainant',
          email: 'complainant@example.com',
          status: 'completed',
          findings: ['Credible testimony', 'Consistent with written complaint', 'Emotional distress evident']
        },
        {
          caseId: caseIds[0],
          name: 'Respondent Interview',
          role: 'Respondent',
          email: 'respondent@example.com',
          status: 'completed',
          findings: ['Denial of allegations', 'Could not provide alibi for specific dates', 'Contradictory statements']
        },
        {
          caseId: caseIds[1],
          name: 'Witness Interview - Colleague',
          role: 'Witness',
          email: 'witness1@example.com',
          status: 'completed',
          findings: ['Corroborates complainant account', 'Observed inappropriate behavior', 'Willing to testify']
        },
        {
          caseId: caseIds[1],
          name: 'Department Manager Interview',
          role: 'Manager',
          email: 'manager@example.com',
          status: 'scheduled',
          findings: []
        }
      ];

      for (const interview of interviews) {
        const scheduledDate = new Date(Date.now() + (interview.status === 'scheduled' ? 86400000 : -86400000));
        const conductedDate = interview.status === 'completed' ? new Date(Date.now() - 172800000) : null;

        await db.query(
          `INSERT INTO interviews (case_id, interviewee_name, interviewee_role, interviewee_email, scheduled_date, conducted_date, conducted_by, status, notes, key_findings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            interview.caseId,
            interview.name,
            interview.role,
            interview.email,
            scheduledDate,
            conductedDate,
            icMember.id,
            interview.status,
            interview.status === 'completed' ? 'Interview conducted as per protocol. Detailed notes recorded.' : 'Scheduled for next week',
            interview.findings
          ]
        );
      }
      console.log(`  ✓ Added ${interviews.length} interviews`);
    }

    // Seed External Members
    console.log('\n👥 Seeding external members...');
    const externalMembers = [
      {
        name: 'Adv. Meera Krishnan',
        email: 'meera.krishnan@lawfirm.com',
        phone: '+91-9876543210',
        organization: 'Krishnan & Associates',
        expertise: ['POSH Law', 'Labour Law', 'Workplace Compliance'],
        bio: '15+ years experience in workplace harassment cases. Former District Judge.'
      },
      {
        name: 'Dr. Anjali Mehta',
        email: 'anjali.mehta@ngo.org',
        phone: '+91-9876543211',
        organization: 'Women Empowerment Foundation',
        expertise: ['Social Work', 'Counselling', 'Victim Support'],
        bio: 'PhD in Social Work. Specialized in trauma counselling and victim advocacy.'
      }
    ];

    for (const member of externalMembers) {
      await db.query(
        `INSERT INTO external_members (full_name, email, phone, organization, expertise, bio)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [member.name, member.email, member.phone, member.organization, member.expertise, member.bio]
      );
      console.log(`  ✓ Added: ${member.name}`);
    }

    // Seed Monitoring Data (API logs and AI usage)
    console.log('\n📊 Seeding monitoring data...');

    // Add some API request logs
    for (let i = 0; i < 20; i++) {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const paths = ['/api/cases', '/api/dashboard', '/api/documents', '/api/insights'];
      const statuses = [200, 200, 200, 201, 400, 404, 500];

      await db.query(
        `INSERT INTO api_request_logs (method, path, status_code, response_time_ms, user_id, organization_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${i} hours')`,
        [
          methods[Math.floor(Math.random() * methods.length)],
          paths[Math.floor(Math.random() * paths.length)],
          statuses[Math.floor(Math.random() * statuses.length)],
          Math.floor(Math.random() * 500) + 50,
          hrAdmin.id,
          org.id
        ]
      );
    }
    console.log('  ✓ Added 20 API request logs');

    // Add some AI usage logs
    for (let i = 0; i < 10; i++) {
      await db.query(
        `INSERT INTO ai_usage_logs (organization_id, user_id, case_id, model, agent_type, input_tokens, output_tokens, estimated_cost_usd, response_time_ms, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '${i * 2} hours')`,
        [
          org.id,
          hrAdmin.id,
          caseIds[i % caseIds.length] || null,
          'claude-sonnet-4-20250514',
          'copilot',
          Math.floor(Math.random() * 2000) + 500,
          Math.floor(Math.random() * 1000) + 200,
          (Math.random() * 0.05).toFixed(4),
          Math.floor(Math.random() * 3000) + 500
        ]
      );
    }
    console.log('  ✓ Added 10 AI usage logs');

    // Add a monitoring alert
    await db.query(
      `INSERT INTO monitoring_alerts (alert_type, severity, organization_id, message, details, status)
       VALUES ('case_deadline', 'warning', $1, 'Case CASE-2025-003 approaching 90-day deadline', '{"days_remaining": 7, "case_code": "CASE-2025-003"}', 'active')`,
      [org.id]
    );
    console.log('  ✓ Added monitoring alert');

    console.log('\n✅ All test data seeded successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding test data:', error.message);
    throw error;
  }
}

// Run the setup
try {
  await setupNewFeatureTables();
  await seedTestData();
  console.log('🎉 Setup complete! You can now test all the new features.\n');
  process.exit(0);
} catch (error) {
  console.error('💥 Setup failed:', error);
  process.exit(1);
}
