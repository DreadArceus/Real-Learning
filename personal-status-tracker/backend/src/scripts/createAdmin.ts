import { AuthService } from '../services/AuthService';
import { config } from '../config';

async function createAdminUser() {
  const authService = new AuthService();
  
  // Get admin credentials from environment variables
  const username = config.ADMIN_USERNAME || process.env.ADMIN_USERNAME;
  const password = config.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  
  if (!username || !password) {
    console.error('❌ Error: Admin credentials not provided.');
    console.error('   Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
    console.error('   Example: ADMIN_USERNAME=admin ADMIN_PASSWORD=securepassword123 npm run create-admin');
    process.exit(1);
  }
  
  try {
    const adminUser = await authService.createUser(username, password, 'admin');
    console.log('✅ Admin user created successfully:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Created: ${adminUser.createdAt}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️  Admin user already exists');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  }
}

// Run the script
createAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Failed to create admin user:', error);
  process.exit(1);
});