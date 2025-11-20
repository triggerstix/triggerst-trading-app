import { analyzeCombined } from './server/analysis/combined.js';

// Test data
const testData = {
  symbol: 'BTC-USD',
  startPrice: 50000,
  peakPrice: 100000,
  currentPrice: 90000,
  days: 180,
  priceData: Array.from({ length: 60 }, (_, i) => ({
    price: 50000 + Math.random() * 50000,
    volume: 1000000 + Math.random() * 5000000,
    date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000),
  })),
};

console.log('Testing Gann + Ney Analysis Engine...\n');

try {
  const result = analyzeCombined(
    testData.startPrice,
    testData.peakPrice,
    testData.currentPrice,
    testData.days,
    testData.priceData
  );

  console.log('✅ Analysis completed successfully!\n');
  console.log('Combined Risk:', result.combinedRisk);
  console.log('Combined Score:', result.combinedScore);
  console.log('Agreement:', result.agreement + '%');
  console.log('\nRecommendation:', result.recommendation.action);
  console.log('Reasoning:', result.recommendation.reasoning);
  console.log('\nGann Risk:', result.gann.riskLevel);
  console.log('Ney Risk:', result.ney.riskLevel);
  console.log('\nScenarios:');
  result.scenarios.forEach(s => {
    console.log(`  ${s.icon} ${s.name}: ${s.probability}% - ${s.target}`);
  });
  
  console.log('\n✅ Test passed!');
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
