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
