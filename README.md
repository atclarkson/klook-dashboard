# Klook Commission Dashboard

An unofficial local dashboard for exploring Klook affiliate CSV exports.

This project was made by affiliates who were tired of the Klook Kreator dashboard and wanted something clearer for commission, refunds, destinations, audience origin, and promo-code performance.

## What This Is

This dashboard:

- imports Klook ticket report CSV files
- stores the data locally in your browser
- shows commission trends, KPI cards, refunds, destinations, demographics, promo-code usage, and country-level audience views
- runs as a static frontend with no project backend

## What This Is Not

This project is not:

- an official Klook product
- affiliated with Klook
- endorsed by Klook
- supported by Klook
- accounting, tax, or legal software
- guaranteed to be accurate

Use it at your own risk and cross-check important figures against Klook’s own reporting.

## Privacy

Your imported CSVs and derived dashboard data stay on your computer.

The app stores data locally in your browser using IndexedDB. It does not contain an app backend and it does not intentionally upload your imported CSV contents or saved dashboard data anywhere.

### Local Storage

Data is stored in:

- `IndexedDB` in your browser

This means:

- data persists between sessions
- data is tied to the browser profile you use
- clearing site data or browser storage can erase it

## Internet Requests

The dashboard currently loads a few JavaScript libraries from CDNs at page load:

- `https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js`
  Used to parse CSV files in the browser.
- `https://cdn.jsdelivr.net/npm/chart.js`
  Used to render charts.
- `https://cdn.plot.ly/plotly-2.35.2.min.js`
  Used to render the country map.

These network requests download library files only. The dashboard code does not send your imported report data to those CDNs.

If you want to remove third-party runtime requests entirely, these libraries can be vendored locally and loaded from the repo instead.

## Features

- drag-and-drop CSV import
- duplicate detection
- net commission tracking
- bookings, refunds, and average commission KPIs
- daily, weekly, and monthly trend views
- previous-period comparisons
- top activities and destinations
- refund impact analysis
- monthly summary cards
- demographics and acquisition section
- promo-code and tracking-base breakdowns
- country-origin map
- local JSON backup and restore

## How To Use

### 1. Export Data From Klook

From the Klook Kreator reporting area, export the ticket report CSV for the date range you want.

If you want full history, export multiple date ranges and import them one by one.

### 2. Open The Dashboard

You can either:

- open `index.html` directly in a browser
- or serve the folder locally, for example:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

### 3. Import CSV Files

Drop CSV files onto the dashboard or click the upload area.

The app will:

- parse the file in-browser
- skip duplicate rows
- store the imported transactions locally

### 4. Re-Import After Breaking Schema Changes

This project now includes schema checks for stored data.

If you have older saved data from a previous version and the app says re-import is required:

1. export a backup if you want a copy
2. clear saved data
3. re-import your CSV exports

Older stored data may not contain newer fields needed for features like demographics.

## Data Notes

The dashboard is only as good as the CSV fields Klook provides.

Examples of fields currently used include:

- action and action date
- commission amount
- destination
- platform
- user country
- tracking base
- promo code type
- Kreator promo code
- activity and package details

Some things people might expect, like exact user city or detailed language data, may not exist in the CSV.

## Project Structure

- [index.html](/Users/adamclarkson/dev/klook-dashboard/index.html)
  App structure and sections
- [styles.css](/Users/adamclarkson/dev/klook-dashboard/styles.css)
  UI styling
- [app.js](/Users/adamclarkson/dev/klook-dashboard/app.js)
  Import logic, storage, calculations, and rendering

## Known Limitations

- depends on Klook CSV structure staying consistent
- browser local storage can be cleared or lost
- numbers may differ from other dashboards depending on filters and refunds
- map coverage depends on clean country codes in the source CSV
- CDN-hosted libraries mean first-load network access is currently required unless vendored locally

## License

This project is licensed under `CC BY-NC 4.0`.

That means, in short:

- you can use it
- you can modify it
- you can share it
- you cannot use it commercially

Creative Commons non-commercial licenses still require attribution. See [LICENSE.md](/Users/adamclarkson/dev/klook-dashboard/LICENSE.md).

## Disclaimer

This project is provided as-is, without warranty of any kind. The authors are not responsible for errors, losses, or decisions made from this dashboard’s output.
