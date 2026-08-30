import { dbProvider } from '../src/lib/db/provider';
import { hashPassword } from '../src/lib/auth';
async function main() {
  try {
    const user = await dbProvider.users.findByEmail('organizer1@tournamentspro.com');
    if (user) {
      const newHash = await hashPassword('password123');
      await dbProvider.users.update(user.id, { passwordHash: newHash });
      console.log('Password reset successfully to password123');
    } else {
      console.log('User not found in DB');
    }
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
main();
