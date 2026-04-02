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
import { clearCurrentSession, getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

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
      const message = error instanceof Error ? error.message : 'Falha ao carregar tarefas.';
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
        await clearCurrentSession();
        router.replace('/login');
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
      const message = error instanceof Error ? error.message : 'Falha ao carregar progresso.';
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
        await clearCurrentSession();
        router.replace('/login');
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
      const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar tarefa.';
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
        await clearCurrentSession();
        router.replace('/login');
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
      const message = error instanceof Error ? error.message : 'Nao foi possivel concluir tarefa.';
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
        await clearCurrentSession();
        router.replace('/login');
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
      const message = error instanceof Error ? error.message : 'Nao foi possivel analisar a foto.';
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
        await clearCurrentSession();
        router.replace('/login');
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
    <View style={styles.taskCard}>
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
        <TouchableOpacity onPress={() => void handleCompleteTask(item.id)} style={styles.concludeButton}>
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
                <TouchableOpacity style={styles.secondaryButton} onPress={() => void handlePickFromGallery()}>
                  <Text style={styles.secondaryButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.createTaskButton, savingTask && styles.disabledButton]}
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
              onPress={() => router.push('/ranking')}
              activeOpacity={0.8}>
              <Text style={styles.testButtonText}>Ver ranking</Text>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
          </>
        }
      />

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
    backgroundColor: '#e8e8e8',
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
  progressSection: {
    backgroundColor: '#d0d0d0',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  progressHint: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  progressPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#b8b8b8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 5,
  },
  progressMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressMetaText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
  summaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  summaryMetric: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  summaryMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  summaryMetricLabel: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 10,
  },
  createTaskSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#efefef',
  },
  createTaskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  activitySuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  activityChip: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activityChipSelected: {
    backgroundColor: '#22C55E',
  },
  activityChipText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  activityChipTextSelected: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111',
    marginBottom: 10,
  },
  previewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  previewPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#d9d9d9',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewPlaceholderText: {
    fontSize: 13,
    color: '#444',
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
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  createTaskButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTaskButtonText: {
    color: '#fff',
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
    color: '#333',
    marginTop: 8,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#444',
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
    color: '#111827',
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 16,
  },
  taskPhoto: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  taskPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskPhotoPlaceholderText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#374151',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  taskMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  analysisText: {
    fontSize: 12,
    color: '#1f2937',
    marginTop: 6,
    marginBottom: 8,
  },
  analyzeButton: {
    backgroundColor: '#111827',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  concludeButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  concludeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});
