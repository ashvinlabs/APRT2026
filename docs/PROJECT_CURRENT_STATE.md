# APRT2026 - Technical Documentation (Current State)

This document provides a comprehensive overview of the **APRT2026** project as of January 12, 2026.

## 1. Executive Summary
APRT2026 is an integrated E-Voting system designed for the RT 12 neighborhood election in Pelem Kidul. It aims to modernize the voting process through digital voter management (DPT), QR-code invitations, and real-time result tracking while maintaining high standards of data privacy.

---

## 2. Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **UI Components**: shadcn/ui, Lucide React (Icons).
- **Backend & Database**: Supabase (PostgreSQL).
- **Authentication**: Supabase Auth (Email/Password & OTP).
- **Real-time**: Supabase Realtime (managed via PostgreSQL Publications).
- **Utilities**: `qrcode.react` (Invitation QR), `lucide-react`.

---

## 3. Core Features

### A. Voter Management (DPT) - Privacy First
- **Centralized Registry**: A robust `voters` table where identity is managed via **Name & Address** (NIK has been removed for privacy compliance).
- **Composite Identity**: Unique constraint on `(name, address)` to handle potential namesake residents at different locations.
- **Smart Data Sync**: Bi-directional synchronization with Google Sheets and CSV import/export.
- **Privacy First**: Public-facing DPT check masks Address and hides Invitation Codes unless authorized.
- **Unique Identification**: Every voter is assigned a unique 6-character `invitation_code` generated deterministically.

### B. Invitation System
- **Layout**: Official print layout (3 invitations per A4 page).
- **QR Integration**: Each invitation includes a QR code containing the `invitation_code`.
- **Automated Metadata**: Dates and locations are dynamically injected from the `settings` table.

### C. Check-In & Presence
- **Digital Check-In**: High-speed QR scanner for polling station entry.
- **Lock Logic**: "Registration Lock" to prevent check-ins after the official window closes.
- **DPT Monitoring**: Real-time tracking of presence percentage vs total registered voters.

### D. Tallying & Safeguards
- **Voting Safeguards**: Logic-level protection to ensure Total Votes <= Recorded Presence.
- **Counter Mode**: Optimized keyboard-driven entry (Keys 1-9 for candidates, 0/X for invalid).
- **Undo Capability**: Instant correction of the last recorded vote to prevent tallying drift.
- **Live Dashboard**: Public visualization of "Suara Sah", "Suara Tidak Sah", and live standings.

---

## 4. Data Structures (Database Schema)

### `staff`
Stores information about election committee members.
- `id`: UUID (PK)
- `user_id`: UUID (FK to auth.users)
- `name`: TEXT
- `email`: TEXT
- `photo_url`: TEXT
- `is_approved`: BOOLEAN (Default: FALSE)
- `approved_by`: UUID (FK)
- `approved_at`: TIMESTAMPTZ

### `roles` & `staff_roles`
Discord-style role management.
- `roles`: `id`, `name`, `permissions` (JSONB), `color`, `priority`.
- `staff_roles`: Junction table linking staff to multiple roles.

### `voters`
The DPT (Daftar Pemilih Tetap).
- `id`: UUID (PK)
- `name`: TEXT
- `address`: TEXT
- `invitation_code`: TEXT (Unique, derived from name+address)
- `is_present`: BOOLEAN
- `present_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ
- **Constraint**: `voters_name_address_unique` UNIQUE(name, address)

### `candidates`
- `id`: UUID (PK)
- `name`: TEXT
- `photo_url`: TEXT
- `display_order`: INT

### `votes`
The actual ballot records.
- `id`: UUID (PK)
- `candidate_id`: UUID (FK)
- `is_valid`: BOOLEAN
- `recorded_by`: UUID (FK)

### `audit_logs`
- `id`: UUID (PK)
- `action`: TEXT
- `permission_group`: TEXT (e.g., 'voter_management', 'manage_votes')
- `metadata`: JSONB
- `staff_id`: UUID (FK)
- `created_at`: TIMESTAMPTZ

---

## 5. Security & RLS Policies
The system employs **25+ Row Level Security (RLS)** policies to ensure data integrity.

- **Selective Access**: Staff can see all voter data only if they are approved.
- **Role-Based Permissions**: Specific actions (like editing candidates or roles) require JSONB permission checks (e.g., `permissions->>'all' = 'true'`).
- **Audit Logging**: Every sensitive action triggers an audit log entry.
- **Public Masking**: The `search_voter_public` RPC function masks NIKs (`3404************`) and hides addresses.

---

## 6. Primary Workflows

### Staff Onboarding
1. User registers via `/register`.
2. Supabase Trigger `handle_new_staff` automatically creates a `staff` record (not approved).
3. Admin approves the staff member and assigns roles via the Dashboard.

### Voter Check-In
1. Voter brings physical/digital invitation with QR code.
2. Officer scans QR code via polling terminal.
3. System validates code and marks `is_present = true` in the database.

### Voting Process
1. Validated voter proceeds to the voting terminal.
2. Officer selects the candidate (or records the manual ballot).
3. System records the vote and links the voter's attendance status to prevent re-voting.

---

## 7. Configuration (`settings` table)
Election global settings are stored in a key-value JSONB structure:
- `election_config`: Includes `title`, `location`, `is_voting_open`, `is_registration_open`, and event timings.

---
**Prepared by**: Antigravity AI  
**Branch**: `feature/semi-digital-voting`
