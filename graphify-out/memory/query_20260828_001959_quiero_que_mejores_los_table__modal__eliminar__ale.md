---
type: "query"
date: "2026-08-28T00:19:59.944750+00:00"
question: "quiero que mejores los table, modal, eliminar, alertas que se generan en la gestion global."
contributor: "graphify"
outcome: "useful"
source_nodes: ["DataTable()", "Modal()", "ConfirmModal()", "CrudAlertBanner()", "organizations-page-client.tsx", "games-management-view.tsx", "competitions-client.tsx"]
---

# Q: quiero que mejores los table, modal, eliminar, alertas que se generan en la gestion global.

## Answer

Expanded from original query via graph vocab: [table, tables, modal, confirm, alert, alertas, crud, delete, form, management]. Graph traversal identified DataTable, Modal, ModalForm, ConfirmModal, CrudAlertBanner and native destructive confirmations in organizations and games, plus the competition delete status flow. Improved DataTable search, filter reset, counts, accessible sorting, empty states and pagination; Modal now uses a portal, focus trap/restoration, scroll locking and close guards; ConfirmModal now supports consequences, typed verification and recoverable errors; CrudAlertBanner is responsive, accessible, timed and displays duration/progress. Replaced native destructive confirmations for organizations, disciplines and competitions. ESLint passed, 102 tests passed and Next.js production build passed.

## Outcome

- Signal: useful

## Source Nodes

- DataTable()
- Modal()
- ConfirmModal()
- CrudAlertBanner()
- organizations-page-client.tsx
- games-management-view.tsx
- competitions-client.tsx