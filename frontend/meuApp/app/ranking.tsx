import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

interface Friend {
  id: string;
  rank: number;
  name: string;
  level: string;
  points: number;
  pointsGain: string;
  avatar: string;
}

export default function RankingScreen() {
  const router = useRouter();
  const [friends] = React.useState<Friend[]>([
    { id: '1', rank: 1, name: 'João Silva', level: 'Nível 8', points: 1500, pointsGain: '+65', avatar: '👨' },
    { id: '2', rank: 2, name: 'Mariana Silva', level: 'Nível 7', points: 1500, pointsGain: '+65', avatar: '👩' },
    { id: '3', rank: 3, name: 'Jordana', level: 'Nível 6', points: 1500, pointsGain: '+65', avatar: '👩' },
    { id: '4', rank: 4, name: 'Antônio Pereira', level: 'Nível 6', points: 1500, pointsGain: '+65', avatar: '👨' },
    { id: '5', rank: 5, name: 'Vinicius Almeida', level: 'Nível 6', points: 1500, pointsGain: '+65', avatar: '👨' },
  ]);

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}º</Text>
      </View>
      <Text style={styles.avatar}>{item.avatar}</Text>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendLevel}>{item.level}</Text>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={styles.starIcon}>⭐</Text>
        <Text style={styles.points}>{item.points}pts</Text>
      </View>
      <View style={styles.pointsGainContainer}>
        <Text style={styles.pointsGain}>{item.pointsGain}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.listTitle}>Lista de amigos</Text>
        </View>

        {/* Section Badge */}
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Section 2</Text>
        </View>

        {/* Friends List */}
        <View style={styles.friendsSection}>
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}>
          <Text style={styles.testButtonText}>Ver perfil</Text>
        </TouchableOpacity>

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
  sectionBadge: {
    backgroundColor: '#555',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  friendsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
});
