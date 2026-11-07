// Enterprise screening examples for Nigeria. Costs are inputs to validate
// locally, never implied by inclusion in this catalogue.
const operationalChecks = [
  ['siteAccess', 'Confirm that the site and utilities suit this activity.'],
  ['operatingCoverage', 'Arrange accountable day-to-day operating coverage.'],
  ['buyerAccess', 'Confirm buyer specifications, volumes and payment terms.'],
]

export const additionalRoutes = [
  {
    id: 'poultry', name: 'Poultry meat or egg production',
    fit: 'Compare a single broiler batch with layers, which have a different feeding and cash-flow pattern.',
    goal: ['cashflow', 'buildBusiness'], skills: ['production', 'operations', 'livestock'],
    cashCycles: ['medium', 'long'], checks: operationalChecks,
    validate: 'Visit two farms and confirm buyer collection terms. Price a small batch with a reliable hatchery, feed supplier and veterinarian before stocking birds.',
    budget: 'Cost chicks or pullets, feed, bedding, vaccines, power and losses. Compare cost per saleable bird or egg tray and test a higher feed bill and lower sales volume.',
    stop: 'Pause if the batch depends on unrealistic survival, feed costs or buyer prices, or you cannot maintain biosecurity.',
  },
  {
    id: 'aquaculture', name: 'Catfish or tilapia grow-out',
    fit: 'Match water and operating capacity to the fish size and volumes local buyers want.',
    goal: ['cashflow', 'buildBusiness'], skills: ['production', 'operations', 'livestock'],
    cashCycles: ['medium', 'long'], checks: operationalChecks,
    validate: 'Check water supply and quality, backup power, fingerling sources and buyer size grades. Ask a local operator to review one trial stocking plan.',
    budget: 'Build a batch budget using saleable kilograms after losses, feed consumed, fingerlings, pumping, labour and transport. Check how delayed harvest affects cash.',
    stop: 'Pause if water and backup power are unreliable, or if the budget only works at best-case growth and survival.',
  },
  {
    id: 'livestock', name: 'Small-ruminant rearing or fattening',
    fit: 'Test a small, managed goat or sheep batch with an explicit feeding and animal-health plan.',
    goal: ['cashflow', 'buildBusiness'], skills: ['production', 'operations', 'livestock'],
    cashCycles: ['medium', 'long'], checks: operationalChecks,
    validate: 'Verify the source and health of animals, quarantine and veterinary support, dry-season feed supply and buyer price by live weight or grade.',
    budget: 'Model acquisition, feed, housing, veterinary care, mortality and transport per animal sold. Test what happens if the sale date slips.',
    stop: 'Pause if you cannot fund feed through the full holding period or arrange suitable animal care and quarantine.',
  },
  {
    id: 'nursery', name: 'Seedling nursery and planting materials',
    fit: 'Use smaller operating space to supply verified seedlings or planting material against seasonal demand.',
    goal: ['cashflow', 'buildBusiness'], skills: ['production', 'sales', 'operations'],
    cashCycles: ['medium', 'long'], checks: operationalChecks,
    validate: 'Ask growers what varieties, delivery dates and quality they need. Verify planting material sources and applicable seed rules before taking orders.',
    budget: 'Calculate cost per saleable seedling after germination failures, losses, water, potting materials and delivery. Budget for unsold stock.',
    stop: 'Pause if there is no reliable water or verified planting material, or buyer demand misses the production window.',
  },
  {
    id: 'logistics', name: 'Post-harvest handling, storage and cold chain',
    fit: 'Test a handling or transport service with rented capacity before investing in a facility or fleet.',
    goal: ['cashflow', 'buildBusiness'], skills: ['operations', 'services', 'sales'],
    cashCycles: ['medium', 'long'],
    checks: [['buyerAccess', 'Confirm paying customers, volumes and handling requirements.']],
    validate: 'Follow one shipment to identify where losses occur. Price a rented-capacity pilot and agree who is responsible for delays, temperature breaches and claims.',
    budget: 'Model cost per delivered unit, including utilisation, power or fuel, loading, spoilage, insurance and receivables.',
    stop: 'Pause if the equipment investment needs unconfirmed volume or if damage liability is unclear.',
  },
  {
    id: 'export', name: 'Export readiness and buyer-led supply',
    fit: 'Start with a defined product and market, buyer specifications and a workable documentation route.',
    goal: ['buildBusiness', 'cashflow'], skills: ['sales', 'operations'],
    cashCycles: ['medium', 'long'],
    checks: [['buyerAccess', 'Identify a credible buyer and obtain specifications and payment terms.'], ['operatingCoverage', 'Arrange someone to manage supplier quality, records and shipment execution.']],
    validate: 'Request a written specification and validate the buyer. Check NEPC registration and destination requirements, then price a sample shipment or supply to an established exporter.',
    budget: 'Calculate full landed or delivered cost using the agreed Incoterm, quality testing, rejection allowance, documentation, freight, finance and FX exposure.',
    stop: 'Pause if documentation or traceability is incomplete, or if buyer payment terms exceed your working capital.',
  },
]

export const extraProcessingProducts = {
  palmOil: {
    name: 'Palm oil',
    validate: 'Decide whether to toll-mill fresh fruit bunches, own a mill or source finished oil for packaging. Verify supply by season, time from harvest to processing, buyer grade and applicable food rules.',
    budget: 'Use a trial mill run to measure saleable oil per tonne of fresh fruit bunches. Cost fruit, transport, labour, fuel, water, effluent handling and realistic mill utilisation.',
    stop: 'Pause equipment purchases if there is no verified fruit supply through the season, no measured extraction yield or no viable waste-handling plan.',
  },
  chocolate: {
    name: 'Chocolate',
    validate: 'Choose between bean-to-bar, using purchased couverture, and contract manufacturing. Confirm cocoa quality, target customers and heat-safe storage, then compare two trial products.',
    budget: 'Cost each saleable bar after roasting or processing losses, ingredients, labour, packaging, rejects and temperature-controlled delivery. Check the price after retail margins.',
    stop: 'Pause if you cannot maintain consistent batches or keep the product stable through delivery, or if confirmed buyer prices leave no margin.',
  },
  cassava: {
    name: 'Cassava products',
    validate: 'Select a product such as garri or flour and get its buyer specification. Compare a trial with a suitable processor against owning equipment. Verify root supply and safe processing controls.',
    budget: 'Measure saleable output per tonne of roots, then include roots, transport, pressing or drying, water, packaging, rejects and waste handling.',
    stop: 'Pause if fresh roots cannot arrive on time, the safety controls are unverified, or the buyer will not accept the trial output.',
  },
  grain: {
    name: 'Rice or maize products',
    validate: 'Choose the grade or product buyers need. Check moisture, storage and sorting requirements, and obtain a toll-milling quote before buying a mill.',
    budget: 'Track saleable product per input tonne after moisture loss, sorting and broken grades. Include drying, milling, storage, testing, packaging and financing.',
    stop: 'Pause if moisture or contamination cannot be controlled or mill utilisation depends on demand you have not verified.',
  },
  fruit: {
    name: 'Dried fruit or spices',
    validate: 'Pick one buyer specification. Compare a contract drying trial with an in-house trial and verify hygiene, moisture targets, shelf stability and packaging.',
    budget: 'Measure fresh-to-dried conversion and calculate cost per saleable kilogram including energy, sorting losses, testing and packaging.',
    stop: 'Pause if the finished batch cannot consistently meet moisture, safety or buyer specifications.',
  },
  fish: {
    name: 'Smoked or dried fish',
    validate: 'Confirm raw-fish supply, buyer size and quality requirements, and use a suitable controlled processing facility for a trial batch.',
    budget: 'Calculate cost per saleable kilogram after weight loss and rejects. Include fuel, cold handling, testing, packaging and delivery.',
    stop: 'Pause if hygiene, temperature control or shelf stability cannot be demonstrated.',
  },
}
