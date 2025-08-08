import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ========================================================================
// 1. KONFIGURASI FIREBASE
// PENTING: Ganti dengan kredensial dari proyek Firebase Anda.
// Anda bisa menemukannya di Project Settings > General > Your apps
// ========================================================================
const firebaseConfig = {
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYc5nc-ZnTyza4lIFFBBzE2l0U2T-bdrM",
  authDomain: "pemilossmaba.firebaseapp.com",
  projectId: "pemilossmaba",
  storageBucket: "pemilossmaba.firebasestorage.app",
  messagingSenderId: "440944032139",
  appId: "1:440944032139:web:a9c53c121940235cd0578e",
  measurementId: "G-1YLVHKH3NV"
};

// Cek apakah konfigurasi sudah diisi atau masih placeholder
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Inisialisasi Firebase hanya jika sudah dikonfigurasi
let auth, db;
if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // Inisialisasi Firestore
}

// ========================================================================
// Komponen Halaman Login
// ========================================================================
const LoginPage = ({ onLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Email dan password tidak boleh kosong.");
      return;
    }
    onLogin(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Login Pemilos</h1>
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
// Komponen Halaman Admin (Placeholder)
// ========================================================================
const AdminPage = ({ user, onLogout }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold">Dasbor Admin</h1>
                <p>Selamat datang, {user.email}</p>
                <p className="text-sm text-yellow-400">(Halaman ini hanya bisa diakses oleh Admin)</p>
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
// Komponen Halaman Siswa (Placeholder)
// ========================================================================
const StudentPage = ({ user, onLogout }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-gray-800">Halaman Pemilihan</h1>
                <p className="text-gray-600">Selamat datang, {user.email}</p>
                <p className="text-sm text-green-500">(Ini adalah halaman untuk siswa memilih)</p>
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
// Komponen Utama (App) dengan Logika Peran
// ========================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Loading untuk cek auth awal
  const [authLoading, setAuthLoading] = useState(false); // Loading untuk proses login
  const [loginError, setLoginError] = useState('');

  // Cek status login dan peran saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Jika ada pengguna yang login, cek perannya
        const adminDocRef = doc(db, "config", "admins"); // Dokumen berisi daftar UID admin
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data().uids?.includes(currentUser.uid)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setUser(currentUser);
      } else {
        // Tidak ada pengguna
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogin = (email, password) => {
    setAuthLoading(true);
    setLoginError('');
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setLoginError('Email atau password yang Anda masukkan salah.');
        } else {
          setLoginError('Terjadi kesalahan saat login.');
        }
        console.error("Login Error:", error);
        setAuthLoading(false); // Pastikan loading berhenti jika error
      });
      // State akan diupdate oleh onAuthStateChanged
  };

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

  // Tampilan saat sedang memeriksa status login awal
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Memuat...
      </div>
    );
  }

  // Render halaman berdasarkan status login dan peran
  const renderPage = () => {
    if (user) {
      // Jika sudah login, tampilkan halaman sesuai peran
      return isAdmin 
        ? <AdminPage user={user} onLogout={handleLogout} /> 
        : <StudentPage user={user} onLogout={handleLogout} />;
    } else {
      // Jika belum login, tampilkan halaman login
      return <LoginPage onLogin={handleLogin} error={loginError} loading={authLoading} />;
    }
  }

  return (
    <div>
      {renderPage()}
    </div>
  );
}
