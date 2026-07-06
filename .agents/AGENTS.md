# REMAX Inmomás International Portal — Agent Coding Rules

You must strictly adhere to the following rules when modifying the codebase:

## 1. Login Page Protections
- **DO NOT MODIFY** the unified login form structure in `index.html#login` (which contains `#view-login` with `#login-form`).
- **DO NOT STACK** or duplicate login forms (like `view-partner-login` or `view-admin-login`) inside `app.html`.
- The landing page and authentication screens live strictly on `index.html`.
- The dashboards and private profile screens live strictly on `app.html`.
- Do not add auto-redirections on the login form that prevent users from selecting other demo credentials.
- Always retain the demo account hints at the bottom of the login card.

## 2. Routing Boundaries
- Public routes (`home`, `about-spain`, `professionals`, `login`, `register`, `pending`, `intake`) are defined in `js/router.js` with `role: null` and live on `index.html`.
- Private/authenticated routes (dashboards, `profile`) require roles and live on `app.html`.
- The route `'profile'` is set to `role: 'authenticated'` and `sidebar: 'user'` to keep authenticated users inside `app.html` without looping back to a blank `index.html` view.
