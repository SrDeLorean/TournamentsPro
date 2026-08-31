const fs = require('fs');

// Patch organizations-page-client.tsx
let client = fs.readFileSync('src/features/organizations/components/organizations-page-client.tsx', 'utf8');

const start = client.indexOf('      {/* MODAL CREAR ORGANIZACIÓN */}');
const end = client.indexOf('      {/* MODAL EDITAR ORGANIZACIÓN */}');

if (start !== -1 && end !== -1) {
  const replacement = `      {/* MODAL CREAR ORGANIZACIÓN */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          endSuccess('La organización fue creada y ya está disponible en el directorio.');
          refreshOrganizations();
        }}
        currentUser={currentUser}
      />\n\n`;
  client = client.substring(0, start) + replacement + client.substring(end);
  
  client = client.replace(
    "import { ModalForm } from '@/components/ui/modal-form';",
    "import { ModalForm } from '@/components/ui/modal-form';\nimport { CreateOrganizationModal } from '@/features/organizations/components/create-organization-modal';"
  );
  fs.writeFileSync('src/features/organizations/components/organizations-page-client.tsx', client);
} else {
  console.log('Failed to patch organizations-page-client.tsx');
}

// Patch admin-dashboard-view.tsx
let admin = fs.readFileSync('src/components/admin/admin-dashboard-view.tsx', 'utf8');
const adminStart = admin.indexOf('          <ModalForm\n            isOpen={isCreatingOrg}');
const adminEnd = admin.indexOf('          </ModalForm>', adminStart);

if (adminStart !== -1 && adminEnd !== -1) {
  const replacement = `          <CreateOrganizationModal
            isOpen={isCreatingOrg}
            onClose={() => { setIsCreatingOrg(false); setCreateOrgError(''); }}
            onSuccess={() => fetchOrganizations()}
            currentUser={currentUser}
          />`;
  admin = admin.substring(0, adminStart) + replacement + admin.substring(adminEnd + 24);
  
  admin = admin.replace(
    "import { ModalForm } from '@/components/ui/modal-form';",
    "import { ModalForm } from '@/components/ui/modal-form';\nimport { CreateOrganizationModal } from '@/features/organizations/components/create-organization-modal';"
  );
  fs.writeFileSync('src/components/admin/admin-dashboard-view.tsx', admin);
} else {
  console.log('Failed to patch admin-dashboard-view.tsx');
}

console.log('Patched both pages successfully');
