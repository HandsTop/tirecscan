# Security model

## Fixed by this revision

- Anonymous access was removed. Every warehouse worker must use Firebase Email/Password Authentication.
- A name stored in `localStorage` is no longer treated as an identity. The authenticated Firebase UID is the identity; the display name comes from the protected `users/{uid}` profile.
- Admin authorization was removed from client-side email comparison. Admin operations require the `admin: true` custom claim and are checked again in Cloud Functions.
- Browser clients cannot write operational data directly. Container assignment, pick confirmation, imports, and user activation are validated and executed by callable Cloud Functions.
- Pick confirmation is transactional. The server checks the assigned worker, exact EAN, positive integer quantity, remaining item quantity, and the 70-tire container limit.
- Firestore rules deny unlisted collections and all client writes. Workers can read item details only for a container assigned to them.
- Server-generated audit entries record container claims, picks, imports, and access changes. The client cannot create or edit audit records.
- The UI renders database values with `textContent`, not HTML interpolation, reducing stored-XSS risk.
- A restrictive Content Security Policy and additional browser security headers are included for Firebase Hosting.
- The unpinned third-party barcode script was removed. Scanning uses the browser `BarcodeDetector` API with manual EAN entry as a safe fallback.

## Required production setup

1. Enable **Email/Password** in Firebase Authentication and disable Anonymous Authentication after the new version is deployed.
2. Create the first administrator in Firebase Authentication. Assign the custom claim with a trusted Admin SDK environment:

   ```js
   await admin.auth().setCustomUserClaims("FIREBASE_UID", { admin: true });
   ```

   Sign out and back in afterward so the refreshed ID token contains the claim.
3. Deploy rules, functions, and hosting together:

   ```sh
   firebase deploy --only firestore:rules,functions,hosting
   ```

4. Register every production domain with Firebase App Check using a score-based reCAPTCHA Enterprise key. Put the public site key in `firebase-config.js`, monitor App Check metrics, then enable enforcement for Firestore and Functions. For Functions, set `REQUIRE_APP_CHECK=true` in its runtime environment before enforcing.
5. Restrict the Firebase web API key in Google Cloud to the production domains and only the APIs used by this app.
6. Require MFA for administrator accounts, remove inactive accounts promptly, and review `auditLogs` regularly.

## Operational notes

- Firebase web configuration values are public identifiers, not server credentials. Never add service-account JSON, private keys, passwords, or `.env` secrets to this repository.
- A container import is create-only; it cannot silently overwrite an active container.
- An administrator cannot deactivate their own account from the application.
- The application validates on both client and server. Server validation is authoritative.
