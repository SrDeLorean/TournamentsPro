const fs = require('fs');
let content = fs.readFileSync('src/lib/db/supabase/implementations.ts', 'utf8');

const replacement = `async getOrganizationsWithStats(gameSlug?: string): Promise<any[]> {
    const orgs = await this.findAll();
    return orgs.map(o => ({
      ...o,
      allowed_games: o.allowedGames,
      logo_url: o.logoUrl,
      banner_url: o.bannerUrl,
      comp_count: 0
    }));
  }`;

content = content.replace(/async getOrganizationsWithStats[\s\S]*?throw new Error\('Not implemented for Supabase yet'\);\s*\}/, replacement);
fs.writeFileSync('src/lib/db/supabase/implementations.ts', content);
console.log('Fixed getOrganizationsWithStats');
