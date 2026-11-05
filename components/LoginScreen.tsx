// components/LoginScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';

type LoginScreenProps = {
  theme: any;
  onLoginSuccess: (userName: string, userId: string) => void;
};

export default function LoginScreen({ theme, onLoginSuccess }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!usernameInput.trim()) {
      Alert.alert('Attenzione', 'Inserisci un nome utente valido');
      return;
    }

    const nomeUtente = usernameInput.trim();

    try {
      setLoading(true);

      // Controlla se l'utente esiste già nella tabella 'utente'
      let { data: existingUser, error: searchError } = await supabase
        .from('utente')
        .select('*')
        .eq('nome', nomeUtente)
        .maybeSingle();

      let userId: string;

      if (!existingUser) {
        // Se non esiste, lo registra inserendolo nella tabella 'utente'
        const { data: newUser, error: insertError } = await supabase
          .from('utente')
          .insert([{ nome: nomeUtente }])
          .select()
          .single();

        if (insertError) throw insertError;
        userId = newUser.id.toString();
      } else {
        userId = existingUser.id.toString();
      }

      onLoginSuccess(nomeUtente, userId);
    } catch (e: any) {
      Alert.alert('Errore di accesso', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.textMain, marginBottom: 20 }]}>
          Scadenzario Espresso
        </Text>
        <Text style={{ color: theme.textSecondary, marginBottom: 10 }}>
          Inserisci il tuo nome per accedere o registrarti:
        </Text>
        <TextInput
          style={[
            styles.inputTitle,
            {
              backgroundColor: theme.cardBackground,
              color: theme.textMain,
              borderColor: theme.inputBorder,
            },
          ]}
          placeholder="Il tuo nome..."
          placeholderTextColor="#888"
          value={usernameInput}
          onChangeText={setUsernameInput}
        />
        <TouchableOpacity
          style={[styles.addBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.addBtnText}>{loading ? 'Accesso...' : 'Accedi'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputTitle: {
    width: '80%',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  addBtn: {
    backgroundColor: '#007AFF',
    width: '80%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});