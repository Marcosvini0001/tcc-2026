import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { apiAddFriendByCode, apiGetFriends, apiGetUserById, type ApiUserProfile } from '@/lib/api';
import { getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

export default function ProfileScreen() {
  const router = useRouter();
  const [friendCodeInput, setFriendCodeInput] = React.useState('');
  const [currentUserName, setCurrentUserName] = React.useState('Usuario');
  const [currentUserCode, setCurrentUserCode] = React.useState('----');
  const [friends, setFriends] = React.useState<string[]>([]);
  const [isAddingFriend, setIsAddingFriend] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<ApiUserProfile | null>(null);

  const loadProfile = React.useCallback(async () => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      setCurrentUserCode('Nao disponivel');
      setUserProfile(null);
      return;
    }

    setCurrentUserName(user.name);
    setCurrentUserCode(user.friendCode);

    try {
      const [refreshedUser, fetchedFriends] = await Promise.all([
        apiGetUserById(user.id),
        apiGetFriends(user.id),
      ]);

      setCurrentUserName(refreshedUser.name);
      setCurrentUserCode(refreshedUser.friendCode);
      setUserProfile(refreshedUser);
      setFriends(fetchedFriends.map((friend) => `${friend.name} (${friend.friendCode})`));
    } catch (_error) {
      Alert.alert('Erro', 'Nao foi possivel carregar sua lista de amigos.');
    }
  }, []);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleAddFriend = async () => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      Alert.alert('Sessao nao encontrada', 'Faca login para adicionar amigos.');
      return;
    }

    if (!friendCodeInput.trim()) {
      Alert.alert('Codigo obrigatorio', 'Digite o codigo do amigo.');
      return;
    }

    try {
      setIsAddingFriend(true);
      const addedFriend = await apiAddFriendByCode(user.id, friendCodeInput.trim());
      await loadProfile();
      setFriendCodeInput('');
      Alert.alert('Amigo adicionado', `${addedFriend.name} agora faz parte da sua lista.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel adicionar amigo.';
      Alert.alert('Erro', message);
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('@/img/neuroxp.jpeg')} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={styles.headerTitle}>NeuroXP</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👨</Text>
            </View>
          </View>

          <Text style={styles.userName}>{currentUserName}</Text>

          <View style={styles.friendCodeCard}>
            <Text style={styles.friendCodeTitle}>Seu Friend Code</Text>
            <Text style={styles.friendCodeSubtitle}>Codigo</Text>
            <Text style={styles.friendCodeValue}>{currentUserCode}</Text>
            <Text style={styles.friendCodeHint}>Compartilhe esse codigo para ser adicionado.</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Seu progresso</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsMetric}>
                <Text style={styles.statsMetricValue}>{userProfile?.level ?? 1}</Text>
                <Text style={styles.statsMetricLabel}>Nivel</Text>
              </View>
              <View style={styles.statsMetric}>
                <Text style={styles.statsMetricValue}>{userProfile?.points ?? 0}</Text>
                <Text style={styles.statsMetricLabel}>Pontos</Text>
              </View>
              <View style={styles.statsMetric}>
                <Text style={styles.statsMetricValue}>{userProfile?.completedTasks ?? 0}</Text>
                <Text style={styles.statsMetricLabel}>Feitas</Text>
              </View>
            </View>
            <View style={styles.levelTrack}>
              <View style={[styles.levelFill, { width: `${userProfile?.progressPercent ?? 0}%` }]} />
            </View>
            <Text style={styles.levelHint}>{userProfile?.pointsToNextLevel ?? 0} pts para o proximo nivel</Text>
          </View>

          <View style={styles.addFriendContainer}>
            <TextInput
              style={styles.addFriendInput}
              value={friendCodeInput}
              onChangeText={setFriendCodeInput}
              placeholder="Digite o codigo do amigo"
              placeholderTextColor="#888"
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.addFriendButton} onPress={() => void handleAddFriend()}>
              <Text style={styles.addFriendButtonText}>{isAddingFriend ? 'Adicionando...' : 'Adicionar'}</Text>
            </TouchableOpacity>
          </View>

          {friends.length > 0 ? (
            <View style={styles.friendsListContainer}>
              <Text style={styles.friendsListTitle}>Meus amigos</Text>
              {friends.map((friendName) => (
                <Text key={friendName} style={styles.friendItemText}>
                  {friendName}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Tarefas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/ranking')}>
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Ranking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d0d0d0',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  profileSection: {
    backgroundColor: '#a8a8a8',
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarEmoji: {
    fontSize: 60,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  friendCodeCard: {
    width: '82%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  friendCodeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  friendCodeSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '600',
  },
  friendCodeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 6,
  },
  friendCodeHint: {
    fontSize: 11,
    color: '#6b7280',
  },
  statsCard: {
    width: '82%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsMetric: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statsMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  statsMetricLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  levelTrack: {
    marginTop: 12,
    height: 8,
    backgroundColor: '#d1d5db',
    borderRadius: 999,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },
  levelHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
  },
  addFriendContainer: {
    width: '82%',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  addFriendInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    color: '#000',
  },
  addFriendButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  friendsListContainer: {
    width: '82%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  friendsListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  friendItemText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
});
