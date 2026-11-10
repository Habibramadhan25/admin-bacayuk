import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { AuthApi, UserProfile } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import { MaterialIcon } from '../components/MaterialIcon';

interface AuthScreenProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onSuccess }) => {
  const { colors, isDark } = useAppTheme();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isDesktop } = useResponsive();

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Harap isi username/email dan password.');
      return;
    }

    setIsLoading(true);
    const res = await AuthApi.login(loginIdentifier, loginPassword);
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMessage('Berhasil masuk! Menyiapkan perpustakaan Anda...');
      setTimeout(() => {
        onSuccess(res.user!);
      }, 500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setErrorMessage('Nama lengkap, username, dan password wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password minimal terdiri dari 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    const res = await AuthApi.register({
      fullName: regFullName,
      school: regSchool || 'SMP Juara Bangsa',
      username: regUsername,
      email: regEmail || undefined,
      password: regPassword,
    });
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMessage('Akun baru berhasil dibuat! Selamat datang di BacaYuk.');
      setTimeout(() => {
        onSuccess(res.user!);
      }, 600);
    } else {
      setErrorMessage(res.message);
    }
  };

  const fillDemoStudent = () => {
    setLoginIdentifier('siswa');
    setLoginPassword('password123');
    setErrorMessage(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isDesktop ? styles.scrollContainerDesktop : null,
        ]}
      >
        <View
          style={[
            styles.cardWrapper,
            isDesktop ? styles.cardWrapperDesktop : null,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <MaterialIcon
              name="arrow_back"
              size={20}
              color={colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.backButtonText,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Kembali
            </Text>
          </TouchableOpacity>

          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <MaterialIcon
                name="book"
                size={32}
                color={colors.primary}
                filled={true}
              />
              <Text style={[styles.brandTitle, { color: colors.primary }]}>
                BacaYuk
              </Text>
            </View>
            <Text
              style={[
                styles.brandSubtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              Perpustakaan digital siswa untuk membaca lebih giat dan berprestasi
            </Text>
          </View>

          {/* Switcher Tab: Masuk vs Daftar */}
          <View
            style={[
              styles.tabSwitcher,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === 'login'
                  ? {
                      backgroundColor: colors.primary,
                    }
                  : null,
              ]}
              onPress={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      tab === 'login'
                        ? colors.onPrimary
                        : colors.onSurfaceVariant,
                    fontWeight: tab === 'login' ? '700' : '500',
                  },
                ]}
              >
                Masuk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                tab === 'register'
                  ? {
                      backgroundColor: colors.primary,
                    }
                  : null,
              ]}
              onPress={() => {
                setTab('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      tab === 'register'
                        ? colors.onPrimary
                        : colors.onSurfaceVariant,
                    fontWeight: tab === 'register' ? '700' : '500',
                  },
                ]}
              >
                Daftar Akun
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications / Alerts */}
          {errorMessage ? (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: isDark ? '#3d1c1c' : '#fee2e2',
                  borderColor: isDark ? '#7f1d1d' : '#fca5a5',
                },
              ]}
            >
              <Text
                style={[
                  styles.alertText,
                  { color: isDark ? '#fca5a5' : '#b91c1c' },
                ]}
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {successMessage ? (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: isDark ? '#1b3b22' : '#dcfce7',
                  borderColor: isDark ? '#22543d' : '#86efac',
                },
              ]}
            >
              <Text
                style={[
                  styles.alertText,
                  { color: isDark ? '#86efac' : '#15803d' },
                ]}
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          {/* TAB 1: LOGIN FORM */}
          {tab === 'login' ? (
            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Username atau Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Contoh: siswa atau siswa@sekolah.id"
                  placeholderTextColor={colors.outline}
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Kata Sandi
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={colors.outline}
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Masuk ke Perpustakaan
                  </Text>
                )}
              </TouchableOpacity>

              {/* Demo Account Helper Box */}
              <View
                style={[
                  styles.demoBox,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.demoTitle,
                    { color: colors.onSurface },
                  ]}
                >
                  Akun Uji Coba:
                </Text>
                <Text
                  style={[
                    styles.demoText,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  Username: <Text style={styles.monoText}>siswa</Text> |
                  Password: <Text style={styles.monoText}>password123</Text>
                </Text>
                <TouchableOpacity
                  onPress={fillDemoStudent}
                  style={styles.demoFillBtn}
                >
                  <Text style={[styles.demoFillBtnText, { color: colors.primary }]}>
                    Isi Otomatis Akun Siswa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* TAB 2: REGISTER FORM */
            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Nama Lengkap
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Nama lengkap siswa"
                  placeholderTextColor={colors.outline}
                  value={regFullName}
                  onChangeText={setRegFullName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Asal Sekolah / Kelas
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Contoh: SMP Juara Bangsa - Kelas 8A"
                  placeholderTextColor={colors.outline}
                  value={regSchool}
                  onChangeText={setRegSchool}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Username Siswa
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Huruf kecil tanpa spasi (cth: rafli2025)"
                  placeholderTextColor={colors.outline}
                  value={regUsername}
                  onChangeText={setRegUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Email (Opsional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="siswa@sekolah.id"
                  placeholderTextColor={colors.outline}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Kata Sandi Baru
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={colors.outline}
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.onSurface },
                  ]}
                >
                  Konfirmasi Kata Sandi
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="Ulangi kata sandi di atas"
                  placeholderTextColor={colors.outline}
                  secureTextEntry
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Daftar Akun Sekarang
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainerDesktop: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cardWrapper: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardWrapperDesktop: {
    maxWidth: 480,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '600',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 340,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
  },
  alertBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    outlineStyle: 'none' as any,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  demoBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  demoTitle: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  demoText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    lineHeight: 18,
  },
  monoText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  demoFillBtn: {
    marginTop: 8,
  },
  demoFillBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
