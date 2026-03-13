import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuthStore } from '../src/stores/authStore';
import { useTaskStore } from '../src/stores/taskStore';

interface Task {
  _id: string;
  titulo: string;
  descricao: string;
  xp: number;
  icone: string;
  completed?: boolean;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { tasks, fetchTasks, completeTask } = useTaskStore();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setLocalTasks(tasks.map(task => ({ ...task, completed: false })));
  }, [tasks]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      setLocalTasks(prev => prev.map(task =>
        task._id === taskId ? { ...task, completed: true } : task
      ));
      Alert.alert('Sucesso', 'Tarefa concluída! +50 XP');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao concluir tarefa');
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskIcon}>{item.icone}</Text>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.titulo}</Text>
        <Text style={styles.taskPoints}>+{item.xp}</Text>
      </View>
      {!item.completed && (
        <TouchableOpacity
          onPress={() => handleCompleteTask(item._id)}
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/neuroxp-logo.svg')}
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
            <Text style={styles.progressPoints}>+{user?.xp || 0}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${((user?.xp || 0) % 500) / 5}%` }]} />
          </View>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksSection}>
          <FlatList
            data={localTasks}
            renderItem={renderTask}
            keyExtractor={item => item._id}
            scrollEnabled={false}
          />
        </View>

        {/* History Badge */}
        <View style={styles.historyBadge}>
          <Text style={styles.historyBadgeText}>Histórico tarefas</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

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
    backgroundColor: '#f2f2f2',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
  tasksSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  },
  taskIcon: {
    fontSize: 28,
    marginRight: 12,
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
  historyBadge: {
    backgroundColor: '#FBBF24',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 12,
  },
  historyBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
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
