# PropertyPro Mobile App

A React Native mobile application for PropertyPro Management system with comprehensive features for property management, time tracking, inspections, and maintenance requests.

## Features

### 🔐 Authentication & Security
- Role-based login portal (8 user types)
- Biometric authentication (fingerprint, face recognition)
- Offline authentication support
- Session management with secure storage

### ⏰ Time Tracking
- GPS-verified clock in/out
- Location-based work verification (50-meter radius)
- Offline time entry with automatic sync
- Real-time elapsed time tracking
- Integration with payroll system

### 🏢 Property Management
- Property portfolio overview
- Property inspections with photo capture
- Maintenance request submission
- Real-time property status updates

### 📱 Offline Functionality
- Work without internet connection
- Automatic data synchronization
- Pending action queue management
- Smart retry mechanisms

### 🎨 User Experience
- Configurable app appearance
- Role-specific dashboards
- Real-time sync indicators
- Responsive design for all screen sizes

## User Roles

1. **Administrator** - Full system access and management
2. **Property Manager** - Property oversight and tenant management
3. **Project Manager** - Renovation and project management
4. **Employee** - Time tracking and basic features
5. **Maintenance** - Maintenance worker features
6. **Realtor** - MLS and market analysis
7. **Tenant** - Tenant portal and services
8. **Property Owner** - Owner portal and management

## Technology Stack

- **Framework**: React Native with Expo
- **State Management**: React Query + Context API
- **Navigation**: React Navigation 6
- **Storage**: AsyncStorage for offline data
- **Authentication**: Expo Local Authentication
- **Location**: Expo Location Services
- **Camera**: Expo Camera
- **Network**: NetInfo for connectivity detection

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Expo CLI installed (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   ```bash
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   
   # Web (for testing)
   npm run web
   ```

### Configuration

The app automatically fetches configuration from the PropertyPro backend including:
- Enabled login portals
- Available features
- Offline capabilities
- Company branding
- Sync intervals

Update the API base URL in `src/config/constants.ts`:
```typescript
export const API_BASE_URL = 'https://your-propertypro-server.com';
```

## Building for Production

### Android APK/AAB

1. **Install EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build Android**
   ```bash
   npm run build:android
   ```

### iOS App Store

1. **Build iOS**
   ```bash
   npm run build:ios
   ```

2. **Submit to App Store**
   ```bash
   npm run submit:ios
   ```

## Key Features Implementation

### GPS-Based Time Tracking
- Automatically detects nearby properties
- Validates employee location within 50-meter radius
- Prevents location spoofing
- Offline-capable with sync on reconnection

### Offline Functionality
- Stores pending actions locally
- Automatic retry with exponential backoff
- Intelligent conflict resolution
- Visual sync status indicators

### Role-Based Access
- Dynamic feature enabling/disabling
- Role-specific dashboard layouts
- Permission-based UI rendering
- Secure API communication

### Biometric Authentication
- Face ID / Touch ID support
- Device PIN fallback
- Secure credential storage
- Optional biometric bypass

## API Integration

The mobile app integrates with PropertyPro backend APIs:

- **Authentication**: `/api/auth/login`, `/api/auth/logout`
- **Configuration**: `/api/mobile-app-config`
- **Time Entries**: `/api/time-entries`
- **Properties**: `/api/properties`
- **Inspections**: `/api/inspections`
- **Maintenance**: `/api/maintenance-requests`

## Security Features

- Encrypted local storage
- Session-based authentication
- Biometric security options
- GPS verification for work locations
- Secure API communication with error handling

## Deployment Options

1. **Google Play Store** - Standard Android app distribution
2. **Apple App Store** - iOS app distribution
3. **Enterprise Distribution** - Internal company deployment
4. **APK Direct Install** - Side-loading for testing

## Support & Maintenance

- Regular security updates
- Feature additions based on backend configuration
- Performance monitoring and optimization
- User feedback integration

## License

Copyright © 2025 PropertyPro Management. All rights reserved.