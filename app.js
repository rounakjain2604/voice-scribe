/**
 * Voice Scribe - AI-Powered Voice Notes
 * Supports English (en-IN) and Hindi (hi-IN)
 */

class VoiceScribeApp {
    constructor() {
        // DOM Elements
        this.fabBtn = document.getElementById('fabBtn');
        this.recordingPanel = document.getElementById('recordingPanel');
        this.transcriptText = document.getElementById('transcriptText');
        this.interimText = document.getElementById('interimText');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.recLang = document.getElementById('recLang');

        this.notesList = document.getElementById('notesList');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.noteCount = document.getElementById('noteCount');

        this.notesListView = document.getElementById('notesListView');
        this.noteDetailView = document.getElementById('noteDetailView');
        this.backBtn = document.getElementById('backBtn');
        this.detailDate = document.getElementById('detailDate');
        this.detailTitle = document.getElementById('detailTitle');
        this.detailContent = document.getElementById('detailContent');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.viewToggleBtns = document.querySelectorAll('.toggle-btn');

        this.langButtons = document.querySelectorAll('.lang-btn');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');

        // State
        this.isRecording = false;
        this.currentLanguage = 'en-IN';
        this.finalTranscript = '';
        this.recognition = null;
        this.notes = [];
        this.currentNoteId = null;
        this.currentView = 'summary';

        // Initialize
        this.init();
    }

    init() {
        if (!this.checkSpeechRecognitionSupport()) {
            this.showUnsupportedMessage();
            return;
        }

        this.setupSpeechRecognition();
        this.loadNotes();
        this.bindEvents();
        this.renderNotes();
    }

    checkSpeechRecognitionSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    showUnsupportedMessage() {
        const main = document.querySelector('.main-content');
        const message = document.createElement('div');
        message.className = 'unsupported-message';
        message.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
            <h3>Browser Not Supported</h3>
            <p>Speech recognition requires Chrome, Edge, or Safari.</p>
        `;
        main.prepend(message);
        this.fabBtn.style.display = 'none';
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateRecordingUI();
        };

        this.recognition.onresult = (event) => {
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    this.finalTranscript += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            this.updateTranscriptUI(interim);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showToast('Error: ' + event.error);
            this.stopRecording();
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                try {
                    this.recognition.start();
                } catch (e) {
                    this.stopRecording();
                }
            }
        };
    }

    bindEvents() {
        // FAB button
        this.fabBtn.addEventListener('click', () => this.toggleRecording());

        // Language toggle
        this.langButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLanguage(e.target.dataset.lang));
        });

        // Recording panel actions
        this.saveBtn.addEventListener('click', () => this.saveNote());
        this.cancelBtn.addEventListener('click', () => this.cancelRecording());

        // Search
        this.searchInput.addEventListener('input', (e) => this.filterNotes(e.target.value));

        // Back button
        this.backBtn.addEventListener('click', () => this.showListView());

        // Delete note
        this.deleteNoteBtn.addEventListener('click', () => {
            if (this.currentNoteId) {
                this.deleteNote(this.currentNoteId);
                this.showListView();
            }
        });

        // View toggle
        this.viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.target.dataset.view;
                this.viewToggleBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (this.currentNoteId) {
                    const note = this.notes.find(n => n.id === this.currentNoteId);
                    if (note) this.renderNoteDetail(note);
                }
            });
        });
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.finalTranscript = '';
        this.transcriptText.textContent = 'Listening...';
        this.interimText.textContent = '';
        this.saveBtn.disabled = true;

        this.recognition.lang = this.currentLanguage;
        this.recLang.textContent = this.currentLanguage === 'hi-IN' ? 'हिंदी' : 'English';

        try {
            this.recognition.start();
            this.recordingPanel.classList.remove('hidden');
        } catch (e) {
            console.log('Recognition error:', e);
        }
    }

    stopRecording() {
        this.isRecording = false;

        try {
            this.recognition.stop();
        } catch (e) { }

        this.updateRecordingUI();
    }

    cancelRecording() {
        this.stopRecording();
        this.recordingPanel.classList.add('hidden');
        this.finalTranscript = '';
    }

    updateRecordingUI() {
        if (this.isRecording) {
            this.fabBtn.classList.add('recording');
            this.fabBtn.querySelector('.mic-icon').classList.add('hidden');
            this.fabBtn.querySelector('.stop-icon').classList.remove('hidden');
        } else {
            this.fabBtn.classList.remove('recording');
            this.fabBtn.querySelector('.mic-icon').classList.remove('hidden');
            this.fabBtn.querySelector('.stop-icon').classList.add('hidden');
        }
    }

    updateTranscriptUI(interim) {
        if (this.finalTranscript.trim()) {
            this.transcriptText.textContent = this.finalTranscript;
            this.saveBtn.disabled = false;
        }

        this.interimText.textContent = interim;
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;

        this.langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    saveNote() {
        const content = this.finalTranscript.trim();

        if (!content) return;

        const note = {
            id: Date.now(),
            content: content,
            language: this.currentLanguage,
            timestamp: new Date().toISOString(),
            title: this.generateTitle(content),
            summary: this.generateSummary(content)
        };

        this.notes.unshift(note);
        this.saveToStorage();
        this.renderNotes();

        this.cancelRecording();
        this.showToast('Note saved!');
    }

    generateTitle(content) {
        // Get first 5 words for title
        const words = content.split(/\s+/).slice(0, 5).join(' ');
        return words.length > 30 ? words.substring(0, 30) + '...' : words;
    }

    generateSummary(content) {
        // Simple sentence-based summary
        const sentences = content.split(/[।.!?]+/).filter(s => s.trim());

        // Group into categories (simple heuristic)
        const categories = {
            'Key Points': [],
            'Details': []
        };

        sentences.forEach((sentence, i) => {
            const clean = sentence.trim();
            if (clean.length > 10) {
                if (i < 3 || clean.length > 50) {
                    categories['Key Points'].push(clean);
                } else {
                    categories['Details'].push(clean);
                }
            }
        });

        return categories;
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveToStorage();
        this.renderNotes();
        this.showToast('Note deleted');
    }

    filterNotes(query) {
        const filtered = query.trim()
            ? this.notes.filter(note =>
                note.content.toLowerCase().includes(query.toLowerCase()) ||
                note.title.toLowerCase().includes(query.toLowerCase())
            )
            : this.notes;

        this.renderNotes(filtered);
    }

    renderNotes(notesToRender = this.notes) {
        this.notesList.innerHTML = '';
        this.noteCount.textContent = `${notesToRender.length} note${notesToRender.length !== 1 ? 's' : ''}`;

        if (notesToRender.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        notesToRender.forEach(note => {
            const card = this.createNoteCard(note);
            this.notesList.appendChild(card);
        });
    }

    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.id = note.id;

        const date = new Date(note.timestamp);
        const formattedDate = date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const langLabel = note.language === 'hi-IN' ? 'HI' : 'EN';

        card.innerHTML = `
            <div class="note-card-header">
                <div class="note-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"/>
                        <path d="M17 11C17 14.53 14.39 17.44 11 17.93V21H13M7 11C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11"/>
                    </svg>
                </div>
                <div class="note-meta">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-date">${formattedDate}</div>
                </div>
                <span class="note-lang-badge">${langLabel}</span>
            </div>
            <p class="note-preview">${this.escapeHtml(note.content)}</p>
        `;

        card.addEventListener('click', () => this.showNoteDetail(note));

        return card;
    }

    showNoteDetail(note) {
        this.currentNoteId = note.id;
        this.currentView = 'summary';

        // Reset toggle
        this.viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'summary');
        });

        const date = new Date(note.timestamp);
        this.detailDate.textContent = date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        this.detailTitle.textContent = note.title;
        this.renderNoteDetail(note);

        this.notesListView.classList.add('hidden');
        this.noteDetailView.classList.remove('hidden');
    }

    renderNoteDetail(note) {
        if (this.currentView === 'summary') {
            let html = '';

            for (const [category, items] of Object.entries(note.summary)) {
                if (items.length > 0) {
                    html += `
                        <div class="content-section">
                            <div class="content-section-title">${category}</div>
                            <ul class="content-list">
                                ${items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            }

            this.detailContent.innerHTML = html || '<p class="transcript-content">No summary available.</p>';
        } else {
            this.detailContent.innerHTML = `<p class="transcript-content">${this.escapeHtml(note.content)}</p>`;
        }
    }

    showListView() {
        this.currentNoteId = null;
        this.noteDetailView.classList.add('hidden');
        this.notesListView.classList.remove('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadNotes() {
        try {
            const saved = localStorage.getItem('voiceScribeNotes');
            this.notes = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.notes = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('voiceScribeNotes', JSON.stringify(this.notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.voiceScribeApp = new VoiceScribeApp();
});
