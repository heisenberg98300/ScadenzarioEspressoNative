import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { calcolaGiorniMancanti } from './utils/dateUtils';
import { Colors } from './utils/theme';
import ThemeToggleButton from './components/ThemeToggleButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from './utils/supabase';
import LoginScreen from './components/LoginScreen';

type ExpiryItem = {
  id: string;
  title: string;
  expiry_date: string;
  id_utente?: string;
};

export default function App() {
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [title, setTitle] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUserPreference();
    loadThemePreference();
  }, []);

  const loadUserPreference = async () => {
    try {
      const savedName = await AsyncStorage.getItem('@current_user_name');
      const savedId = await AsyncStorage.getItem('@current_user_id');
      if (savedName && savedId) {
        setCurrentUserName(savedName);
        setCurrentUserId(savedId);
        loadItems(savedId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.log('Errore caricamento utente', e);
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (userName: string, userId: string) => {
    setCurrentUserName(userName);
    setCurrentUserId(userId);
    await AsyncStorage.setItem('@current_user_name', userName);
    await AsyncStorage.setItem('@current_user_id', userId);
    loadItems(userId);
  };

  const handleLogout = async () => {
    setCurrentUserName(null);
    setCurrentUserId(null);
    setItems([]);
    await AsyncStorage.removeItem('@current_user_name');
    await AsyncStorage.removeItem('@current_user_id');
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleTheme = async (value: boolean) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem('@theme_dark', JSON.stringify(value));
    } catch (e) {
      console.log('Errore salvataggio tema', e);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_dark');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (e) {
      console.log('Errore caricamento tema', e);
    }
  };

  const loadItems = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scadenze')
        .select('*')
        .eq('id_utente', userId) // Filtra usando la chiave esterna numerica
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      
      if (data) {
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          expiry_date: item.expiry_date,
          id_utente: item.id_utente,
        }));
        setItems(formattedData);
      }
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!title.trim()) {
      Alert.alert('Attenzione', 'Inserisci un nome per il prodotto');
      return;
    }
    if (!currentUserId) return;

    const newId = Date.now().toString();
    const formattedDate = dayjs(date).format('YYYY-MM-DD');

    const newItem: ExpiryItem = {
      id: newId,
      title: title.trim(),
      expiry_date: formattedDate,
      id_utente: currentUserId,
    };

    const { error } = await supabase.from('scadenze').insert([
      {
        id: newId,
        title: newItem.title,
        expiry_date: newItem.expiry_date,
        id_utente: currentUserId, // Associa l'ID numerico dell'utente
      },
    ]);

    if (error) {
      Alert.alert('Errore', 'Impossibile salvare online: ' + error.message);
      return;
    }

    setItems([...items, newItem]);
    setTitle('');
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase
      .from('scadenze')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert('Errore', 'Impossibile eliminare dal cloud');
      return;
    }

    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
  };

  const renderItem = ({ item }: { item: ExpiryItem }) => {
    const today = dayjs().startOf('day');
    const expiry = dayjs(item.expiry_date).startOf('day');
    const diffDays = expiry.diff(today, 'day');

    let badgeColor = '#4CAF50';
    if (diffDays < 0) {
      badgeColor = '#F44336';
    } else if (diffDays <= 3) {
      badgeColor = '#FF9800';
    }

    const statusText = calcolaGiorniMancanti(item.expiry_date);
    
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.itemTitle, { color: theme.textMain }]}>{item.title}</Text>
          <Text style={[styles.itemDate, { color: theme.textSecondary }]}>Data: {item.expiry_date}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{statusText}</Text>
        </View>

        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Se l'utente non è loggato, mostra il componente LoginScreen separato
  if (!currentUserName || !currentUserId) {
    return <LoginScreen theme={theme} onLoginSuccess={handleLoginSuccess} />;
  }

  // Schermata principale (Dashboard)
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Image source={require('./assets/icon.png')} style={styles.headerIcon} />
            <View>
              <Text style={[styles.headerTitle, { color: theme.textMain }]}>Scadenzario</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                Utente: {currentUserName} (<Text style={{color: '#007AFF'}} onPress={handleLogout}>cambia</Text>)
              </Text>
            </View>
          </View>

          <ThemeToggleButton
            isDarkMode={isDarkMode}
            onToggle={() => toggleTheme(!isDarkMode)}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.inputTitle, { backgroundColor: theme.cardBackground, color: theme.textMain, borderColor: theme.inputBorder }]}
            placeholder="Nome prodotto (es. Latte)"
            placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
            value={title}
            onChangeText={setTitle}
          />
          
          <TouchableOpacity 
            style={[styles.datePickerBtn, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: theme.textMain }}>
              {dayjs(date).format('YYYY-MM-DD')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}

          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nessuna scadenza presente.
              </Text>
            }
          />
        )}
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
  datePickerBtn: {
    width: 130,
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#000',
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});