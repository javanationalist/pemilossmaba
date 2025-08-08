import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

// ========================================================================
// 1. KONFIGURASI FIREBASE
// PENTING: Ganti dengan kredensial dari proyek Firebase Anda.
// Anda bisa menemukannya di Project Settings > General > Your apps
// ========================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Cek apakah konfigurasi sudah diisi atau masih placeholder
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Inisialisasi Firebase hanya jika sudah dikonfigurasi
let auth;
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

// ========================================================================
// Komponen Halaman Login
// ========================================================================
const LoginPage = ({ onLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); // Mencegah form refresh halaman
    if (!email || !password) {
      alert("Email dan password tidak boleh kosong.");
      return;
    }
    onLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>
        {error && (
          <p className="text-sm text-center text-red-600 bg-red-100 p-2 rounded-md">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================================================================
// Komponen Halaman Utama (Setelah Login)
// ========================================================================
const HomePage = ({ user, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">Berhasil Masuk!</h1>
        <p className="text-gray-600">Selamat datang kembali,</p>
        <p className="text-lg font-medium text-indigo-600 break-all">{user.email}</p>
        <p className="text-sm text-gray-500">(Ini adalah halaman utama Anda)</p>
        <p className="text-xs text-gray-400 break-all mt-4">UID: {user.uid}</p>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 mt-6 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
        >
          Keluar
        </button>
      </div>
    </div>
  );
};

// ========================================================================
// Komponen Utama (App)
// ========================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Cek status login saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Cleanup listener saat komponen tidak lagi digunakan
    return () => unsubscribe();
  }, []);

  // Fungsi untuk menangani proses login
  const handleLogin = (email, password) => {
    setAuthLoading(true);
    setLoginError('');
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => {
        // Menampilkan pesan error yang lebih mudah dimengerti
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setLoginError('Email atau password yang Anda masukkan salah.');
        } else {
          setLoginError('Terjadi kesalahan saat login.');
        }
        console.error("Login Error:", error);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  };

  // Fungsi untuk menangani proses logout
  const handleLogout = () => {
    signOut(auth);
  };

  // Tampilan jika Firebase belum dikonfigurasi
  if (!isFirebaseConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <div className="p-8 text-center bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">Konfigurasi Error</h1>
          <p className="mt-2 text-gray-700">
            Harap isi konfigurasi Firebase di file `App.jsx` terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  // Tampilan saat sedang memeriksa status login
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Memuat...
      </div>
    );
  }

  // Tampilan utama aplikasi
  return (
    <div>
      {user ? (
        <HomePage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} error={loginError} loading={authLoading} />
      )}
    </div>
  );
}
