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
import {
  apiCompleteTask,
  apiCreateTask,
  apiGetTasks,
  type ApiTask,
  type ApiUser,
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

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<ApiTask[]>([]);
  const [activityName, setActivityName] = React.useState('');
  const [activityDescription, setActivityDescription] = React.useState('');
  const [scheduledForInput, setScheduledForInput] = React.useState('');
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [savingTask, setSavingTask] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<ApiUser | null>(getCurrentUser());

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

  React.useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const plannedTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

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

  const handleCreateTask = async () => {
    if (!currentUser) {
      Alert.alert('Sessao nao encontrada', 'Faca login para cadastrar tarefas.');
      return;
    }

    if (!activityName.trim()) {
      Alert.alert('Atividade obrigatoria', 'Descreva a atividade para cadastrar.');
      return;
    }

    try {
      setSavingTask(true);

      const today = new Date().toISOString().split('T')[0];
      const scheduledDate = scheduledForInput.trim() || today;

      await apiCreateTask(currentUser.id, {
        activity: activityName.trim(),
        description: activityDescription.trim() || null,
        scheduledFor: scheduledDate,
      });

      setActivityName('');
      setActivityDescription('');
      setScheduledForInput('');
      await loadTasks();
      Alert.alert('Atividade criada', 'Atividade cadastrada com sucesso.');
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
      await loadTasks();
    } catch (error) {
      const message = getErrorMessage(error, 'Nao foi possivel concluir tarefa.');
      if (await redirectToLoginOnAuthError(message, router)) {
        return;
      }

      Alert.alert('Erro', message);
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
    <View style={styles.taskCard} testID={`tasks-task-card-${item.id}`}>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.activity}</Text>
        <Text style={styles.taskPoints}>{item.completed ? 'Concluida' : 'Pendente'} • +{item.points} pts</Text>
        <Text style={styles.taskMeta}>{formatScheduledFor(item.scheduledFor)}</Text>
      </View>
      {!item.completed ? (
        <TouchableOpacity testID={`tasks-task-complete-${item.id}`} onPress={() => void handleCompleteTask(item.id)} style={styles.concludeButton}>
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
              <Text style={styles.headerTitle}>Minhas Tarefas</Text>
            </View>

            <View style={styles.createTaskSection}>
              <Text style={styles.createTaskTitle}>Cadastrar atividade</Text>

              <TextInput
                testID="tasks-activity-input"
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
                testID="tasks-description-input"
                value={activityDescription}
                onChangeText={setActivityDescription}
                placeholder="Descrição (opcional)"
                placeholderTextColor="#888"
                style={styles.textInput}
              />

              <TextInput
                testID="tasks-scheduled-input"
                value={scheduledForInput}
                onChangeText={setScheduledForInput}
                placeholder="Data programada (AAAA-MM-DD) opcional"
                placeholderTextColor="#888"
                style={styles.textInput}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.createTaskButton, savingTask && styles.disabledButton]}
                testID="tasks-save-task-button"
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
            <View style={{ height: 80 }} />
          </>
        }
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} testID="tasks-nav-home" onPress={() => router.push('/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="tasks-nav-tasks" onPress={() => router.push('/tasks')}>
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navLabel}>Tarefas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="tasks-nav-ranking" onPress={() => router.push('/ranking')}>
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navLabel}>Ranking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} testID="tasks-nav-profile" onPress={() => router.push('/profile')}>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
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
});
