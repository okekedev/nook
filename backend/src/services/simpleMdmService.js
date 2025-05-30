const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class SimpleMDMService {
  constructor() {
    this.apiKey = process.env.SIMPLEMDM_API_KEY;
    this.baseUrl = process.env.SIMPLEMDM_BASE_URL || 'https://a.simplemdm.com/api/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // Handle API errors
  handleApiError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorData = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
      
      console.error('SimpleMDM API Error:', errorData);
      
      const err = new Error(`SimpleMDM API Error: ${error.response.status} ${error.response.statusText}`);
      err.status = error.response.status;
      err.data = error.response.data;
      throw err;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('SimpleMDM API No Response:', error.request);
      const err = new Error('SimpleMDM API No Response');
      err.status = 500;
      throw err;
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('SimpleMDM API Request Error:', error.message);
      const err = new Error(`SimpleMDM API Request Error: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

  // DEVICE GROUPS (FAMILIES)

  // Create a device group (family)
  async createDeviceGroup(name) {
    try {
      const response = await this.client.post('/device_groups', {
        name: name,
        auto_deploy_enabled: true
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get a device group by ID
  async getDeviceGroup(id) {
    try {
      const response = await this.client.get(`/device_groups/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update a device group
  async updateDeviceGroup(id, name) {
    try {
      const response = await this.client.patch(`/device_groups/${id}`, {
        name: name
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete a device group
  async deleteDeviceGroup(id) {
    try {
      await this.client.delete(`/device_groups/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ENROLLMENT

  // Generate enrollment URL for a device group
  async generateEnrollmentUrl(deviceGroupId) {
    try {
      const response = await this.client.post('/enrollments', {
        device_group_id: deviceGroupId
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get enrollment details
  async getEnrollment(id) {
    try {
      const response = await this.client.get(`/enrollments/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete an enrollment
  async deleteEnrollment(id) {
    try {
      await this.client.delete(`/enrollments/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // DEVICES

  // Get all devices
  async getAllDevices() {
    try {
      const response = await this.client.get('/devices');
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get devices in a group
  async getDevicesInGroup(deviceGroupId) {
    try {
      const response = await this.client.get(`/device_groups/${deviceGroupId}/devices`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get a device by ID
  async getDevice(id) {
    try {
      const response = await this.client.get(`/devices/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update a device
  async updateDevice(id, data) {
    try {
      const response = await this.client.patch(`/devices/${id}`, data);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Assign a device to a group
  async assignDeviceToGroup(deviceId, deviceGroupId) {
    try {
      const response = await this.client.post(`/devices/${deviceId}/relationships/device_groups`, {
        device_group_id: deviceGroupId
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove a device from a group
  async removeDeviceFromGroup(deviceId, deviceGroupId) {
    try {
      await this.client.delete(`/devices/${deviceId}/relationships/device_groups/${deviceGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Lock a device
  async lockDevice(id, message = 'Device locked by Nook') {
    try {
      await this.client.post(`/devices/${id}/lock`, {
        message: message
      });
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // PROFILES (iOS CONFIGURATION PROFILES)

  // Create a profile
  async createProfile(name, mobileconfig) {
    try {
      const response = await this.client.post('/profiles', {
        name: name,
        mobileconfig: mobileconfig
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get a profile by ID
  async getProfile(id) {
    try {
      const response = await this.client.get(`/profiles/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Update a profile
  async updateProfile(id, name, mobileconfig) {
    try {
      const response = await this.client.patch(`/profiles/${id}`, {
        name: name,
        mobileconfig: mobileconfig
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Delete a profile
  async deleteProfile(id) {
    try {
      await this.client.delete(`/profiles/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Assign a profile to a device group
  async assignProfileToGroup(profileId, deviceGroupId) {
    try {
      const response = await this.client.post(`/profiles/${profileId}/relationships/device_groups`, {
        device_group_id: deviceGroupId
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove a profile from a device group
  async removeProfileFromGroup(profileId, deviceGroupId) {
    try {
      await this.client.delete(`/profiles/${profileId}/relationships/device_groups/${deviceGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Assign a profile to a device
  async assignProfileToDevice(profileId, deviceId) {
    try {
      const response = await this.client.post(`/profiles/${profileId}/relationships/devices`, {
        device_id: deviceId
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove a profile from a device
  async removeProfileFromDevice(profileId, deviceId) {
    try {
      await this.client.delete(`/profiles/${profileId}/relationships/devices/${deviceId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // APPS (MANAGED APPLICATIONS)

  // Get all apps
  async getAllApps() {
    try {
      const response = await this.client.get('/apps');
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get an app by ID
  async getApp(id) {
    try {
      const response = await this.client.get(`/apps/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Assign an app to a device group
  async assignAppToGroup(appId, deviceGroupId) {
    try {
      const response = await this.client.post(`/apps/${appId}/relationships/device_groups`, {
        device_group_id: deviceGroupId
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove an app from a device group
  async removeAppFromGroup(appId, deviceGroupId) {
    try {
      await this.client.delete(`/apps/${appId}/relationships/device_groups/${deviceGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // PROFILE GENERATORS

  // Generate restriction profile XML for Essential Kids
  generateEssentialKidsProfile(familyName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures restrictions</string>
      <key>PayloadDisplayName</key>
      <string>Restrictions</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.restrictions</string>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadUUID</key>
      <string>${this._generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>allowAppInstallation</key>
      <false/>
      <key>allowCamera</key>
      <true/>
      <key>allowExplicitContent</key>
      <false/>
      <key>allowInAppPurchases</key>
      <false/>
      <key>allowSafari</key>
      <false/>
      <key>allowAccountModification</key>
      <false/>
      <key>allowFindMyFriendsModification</key>
      <false/>
      <key>allowEnterpriseAppTrust</key>
      <false/>
      <key>forceEncryptedBackup</key>
      <true/>
      <key>allowPasswordAutoFill</key>
      <false/>
      <key>allowPasswordSharing</key>
      <false/>
      <key>allowPasswordProximityRequests</key>
      <false/>
      <key>allowAirDrop</key>
      <false/>
      <key>allowAppRemoval</key>
      <false/>
      <key>allowAssistant</key>
      <false/>
      <key>allowBookstore</key>
      <false/>
      <key>allowCloudDocumentSync</key>
      <false/>
      <key>allowMusicService</key>
      <false/>
      <key>allowScreenshot</key>
      <false/>
      <key>allowSharedStream</key>
      <false/>
      <key>allowiTunes</key>
      <false/>
      <key>forceAssistantProfanityFilter</key>
      <true/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures allowed apps</string>
      <key>PayloadDisplayName</key>
      <string>Allowed Apps</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.allowedapps</string>
      <key>PayloadType</key>
      <string>com.apple.functionality.whitelisted-applications</string>
      <key>PayloadUUID</key>
      <string>${this._generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
        <string>com.apple.mobilephone</string>
        <string>com.apple.MobileSMS</string>
        <string>com.apple.mobileslideshow</string>
        <string>com.apple.mobilemail</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Essential Kids profile with limited apps for young children</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Essential Kids</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.essentialkids</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this._generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }

  // Generate a UUID
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = new SimpleMDMService();