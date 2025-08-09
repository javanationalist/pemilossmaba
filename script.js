document.addEventListener('DOMContentLoaded', () => {

    // ===== KONEKSI KE SUPABASE =====
    // Ganti dengan URL dan Kunci Anon Public dari proyek Supabase Anda
    const SUPABASE_URL = 'https://otjgnaxojdydqotxdtpd.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90amduYXhvamR5ZHFvdHhkdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTE1MjMsImV4cCI6MjA3MDI4NzUyM30.i3N7S7BSBi9RWglAyD4WkeyDtGVsgThEFEdTj2WMhkE'; 

    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // ===== DAFTAR UID ADMIN =====
    const ADMIN_UIDS = [
        'f06eabed-2f3f-4bca-a24c-f4654a6abdc8'
    ];

    // ===== DATA LOKAL APLIKASI =====
    let candidates = [];
    let activeBroadcasts = [];
    let localUserData = {}; 

    // ===== STATUS APLIKASI =====
    let currentUser = null;
    let isStudentLoginActive = true;
    let isResultPageActive = false;
    let selectedCandidateId = null;
    let previousPage = null;
    let adminDataInterval = null;

    // ===== DOM ELEMENTS =====
    const pages = document.querySelectorAll('.page-container');
    const loaderOverlay = document.getElementById('loader-overlay');
    const loginPage = document.getElementById('login-page');
    const adminPage = document.getElementById('admin-page');
    const studentFormPage = document.getElementById('student-form-page');
    const votingPage = document.getElementById('voting-page');
    const resultPage = document.getElementById('result-page');
    const thankYouPage = document.getElementById('thank-you-page');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginSiswaBtn = document.getElementById('login-siswa-btn');
    const loginAdminBtn = document.getElementById('login-admin-btn');
    const loginError = document.getElementById('login-error');
    const guestResultContainer = document.getElementById('guest-result-container');
    const guestViewResultBtn = document.getElementById('guest-view-result-btn');
    const toggleStudentLoginBtn = document.getElementById('toggle-student-login-btn');
    const toggleResultBtn = document.getElementById('toggle-result-page-btn');
    const adminViewResultBtn = document.getElementById('admin-view-result-btn');
    const resultInfoText = document.getElementById('result-info-text');
    const sendBroadcastBtn = document.getElementById('send-broadcast-btn');
    const broadcastTitleInput = document.getElementById('broadcast-title');
    const broadcastContentInput = document.getElementById('broadcast-content');
    const activeBroadcastsList = document.getElementById('active-broadcasts-list');
    const adminCandidateList = document.getElementById('admin-candidate-list');
    const noCandidateMsg = document.getElementById('no-candidate-msg');
    const addCandidateBtn = document.getElementById('add-candidate-btn');
    const voterDataTableBody = document.querySelector('#voter-data-table tbody');
    const noVoterDataMsg = document.getElementById('no-voter-data-msg');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const studentForm = document.getElementById('student-form');
    const studentPhotoInput = document.getElementById('student-photo');
    const studentPhotoPreview = document.getElementById('student-photo-preview');
    const voterInfoCard = document.getElementById('voter-info-card');
    const voterCandidateList = document.getElementById('voter-candidate-list');
    const editFormBtn = document.getElementById('edit-form-btn');
    const submitVoteBtn = document.getElementById('submit-vote-btn');
    const viewResultBtnFinal = document.getElementById('view-result-btn-final');
    
    // ===== FUNGSI UTILITAS =====
    const showLoader = () => loaderOverlay.style.display = 'flex';
    const hideLoader = () => loaderOverlay.style.display = 'none';
    const showPage = (pageElement) => { pages.forEach(p => p.style.display = 'none'); pageElement.style.display = 'flex'; };
    function showModal(title, text, buttons = []) {
        const modal = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');
        const modalButtons = document.getElementById('modal-buttons');
        modalTitle.textContent = title;
        modalText.innerHTML = text;
        modalButtons.innerHTML = '';
        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class;
            button.onclick = () => { modal.style.display = 'none'; if (btnInfo.onClick) btnInfo.onClick(); };
            modalButtons.appendChild(button);
        });
        modal.style.display = 'flex';
    }
    function setupImagePreview(fileInput, previewElement) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => { previewElement.src = e.target.result; };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });
    }
    function updateLoginButtonStatus() {
        loginSiswaBtn.disabled = !isStudentLoginActive;
        loginSiswaBtn.title = isStudentLoginActive ? "" : "Login siswa dinonaktifkan oleh admin.";
        guestResultContainer.style.display = isStudentLoginActive ? 'none' : 'block';
        guestViewResultBtn.disabled = !isResultPageActive;
        guestViewResultBtn.title = isResultPageActive ? "" : "Halaman hasil dinonaktifkan oleh admin.";
    }

    // ===== FUNGSI ALUR APLIKASI =====
    async function logout() {
        if (adminDataInterval) clearInterval(adminDataInterval);
        showLoader();
        await supabaseClient.auth.signOut();
        currentUser = null;
        localUserData = {};
        loginForm.reset();
        emailInput.value = '@smaba.ac.id';
        passwordInput.value = '';
        updateLoginButtonStatus();
        hideLoader();
        showPage(loginPage);
    }
    async function handleLogin(roleToLogin) {
        showLoader();
        loginError.textContent = '';
        
        if (SUPABASE_KEY.includes('MASUKKAN_KUNCI')) {
            loginError.textContent = 'Error: Kunci Supabase belum diisi di script.js';
            hideLoader(); return;
        }

        const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });

        if (error) {
            loginError.textContent = 'Akun tersebut tidak ada atau password salah.';
            hideLoader(); return;
        }

        if (user) {
            const isAdmin = ADMIN_UIDS.includes(user.id);
            if (roleToLogin === 'admin') {
                if (isAdmin) {
                    currentUser = { email: user.email, role: 'admin', id: user.id };
                    if (adminDataInterval) clearInterval(adminDataInterval);
                    adminDataInterval = setInterval(renderVoterData, 5000);
                    await fetchCandidates();
                    await renderVoterData();
                    showPage(adminPage);
                } else {
                    loginError.textContent = 'Akun ini tidak memiliki akses sebagai admin.';
                    await supabaseClient.auth.signOut();
                }
            } else if (roleToLogin === 'siswa') {
                if (isAdmin) {
                    loginError.textContent = 'Akun admin tidak bisa masuk sebagai siswa.';
                    await supabaseClient.auth.signOut();
                } else {
                    currentUser = { email: user.email, role: 'siswa', id: user.id };
                    const { data: voterData } = await supabaseClient.from('voters').select('*').eq('id', user.id).single();
                    if (voterData) {
                        localUserData = voterData;
                        if (voterData.has_voted) {
                            showPage(thankYouPage);
                            viewResultBtnFinal.disabled = !isResultPageActive;
                        } else {
                            populateStudentForm(voterData);
                            renderVoterInfoCard();
                            await fetchCandidates();
                            showPage(votingPage);
                        }
                    } else {
                        localUserData = {};
                        populateStudentForm(null);
                        showPage(studentFormPage);
                    }
                }
            }
        }
        hideLoader();
    }
    
    function populateStudentForm(formData) {
        studentForm.reset();
        studentPhotoPreview.src = 'https://via.placeholder.com/120';
        studentPhotoInput.required = !formData;
        if (formData) {
            studentPhotoPreview.src = formData.photo_url || 'https://via.placeholder.com/120';
            document.getElementById('student-name').value = formData.full_name;
            document.getElementById('student-class').value = formData.class;
            document.getElementById('student-presence').value = formData.presence_number;
            document.getElementById('student-confirmation').checked = true;
        }
    }

    // --- Logika Halaman Admin ---
    async function fetchCandidates() {
        const { data, error } = await supabaseClient.from('candidates').select('*').order('no_urut', { ascending: true });
        if (error) {
            alert('Gagal memuat data kandidat.');
        } else {
            candidates = data;
            renderAdminPage();
            renderVotingPage();
        }
    }
    async function addCandidate() {
        const { count } = await supabaseClient.from('candidates').select('*', { count: 'exact', head: true });
        const newCandidate = { name: 'Kandidat Baru', visi_misi: 'Isi visi dan misi di sini.', no_urut: (count || 0) + 1 };
        const { error } = await supabaseClient.from('candidates').insert([newCandidate]);
        if (error) {
            alert('Gagal menambah kandidat baru.');
        } else {
            await fetchCandidates();
        }
    }
    async function deleteCandidate(candidateId) {
        showModal('Hapus Kandidat', 'Anda yakin ingin menghapus kandidat ini? Data akan hilang permanen.', [
            { text: 'Batal', class: 'btn' },
            { text: 'Ya, Hapus', class: 'btn btn-danger', async () => {
                showLoader();
                await supabaseClient.from('voters').update({ chosen_candidate_id: null }).eq('chosen_candidate_id', candidateId);
                const { error } = await supabaseClient.from('candidates').delete().eq('id', candidateId);
                if (error) {
                    alert('Gagal menghapus kandidat.');
                } else {
                    await fetchCandidates();
                }
                hideLoader();
            }}
        ]);
    }
    async function updateCandidate(candidateId, updatedData) {
        await supabaseClient.from('candidates').update(updatedData).eq('id', candidateId);
    }
    function renderAdminPage() {
        adminCandidateList.innerHTML = '';
        noCandidateMsg.style.display = candidates.length === 0 ? 'block' : 'none';
        candidates.forEach(candidate => {
            const card = document.createElement('div');
            card.className = 'candidate-card admin-candidate-card';
            card.dataset.id = candidate.id;
            const fileInputId = `photo-upload-${candidate.id}`;
            card.innerHTML = `<button class="btn-delete-candidate" data-id="${candidate.id}" title="Hapus Kandidat"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg></button><span class="candidate-number">${candidate.no_urut}</span><label for="${fileInputId}"><img src="${candidate.photo_url || 'https://via.placeholder.com/120'}" class="candidate-photo" data-id="${candidate.id}" alt="Foto Kandidat"></label><input type="file" id="${fileInputId}" class="admin-photo-upload" data-id="${candidate.id}" accept="image/*" style="display: none;"><div class="candidate-details"><input type="text" value="${candidate.name}" placeholder="Nama Kandidat" data-id="${candidate.id}" class="admin-edit-name"><strong>Visi & Misi:</strong><textarea data-id="${candidate.id}" class="admin-edit-visimisi">${candidate.visi_misi}</textarea></div>`;
            adminCandidateList.appendChild(card);
        });
    }
    async function renderVoterData() {
        const { data, error } = await supabaseClient.from('voters').select(`*, candidates(no_urut)`);
        if (error) { console.error("Gagal ambil data pemilih:", error); return; }
        voterDataTableBody.innerHTML = '';
        noVoterDataMsg.style.display = data.length === 0 ? 'block' : 'none';
        voterDataTableBody.parentElement.style.display = data.length === 0 ? 'none' : 'table';
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        data.forEach(user => {
            const row = document.createElement('tr');
            const statusDotClass = user.has_voted ? 'green' : 'red';
            const choiceText = user.has_voted ? (user.candidates ? user.candidates.no_urut : 'N/A') : 'Belum memilih';
            row.innerHTML = `<td><img src="${user.photo_url || 'https://via.placeholder.com/120'}" alt="Foto ${user.full_name}"></td><td>${user.full_name}</td><td>${user.class}</td><td>${user.presence_number}</td><td>${choiceText}</td><td><span class="status-dot-table ${statusDotClass}"></span></td>`;
            voterDataTableBody.appendChild(row);
        });
    }
    async function exportToCsv() {
        showLoader();
        const { data, error } = await supabaseClient.from('voters').select(`*, candidates(name)`);
        hideLoader();
        if (error) { alert('Gagal mengambil data untuk ekspor.'); return; }
        const headers = ['Timestamp', 'Nama', 'Kelas', 'No Presensi', 'Pilihan', 'Status'];
        const studentData = data.map(u => {
            const safeName = `"${u.full_name.replace(/"/g, '""')}"`;
            const safeClass = `"${u.class.replace(/"/g, '""')}"`;
            return [ new Date(u.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', hour12: false }), safeName, safeClass, u.presence_number, u.has_voted ? `"${(u.candidates ? u.candidates.name : 'Error').replace(/"/g, '""')}"` : 'Belum memilih', u.has_voted ? 'Sudah Memilih' : 'Belum Memilih' ];
        });
        const csvContent = [headers.join(','), ...studentData.map(row => row.join(','))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `data-pemilih-osis-${new Date().toLocaleDateString('id-ID')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Logika Halaman Siswa ---
    function renderVoterInfoCard() {
        if (localUserData) {
            voterInfoCard.innerHTML = `<img src="${localUserData.photo_url || 'https://via.placeholder.com/120'}" alt="Foto Pemilih"><div class="info-text"><p><strong>${localUserData.full_name || 'Nama Belum Diisi'}</strong></p><p>${localUserData.class || 'Kelas'} / No. ${localUserData.presence_number || 'Presensi'}</p></div>`;
        }
    }
    function renderVotingPage() {
        voterCandidateList.innerHTML = '';
        submitVoteBtn.disabled = true;
        selectedCandidateId = null;
        candidates.forEach(candidate => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.dataset.id = candidate.id;
            card.innerHTML = `<span class="candidate-number">${candidate.no_urut}</span><img src="${candidate.photo_url || 'https://via.placeholder.com/120'}" class="candidate-photo" alt="Foto Kandidat"><h4>${candidate.name}</h4><p>${candidate.visi_misi}</p><button class="btn btn-danger coblos-btn" data-id="${candidate.id}">COBLOS</button>`;
            voterCandidateList.appendChild(card);
        });
    }
    async function renderResultPage() { /* ... sama seperti sebelumnya ... */ }

    // ===== EVENT LISTENERS =====
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Mencegah form refresh halaman
    });
    loginSiswaBtn.addEventListener('click', () => handleLogin('siswa'));
    loginAdminBtn.addEventListener('click', () => handleLogin('admin'));
    
    // ... Sisa event listener sama persis dari kode sebelumnya ...
    // Cukup pastikan fungsi di atas sudah benar
    
    // ===== INISIALISASI =====
    setupImagePreview(studentPhotoInput, studentPhotoPreview);
    updateLoginButtonStatus();
    showPage(loginPage);
});
