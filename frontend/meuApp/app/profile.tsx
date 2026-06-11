import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { apiGetFriends, apiGetUserById, type ApiUser, type ApiUserProfile } from '@/lib/api';
import { getErrorMessage, redirectToLoginOnAuthError } from '@/lib/errorHandling';
import { clearCurrentSession, loadCurrentUser } from '@/lib/sessionStore';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentUserName, setCurrentUserName] = React.useState('Usuario');
  const [currentUserCode, setCurrentUserCode] = React.useState('----');
  const [userProfile, setUserProfile] = React.useState<ApiUserProfile | null>(null);
  const [friends, setFriends] = React.useState<ApiUser[]>([]);

  const loadProfile = React.useCallback(async () => {
    const user = await loadCurrentUser();
    if (!user) {
      await clearCurrentSession();
      router.replace('/login');
      return;
    }

    setCurrentUserName(user.name);
    setCurrentUserCode(user.friendCode);

    try {
      const [refreshedUser, friendsList] = await Promise.all([
        apiGetUserById(user.id),
        apiGetFriends(user.id),
      ]);

      setCurrentUserName(refreshedUser.name);
      setCurrentUserCode(refreshedUser.friendCode);
      setUserProfile(refreshedUser);
      setFriends(friendsList);
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel carregar sua lista de amigos.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    }
  }, [router]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    await clearCurrentSession();
    router.replace('/login');
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

          <View style={styles.friendsCard}>
            <Text style={styles.friendsTitle}>Amigos</Text>
            {friends.length === 0 ? (
              <Text style={styles.friendEmptyText}>Nenhum amigo adicionado ainda.</Text>
            ) : (
              friends.map((friend) => (
                <Text key={friend.id} style={styles.friendNameText}>
                  {friend.name}
                </Text>
              ))
            )}
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

          <TouchableOpacity style={styles.logoutButton} testID="profile-logout-button" onPress={() => void handleLogout()}>
            <Text style={styles.logoutButtonText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} testID="profile-nav-home" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="profile-nav-tasks" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Tarefas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="profile-nav-ranking" onPress={() => router.push('/ranking')}>
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Ranking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="profile-nav-profile" onPress={() => router.push('/profile')}>
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
    backgroundColor: '#0A101B',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#131C2B',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2A40',
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  profileSection: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#131C2B',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00E5A0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  friendCodeCard: {
    width: '86%',
    backgroundColor: '#151C2E',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#24304C',
    alignItems: 'center',
  },
  friendCodeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C8CBF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  friendCodeSubtitle: {
    fontSize: 11,
    color: '#7C8CBF',
    marginBottom: 2,
    fontWeight: '600',
  },
  friendCodeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 6,
  },
  friendCodeHint: {
    fontSize: 11,
    color: '#7C8CBF',
  },
  friendsCard: {
    width: '86%',
    backgroundColor: '#151C2E',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  friendsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C8CBF',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  friendEmptyText: {
    fontSize: 13,
    color: '#7C8CBF',
  },
  friendNameText: {
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 6,
  },
  statsCard: {
    width: '86%',
    backgroundColor: '#151C2E',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statsMetric: {
    flex: 1,
    backgroundColor: '#0D1728',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statsMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  statsMetricLabel: {
    fontSize: 11,
    color: '#7C8CBF',
    textAlign: 'center',
    marginTop: 4,
  },
  levelTrack: {
    marginTop: 16,
    height: 10,
    backgroundColor: '#152A44',
    borderRadius: 999,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: '#00E5A0',
    borderRadius: 999,
  },
  levelHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#7C8CBF',
    textAlign: 'center',
  },
  logoutButton: {
    width: '86%',
    backgroundColor: '#00E5A0',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#131C2B',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#24304C',
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
    color: '#7C8CBF',
    fontWeight: '600',
  },
});
