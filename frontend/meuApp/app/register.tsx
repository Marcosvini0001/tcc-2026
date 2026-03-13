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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuthStore } from '../src/stores/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nome || !email || !password || !confirm) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      await register(nome, email, password);
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/neuroxp-logo.svg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Criar conta</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={isLoading}>
            <Text style={styles.loginButtonText}>{isLoading ? 'Cadastrando...' : 'Cadastrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink}>
            <Text style={styles.backLinkText}>Já tem conta? Entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
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
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 18,
    marginRight: 10,
    color: '#666',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#000',
  },
  loginButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 6,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 8,
    alignSelf: 'center',
  },
  backLinkText: {
    color: '#333',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
