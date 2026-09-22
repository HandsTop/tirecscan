# TireScan Kommissionierung

Mobile-first warehouse picking application for tire containers.

## Workflow

1. A worker signs in with a personal Firebase account.
2. The worker enters a container number and claims the open container.
3. The app shows positions in picking order with article, EAN, quantity, warehouse location, and level.
4. The worker scans the tire EAN and enters the quantity taken.
5. The server validates the assignment, EAN, and remaining quantity in a Firestore transaction.
6. Completed positions turn green; the app moves to the next open warehouse position.

The interface defaults to German and also supports Russian and Latvian. The existing `logo.png` remains the application logo.

## Container import format

Administrators can paste JSON in the Administration screen:

```json
{
  "number": "15840",
  "orderNumber": "ORDER-2500",
  "items": [
    {
      "id": "1",
      "sequence": 1,
      "articleNo": "23-272",
      "ean": "5420068697854",
      "brand": "Minerva",
      "description": "225/60 R16 102V Master",
      "size": "225/60 R16 102V",
      "location": "WT12",
      "level": "1",
      "requiredQty": 4
    }
  ]
}
```

Each container is limited to 70 tires. Large orders are split into multiple containers by the source/ERP system and imported separately.

## Deployment

Install the Firebase CLI, authenticate to the correct project, and deploy:

```sh
cd functions
npm install
cd ..
firebase use tire-shop-52e54
firebase deploy --only firestore:rules,functions,hosting
```

Complete the security checklist in `SECURITY.md` before production use.
