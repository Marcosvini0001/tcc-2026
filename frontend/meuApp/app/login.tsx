import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { apiLogin } from '@/lib/api';
import { loadCurrentSession, setCurrentSession } from '@/lib/sessionStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    void (async () => {
      const currentSession = await loadCurrentSession();
      if (currentSession) {
        router.replace('/dashboard');
      }
    })();
  }, [router]);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!email.trim() || !password.trim()) {
      if (!email.trim()) {
        setEmailError('E-mail obrigatorio');
      }

      if (!password.trim()) {
        setPasswordError('Senha obrigatoria');
      }

      return;
    }

    try {
      setIsLoading(true);
      const session = await apiLogin({ email: email.trim(), password: password.trim() });
      await setCurrentSession(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao entrar.';

      if (message.toLowerCase().includes('credenciais invalidas')) {
        setFormError('E-mail ou senha invalidos');
      } else {
        setFormError(message);
      }

      return;
    } finally {
      setIsLoading(false);
    }

    router.replace('/dashboard');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/img/neuroxp.jpeg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>NeuroXP</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>✉️</Text>
            <TextInput
              style={styles.input}
              testID="login-email-input"
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError('');
                setFormError('');
              }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒</Text>
            <TextInput
              style={styles.input}
              testID="login-password-input"
              placeholder="Senha"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError('');
                setFormError('');
              }}
            />
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={handleForgotPassword} testID="login-forgot-password-link">
            <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            testID="login-submit-button"
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}>
            <Text style={styles.loginButtonText}>{isLoading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            testID="login-register-button"
            onPress={handleRegister}
            activeOpacity={0.8}>
            <Text style={styles.registerButtonText}>Cadastrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    alignSelf: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#000',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 2,
    fontWeight: '600',
  },
  forgotPassword: {
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 6,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 6,
  },
  registerButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
