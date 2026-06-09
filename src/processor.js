const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class DataProcessor {
  constructor(options = {}) {
    this.options = _.defaults(options, {
      cacheSize: 1500,
      timeout: 25000,
      batchSize: 200
    });
    this.cache = new Map();
    this.stats = { processed: 0, errors: 0 };
  }

  async loadData(filePath) {
    const cacheKey = path.resolve(filePath);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(rawData);
      
      if (this.cache.size >= this.options.cacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(cacheKey, parsed);
      this.stats.processed++;
      
      return parsed;
    } catch (err) {
      this.stats.errors++;
      throw new Error(`Parse error: ${err.message}`);
    }
  }

  processEntries(data, filterFn = null) {
    let entries = Array.isArray(data) ? data : [data];
    
    if (filterFn) {
      entries = entries.filter(filterFn);
    }

    return entries.map(entry => this.transformEntry(entry));
  }

  transformEntry(entry) {
    const result = {};
    
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value === 'string' && value.length > 0) {
        result[key] = value.trim();
      } else if (typeof value === 'number') {
        result[key] = Math.round(value * 100) / 100;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.transformEntry(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  generateReport(entries) {
    const types = {};
    const summary = {
      total: entries.length,
      timestamp: Date.now(),
      size: JSON.stringify(entries).length
    };

    entries.forEach(entry => {
      Object.keys(entry).forEach(key => {
        const type = typeof entry[key];
        types[key] = types[key] || new Set();
        types[key].add(type);
      });
    });

    for (const key in types) {
      types[key] = Array.from(types[key]);
    }

    return { summary, types, stats: this.stats };
  }

  clearCache() {
    this.cache.clear();
    this.stats = { processed: 0, errors: 0 };
  }
}

module.exports = DataProcessor;