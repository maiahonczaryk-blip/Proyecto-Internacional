# RE/MAX Inmomás International Portal — USA Realtor Alliance

This is the web portal for the RE/MAX Inmomás international expansion alliance, facilitating collaborations between US-based Realtors/Brokers and the local Spain team.

---

## 🛠️ Architecture & Routing Boundaries

The platform operates on a split Single Page Application (SPA) architecture across two main HTML entry points:

1. **`index.html` (Public Portal & Authentication)**:
   - Contains all public landing views: Home, About Spain, For Professionals, and VIP Intake.
   - Contains the unified login (`index.html#login`) and registration (`index.html#register`) forms.
2. **`app.html` (Private Dashboards & Profile)**:
   - Contains all authenticated views, including the Admin/Broker dashboard, Realtor dashboard, local Agent dashboard, and the user Profile.
   - Navigation is handled via hash routes (e.g. `app.html#realtor/dashboard`).

> [!WARNING]
> **CRITICAL RULE FOR DEVELOPERS**:
> - **DO NOT MODIFY** the login form structure in `index.html#login`.
> - **DO NOT STACK** or duplicate login forms inside `app.html`. 
> - The login process is unified and must redirect users to `app.html#<role>/dashboard` once authenticated.

---

## 🔒 Firebase Integration Setup

To connect this application to a production Firebase instance:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. Enable **Authentication** and activate the following providers:
   - **Email/Password**
   - **Google Sign-In** (configure your OAuth consent screen details).
4. Create a **Cloud Firestore** database instance.
5. Create a **Cloud Storage** bucket (optional, for profile pictures/avatars).
6. Copy your web app configuration keys and replace the placeholder keys in [js/firebase-config.js](file:///Users/maiahonczaryk/Desktop/Proyecto%20Internacional/js/firebase-config.js).
7. Change the configuration mode from demo to live:
   ```javascript
   App.demoMode = false;
   ```

### 🗄️ Database Seeding & Migration
A data migration and sync script is provided to easily populate the live Firestore instance:
1. Generate a service account private key in **Firebase Console -> Project Settings -> Service Accounts**.
2. Save the key at the root of the project as `firebase-service-account.json`.
3. Run the database seeding command:
   ```bash
   npm run db:migrate
   ```
This script will synchronize all 11 default mock users (along with their clients and commissions) into Cloud Firestore, and automatically provision corresponding accounts in Firebase Authentication using matched UIDs and credentials.

---

## 🚀 Key Workflows & Features

### 1. New Registrations & Referral Locks
- When a new Realtor registers (with Email or Google), they default to `'pending'` status and are logged in automatically.
- They can access their dashboard immediately, but all marketing features (referral links and QR codes) are locked:
  - The link box displays: *"Enlace pendiente de aprobación por el Administrador"*.
  - Copy buttons are disabled and greyed out.
  - The QR code box displays a placeholder warning.
- Once approved by an Admin, the restrictions are instantly lifted.

### 2. Admin Approval Cards & Role Assignment
- Under **Pending Applications** on the Admin Dashboard, the admin can approve or reject applicants directly:
  - Two side-by-side cards allow approving the applicant as either a **Broker** or a **Realtor**.
  - A blue ribbon tag (**"Requested"**) marks the option that the user requested during registration to guide the admin.
  - A full-width grey button allows rejecting the application.
- In the **User Management table** (clicking **👁**), the admin can modify any user's role (Realtor <=> Broker) at any time.

---

## 5. Vercel Production Deployments

This project is deployed on Vercel as a static web application. 
- The production file `app.html` is manually optimized and committed to Git.
- To prevent Vercel's automated compiler from overwriting `app.html` with basic templates, the build script in `package.json` is set to skip the build step:
  ```json
  "build": "echo 'Build skipped'"
  ```
- Any server-side Firestore changes are governed by rules defined in `firestore.rules` and published in the Firebase Console.
