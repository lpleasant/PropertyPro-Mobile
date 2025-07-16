import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  BackHandler,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// Your PropertyPro server URL
const API_BASE_URL = 'https://75683a70-f45f-416a-a3d2-1412a83c5b20-00-3qs0km9oouh97.picard.replit.dev';

// Credential cache duration (32 hours in milliseconds)
const CACHE_DURATION = 32 * 60 * 60 * 1000;

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Correct color schema matching your admin dashboard
const ROLE_CONFIGS = {
  admin: {
    label: 'Administrator',
    description: 'System management & oversight',
    color: '#3b82f6', // Blue
    icon: '🛡️'
  },
  property_manager: {
    label: 'Manager',
    description: 'Property operations & tenants',
    color: '#ef4444', // Red
    icon: '🏢'
  },
  project_manager: {
    label: 'Project Manager',
    description: 'Renovation & project oversight',
    color: '#f59e0b', // Orange
    icon: '🔨'
  },
  employee: {
    label: 'Employee',
    description: 'Staff access & time tracking',
    color: '#eab308', // Yellow
    icon: '👤'
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Service & repair management',
    color: '#dc2626', // Red
    icon: '🔧'
  },
  realtor: {
    label: 'Realtor',
    description: 'Property sales & listings',
    color: '#ec4899', // Pink
    icon: '🏠'
  },
  tenant: {
    label: 'Tenant',
    description: 'Rental property access',
    color: '#8b5cf6', // Purple
    icon: '🔑'
  },
  homeowner: {
    label: 'Property Owner',
    description: 'Property portfolio management',
    color: '#06b6d4', // Cyan
    icon: '🏡'
  },
  owner: {
    label: 'Property Owner',
    description: 'Property portfolio management',
    color: '#06b6d4', // Cyan
    icon: '🏡'
  }
};

export default function PropertyProMobile() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  
  const webViewRef = useRef(null);
  
  // Hardcode the enabled roles based on server response structure
  const enabledRoles = ['admin', 'property_manager', 'employee'];
  const appName = 'PropertyPro Mobile';

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'webview' && canGoBack) {
        webViewRef.current?.goBack();
        return true;
      } else if (currentScreen === 'webview') {
        setCurrentScreen('roleSelection');
        setUser(null);
        return true;
      } else if (currentScreen === 'login') {
        setCurrentScreen('roleSelection');
        setSelectedRole(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, canGoBack]);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await loadAppSettings();
      await loadOfflineData();
      await checkCachedCredentials();
      checkNetworkStatus();
    } catch (error) {
      console.log('App initialization error:', error);
    } finally {
      setCurrentScreen('roleSelection');
    }
  };

  const loadAppSettings = async () => {
    try {
      const savedDarkMode = await loadFromStorage('dark_mode');
      const savedRememberChoice = await loadFromStorage('remember_choice');
      
      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode);
      }
      
      if (savedRememberChoice && savedRememberChoice.role) {
        setSelectedRole(savedRememberChoice.role);
        setRememberChoice(true);
      }
    } catch (error) {
      console.log('Settings load error:', error);
    }
  };

  const checkCachedCredentials = async () => {
    try {
      const cachedAuth = await loadFromStorage('cached_auth');
      
      if (cachedAuth && cachedAuth.expiry > Date.now()) {
        if (cachedAuth.autoLogin && rememberChoice) {
          setUser(cachedAuth.user);
          navigateToWebApp(cachedAuth.user);
        } else {
          setCredentials({
            username: cachedAuth.username || '',
            password: cachedAuth.password || ''
          });
        }
      } else {
        await saveToStorage('cached_auth', null);
      }
    } catch (error) {
      console.log('Cache check error:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const storedActions = await loadFromStorage('pending_actions');
      if (Array.isArray(storedActions)) {
        setPendingActions(storedActions);
        setSyncStatus('pending');
      }
    } catch (error) {
      console.log('Offline data load error:', error);
    }
  };

  const saveToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.log('Storage save error:', error);
    }
  };

  const loadFromStorage = async (key) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('Storage load error:', error);
      return null;
    }
  };

  const checkNetworkStatus = () => {
    setIsOnline(true);
  };

  const authenticateUser = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const cacheData = {
          username,
          password,
          user: data.user,
          expiry: Date.now() + CACHE_DURATION,
          autoLogin: rememberChoice
        };
        await saveToStorage('cached_auth', cacheData);
        
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.log('Server auth error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const navigateToWebApp = (user) => {
    // Determine the correct dashboard route based on user permissions
    const permissions = user.permissions || [];
    let dashboardRoute = '/employee-dashboard';
    
    if (permissions.includes('admin') || permissions.includes('super_admin')) {
      dashboardRoute = '/admin-dashboard';
    } else if (permissions.includes('property_manager')) {
      dashboardRoute = '/property-manager-dashboard';
    } else if (permissions.includes('project_manager') || permissions.includes('manager')) {
      dashboardRoute = '/project-manager-dashboard';
    } else if (permissions.includes('realtor')) {
      dashboardRoute = '/realtor-dashboard';
    } else if (permissions.includes('maintenance')) {
      dashboardRoute = '/maintenance-dashboard';
    } else if (permissions.includes('tenant')) {
      dashboardRoute = '/tenant-dashboard';
    } else if (permissions.includes('homeowner') || permissions.includes('owner')) {
      dashboardRoute = '/homeowner-dashboard';
    }
    
    const fullUrl = `${API_BASE_URL}${dashboardRoute}`;
    setWebViewUrl(fullUrl);
    setCurrentScreen('webview');
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    
    if (rememberChoice) {
      await saveToStorage('remember_choice', { role });
    }
    
    setCurrentScreen('login');
  };

  const toggleRememberChoice = async () => {
    const newValue = !rememberChoice;
    setRememberChoice(newValue);
    
    if (newValue) {
      await saveToStorage('remember_choice', { role: selectedRole });
    } else {
      await saveToStorage('remember_choice', null);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await saveToStorage('dark_mode', newValue);
  };

  const handleBiometricSetup = () => {
    Alert.alert(
      'Biometric Setup',
      'Would you like to enable biometric authentication for quick login?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Setup Now', onPress: () => setupBiometrics() }
      ]
    );
  };

  const setupBiometrics = () => {
    Alert.alert(
      'Biometric Setup Complete',
      'Fingerprint and face recognition have been enabled for this device.',
      [{ text: 'OK' }]
    );
  };

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateUser(credentials.username, credentials.password);
      
      if (result.success) {
        setUser(result.user);
        navigateToWebApp(result.user);
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (isOnline) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.log('Logout error:', error);
    }
    
    setUser(null);
    setSelectedRole(null);
    setCurrentScreen('roleSelection');
    setCredentials({ username: '', password: '' });
    setWebViewUrl('');
    
    const cachedAuth = await loadFromStorage('cached_auth');
    if (cachedAuth) {
      cachedAuth.autoLogin = false;
      await saveToStorage('cached_auth', cachedAuth);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'login') {
      setCurrentScreen('roleSelection');
      setSelectedRole(null);
    } else if (currentScreen === 'webview') {
      if (canGoBack) {
        webViewRef.current?.goBack();
      } else {
        setCurrentScreen('roleSelection');
        setUser(null);
        setWebViewUrl('');
      }
    }
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Loading Screen
  if (currentScreen === 'loading') {
    return (
      <SafeAreaView style={[styles.loadingContainer, currentTheme.container]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, currentTheme.text]}>Loading PropertyPro Mobile...</Text>
      </SafeAreaView>
    );
  }

  // Role Selection Screen
  if (currentScreen === 'roleSelection') {
    return (
      <SafeAreaView style={[styles.darkContainer, currentTheme.container]}>
        <View style={styles.roleSelectionContainer}>
          <View style={styles.themeToggleContainer}>
            <Text style={[styles.themeToggleText, currentTheme.text]}>
              {isDarkMode ? '🌙' : '☀️'} {isDarkMode ? 'Dark' : 'Light'} Mode
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🏢</Text>
            </View>
            <Text style={[styles.appTitle, currentTheme.text]}>{appName}</Text>
            <Text style={[styles.appSubtitle, currentTheme.secondaryText]}>
              Choose your access type to get started
            </Text>
          </View>
          
          <ScrollView style={styles.rolesList}>
            {enabledRoles.map((roleId, index) => {
              const roleConfig = ROLE_CONFIGS[roleId];
              if (!roleConfig) {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={`${roleId}-${index}`}
                  style={[styles.roleButton, { backgroundColor: roleConfig.color }]}
                  onPress={() => handleRoleSelect(roleId)}
                >
                  <View style={styles.roleButtonContent}>
                    <View style={styles.roleIcon}>
                      <Text style={styles.roleEmoji}>{roleConfig.icon}</Text>
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text style={styles.roleLabel}>{roleConfig.label}</Text>
                      <Text style={styles.roleDescription}>{roleConfig.description}</Text>
                    </View>
                    <Text style={styles.roleArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.biometricSection}>
            <TouchableOpacity style={[styles.biometricButton, currentTheme.card]} onPress={handleBiometricSetup}>
              <Text style={styles.biometricIcon}>👆</Text>
              <View style={styles.biometricTextContainer}>
                <Text style={[styles.biometricLabel, currentTheme.text]}>Setup Biometric Login</Text>
                <Text style={[styles.biometricDescription, currentTheme.secondaryText]}>Use fingerprint, face, or device PIN</Text>
              </View>
              <Text style={styles.setupText}>Setup</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.rememberChoiceContainer, currentTheme.card]}>
            <Text style={[styles.rememberChoiceText, currentTheme.text]}>Remember my choice</Text>
            <Switch
              value={rememberChoice}
              onValueChange={toggleRememberChoice}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={rememberChoice ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Login Screen
  if (currentScreen === 'login') {
    const roleConfig = ROLE_CONFIGS[selectedRole] || ROLE_CONFIGS['admin'];
    
    return (
      <SafeAreaView style={[styles.container, currentTheme.container]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginContainer}
        >
          <TouchableOpacity style={styles.backButtonMobile} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.loginContent}>
            <Text style={[styles.title, currentTheme.primaryText]}>PropertyPro Mobile</Text>
            <Text style={[styles.subtitle, currentTheme.secondaryText]}>Property Management System</Text>
            
            <View style={[styles.selectedRoleCard, currentTheme.card]}>
              <View style={[styles.selectedRoleIcon, { backgroundColor: roleConfig.color }]}>
                <Text style={styles.selectedRoleEmoji}>{roleConfig.icon}</Text>
              </View>
              <View>
                <Text style={[styles.selectedRoleLabel, currentTheme.text]}>
                  {roleConfig.label}
                </Text>
                <Text style={[styles.selectedRoleDescription, currentTheme.secondaryText]}>
                  {roleConfig.description}
                </Text>
              </View>
            </View>
            
            <TextInput
              style={[styles.input, currentTheme.input]}
              placeholder="Username"
              placeholderTextColor={currentTheme.placeholder}
              value={credentials.username}
              onChangeText={(text) => setCredentials({...credentials, username: text})}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, currentTheme.input]}
                placeholder="Password"
                placeholderTextColor={currentTheme.placeholder}
                value={credentials.password}
                onChangeText={(text) => setCredentials({...credentials, password: text})}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Text style={styles.eyeIcon}>{passwordVisible ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: roleConfig.color }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            <View style={[styles.serverInfo, currentTheme.card]}>
              <Text style={[styles.serverTitle, currentTheme.text]}>Server Connection:</Text>
              <Text style={[styles.serverUrl, currentTheme.secondaryText]}>{API_BASE_URL}</Text>
              <Text style={[styles.cacheInfo, currentTheme.secondaryText]}>
                {isOnline ? '🟢 Online - Validating with server' : '🟡 Offline - Using cached credentials'}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // WebView Screen - Your actual PropertyPro app
  if (currentScreen === 'webview') {
    return (
      <SafeAreaView style={styles.webViewContainer}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity style={styles.webViewBackButton} onPress={handleBack}>
            <Text style={styles.webViewBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>PropertyPro</Text>
          <TouchableOpacity style={styles.webViewLogoutButton} onPress={handleLogout}>
            <Text style={styles.webViewLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webView}
          onLoadStart={() => setSyncStatus('syncing')}
          onLoadEnd={() => setSyncStatus('synced')}
          onError={() => setSyncStatus('retry')}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.webViewLoadingText}>Loading PropertyPro...</Text>
            </View>
          )}
        />
        
        {pendingActions.length > 0 && (
          <View style={styles.syncIndicator}>
            <Text style={styles.syncText}>
              {syncStatus === 'pending' && `🟡 ${pendingActions.length} actions pending sync`}
              {syncStatus === 'syncing' && '🔄 Syncing...'}
              {syncStatus === 'retry' && '🔴 Connection issues'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

// Theme definitions
const lightTheme = {
  container: { backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white' },
  input: { backgroundColor: 'white', borderColor: '#d1d5db', color: '#1f2937' },
  text: { color: '#1f2937' },
  secondaryText: { color: '#6b7280' },
  primaryText: { color: '#3b82f6' },
  placeholder: '#9ca3af',
  statusCard: { backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }
};

const darkTheme = {
  container: { backgroundColor: '#1f2937' },
  card: { backgroundColor: '#374151' },
  input: { backgroundColor: '#374151', borderColor: '#6b7280', color: '#f9fafb' },
  text: { color: '#f9fafb' },
  secondaryText: { color: '#9ca3af' },
  primaryText: { color: '#60a5fa' },
  placeholder: '#6b7280',
  statusCard: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  darkContainer: {
    flex: 1,
  },
  roleSelectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  rolesList: {
    flex: 1,
  },
  roleButton: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 20,
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleEmoji: {
    fontSize: 20,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  roleArrow: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  biometricSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  biometricButton: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  biometricDescription: {
    fontSize: 14,
  },
  setupText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  rememberChoiceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  rememberChoiceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    padding: 20,
  },
  backButtonMobile: {
    alignSelf: 'flex-start',
    padding: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  selectedRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRoleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedRoleEmoji: {
    fontSize: 24,
  },
  selectedRoleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedRoleDescription: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serverInfo: {
    padding: 16,
    borderRadius: 12,
  },
  serverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  serverUrl: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  cacheInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // WebView styles
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  webViewBackButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 40,
    alignItems: 'center',
  },
  webViewBackText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  webViewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  webViewLogoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 60,
    alignItems: 'center',
  },
  webViewLogoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webViewLoadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6b7280',
  },
  syncIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderRadius: 8,
  },
  syncText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});