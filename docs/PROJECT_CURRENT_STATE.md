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

### A. Voter Management (DPT)
- **Centralized Registry**: A robust `voters` table managing NIK, address, and attendance status.
- **Smart Data Sync**: Bi-directional synchronization with Google Sheets and CSV import/export.
- **Privacy First**: Public-facing DPT check masks sensitive data (NIK and Address).
- **Unique Identification**: Every voter is assigned a unique `invitation_code`.

### B. Invitation System
- **Layout**: High-quality print layout (2 invitations per A4 page).
- **QR Integration**: Each invitation includes a QR code containing the `invitation_code`.
- **Formal Wording**: Traditional formal Indonesian invitation content.

### C. Check-In & Voting
- **Digital Check-In**: QR scanner used at the polling station to mark attendance (`is_present = true`).
- **Electronic Ballot**: Secure voting terminal for authenticated staff to record votes for candidates.
- **Prevention**: System prevents double voting and ensures only present voters can cast ballots.

### D. Tallying & Visualization
- **Live Dashboard**: Real-time visualization of voting progress and current standings.
- **Tally Interface**: Dedicated screen for manual/digital entry of ballot counts.

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
- `nik`: TEXT (Masked in public views)
- `address`: TEXT
- `invitation_code`: TEXT (Unique)
- `is_present`: BOOLEAN
- `present_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

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
- `metadata`: JSONB
- `staff_id`: UUID (FK)

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
