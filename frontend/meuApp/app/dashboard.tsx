import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  apiGetTasks,
  apiGetUserById,
  type ApiTask,
  type ApiUser,
  type ApiUserProfile,
} from '@/lib/api';
import { getErrorMessage, redirectToLoginOnAuthError } from '@/lib/errorHandling';
import { getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

export default function DashboardScreen() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<ApiTask[]>([]);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<ApiUser | null>(getCurrentUser());
  const [userProfile, setUserProfile] = React.useState<ApiUserProfile | null>(null);

  React.useEffect(() => {
    void (async () => {
      const user = getCurrentUser() ?? (await loadCurrentUser());
      if (!user) {
        router.replace('/login');
        return;
      }

      setCurrentUser(user);
    })();
  }, [router]);

  const loadProfile = React.useCallback(async () => {
    if (!currentUser) {
      setUserProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const profile = await apiGetUserById(currentUser.id);
      setUserProfile(profile);

      const fetchedTasks = await apiGetTasks(currentUser.id);
      setTasks(fetchedTasks);
    } catch (error) {
      const message = getErrorMessage(error, 'Falha ao carregar perfil.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser, router]);

  useFocusEffect(
    React.useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const plannedTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const completedCount = userProfile?.completedTasks ?? completedTasks.length;
  const totalTasks = userProfile?.totalTasks ?? tasks.length;
  const totalPoints =
    userProfile?.points ?? completedTasks.reduce((sum, task) => sum + task.points, 0);
  const progressPercent = userProfile?.progressPercent ?? 0;
  const taskPoints =
    userProfile?.taskPoints ?? completedTasks.reduce((sum, task) => sum + task.points, 0);
  const friendsCount = userProfile?.friendsCount ?? 0;
  const level = userProfile?.level ?? 1;
  const pointsToNextLevel = userProfile?.pointsToNextLevel ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('@/img/logo.png')} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={styles.headerTitle}>NeuroXP</Text>
        </View>

        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        ) : (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Nivel {level}</Text>
                  <Text style={styles.progressHint}>{totalPoints} pts acumulados</Text>
                </View>
                <Text style={styles.progressPoints}>{completedCount}/{totalTasks}</Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>{pointsToNextLevel} pts para subir</Text>
                <Text style={styles.progressMetaText}>{friendsCount} amigos</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>{taskPoints}</Text>
                  <Text style={styles.summaryMetricLabel}>Pts tarefas</Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>{completedCount}</Text>
                  <Text style={styles.summaryMetricLabel}>Concluidas</Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricValue}>{userProfile?.pendingTasks ?? plannedTasks.length}</Text>
                  <Text style={styles.summaryMetricLabel}>Pendentes</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.quickAccessButton}
              testID="dashboard-quick-tasks"
              onPress={() => router.push('/tasks')}
              activeOpacity={0.8}>
              <Text style={styles.quickAccessIcon}>✓</Text>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Minhas Tarefas</Text>
                <Text style={styles.quickAccessSubtitle}>{plannedTasks.length} pendentes</Text>
              </View>
              <Text style={styles.quickAccessArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessButton}
              testID="dashboard-quick-ranking"
              onPress={() => router.push('/ranking')}
              activeOpacity={0.8}>
              <Text style={styles.quickAccessIcon}>🏆</Text>
              <View style={styles.quickAccessContent}>
                <Text style={styles.quickAccessTitle}>Ranking</Text>
                <Text style={styles.quickAccessSubtitle}>Veja como você se compara</Text>
              </View>
              <Text style={styles.quickAccessArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-home" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-tasks" onPress={() => router.push('/tasks')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Tarefas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-ranking" onPress={() => router.push('/ranking')}>
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Ranking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-profile" onPress={() => router.push('/profile')}>
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
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
  progressSection: {
    backgroundColor: '#151C2E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  progressHint: {
    fontSize: 12,
    color: '#7C8CBF',
    marginTop: 4,
  },
  progressPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00E5A0',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#152A44',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00E5A0',
    borderRadius: 999,
  },
  progressMetaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 12,
    color: '#7C8CBF',
    fontWeight: '600',
  },
  summaryRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  summaryMetric: {
    flex: 1,
    backgroundColor: '#192338',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  summaryMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  summaryMetricLabel: {
    fontSize: 11,
    color: '#7C8CBF',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C8CBF',
    marginTop: 8,
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151C2E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  quickAccessIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  quickAccessContent: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: '#7C8CBF',
    marginTop: 2,
  },
  quickAccessArrow: {
    fontSize: 18,
    color: '#00E5A0',
    marginLeft: 12,
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
    paddingBottom: 12,
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
