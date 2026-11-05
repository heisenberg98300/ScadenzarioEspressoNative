import 'react-native-get-random-values';

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://fldrcsyvvdkawdvsiqb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_LtXa3VE1s305Rk8Shv5S0g_JGne27MZ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'scadenzario-espresso-react-native',
    },
  },
});