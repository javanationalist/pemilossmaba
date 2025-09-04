import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://htwttxfjvsopnewepkaq.supabase.co'; // Ganti dengan URL Proyek Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0d3R0eGZqdnNvcG5ld2Vwa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjk4OTcsImV4cCI6MjA3MDY0NTg5N30.XJlI-qF7A_YFIzrEQHbuIRQ8tu3XeCe6A0C85hoxdX8'; // Ganti dengan kunci anon Anda
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginPage = document.getElementById('login-page');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const totalVotesEl = document.getElementById('total-votes');
const resultsContainer = document.getElementById('results-container');
const adminCandidateList = document.getElementById('admin-candidate-list');
const addCandidateForm = document.getElementById('add-candidate-form');

async function handleAuthStateChange() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginPage.style.display = 'none';
        adminDashboard.style.display = 'flex';
        loadAdminData();
        listenForChanges();
    } else {
        loginPage.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = 'Email atau password salah.';
        console.error('Login error:', error.message);
    } else {
        loginError.textContent = '';
        handleAuthStateChange(); 
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    handleAuthStateChange(); 
});

async function loadAdminData() {
    const { count: totalVotes, error: countError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

    const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('candidate_id')
        .limit(100000);

    const { data: candidates, error: candError } = await supabase.from('candidates').select('*');

    if (countError || voteError || candError) {
        console.error('Error loading admin data:', countError || voteError || candError);
        return;
    }

    displayAdminCandidates(candidates);
    displayResults(candidates, votes, totalVotes);
}

function displayAdminCandidates(candidates) {
    adminCandidateList.innerHTML = '';
    candidates.forEach(cand => {
        const div = document.createElement('div');
        div.className = 'candidate-card';
        div.innerHTML = `
            <div>
                <strong>${cand.name_ketua} & ${cand.name_wakil}</strong>
            </div>
            <button class="delete-btn" data-id="${cand.id}">Hapus</button>
        `;
        adminCandidateList.appendChild(div);
    });
}

function displayResults(candidates, votes, totalCount) {
    totalVotesEl.textContent = `Total Suara Masuk: ${totalCount}`;
    resultsContainer.innerHTML = '';

    const voteCounts = candidates.map(cand => ({
        ...cand,
        count: votes.filter(vote => vote.candidate_id === cand.id).length
    }));

    voteCounts.sort((a, b) => b.count - a.count);

    voteCounts.forEach(cand => {
        const percentage = totalCount > 0 ? ((cand.count / totalCount) * 100).toFixed(1) : 0;
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <span>${cand.name_ketua} & ${cand.name_wakil}</span>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%;">${percentage}%</div>
            </div>
            <strong>${cand.count} suara</strong>
        `;
        resultsContainer.appendChild(resultItem);
    });
}

addCandidateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newCandidate = {
        name_ketua: document.getElementById('ketua-name').value,
        name_wakil: document.getElementById('wakil-name').value,
        visi_misi: document.getElementById('visi-misi').value,
        photo_url: document.getElementById('photo-url').value,
    };

    const { error } = await supabase.from('candidates').insert([newCandidate]);
    if (error) {
        alert('Gagal menambah kandidat: ' + error.message);
    } else {
        addCandidateForm.reset();
        loadAdminData();
    }
});

adminCandidateList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm('Apakah Anda yakin ingin menghapus kandidat ini? Ini tidak bisa dibatalkan.')) {
            await supabase.from('votes').delete().eq('candidate_id', id);
            const { error } = await supabase.from('candidates').delete().eq('id', id);

            if (error) {
                alert('Gagal menghapus kandidat: ' + error.message);
            } else {
                loadAdminData();
            }
        }
    }
});


function listenForChanges() {
    supabase
        .channel('public:votes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, payload => {
            console.log('Perubahan pada votes terdeteksi!', payload);
            loadAdminData();
        })
        .subscribe();

    supabase
        .channel('public:candidates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, payload => {
            console.log('Perubahan pada candidates terdeteksi!', payload);
            loadAdminData();
        })
        .subscribe();
}

handleAuthStateChange();

const resetVotesBtn = document.getElementById('reset-votes-btn');

resetVotesBtn.addEventListener('click', async () => {
    const isConfirmed = confirm(
        'APAKAH ANDA YAKIN?\n\n' +
        'Anda akan menghapus SEMUA data suara yang telah masuk. ' +
        'Aksi ini tidak dapat dibatalkan dan akan mengembalikan perolehan suara ke 0.'
    );

    if (isConfirmed) {
        console.log('Menjalankan proses reset suara...');

        const { error } = await supabase
            .from('votes')
            .delete()
            .neq('id', -1);

        if (error) {
            // Jika terjadi error
            console.error('Gagal mereset data suara:', error);
            alert('Terjadi kesalahan saat mereset data: ' + error.message);
        } else {
            console.log('Semua data suara berhasil dihapus.');
            alert('Semua data suara berhasil direset.');
            
            loadAdminData();
        }
    } else {
        console.log('Proses reset dibatalkan oleh pengguna.');
    }
});
