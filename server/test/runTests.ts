#!/usr/bin/env tsx

import { BattleTestRunner } from './BattleTestRunner';

async function main() {
  console.log('🚀 Trinity Mecha Academy - Battle System Test Runner');
  console.log('=' .repeat(60));
  
  const testRunner = new BattleTestRunner();
  
  try {
    // Run component tests first
    console.log('\n🔧 Step 1: Component Testing');
    await testRunner.testBattleComponents();
    
    // Run all battle scenarios
    console.log('\n🎯 Step 2: Battle Scenario Testing');
    const results = await testRunner.runAllTests();
    
    // Generate performance report
    console.log('\n📊 Step 3: Performance Analysis');
    await testRunner.generatePerformanceReport();
    
    // Final summary
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount) * 100;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Final Results:');
    console.log(`✅ Successful: ${successCount}/${totalCount} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Failed: ${totalCount - successCount}`);
    
    if (successRate >= 100) {
      console.log('🎉 All tests passed! Battle system is fully operational.');
      process.exit(0);
    } else if (successRate >= 80) {
      console.log('⚠️ Most tests passed. Minor issues detected.');
      process.exit(0);
    } else {
      console.log('🚨 Multiple test failures. Battle system needs attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run the test immediately
main().catch(console.error);