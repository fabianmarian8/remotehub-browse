# Phase 2 Features - Job Board Enhancements

## Overview
Phase 2 adds advanced functionality to differentiate the job board with user-centric features including saved jobs, email alerts, and advanced filtering capabilities.

## Features Implemented

### 1. Saved Jobs (Favorites)
Users can now save jobs they're interested in for later review.

**Features:**
- Heart icon button on each job card to save/unsave jobs
- Authentication required - prompts sign-in dialog for non-authenticated users
- Visual indication when a job is saved (filled heart icon)
- Dedicated "Saved Jobs" page at `/saved` to view all saved jobs
- Real-time sync across all devices when user is signed in

**Technical Details:**
- Database table: `saved_jobs`
- Hook: `useSavedJobs` (`/src/hooks/useSavedJobs.ts`)
- Component: Save button integrated into `JobCard`
- Page: `SavedJobs` (`/src/pages/SavedJobs.tsx`)

### 2. Email Alerts
Users can configure email notifications for new jobs matching their preferences.

**Features:**
- Toggle email alerts on/off
- Choose alert frequency: Instant, Daily Digest, or Weekly Digest
- Preferences saved per user
- Foundation for automated email sending (requires backend implementation)

**Technical Details:**
- Database table: `user_preferences`, `email_alerts_log`
- Hook: `useEmailPreferences` (`/src/hooks/useEmailPreferences.ts`)
- Component: `EmailPreferences` (`/src/components/EmailPreferences.tsx`)

**Note:** Email sending infrastructure needs to be implemented via Supabase Edge Functions or external service (SendGrid, Resend).

### 3. Advanced Filters

#### A) Salary Range Slider
- Interactive slider to filter jobs by salary range
- Range: $0 - $300k+
- Filters jobs where the salary range overlaps with selected range

#### B) Multiple Categories Selection
- Select multiple job categories simultaneously
- Checkbox-based multi-select interface
- Categories: Engineering, Design, Marketing, Sales, Customer Support, Product, Data, Other

#### C) Remote Type Filter
- Filter by work arrangement:
  - Fully Remote
  - Hybrid
  - On-site
  - Timezone Specific
- Multi-select checkboxes

#### D) Company Size Filter
- Filter by company size:
  - Startup (1-10)
  - Small (11-50)
  - Medium (51-200)
  - Large (201-1000)
  - Enterprise (1000+)
- Multi-select checkboxes

**Technical Details:**
- Component: `AdvancedFilters` (`/src/components/AdvancedFilters.tsx`)
- Mobile-responsive: Uses Sheet (drawer) on mobile, Collapsible panel on desktop
- Updated `useJobs` hook to support all advanced filter parameters
- Database columns added: `remote_type`, `company_size`

### 4. "New" Badge
Job posts younger than 24 hours display a green "NEW" badge with sparkle icon.

**Status:** Already implemented in previous phase
**Location:** `JobCard` component (`/src/components/JobCard.tsx`)

### 5. Better Salary Display
Enhanced salary formatting with period indication.

**Features:**
- Shows salary period: /year, /month, /hr (hourly), or blank (project)
- Improved formatting with K notation (e.g., $80k - $120k/year)
- Handles single values and ranges

**Technical Details:**
- Database column added: `salary_period` (yearly, monthly, hourly, project)
- Updated `formatSalary` function in `JobCard`

## User Authentication

### Authentication System
Implemented Supabase-based authentication with email/password and OAuth support.

**Features:**
- Email/password sign-up and sign-in
- OAuth ready (Google, GitHub) - requires Supabase configuration
- Auth state management via React Context
- Protected routes and features
- Auth dialog component for smooth UX

**Components:**
- `AuthContext` (`/src/contexts/AuthContext.tsx`) - Global auth state
- `AuthDialog` (`/src/components/AuthDialog.tsx`) - Sign-in/Sign-up modal
- `useAuth` hook for accessing auth state throughout the app

## Database Schema

### New Tables

#### `saved_jobs`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- job_id: UUID (references jobs)
- created_at: TIMESTAMPTZ
```

#### `user_preferences`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- categories: TEXT[]
- job_types: TEXT[]
- remote_types: TEXT[]
- company_sizes: TEXT[]
- salary_min: INTEGER
- salary_max: INTEGER
- keywords: TEXT[]
- email_alerts_enabled: BOOLEAN
- alert_frequency: TEXT (daily/weekly/instant)
- last_alert_sent_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `email_alerts_log`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- jobs_sent: INTEGER
- sent_at: TIMESTAMPTZ
- status: TEXT (sent/failed/bounced)
```

### Enhanced Columns in `jobs` Table
- `salary_period`: TEXT (yearly, monthly, hourly, project)
- `remote_type`: TEXT (fully-remote, hybrid, on-site, timezone-specific)
- `company_size`: TEXT (startup, small, medium, large, enterprise)

## Setup Instructions

### 1. Run Database Migration
Execute the migration file to create new tables and columns:
```bash
# Apply migration via Supabase CLI or dashboard
supabase db push
# Or run the SQL file directly:
# /supabase/004_phase2_features.sql
```

### 2. Enable Authentication in Supabase
1. Go to Supabase Dashboard > Authentication
2. Enable Email provider
3. (Optional) Enable OAuth providers (Google, GitHub)
4. Configure email templates

### 3. Configure Environment
Ensure Supabase credentials are set in your environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Install Dependencies
All required dependencies should already be installed. If needed:
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## Usage Guide

### For Users

#### Saving Jobs
1. Browse jobs at `/jobs`
2. Click the heart icon on any job card
3. If not signed in, you'll be prompted to create an account
4. View saved jobs at `/saved`

#### Advanced Filters
1. On the Jobs page, click "Advanced Filters"
2. Adjust salary range slider
3. Select desired categories, remote types, and company sizes
4. Filters apply automatically
5. Clear individual sections or all filters with buttons

#### Email Alerts (Placeholder)
1. Sign in to your account
2. Access email preferences (component available, needs page integration)
3. Enable email alerts
4. Choose frequency (instant, daily, weekly)
5. Configure job preferences (categories, types, salary range, etc.)

### For Developers

#### Adding a Save Button Elsewhere
```typescript
import { useSavedJobs } from '@/hooks/useSavedJobs'

const { isJobSaved, toggleSaveJob, isSaving } = useSavedJobs()
const saved = isJobSaved(jobId)

<Button onClick={() => toggleSaveJob(jobId)} disabled={isSaving}>
  {saved ? 'Saved' : 'Save'}
</Button>
```

#### Using Auth Context
```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user, signIn, signOut } = useAuth()

if (user) {
  // User is authenticated
}
```

#### Customizing Filters
Update the constants in `AdvancedFilters.tsx`:
- `CATEGORIES`
- `REMOTE_TYPES`
- `COMPANY_SIZES`

## Future Enhancements

### High Priority
1. **Email Infrastructure**: Implement Supabase Edge Functions or integrate with SendGrid/Resend for actual email sending
2. **User Settings Page**: Dedicated page for email preferences and account settings
3. **Saved Search Alerts**: Allow users to save search queries and get alerts for matching jobs

### Medium Priority
1. **Job Application Tracking**: Track which jobs users have applied to
2. **Resume Upload**: Store user resumes for quick applications
3. **Job Recommendations**: ML-based job recommendations based on saved jobs and preferences
4. **Social Sharing**: Share jobs on social media

### Low Priority
1. **Browser Notifications**: Push notifications for new jobs
2. **Mobile App**: React Native app with all features
3. **Dark Mode**: Theme toggle (partially supported via shadcn/ui)

## Technical Architecture

### State Management
- React Query for server state (jobs, saved jobs, preferences)
- React Context for auth state
- Local component state for UI interactions

### Data Fetching
- Direct Supabase client queries
- React Query for caching and automatic refetching
- Optimistic updates for better UX

### Authentication Flow
1. User attempts protected action (e.g., save job)
2. If not authenticated, AuthDialog appears
3. User signs in/up
4. Action completes automatically
5. Auth state syncs across app

### Security
- Row Level Security (RLS) enabled on all user tables
- Users can only access their own data
- Supabase Auth handles session management
- Passwords never stored in app (handled by Supabase)

## Testing Checklist

- [ ] Save a job while signed out (should prompt auth)
- [ ] Save a job while signed in
- [ ] Unsave a job
- [ ] View saved jobs page
- [ ] Use advanced filters (all types)
- [ ] Clear advanced filters
- [ ] Mobile responsive design
- [ ] Salary display with period
- [ ] New badge appears on recent jobs
- [ ] Email preferences save correctly

## Performance Considerations

- Advanced filters use indexed database columns
- React Query caches job data (5 min stale time)
- Optimistic updates for save/unsave actions
- Lazy loading for saved jobs list
- Pagination maintained (20 jobs per page)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (responsive design)

## Known Issues

None currently identified. Please report issues on GitHub.

## Credits

Built with:
- React 18
- TypeScript
- Vite
- Supabase
- shadcn/ui
- Tailwind CSS
- React Query
