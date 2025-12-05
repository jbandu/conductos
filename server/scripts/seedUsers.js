import bcrypt from 'bcrypt';
import db from '../db/pg-init.js';

const SALT_ROUNDS = 10;

const TEST_USERS = [
  {
    fullName: 'John Doe',
    email: 'employee@test.com',
    password: 'password123',
    role: 'employee'
  },
  {
    fullName: 'Jane Smith',
    email: 'employee2@test.com',
    password: 'password123',
    role: 'employee'
  },
  {
    fullName: 'Sarah Wilson',
    email: 'ic@test.com',
    password: 'password123',
    role: 'ic_member'
  },
  {
    fullName: 'Michael Brown',
    email: 'ic2@test.com',
    password: 'password123',
    role: 'ic_member'
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Seeding test users...\n');

    // Clear existing users
    await db.query('DELETE FROM users');
    console.log('✓ Cleared existing users');

    // Insert test users
    for (const user of TEST_USERS) {
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

      await db.query(
        `INSERT INTO users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        [user.fullName, user.email, passwordHash, user.role]
      );

      console.log(`✓ Created ${user.role}: ${user.email} (password: ${user.password})`);
    }

    console.log(`\n✅ Successfully seeded ${TEST_USERS.length} users\n`);
    console.log('Test Credentials:');
    console.log('─'.repeat(60));
    console.log('\n👤 Employees:');
    console.log('  • employee@test.com / password123');
    console.log('  • employee2@test.com / password123');
    console.log('\n🛡️  IC Members:');
    console.log('  • ic@test.com / password123');
    console.log('  • ic2@test.com / password123');
    console.log('\n' + '─'.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
