import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'public', 'data.json'), 'utf8'));

test('removes exactly four duplicate sales rows and matches the case revenue', () => {
  assert.equal(data.home_market.duplicate_rows_removed, 4);
  const revenue = data.home_market.units_and_revenue_by_country.reduce((sum, item) => sum + item.revenue_eur, 0);
  assert.equal(revenue, 1619925.81);
});

test('reproduces the hard acceptance pattern in the analysis note', () => {
  const student = data.price_sensitivity.by_segment.find((item) => item.segment === 'Students & Budget-Conscious');
  const commuter = data.price_sensitivity.by_segment.find((item) => item.segment === 'On-the-go Commuters');
  assert.equal(student.prices.find((item) => item.price_eur === 2.59).hard_acceptance, 0.03);
  assert.equal(commuter.prices.find((item) => item.price_eur === 2.59).hard_acceptance, 0.719);
});

test('derives the €2.19 channel contribution and representative payback figures', () => {
  const dtc = data.channel_economics.channels.find((item) => item.channel === 'DTC Online');
  const retail = data.channel_economics.channels.find((item) => item.channel === 'Retail/Grocery');
  assert.equal(dtc.prices.find((item) => item.price_eur === 2.19).unit_contribution_eur, 1.16);
  assert.equal(retail.prices.find((item) => item.price_eur === 1.79).unit_contribution_eur, 0.4);
  const students = retail.prices.find((item) => item.price_eur === 1.79).payback_months_by_segment
    .find((item) => item.segment === 'Students & Budget-Conscious');
  assert.equal(students.payback_months, 21.56);
});

test('contains no personal fields or respondent-level customer data', () => {
  const serialized = JSON.stringify(data).toLowerCase();
  for (const field of ['\"first_name\"', '\"last_name\"', 'ida.schwarz1@example.com']) assert.equal(serialized.includes(field), false);
  assert.equal('respondents' in data.customer, false);
});
