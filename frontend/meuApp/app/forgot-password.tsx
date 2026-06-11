import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiForgotPassword, apiResetPassword } from '@/lib/api';
import { validatePasswordStrength } from '@/lib/passwordStrength';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe seu e-mail para recuperar a senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiForgotPassword(email.trim());
      setRequestSent(true);
      setPreviewToken(response.resetTokenPreview ?? '');
      if (response.resetTokenPreview) {
        setToken(response.resetTokenPreview);
      }
      Alert.alert('Solicitacao enviada', response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel solicitar a redefinicao.';
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos obrigatorios', 'Preencha token, nova senha e confirmacao.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A confirmacao precisa ser igual a nova senha.');
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword.trim());
    if (passwordValidation) {
      Alert.alert('Senha invalida', passwordValidation);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiResetPassword({
        token: token.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert('Senha redefinida', response.message, [
        {
          text: 'OK',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel redefinir a senha.';
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>Digite seu e-mail para receber as instrucoes.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              testID="forgot-email-input"
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            testID="forgot-request-button"
            onPress={() => void handleRequestReset()}
            activeOpacity={0.8}
            disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Enviando...' : requestSent ? 'Reenviar instrucoes' : 'Enviar'}
            </Text>
          </TouchableOpacity>

          {requestSent ? (
            <View style={styles.resetCard}>
              <Text style={styles.resetTitle}>Definir nova senha</Text>
              <Text style={styles.resetHint}>
                Informe o token recebido e escolha uma nova senha forte.
              </Text>

              {__DEV__ && previewToken ? (
                <View style={styles.previewTokenBox}>
                  <Text style={styles.previewTokenLabel}>Token de desenvolvimento</Text>
                  <Text style={styles.previewTokenValue} testID="forgot-preview-token">{previewToken}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Token</Text>
                <TextInput
                  style={styles.input}
                  testID="forgot-token-input"
                  placeholder="Cole o token recebido"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  value={token}
                  onChangeText={setToken}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nova senha</Text>
                <TextInput
                  style={styles.input}
                  testID="forgot-new-password-input"
                  placeholder="Nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmar senha</Text>
                <TextInput
                  style={styles.input}
                  testID="forgot-confirm-password-input"
                  placeholder="Confirme a nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                testID="forgot-reset-button"
                onPress={() => void handleResetPassword()}
                activeOpacity={0.8}
                disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} testID="forgot-back-button">
            <Text style={styles.secondaryAction}>Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A101B',
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#7C8CBF',
    marginBottom: 28,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    color: '#AAB3C9',
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#212B40',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#111B2C',
    color: '#F8FAFC',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#00E5A0',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 18,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#131C2B',
    padding: 18,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  resetHint: {
    fontSize: 13,
    color: '#7C8CBF',
    marginBottom: 12,
  },
  previewTokenBox: {
    backgroundColor: '#162032',
    borderColor: '#00E5A0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  previewTokenLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A5F9D9',
    marginBottom: 4,
  },
  previewTokenValue: {
    fontSize: 13,
    color: '#D9FCE0',
  },
  secondaryAction: {
    textAlign: 'center',
    color: '#7C8CBF',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
});
