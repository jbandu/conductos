import '../config.js';
import db from '../db/pg-init.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function seedAdmin() {
  console.log('🌱 Seeding admin data...\n');

  try {
    // 1. Create default organization
    console.log('Creating default organization...');
    const orgResult = await db.query(`
      INSERT INTO organizations (name, domain, industry, employee_count, city, state)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (domain) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING id
    `, ['Demo Organization', 'demo.kelphr.com', 'Technology', 500, 'Mumbai', 'Maharashtra']);

    const orgId = orgResult.rows[0].id;
    console.log(`✓ Created organization with ID: ${orgId}\n`);

    // 2. Create super admin user
    console.log('Creating super admin user...');
    const adminPassword = 'Admin@123456';
    const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const adminResult = await db.query(`
      INSERT INTO users (full_name, email, password_hash, role, is_super_admin, organization_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          is_super_admin = EXCLUDED.is_super_admin,
          is_active = EXCLUDED.is_active
      RETURNING id
    `, ['System Administrator', 'admin@demo.kelphr.com', adminPasswordHash, 'hr_admin', true, orgId, true]);

    const adminId = adminResult.rows[0].id;
    console.log(`✓ Created super admin with ID: ${adminId}\n`);

    // 3. Create sample IC composition
    console.log('Creating sample IC composition...');

    const icMembers = [
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@demo.kelphr.com',
        role: 'presiding_officer',
        expertise: 'HR Leadership',
        password: 'password123'
      },
      {
        name: 'Rahul Verma',
        email: 'rahul.verma@demo.kelphr.com',
        role: 'internal_member',
        expertise: 'Legal Affairs',
        password: 'password123'
      },
      {
        name: 'Meera Iyer',
        email: 'meera.iyer@demo.kelphr.com',
        role: 'internal_member',
        expertise: 'Employee Relations',
        password: 'password123'
      },
      {
        name: 'Advocate Rajan Kumar',
        email: 'advocate.kumar@lawfirm.com',
        role: 'external_member',
        expertise: 'Legal - Employment Law',
        password: 'password123'
      }
    ];

    for (const member of icMembers) {
      const passwordHash = await bcrypt.hash(member.password, SALT_ROUNDS);

      // Create user
      const userResult = await db.query(`
        INSERT INTO users (full_name, email, password_hash, role, organization_id, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active
        RETURNING id
      `, [member.name, member.email, passwordHash, 'ic_member', orgId, adminId, true]);

      const userId = userResult.rows[0].id;

      // Add to IC composition
      await db.query(`
        INSERT INTO ic_members (organization_id, user_id, role, appointed_date, expertise, created_by, is_active)
        VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
        ON CONFLICT (organization_id, user_id) DO UPDATE
        SET role = EXCLUDED.role,
            expertise = EXCLUDED.expertise,
            is_active = EXCLUDED.is_active
      `, [orgId, userId, member.role, member.expertise, adminId, true]);

      console.log(`✓ Created IC member: ${member.name} (${member.role})`);
    }

    console.log('\n✅ Successfully seeded admin data\n');

    // Print credentials
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║           ADMIN CREDENTIALS (CHANGE IN PROD)       ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║  Email:    admin@demo.kelphr.com                   ║');
    console.log('║  Password: Admin@123456                            ║');
    console.log('║  Role:     Super Admin                             ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║           IC MEMBER CREDENTIALS                    ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║  Presiding Officer:                                ║');
    console.log('║    priya.sharma@demo.kelphr.com / password123      ║');
    console.log('║  Internal Members:                                 ║');
    console.log('║    rahul.verma@demo.kelphr.com / password123       ║');
    console.log('║    meera.iyer@demo.kelphr.com / password123        ║');
    console.log('║  External Member:                                  ║');
    console.log('║    advocate.kumar@lawfirm.com / password123        ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedAdmin();
