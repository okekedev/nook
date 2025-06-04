// Profile XML generators for iOS configuration profiles

class ProfileGenerators {
  // Profile metadata - descriptions, allowed apps, etc.
  static getProfileMetadata() {
    return {
      essential_kids: {
        name: 'Essential Kids',
        description: 'Basic profile for young children with only essential apps - Phone, Messages, Photos, Mail',
        ageRange: 'Ages 6-10',
        allowedApps: [
          'com.apple.mobilephone',    // Phone
          'com.apple.MobileSMS',      // Messages  
          'com.apple.mobileslideshow', // Photos
          'com.apple.mobilemail'      // Mail
        ],
        restrictions: {
          allow_camera: true,
          allow_safari: false,
          allow_app_installation: false,
          allow_in_app_purchases: false,
          allow_explicit_content: false
        }
      },
      student_mode: {
        name: 'Student Mode',
        description: 'Educational profile with filtered internet access and school-appropriate apps',
        ageRange: 'Ages 10-14',
        allowedApps: [
          'com.apple.mobilephone',    // Phone
          'com.apple.MobileSMS',      // Messages
          'com.apple.mobileslideshow', // Photos
          'com.apple.mobilemail',     // Mail
          'com.apple.mobilesafari',   // Safari (filtered)
          'com.apple.mobilecal',      // Calendar
          'com.apple.camera',         // Camera
          'com.apple.mobilenotes'     // Notes
        ],
        restrictions: {
          allow_camera: true,
          allow_safari: true,
          allow_app_installation: false,
          allow_in_app_purchases: false,
          allow_explicit_content: false
        }
      },
      balanced_teen: {
        name: 'Balanced Teen',
        description: 'More freedom with smart restrictions - suitable for responsible teenagers',
        ageRange: 'Ages 12-16',
        allowedApps: [
          'com.apple.mobilephone',    // Phone
          'com.apple.MobileSMS',      // Messages
          'com.apple.mobileslideshow', // Photos
          'com.apple.mobilemail',     // Mail
          'com.apple.mobilesafari',   // Safari
          'com.apple.mobilecal',      // Calendar
          'com.apple.camera',         // Camera
          'com.apple.mobilenotes',    // Notes
          'com.apple.Music',          // Music
          'com.apple.AppStore'        // App Store (limited)
        ],
        restrictions: {
          allow_camera: true,
          allow_safari: true,
          allow_app_installation: true,
          allow_in_app_purchases: false,
          allow_explicit_content: false
        }
      }
    };
  }
  // Generate a UUID for profile payloads
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // First Phone Profile - Calls and texts only
  static generateFirstPhoneProfile(familyName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures restrictions for first phone</string>
      <key>PayloadDisplayName</key>
      <string>First Phone Restrictions</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.firstphone.restrictions</string>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>allowAppInstallation</key>
      <false/>
      <key>allowCamera</key>
      <false/>
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
      <key>allowUIConfigurationProfileInstallation</key>
      <false/>
      <key>allowSettingsModification</key>
      <false/>
      <key>allowControlCenter</key>
      <false/>
      <key>allowNotificationCenter</key>
      <false/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures allowed apps for first phone</string>
      <key>PayloadDisplayName</key>
      <string>First Phone Apps</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.firstphone.apps</string>
      <key>PayloadType</key>
      <string>com.apple.functionality.whitelisted-applications</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
        <string>com.apple.mobilephone</string>
        <string>com.apple.MobileSMS</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>First Phone profile - calls and texts only for young children</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - First Phone</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.firstphone</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }
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
      <string>${this.generateUUID()}</string>
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
      <string>${this.generateUUID()}</string>
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
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }

  // Explorer Profile - Enhanced features for supervised kids
  static generateExplorerProfile(familyName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures restrictions for explorer mode</string>
      <key>PayloadDisplayName</key>
      <string>Explorer Restrictions</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.explorer.restrictions</string>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
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
      <true/>
      <key>allowBookstore</key>
      <false/>
      <key>allowCloudDocumentSync</key>
      <false/>
      <key>allowMusicService</key>
      <false/>
      <key>allowScreenshot</key>
      <true/>
      <key>allowSharedStream</key>
      <false/>
      <key>allowiTunes</key>
      <false/>
      <key>allowUIConfigurationProfileInstallation</key>
      <false/>
      <key>allowSettingsModification</key>
      <false/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures allowed apps for explorer mode</string>
      <key>PayloadDisplayName</key>
      <string>Explorer Apps</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.explorer.apps</string>
      <key>PayloadType</key>
      <string>com.apple.functionality.whitelisted-applications</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
        <string>com.apple.mobilephone</string>
        <string>com.apple.MobileSMS</string>
        <string>com.apple.camera</string>
        <string>com.google.ios.youtube</string>
        <string>com.apple.Maps</string>
        <string>com.apple.mobiletimer</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Explorer profile - enhanced features for supervised kids</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Explorer</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.explorer</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }
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
      <string>${this.generateUUID()}</string>
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
      <true/>
      <key>allowAccountModification</key>
      <false/>
      <key>allowFindMyFriendsModification</key>
      <true/>
      <key>allowEnterpriseAppTrust</key>
      <false/>
      <key>forceEncryptedBackup</key>
      <true/>
      <key>allowPasswordAutoFill</key>
      <true/>
      <key>allowPasswordSharing</key>
      <false/>
      <key>allowPasswordProximityRequests</key>
      <false/>
      <key>allowAirDrop</key>
      <false/>
      <key>allowAppRemoval</key>
      <false/>
      <key>allowAssistant</key>
      <true/>
      <key>allowBookstore</key>
      <false/>
      <key>allowCloudDocumentSync</key>
      <true/>
      <key>allowMusicService</key>
      <false/>
      <key>allowScreenshot</key>
      <true/>
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
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
        <string>com.apple.mobilephone</string>
        <string>com.apple.MobileSMS</string>
        <string>com.apple.mobileslideshow</string>
        <string>com.apple.mobilemail</string>
        <string>com.apple.mobilesafari</string>
        <string>com.apple.mobilecal</string>
        <string>com.apple.camera</string>
        <string>com.apple.mobilenotes</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Student Mode profile with educational apps and filtered web browsing</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Student Mode</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.studentmode</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }

  // Guardian Profile - Full access with social media blocking
  static generateGuardianProfile(familyName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures restrictions for guardian mode</string>
      <key>PayloadDisplayName</key>
      <string>Guardian Restrictions</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.guardian.restrictions</string>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>allowAppInstallation</key>
      <true/>
      <key>allowCamera</key>
      <true/>
      <key>allowExplicitContent</key>
      <false/>
      <key>allowInAppPurchases</key>
      <false/>
      <key>allowSafari</key>
      <true/>
      <key>allowAccountModification</key>
      <false/>
      <key>allowFindMyFriendsModification</key>
      <true/>
      <key>allowEnterpriseAppTrust</key>
      <false/>
      <key>forceEncryptedBackup</key>
      <true/>
      <key>allowPasswordAutoFill</key>
      <true/>
      <key>allowPasswordSharing</key>
      <false/>
      <key>allowPasswordProximityRequests</key>
      <true/>
      <key>allowAirDrop</key>
      <true/>
      <key>allowAppRemoval</key>
      <true/>
      <key>allowAssistant</key>
      <true/>
      <key>allowBookstore</key>
      <true/>
      <key>allowCloudDocumentSync</key>
      <true/>
      <key>allowMusicService</key>
      <true/>
      <key>allowScreenshot</key>
      <true/>
      <key>allowSharedStream</key>
      <true/>
      <key>allowiTunes</key>
      <true/>
      <key>allowUIConfigurationProfileInstallation</key>
      <false/>
      <key>allowSettingsModification</key>
      <false/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
    <dict>
      <key>PayloadDescription</key>
      <string>Blocks dangerous social media apps</string>
      <key>PayloadDisplayName</key>
      <string>Social Media Blocker</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.guardian.blocker</string>
      <key>PayloadType</key>
      <string>com.apple.functionality.blacklisted-applications</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>BlacklistedApplications</key>
      <array>
        <string>com.zhiliaoapp.musically</string>
        <string>com.burbn.instagram</string>
        <string>com.toyopagroup.picaboo</string>
        <string>com.facebook.Facebook</string>
        <string>com.atebits.Tweetie2</string>
        <string>com.hammerandchisel.discord</string>
        <string>com.bumble.app</string>
        <string>com.cardify.tinder</string>
        <string>com.pof.pof</string>
        <string>com.match.match</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Guardian profile - full access with social media protection</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Guardian</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.guardian</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }
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
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>allowAppInstallation</key>
      <true/>
      <key>allowCamera</key>
      <true/>
      <key>allowExplicitContent</key>
      <false/>
      <key>allowInAppPurchases</key>
      <false/>
      <key>allowSafari</key>
      <true/>
      <key>allowAccountModification</key>
      <false/>
      <key>allowFindMyFriendsModification</key>
      <true/>
      <key>allowEnterpriseAppTrust</key>
      <false/>
      <key>forceEncryptedBackup</key>
      <true/>
      <key>allowPasswordAutoFill</key>
      <true/>
      <key>allowPasswordSharing</key>
      <false/>
      <key>allowPasswordProximityRequests</key>
      <true/>
      <key>allowAirDrop</key>
      <true/>
      <key>allowAppRemoval</key>
      <true/>
      <key>allowAssistant</key>
      <true/>
      <key>allowBookstore</key>
      <true/>
      <key>allowCloudDocumentSync</key>
      <true/>
      <key>allowMusicService</key>
      <true/>
      <key>allowScreenshot</key>
      <true/>
      <key>allowSharedStream</key>
      <true/>
      <key>allowiTunes</key>
      <true/>
      <key>forceAssistantProfanityFilter</key>
      <true/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Balanced Teen profile with more freedom but still some limits</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Balanced Teen</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.balancedteen</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }

  // Time Out Profile - Disciplinary mode with phone only
  static generateTimeOutProfile(familyName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures disciplinary restrictions</string>
      <key>PayloadDisplayName</key>
      <string>Time Out Restrictions</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.timeout.restrictions</string>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>allowAppInstallation</key>
      <false/>
      <key>allowCamera</key>
      <false/>
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
      <key>allowUIConfigurationProfileInstallation</key>
      <false/>
      <key>allowSettingsModification</key>
      <false/>
      <key>allowControlCenter</key>
      <false/>
      <key>allowNotificationCenter</key>
      <false/>
      <key>allowSpotlightInternetResults</key>
      <false/>
      <key>allowAppCellularDataModification</key>
      <false/>
      <key>forceLimitAdTracking</key>
      <true/>
    </dict>
    <dict>
      <key>PayloadDescription</key>
      <string>Time out mode - phone only</string>
      <key>PayloadDisplayName</key>
      <string>Time Out Apps</string>
      <key>PayloadIdentifier</key>
      <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.timeout.apps</string>
      <key>PayloadType</key>
      <string>com.apple.functionality.whitelisted-applications</string>
      <key>PayloadUUID</key>
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
        <string>com.apple.mobilephone</string>
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Time Out profile - disciplinary mode with phone access only</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Time Out</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.timeout</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }
    const { allowedApps, restrictions } = config;
    
    // Convert allowed apps to XML format
    const appsXml = allowedApps.map(app => `        <string>${app}</string>`).join('\n');
    
    // Convert restrictions to XML format
    let restrictionsXml = '';
    for (const [key, value] of Object.entries(restrictions)) {
      if (typeof value === 'boolean') {
        restrictionsXml += `      <key>${key}</key>\n      <${value}/>\n`;
      } else if (typeof value === 'number') {
        restrictionsXml += `      <key>${key}</key>\n      <integer>${value}</integer>\n`;
      } else if (typeof value === 'string') {
        restrictionsXml += `      <key>${key}</key>\n      <string>${value}</string>\n`;
      }
    }
    
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
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
${restrictionsXml}
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
      <string>${this.generateUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>WhitelistedApplications</key>
      <array>
${appsXml}
      </array>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Custom profile with personalized restrictions</string>
  <key>PayloadDisplayName</key>
  <string>${familyName} - Custom Profile</string>
  <key>PayloadIdentifier</key>
  <string>com.nook.${familyName.toLowerCase().replace(/\s/g, '-')}.custom</string>
  <key>PayloadOrganization</key>
  <string>Nook MDM</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${this.generateUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
  }
}

module.exports = ProfileGenerators;