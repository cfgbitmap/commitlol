const DataProcessor = require('../src/processor');

describe('DataProcessor', () => {
  let processor;
  
  beforeEach(() => {
    processor = new DataProcessor();
  });

  afterEach(() => {
    processor.clearCache();
  });

  it('initializes with default options', () => {
    expect(processor.options.cacheSize).toBe(1500);
    expect(processor.cache).toBeInstanceOf(Map);
  });

  it('processes single entry correctly', () => {
    const testData = { name: 'test', score: 95.567 };
    const processed = processor.processEntries(testData);
    
    expect(processed).toHaveLength(1);
    expect(processed[0].score).toBe(95.57);
  });

  it('handles array input', () => {
    const testData = [
      { id: 1, active: true },
      { id: 2, active: false }
    ];
    const processed = processor.processEntries(testData);
    
    expect(processed).toHaveLength(2);
    expect(processed[0].id).toBe(1);
  });

  it('filters entries when filter function provided', () => {
    const testData = [
      { status: 'active', count: 10 },
      { status: 'inactive', count: 5 },
      { status: 'active', count: 15 }
    ];
    
    const filtered = processor.processEntries(
      testData, 
      entry => entry.status === 'active'
    );
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(item => item.status === 'active')).toBe(true);
  });

  it('generates valid report structure', () => {
    const testData = [{ name: 'item', value: 42 }];
    const report = processor.generateReport(testData);
    
    expect(report.summary.total).toBe(1);
    expect(report.types).toBeDefined();
    expect(report.stats).toBeDefined();
  });
});