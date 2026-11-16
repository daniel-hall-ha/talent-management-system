# Event import ZIP format

The ZIP must contain `events.csv` at its top level and one self-contained HTML brief per event. A brief may use inline CSS, `<style>` blocks, and data-URI images. Scripts, remote assets, and external stylesheets do not run in the preview or event detail view. The original HTML is stored in `Event.details`.

## CSV columns

Required: `title`, `description`, `start_date`, `end_date`, `brief_file`.

Optional: `color` (defaults to `#6979d4`), `categories`, `talent_names`, `talent_emails`, `deliverables`, `submission_dates`, `key_points`, `cd_keys`.

- Dates use `YYYY-MM-DD`.
- `categories`, `talent_names`, `talent_emails`, and `key_points` use semicolon-separated values.
- Categories: `Livestream`, `Highlight`, `Short Video`, `Others`.
- `talent_names` contains semicolon-separated talent names. Use this when talents have no email. If omitted, `talent_emails` is used instead. Identifiers must match active users with an Exclusive Talents or Non-exclusive Talents role (existing Talents users remain supported).
- `deliverables` is a JSON object mapping talent name or email to a category array.
- `submission_dates` is a JSON object mapping talent name or email to a date within the event.
- `cd_keys` is an optional JSON object with `giveaway` (string array) and `talents` (talent-name-or-email-to-string-array object). Importing keys requires CD key edit permission.
- `brief_file` points to a `.html` file inside the ZIP, such as `briefs/launch.html`.

Example `events.csv`:

```csv
title,description,start_date,end_date,color,categories,talent_names,talent_emails,deliverables,submission_dates,key_points,brief_file
Launch stream,Stream the launch,2026-12-01,2026-12-03,#6979d4,Livestream;Highlight,Talent Name,,"{""talent@example.com"":[""Livestream"",""Highlight""]}","{""talent@example.com"":""2026-12-02""}",Introduce product;Show gameplay,briefs/launch.html
```

The preview validates all rows. Confirm creates the batch in one database transaction; if validation fails, nothing is saved. Limits: 25 MB ZIP, 500 events, 500 KB per brief, 20 MB combined brief HTML.
