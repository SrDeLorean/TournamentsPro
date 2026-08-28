import { executeCommand } from '../src/lib/db';
import { GAMES_CATALOG } from '../src/lib/games-data';

async function migrateGames() {
  console.log('Migrating GAMES_CATALOG to database...');
  for (const game of Object.values(GAMES_CATALOG)) {
    const { slug, name, category, brandColor, positions, ...uiConfig } = game;
    
    // Add brandColor to uiConfig since it might be used by UI components 
    // besides the main brand_color column. Same with positions.
    const fullUiConfig = {
        ...uiConfig,
        brandColor,
        positions
    };

    console.log(`Upserting ${slug}...`);
    
    await executeCommand(`
      INSERT INTO games (slug, name, category, team_size, positions_json, brand_color, ui_config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        category = VALUES(category),
        team_size = VALUES(team_size),
        positions_json = VALUES(positions_json),
        brand_color = VALUES(brand_color),
        ui_config = VALUES(ui_config)
    `, [
      slug,
      name,
      category,
      positions.length,
      JSON.stringify(positions),
      brandColor,
      JSON.stringify(fullUiConfig)
    ]);
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrateGames().catch(console.error);
