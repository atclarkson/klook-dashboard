# Changelog

All notable changes to this project should go here.

## Release Rules

- bump `major` for breaking changes
- bump `minor` for new features that keep existing data and flows compatible
- bump `patch` for fixes, styling, wording, and safe internal cleanup
- bump `DATA_SCHEMA_VERSION` in `app.js` only when stored local data is no longer compatible

When releasing:

1. update `APP_VERSION` in [app.js](/Users/adamclarkson/dev/klook-dashboard/app.js)
2. update this changelog
3. bump `DATA_SCHEMA_VERSION` only if re-import or storage invalidation is required

## Unreleased

- added an `Open Activity` button to the booking modal header that links to the live Klook activity page when an `Activity ID` is available
- made linked activity names in `Top Activities` open directly on Klook without a separate external-link button
- added an `Import Log` table to the `Import` tab showing file name, report type, report date range, rows added, and rows skipped for each saved import
- made import-log report ranges prefer the date span encoded in Klook export filenames such as `2026-04-27_2026-05-01_ticket_report.csv`
- fixed billing-report dedupe so filenames are no longer part of the billing row identity, and automatically normalize previously saved billing rows to remove filename-based duplicates
- fixed the `Overview` 30-day daily report to net refunds into daily commission and added a `Sales After Refund` column
- removed the `Sales After Refund` column from the `Overview` 30-day daily report to keep that table focused on net commission and bookings only

## v2.1.2

- added country-flag emoji to the `Users by Country` and `Country Ranking` tables when ISO country codes are available
- extended country-flag emoji to the `Top User Country` KPI for consistency
- split destinations into derived `Country` and `Region` parts and added a `Top Destination Countries` table in the bookings analytics area
- wrapped KPI cards, trend, top tables, and category views into a dedicated bookings analytics section
- made top activities, destinations, destination countries, and category views follow the active KPI metric selection
- removed the separate commission/bookings selector from the activity category chart so it follows the main KPI selection
- added a click-through booking detail modal on the `Payouts` page with booking summary, transaction rows, billing rows, metadata, and raw row data
- loosened the booking detail modal layout and added color-coded payout-status badges for unpaid, paid, adjusted, refunded, and deduction states
- reworked booking-detail metadata into roomier cards so dense field blocks are easier to scan
- added an `Overview` bookings-by-day table with quick filters for the latest three calendar days, a custom day picker, and click-through booking status drilldowns
- aligned the `Overview` custom day picker styling with the main dashboard date inputs
- redesigned the booking detail modal with clearer grouped sections and added missing booking details such as participants, commission rate, and richer transaction history columns
- replaced the booking-detail modal’s summary cards with denser key/value tables for easier scanning of booking and payout data

## v2.1.1

- added import-tab guidance for transaction exports, overlap-safe reimports, and required monthly billing-report imports for payout tracking
- added sortable columns to the `Unpaid Bookings` table in the `Payouts` tab
- added `Participation Date` to the `Unpaid Bookings` table and widened the dashboard layout for more working space
- updated compact table date formatting to include a two-digit year for clarity
- refined compact date formatting to `Apr 28 '26` and widened unpaid-table date columns to prevent wrapping
- changed compact table dates to the `23Apr2026` format

## v2.1.0

- started billing report support with CSV type detection, billing-row import, and IndexedDB storage
- added booking-to-billing matching with payout status derivation using ticket, order, and booking identifiers
- added a tabbed `Payouts` view with payout summary cards, unpaid-bookings aging filter, and unpaid bookings table
- added a `Bookings / Commission` toggle to the `Payouts` summary so paid and outstanding amounts can be viewed in either metric
- fixed payout matching to use booking-level net commission and conservative billing joins, avoiding `Order ID` overmatching and inflated paid-out totals
- reorganized navigation into `Import`, `Overview`, `Bookings`, and `Payouts` tabs
- moved import/upload tools into the new `Import` tab and shifted the analytics dashboard into `Bookings`
- expanded `Overview` to show the last 30 active days and a scrollable 12-month monthly summary

## v2.0.1

- added a `Top Activity Categories` section with a doughnut chart, breakdown table, and commission/bookings toggle
- made the refund impact table scrollable with a sticky header
- refined dashboard layout styling, including the top import area and category table alignment

## v2.0.0

Breaking release.

- added demographics and acquisition reporting
- expanded imported CSV field coverage
- added schema compatibility checks for stored data
- added country-origin map with commission/bookings toggle
- added About modal with privacy, disclaimer, and network-request details
- rewrote README and added explicit license file

### Breaking Changes

- older locally stored dashboard data is not compatible with this release
- users may need to clear saved browser data and re-import their CSV history
