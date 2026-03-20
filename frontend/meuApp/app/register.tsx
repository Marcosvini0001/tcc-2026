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
import { apiRegisterUser } from '@/lib/api';
import { setCurrentUser } from '@/lib/sessionStore';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !cpf.trim()) {
      Alert.alert('Campos obrigatorios', 'Preencha nome, e-mail, senha e CPF.');
      return;
    }

    try {
      setIsLoading(true);
      const createdUser = await apiRegisterUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        cpf: cpf.trim(),
      });
      await setCurrentUser(createdUser);
      Alert.alert(
        'Cadastro realizado',
        `Conta criada com sucesso. Seu codigo de amigo: ${createdUser.friendCode}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar.';
      Alert.alert('Erro no cadastro', message);
      return;
    } finally {
      setIsLoading(false);
    }

    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Criar conta</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="********"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="Somente numeros"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={cpf}
              onChangeText={setCpf}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={isLoading}>
            <Text style={styles.primaryButtonText}>{isLoading ? 'Cadastrando...' : 'Cadastrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.secondaryAction}>Voltar para login</Text>
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
    marginBottom: 28,
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
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryAction: {
    textAlign: 'center',
    color: '#333',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
});
