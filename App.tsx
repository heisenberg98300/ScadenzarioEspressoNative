import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

// Definizione del tipo per gli elementi della lista
type ExpiryItem = {
  id: string;
  title: string;
  expiryDate: string;
};

export default function App() {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [title, setTitle] = useState<string>('');
  const [days, setDays] = useState<string>('7');

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem('@scadenze_list');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Errore caricamento dati', e);
    }
  };

  const saveItems = async (data: ExpiryItem[]) => {
    try {
      await AsyncStorage.setItem('@scadenze_list', JSON.stringify(data));
    } catch (e) {
      console.log('Errore salvataggio dati', e);
    }
  };

  const addItem = () => {
    if (!title.trim()) {
      Alert.alert('Attenzione', 'Inserisci un nome per il prodotto');
      return;
    }

    const numDays = parseInt(days, 10) || 0;
    const calculatedDate = dayjs().add(numDays, 'day').format('YYYY-MM-DD');

    const newItem: ExpiryItem = {
      id: Date.now().toString(),
      title: title.trim(),
      expiryDate: calculatedDate,
    };

    setItems([...items, newItem]);
    setTitle('');
  };

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
  };

  const renderItem = ({ item }: { item: ExpiryItem }) => {
    const today = dayjs().startOf('day');
    const expiry = dayjs(item.expiryDate).startOf('day');
    const diffDays = expiry.diff(today, 'day');

    let badgeColor = '#4CAF50';
    let statusText = `Scade tra ${diffDays} gg`;

    if (diffDays < 0) {
      badgeColor = '#F44336';
      statusText = 'SCADUTO!';
    } else if (diffDays <= 3) {
      badgeColor = '#FF9800';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDate}>Data: {item.expiryDate}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{statusText}</Text>
        </View>

        <TouchableOpacity
          onPress={() => removeItem(item.id)}
          style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>☕ Scadenzario Espresso</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputTitle}
            placeholder="Nome prodotto (es. Latte)"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.inputDays}
            placeholder="GG"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nessuna scadenza inserita.</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputTitle: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
  },
  inputDays: {
    width: 60,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    color: '#999',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 15,
  },
});