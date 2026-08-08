# CAST Mobile — Setup Guide

## Install & Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on Android/iOS.

## Build APK (for distribution)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Supabase Tables Required

Run these in Supabase SQL Editor before using the app:

```sql
-- Voters table (populated by admin when pushing voter data per booth)
create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  "boothNo" text references booths("boothNo") on delete cascade,
  data jsonb not null default '{}',
  inserted_at timestamptz default now()
);
alter table voters disable row level security;

-- Responses table (mobile app writes here, auto-synced in background)
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}',
  inserted_at timestamptz default now()
);
alter table responses disable row level security;
```

## How It Works

- **Login**: Agent enters phone number + 4-digit PIN → verified against Supabase `agents` table
- **Offline-first**: All survey responses saved locally to AsyncStorage instantly on submit
- **Background sync**: Automatically uploads to Supabase `responses` table when internet is available
- **No sync UI**: Agents never see sync status — it happens silently in the background

## Screen Flow

```
Login → Home (KPIs, active survey, CTA)
     → Tasks (phase list, tap active → voter list)
     → Voters (searchable directory)
     → Profile (agent info, logout)

Active Survey CTA → Voter List → Survey Screen → Submit → Success → Next Voter
```
