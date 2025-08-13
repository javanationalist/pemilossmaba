// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Konfigurasi Supabase - GANTI DENGAN KUNCI ANDA
const SUPABASE_URL = 'https://htwttxfjvsopnewepkaq.supabase.co'; // Ganti dengan URL Proyek Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0d3R0eGZqdnNvcG5ld2Vwa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjk4OTcsImV4cCI6MjA3MDY0NTg5N30.XJlI-qF7A_YFIzrEQHbuIRQ8tu3XeCe6A0C85hoxdX8'; // Ganti dengan kunci anon Anda

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ... kode Supabase client di atas ...

// --- PENGATURAN LINK REDIRECT ---
// Ganti link di bawah ini dengan link tujuan Anda.
// Contoh: Instagram OSIS, website sekolah, atau halaman lain.
const LINK_TUJUAN_SETELAH_VOTE = 'https://www.instagram.com/osis.sman1bangsal';
// Elemen DOM
const candidateList = document.getElementById('candidate-list');
const submitButton = document.getElementById('submit-vote');
const confirmModal = document.getElementById('confirm-modal');
const thankyouModal = document.getElementById('thankyou-modal');
const editChoiceBtn = document.getElementById('edit-choice-btn');
const confirmSubmitBtn = document.getElementById('confirm-submit-btn');

let selectedCandidateId = null;

// Fungsi untuk memuat kandidat dari Supabase
async function loadCandidates() {
    const { data, error } = await supabase
        .from('candidates')
        .select('*');

    if (error) {
        console.error('Error fetching candidates:', error);
        candidateList.innerHTML = '<p>Gagal memuat kandidat.</p>';
        return;
    }

    candidateList.innerHTML = ''; // Hapus skeleton loader
    data.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.id = candidate.id;
        card.innerHTML = `
            <img src="${candidate.photo_url}" alt="Foto ${candidate.name_ketua}" class="candidate-photo">
            <h3 class="candidate-name">${candidate.name_ketua} & ${candidate.name_wakil}</h3>
            <p class="candidate-vision">${candidate.visi_misi}</p>
        `;
        candidateList.appendChild(card);
    });
}

// Event listener untuk memilih kandidat
candidateList.addEventListener('click', (e) => {
    const card = e.target.closest('.candidate-card');
    if (!card) return;

    // Hapus kelas 'selected' dari semua kartu
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    
    // Tambah kelas 'selected' ke kartu yang diklik
    card.classList.add('selected');
    selectedCandidateId = card.dataset.id;
    
    // Aktifkan tombol submit
    submitButton.disabled = false;
});

// Event listener untuk tombol submit
submitButton.addEventListener('click', () => {
    if (selectedCandidateId) {
        confirmModal.style.display = 'flex';
    }
});

// Event listener untuk tombol "Edit Pilihan" di modal
editChoiceBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

// PASTE KODE DI BAWAH INI UNTUK MENGGANTIKAN KODE YANG RUSAK

// Event listener untuk tombol "Selesai" di modal
confirmSubmitBtn.addEventListener('click', async () => {
    confirmModal.style.display = 'none';
    
    // Kirim vote ke Supabase
    const { error } = await supabase
        .from('votes')
        .insert([{ candidate_id: selectedCandidateId }]);

    if (error) {
        console.error('Error submitting vote:', error);
        alert('Maaf, terjadi kesalahan saat mengirim suara Anda.');
        return;
    }
    
    // Tampilkan pesan terima kasih
    thankyouModal.style.display = 'flex';

    // Setelah 5 detik, alihkan halaman ke link tujuan
    setTimeout(() => {
        window.location.href = LINK_TUJUAN_SETELAH_VOTE;
    }, 5000); 
});

// Fungsi untuk mereset halaman voting
function resetVotingPage() {
    selectedCandidateId = null;
    submitButton.disabled = true;
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    // Opsional: Anda bisa memuat ulang kandidat jika ada perubahan
    // loadCandidates();
}


// Muat kandidat saat halaman pertama kali dibuka
loadCandidates();

