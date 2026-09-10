# LUMEN — Data Room (Pricing & Go-to-Market case)

You are the analyst LUMEN's Head of Growth just handed this to. Below is every
file you have — read this once before you start prompting, it'll save you time.

## The one constraint that matters most

**There is no German sales data anywhere in this data room, because LUMEN has
never sold in Germany.** Every historical sales number comes from LUMEN's
existing markets (Netherlands, Denmark, Sweden). That's not an omission — it's
the actual situation. Part of your job is deciding how to responsibly estimate
Germany from what you *do* have (comparable markets, German market context,
survey data collected in Germany, competitor benchmarks) rather than looking
for a number that isn't there.

## Files (referenced as Exhibits in the brief)

| Exhibit | File | What it is |
|---|---|---|
| 1 | `market_context.csv` | Germany functional-beverage market size by sub-category (2022-2027) and by region/city — use this to size the opportunity and think about where to launch first. |
| 2 | `competitor_prices_by_channel.csv` | Current prices of LUMEN's 4 real-world-benchmarked competitors, by channel and pack format. |
| 3 | `competitor_price_history.csv` | 12 months of competitor price/promo activity — useful if you want to look at pricing dynamics over time, not just a snapshot. |
| 4 | `customer_survey.csv` | ~420 synthetic German respondents: segment, demographics, spend, channel preference, brand awareness, purchase intent. |
| 5 | `customer_quotes.csv` | A handful of qualitative verbatims by segment. Worth reading closely — not everything here agrees with the quantitative survey. |
| 6 | `historical_sales_weekly.csv` | 78 weeks of actual LUMEN sales by country and channel (NL/DK/SE only — see the constraint above). |
| 7 | `marketing_funnel_monthly.csv` | 18 months of marketing performance by channel: reach, engagement, conversions, spend, CAC, estimated LTV. |
| 8 | `cost_breakdown.csv` | LUMEN's per-unit cost structure, plus its current blended gross margin in home markets (computed, not assumed). |
| 9 | `channel_economics.csv` | What LUMEN actually nets per unit after retailer margin / distributor cut / payment processing, by channel — this is what turns a *retail* price into *LUMEN's* margin. |
| 10 | `price_sensitivity_survey.csv` | ~300 respondents, Van Westendorp-style (4 price thresholds each) — the raw material behind any elasticity estimate you build. |
| 11 | `price_test_results.csv` | 3 candidate launch prices (EUR1.79 / EUR2.19 / EUR2.59) x channel, with estimated acceptance and contribution margin. Deliberately **not blended into one recommended price** — the channel mix for Germany is exactly the kind of call you're being asked to help make. |
| 12 | `seasonality_and_weather.csv` | Monthly demand seasonality index + average German temperature — relevant if you're thinking about launch timing. |

## Worth knowing before you build

- **The numbers are internally consistent by construction** (segment shares,
  CAC, margins and elasticity all come from the same underlying model) — you
  can trust that combining files won't produce nonsense, but you still have to
  do the combining and the judgment calls yourself.
- **This dataset is not perfectly clean.** A few real-world imperfections are
  in there on purpose (duplicate rows, an unusual spike week). A good analyst
  notices and handles data-quality issues rather than taking every row at face
  value — treat that the same way you would with a real company export.
- **The 5 possible deliverables in the brief are a starting menu, not a
  checklist.** Several teams working from the exact same files can end up with
  genuinely different, equally valid tools depending on which questions you
  decide matter most.
- **Optional stretch**: if you want to go further, nothing stops you from
  pulling in a real, live public data source (e.g. current German weather via
  a public API) and correlating it with the seasonality data here. Not
  required, but it's there if your team wants to push further.
- **Some files contain name/email-style fields** (`customer_survey.csv`). Take
  a moment as a team to decide how you'll handle that in your build and your
  repo — it's worth a line in `prompts/<student-id>/session-*.md`.
