import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://htwttxfjvsopnewepkaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0d3R0eGZqdnNvcG5ld2Vwa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjk4OTcsImV4cCI6MjA3MDY0NTg5N30.XJlI-qF7A_YFIzrEQHbuIRQ8tu3XeCe6A0C85hoxdX8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const LINK_TUJUAN_SETELAH_VOTE = 'https://javanationalist.github.io/pilketossmasa/';
const candidateList = document.getElementById('candidate-list');
const submitButton = document.getElementById('submit-vote');
const confirmModal = document.getElementById('confirm-modal');
const thankyouModal = document.getElementById('thankyou-modal');
const editChoiceBtn = document.getElementById('edit-choice-btn');
const confirmSubmitBtn = document.getElementById('confirm-submit-btn');

let selectedCandidateId = null;

async function loadCandidates() {
    const { data, error } = await supabase
        .from('candidates')
        .select('*');

    if (error) {
        console.error('Error fetching candidates:', error);
        candidateList.innerHTML = '<p>Gagal memuat kandidat.</p>';
        return;
    }

    candidateList.innerHTML = '';
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

candidateList.addEventListener('click', (e) => {
    const card = e.target.closest('.candidate-card');
    if (!card) return;

    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));

    card.classList.add('selected');
    selectedCandidateId = card.dataset.id;

    submitButton.disabled = false;
});
submitButton.addEventListener('click', () => {
    if (selectedCandidateId) {
        confirmModal.style.display = 'flex';
    }
});

editChoiceBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

confirmSubmitBtn.addEventListener('click', async () => {
    confirmModal.style.display = 'none';

    const { error } = await supabase
        .from('votes')
        .insert([{ candidate_id: selectedCandidateId }]);

    if (error) {
        console.error('Error submitting vote:', error);
        alert('Maaf, terjadi kesalahan saat mengirim suara Anda.');
        return;
    }

    thankyouModal.style.display = 'flex';

    setTimeout(() => {
        window.location.href = LINK_TUJUAN_SETELAH_VOTE;
    }, 5000); 
});

function resetVotingPage() {
    selectedCandidateId = null;
    submitButton.disabled = true;
    document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
    // loadCandidates();
}

loadCandidates();




