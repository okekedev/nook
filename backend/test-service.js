const simpleMdmService = require('./src/services/simpleMdmService');

console.log('🧪 Testing SimpleMDM Service functions...\n');

// Test if functions exist
console.log('Available functions:');
console.log('- generateEssentialKidsProfile:', typeof simpleMdmService.generateEssentialKidsProfile);
console.log('- generateStudentModeProfile:', typeof simpleMdmService.generateStudentModeProfile);
console.log('- generateBalancedTeenProfile:', typeof simpleMdmService.generateBalancedTeenProfile);
console.log('- generateCustomProfile:', typeof simpleMdmService.generateCustomProfile);
console.log('- createProfile:', typeof simpleMdmService.createProfile);

console.log('\n🎯 Testing profile generation...');

try {
  const testProfile = simpleMdmService.generateStudentModeProfile('Test Family');
  console.log('✅ generateStudentModeProfile works!');
  console.log('Profile length:', testProfile.length);
  console.log('First 200 characters:', testProfile.substring(0, 200) + '...');
} catch (error) {
  console.error('❌ Error testing generateStudentModeProfile:', error);
}

console.log('\n📝 All service methods:');
console.log(Object.getOwnPropertyNames(simpleMdmService).filter(name => typeof simpleMdmService[name] === 'function'));