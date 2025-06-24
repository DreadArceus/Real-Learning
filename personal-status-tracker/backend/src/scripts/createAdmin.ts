import { AuthService } from '../services/AuthService';

async function createAdminUser() {
  const authService = new AuthService();
  
  try {
    const adminUser = await authService.createUser('dreadarceus', 'arcana110376', 'admin');
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