# TODO - Dark Theme, Blocked Dates, and Card Centering

## Tasks:
1. [x] Plan created
2. [x] Enable dark theme by adding 'dark' class to root element
3. [x] Create blocked_dates database table migration
4. [x] Update Dashboard with blocked dates management calendar
5. [x] Update DatePicker to show and block dates
6. [x] Update BookingFlow to fetch blocked dates
7. [x] Center "fade sisanje + brada" (Fade Haircut + Beard Styling) service card
8. [x] Center barber cards grid

## Files Modified:
- src/main.tsx - Added dark class to enable dark theme
- supabase/migrations/20260216000000_blocked_dates.sql - Created blocked_dates table
- src/types/database.ts - Added BlockedDate type
- src/integrations/supabase/types.ts - Added blocked_dates to Database types
- src/components/DatePicker.tsx - Added blocked dates support
- src/components/BookingFlow.tsx - Added blocked dates fetching
- src/pages/Dashboard.tsx - Added blocked dates management for admin
- src/components/ServicesSection.tsx - Centered service cards
- src/components/BarbersSection.tsx - Centered barber cards
- src/components/dashboard/AddAppointmentDialog.tsx - Added blocked dates support

