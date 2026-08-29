const fs = require('fs');

// Fix usuarios/[userId]/page.tsx
let userPage = fs.readFileSync('src/app/usuarios/[userId]/page.tsx', 'utf8');
userPage = userPage.replace(
  /\.then\(\(payload: \{ success\?: boolean; user\?: PublicUser \}\) => \{[\s\S]*?if \(active && payload\.success && payload\.user\) setUser\(payload\.user\);[\s\S]*?\}\)/,
  `.then((payload: { success?: boolean; user?: PublicUser; data?: { user?: PublicUser } }) => {
      const u = payload.data?.user ?? payload.user;
      if (active && payload.success && u) setUser(u);
    })`
);
fs.writeFileSync('src/app/usuarios/[userId]/page.tsx', userPage);

// Fix team profile view hero image
let teamView = fs.readFileSync('src/components/teams/team-profile-view.tsx', 'utf8');
teamView = teamView.replace(/\/images\/hero\.jpg/g, '/images/default/banner-default.jpg');
fs.writeFileSync('src/components/teams/team-profile-view.tsx', teamView);

console.log('Patched profile views');
