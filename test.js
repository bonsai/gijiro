console.log('Test script is running');
console.log('1 + 1 =', 1 + 1);

// Simple test function
function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(error);
  }
}

// Run a simple test
test('1 + 1 should equal 2', () => {
  if (1 + 1 !== 2) {
    throw new Error('1 + 1 should be 2');
  }
});
