# SHIPINFY — Documentation Complète & Plan de Scaling

> Généré le 2026-04-04

---

## 1. Description du Projet

SHIPINFY est un outil SaaS logistique de génération de fichiers CSV de livraison (tournées). L'utilisateur sélectionne un Warehouse, un Magasin, un Contact, remplit des champs optionnels, puis génère un CSV formaté pour l'intégration avec un transporteur externe (TRANSPORT EXPRESS).

| Info | Valeur |
|------|--------|
| URL production | `https://shipinfy.mazyoud.com` |
| Repo GitHub | `aminemazyoud-eng/shipinfy` |
| VPS | Hostinger — IP `187.124.43.5` |
| Orchestration | Docker Swarm + Dokploy v0.28.8 |
| Reverse proxy | Traefik + Let's Encrypt (ISRG Root X1) |

---

## 2. Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js App Router | 16.2.1 |
| Runtime | React | 19 |
| Language | TypeScript | — |
| Styles | Tailwind CSS | — |
| Composants UI | **@base-ui/react** (NOT Radix UI) | 1.3.0 |
| ORM | Prisma | 5.22.0 |
| Base de données | PostgreSQL (Supabase) | — |
| Supabase pooler | Session Pooler `aws-1-eu-north-1.pooler.supabase.com:5432` | — |
| Deploy | Dokploy (Docker Swarm) | 0.28.8 |
| Reverse proxy | Traefik + ACME | — |
| CI/CD | GitHub → Dokploy webhook | — |
| Build Docker | `standalone` + `node server.js` | — |

---

## 3. Architecture des Fichiers Clés

```
shipinfy/
├── app/
│   ├── generateur/page.tsx              # Page principale CSV generator
│   ├── api/
│   │   ├── warehouses/route.ts          # GET /api/warehouses
│   │   ├── stores/route.ts              # GET /api/stores?warehouseId=
│   │   ├── contacts/route.ts            # GET /api/contacts?storeId=
│   │   ├── exports/route.ts             # POST /api/exports (sauvegarde CsvExport)
│   │   └── shipper-references/route.ts  # POST /api/shipper-references
├── lib/
│   ├── prisma.ts                        # PrismaClient singleton
│   └── csv.ts                           # generateCSV(rows: Tournee[])
├── components/ui/
│   └── select.tsx                       # @base-ui/react Select wrapper
├── prisma/
│   ├── schema.prisma
│   └── init-tables.sql                  # Idempotent SQL pour Supabase
└── .env.local                           # DATABASE_URL (Supabase Session Pooler)
```

---

## 4. Schéma Base de Données

```prisma
model Warehouse {
  id        String   @id @default(cuid())
  name      String   @unique
  code      String   @unique
  createdAt DateTime @default(now())
  stores    Store[]
}

model Store {
  id                          String         @id @default(cuid())
  warehouseId                 String
  destinationAddress          String
  destinationDistrict         String
  destinationAddressLatitude  Float
  destinationAddressLongitude Float
  warehouse                   Warehouse      @relation(fields: [warehouseId], references: [id])
  contacts                    StoreContact[]
}

model StoreContact {
  id                      String @id @default(cuid())
  storeId                 String
  destinationFirstname    String
  destinationLastname     String
  destinationEmailAddress String
  destinationMobileNumber String
  store                   Store  @relation(fields: [storeId], references: [id])
}

model CsvExport {
  id            String   @id @default(cuid())
  filename      String
  warehouseName String
  nbTournees    Int
  csvContent    String
  createdAt     DateTime @default(now())
}

model ShipperReference {
  code      String   @id
  createdAt DateTime @default(now())
}
```

> Les tables SQL correspondantes se trouvent dans `prisma/init-tables.sql` avec `CREATE TABLE IF NOT EXISTS` — idempotent à chaque démarrage du container.

---

## 5. Historique des Fixes (Session de Développement)

### Fix 1 — Dropdowns affichaient les IDs bruts au lieu des noms

**Symptôme :** Les selects Warehouse / Magasin / Contact affichaient des IDs cuid du type `cmnado4mh0000ijzx0zw1ldog` au lieu du nom lisible.

**Cause racine :** `@base-ui/react` utilise un portail lazy-render pour `Select.Popup`. Le composant `Select.Value` cherche le texte d'affichage depuis les items enregistrés — mais les items ne s'enregistrent que quand le popup est ouvert. Au premier rendu, aucun item n'est enregistré → `Select.Value` affiche l'ID brut.

**Fix appliqué :** Bypasser `Select.Value` entièrement. Utiliser un `<span>` explicite dont le texte est calculé depuis le state React.

```tsx
// Avant (bugué)
<SelectValue placeholder="Sélectionner un Warehouse" />

// Après (fix)
<span data-slot="select-value" className={`flex flex-1 text-left text-sm${!selectedWH ? ' text-muted-foreground' : ''}`}>
  {selectedWH ? selectedWH.name : 'Sélectionner un Warehouse'}
</span>
```

Pattern appliqué aux 3 selects :
- Warehouse → `.name`
- Magasin → `.destinationAddress`
- Contact → `destinationFirstname + ' ' + destinationLastname`

---

### Fix 2 — La colonne `shipperReference` était toujours vide dans le CSV

**Symptôme :** Le CSV généré avait la colonne `shipperReference` vide pour toutes les lignes.

**Solution end-to-end :**

1. Nouveau modèle Prisma `ShipperReference` (table de persistance)
2. Nouvel endpoint `POST /api/shipper-references` qui génère des codes 6 chiffres uniques
3. Injection côté client avant `generateCSV()`

**Logique de génération (API) :**

```typescript
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Charge tous les codes existants → Set pour O(1) lookup
// Génère aléatoirement jusqu'à count * 200 tentatives (anti-collision)
// Persiste avec prisma.shipperReference.createMany()
// Retourne { codes: ["123456", ...] }
```

**Injection côté client :**

```tsx
const countNeedingRef = rows.filter(t => !t.shipperReference).length
if (countNeedingRef > 0) {
  const res = await fetch('/api/shipper-references', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: countNeedingRef }),
  })
  const { codes } = await res.json()
  let idx = 0
  finalRows = rows.map(t => ({
    ...t,
    shipperReference: t.shipperReference || codes[idx++],
  }))
}
```

---

### Fix 3 — TypeScript build failure sur `variant` prop

**Erreur :**
```
Type error: Object literal may only specify known properties,
and 'variant' does not exist in type '{ title: string; description?: string | undefined; }'
```

**Cause :** `toast({ variant: 'destructive', ... })` — le type `useToast` de ce projet n'expose pas `variant`.

**Fix :**
```tsx
// Avant
toast({ title: 'Erreur', variant: 'destructive', description: '...' })

// Après
toast({ title: 'Erreur — codes de tracking', description: 'Impossible de générer les codes de tracking' })
```

---

## 6. Commandes Opérationnelles

```bash
# Développement local
npm run dev                          # Lance sur http://localhost:3000

# Build production
npm run build                        # Génère .next/standalone/

# Déploiement
git push origin main                 # → webhook Dokploy → rebuild Docker → redeploy Swarm

# Vérifier la production
curl -s https://shipinfy.mazyoud.com/api/warehouses | jq .
curl -s https://shipinfy.mazyoud.com/api/stores?warehouseId=<id> | jq .

# Tester l'endpoint shipper-references
curl -s -X POST https://shipinfy.mazyoud.com/api/shipper-references \
  -H "Content-Type: application/json" \
  -d '{"count": 3}' | jq .
```

---

## 7. Plan de Scaling

### Phase 1 — Court terme (0 → 1 000 utilisateurs)

| Action | Priorité | Détail |
|--------|----------|--------|
| Optimiser `/api/shipper-references` | **Haute** | Remplacer `findMany()` (charge toute la table) par `SELECT COUNT(*)` ou une vérification par batch |
| Index DB | **Haute** | Ajouter index sur `Store.warehouseId` et `StoreContact.storeId` |
| Rate limiting | **Haute** | Limiter `/api/shipper-references` à N requêtes/minute par IP |
| Pagination | Moyenne | Ajouter `limit`/`offset` sur `/api/stores` et `/api/contacts` |
| Logging | Moyenne | Ajouter logs structurés (pino) sur les endpoints API |

### Phase 2 — Moyen terme (1 000 → 10 000 utilisateurs)

| Action | Détail |
|--------|--------|
| Authentification multi-utilisateurs | NextAuth.js ou Supabase Auth |
| Isolation par tenant | Ajouter colonne `orgId` sur Warehouse, Store, Contact + RLS policies |
| Supabase Connection Pooling | Passer en Transaction Pooler (port 6543) si >100 connexions simultanées |
| CDN statique | Cloudflare devant le VPS pour assets et cache |
| Queue pour gros volumes CSV | BullMQ + Redis si >50 lignes/requête ou batch nocturne |
| Historique exports | Page admin listant les `CsvExport` par org |

### Phase 3 — Long terme (SaaS multi-tenant)

| Composant | Choix recommandé |
|-----------|-----------------|
| Auth & permissions | Supabase Auth + RLS (Row Level Security) |
| Isolation DB | Schema-per-tenant ou RLS policies par `org_id` |
| Tracking codes | Migrer vers ULID/UUID ou codes 8+ chiffres (voir note ci-dessous) |
| Monitoring & erreurs | Sentry (erreurs) + Vercel Analytics ou PostHog (usage) |
| Export async | Job queue avec webhook/email notification à la fin |
| RBAC | Rôles par warehouse par utilisateur (admin, opérateur, lecture) |
| Facturation | Stripe + table `Subscription` |

---

## 8. Points d'Attention Critiques

### ⚠️ Espace de codes 6 chiffres

L'espace total = **900 000 combinaisons** (100000–999999).

Au-delà de ~**500 000 codes utilisés**, la génération aléatoire devient exponentiellement lente (trop de collisions). L'API actuelle a un guard `maxAttempts = count * 200` qui retourne une erreur 500 si elle ne trouve pas assez de codes uniques.

**Action à prévoir avant d'atteindre 500K codes :**
- Option A : Passer à des codes à 8 chiffres (90 millions de combinaisons)
- Option B : Utiliser ULID (`01ARZ3NDEKTSV4RRFFQ69G5FAV`) — pratiquement illimité, tri chronologique natif

---

### ⚠️ @base-ui/react ≠ Radix UI

`components/ui/select.tsx` wrappe `@base-ui/react/select`, **pas** `@radix-ui/react-select`. Les APIs sont différentes. Ne pas chercher de doc Radix pour déboguer les composants Select de ce projet.

Import à surveiller :
```typescript
import * as SelectPrimitive from '@base-ui/react/select'  // ✅ ce projet
// import * as SelectPrimitive from '@radix-ui/react-select'  // ❌ pas ce projet
```

---

### ⚠️ `init-tables.sql` — Doit rester idempotent

Ce fichier est exécuté à **chaque démarrage du container**. Il doit toujours utiliser `IF NOT EXISTS`. Ne jamais y ajouter de `DROP TABLE`, `TRUNCATE`, ou migrations destructives.

---

### ⚠️ Prisma + Supabase Session Pooler

Utiliser le **Session Pooler** (port 5432 du pooler), pas la connexion directe.

```
# .env.local
DATABASE_URL="postgresql://postgres:<password>@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
```

La connexion directe (port 5432 de Supabase) est limitée à ~20 connexions simultanées — insuffisant en production.

---

### ⚠️ Build Docker standalone

Le `Dockerfile` utilise `output: 'standalone'` dans `next.config.js` et lance `node server.js`. Si tu modifies la config de build, vérifier que ces deux points sont cohérents.

---

## 9. Structure du CSV Généré

Le CSV suit le format attendu par TRANSPORT EXPRESS avec 20 colonnes :

| # | Colonne | Source |
|---|---------|--------|
| 1 | transporterCode | `TRANSPORT EXPRESS` (fixe) |
| 2 | hubCode | `Warehouse.code` |
| 3 | shipperCode | `FMCG` (fixe) |
| 4 | shipperReference | Auto-généré (6 chiffres, unique) |
| 5 | destinationFirstname | `StoreContact.destinationFirstname` |
| 6 | destinationLastname | `StoreContact.destinationLastname` |
| 7 | destinationEmailAddress | `StoreContact.destinationEmailAddress` |
| 8 | destinationMobileNumber | `StoreContact.destinationMobileNumber` |
| 9 | destinationAddress | `Store.destinationAddress` |
| 10 | destinationDistrict | `Store.destinationDistrict` |
| 11 | destinationAddressLatitude | `Store.destinationAddressLatitude` |
| 12 | destinationAddressLongitude | `Store.destinationAddressLongitude` |
| 13 | deliveryTimeStart | Optionnel (saisi manuellement) |
| 14 | deliveryTimeEnd | Optionnel (saisi manuellement) |
| 15 | shippingFees | Optionnel |
| 16 | paymentOnDeliveryAmount | Optionnel (montant COD) |
| 17 | contentDescription | Optionnel |
| 18 | externalReference | Optionnel |

Nom du fichier : `SHIPINFY_<WarehouseName>_<YYYYMMDD_HHMMSS>.csv`

---

*Document généré automatiquement depuis la session de développement SHIPINFY — 2026-04-04*
