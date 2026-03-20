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
import * as ImagePicker from 'expo-image-picker';
import {
  apiAnalyzeTaskPhoto,
  apiCompleteTask,
  apiGetTasks,
  apiUploadTaskPhoto,
  type ApiUser,
  type ApiTask,
} from '@/lib/api';
import { getCurrentUser, loadCurrentUser } from '@/lib/sessionStore';

export default function DashboardScreen() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<ApiTask[]>([]);
  const [selectedPhotoUri, setSelectedPhotoUri] = React.useState<string | null>(null);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [savingTask, setSavingTask] = React.useState(false);
  const [analyzingTaskId, setAnalyzingTaskId] = React.useState<number | null>(null);
  const [currentUser, setCurrentUser] = React.useState<ApiUser | null>(getCurrentUser());

  React.useEffect(() => {
    void (async () => {
      const user = getCurrentUser() ?? (await loadCurrentUser());
      setCurrentUser(user);
    })();
  }, []);

  const loadTasks = React.useCallback(async () => {
    if (!currentUser) {
      setLoadingTasks(false);
      return;
    }

    try {
      setLoadingTasks(true);
      const fetchedTasks = await apiGetTasks(currentUser.id);
      setTasks(fetchedTasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar tarefas.';
      Alert.alert('Erro', message);
    } finally {
      setLoadingTasks(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

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

    if (!selectedPhotoUri) {
      Alert.alert('Foto obrigatoria', 'Escolha uma foto da galeria ou tire uma foto.');
      return;
    }

    try {
      setSavingTask(true);
      await apiUploadTaskPhoto(currentUser.id, selectedPhotoUri);
      setSelectedPhotoUri(null);
      await loadTasks();
      Alert.alert('Tarefa criada', 'Tarefa por foto cadastrada com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel cadastrar tarefa.';
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
      const message = error instanceof Error ? error.message : 'Nao foi possivel concluir tarefa.';
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
      Alert.alert('Erro', message);
    } finally {
      setAnalyzingTaskId(null);
    }
  };

  const renderTask = ({ item }: { item: ApiTask }) => (
    <View style={styles.taskCard}>
      <Image source={{ uri: item.photoUrl }} style={styles.taskPhoto} contentFit="cover" />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>Tarefa #{item.id}</Text>
        <Text style={styles.taskPoints}>{item.completed ? 'Concluida' : 'Pendente'}</Text>
        {item.analysis ? <Text style={styles.analysisText}>{item.analysis}</Text> : null}

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={() => void handleAnalyzeTask(item.id)}
          disabled={analyzingTaskId === item.id}>
          <Text style={styles.analyzeButtonText}>
            {analyzingTaskId === item.id ? 'Reconhecendo...' : 'Reconhecer foto'}
          </Text>
        </TouchableOpacity>
      </View>
      {!item.completed && (
        <TouchableOpacity
          onPress={() => void handleCompleteTask(item.id)}
          style={styles.concludeButton}>
          <Text style={styles.concludeButtonText}>Concluir</Text>
        </TouchableOpacity>
      )}
      {item.completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Acompanhe seu progresso</Text>
            <Text style={styles.progressPoints}>{completedCount}/{tasks.length}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Create Task */}
        <View style={styles.createTaskSection}>
          <Text style={styles.createTaskTitle}>Cadastrar tarefa por foto</Text>

          {selectedPhotoUri ? (
            <Image source={{ uri: selectedPhotoUri }} style={styles.previewPhoto} contentFit="cover" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>Nenhuma foto selecionada</Text>
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
              {savingTask ? 'Cadastrando...' : 'Cadastrar tarefa'}
            </Text>
          </TouchableOpacity>
        </View>

        {loadingTasks && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Carregando tarefas...</Text>
          </View>
        )}

        {!loadingTasks && tasks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sem tarefas cadastradas ainda.</Text>
          </View>
        )}

          </>
        }
        ListFooterComponent={
          <>

        {/* Test Button */}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
  },
  previewPlaceholderText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
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
