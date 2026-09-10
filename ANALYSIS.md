# LUMEN Germany — Analysis Note (team thesis)

*Commit this file as `docs/ANALYSIS.md`. It is the context Codex reads before building anything. Every number below was computed from the files in `data/` (deduplicated) and is reproduced in `docs/LUMEN_Germany_Pricing_Model.xlsx`.*

## The question (from the brief)

At what price, through which channel(s), and roughly when should LUMEN launch in Germany — and what are we deliberately choosing not to optimise for?

## The finding that reframes the case

The brief's headline — "acceptance nearly halves at €2.59 (26.7%)" — is a **blended average across four segments with opposite behaviour**. Recomputed from `price_sensitivity_survey.csv` (Van Westendorp, 300 respondents):

| Segment | Survey share | Accepts €1.79 | Accepts €2.19 | Accepts €2.59 | Preferred channel |
|---|---|---|---|---|---|
| Urban Wellness Professionals | 27% | 100% | 100% | 100% | DTC Online 54% |
| Fitness & Gym-Goers | 20% | 100% | 100% | 100% | Gym & Office 45% |
| On-the-go Commuters | 21% | 100% | 100% | 72% | Retail 60% |
| Students & Budget-Conscious | 32% | 98% | 53% | 3% | Retail 54% |

("Accepts" = price is below the respondent's "too expensive" threshold. A stricter "comfort" definition — price below the "expensive" threshold — gives 99% / 91% for Wellness / Gym at €2.19 and reproduces the brief's blended 52%.)

The drop at higher prices is almost entirely students. The two segments that accept a premium price shop in the two channels where LUMEN keeps the most per can. **The price/channel trade-off is really a segment choice.**

## Channel economics (from `channel_economics.csv`, verified against `price_test_results.csv` to the cent)

Net to LUMEN = price × (1 − retailer margin − distributor cut − payment %) − fulfilment. COGS = €0.62/can.

| Price | DTC net / contribution | Gym & Office net / contribution | Retail net / contribution |
|---|---|---|---|
| €1.79 | €1.39 / €0.77 | €1.43 / €0.81 | €1.02 / €0.40 |
| €2.19 | €1.78 / €1.16 | €1.75 / €1.13 | €1.25 / €0.63 |
| €2.59 | €2.16 / €1.54 | €2.07 / €1.45 | €1.48 / €0.86 |

Retail takes 35% (retailer) + 8% (distributor). It is not the "safe" channel; it is the one where the price is shared with two intermediaries.

## CAC payback (blended CAC €44, from `marketing_funnel_monthly.csv`)

Months to recover CAC = (€44 ÷ contribution per can) ÷ purchases per month of the segment that actually shops there (Wellness 7.6/month, Gym-goers 6.2, Students 5.1):

| Price | DTC (Wellness) | Gym & Office (Gym-goers) | Retail (Students) |
|---|---|---|---|
| €1.79 | 7.6 | 8.7 | **21.6** |
| €2.19 | 5.0 | 6.2 | 13.7 |
| €2.59 | 3.8 | 4.9 | 10.1 |

The CFO's "not eighteen months" ceiling is breached by exactly one combination: the obvious one, Retail at €1.79.

## The two options

**Option A — Premium first.** €2.19, DTC Online + Gym & Office, Berlin + Munich (33% of market, 9% CAGR vs 7%, Wellness concentration), launch April–May. Retail in year 2 from a position of strength.
- Weighted contribution €1.15/can · blended payback ~6 months
- Reaches 54% of survey respondents; 47% reach AND accept the price
- Gives up: 50% of home-market volume (retail), the student segment, fast scale

**Option B — Volume first.** €1.79, Retail + DTC nationwide, spring.
- Weighted contribution €0.54/can · blended payback ~13 months
- Reaches 75% of respondents; 74% reach AND accept
- Gives up: €0.60/can of margin, the premium positioning (anchored next to PulsUp promos, moving up later is very hard), and the CFO's comfort on retail-only payback

Year-1 units (Berlin + Munich, per-capita transfer from NL/DK/SE with a 0.8 comparability haircut and 0.6 ramp): A ≈ 26k cans, B ≈ 49k cans. Contribution after COGS: A ≈ €30k, B ≈ €27k — **A earns more on half the volume.** Both lose money in year 1 against a ~€98k pro-rata marketing budget; the launch year is an investment either way. All assumptions are visible and editable in the model.

## Timing

German seasonality index (`seasonality_and_weather.csv`) and LUMEN's own home-market monthly pattern correlate at 0.99 — the one transfer assumption in this case that IS supported by data. Index rises from 98 (April) to 138 (July). Competitor promos cluster in February and June–July. Launch in April–May so distribution is in place before peak demand and outside both promo clusters.

## Where the quotes and the survey disagree (qual/quant reconciler)

- Students: quotes say "€2.50 is a hard no" → survey says 3% accept €2.59. **Agree.**
- Gym-goers: quote says "I'm not going to overpay just for a nicer can" → survey says 100% accept €2.59 as not-too-expensive, but only 32% find it comfortable. **Tension: they tolerate the price, they don't like it. Supports €2.19 over €2.59.**
- Wellness: "I don't mind paying more for clean ingredients" → 100% / 76% at €2.59. **Agree.** But: "too many wellness brands taste like medicine, that's the real risk, not the price." **The risk to the premium thesis is product, not price.**
- Commuters: "if it's not at the kiosk near the station I'll never try it" → 60% prefer retail. **Agree — and it is exactly why they are phase 2, not phase 1.**

## Data-quality issues found

1. `historical_sales_weekly.csv`: 4 exact duplicate rows (NL 2025-07-14, DK 2025-09-22, DK 2025-12-22, NL 2026-04-27). Removed.
2. The announced "spike week" is not clearly present: peaks are all summer and consistent with seasonality. Stated, not invented.
3. Brief says €3.2M trailing revenue; data sums to €1.62M over 78 weeks (€1.08M annualised). Flagged as an inconsistency; model uses the data.
4. `customer_survey.csv` contains name/email columns. Never used, never exposed.
5. Funnel LTV:CAC by channel is 2.7–2.9x, below the 3:1 the brief calls the plan assumption.

## Recommendation the tool should let Freya reach herself

Start from the customer, not the price. Pick a segment → the tool shows the price it accepts, the channel it shops in, the margin LUMEN keeps, the payback, and what you give up. Then compare A vs B side by side with the assumptions exposed.
