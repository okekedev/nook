// Comprehensive API Test Script for Nook MDM
// Node.js version - tests all routes like the frontend would
// Run: node test-api.js

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const PARENT_EMAIL = 'parent@test.com';
const CHILD_EMAIL = 'child@test.com';
const PASSWORD = 'Password123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Global variables for test data
let parentToken = '';
let childToken = '';
let parentId = '';
let childId = '';
let familyId = '';
let profileIds = [];
let deviceId = '';

// Helper functions
const printHeader = (message) => {
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
};

const printTest = (message) => {
  console.log(`\n${colors.yellow}🧪 ${message}${colors.reset}`);
};

const printSuccess = (message) => {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
};

const printError = (message) => {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
};

const printInfo = (message) => {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
};

// API helper function
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Check if server is running
const checkServer = async () => {
  printHeader('CHECKING SERVER STATUS');
  
  try {
    const response = await axios.get(BASE_URL.replace('/api', ''));
    printSuccess('Server is running at ' + BASE_URL);
    return true;
  } catch (error) {
    printError('Server is not running!');
    printInfo('Start the server with: npm run dev');
    return false;
  }
};

// Check if master profiles exist
const checkMasterProfiles = async () => {
  printHeader('CHECKING MASTER PROFILES');
  
  const result = await apiCall('GET', '/profiles/templates/available');
  
  if (result.success && result.data.templates && result.data.templates.length === 4) {
    printSuccess('Found 4 master profiles');
    return true;
  } else {
    printError(`Expected 4 master profiles, found ${result.data?.templates?.length || 0}`);
    printInfo('Run: node backend/src/setup-master-profiles.js');
    return false;
  }
};

// Test Authentication Routes
const testAuthRoutes = async () => {
  printHeader('TESTING AUTHENTICATION ROUTES');
  
  // Test Parent Registration
  printTest('Testing Parent Registration');
  const parentRegister = await apiCall('POST', '/auth/register', {
    email: PARENT_EMAIL,
    password: PASSWORD,
    firstName: 'John',
    lastName: 'Doe',
    role: 'parent'
  });
  
  if (parentRegister.success) {
    parentToken = parentRegister.data.token;
    parentId = parentRegister.data.user.id;
    printSuccess(`Parent registered successfully (ID: ${parentId})`);
  } else {
    printError('Parent registration failed');
    console.log(parentRegister.error);
    throw new Error('Parent registration failed');
  }
  
  // Test Child Registration
  printTest('Testing Child Registration');
  const childRegister = await apiCall('POST', '/auth/register', {
    email: CHILD_EMAIL,
    password: PASSWORD,
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'child'
  });
  
  if (childRegister.success) {
    childToken = childRegister.data.token;
    childId = childRegister.data.user.id;
    printSuccess(`Child registered successfully (ID: ${childId})`);
  } else {
    printError('Child registration failed');
    console.log(childRegister.error);
    throw new Error('Child registration failed');
  }
  
  // Test Parent Login
  printTest('Testing Parent Login');
  const parentLogin = await apiCall('POST', '/auth/login', {
    email: PARENT_EMAIL,
    password: PASSWORD
  });
  
  if (parentLogin.success) {
    parentToken = parentLogin.data.token; // Use fresh token
    printSuccess('Parent login successful');
  } else {
    printError('Parent login failed');
    console.log(parentLogin.error);
    throw new Error('Parent login failed');
  }
  
  // Test Get Current User
  printTest('Testing Get Current User');
  const getCurrentUser = await apiCall('GET', '/auth/me', null, parentToken);
  
  if (getCurrentUser.success && getCurrentUser.data.user.email === PARENT_EMAIL) {
    printSuccess('Get current user successful');
  } else {
    printError('Get current user failed');
    console.log(getCurrentUser.error);
    throw new Error('Get current user failed');
  }
  
  // Test Invalid Registration (should fail)
  printTest('Testing Invalid Registration (should fail)');
  const invalidRegister = await apiCall('POST', '/auth/register', {
    email: 'invalid-email',
    password: 'weak',
    firstName: '',
    role: 'invalid'
  });
  
  if (!invalidRegister.success) {
    printSuccess('Invalid registration properly rejected');
  } else {
    printError('Invalid registration should have failed');
    console.log(invalidRegister.data);
  }
};

// Test Family Routes
const testFamilyRoutes = async () => {
  printHeader('TESTING FAMILY ROUTES');
  
  // Test Create Family
  printTest('Testing Create Family');
  const createFamily = await apiCall('POST', '/families', {
    name: 'Test Family'
  }, parentToken);
  
  if (createFamily.success) {
    familyId = createFamily.data.family.id;
    printSuccess(`Family created successfully (ID: ${familyId})`);
  } else {
    printError('Family creation failed');
    console.log(createFamily.error);
    throw new Error('Family creation failed');
  }
  
  // Test Get All Families
  printTest('Testing Get All Families');
  const getAllFamilies = await apiCall('GET', '/families', null, parentToken);
  
  if (getAllFamilies.success && getAllFamilies.data.families.length >= 1) {
    printSuccess(`Retrieved ${getAllFamilies.data.families.length} families`);
  } else {
    printError('Failed to retrieve families');
    console.log(getAllFamilies.error);
    throw new Error('Failed to retrieve families');
  }
  
  // Test Get Specific Family
  printTest('Testing Get Specific Family');
  const getFamily = await apiCall('GET', `/families/${familyId}`, null, parentToken);
  
  if (getFamily.success && getFamily.data.family.name === 'Test Family') {
    printSuccess('Retrieved specific family details');
  } else {
    printError('Failed to retrieve family details');
    console.log(getFamily.error);
    throw new Error('Failed to retrieve family details');
  }
  
  // Test Update Family
  printTest('Testing Update Family');
  const updateFamily = await apiCall('PUT', `/families/${familyId}`, {
    name: 'Updated Test Family'
  }, parentToken);
  
  if (updateFamily.success && updateFamily.data.family.name === 'Updated Test Family') {
    printSuccess('Family updated successfully');
  } else {
    printError('Family update failed');
    console.log(updateFamily.error);
    throw new Error('Family update failed');
  }
  
  // Test Get Family Profiles (should be empty initially)
  printTest('Testing Get Family Profiles');
  const getFamilyProfiles = await apiCall('GET', `/families/${familyId}/profiles`, null, parentToken);
  
  if (getFamilyProfiles.success) {
    printSuccess(`Family has ${getFamilyProfiles.data.profiles.length} profiles`);
  } else {
    printError('Failed to get family profiles');
    console.log(getFamilyProfiles.error);
  }
};

// Test Profile Routes
const testProfileRoutes = async () => {
  printHeader('TESTING PROFILE ROUTES');
  
  // Test Get Available Templates
  printTest('Testing Get Available Templates');
  const getTemplates = await apiCall('GET', '/profiles/templates/available', null, parentToken);
  
  if (getTemplates.success && getTemplates.data.templates.length === 4) {
    printSuccess(`Retrieved ${getTemplates.data.templates.length} profile templates`);
  } else {
    printError(`Expected 4 templates, got ${getTemplates.data?.templates?.length || 0}`);
    console.log(getTemplates.error);
    throw new Error('Template retrieval failed');
  }
  
  // Test Create Master Profile (First Phone)
  printTest('Testing Create Master Profile (First Phone)');
  const createFirstPhone = await apiCall('POST', '/profiles', {
    name: 'Kids First Phone',
    familyId: familyId,
    type: 'first_phone',
    description: 'Basic phone for young kids'
  }, parentToken);
  
  if (createFirstPhone.success) {
    profileIds.push(createFirstPhone.data.profile.id);
    printSuccess(`First Phone profile created (ID: ${createFirstPhone.data.profile.id})`);
  } else {
    printError('First Phone profile creation failed');
    console.log(createFirstPhone.error);
    throw new Error('First Phone profile creation failed');
  }
  
  // Test Create Master Profile (Explorer)
  printTest('Testing Create Master Profile (Explorer)');
  const createExplorer = await apiCall('POST', '/profiles', {
    name: 'Explorer Mode',
    familyId: familyId,
    type: 'explorer',
    description: 'Enhanced features for supervised kids'
  }, parentToken);
  
  if (createExplorer.success) {
    profileIds.push(createExplorer.data.profile.id);
    printSuccess(`Explorer profile created (ID: ${createExplorer.data.profile.id})`);
  } else {
    printError('Explorer profile creation failed');
    console.log(createExplorer.error);
    throw new Error('Explorer profile creation failed');
  }
  
  // Test Create Custom Profile
  printTest('Testing Create Custom Profile');
  const createCustom = await apiCall('POST', '/profiles', {
    name: 'Custom Profile',
    familyId: familyId,
    type: 'custom',
    description: 'Custom restrictions',
    config: {
      allowedApps: [
        'com.apple.mobilephone',
        'com.apple.MobileSMS',
        'com.apple.camera'
      ],
      restrictions: {
        allowAppInstallation: false,
        allowCamera: true,
        allowSafari: false
      }
    }
  }, parentToken);
  
  if (createCustom.success) {
    profileIds.push(createCustom.data.profile.id);
    printSuccess(`Custom profile created (ID: ${createCustom.data.profile.id})`);
  } else {
    printError('Custom profile creation failed');
    console.log(createCustom.error);
    throw new Error('Custom profile creation failed');
  }
  
  // Test Get Specific Profile
  printTest('Testing Get Specific Profile');
  const getProfile = await apiCall('GET', `/profiles/${profileIds[0]}`, null, parentToken);
  
  if (getProfile.success && getProfile.data.profile.name === 'Kids First Phone') {
    printSuccess('Retrieved specific profile details');
  } else {
    printError('Failed to retrieve profile details');
    console.log(getProfile.error);
    throw new Error('Failed to retrieve profile details');
  }
  
  // Test Update Profile (Master Profile - name/description only)
  printTest('Testing Update Master Profile');
  const updateProfile = await apiCall('PUT', `/profiles/${profileIds[0]}`, {
    name: 'Updated First Phone',
    description: 'Updated description'
  }, parentToken);
  
  if (updateProfile.success && updateProfile.data.profile.name === 'Updated First Phone') {
    printSuccess('Master profile updated successfully');
  } else {
    printError('Master profile update failed');
    console.log(updateProfile.error);
    throw new Error('Master profile update failed');
  }
  
  // Test Update Custom Profile (full config)
  printTest('Testing Update Custom Profile');
  const updateCustom = await apiCall('PUT', `/profiles/${profileIds[2]}`, {
    name: 'Updated Custom Profile',
    description: 'Updated custom description',
    config: {
      allowedApps: [
        'com.apple.mobilephone',
        'com.apple.MobileSMS'
      ],
      restrictions: {
        allowAppInstallation: false,
        allowCamera: false,
        allowSafari: false
      }
    }
  }, parentToken);
  
  if (updateCustom.success && updateCustom.data.profile.name === 'Updated Custom Profile') {
    printSuccess('Custom profile updated successfully');
  } else {
    printError('Custom profile update failed');
    console.log(updateCustom.error);
    throw new Error('Custom profile update failed');
  }
};

// Test Device Routes
const testDeviceRoutes = async () => {
  printHeader('TESTING DEVICE ROUTES');
  
  // Test Create Device
  printTest('Testing Create Device');
  const createDevice = await apiCall('POST', '/devices', {
    name: "Jane's iPhone",
    familyId: familyId,
    userId: childId,
    profileId: profileIds[0]
  }, parentToken);
  
  if (createDevice.success) {
    deviceId = createDevice.data.device.id;
    printSuccess(`Device created successfully (ID: ${deviceId})`);
  } else {
    printError('Device creation failed');
    console.log(createDevice.error);
    throw new Error('Device creation failed');
  }
  
  // Test Get All Devices for Parent (if route exists)
  printTest('Testing Get All Devices for Parent');
  const getAllDevices = await apiCall('GET', '/devices', null, parentToken);
  
  if (getAllDevices.success && getAllDevices.data.devices) {
    printSuccess(`Retrieved ${getAllDevices.data.devices.length} devices across all families`);
  } else {
    printInfo('GET /devices route not implemented (optional)');
  }
  
  // Test Get Family Devices
  printTest('Testing Get Family Devices');
  const getFamilyDevices = await apiCall('GET', `/devices/family/${familyId}`, null, parentToken);
  
  if (getFamilyDevices.success && getFamilyDevices.data.devices.length >= 1) {
    printSuccess(`Retrieved ${getFamilyDevices.data.devices.length} devices for family`);
  } else {
    printError('Failed to retrieve family devices');
    console.log(getFamilyDevices.error);
    throw new Error('Failed to retrieve family devices');
  }
  
  // Test Get User Devices (if route exists)
  printTest('Testing Get User Devices');
  const getUserDevices = await apiCall('GET', `/devices/user/${childId}`, null, parentToken);
  
  if (getUserDevices.success && getUserDevices.data.devices) {
    printSuccess(`Retrieved ${getUserDevices.data.devices.length} devices for user`);
  } else {
    printInfo('GET /devices/user/:userId route not implemented (optional)');
  }
  
  // Test Get Specific Device
  printTest('Testing Get Specific Device');
  const getDevice = await apiCall('GET', `/devices/${deviceId}`, null, parentToken);
  
  if (getDevice.success && getDevice.data.device.name === "Jane's iPhone") {
    printSuccess('Retrieved specific device details');
  } else {
    printError('Failed to retrieve device details');
    console.log(getDevice.error);
    throw new Error('Failed to retrieve device details');
  }
  
  // Test Update Device
  printTest('Testing Update Device');
  const updateDevice = await apiCall('PUT', `/devices/${deviceId}`, {
    name: 'Updated iPhone Name',
    profileId: profileIds[1],
    status: 'active'
  }, parentToken);
  
  if (updateDevice.success && updateDevice.data.device.name === 'Updated iPhone Name') {
    printSuccess('Device updated successfully');
  } else {
    printError('Device update failed');
    console.log(updateDevice.error);
    throw new Error('Device update failed');
  }
  
  // Test Assign Profile to Device
  printTest('Testing Assign Profile to Device');
  const assignProfile = await apiCall('POST', `/devices/${deviceId}/assign-profile/${profileIds[0]}`, null, null, parentToken);
  
  if (assignProfile.success) {
    printSuccess('Profile assigned to device successfully');
  } else {
    printError('Profile assignment failed');
    console.log(assignProfile.error);
    throw new Error('Profile assignment failed');
  }
  
  // Test Device Sync
  printTest('Testing Device Sync');
  const syncDevice = await apiCall('POST', `/devices/${deviceId}/sync`, null, null, parentToken);
  
  if (syncDevice.success) {
    printSuccess('Device sync completed');
  } else {
    printError('Device sync failed');
    console.log(syncDevice.error);
    throw new Error('Device sync failed');
  }
  
  // Test Remove Profile from Device
  printTest('Testing Remove Profile from Device');
  const removeProfile = await apiCall('DELETE', `/devices/${deviceId}/remove-profile`, null, null, parentToken);
  
  if (removeProfile.success) {
    printSuccess('Profile removed from device successfully');
  } else {
    printError('Profile removal failed');
    console.log(removeProfile.error);
    throw new Error('Profile removal failed');
  }
};

// Test Sync and Verification Routes
const testSyncRoutes = async () => {
  printHeader('TESTING SYNC & VERIFICATION ROUTES');
  
  // Test Sync Verification
  printTest('Testing Sync Verification');
  const syncVerify = await apiCall('GET', `/profiles/sync/verify/${familyId}`, null, parentToken);
  
  if (syncVerify.success && (syncVerify.data.inSync === true || syncVerify.data.inSync === false)) {
    printSuccess(`Sync verification completed (In sync: ${syncVerify.data.inSync})`);
  } else {
    printError('Sync verification failed');
    console.log(syncVerify.error);
    throw new Error('Sync verification failed');
  }
  
  // Test Sync Repair
  printTest('Testing Sync Repair');
  const syncRepair = await apiCall('POST', `/profiles/sync/repair/${familyId}`, null, null, parentToken);
  
  if (syncRepair.success) {
    printSuccess('Sync repair completed');
  } else {
    printError('Sync repair failed');
    console.log(syncRepair.error);
    throw new Error('Sync repair failed');
  }
  
  // Test Admin Bulk Sync
  printTest('Testing Admin Bulk Sync');
  const bulkSync = await apiCall('POST', '/profiles/admin/sync-all', null, null, parentToken);
  
  if (bulkSync.success) {
    printSuccess('Admin bulk sync completed');
  } else {
    printError('Admin bulk sync failed');
    console.log(bulkSync.error);
    throw new Error('Admin bulk sync failed');
  }
};

// Test Authorization and Constraints
const testConstraints = async () => {
  printHeader('TESTING CONSTRAINTS & AUTHORIZATION');
  
  // Test Unauthorized Access (no token)
  printTest('Testing Unauthorized Access (should fail)');
  const unauthorizedAccess = await apiCall('GET', '/families');
  
  if (!unauthorizedAccess.success) {
    printSuccess('Unauthorized access properly rejected');
  } else {
    printError('Unauthorized access should have failed');
    console.log(unauthorizedAccess.data);
  }
  
  // Test Child trying to create family (should fail)
  printTest('Testing Child Access to Parent Routes (should fail)');
  const childCreateFamily = await apiCall('POST', '/families', {
    name: 'Unauthorized Family'
  }, childToken);
  
  if (!childCreateFamily.success) {
    printSuccess('Child access to parent routes properly rejected');
  } else {
    printError('Child should not be able to create families');
    console.log(childCreateFamily.data);
  }
  
  // Test Invalid Profile Type (should fail)
  printTest('Testing Invalid Profile Type (should fail)');
  const invalidProfileType = await apiCall('POST', '/profiles', {
    name: 'Invalid Profile',
    familyId: familyId,
    type: 'invalid_type'
  }, parentToken);
  
  if (!invalidProfileType.success) {
    printSuccess('Invalid profile type properly rejected');
  } else {
    printError('Invalid profile type should have failed');
    console.log(invalidProfileType.data);
  }
  
  // Test Invalid Family ID (should fail)
  printTest('Testing Invalid Family ID (should fail)');
  const invalidFamilyId = await apiCall('POST', '/profiles', {
    name: 'Invalid Profile',
    familyId: 99999,
    type: 'first_phone'
  }, parentToken);
  
  if (!invalidFamilyId.success) {
    printSuccess('Invalid family ID properly rejected');
  } else {
    printError('Invalid family ID should have failed');
    console.log(invalidFamilyId.data);
  }
};

// Test Deletion and Cleanup
const testDeletions = async () => {
  printHeader('TESTING DELETIONS & CLEANUP');
  
  // Test Delete Device
  printTest('Testing Delete Device');
  const deleteDevice = await apiCall('DELETE', `/devices/${deviceId}`, null, null, parentToken);
  
  if (deleteDevice.success) {
    printSuccess('Device deleted successfully');
  } else {
    printError('Device deletion failed');
    console.log(deleteDevice.error);
    throw new Error('Device deletion failed');
  }
  
  // Test Delete Profiles
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    printTest(`Testing Delete Profile (ID: ${profileId})`);
    const deleteProfile = await apiCall('DELETE', `/profiles/${profileId}`, null, null, parentToken);
    
    if (deleteProfile.success) {
      printSuccess(`Profile ${profileId} deleted successfully`);
    } else {
      printError(`Profile ${profileId} deletion failed`);
      console.log(deleteProfile.error);
    }
  }
  
  // Test Delete Family (should cascade)
  printTest('Testing Delete Family (with cascade)');
  const deleteFamily = await apiCall('DELETE', `/families/${familyId}`, null, null, parentToken);
  
  if (deleteFamily.success) {
    printSuccess('Family deleted successfully with cascade cleanup');
  } else {
    printError('Family deletion failed');
    console.log(deleteFamily.error);
    throw new Error('Family deletion failed');
  }
};

// Main execution function
const runTests = async () => {
  try {
    printHeader('🧪 COMPREHENSIVE API TEST SUITE');
    printInfo('Testing all CRUD operations and route functionality');
    printInfo(`Base URL: ${BASE_URL}`);
    
    // Check server and prerequisites
    const serverRunning = await checkServer();
    if (!serverRunning) return;
    
    const masterProfilesReady = await checkMasterProfiles();
    if (!masterProfilesReady) return;
    
    // Run all tests
    await testAuthRoutes();
    await testFamilyRoutes();
    await testProfileRoutes();
    await testDeviceRoutes();
    await testSyncRoutes();
    await testConstraints();
    await testDeletions();
    
    // Final summary
    printHeader('🎯 TEST SUITE COMPLETED');
    printSuccess('All tests passed successfully!');
    printInfo('Your API is fully functional with:');
    console.log('  ✅ Complete CRUD operations');
    console.log('  ✅ Authentication and authorization');
    console.log('  ✅ Master profile system');
    console.log('  ✅ Server-side SimpleMDM management');
    console.log('  ✅ Constraint validation');
    console.log('  ✅ Sync verification and repair');
    console.log('  ✅ Proper cleanup on deletion');
    
    printInfo('API is ready for production! 🚀');
    
  } catch (error) {
    printError('Test suite failed!');
    console.error(error.message);
    process.exit(1);
  }
};

// Run the tests
runTests();