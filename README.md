# TireScan Kommissionierung

Mobile-first warehouse picking application for tire containers.

## Workflow

1. A worker signs in with a personal Firebase account.
2. The worker enters or scans a container number, reviews its summary, and explicitly confirms the assignment.
3. The app shows positions in picking order with article, EAN, planned quantity, warehouse location, level, and picked quantity.
4. Tapping a position opens the compact warehouse dialog. The worker scans the tire EAN and enters the quantity taken.
5. A short pick requires a second confirmation. The server validates assignment, EAN, and remaining quantity in a Firestore transaction.
6. Completed positions turn green; partial positions use a red outline so they cannot be overlooked.
7. Once every position is complete, the worker explicitly confirms the whole list before the container becomes completed.

The navigation and picking flow intentionally mirror the established warehouse handset workflow while retaining TireScan branding and the secured Firebase backend.

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

## Article search and tire catalog

`Artikelsuche` accepts an EAN, article number, brand, storage location, or a compact tire query such as `225/4518vnexen`. P is physical stock, V is available stock, B is ordered stock and T is received stock waiting to be entered. Administrators can import up to 100 catalog records at once:

```json
[
  {
    "ean": "5420068698523",
    "articleNo": "23-289",
    "brand": "Nexen",
    "size": "225/45 R18 95V",
    "description": "N'Fera Sport SU2",
    "available": 14,
    "ordered": 8,
    "arrivedPending": 2,
    "sales12Months": 26,
    "averageStock12Months": 18,
    "turnover": 72,
    "locations": [
      { "site": "Friesoythe", "code": "WX14", "level": 1, "quantity": 10, "available": 8 },
      { "site": "Thüle", "code": "K59", "level": 3, "quantity": 8, "available": 6 }
    ]
  }
]
```

Physical and available stock are calculated from all location quantities. P/V values turn red and the `LAGERPLÄTZE` button turns green only when stock exists at two or more different sites (for example Friesoythe and Thüle), not merely at two storage positions inside one site. Stock and location changes are restricted to administrators and written to the article history automatically.

The sales bar uses `sales12Months / averageStock12Months` to calculate a 12-month sales rating. Existing records without these fields continue to use the legacy `turnover` value. An administrator assigns every employee's display name in Administration; that name is then stored with new warehouse movements.

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
