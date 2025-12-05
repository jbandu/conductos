import db from '../db/pg-init.js';

const DEFAULT_PERMISSIONS = [
  { name: 'cases.read', resource: 'cases', action: 'read' },
  { name: 'cases.write', resource: 'cases', action: 'update' },
  { name: 'evidence.read', resource: 'evidence', action: 'read' },
  { name: 'evidence.write', resource: 'evidence', action: 'update' },
];

async function seedPermissions() {
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.query(
      `INSERT INTO permissions (name, description, resource, action)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO NOTHING`,
      [perm.name, perm.description || perm.name, perm.resource, perm.action]
    );
  }
  console.log(`Seeded ${DEFAULT_PERMISSIONS.length} permissions`);
  process.exit(0);
}

seedPermissions().catch((error) => {
  console.error('Failed seeding permissions', error);
  process.exit(1);
});
