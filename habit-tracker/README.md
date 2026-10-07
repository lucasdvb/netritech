# Lucas · Life OS habit tracker (Google Sheets)

A personal operating system styled on the Quiet Progress habit and task trackers: dark navy panels, colour-coded weeks, check grids, analysis bars, area, line and donut charts. It's rebuilt around the Life OS spec: 8 pillars, 3 priority levels, a Foundation Score, rolling 7/30-day consistency, Minimum Viable Day and sick-day modes, adaptive steps, a 7-day weight average and rule-based coaching.

| File | What it is |
|---|---|
| `Lucas-Life-OS.xlsx` | The tracker. Upload it to Google Drive and save it as a Google Sheet. |
| `life_os_setup.gs` | Apps Script you run once inside the Google Sheet. It adds real checkboxes, sets the Montserrat font, applies the dark theme to the charts, hides the engine tabs and adds a **Life OS** menu. |
| `build_life_os.py` | Generator for both files. Edit habits, targets or colours here and rebuild. |
| `previews/` | Pages from a copy filled with sample data, rendered in LibreOffice. |

## Setup (5 minutes)

1. Google Drive → **New → File upload** → `Lucas-Life-OS.xlsx`. Open it, then **File → Save as Google Sheets**.
2. In the new Google Sheet: **Extensions → Apps Script**. Replace the code with the contents of `life_os_setup.gs`, save, choose `finishSetup` and press **Run**. Allow access when asked.
3. Reload the sheet. Use **Life OS → Go to today**.

If you skip the script, the tracker still works: type `x` in a cell instead of ticking it.

## Tabs

- **Dashboard**: TODAY (body, mind, spirit, life, recovery), Smart Coach, System Check, THIS WEEK, THIS MONTH, the 8 pillars and four charts. Type any date in the yellow cell to look back; put `=TODAY()` back for live.
- **Week Plan**: the task-tracker layout. Seven day panels with the training plan, a donut for each day's score, Top 3 and tasks with checkboxes, and check-ins pulled from the daily log.
- **Oct 2026 … Sep 2027**: one tab per month. You log everything here: the habit grid (Level 1 / 2 / 3), the day mode (`M` minimum viable day, `S` sick, `R` rest), body and mind numbers, scores, analysis bars and charts.
- **Body**: profile, goal-weight estimate, measurements every 2 weeks, monthly photos, weight and waist trends.
- **Weekly Review** and **Monthly Review**: the left side fills itself from the log; you write wins, problems, one change, and stop / start / continue.
- **Habit Library**: every habit with level, pillar, target, what counts, the Minimum Viable Day flag and 7/30-day scores.
- **Plan & Routines**: the playbook. Routines, the training split with dumbbell and bodyweight sessions, progressive overload, the 20-minute minimum workout, nutrition and Mauritius-friendly food, faith, relationships, eyes and jaw, MVD, sick days, and what was deliberately left out.
- **Settings**: every target and threshold (protein, water, sleep, step ramp, weight-loss pace, score bands).
- **Calc** and **Data**: the engine. The setup script hides them.

## How the scoring works

- **Foundation score** (per day): sleep, movement, protein ≥ 135 g, water ≥ 2.5 L, steps target, prayer, Top 3 (work days only), time with your fiancée, read/learn. `M` days are scored on the 7 Minimum Viable Day items. `S` days are paused.
- **Rolling 7-day and 30-day** averages replace streaks. Bands: Green ≥ 85 %, Good 70–84 %, Needs attention 50–69 %, Reset < 50 %.
- Level 2 habits are scored against weekly targets (strength 4×, core 3×, church 1×…). Level 3 never counts against you.
- **Smart Coach** runs the adaptive rules: low sleep → recovery day, protein under 120 g → high-protein dinner, under 5,000 steps after 18:00 → walk, missed session → 20-minute minimum (don't reshuffle the week), weight average flat for 14 days → small calorie or step change, losing > 1 %/week twice → eat more, strength stalling, low recovery score, too much cardio, low energy, and 3+ non-negotiables slipping → **simplify this week**.
- **System Check** tells apart "one off day", "missed a few habits" and "the system is too complicated". It never says "failed".

## Rebuild

```bash
python3 build_life_os.py          # Lucas-Life-OS.xlsx + life_os_setup.gs
python3 build_life_os.py --demo --out sample.xlsx   # sample data, fixed date, for previews
```

The workbook covers October 2026 to September 2027 and starts scoring on 7 Oct 2026 (Settings → Tracking start date).

Note on the previews: LibreOffice draws missing chart values as zero, so lines drop at the edges. Google Sheets leaves those days as gaps.
