import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

// Load environment variables
loadEnvConfig(process.cwd());

const games = [
    { slug: 'eafc', name: 'EA FC 24', category: 'Esports', team_size: 11 },
    { slug: 'csgo', name: 'CS2', category: 'Esports', team_size: 5 },
    { slug: 'valorant', name: 'Valorant', category: 'Esports', team_size: 5 },
    { slug: 'rocketleague', name: 'Rocket League', category: 'Esports', team_size: 3 },
    { slug: 'lol', name: 'League of Legends', category: 'Esports', team_size: 5 }
];

async function seed() {
    console.log('Connecting to database...');
    const connection = await createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tournamentspro',
    });

    console.log('Starting seed...');

    try {
        await connection.beginTransaction();

        // 1. Clean existing data
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = ['matches', 'tournament_rosters', 'competition_teams', 'competitions', 'seasons', 'team_members', 'teams', 'organizations', 'users', 'games'];
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Insert Games
        for (const game of games) {
            await connection.query(
                `INSERT INTO games (slug, name, category, team_size) VALUES (?, ?, ?, ?)`,
                [game.slug, game.name, game.category, game.team_size]
            );
        }

        const passwordHash = await bcrypt.hash('Password123!', 10);

        // 3. Create Admin
        await connection.query(
            `INSERT INTO users (id, email, name, gamertag, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['admin-1', 'admin@tournamentspro.com', 'Admin User', 'Admin', 'Administrador', 'Activo', passwordHash]
        );

        // 4. Create Organizer
        await connection.query(
            `INSERT INTO users (id, email, name, gamertag, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['org-1', 'organizer@tournamentspro.com', 'Main Organizer', 'Organizer', 'Organizador', 'Activo', passwordHash]
        );

        // 5. Create Organization
        await connection.query(
            `INSERT INTO organizations (id, name, tag, owner_id) VALUES (?, ?, ?, ?)`,
            ['org-1', 'Pro League Org', 'PLO', 'org-1']
        );
        
        // Update Organizer with organization_id
        await connection.query(
            `UPDATE users SET organization_id = ? WHERE id = ?`,
            ['org-1', 'org-1']
        );

        // 6. Iterate through games and create data
        for (const game of games) {
            console.log(`Seeding data for ${game.name}...`);
            
            // Create a competition for this game
            const compId = `comp-${game.slug}-1`;
            await connection.query(
                `INSERT INTO competitions (id, name, game_slug, organizer_id, organizer_name, organization_id, status, fecha_inicio, format) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [compId, `${game.name} Pro League`, game.slug, 'org-1', 'Main Organizer', 'org-1', 'Borrador', new Date(), 'Liga']
            );

            // Create 2 Captains and 2 Teams
            for (let i = 1; i <= 2; i++) {
                const captainId = `cap-${game.slug}-${i}`;
                const teamId = `team-${game.slug}-${i}`;
                const teamName = `${game.name} Team ${i}`;

                // Create Captain User
                await connection.query(
                    `INSERT INTO users (id, email, name, gamertag, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [captainId, `captain${i}.${game.slug}@test.com`, `Captain ${i} ${game.name}`, `Cap${game.slug}${i}`, 'Capitan', 'Activo', passwordHash]
                );

                // Create Team
                await connection.query(
                    `INSERT INTO teams (id, name, tag, game_slug, captain_id, captain_name) VALUES (?, ?, ?, ?, ?, ?)`,
                    [teamId, teamName, `T${i}${game.slug.substring(0,2)}`.toUpperCase(), game.slug, captainId, `Captain ${i} ${game.name}`]
                );

                // Enroll team in competition
                await connection.query(
                    `INSERT INTO competition_teams (id, competition_id, team_id, team_name, status) VALUES (?, ?, ?, ?, ?)`,
                    [`ct-${game.slug}-${i}`, compId, teamId, teamName, 'CONFIRMADO']
                );

                // Add 1 Player to the team
                const playerId = `player-${game.slug}-${i}`;
                await connection.query(
                    `INSERT INTO users (id, email, name, gamertag, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [playerId, `player${i}.${game.slug}@test.com`, `Player ${i} ${game.name}`, `Plr${game.slug}${i}`, 'Jugador', 'Activo', passwordHash]
                );

                // Player joins team
                await connection.query(
                    `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team) VALUES (?, ?, ?, ?, ?)`,
                    [`tm-${game.slug}-${i}`, teamId, playerId, 'FLEX', 'Jugador']
                );
            }
        }

        await connection.commit();
        console.log('Seed completed successfully!');
    } catch (error) {
        await connection.rollback();
        console.error('Seed failed:', error);
    } finally {
        await connection.end();
    }
}

seed();
