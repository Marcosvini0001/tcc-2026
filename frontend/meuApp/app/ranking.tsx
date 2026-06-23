import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  apiAcceptFriendRequest,
  apiAddFriendByCode,
  apiGetPendingFriendRequests,
  apiGetRanking,
  apiRejectFriendRequest,
  apiRemoveFriend,
  type ApiFriendRequest,
  type ApiRankingUser,
} from '@/lib/api';
import { getErrorMessage, redirectToLoginOnAuthError, showAlert, showConfirm } from '@/lib/errorHandling';
import { getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

export default function RankingScreen() {
  const router = useRouter();
  const [ranking, setRanking] = React.useState<ApiRankingUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [friendCodeInput, setFriendCodeInput] = React.useState('');
  const [isAddingFriend, setIsAddingFriend] = React.useState(false);
  const [pendingRequests, setPendingRequests] = React.useState<ApiFriendRequest[]>([]);

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
      const user = getCurrentUser() ?? (await loadCurrentUser());
      if (!user) {
        router.replace('/login');
        return;
      }

      const [rankingData, pendingRequestsData] = await Promise.all([
        apiGetRanking(),
        apiGetPendingFriendRequests(user.id),
      ]);

      setRanking(rankingData);
      setPendingRequests(pendingRequestsData);
    } catch (error) {
      const message = getErrorMessage(error, 'Falha ao carregar ranking.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      showAlert('Erro', message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  const handleAddFriend = async () => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      showAlert('Sessao nao encontrada', 'Faca login para adicionar amigos.');
      return;
    }

    if (!friendCodeInput.trim()) {
      showAlert('Codigo obrigatorio', 'Digite o codigo do amigo.');
      return;
    }

    try {
      setIsAddingFriend(true);
      const result = await apiAddFriendByCode(user.id, friendCodeInput.trim());
      await loadRanking();
      setFriendCodeInput('');
      if (result.status === 'accepted') {
        showAlert('Amizade confirmada', `${result.friend.name} agora aparece no ranking.`);
      } else {
        showAlert('Convite enviado', `Convite enviado para ${result.friend.name}.`);
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel adicionar amigo.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }
      showAlert('Erro', message);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (request: ApiFriendRequest) => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      showAlert('Sessao nao encontrada', 'Faca login novamente.');
      return;
    }

    try {
      await apiAcceptFriendRequest(user.id, request.requestId);
      await loadRanking();
      showAlert('Convite aceito', `${request.requester.name} foi adicionado ao ranking.`);
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel aceitar o convite.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }
      showAlert('Erro', message);
    }
  };

  const handleRejectRequest = async (request: ApiFriendRequest) => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      showAlert('Sessao nao encontrada', 'Faca login novamente.');
      return;
    }

    try {
      await apiRejectFriendRequest(user.id, request.requestId);
      await loadRanking();
      showAlert('Convite recusado', `Convite de ${request.requester.name} removido.`);
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel recusar o convite.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }
      showAlert('Erro', message);
    }
  };

  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    const user = getCurrentUser() ?? (await loadCurrentUser());
    if (!user) {
      showAlert('Sessao nao encontrada', 'Faca login novamente.');
      return;
    }

    showConfirm('Remover amigo', `Deseja remover ${friendName} do ranking?`, async () => {
      try {
        await apiRemoveFriend(user.id, friendId);
        await loadRanking();
      } catch (error) {
        const message = getErrorMessage(error, 'Nao foi possivel remover amigo.');
        if (await redirectToLoginOnAuthError(message, router)) {
          return;
        }
        showAlert('Erro', message);
      }
    });
  };

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
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => void handleRemoveFriend(item.id, item.name)}
            activeOpacity={0.7}>
            <Text style={styles.removeButtonText}>Remover</Text>
          </TouchableOpacity>
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
                <Image source={require('@/img/logo.png')} style={styles.logo} contentFit="contain" />
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

            <View style={styles.addFriendContainer}>
              <TextInput
                style={styles.addFriendInput}
                testID="ranking-friend-code-input"
                value={friendCodeInput}
                onChangeText={setFriendCodeInput}
                placeholder="Codigo do amigo"
                placeholderTextColor="#888"
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={[styles.addFriendButton, isAddingFriend && { opacity: 0.5 }]}
                testID="ranking-add-friend-button"
                onPress={() => void handleAddFriend()}
                activeOpacity={0.8}
                disabled={isAddingFriend}>
                <Text style={styles.addFriendButtonText}>
                  {isAddingFriend ? '...' : 'Enviar convite'}
                </Text>
              </TouchableOpacity>
            </View>

            {pendingRequests.length > 0 ? (
              <View style={styles.requestsCard}>
                <Text style={styles.requestsTitle}>Convites recebidos</Text>
                {pendingRequests.map((request) => (
                  <View key={request.requestId} style={styles.requestRow}>
                    <Text style={styles.requestName}>{request.requester.name}</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => void handleAcceptRequest(request)}
                        activeOpacity={0.8}>
                        <Text style={styles.requestButtonText}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => void handleRejectRequest(request)}
                        activeOpacity={0.8}>
                        <Text style={styles.requestButtonText}>Recusar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {!loading && ranking.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Adicione amigos pelo codigo para ve-los no ranking!
                </Text>
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
  listHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 10,
    color: '#7C8CBF',
    fontSize: 13,
  },
  emptyContainer: {
    backgroundColor: '#131C2B',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  emptyText: {
    color: '#7C8CBF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  addFriendContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  requestsCard: {
    backgroundColor: '#131C2B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24304C',
    padding: 12,
    marginBottom: 12,
  },
  requestsTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2A40',
  },
  requestName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rejectButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  requestButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  addFriendInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#24304C',
    borderRadius: 14,
    backgroundColor: '#111B2C',
    paddingHorizontal: 14,
    color: '#F8FAFC',
  },
  addFriendButton: {
    backgroundColor: '#00E5A0',
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  friendCard: {
    backgroundColor: '#151C2E',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24304C',
  },
  rankContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0C1725',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFC700',
  },
  avatar: {
    fontSize: 32,
    marginRight: 10,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  friendLevel: {
    fontSize: 12,
    color: '#7C8CBF',
    marginBottom: 8,
  },
  levelTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#152A44',
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00E5A0',
  },
  levelHint: {
    fontSize: 10,
    color: '#7C8CBF',
    marginTop: 6,
  },
  pointsSide: {
    alignItems: 'flex-end',
    marginLeft: 10,
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
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pointsGainContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  pointsGain: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00E5A0',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
  testButton: {
    backgroundColor: '#00E5A0',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  testButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#192338',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
