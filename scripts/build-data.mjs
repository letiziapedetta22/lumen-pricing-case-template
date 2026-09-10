// public/data.json is derived from public case data and contains no personal fields.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const outputFile = path.join(root, 'public', 'data.json');
const prices = [1.79, 2.19, 2.59];
const customerColumns = [
  'segment', 'city', 'purchase_frequency_per_month', 'monthly_beverage_spend_eur',
  'price_sensitivity_1_10', 'preferred_channel', 'aware_pulsup', 'aware_matelibre',
  'aware_voltfit', 'aware_rootandrise', 'lumen_purchase_intent_1_10',
];

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const share = (numerator, denominator) => round(numerator / denominator, 3);
const mean = (rows, field) => rows.reduce((sum, row) => sum + Number(row[field]), 0) / rows.length;

function parseLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      fields.push(value); value = '';
    } else value += character;
  }
  fields.push(value);
  return fields;
}

// Scan every field for CSV boundaries, but retain values only for requested columns.
// This keeps customer names and email addresses out of memory and out of the output.
function parseProjectedLine(line, wantedIndexes) {
  const fields = new Map();
  let value = '';
  let quoted = false;
  let column = 0;
  const save = () => { if (wantedIndexes.has(column)) fields.set(column, value); value = ''; };
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        if (wantedIndexes.has(column)) value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      save(); column += 1;
    } else if (wantedIndexes.has(column)) value += character;
  }
  save();
  return fields;
}

async function csv(name, selectedColumns) {
  const lines = (await readFile(path.join(dataDir, name), 'utf8')).trim().split(/\r?\n/);
  const headers = parseLine(lines.shift());
  const selected = selectedColumns ?? headers;
  const indexes = selected.map((column) => {
    const index = headers.indexOf(column);
    if (index < 0) throw new Error(`${name} is missing ${column}`);
    return index;
  });
  // With a projection, only selected field values are retained; customer PII is never emitted.
  const isProjection = selectedColumns !== undefined;
  const wantedIndexes = new Set(indexes);
  return lines.map((line) => {
    const fields = isProjection ? parseProjectedLine(line, wantedIndexes) : parseLine(line);
    return Object.fromEntries(selected.map((column, index) => [column,
      isProjection ? fields.get(indexes[index]) : fields[indexes[index]],
    ]));
  });
}

function grouped(rows, field) {
  return Map.groupBy(rows, typeof field === 'function' ? field : (row) => row[field]);
}

function rawRecords(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (value === 'True' || value === 'False') return [key, value === 'True'];
    if (value !== '' && /^-?\d+(?:\.\d+)?$/.test(value)) return [key, Number(value)];
    return [key, value];
  })));
}

function aggregateCustomers(rows) {
  const bySegment = grouped(rows, 'segment');
  const byCity = grouped(rows, 'city');
  return {
    respondent_count: rows.length,
    segments: [...bySegment].map(([segment, respondents]) => {
      const channels = grouped(respondents, 'preferred_channel');
      return {
        segment,
        respondent_share: share(respondents.length, rows.length),
        mean_purchase_frequency_per_month: round(mean(respondents, 'purchase_frequency_per_month')),
        mean_monthly_beverage_spend_eur: round(mean(respondents, 'monthly_beverage_spend_eur')),
        mean_price_sensitivity_1_10: round(mean(respondents, 'price_sensitivity_1_10')),
        mean_lumen_purchase_intent_1_10: round(mean(respondents, 'lumen_purchase_intent_1_10')),
        preferred_channel_shares: Object.fromEntries([...channels].map(([channel, people]) => [channel, share(people.length, respondents.length)])),
      };
    }),
    cities: [...byCity].map(([city, respondents]) => ({
      city,
      respondent_share: share(respondents.length, rows.length),
      mean_lumen_purchase_intent_1_10: round(mean(respondents, 'lumen_purchase_intent_1_10')),
    })),
  };
}

function acceptance(rows) {
  const bySegment = grouped(rows, 'segment');
  const perSegment = [...bySegment].map(([segment, respondents]) => ({
    segment,
    survey_share: share(respondents.length, rows.length),
    prices: prices.map((price) => ({
      price_eur: price,
      hard_acceptance: share(respondents.filter((row) => Number(row.too_expensive_eur) > price).length, respondents.length),
      comfort_acceptance: share(respondents.filter((row) => Number(row.expensive_eur) > price).length, respondents.length),
    })),
  }));
  return {
    by_segment: perSegment,
    blended: prices.map((price) => ({
      price_eur: price,
      hard_acceptance: round(perSegment.reduce((sum, segment) => sum + segment.survey_share * segment.prices.find((item) => item.price_eur === price).hard_acceptance, 0), 3),
      comfort_acceptance: round(perSegment.reduce((sum, segment) => sum + segment.survey_share * segment.prices.find((item) => item.price_eur === price).comfort_acceptance, 0), 3),
    })),
  };
}

function channelEconomics(rows, cogs, customerSegments, blendedCac) {
  const channelInputs = new Map(rows.map((row) => [row.channel, row]));
  const channels = [...channelInputs].map(([channel, row]) => ({
    channel,
    retailer_margin_pct: Number(row.retailer_margin_pct),
    distributor_cut_pct: Number(row.distributor_cut_pct),
    payment_processing_pct: Number(row.payment_processing_pct),
    fulfillment_cost_eur: Number(row.fulfillment_cost_eur),
  }));
  return {
    blended_cac_eur: round(blendedCac),
    cogs_per_can_eur: round(cogs),
    channels: channels.map((channel) => ({
      ...channel,
      prices: prices.map((price) => {
        const net = price * (1 - channel.retailer_margin_pct - channel.distributor_cut_pct - channel.payment_processing_pct) - channel.fulfillment_cost_eur;
        const contribution = net - cogs;
        return {
          price_eur: price,
          net_price_to_lumen_eur: round(net),
          unit_contribution_eur: round(contribution),
          payback_months_by_segment: customerSegments.map((segment) => ({
            segment: segment.segment,
            payback_months: round((blendedCac / contribution) / segment.mean_purchase_frequency_per_month),
          })),
        };
      }),
    })),
  };
}

function salesFacts(rows) {
  const uniques = [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()];
  const summarize = (items, key) => [...grouped(items, key)].map(([name, values]) => ({
    [key]: name,
    units_sold: values.reduce((sum, row) => sum + Number(row.units_sold), 0),
    revenue_eur: round(values.reduce((sum, row) => sum + Number(row.revenue_eur), 0)),
  }));
  const totalUnits = uniques.reduce((sum, row) => sum + Number(row.units_sold), 0);
  const monthGroups = grouped(uniques, (row) => String(Number(row.week_start_date.slice(5, 7))));
  const overallMean = totalUnits / uniques.length;
  return {
    duplicate_rows_removed: rows.length - uniques.length,
    units_and_revenue_by_country: summarize(uniques, 'country'),
    units_and_revenue_by_channel: summarize(uniques, 'channel'),
    channel_unit_mix: summarize(uniques, 'channel').map((item) => ({ channel: item.channel, unit_share: share(item.units_sold, totalUnits) })),
    monthly_seasonality_index: [...monthGroups].map(([month, weeks]) => ({
      month: Number(month),
      mean_weekly_units: round(weeks.reduce((sum, row) => sum + Number(row.units_sold), 0) / weeks.length),
      index_100_avg: round((weeks.reduce((sum, row) => sum + Number(row.units_sold), 0) / weeks.length) / overallMean * 100),
    })).sort((a, b) => a.month - b.month),
  };
}

const passthroughFiles = [
  'market_context.csv', 'competitor_prices_by_channel.csv', 'competitor_price_history.csv',
  'seasonality_and_weather.csv', 'customer_quotes.csv', 'cost_breakdown.csv',
];

const [customers, priceSurvey, economicsRows, sales, funnel, ...passThroughRows] = await Promise.all([
  csv('customer_survey.csv', customerColumns), csv('price_sensitivity_survey.csv'),
  csv('channel_economics.csv'), csv('historical_sales_weekly.csv'), csv('marketing_funnel_monthly.csv'),
  ...passthroughFiles.map((file) => csv(file)),
]);
const customer = aggregateCustomers(customers);
const cogsRow = passThroughRows[5].find((row) => row.cost_component === 'TOTAL COGS per unit (330ml can)');
const blendedCac = funnel.reduce((sum, row) => sum + Number(row.spend_eur), 0) /
  funnel.reduce((sum, row) => sum + Number(row.conversions_customers_acquired), 0);

const output = {
  candidate_prices_eur: prices,
  customer,
  price_sensitivity: acceptance(priceSurvey),
  channel_economics: channelEconomics(economicsRows, Number(cogsRow.cost_per_unit_eur), customer.segments, blendedCac),
  home_market: salesFacts(sales),
  source_data: Object.fromEntries(passthroughFiles.map((file, index) => [file.replace('.csv', ''), rawRecords(passThroughRows[index])])),
  data_quality: [
    { file: 'historical_sales_weekly.csv', issue: '4 exact duplicate rows.', handling: 'Removed before all home-market aggregates.' },
    { file: 'historical_sales_weekly.csv', issue: 'The announced spike week is not clearly present; peaks are seasonal.', handling: 'Stated as inconclusive; no spike adjustment applied.' },
    { file: 'historical_sales_weekly.csv', issue: 'Brief says EUR3.2M trailing revenue; data totals EUR1.62M over 78 weeks.', handling: 'Flagged as inconsistent; aggregates use the data.' },
    { file: 'customer_survey.csv', issue: 'Contains first_name, last_name, and email columns.', handling: 'PII fields are excluded at ingestion and no respondent rows are emitted.' },
    { file: 'marketing_funnel_monthly.csv', issue: 'Channel LTV:CAC is 2.7–2.9x, below the brief’s 3:1 assumption.', handling: 'Flagged for decision context; blended CAC is used for payback.' },
  ],
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputFile)} (${sales.length - salesFacts(sales).duplicate_rows_removed} deduplicated sales rows).`);
