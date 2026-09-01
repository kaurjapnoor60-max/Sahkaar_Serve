const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: 'Wrench' },
    desc: { type: String, required: true },
    baseCost: { type: Number, required: true },
    color: { type: String, default: 'text-primary-600' },
    bg: { type: String, default: 'bg-primary-50' },
    subServices: [{ type: String }],
    keywords: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
