import React from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import {
  apiAnalyzeTaskPhoto,
  apiCompleteTask,
  apiCreateTask,
  apiGetTasks,
  apiGetUserById,
  apiUploadTaskPhoto,
  type ApiTask,
  type ApiUser,
  type ApiUserProfile,
} from '@/lib/api';
import { getErrorMessage, redirectToLoginOnAuthError } from '@/lib/errorHandling';
import { getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

const ACTIVITY_SUGGESTIONS = [
  'Estudar por 30 minutos',
  'Caminhada de 20 minutos',
  'Treino rapido',
  'Ler um capitulo',
  'Organizar o quarto',
  'Planejar o dia',
];

type TaskListItem =
  | { type: 'section'; id: string; title: string; subtitle: string }
  | { type: 'task'; id: string; task: ApiTask };

export default function DashboardScreen() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<ApiTask[]>([]);
  const [selectedPhotoUri, setSelectedPhotoUri] = React.useState<string | null>(null);
  const [activityName, setActivityName] = React.useState('');
  const [scheduledForInput, setScheduledForInput] = React.useState('');
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [savingTask, setSavingTask] = React.useState(false);
  const [analyzingTaskId, setAnalyzingTaskId] = React.useState<number | null>(null);
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

  const loadTasks = React.useCallback(async () => {
    if (!currentUser) {
      setLoadingTasks(false);
      setTasks([]);
      return;
    }

    try {
      setLoadingTasks(true);
      const fetchedTasks = await apiGetTasks(currentUser.id);
      setTasks(fetchedTasks);
    } catch (error) {
      const message = getErrorMessage(error, 'Falha ao carregar tarefas.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    } finally {
      setLoadingTasks(false);
    }
  }, [currentUser, router]);

  const loadProfile = React.useCallback(async () => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await apiGetUserById(currentUser.id);
      setUserProfile(profile);
    } catch (error) {
      const message = getErrorMessage(error, 'Falha ao carregar progresso.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    }
  }, [currentUser, router]);

  React.useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

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

  const listItems: TaskListItem[] = [
    {
      type: 'section',
      id: 'planned-section',
      title: 'Atividades programadas',
      subtitle: `${plannedTasks.length} pendentes`,
    },
    ...plannedTasks.map((task) => ({ type: 'task' as const, id: `planned-${task.id}`, task })),
    {
      type: 'section',
      id: 'completed-section',
      title: 'Atividades feitas',
      subtitle: `${completedTasks.length} concluidas`,
    },
    ...completedTasks.map((task) => ({ type: 'task' as const, id: `completed-${task.id}`, task })),
  ];

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao negada', 'Permita acesso a galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissao negada', 'Permita acesso a camera para tirar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedPhotoUri(result.assets[0].uri);
    }
  };

  const handleCreateTask = async () => {
    if (!currentUser) {
      Alert.alert('Sessao nao encontrada', 'Faca login para cadastrar tarefas.');
      return;
    }

    if (!activityName.trim()) {
      Alert.alert('Atividade obrigatoria', 'Descreva a atividade para cadastrar.');
      return;
    }

    const hasPhoto = Boolean(selectedPhotoUri);

    try {
      setSavingTask(true);

      if (selectedPhotoUri) {
        await apiUploadTaskPhoto(
          currentUser.id,
          selectedPhotoUri,
          activityName.trim(),
          scheduledForInput.trim() || undefined
        );
      } else {
        await apiCreateTask(currentUser.id, {
          activity: activityName.trim(),
          scheduledFor: scheduledForInput.trim() || undefined,
        });
      }

      setSelectedPhotoUri(null);
      setActivityName('');
      setScheduledForInput('');
      await Promise.all([loadTasks(), loadProfile()]);
      Alert.alert(
        hasPhoto ? 'Tarefa criada' : 'Atividade criada',
        hasPhoto ? 'Tarefa por foto cadastrada com sucesso.' : 'Atividade cadastrada com sucesso.'
      );
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel cadastrar tarefa.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!currentUser) {
      Alert.alert('Sessao nao encontrada', 'Faca login para concluir tarefas.');
      return;
    }

    try {
      await apiCompleteTask(currentUser.id, taskId);
      await Promise.all([loadTasks(), loadProfile()]);
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel concluir tarefa.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    }
  };

  const handleAnalyzeTask = async (taskId: number) => {
    if (!currentUser) {
      Alert.alert('Sessao nao encontrada', 'Faca login para reconhecer a foto.');
      return;
    }

    try {
      setAnalyzingTaskId(taskId);
      const updatedTask = await apiAnalyzeTaskPhoto(currentUser.id, taskId);
      setTasks((previousTasks) =>
        previousTasks.map((task) => (task.id === taskId ? { ...task, analysis: updatedTask.analysis } : task))
      );
      Alert.alert('Analise concluida', updatedTask.analysis || 'Sem detalhes retornados.');
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel analisar a foto.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
    } finally {
      setAnalyzingTaskId(null);
    }
  };

  const formatScheduledFor = (scheduledFor?: string | null) => {
    if (!scheduledFor) {
      return 'Sem data programada';
    }

    const parsedDate = new Date(scheduledFor);
    if (Number.isNaN(parsedDate.getTime())) {
      return `Programada: ${scheduledFor}`;
    }

    return `Programada: ${parsedDate.toLocaleDateString('pt-BR')}`;
  };

  const renderTask = ({ item }: { item: ApiTask }) => (
    <View style={styles.taskCard} testID={`dashboard-task-card-${item.id}`}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.taskPhoto} contentFit="cover" />
      ) : (
        <View style={styles.taskPhotoPlaceholder}>
          <Text style={styles.taskPhotoPlaceholderText}>SEM FOTO</Text>
        </View>
      )}
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.activity}</Text>
        <Text style={styles.taskPoints}>{item.completed ? 'Concluida' : 'Pendente'} • +{item.points} pts</Text>
        <Text style={styles.taskMeta}>{formatScheduledFor(item.scheduledFor)}</Text>
        {!item.photoUrl ? <Text style={styles.taskMeta}>Foto opcional nao enviada</Text> : null}
        {item.analysis ? <Text style={styles.analysisText}>{item.analysis}</Text> : null}

        {item.photoUrl ? (
          <TouchableOpacity
            style={[styles.analyzeButton, analyzingTaskId === item.id && styles.disabledButton]}
            onPress={() => void handleAnalyzeTask(item.id)}
            disabled={analyzingTaskId === item.id}>
            <Text style={styles.analyzeButtonText}>
              {analyzingTaskId === item.id ? 'Reconhecendo...' : 'Reconhecer foto'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {!item.completed ? (
        <TouchableOpacity testID={`dashboard-task-complete-${item.id}`} onPress={() => void handleCompleteTask(item.id)} style={styles.concludeButton}>
          <Text style={styles.concludeButtonText}>Concluir</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}
    </View>
  );

  const renderListItem = ({ item }: { item: TaskListItem }) => {
    if (item.type === 'section') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>{item.title}</Text>
          <Text style={styles.sectionHeaderSubtitle}>{item.subtitle}</Text>
        </View>
      );
    }

    return renderTask({ item: item.task });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listItems}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('@/img/neuroxp.jpeg')} style={styles.logo} contentFit="contain" />
              </View>
              <Text style={styles.headerTitle}>NeuroXP</Text>
            </View>

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

            <View style={styles.createTaskSection}>
              <Text style={styles.createTaskTitle}>Cadastrar atividade</Text>

              <TextInput
                testID="dashboard-activity-input"
                value={activityName}
                onChangeText={setActivityName}
                placeholder="Ex: Caminhada de 30 minutos"
                placeholderTextColor="#888"
                style={styles.textInput}
              />

              <View style={styles.activitySuggestionsRow}>
                {ACTIVITY_SUGGESTIONS.map((suggestion) => {
                  const selected = activityName.trim().toLowerCase() === suggestion.toLowerCase();

                  return (
                    <TouchableOpacity
                      key={suggestion}
                      style={[styles.activityChip, selected && styles.activityChipSelected]}
                      onPress={() => setActivityName(suggestion)}>
                      <Text style={[styles.activityChipText, selected && styles.activityChipTextSelected]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                testID="dashboard-scheduled-input"
                value={scheduledForInput}
                onChangeText={setScheduledForInput}
                placeholder="Data programada (AAAA-MM-DD) opcional"
                placeholderTextColor="#888"
                style={styles.textInput}
                autoCapitalize="none"
              />

              {selectedPhotoUri ? (
                <Image source={{ uri: selectedPhotoUri }} style={styles.previewPhoto} contentFit="cover" />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Text style={styles.previewPlaceholderText}>
                    Nenhuma foto selecionada. A atividade pode ser salva sem imagem.
                  </Text>
                </View>
              )}

              <View style={styles.imageActionRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleTakePhoto()}>
                  <Text style={styles.secondaryButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} testID="dashboard-gallery-button" onPress={() => void handlePickFromGallery()}>
                  <Text style={styles.secondaryButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.createTaskButton, savingTask && styles.disabledButton]}
                testID="dashboard-save-task-button"
                onPress={() => void handleCreateTask()}
                disabled={savingTask}
                activeOpacity={0.8}>
                <Text style={styles.createTaskButtonText}>
                  {savingTask ? 'Cadastrando...' : 'Salvar atividade'}
                </Text>
              </TouchableOpacity>
            </View>

            {loadingTasks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>Carregando tarefas...</Text>
              </View>
            ) : null}

            {!loadingTasks && tasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Sem tarefas cadastradas ainda.</Text>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.testButton}
              testID="dashboard-view-ranking-button"
              onPress={() => router.push('/ranking')}
              activeOpacity={0.8}>
              <Text style={styles.testButtonText}>Ver ranking</Text>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
          </>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-home" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="dashboard-nav-tasks" onPress={() => router.push('/dashboard')}>
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
  listContent: {
    paddingBottom: 110,
  },
  createTaskSection: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#151C2E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  createTaskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  activitySuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  activityChip: {
    backgroundColor: '#0D1728',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activityChipSelected: {
    backgroundColor: '#00E5A0',
  },
  activityChipText: {
    fontSize: 12,
    color: '#AAB3C9',
    fontWeight: '600',
  },
  activityChipTextSelected: {
    color: '#0F172A',
  },
  textInput: {
    backgroundColor: '#111B2C',
    borderWidth: 1,
    borderColor: '#24304C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 10,
  },
  previewPhoto: {
    width: '100%',
    height: 170,
    borderRadius: 18,
    marginBottom: 10,
  },
  previewPlaceholder: {
    width: '100%',
    height: 170,
    backgroundColor: '#111B2C',
    borderRadius: 18,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewPlaceholderText: {
    fontSize: 13,
    color: '#7C8CBF',
    fontWeight: '600',
    textAlign: 'center',
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#192338',
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  createTaskButton: {
    backgroundColor: '#00E5A0',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  createTaskButtonText: {
    color: '#0F172A',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C8CBF',
    marginTop: 8,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#111B2C',
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7C8CBF',
    fontSize: 13,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: '#7C8CBF',
    marginTop: 2,
  },
  taskCard: {
    backgroundColor: '#131C2B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#24304C',
  },
  taskPhoto: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#172336',
  },
  taskPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#192338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskPhotoPlaceholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C8CBF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E5A0',
  },
  taskMeta: {
    fontSize: 11,
    color: '#7C8CBF',
    marginTop: 2,
  },
  analysisText: {
    fontSize: 12,
    color: '#AAB3C9',
    marginTop: 6,
    marginBottom: 8,
  },
  analyzeButton: {
    backgroundColor: '#0E1728',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  analyzeButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  concludeButton: {
    backgroundColor: '#00E5A0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  concludeButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#00E5A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#0F172A',
    fontSize: 16,
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
  testButton: {
    backgroundColor: '#00E5A0',
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 12 },
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
});
