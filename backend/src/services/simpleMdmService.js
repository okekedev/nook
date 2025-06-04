const axios = require('axios');
const dotenv = require('dotenv');
const ProfileGenerators = require('./profileGenerators');

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
      console.error('SimpleMDM API No Response:', error.request);
      const err = new Error('SimpleMDM API No Response');
      err.status = 500;
      throw err;
    } else {
      console.error('SimpleMDM API Request Error:', error.message);
      const err = new Error(`SimpleMDM API Request Error: ${error.message}`);
      err.status = 500;
      throw err;
    }
  }

  // ==========================================
  // DEVICE GROUPS (FAMILIES)
  // ==========================================

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

  async getDeviceGroup(id) {
    try {
      const response = await this.client.get(`/device_groups/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

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

  async deleteDeviceGroup(id) {
    try {
      await this.client.delete(`/device_groups/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // ENROLLMENT
  // ==========================================

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

  async getEnrollment(id) {
    try {
      const response = await this.client.get(`/enrollments/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async deleteEnrollment(id) {
    try {
      await this.client.delete(`/enrollments/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // DEVICES
  // ==========================================

  async getAllDevices() {
    try {
      const response = await this.client.get('/devices');
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getDevicesInGroup(deviceGroupId) {
    try {
      const response = await this.client.get(`/device_groups/${deviceGroupId}/devices`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getDevice(id) {
    try {
      const response = await this.client.get(`/devices/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async updateDevice(id, data) {
    try {
      const response = await this.client.patch(`/devices/${id}`, data);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

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

  async removeDeviceFromGroup(deviceId, deviceGroupId) {
    try {
      await this.client.delete(`/devices/${deviceId}/relationships/device_groups/${deviceGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

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

  // Delete a device from SimpleMDM
  async deleteDevice(deviceId) {
    try {
      await this.client.delete(`/devices/${deviceId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // CONFIGURATION PROFILES
  // ==========================================

  async createProfile(name, mobileconfig) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('name', name);
      form.append('mobileconfig', mobileconfig, {
        filename: `${name.toLowerCase().replace(/\s/g, '-')}.mobileconfig`,
        contentType: 'application/x-apple-aspen-config'
      });
      
      const response = await this.client.post('/custom_configuration_profiles', form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${form._boundary}`
        }
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getProfile(id) {
    try {
      const response = await this.client.get(`/custom_configuration_profiles/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async updateProfile(id, name, mobileconfig) {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('name', name);
      form.append('mobileconfig', mobileconfig, {
        filename: `${name.toLowerCase().replace(/\s/g, '-')}.mobileconfig`,
        contentType: 'application/x-apple-aspen-config'
      });
      
      const response = await this.client.patch(`/custom_configuration_profiles/${id}`, form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${form._boundary}`
        }
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async deleteProfile(id) {
    try {
      await this.client.delete(`/custom_configuration_profiles/${id}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async assignProfileToGroup(profileId, deviceGroupId) {
    try {
      // Create an assignment group that links the profile to the device group
      const response = await this.client.post('/assignment_groups', {
        custom_configuration_profile_id: profileId,
        device_group_id: deviceGroupId,
        auto_deploy: true
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async assignProfileToDevice(profileId, deviceId) {
    try {
      // Create an assignment group that links the profile to a specific device
      const response = await this.client.post('/assignment_groups', {
        custom_configuration_profile_id: profileId,
        device_id: deviceId,
        auto_deploy: true
      });
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // ASSIGNMENT GROUPS MANAGEMENT
  // ==========================================

  // Get all assignment groups (for debugging/admin purposes)
  async getAllAssignmentGroups() {
    try {
      const response = await this.client.get('/assignment_groups');
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Remove a specific assignment group by ID
  async removeAssignmentGroup(assignmentGroupId) {
    try {
      await this.client.delete(`/assignment_groups/${assignmentGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get assignment group by profile and group combination
  async getAssignmentGroup(profileId, deviceGroupId) {
    try {
      const assignmentGroups = await this.getAllAssignmentGroups();
      
      const assignment = assignmentGroups.find(ag => 
        ag.relationships.custom_configuration_profile?.data?.id == profileId &&
        ag.relationships.device_group?.data?.id == deviceGroupId
      );
      
      return assignment || null;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get profiles assigned to a device group
  async getGroupProfiles(deviceGroupId) {
    try {
      const response = await this.client.get(`/assignment_groups`);
      
      // Filter assignment groups for this device group
      const groupAssignments = response.data.data.filter(assignment => {
        return assignment.relationships.device_group?.data?.id == deviceGroupId;
      });
      
      // Extract profile information
      const profileAssignments = groupAssignments.map(assignment => ({
        assignment_id: assignment.id,
        profile_id: assignment.relationships.custom_configuration_profile?.data?.id,
        device_group_id: deviceGroupId,
        auto_deploy: assignment.attributes.auto_deploy
      }));
      
      return profileAssignments;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Get profiles assigned to a specific device
  async getDeviceProfiles(deviceId) {
    try {
      const response = await this.client.get(`/assignment_groups`);
      
      // Filter assignment groups for this device
      const deviceAssignments = response.data.data.filter(assignment => {
        return assignment.relationships.device?.data?.id == deviceId;
      });
      
      // Extract profile information
      const profileAssignments = deviceAssignments.map(assignment => ({
        assignment_id: assignment.id,
        profile_id: assignment.relationships.custom_configuration_profile?.data?.id,
        device_id: deviceId,
        auto_deploy: assignment.attributes.auto_deploy
      }));
      
      return profileAssignments;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Enhanced removeProfileFromGroup with better error handling
  async removeProfileFromGroup(profileId, deviceGroupId) {
    try {
      // Find the specific assignment group
      const assignment = await this.getAssignmentGroup(profileId, deviceGroupId);
      
      if (assignment) {
        await this.removeAssignmentGroup(assignment.id);
        console.log(`Removed assignment group ${assignment.id} (Profile: ${profileId}, Group: ${deviceGroupId})`);
        return true;
      } else {
        console.log(`No assignment found for Profile: ${profileId}, Group: ${deviceGroupId}`);
        return false;
      }
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Enhanced removeProfileFromDevice with better error handling  
  async removeProfileFromDevice(profileId, deviceId) {
    try {
      // Find the assignment group first
      const assignmentGroups = await this.getAllAssignmentGroups();
      const assignment = assignmentGroups.find(ag => 
        ag.relationships.custom_configuration_profile?.data?.id == profileId &&
        ag.relationships.device?.data?.id == deviceId
      );
      
      if (assignment) {
        await this.removeAssignmentGroup(assignment.id);
        console.log(`Removed device assignment ${assignment.id} (Profile: ${profileId}, Device: ${deviceId})`);
        return true;
      } else {
        console.log(`No assignment found for Profile: ${profileId}, Device: ${deviceId}`);
        return false;
      }
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // Sync verification - check if profile is actually assigned
  async verifyProfileAssignment(profileId, deviceGroupId) {
    try {
      const assignment = await this.getAssignmentGroup(profileId, deviceGroupId);
      return assignment !== null;
    } catch (error) {
      console.error('Error verifying profile assignment:', error);
      return false;
    }
  }

  // Clean up orphaned assignment groups
  async cleanupOrphanedAssignments() {
    try {
      const assignmentGroups = await this.getAllAssignmentGroups();
      const orphanedAssignments = [];
      
      for (const assignment of assignmentGroups) {
        // Check if the referenced profile still exists
        const profileId = assignment.relationships.custom_configuration_profile?.data?.id;
        if (profileId) {
          try {
            await this.getProfile(profileId);
          } catch (error) {
            if (error.status === 404) {
              // Profile doesn't exist, this is orphaned
              orphanedAssignments.push(assignment.id);
            }
          }
        }
      }
      
      // Remove orphaned assignments
      for (const assignmentId of orphanedAssignments) {
        await this.removeAssignmentGroup(assignmentId);
        console.log(`Removed orphaned assignment group: ${assignmentId}`);
      }
      
      return {
        total_assignments: assignmentGroups.length,
        orphaned_removed: orphanedAssignments.length,
        remaining_assignments: assignmentGroups.length - orphanedAssignments.length
      };
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // MANAGED APPLICATIONS
  // ==========================================

  async getAllApps() {
    try {
      const response = await this.client.get('/apps');
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async getApp(id) {
    try {
      const response = await this.client.get(`/apps/${id}`);
      return response.data.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

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

  async removeAppFromGroup(appId, deviceGroupId) {
    try {
      await this.client.delete(`/apps/${appId}/relationships/device_groups/${deviceGroupId}`);
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // ==========================================
  // PROFILE GENERATION CONVENIENCE METHODS
  // ==========================================

  generateFirstPhoneProfile(familyName) {
    return ProfileGenerators.generateFirstPhoneProfile(familyName);
  }

  generateExplorerProfile(familyName) {
    return ProfileGenerators.generateExplorerProfile(familyName);
  }

  generateGuardianProfile(familyName) {
    return ProfileGenerators.generateGuardianProfile(familyName);
  }

  generateTimeOutProfile(familyName) {
    return ProfileGenerators.generateTimeOutProfile(familyName);
  }

  generateCustomProfile(familyName, config) {
    return ProfileGenerators.generateCustomProfile(familyName, config);
  }
}

module.exports = new SimpleMDMService();