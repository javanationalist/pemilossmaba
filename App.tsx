import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword, // Hanya untuk setup awal oleh Anda
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  writeBatch,
  runTransaction,
  query,
  orderBy,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Konfigurasi Firebase ---
// Ganti dengan konfigurasi Firebase proyek Anda
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// --- Cek Konfigurasi ---
const isFirebaseConfigured =
  firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let app, auth, db, storage;
if (isFirebaseConfigured) {
  // Inisialisasi Firebase hanya jika sudah dikonfigurasi
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// --- Komponen Ikon (SVG) untuk tampilan macOS ---
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);
const ArrowUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);
const ArrowDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);
const BroadcastIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.11 15.89A10 10 0 0 1 2 12C2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10c-1.76 0-3.44-.45-4.9-1.25"></path>
    <path d="M12 12a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2Z"></path>
    <path d="M15.91 15.91a2 2 0 0 0 0-2.82"></path>
    <path d="M8.09 15.91a2 2 0 0 1 0-2.82"></path>
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

// --- Komponen UI/UX bergaya macOS ---

const MacOSWindow = ({ title, children, className }) => (
  <div
    className={`bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full ${className}`}
  >
    <div className="flex items-center h-10 px-4 bg-gray-200/50 dark:bg-gray-900/50">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      <p className="flex-grow text-center text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </p>
    </div>
    <div className="p-6 md:p-8">{children}</div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-11/12 md:w-1/3 max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Button = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm flex items-center justify-center space-x-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  const disabledStyle = "opacity-50 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className} ${
        disabled ? disabledStyle : ""
      }`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// --- Komponen Halaman ---

const LoginPage = ({ onLogin, error: externalError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [internalError, setInternalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (isAdminButton) => {
    if (!email || !password) {
      setInternalError("Email dan password harus diisi.");
      return;
    }
    setLoading(true);
    setInternalError("");
    try {
      await onLogin(email, password, isAdminButton);
    } catch (err) {
      setInternalError("Login gagal. Periksa kembali email dan password Anda.");
      console.error(err);
    }
    setLoading(false);
  };

  const displayError = externalError || internalError;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://source.unsplash.com/random/1600x900/?school,technology')",
      }}
    >
      <div className="w-full max-w-md mx-4">
        <MacOSWindow title="Login Pemilihan OSIS">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Selamat Datang
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gunakan hak pilihmu secara digital.
              </p>
            </div>
            {displayError && (
              <p className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/50 p-2 rounded-md">
                {displayError}
              </p>
            )}
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => handleLogin(false)}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </Button>
              <Button
                onClick={() => handleLogin(true)}
                className="w-full"
                variant="secondary"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk sebagai Admin"}
              </Button>
            </div>
          </div>
        </MacOSWindow>
      </div>
    </div>
  );
};

const AdminPage = ({ onLogout }) => {
  const [candidates, setCandidates] = useState([]);
  const [settings, setSettings] = useState({
    isResultsVisible: false,
    resultsInfo: "",
  });
  const [broadcast, setBroadcast] = useState({
    title: "",
    content: "",
    showTime: true,
  });
  const [isCandidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCandidates = onSnapshot(
      query(collection(db, "candidates"), orderBy("order")),
      (snapshot) => {
        const candidatesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCandidates(candidatesData);
        setLoading(false);
      }
    );
    const unsubSettings = onSnapshot(doc(db, "config", "settings"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });
    const unsubBroadcast = onSnapshot(doc(db, "config", "broadcast"), (doc) => {
      if (doc.exists()) {
        setBroadcast(doc.data());
      }
    });

    return () => {
      unsubCandidates();
      unsubSettings();
      unsubBroadcast();
    };
  }, []);

  const handleAddCandidate = () => {
    setEditingCandidate(null);
    setCandidateModalOpen(true);
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setCandidateModalOpen(true);
  };

  const handleDeleteCandidate = async (candidateId) => {
    const batch = writeBatch(db);
    const candidateRef = doc(db, "candidates", candidateId);
    batch.delete(candidateRef);
    await batch.commit();
  };

  const moveCandidate = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= candidates.length) return;

    const batch = writeBatch(db);
    const candidateA = candidates[index];
    const candidateB = candidates[newIndex];

    const refA = doc(db, "candidates", candidateA.id);
    const refB = doc(db, "candidates", candidateB.id);

    batch.update(refA, { order: candidateB.order });
    batch.update(refB, { order: candidateA.order });

    await batch.commit();
  };

  const handleSaveCandidate = async (candidateData, file) => {
    let photoURL = candidateData.photoURL || "";
    if (file) {
      const storageRef = ref(storage, `candidates/${file.name}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
    }

    const finalData = { ...candidateData, photoURL };

    if (editingCandidate) {
      await setDoc(doc(db, "candidates", editingCandidate.id), finalData, {
        merge: true,
      });
    } else {
      const newOrder =
        candidates.length > 0
          ? Math.max(...candidates.map((c) => c.order)) + 1
          : 1;
      const newCandidateRef = doc(collection(db, "candidates"));
      await setDoc(newCandidateRef, {
        ...finalData,
        id: newCandidateRef.id,
        order: newOrder,
      });
    }
    setCandidateModalOpen(false);
  };

  const handleToggleResults = async () => {
    await setDoc(
      doc(db, "config", "settings"),
      { ...settings, isResultsVisible: !settings.isResultsVisible },
      { merge: true }
    );
  };

  const handleSettingsInfoChange = async (e) => {
    const newInfo = e.target.value;
    setSettings((prev) => ({ ...prev, resultsInfo: newInfo }));
    await setDoc(
      doc(db, "config", "settings"),
      { resultsInfo: newInfo },
      { merge: true }
    );
  };

  const handleBroadcastUpdate = async () => {
    const broadcastData = { ...broadcast, timestamp: new Date() };
    await setDoc(doc(db, "config", "broadcast"), broadcastData);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dasbor Admin</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manajemen Pemilihan Ketua OSIS
          </p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={() => setLogoutModalOpen(true)} variant="secondary">
            Log out
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kandidat */}
        <div className="lg:col-span-2">
          <MacOSWindow title="Manajemen Kandidat">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Daftar Kandidat</h2>
              <Button
                onClick={handleAddCandidate}
                disabled={candidates.length >= 10}
              >
                <PlusIcon /> Tambah
              </Button>
            </div>
            {loading ? (
              <p>Memuat data kandidat...</p>
            ) : candidates.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Belum ada kandidat yang ditambahkan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((c, index) => (
                  <div
                    key={c.id}
                    className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg shadow-sm"
                  >
                    <div className="font-bold text-2xl text-gray-400 dark:text-gray-500">
                      {c.order}
                    </div>
                    <img
                      src={
                        c.photoURL ||
                        "https://placehold.co/100x100/e2e8f0/e2e8f0?text=Foto"
                      }
                      alt={c.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Visi:</strong> {c.vision}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Misi:</strong> {c.mission}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => moveCandidate(index, -1)}
                        variant="secondary"
                        className="p-2 h-8 w-8"
                        disabled={index === 0}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        onClick={() => moveCandidate(index, 1)}
                        variant="secondary"
                        className="p-2 h-8 w-8"
                        disabled={index === candidates.length - 1}
                      >
                        <ArrowDownIcon />
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => handleEditCandidate(c)}
                        variant="secondary"
                        className="p-2 h-8 w-8"
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCandidate(c.id)}
                        variant="secondary"
                        className="p-2 h-8 w-8"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MacOSWindow>
        </div>

        {/* Kolom Kontrol */}
        <div className="space-y-8">
          <MacOSWindow title="Siaran & Notifikasi">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Buat Siaran</h2>
              <input
                type="text"
                placeholder="Judul Siaran"
                value={broadcast.title}
                onChange={(e) =>
                  setBroadcast({ ...broadcast, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <textarea
                placeholder="Isi Siaran..."
                value={broadcast.content}
                onChange={(e) =>
                  setBroadcast({ ...broadcast, content: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg"
                rows="4"
              ></textarea>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showTime"
                  checked={broadcast.showTime}
                  onChange={(e) =>
                    setBroadcast({ ...broadcast, showTime: e.target.checked })
                  }
                />
                <label htmlFor="showTime" className="text-sm">
                  Tampilkan waktu siaran
                </label>
              </div>
              <Button onClick={handleBroadcastUpdate} className="w-full">
                <BroadcastIcon /> Kirim Siaran
              </Button>
            </div>
          </MacOSWindow>

          <MacOSWindow title="Kontrol Hasil Voting">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Akses Hasil Voting</h2>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <p>Status Halaman Hasil</p>
                <Button
                  onClick={handleToggleResults}
                  variant={settings.isResultsVisible ? "danger" : "primary"}
                >
                  {settings.isResultsVisible ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
              <textarea
                placeholder="Tambahkan informasi di bawah tombol 'Lihat Hasil'..."
                value={settings.resultsInfo}
                onChange={handleSettingsInfoChange}
                className="w-full px-3 py-2 bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg"
                rows="2"
              ></textarea>
            </div>
          </MacOSWindow>
        </div>
      </div>

      <CandidateFormModal
        isOpen={isCandidateModalOpen}
        onClose={() => setCandidateModalOpen(false)}
        onSave={handleSaveCandidate}
        candidate={editingCandidate}
      />
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Konfirmasi Log Out"
      >
        <p>Apakah Anda yakin ingin keluar?</p>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setLogoutModalOpen(false)} variant="secondary">
            Tidak, kembali
          </Button>
          <Button onClick={onLogout} variant="danger">
            Yakin
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const CandidateFormModal = ({ isOpen, onClose, onSave, candidate }) => {
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (candidate) {
      setName(candidate.name || "");
      setVision(candidate.vision || "");
      setMission(candidate.mission || "");
      setPhotoPreview(candidate.photoURL || "");
    } else {
      setName("");
      setVision("");
      setMission("");
      setPhotoPreview("");
    }
    setPhotoFile(null);
  }, [candidate, isOpen]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const candidateData = {
      name,
      vision,
      mission,
      photoURL: candidate?.photoURL, // Keep existing URL if no new file
    };
    onSave(candidateData, photoFile);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={candidate ? "Edit Kandidat" : "Tambah Kandidat Baru"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={
              photoPreview ||
              "https://placehold.co/100x100/e2e8f0/e2e8f0?text=Foto"
            }
            alt="Preview"
            className="w-24 h-24 rounded-lg object-cover"
          />
          <input
            type="file"
            onChange={handlePhotoChange}
            accept="image/*"
            className="text-sm"
          />
        </div>
        <input
          type="text"
          placeholder="Nama Lengkap Kandidat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
        />
        <textarea
          placeholder="Visi"
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          rows="3"
        ></textarea>
        <textarea
          placeholder="Misi"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          rows="5"
        ></textarea>
        <div className="flex justify-end space-x-4 pt-4">
          <Button onClick={onClose} variant="secondary" type="button">
            Batal
          </Button>
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Modal>
  );
};

const StudentFlow = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [hasVoted, setHasVoted] = useState(null); // null: loading, false: not voted, true: voted
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkUserStatus = async () => {
      setLoading(true);
      const profileRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      } else {
        setProfile(false); // Indicates profile needs to be created
      }

      const voteRef = doc(db, "votes", user.uid);
      const voteSnap = await getDoc(voteRef);
      setHasVoted(voteSnap.exists());

      setLoading(false);
    };

    checkUserStatus();
  }, [user]);

  const handleProfileSave = (newProfile) => {
    setProfile(newProfile);
  };

  const handleVote = () => {
    setHasVoted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>Memeriksa status Anda...</p>
      </div>
    );
  }

  if (profile === false) {
    return <StudentDataForm user={user} onProfileSave={handleProfileSave} />;
  }

  return (
    <VotingPage
      user={user}
      profile={profile}
      hasVoted={hasVoted}
      onVote={handleVote}
      onLogout={onLogout}
    />
  );
};

const StudentDataForm = ({ user, onProfileSave }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    studentClass: "",
    presenceNumber: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfirmed || !photoFile) {
      return;
    }
    setLoading(true);
    const storageRef = ref(storage, `user_photos/${user.uid}`);
    await uploadBytes(storageRef, photoFile);
    const photoURL = await getDownloadURL(storageRef);

    const profileData = { ...formData, photoURL, uid: user.uid };
    await setDoc(doc(db, "users", user.uid), profileData);
    onProfileSave(profileData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <MacOSWindow title="Lengkapi Data Diri Anda" className="max-w-lg">
        <p className="text-center mb-6 text-gray-600 dark:text-gray-400">
          Untuk melanjutkan, harap isi data diri Anda. Data ini akan digunakan
          untuk verifikasi dan ID Card digital Anda.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <img
              src={
                photoPreview ||
                "https://placehold.co/150x150/e2e8f0/e2e8f0?text=Foto+Wajah"
              }
              alt="Foto Wajah"
              className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
            />
            <label className="cursor-pointer bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">
              Unggah Foto Wajah
              <input
                type="file"
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
                required
              />
            </label>
          </div>
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Kelas (Contoh: XII MIPA 1)"
            value={formData.studentClass}
            onChange={(e) =>
              setFormData({ ...formData, studentClass: e.target.value })
            }
            required
            className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Nomor Presensi"
            value={formData.presenceNumber}
            onChange={(e) =>
              setFormData({ ...formData, presenceNumber: e.target.value })
            }
            required
            className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <div className="flex items-start space-x-2 pt-2">
            <input
              type="checkbox"
              id="confirmation"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirmation"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Saya mengonfirmasi bahwa data yang saya masukkan adalah benar dan
              saya adalah siswa/i SMAN 1 Bangsal.
            </label>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isConfirmed || !photoFile}
          >
            {loading ? "Menyimpan..." : "Simpan dan Lanjutkan"}
          </Button>
        </form>
      </MacOSWindow>
    </div>
  );
};

const VotingPage = ({ user, profile, hasVoted, onVote, onLogout }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [settings, setSettings] = useState({
    isResultsVisible: false,
    resultsInfo: "",
  });
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isThankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isResultsPageOpen, setResultsPageOpen] = useState(false);
  const [isIdCardOpen, setIdCardOpen] = useState(false);

  useEffect(() => {
    const unsubCandidates = onSnapshot(
      query(collection(db, "candidates"), orderBy("order")),
      (snapshot) => {
        setCandidates(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    const unsubSettings = onSnapshot(doc(db, "config", "settings"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });

    return () => {
      unsubCandidates();
      unsubSettings();
    };
  }, []);

  const handleSelectCandidate = (candidate) => {
    if (hasVoted) return;
    setSelectedCandidate(candidate);
  };

  const handleSubmitVote = () => {
    if (!selectedCandidate) {
      return;
    }
    setConfirmModalOpen(true);
  };

  const confirmVote = async () => {
    setConfirmModalOpen(false);
    try {
      await runTransaction(db, async (transaction) => {
        const voteRef = doc(db, "votes", user.uid);
        const voteDoc = await transaction.get(voteRef);
        if (voteDoc.exists()) {
          throw new Error("Anda sudah pernah memberikan suara.");
        }

        const candidateVoteRef = doc(
          db,
          "candidate_votes",
          selectedCandidate.id
        );
        const candidateVoteDoc = await transaction.get(candidateVoteRef);

        if (candidateVoteDoc.exists()) {
          transaction.update(candidateVoteRef, {
            count: (candidateVoteDoc.data().count || 0) + 1,
          });
        } else {
          transaction.set(candidateVoteRef, { count: 1 });
        }

        transaction.set(voteRef, {
          candidateId: selectedCandidate.id,
          timestamp: new Date(),
        });
      });
      onVote();
      setThankYouModalOpen(true);
    } catch (error) {
      console.error("Error submitting vote: ", error);
    }
  };

  if (isResultsPageOpen) {
    return <ResultsPage onBack={() => setResultsPageOpen(false)} />;
  }

  if (isIdCardOpen) {
    return (
      <IDCardGenerator profile={profile} onBack={() => setIdCardOpen(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Gunakan Hak Pilih Anda
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Selamat datang, {profile.fullName}!
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIdCardOpen(true)} variant="secondary">
            Lihat ID Card
          </Button>
          <Button onClick={() => setLogoutModalOpen(true)} variant="secondary">
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {hasVoted && (
          <div
            className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-200 p-4 rounded-r-lg mb-8"
            role="alert"
          >
            <p className="font-bold flex items-center">
              <CheckCircleIcon className="mr-2" />
              Terima kasih!
            </p>
            <p>
              Anda telah menggunakan hak suara Anda. Pilihan Anda telah berhasil
              direkam.
            </p>
          </div>
        )}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${
            hasVoted ? "opacity-50 grayscale" : ""
          }`}
        >
          {candidates.map((c) => (
            <div
              key={c.id}
              className={`relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                selectedCandidate?.id === c.id ? "ring-4 ring-blue-500" : ""
              } ${hasVoted ? "pointer-events-none" : ""}`}
            >
              <div className="absolute top-4 left-4 bg-black/50 text-white w-12 h-12 flex items-center justify-center rounded-full text-2xl font-bold">
                {c.order}
              </div>
              <img
                src={c.photoURL}
                alt={c.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                  {c.name}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Visi:</strong> {c.vision}
                  </p>
                  <p>
                    <strong>Misi:</strong> {c.mission}
                  </p>
                </div>
                <Button
                  onClick={() => handleSelectCandidate(c)}
                  variant="danger"
                  className="w-full mt-6"
                  disabled={hasVoted}
                >
                  COBLOS
                </Button>
              </div>
            </div>
          ))}
        </div>
        {!hasVoted && candidates.length > 0 && (
          <div className="fixed bottom-0 right-0 p-8">
            <Button
              onClick={handleSubmitVote}
              className="px-8 py-4 text-lg"
              disabled={!selectedCandidate}
            >
              Submit Pilihan
            </Button>
          </div>
        )}
        {hasVoted && (
          <div className="mt-12 text-center">
            <Button
              onClick={() => setResultsPageOpen(true)}
              disabled={!settings.isResultsVisible}
              className="px-8 py-4 text-lg"
            >
              Lihat Hasil
            </Button>
            {!settings.isResultsVisible && (
              <p className="text-sm text-gray-500 mt-2">
                Tombol akan aktif jika sudah diizinkan oleh Admin.
              </p>
            )}
            {settings.isResultsVisible && settings.resultsInfo && (
              <p className="text-sm text-gray-500 mt-2">
                {settings.resultsInfo}
              </p>
            )}
          </div>
        )}
      </main>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Konfirmasi Pilihan"
      >
        <p>
          Anda yakin ingin memilih <strong>{selectedCandidate?.name}</strong>?
          Tindakan ini tidak bisa diurungkan/diedit setelah Anda memilih "Ya,
          saya yakin".
        </p>
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            onClick={() => setConfirmModalOpen(false)}
            variant="secondary"
          >
            Tidak, batalkan
          </Button>
          <Button onClick={confirmVote} variant="primary">
            Ya, saya yakin
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isThankYouModalOpen}
        onClose={() => setThankYouModalOpen(false)}
        title="Pilihan Terkirim"
      >
        <p>Terima kasih. Pilihanmu sudah dikirim ke server.</p>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setThankYouModalOpen(false)}>Kembali</Button>
          <Button
            onClick={() => {
              setThankYouModalOpen(false);
              setResultsPageOpen(true);
            }}
            disabled={!settings.isResultsVisible}
          >
            Lihat Hasil
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Konfirmasi Log Out"
      >
        <p>Apakah Anda yakin ingin keluar?</p>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setLogoutModalOpen(false)} variant="secondary">
            Tidak, kembali
          </Button>
          <Button onClick={onLogout} variant="danger">
            Yakin
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const ResultsPage = ({ onBack }) => {
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCandidates = onSnapshot(
      query(collection(db, "candidates"), orderBy("order")),
      (snapshot) => {
        setCandidates(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    const unsubVotes = onSnapshot(
      collection(db, "candidate_votes"),
      (snapshot) => {
        const votesData = {};
        snapshot.forEach((doc) => {
          votesData[doc.id] = doc.data().count;
        });
        setVotes(votesData);
        setLoading(false);
      }
    );

    return () => {
      unsubCandidates();
      unsubVotes();
    };
  }, []);

  const totalVotes = Object.values(votes).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Hasil Real-Time Pemilihan
        </h1>
        <Button onClick={onBack} variant="secondary">
          Kembali
        </Button>
      </header>
      <main className="max-w-4xl mx-auto">
        <MacOSWindow title={`Total Suara Masuk: ${totalVotes}`}>
          {loading ? (
            <p>Memuat hasil...</p>
          ) : candidates.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-6">
              {candidates.map((c) => {
                const voteCount = votes[c.id] || 0;
                const percentage =
                  totalVotes > 0
                    ? ((voteCount / totalVotes) * 100).toFixed(1)
                    : 0;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-4">
                        <img
                          src={c.photoURL}
                          alt={c.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
                            {c.order}. {c.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {voteCount} suara
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
                        {percentage}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MacOSWindow>
      </main>
    </div>
  );
};

const IDCardGenerator = ({ profile, onBack }) => {
  const canvasRef = useRef(null);
  const idCardTemplateUrl = "https://i.imgur.com/gY9p3aJ.png"; // URL template ID Card Anda

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;
    const ctx = canvas.getContext("2d");

    const template = new Image();
    template.crossOrigin = "Anonymous";
    template.src = idCardTemplateUrl;

    template.onload = () => {
      // Set canvas size to match template
      canvas.width = template.width;
      canvas.height = template.height;

      // Draw template
      ctx.drawImage(template, 0, 0);

      // Draw Profile Picture
      const userPhoto = new Image();
      userPhoto.crossOrigin = "Anonymous";
      userPhoto.src = profile.photoURL;
      userPhoto.onload = () => {
        // Coordinates and size for the photo on the template
        const photoX = 50;
        const photoY = 150;
        const photoSize = 200;

        ctx.save();
        ctx.beginPath();
        ctx.arc(
          photoX + photoSize / 2,
          photoY + photoSize / 2,
          photoSize / 2,
          0,
          Math.PI * 2,
          true
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userPhoto, photoX, photoY, photoSize, photoSize);
        ctx.restore();
      };

      // Draw Text
      ctx.fillStyle = "#333"; // Text color

      // Nama
      ctx.font = "bold 36px Arial";
      ctx.fillText(profile.fullName, 280, 200);

      // Kelas
      ctx.font = "28px Arial";
      ctx.fillText(`Kelas: ${profile.studentClass}`, 280, 250);

      // No Presensi
      ctx.fillText(`No. Presensi: ${profile.presenceNumber}`, 280, 290);
    };

    template.onerror = () => {
      console.error("Gagal memuat template ID Card.");
      ctx.fillStyle = "red";
      ctx.font = "20px Arial";
      ctx.fillText("Gagal memuat template ID Card.", 20, 50);
    };
  }, [profile, idCardTemplateUrl]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `ID_Card_Pemilos_${profile.fullName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          ID Card Partisipasi
        </h1>
        <Button onClick={onBack} variant="secondary">
          Kembali
        </Button>
      </header>
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 max-w-full"
      ></canvas>
      <div className="mt-8 flex space-x-4">
        <Button onClick={handleDownload}>Download ID Card</Button>
      </div>
    </div>
  );
};

// --- Komponen Utama Aplikasi ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("login"); // login, admin, student
  const [broadcast, setBroadcast] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setLoginError("");
      if (currentUser) {
        const adminListRef = doc(db, "config", "admin_users");
        const adminListSnap = await getDoc(adminListRef);

        let isAdminUser = false;
        if (
          adminListSnap.exists() &&
          adminListSnap.data().uids.includes(currentUser.uid)
        ) {
          isAdminUser = true;
        }

        const isAdminLoginAttempt = sessionStorage.getItem(
          "isAdminLoginAttempt"
        );
        if (isAdminLoginAttempt && !isAdminUser) {
          await signOut(auth);
          setLoginError("Akun ini bukan admin.");
          setUser(null);
          setIsAdmin(false);
          setPage("login");
          setLoading(false);
          sessionStorage.removeItem("isAdminLoginAttempt");
          return;
        }

        setUser(currentUser);
        setIsAdmin(isAdminUser);
        setPage(isAdminUser ? "admin" : "student");
      } else {
        setUser(null);
        setIsAdmin(false);
        setPage("login");
      }
      setLoading(false);
      sessionStorage.removeItem("isAdminLoginAttempt");
    });

    const unsubBroadcast = onSnapshot(doc(db, "config", "broadcast"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBroadcast(data);
        setShowBroadcast(true);
        setTimeout(() => setShowBroadcast(false), 15000);
      }
    });

    return () => {
      unsubscribe();
      unsubBroadcast();
    };
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white p-4">
        <div className="text-center bg-gray-900 p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Konfigurasi Dibutuhkan
          </h1>
          <p className="mb-2">
            Harap isi konfigurasi Firebase Anda di dalam file kode.
          </p>
          <p className="text-sm text-gray-400">
            Buka file `App.jsx`, cari objek `firebaseConfig`, dan ganti
            placeholder dengan kredensial dari proyek Firebase Anda.
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (email, password, isAdminButton) => {
    if (isAdminButton) {
      sessionStorage.setItem("isAdminLoginAttempt", "true");
    } else {
      sessionStorage.removeItem("isAdminLoginAttempt");
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Memuat Aplikasi...
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-gray-900 dark:text-gray-100">
      {showBroadcast && broadcast && page !== "admin" && (
        <div className="fixed top-5 right-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg rounded-lg p-4 z-50 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">{broadcast.title}</h4>
              <p className="text-sm mt-1">{broadcast.content}</p>
              {broadcast.showTime && broadcast.timestamp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(
                    broadcast.timestamp.seconds * 1000
                  ).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowBroadcast(false)}
              className="text-gray-500 dark:text-gray-400 ml-4"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {page === "login" && (
        <LoginPage onLogin={handleLogin} error={loginError} />
      )}
      {page === "admin" && <AdminPage onLogout={handleLogout} />}
      {page === "student" && user && (
        <StudentFlow user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
