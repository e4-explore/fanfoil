# Fanfoil

Pick a team, reveal three cards from its roster, keep one. Every card has a fixed number of copies, and that number is its rarity. One codebase runs on the web, iOS and Android, all backed by the same Supabase database, so a card claimed on the web shows up in the app.

**Stack:** Expo SDK 58 (Expo Router, React Native, React Native Web) and Supabase (Postgres, Auth, row-level security).

---

## Run it locally

You need Node 20+, Docker Desktop (Supabase runs its local stack in Docker), and for phones, the Expo Go app or an iOS/Android simulator.

```bash
npm install

# 1. Start the local database, auth and email inbox
npx supabase start
#    This applies supabase/migrations/* and loads supabase/seed.sql (NBA set).
#    It prints an "API URL" and an anon/publishable key. Copy both.

# 2. Point the app at it
cp .env.example .env
#    Paste the API URL and anon/publishable key into .env

# 3. Run the app
npm run web          # http://localhost:8081
npm run ios          # or: npm run android, or scan the QR with Expo Go
```

**Signing in locally:** enter any email and choose "Email me a sign-in code". Emails don't leave your computer. Open the local inbox at http://127.0.0.1:54324, find the email, and type the 6-digit code into the app.

**Testing on a real phone:** the phone can't reach `127.0.0.1` on your computer. Put your computer's network address in `.env` instead (e.g. `http://192.168.1.20:54321`) and restart `npm start`.

**Start over with a clean database:** `npx supabase db reset` (re-runs migrations and the seed).

**Typecheck:** `npm run typecheck`

---

## What's in the MVP

| Step | Where |
| --- | --- |
| Sign in with email code, Google or Apple | `src/app/sign-in.tsx`, `src/providers/auth.tsx` |
| Pick sport, then league, then team | `src/app/onboarding/sport.tsx`, `league.tsx`, `team.tsx` |
| Three randomized cards, reveal, claim one | `src/app/onboarding/claim.tsx` |
| Your claimed cards | `src/app/(tabs)/collection.tsx` |
| The full inventory with copies left | `src/app/(tabs)/inventory.tsx` |
| Switch teams, display name, sign out | `src/app/(tabs)/profile.tsx` |
| One card, large, tilt for foil | `src/app/card/[id].tsx`, `src/components/HoloCard.tsx` |

## How the inventory and claims work

Everything that matters for fairness lives in the database, not the app, so web and mobile behave identically and nobody can cheat by editing the client.

- **`collectibles`** is the inventory: name, tier, team, `total_supply` (edition size) and `claimed_count`. Remaining copies = `total_supply - claimed_count`. A database rule makes it impossible to claim more than the supply.
- **`collectible_tiers`** holds the levels. Today: `role` (1,000 copies per team) and `storyline` (100 copies per team). Adding a new level is an `INSERT`, not a code change.
- **`offer_rules`** controls which tiers can appear in which kind of offer, and how much weight each gets. Onboarding is set to roles only. To sprinkle storylines into the first pick, change one number:
  ```sql
  update offer_rules set weight_multiplier = 1 where source = 'onboarding' and tier = 'storyline';
  ```
- **The randomizer** (`_pick_offer_options`) picks 3 different cards, weighted by how many copies are left. A card with 10x the copies is about 10x as likely to show up, and sold-out cards never show. With storylines turned on, they fill about 5% of slots.
- **Offers** (`claim_offers`) record exactly which 3 cards a person was shown. They can only claim from that set. The offer is fixed per person per team, so refreshing, or switching teams and coming back, doesn't reroll it. If one of the three sells out, only that slot is replaced.
- **Claiming** (`claim_offer`) is atomic. The person's copy gets the next serial number (e.g. #189 of 1,000), stored in `user_collectibles`. If two people race for the last copy, exactly one gets it and the other is told it sold out and gets a replacement option.
- **Switching teams** is always allowed (`follow_team`) and recorded in `team_follows`. The first-card claim is one-time per account; switching never grants another.

All client writes go through these functions. Row-level security lets people read the catalog and inventory, and only their own profile, offers and cards.

### What's been verified

Against a real Postgres 16 database with Supabase's auth stubbed: the full claim flow, rerolling protection, claim-once, team switching, sold-out replacement, a two-person race for the last copy (one wins, one gets `sold_out`), rarity weighting, and that signed-in users can't write to the inventory, claims or other people's data. The app typechecks, bundles for web, and every screen was rendered and reviewed at phone and desktop sizes. It has **not** yet been run end-to-end against `supabase start` or on a physical phone, so expect small fixes on first run.

---

## Google and Apple sign-in

Email works with no setup. Google and Apple need credentials from those companies.

**Google**
1. In Google Cloud Console, create an OAuth client (type "Web application"). Add `http://127.0.0.1:54321/auth/v1/callback` as an authorized redirect URI (and your hosted Supabase callback URL later).
2. Create a `.env` file inside `supabase/` (not committed) with
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...`
3. Set `enabled = true` under `[auth.external.google]` in `supabase/config.toml` and restart `npx supabase start`.

**Apple**
- **iOS app:** uses Apple's native sign-in sheet. It needs an Apple Developer account, the bundle ID in `app.json` changed from `com.example.fanfoil` to yours, and a development build (`npx expo run:ios`); it doesn't run in Expo Go. Add your bundle ID as a client ID under `[auth.external.apple]` and enable it.
- **Web and Android:** use Apple's web sign-in, which needs a Services ID and a signing key from your Apple Developer account in the same config block.

Apple requires "Sign in with Apple" in any iOS app that offers Google sign-in, which is why both are here.

---

## Team logos

`teams.logo_url` exists and the team picker shows a logo when it's set, falling back to the abbreviation. It's intentionally empty. NBA team logos are trademarks owned by the league and teams, and using them in a product generally needs permission, so I'd get a lawyer's view before filling it in. Cards themselves never show logos, team colors or players.

---

## Going to production (later)

- **Hosted database:** create a Supabase project, then `npx supabase link` and `npx supabase db push`. Load the seed once with the SQL editor. Put the hosted URL and anon key in your production environment.
- **Web:** `npx expo export --platform web` produces a static site in `dist/` that any static host serves (Vercel works). Add your web domain's `/auth/callback` to the allowed redirect URLs in Supabase.
- **App stores:** build with EAS (`npx eas-cli@latest build`). Change the bundle ID and package name in `app.json` first.

## Built to grow

These are not built yet, but the schema leaves room so they don't need data migrations:

- **Paid packs:** `claim_offers.source` already allows `'pack'`. A purchase would create an offer the same way onboarding does, with its own `offer_rules`. Purchases need a receipts table and App Store / Play billing (Apple and Google require their in-app purchase systems for digital goods in apps). See the legal note below.
- **Matchday rewards:** same mechanism with `source = 'matchday'`.
- **NFTs:** each card has `nft_chain` / `nft_contract_address`, and each owned copy has `nft_token_id` / `nft_minted_at`. Serial numbers map one-to-one onto token editions, so minting can be added later (e.g. on demand when someone claims) without changing who owns what.
- **Notifications:** add a `push_tokens` table and use `expo-notifications`.
- **More leagues and sports:** add rows to `sports`, `leagues`, `teams` and `collectibles`. The app reads them dynamically.
- **Generated types:** once the schema settles, replace `src/lib/types.ts` with `npx supabase gen types typescript --local`.

## Legal flags to clear before launch

Not legal advice. Have a lawyer look at: randomized packs sold for money (loot-box and gambling rules vary by country and state), NFTs that hold real-world value (securities and sweepstakes rules), App Store and Google Play policies on NFTs and paid random items, and team-name and logo use.
