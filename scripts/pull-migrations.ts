import * as fs from 'fs';
import * as path from 'path';

const CLIENT_DIR = __dirname + '/..';
const ADMIN_DIR = path.join(CLIENT_DIR, '..', 'Learnflow-Admin');

// Pull schema from Admin
function pullSchema() {
  const adminSchemaPath = path.join(ADMIN_DIR, 'prisma', 'schema.prisma');
  const clientSchemaPath = path.join(CLIENT_DIR, 'prisma', 'schema.prisma');

  if (!fs.existsSync(adminSchemaPath)) {
    console.error('❌ Admin schema not found:', adminSchemaPath);
    process.exit(1);
  }

  // Read admin schema and copy as-is
  let schemaContent = fs.readFileSync(adminSchemaPath, 'utf-8');

  // Clean up extra blank lines
  schemaContent = schemaContent.replace(/\n{3,}/g, '\n\n');

  // Write to client schema
  if (!fs.existsSync(path.dirname(clientSchemaPath))) {
    fs.mkdirSync(path.dirname(clientSchemaPath), { recursive: true });
  }

  fs.writeFileSync(clientSchemaPath, schemaContent);
  console.log('✅ Schema pulled from Admin');
}

// Pull migrations from Admin
function pullMigrations() {
  const adminMigrationsPath = path.join(ADMIN_DIR, 'prisma', 'migrations');
  const clientMigrationsPath = path.join(CLIENT_DIR, 'prisma', 'migrations');

  if (!fs.existsSync(adminMigrationsPath)) {
    console.error(
      '❌ Admin migrations directory not found:',
      adminMigrationsPath
    );
    process.exit(1);
  }

  // Create client migrations directory if it doesn't exist
  if (!fs.existsSync(clientMigrationsPath)) {
    fs.mkdirSync(clientMigrationsPath, { recursive: true });
  }

  // Copy migration_lock.toml
  const lockFile = path.join(adminMigrationsPath, 'migration_lock.toml');
  if (fs.existsSync(lockFile)) {
    fs.copyFileSync(
      lockFile,
      path.join(clientMigrationsPath, 'migration_lock.toml')
    );
    console.log('✅ migration_lock.toml pulled');
  }

  // Copy all migration directories
  const entries = fs.readdirSync(adminMigrationsPath, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const migrationDir = path.join(adminMigrationsPath, entry.name);
      const targetDir = path.join(clientMigrationsPath, entry.name);

      // Check if migration already exists in client
      if (fs.existsSync(targetDir)) {
        console.log(
          `⏭️  Migration ${entry.name} already exists in Client, skipping...`
        );
        continue;
      }

      // Copy entire migration directory
      copyDirectory(migrationDir, targetDir);
      copiedCount++;
      console.log(`✅ Migration ${entry.name} pulled`);
    }
  }

  if (copiedCount === 0) {
    console.log('ℹ️  No new migrations to pull');
  }
}

// Helper function to copy directory recursively
function copyDirectory(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main execution
try {
  console.log('🔄 Pulling migrations from Admin to Client...\n');
  pullSchema();
  pullMigrations();
  console.log('\n✨ Pull completed successfully!');
} catch (error) {
  console.error('❌ Error pulling migrations:', error);
  process.exit(1);
}
