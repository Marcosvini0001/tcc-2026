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
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [formError, setFormError] = useState('');

  const getPasswordLevel = (value: string) => {
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score <= 1) return 'fraca';
    if (score <= 3) return 'media';
    return 'forte';
  };

  const getPasswordScore = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };

  const passwordLevel = getPasswordLevel(password);
  const passwordScore = getPasswordScore(password);
  const passwordBarWidth = `${(passwordScore / 4) * 100}%` as `${number}%`;
  const passwordBarColor =
    passwordLevel === 'forte' ? '#16A34A' : passwordLevel === 'media' ? '#F59E0B' : '#DC2626';

  const handleRegister = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setCpfError('');
    setFormError('');

    if (!name.trim() || !email.trim() || !password.trim() || !cpf.trim()) {
      if (!name.trim()) setNameError('Nome obrigatorio');
      if (!email.trim()) setEmailError('E-mail obrigatorio');
      if (!password.trim()) setPasswordError('Senha obrigatoria');
      if (!cpf.trim()) setCpfError('CPF obrigatorio');
      return;
    }

    if (password.length < 8) {
      setPasswordError('A senha deve ter no minimo 8 caracteres');
      return;
    }

    if (passwordLevel === 'fraca') {
      setPasswordError('Senha fraca: use letras maiusculas, numeros e simbolos');
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

      if (message.toLowerCase().includes('email ja cadastrado')) {
        setEmailError('E-mail ja cadastrado');
      } else if (message.toLowerCase().includes('cpf ja cadastrado')) {
        setCpfError('CPF ja cadastrado');
      } else {
        setFormError(message);
      }

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
              onChangeText={(value) => {
                setName(value);
                setNameError('');
                setFormError('');
              }}
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError('');
                setFormError('');
              }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="********"
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
          <Text style={styles.passwordLevelText}>Nivel da senha: {passwordLevel}</Text>
          <View style={styles.passwordBarTrack}>
            <View
              style={[
                styles.passwordBarFill,
                {
                  width: passwordBarWidth,
                  backgroundColor: password.length ? passwordBarColor : '#d1d5db',
                },
              ]}
            />
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="Somente numeros"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={cpf}
              onChangeText={(value) => {
                setCpf(value);
                setCpfError('');
                setFormError('');
              }}
            />
          </View>
          {cpfError ? <Text style={styles.errorText}>{cpfError}</Text> : null}
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

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
  passwordLevelText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: -6,
    marginBottom: 6,
    fontWeight: '600',
  },
  passwordBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  passwordBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 2,
    fontWeight: '600',
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
