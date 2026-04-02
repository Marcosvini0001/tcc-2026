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

              {previewToken ? (
                <View style={styles.previewTokenBox}>
                  <Text style={styles.previewTokenLabel}>Token de desenvolvimento</Text>
                  <Text style={styles.previewTokenValue}>{previewToken}</Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Token</Text>
                <TextInput
                  style={styles.input}
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
                  placeholder="Confirme a nova senha"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                onPress={() => void handleResetPassword()}
                activeOpacity={0.8}
                disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
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
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 28,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 18,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetCard: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  resetHint: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 12,
  },
  previewTokenBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#86efac',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  previewTokenLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  previewTokenValue: {
    fontSize: 13,
    color: '#14532d',
  },
  secondaryAction: {
    textAlign: 'center',
    color: '#333',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
});
