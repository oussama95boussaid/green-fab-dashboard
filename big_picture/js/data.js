// Single source of truth for the Big Picture content.
// Sources: WP2 Activity 1 "Big Picture" deck, WP1 raw KPI catalogue (2,710 KPIs), Greater Region benchmark.

export const PILLARS = [
  {
    id: 'environmental', name: 'Environmental', short: 'Env.', color: '#2e9d66', count: 1092, score: 72,
    tagline: 'Reduce the ecological footprint of industrial production.',
    subs: [
      { name: 'Energy & climate', kpis: ['Total consumption (kWh)', 'Renewable mix (%)', 'GHG emissions (tCO₂e)'] },
      { name: 'Water & effluents', kpis: ['Water consumption (m³)', 'Water per unit produced', 'Treated discharges (%)'] },
      { name: 'Materials & waste', kpis: ['Recycled materials (%)', 'Waste produced (kg)', 'Recovery rate'] },
      { name: 'Biodiversity & soils', kpis: ['Sealed surface area', 'Soil pollution', 'Biodiversity impact score'] },
    ],
    refs: ['ESRS E1–E5', 'ISO 14001', 'ISO 50001', 'EU Taxonomy'],
  },
  {
    id: 'social', name: 'Social', short: 'Social', color: '#d9774f', count: 627, score: 68,
    tagline: 'Ensure decent working conditions and human engagement.',
    subs: [
      { name: 'Health & safety', kpis: ['Accident rate', 'Lost days / year', 'OHS coverage (%)'] },
      { name: 'Conditions & pay', kpis: ['Gender pay gap', 'Hours worked / week', 'Decent conditions (%)'] },
      { name: 'Training & development', kpis: ['Training hours / year', '% employees trained', 'Internal mobility'] },
      { name: 'Engagement & relations', kpis: ['Turnover rate', 'Employee satisfaction (%)', 'Customer satisfaction (NPS)'] },
    ],
    refs: ['ESRS S1–S4', 'GRI 400', 'SDG 8'],
  },
  {
    id: 'economic', name: 'Economic', short: 'Eco.', color: '#c9a03a', count: 417, score: 75,
    tagline: 'Keep the sustainable transition economically viable.',
    subs: [
      { name: 'Profitability & growth', kpis: ['Net margin (%)', 'Revenue / unit produced', 'Total revenue'] },
      { name: 'Operating costs', kpis: ['Energy cost', 'Material cost (% revenue)', 'Labour cost (% revenue)'] },
      { name: 'Innovation', kpis: ['R&D / revenue (%)', 'New products / year', 'Sustainable investments'] },
      { name: 'Operational performance', kpis: ['On-time deliveries (%)', 'Product quality (%)', 'Sustainability ROI'] },
    ],
    refs: ['EU Taxonomy', 'Financial reporting', 'SDG 9'],
  },
  {
    id: 'legal', name: 'Legal', short: 'Legal', color: '#7461c9', count: 216, score: 88,
    tagline: 'Compliance, governance and business ethics.',
    subs: [
      { name: 'Regulatory compliance', kpis: ['Compliance score', 'Audits passed', 'Penalties'] },
      { name: 'Governance & ethics', kpis: ['Transparency index', 'Ongoing disputes', 'Corruption cases'] },
      { name: 'Labour law', kpis: ['HR complaints', 'Labour disputes', 'Payroll compliance'] },
    ],
    refs: ['ESRS G1', 'CSRD', 'Double materiality'],
  },
  {
    id: 'technological', name: 'Technological', short: 'Tech.', color: '#2f86c4', count: 189, score: 55,
    tagline: 'Digital and lean methods: the enabler of every other pillar.',
    subs: [
      { name: 'Digitalisation & Industry 4.0', kpis: ['Automation level', 'IoT deployed', 'Connectivity (%)'] },
      { name: 'Improvement methods', kpis: ['5S score', 'Kaizen actions', 'Lean maturity'] },
      { name: 'Maintenance & quality', kpis: ['MTBF / MTTR', 'Quality score', 'Operational training'] },
    ],
    refs: ['Industry 4.0', 'Digital twin', 'Cross-pillar enabler'],
  },
];

// KPIs tagged with more than one pillar in the WP1 catalogue.
export const MULTI = { id: 'multi', name: 'Multi-pillar', short: 'Multi', color: '#8c8a9c', count: 169 };

export const SCORE = { overall: 71, maturity: 3, maturityLabel: 'Progressing' };

export const FRAMEWORKS = ['CSRD', 'ESRS', 'EU Taxonomy', 'GRI', 'SDGs', 'ISO 14001', 'ISO 50001', 'ESPR', 'WBCSD', 'Green Deal'];

// Real names from the WP1 raw catalogue (including a German one: the catalogue is multilingual).
export const KPI_SAMPLES = [
  'Energy consumption', 'Greenhouse gas emissions', 'Renewable energy share', 'Carbon intensity',
  'Material efficiency', 'Biodiversity impact', 'Employee turnover rate', 'Work-related injuries per employee',
  'Gender pay gap', 'Customer satisfaction', 'R&D spending to revenue ratio', 'On-time delivery rate',
  'Transparency', 'Regulatory quality index', 'Technological sustainability index',
  'Anteil der erneuerbaren Energieträger',
];

export const VISION = ['Initial diagnostic', '5-year ambition', 'Management commitment', 'SDG alignment'];

export const STEPS = ['Company profile', 'KPI selection', 'Baseline', 'SMART targets', 'Action plan'];

// Simplified outlines of the Greater Region territories (lon, lat). Stylised, not cartographic.
export const COUNTRIES = [
  {
    name: 'Lorraine', code: 'FR', color: '#f4f3f7', label: [6.2, 48.5],
    poly: [[4.9, 48.95], [5.05, 49.3], [5.4, 49.55], [5.73, 49.55], [5.9, 49.45], [6.37, 49.47], [6.56, 49.36],
      [6.73, 49.16], [7.05, 49.11], [7.4, 49.18], [7.6, 49.05], [7.6, 48.75], [7.2, 48.5], [7.1, 48.1],
      [6.85, 47.82], [6.2, 47.95], [5.7, 48.05], [5.4, 48.3], [5.0, 48.6]],
  },
  {
    name: 'Wallonie', code: 'BE', color: '#eceaf1', label: [4.7, 50.3],
    poly: [[2.85, 50.7], [3.3, 50.5], [3.7, 50.3], [4.2, 50.25], [4.2, 49.95], [4.8, 49.95], [4.85, 49.8],
      [5.4, 49.6], [5.73, 49.55], [5.75, 49.9], [5.97, 50.17], [6.13, 50.13], [6.4, 50.32], [6.0, 50.75],
      [5.7, 50.76], [4.8, 50.8], [4.0, 50.7], [3.2, 50.8]],
  },
  {
    name: 'Luxembourg', code: 'LU', color: '#f9f9fb', label: [6.1, 49.82],
    poly: [[5.73, 49.55], [5.9, 49.45], [6.37, 49.47], [6.53, 49.8], [6.13, 50.13], [5.97, 50.17], [5.75, 49.9]],
  },
  {
    name: 'Saarland', code: 'DE', color: '#efedf3', label: [6.95, 49.38],
    poly: [[6.37, 49.47], [6.56, 49.36], [6.73, 49.16], [7.05, 49.11], [7.4, 49.18], [7.3, 49.5], [7.0, 49.64], [6.6, 49.64]],
  },
  {
    name: 'Rheinland-Pfalz', code: 'DE', color: '#e9e7ef', label: [7.55, 50.2],
    poly: [[6.13, 50.13], [6.4, 50.32], [6.35, 50.5], [6.8, 50.6], [7.2, 50.95], [7.8, 50.85], [8.15, 50.45],
      [8.0, 50.05], [8.35, 49.9], [8.45, 49.3], [8.2, 48.97], [7.6, 49.05], [7.4, 49.18], [7.3, 49.5],
      [7.0, 49.64], [6.6, 49.64], [6.37, 49.47], [6.53, 49.8]],
  },
];

export const CITIES = [
  { name: 'Metz', lon: 6.18, lat: 49.12, hub: true },
  { name: 'Nancy', lon: 6.18, lat: 48.69 },
  { name: 'Luxembourg', lon: 6.13, lat: 49.61 },
  { name: 'Esch-Belval', lon: 5.95, lat: 49.5 },
  { name: 'Saarbrücken', lon: 7.0, lat: 49.24 },
  { name: 'Trier', lon: 6.64, lat: 49.75 },
  { name: 'Kaiserslautern', lon: 7.77, lat: 49.44 },
  { name: 'Mainz', lon: 8.27, lat: 50.0 },
  { name: 'Liège', lon: 5.57, lat: 50.63 },
  { name: 'Namur', lon: 4.87, lat: 50.47 },
  { name: 'Mons', lon: 3.95, lat: 50.45 },
];

export const LINKS = [
  ['Metz', 'Luxembourg'], ['Metz', 'Saarbrücken'], ['Metz', 'Nancy'], ['Metz', 'Liège'], ['Metz', 'Trier'],
  ['Luxembourg', 'Liège'], ['Luxembourg', 'Trier'], ['Esch-Belval', 'Namur'], ['Saarbrücken', 'Kaiserslautern'],
  ['Kaiserslautern', 'Mainz'], ['Namur', 'Mons'], ['Trier', 'Mainz'],
];

export const METZ = [6.18, 49.12];
