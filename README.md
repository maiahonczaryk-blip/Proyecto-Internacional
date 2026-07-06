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
6. Copy your web app configuration keys and replace the placeholder keys in [js/firebase-config.js](file:///Users/santiagocastro/Desktop/Projects%20Antigravity/Proyecto-Internacional/js/firebase-config.js).
7. Change the configuration mode from demo to live:
   ```javascript
   App.demoMode = false;
   ```

### Firestore Database Schema
- **`users`** collection (document ID is the User UID):
  - `email` (string)
  - `role` (string: `'admin'`, `'broker'`, `'realtor'`, `'agent_inmomas'`)
  - `status` (string: `'pending'`, `'active'`, `'rejected'`)
  - `firstName`, `lastName` (strings)
  - `agencyName`, `phone`, `country` (strings)
  - `profileImage` (string, base64 or URL)
  - `createdAt`, `updatedAt` (ISODate strings)
- **`clients`** collection:
  - `firstName`, `lastName`, `email`, `phone` (strings)
  - `status` (string)
  - `referredBy` (string, User UID)
  - `brokerId` (string, Broker UID)
  - `localAgentId` (string, Agent UID)
  - `localAgentName` (string)
  - `createdAt` (ISODate string)
- **`commissions`** collection:
  - `clientId` (string)
  - `clientName` (string)
  - `realtorId` (string, Realtor UID)
  - `brokerId` (string, Broker UID)
  - `agentId` (string, Agent UID)
  - `salePrice` (number)
  - `totalCommission` (number)
  - `realtorAmount`, `brokerAmount`, `agentAmount` (numbers)
  - `status` (string: `'projected'`, `'pending_payment'`, `'paid'`)
