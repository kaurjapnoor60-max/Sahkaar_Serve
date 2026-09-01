// Rule-based AI service parser — no paid API required.
// Structured so a real LLM can be swapped in later via the same interface.

const KEYWORDS = {
  Plumbing: ['pipe', 'leak', 'tap', 'drain', 'bathroom', 'water', 'geyser', 'sanitary', 'flush', 'sink', 'plumb'],
  Electrical: ['switch', 'wire', 'light', 'bulb', 'fan', 'short', 'inverter', 'socket', 'meter', 'current', 'electrical', 'mcb', 'wiring', 'spark'],
  Carpentry: ['door', 'furniture', 'table', 'chair', 'wood', 'hinge', 'cabinet', 'shelf', 'plywood', 'carpenter'],
  Painting: ['paint', 'wall', 'color', 'colour', 'waterproof', 'texture', 'whitewash', 'crack'],
  Cleaning: ['clean', 'dust', 'mop', 'sanitize', 'deep clean', 'wash', 'scrub', 'sweep'],
  Househelp: ['maid', 'house help', 'househelp', 'domestic', 'helper', 'cook', 'cooking', 'bai', 'kaam', 'household', 'home help', 'daily help'],
  'Appliance Repair': ['ac', 'fridge', 'refrigerator', 'washing machine', 'microwave', 'oven', 'appliance', 'cooler', 'tv', 'geyser repair'],
  Gardening: ['garden', 'plant', 'lawn', 'grass', 'landscape', 'tree', 'prune', 'hedge'],
  Driving: ['drive', 'driver', 'ride', 'pickup', 'drop', 'deliver', 'transport', 'chauffeur'],
  Caregiving: ['care', 'elder', 'child', 'patient', 'nurse', 'hospital', 'support', 'attendant', 'baby', 'senior'],
};

const SUBSERVICE_MAP = {
  Plumbing: ['Pipe Repair', 'Tap Fitting', 'Drainage Cleaning', 'Geyser Installation', 'Leak Detection'],
  Electrical: ['Wiring Repair', 'Switch Replacement', 'Fan Installation', 'Inverter Setup', 'MCB Repair'],
  Carpentry: ['Furniture Repair', 'Door Fitting', 'Modular Work', 'Cabinet Work'],
  Painting: ['Interior Painting', 'Waterproofing', 'Texture Finish', 'Exterior Painting'],
  Cleaning: ['Deep Cleaning', 'Kitchen Sanitization', 'Move-in Cleaning', 'Regular Cleaning'],
  Househelp: ['Daily Help', 'Cooking Help', 'Utensil Cleaning', 'Full-Time Maid'],
  'Appliance Repair': ['AC Service', 'Refrigerator Repair', 'Washing Machine Repair', 'General Appliance Repair'],
  Gardening: ['Lawn Care', 'Plant Health', 'Landscaping', 'Tree Trimming'],
  Driving: ['City Commute', 'Errand Driving', 'Goods Transport'],
  Caregiving: ['Eldercare', 'Childcare', 'Post-Operative Care'],
};

const URGENT_WORDS = ['urgent', 'emergency', 'burst', 'flood', 'spark', 'fire', 'short circuit', 'broken', 'stuck', 'leaking badly', 'not working at all', 'critical'];

function matchCategory(text) {
  const lower = text.toLowerCase();
  let best = 'Plumbing';
  let bestScore = 0;
  Object.keys(KEYWORDS).forEach((cat) => {
    const score = KEYWORDS[cat].reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = cat; }
  });
  return best;
}

function pickSubservice(cat, text) {
  const subs = SUBSERVICE_MAP[cat] || [];
  const lower = text.toLowerCase();
  if (lower.includes('pipe') || lower.includes('leak')) return 'Pipe Repair';
  if (lower.includes('tap') || lower.includes('sink')) return 'Tap Fitting';
  if (lower.includes('fan')) return 'Fan Installation';
  if (lower.includes('switch') || lower.includes('socket')) return 'Switch Replacement';
  if (lower.includes('door')) return 'Door Fitting';
  if (lower.includes('ac') || lower.includes('cooler')) return 'AC Service';
  if (lower.includes('fridge') || lower.includes('refrigerator')) return 'Refrigerator Repair';
  if (lower.includes('wash') && lower.includes('machine')) return 'Washing Machine Repair';
  if (lower.includes('cook')) return 'Cooking Help';
  if (lower.includes('maid') || lower.includes('daily')) return 'Daily Help';
  return subs[0] || cat;
}

async function parseRequest(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Request text is required.' });
    }

    const lower = text.toLowerCase();
    const service = matchCategory(lower);
    const subService = pickSubservice(service, lower);
    const isUrgent = URGENT_WORDS.some((w) => lower.includes(w));

    res.json({
      success: true,
      data: {
        service,
        subService,
        description: text.trim(),
        urgency: isUrgent ? 'critical' : 'normal',
        priority: isUrgent ? 'Critical' : 'Normal',
        keywords: KEYWORDS[service]?.filter((kw) => lower.includes(kw)) || [],
        summary: `Your request has been understood as a ${subService} need under ${service} services${isUrgent ? ' with critical priority' : ''}.`,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { parseRequest };
