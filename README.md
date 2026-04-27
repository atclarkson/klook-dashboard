# Klook Commission Dashboard

A lightweight, local-only dashboard for analyzing Klook affiliate commission data.

This tool helps you understand:

* How much commission you are actually earning (net, after refunds)
* What activities and destinations perform best
* Where refunds are hurting performance
* Daily, weekly, and monthly trends

No accounts, no servers, no uploads. Everything runs locally in your browser.

---

## What This Is

This is a simple HTML + JavaScript dashboard that:

* Parses Klook ticket report CSV files
* Stores data locally in your browser
* Builds charts, summaries, and tables
* Lets you explore your performance over time

It is designed for creators, affiliates, and anyone using Klook tracking.

---

## What This Is NOT

* Not an official Klook product
* Not affiliated with Klook in any way
* Not guaranteed to be accurate
* Not production-grade financial software

Use at your own risk.

---

## Privacy

This dashboard is:

* 100% local
* No backend
* No APIs
* No tracking
* No data sent anywhere

Your data:

* Never leaves your computer
* Is stored only in your browser (IndexedDB)
* Can be cleared at any time

---

## How to Use (Step-by-Step)

### 1. Download the dashboard

Click the green **Code** button on GitHub, then:

```text
Download ZIP
```

Unzip it somewhere on your computer.

---

### 2. Open the dashboard

Double-click:

```text
index.html
```

OR (recommended for best stability):

Open a terminal in the folder and run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

---

### 3. Export your data from Klook

Go to:

```text
Klook → Performance → Ticket Report
```

Then:

1. Select a date range (max 6 months)
2. Click **Export**
3. Download the CSV

Repeat this if needed (for multiple 6-month ranges)

---

### 4. Load your data

Drag and drop the CSV file onto the dashboard.

You can:

* Upload multiple files
* Re-upload the same file safely (duplicates are skipped)
* Build a full historical dataset over time

---

## Features

* Drag-and-drop CSV import
* Duplicate detection
* Net commission calculation (includes refunds and amendments)
* Daily, weekly, monthly trends
* Date filters and custom ranges
* Refund impact analysis
* Top activities and destinations
* Monthly summary cards
* Backup / restore system (JSON export/import)

---

## Data Storage

Data is stored using:

```text
IndexedDB (your browser)
```

This means:

* Data persists between sessions
* It is tied to your browser + file location
* Clearing browser data will erase it

---

## Known Limitations

* Early beta
* Some edge cases may not be handled correctly
* CSV format changes from Klook may break parsing
* Timezone/date inconsistencies may exist
* Refund handling depends on Klook data accuracy

Always cross-check with Klook reports if numbers matter.

---

## Future Plans / Roadmap

* Monthly billing report support (final payout vs estimated)
* Searchable transaction table
* Better refund analytics (per destination, per activity)
* Trend comparisons (month-over-month)
* Dynamic month filters (select March, April, etc.)
* Improved UI polish
* Export to CSV / PDF
* Mobile layout improvements

---

## License

Planned license:

```text
Creative Commons Attribution-ShareAlike (CC BY-SA)
```

You are free to:

* Use
* Modify
* Share

As long as you:

* Credit the original work
* Share improvements under the same license

---

## Disclaimer

This project is:

* Not affiliated with Klook
* Not endorsed by Klook
* Not guaranteed to be accurate

All data interpretation is your responsibility.

---

## Final Note

This was built to scratch a very specific itch:

> “What am I actually making after refunds, and what’s working?”

If it helps you, great. If not, fork it and make it better.
