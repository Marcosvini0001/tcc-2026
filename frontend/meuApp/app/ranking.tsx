import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { apiGetRanking, type ApiRankingUser } from '@/lib/api';
import { getCurrentUser } from '@/lib/sessionStore';

export default function RankingScreen() {
  const router = useRouter();
  const [ranking, setRanking] = React.useState<ApiRankingUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const currentUser = getCurrentUser();

  const loadRanking = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetRanking();
      setRanking(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar ranking.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  const renderFriend = ({ item }: { item: ApiRankingUser }) => {
    const isCurrentUser = currentUser?.id === item.id;

    return (
      <View style={[styles.friendCard, isCurrentUser && styles.currentUserCard]}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}º</Text>
      </View>
      <Text style={styles.avatar}>👤</Text>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendLevel}>Nivel {item.level}</Text>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={styles.starIcon}>⭐</Text>
        <Text style={styles.points}>{item.points}pts</Text>
      </View>
      <View style={styles.pointsGainContainer}>
        <Text style={styles.pointsGain}>{item.friendsCount} amigos</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/img/neuroxp.jpeg')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={styles.headerTitle}>NeuroXP</Text>
        </View>

        {/* List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Ranking real (banco de dados)</Text>
        </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Carregando ranking...</Text>
              </View>
            )}

            {!loading && ranking.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Ainda nao ha usuarios no ranking.</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <>

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}>
          <Text style={styles.testButtonText}>Ver perfil</Text>
        </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} onPress={() => void loadRanking()}>
              <Text style={styles.refreshButtonText}>Atualizar ranking</Text>
            </TouchableOpacity>

        <View style={{ height: 80 }} />
          </>
        }
      />

      {/* Bottom Navigation */}
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
  currentUserCard: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
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
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pointsGain: {
    fontSize: 12,
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
