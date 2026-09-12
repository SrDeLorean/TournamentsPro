---
name: agent-browser
description: Browser automation and web inspection protocol for testing live web pages, DOM interactions, cookies, session state, console errors, and visual layout rendering.
---

# 🌐 Agent Browser Protocol

Inspired by `vercel-labs/agent-browser`. Provides guidelines for automating headless browsers (Puppeteer, Playwright, or built-in browser tools) to inspect, interact with, and verify web applications live.

## 🛠️ Core Capabilities & Guidelines

### 1. DOM & Element Interaction
- Select elements using robust, accessible selectors:
  - Prefer `getByRole`, `getByLabelText`, or `data-testid` attributes over fragile class strings.
- Handle async rendering states: wait for network idle or specific element presence before executing clicks or text input.

### 2. Live Verification Workflow
- Use browser inspection to:
  - Verify that forms submit properly and trigger client-side toast notifications.
  - Check responsive layouts at standard breakpoints (Mobile: 375px, Tablet: 768px, Desktop: 1280px).
  - Capture console warnings, hydration mismatches, and failed network requests (4xx/5xx).

### 3. Session & State Persistence
- Preserve authentication cookies or local storage tokens when testing authenticated routes (e.g. admin dashboards or tournament manager views).
- Clear test fixtures and mock data after test completion.
