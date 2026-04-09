import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { apiGetRanking, type ApiRankingUser } from '@/lib/api';
import { getErrorMessage, redirectToLoginOnAuthError } from '@/lib/errorHandling';
import { loadCurrentUser } from '@/lib/sessionStore';

export default function RankingScreen() {
  const router = useRouter();
  const [ranking, setRanking] = React.useState<ApiRankingUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const user = await loadCurrentUser();
      if (!user) {
        router.replace('/login');
      }
    })();
  }, [router]);

  const loadRanking = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetRanking();
      setRanking(data);
    } catch (error) {
      const message = getErrorMessage(error, 'Falha ao carregar ranking.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  const renderFriend = ({ item }: { item: ApiRankingUser }) => {
    return (
      <View style={styles.friendCard} testID={`ranking-card-${item.id}`}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{item.rank}º</Text>
        </View>
        <Text style={styles.avatar}>👤</Text>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendLevel}>Nivel {item.level} • {item.completedTasks} tarefas concluidas</Text>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${item.progressPercent}%` }]} />
          </View>
          <Text style={styles.levelHint}>{item.pointsToNextLevel} pts para o proximo nivel</Text>
        </View>
        <View style={styles.pointsSide}>
          <View style={styles.pointsContainer}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.points}>{item.points} pts</Text>
          </View>
          <View style={styles.pointsGainContainer}>
            <Text style={styles.pointsGain}>{item.taskPoints} pts em tarefas</Text>
            <Text style={styles.pointsGain}>{item.friendsCount} amigos</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={ranking}
        renderItem={renderFriend}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('@/img/neuroxp.jpeg')} style={styles.logo} contentFit="contain" />
              </View>
              <Text style={styles.headerTitle}>NeuroXP</Text>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Ranking dos seus amigos</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Carregando ranking...</Text>
              </View>
            ) : null}

            {!loading && ranking.length <= 1 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Adicione amigos pelo codigo no perfil para ve-los no ranking!
                </Text>
                <TouchableOpacity
                  style={styles.addFriendCta}
                  onPress={() => router.push('/profile')}
                  activeOpacity={0.8}>
                  <Text style={styles.addFriendCtaText}>Adicionar amigos</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.testButton}
              testID="ranking-view-profile-button"
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}>
              <Text style={styles.testButtonText}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} testID="ranking-refresh-button" onPress={() => void loadRanking()}>
              <Text style={styles.refreshButtonText}>Atualizar ranking</Text>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
          </>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} testID="ranking-nav-home" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="ranking-nav-tasks" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Tarefas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="ranking-nav-ranking" onPress={() => router.push('/ranking')}>
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Ranking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="ranking-nav-profile" onPress={() => router.push('/profile')}>
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
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#a8a8a8',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
    fontSize: 13,
  },
  emptyContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  emptyText: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  addFriendCta: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  addFriendCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  friendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  avatar: {
    fontSize: 32,
    marginRight: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  friendLevel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  levelTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22C55E',
  },
  levelHint: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 6,
  },
  pointsSide: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  points: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  pointsGainContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  pointsGain: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22C55E',
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
  testButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 20,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 20,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
