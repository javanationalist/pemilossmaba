document.addEventListener('DOMContentLoaded', () => {

    // ===== KONEKSI KE SUPABASE =====
    // Ganti dengan URL dan Kunci Anon Public dari proyek Supabase Anda
    const SUPABASE_URL = 'https://otjgnaxojdydqotxdtpd.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90amduYXhvamR5ZHFvdHhkdHBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcxMTUyMywiZXhwIjoyMDcwMjg3NTIzfQ.fw6ooVHEgfSJnEL1rLJCZbRjdPKprJCbIfejPagAenU';

    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Data simulasi kandidat masih kita simpan di sini untuk ssementar
    let candidates = [];
    let votes = {};
    let activeBroadcasts = [];

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
    const modal = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalButtons = document.getElementById('modal-buttons');
    const modalTimestamp = document.getElementById('modal-timestamp');

    // ===== FUNGSI UTILITAS =====
    const showLoader = () => loaderOverlay.style.display = 'flex';
    const hideLoader = () => loaderOverlay.style.display = 'none';
    const showPage = (pageElement) => { pages.forEach(p => p.style.display = 'none'); pageElement.style.display = 'flex'; };

    function showModal(title, text, buttons = [], timestamp = '') {
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
        modalTimestamp.textContent = timestamp;
        modalTimestamp.style.display = timestamp ? 'block' : 'none';
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
    showModal('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar?', [
        { text: 'Tidak', class: 'btn' },
        { text: 'Yakin', class: 'btn btn-primary', async () => {
            showLoader();
            const { error } = await supabase.auth.signOut(); // Perintah logout ke server
            if (error) {
                alert('Gagal untuk logout, coba lagi.');
            }
            currentUser = null;
            selectedCandidateId = null;
            loginForm.reset();
            emailInput.value = 'zeno@gmail.com';
            passwordInput.value = '12321';
            updateLoginButtonStatus();
            hideLoader();
            showPage(loginPage);
        }}
    ]);
}


    async function handleLogin(event, roleToLogin) {
    event.preventDefault();
    showLoader();

    const email = emailInput.value;
    const password = passwordInput.value;

    // Mengirim data login ke server Supabase untuk verifikasi aman
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    loginError.textContent = '';

    if (error) {
        // Jika Supabase mengembalikan error (misal: password salah)
        loginError.textContent = 'Email atau password salah.';
        hideLoader();
        return; // Hentikan fungsi
    }

    if (data.user) {
        // Cek peran sederhana, jika email mengandung kata "admin" maka dianggap admin
        // Ini adalah cara sederhana, di aplikasi nyata biasanya ada tabel 'profiles'
        const userRole = email.toLowerCase().includes('admin') ? 'admin' : 'siswa';

        if (userRole === roleToLogin) {
            currentUser = { email: data.user.email, role: userRole };
            
            // Logika setelah login berhasil (sama seperti sebelumnya)
            if (currentUser.role === 'admin') {
                if (adminDataInterval) clearInterval(adminDataInterval);
                adminDataInterval = setInterval(renderVoterData, 5000);
                showPage(adminPage);
                renderAdminPage();
                renderVoterData();
                renderActiveBroadcasts();
            } else {
                // Untuk siswa, kita perlu mengambil data 'hasVoted' dari database nanti,
                // untuk sekarang kita anggap belum vote
                populateStudentForm(null); // Kita anggap form kosong dulu
                showPage(studentFormPage);
            }
        } else {
            loginError.textContent = 'Anda mencoba masuk ke peran yang salah.';
            await supabase.auth.signOut(); // Langsung logout jika mencoba masuk ke peran yang salah
        }
    }
    hideLoader();
}


    function populateStudentForm(formData) {
        studentForm.reset();
        studentPhotoPreview.src = 'https://via.placeholder.com/120';
        studentPhotoInput.required = !formData;
        if (formData) {
            studentPhotoPreview.src = formData.photo;
            document.getElementById('student-name').value = formData.name;
            document.getElementById('student-class').value = formData.class;
            document.getElementById('student-presence').value = formData.presence;
            document.getElementById('student-confirmation').checked = true;
        }
    }

    // --- Logika Halaman Admin ---
    function renderAdminPage() {
        adminCandidateList.innerHTML = '';
        noCandidateMsg.style.display = candidates.length === 0 ? 'block' : 'none';
        candidates.forEach(candidate => {
            const card = document.createElement('div');
            card.className = 'candidate-card admin-candidate-card';
            card.dataset.id = candidate.id;
            const fileInputId = `photo-upload-${candidate.id}`;
            card.innerHTML = `
                <button class="btn-delete-candidate" data-id="${candidate.id}" title="Hapus Kandidat">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                </button>
                <span class="candidate-number">${candidate.no_urut}</span>
                <label for="${fileInputId}">
                    <img src="${candidate.photo || 'https://via.placeholder.com/120'}" class="candidate-photo" data-id="${candidate.id}" alt="Foto Kandidat">
                </label>
                <input type="file" id="${fileInputId}" class="admin-photo-upload" data-id="${candidate.id}" accept="image/*" style="display: none;">
                <div class="candidate-details">
                    <input type="text" value="${candidate.name}" placeholder="Nama Kandidat" data-id="${candidate.id}" class="admin-edit-name">
                    <strong>Visi & Misi:</strong>
                    <textarea data-id="${candidate.id}" class="admin-edit-visimisi">${candidate.visi_misi}</textarea>
                </div>`;
            adminCandidateList.appendChild(card);
        });
    }

    function deleteCandidate(candidateId) {
        showModal('Hapus Kandidat', 'Anda yakin ingin menghapus kandidat ini?', [
            { text: 'Batal', class: 'btn' },
            { text: 'Ya, Hapus', class: 'btn btn-danger', onClick: () => {
                candidates = candidates.filter(c => c.id != candidateId);
                delete votes[candidateId];
                candidates.forEach((c, i) => c.no_urut = i + 1);
                renderAdminPage();
            }}
        ]);
    }

    function renderVoterData() {
        const studentForms = Object.values(users).filter(u => u.role === 'siswa' && u.formData);
        voterDataTableBody.innerHTML = '';
        noVoterDataMsg.style.display = studentForms.length === 0 ? 'block' : 'none';
        voterDataTableBody.parentElement.style.display = studentForms.length === 0 ? 'none' : 'table';
        studentForms.forEach(user => {
            const chosenCandidate = candidates.find(c => c.id === user.chosenCandidateId);
            const row = document.createElement('tr');
            const statusDotClass = user.hasVoted ? 'green' : 'red';
            const choiceText = user.hasVoted ? (chosenCandidate ? chosenCandidate.no_urut : 'N/A') : 'Belum memilih';
            row.innerHTML = `<td><img src="${user.formData.photo}" alt="Foto ${user.formData.name}"></td><td>${user.formData.name}</td><td>${user.formData.class}</td><td>${user.formData.presence}</td><td>${choiceText}</td><td><span class="status-dot-table ${statusDotClass}"></span></td>`;
            voterDataTableBody.appendChild(row);
        });
    }

    function renderActiveBroadcasts() {
        activeBroadcastsList.innerHTML = '';
        if (activeBroadcasts.length === 0) {
            activeBroadcastsList.innerHTML = `<p class="empty-list-msg">Belum ada siaran aktif.</p>`;
        } else {
            activeBroadcasts.forEach(broadcast => {
                const item = document.createElement('div');
                item.className = 'broadcast-item';
                item.innerHTML = `
                    <div class="broadcast-item-content">
                        <h5>${broadcast.title}</h5>
                        <p>${broadcast.content}</p>
                    </div>
                    <button class="btn-delete-broadcast" data-id="${broadcast.id}" title="Hapus Siaran">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                    </button>`;
                activeBroadcastsList.appendChild(item);
            });
        }
    }

    function exportToCsv() {
        const headers = ['Timestamp', 'Nama', 'Kelas', 'No Presensi', 'Pilihan (No. Urut)', 'Status'];
        const studentData = Object.values(users)
            .filter(u => u.role === 'siswa' && u.formData)
            .map(u => {
                const chosenCandidate = candidates.find(c => c.id === u.chosenCandidateId);
                const { submitTimestamp, name, class: studentClass, presence } = u.formData;
                const safeName = `"${name.replace(/"/g, '""')}"`;
                const safeClass = `"${studentClass.replace(/"/g, '""')}"`;
                return [
                    submitTimestamp ? new Date(submitTimestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', hour12: false }) : 'N/A',
                    safeName,
                    safeClass,
                    presence,
                    u.hasVoted ? (chosenCandidate ? chosenCandidate.no_urut : 'Error') : 'Belum memilih',
                    u.hasVoted ? 'Sudah Memilih' : 'Belum Memilih'
                ];
            });
        const csvContent = [headers.join(','), ...studentData.map(row => row.join(','))].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `data-pemilih-osis-${new Date().toLocaleDateString('id-ID')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- Logika Halaman Siswa ---
    function renderVoterInfoCard() {
        const user = users[currentUser.email];
        voterInfoCard.innerHTML = (user && user.formData) ? `
            <img src="${user.formData.photo}" alt="Foto Pemilih">
            <div class="info-text">
                <p><strong>${user.formData.name}</strong></p>
                <p>${user.formData.class} / No. ${user.formData.presence}</p>
            </div>` : '';
    }
    
    function renderVotingPage() {
        voterCandidateList.innerHTML = '';
        submitVoteBtn.disabled = true;
        selectedCandidateId = null;
        candidates.forEach(candidate => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.dataset.id = candidate.id;
            card.innerHTML = `<span class="candidate-number">${candidate.no_urut}</span><img src="${candidate.photo || 'https://via.placeholder.com/120'}" class="candidate-photo" alt="Foto Kandidat"><h4>${candidate.name}</h4><p>${candidate.visi_misi}</p><button class="btn btn-danger coblos-btn" data-id="${candidate.id}">COBLOS</button>`;
            voterCandidateList.appendChild(card);
        });
    }
    
    function renderResultPage() {
        const resultList = document.getElementById('result-candidate-list');
        resultList.innerHTML = '';
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        candidates.forEach(candidate => {
            const candidateVotes = votes[candidate.id] || 0;
            const percentage = totalVotes === 0 ? 0 : ((candidateVotes / totalVotes) * 100).toFixed(1);
            const card = document.createElement('div');
            card.className = 'candidate-card result-card';
            card.innerHTML = `
                <span class="candidate-number">${candidate.no_urut}</span>
                <img src="${candidate.photo || 'https://via.placeholder.com/120'}" class="candidate-photo" alt="Foto Kandidat">
                <h4>${candidate.name}</h4>
                <p class="percentage-label">${percentage}% pemilih</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                </div>
                <p class="vote-count">${candidateVotes} suara</p>`;
            resultList.appendChild(card);
        });
    }

    // ===== EVENT LISTENERS =====
    loginSiswaBtn.addEventListener('click', (e) => handleLogin(e, 'siswa'));
    loginAdminBtn.addEventListener('click', (e) => handleLogin(e, 'admin'));
    document.querySelectorAll('.btn-logout').forEach(button => button.addEventListener('click', logout));
    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', () => {
            const pageToShow = document.getElementById(previousPage || 'login-page');
            showPage(pageToShow);
        });
    });
    toggleStudentLoginBtn.addEventListener('click', () => {
        isStudentLoginActive = !isStudentLoginActive;
        const status = isStudentLoginActive ? 'aktif' : 'nonaktif';
        toggleStudentLoginBtn.dataset.status = status;
        toggleStudentLoginBtn.querySelector('.button-text').textContent = isStudentLoginActive ? 'Aktif' : 'Nonaktif';
        updateLoginButtonStatus();
    });
    toggleResultBtn.addEventListener('click', () => {
        isResultPageActive = !isResultPageActive;
        const status = isResultPageActive ? 'aktif' : 'nonaktif';
        toggleResultBtn.dataset.status = status;
        toggleResultBtn.querySelector('.button-text').textContent = isResultPageActive ? 'Aktif' : 'Nonaktif';
        resultInfoText.textContent = `Siswa ${isResultPageActive ? 'dapat' : 'tidak dapat'} melihat hasil saat ini.`;
        viewResultBtnFinal.disabled = !isResultPageActive;
        updateLoginButtonStatus();
    });
    adminViewResultBtn.addEventListener('click', () => {
        previousPage = 'admin-page';
        renderResultPage();
        showPage(resultPage);
    });
    guestViewResultBtn.addEventListener('click', () => {
        previousPage = 'login-page';
        renderResultPage();
        showPage(resultPage);
    });
    sendBroadcastBtn.addEventListener('click', () => {
        const title = broadcastTitleInput.value || 'Informasi Penting';
        const content = broadcastContentInput.value;
        if (!content) return alert('Isi siaran tidak boleh kosong!');
        const timestamp = new Date();
        activeBroadcasts.unshift({ id: timestamp.getTime(), title, content, timestamp });
        renderActiveBroadcasts();
        broadcastTitleInput.value = '';
        broadcastContentInput.value = '';
        showModal(title, content.replace(/\n/g, '<br>'), [{ text: 'Tutup', class: 'btn' }], `Disiarkan: ${timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
    });
    activeBroadcastsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-broadcast');
        if (deleteBtn) {
            activeBroadcasts = activeBroadcasts.filter(b => b.id != deleteBtn.dataset.id);
            renderActiveBroadcasts();
        }
    });
    addCandidateBtn.addEventListener('click', () => {
        showModal('Tambah Kandidat', 'Anda yakin ingin menambahkan kandidat baru?', [
            { text: 'Batal', class: 'btn' },
            { text: 'Ya, Tambah', class: 'btn btn-primary', onClick: () => {
                const newId = Date.now();
                candidates.push({ id: newId, no_urut: candidates.length + 1, name: `Kandidat Baru`, photo: '', visi_misi: 'Isi visi & misi.' });
                votes[newId] = 0;
                renderAdminPage();
            }}
        ]);
    });
    adminCandidateList.addEventListener('input', (e) => {
        const id = parseInt(e.target.dataset.id);
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) return;
        if (e.target.classList.contains('admin-edit-name')) {
            candidate.name = e.target.value;
        } else if (e.target.classList.contains('admin-edit-visimisi')) {
            candidate.visi_misi = e.target.value;
        }
    });
    adminCandidateList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.btn-delete-candidate');
        if (deleteButton) { deleteCandidate(deleteButton.dataset.id); }
    });
    adminCandidateList.addEventListener('change', (e) => {
        if (e.target.classList.contains('admin-photo-upload')) {
            const file = e.target.files[0];
            const candidateId = e.target.dataset.id;
            if (file && candidateId) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const candidate = candidates.find(c => c.id == candidateId);
                    if (candidate) candidate.photo = event.target.result;
                    renderAdminPage();
                };
                reader.readAsDataURL(file);
            }
        }
    });
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = users[currentUser.email];
        if (!user.formData && !studentPhotoInput.files[0]) {
            alert('Harap unggah foto wajah Anda.');
            return;
        }
        showLoader();
        setTimeout(() => {
            user.formData = {
                photo: studentPhotoPreview.src,
                name: document.getElementById('student-name').value,
                class: document.getElementById('student-class').value,
                presence: document.getElementById('student-presence').value,
                submitTimestamp: user.formData ? user.formData.submitTimestamp : new Date()
            };
            renderVoterInfoCard();
            renderVotingPage();
            showPage(votingPage);
            hideLoader();
        }, 500);
    });
    editFormBtn.addEventListener('click', () => showPage(studentFormPage));
    voterCandidateList.addEventListener('click', (e) => {
        if (e.target.classList.contains('coblos-btn')) {
            selectedCandidateId = parseInt(e.target.dataset.id);
            submitVoteBtn.disabled = false;
            document.querySelectorAll('#voter-candidate-list .candidate-card').forEach(c => c.classList.remove('selected'));
            e.target.closest('.candidate-card').classList.add('selected');
        }
    });
    submitVoteBtn.addEventListener('click', () => {
        if (!selectedCandidateId) return;
        showModal('Konfirmasi Pilihan Akhir', 'Anda yakin? Pilihan ini tidak dapat diubah.', [
            { text: 'Batal', class: 'btn' },
            { text: 'Ya, Saya Yakin', class: 'btn btn-primary', onClick: () => {
                showLoader();
                setTimeout(() => {
                    const user = users[currentUser.email];
                    user.hasVoted = true;
                    user.chosenCandidateId = selectedCandidateId;
                    votes[selectedCandidateId] = (votes[selectedCandidateId] || 0) + 1;
                    hideLoader();
                    showPage(thankYouPage);
                    viewResultBtnFinal.disabled = !isResultPageActive;
                }, 1500);
            }}
        ]);
    });
    viewResultBtnFinal.addEventListener('click', () => {
        if (isResultPageActive) {
            previousPage = 'thank-you-page';
            renderResultPage();
            showPage(resultPage);
        } else {
            showModal('Informasi', 'Halaman hasil belum diaktifkan oleh admin.', [{text: 'OK', class:'btn'}]);
        }
    });
    exportCsvBtn.addEventListener('click', exportToCsv);

    // ===== INISIALISASI =====
    setupImagePreview(studentPhotoInput, studentPhotoPreview);
    updateLoginButtonStatus();
    showPage(loginPage);
});
