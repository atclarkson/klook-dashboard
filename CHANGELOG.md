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

- no unreleased changes yet

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
