/* =========================================================
   Tests interactivos ASIR — test-engine.js
   Motor de test: carga, renderizado, autocorrección y resultados
   ========================================================= */

(function () {
    'use strict';

    const MODULE_NAMES = {
        lmsgi: 'LMSGI',
        fuhar: 'FUHAR',
        par:   'PAR',
        mpo:   'MPO',
        ipe:   'IPE',
        bbdd:  'BBDD',
        iso:   'ISO'
    };

    const SIMULACRO_COUNT = 30;
    const OPTION_LABELS   = ['A', 'B', 'C', 'D'];

    // Estado global del test
    let questions   = [];
    let userAnswers = [];   // null = en blanco, número = índice elegido
    let testDone    = false;
    let moduleId    = '';
    let testType    = '';   // 'global' | 'random'

    // ---- Utilidades ----

    function getParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function escapeHTML(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---- Carga de preguntas ----

    async function loadQuestions() {
        moduleId = (getParam('module') || '').toLowerCase();
        testType = (getParam('type')   || 'global').toLowerCase();

        if (!MODULE_NAMES[moduleId]) {
            showError('Módulo no reconocido. Vuelve atrás y selecciona un módulo válido.');
            return;
        }

        try {
            const resp = await fetch(`../data/${moduleId}.json`);
            if (!resp.ok) throw new Error(`No se pudo cargar ${moduleId}.json (${resp.status})`);

            const all = await resp.json();

            if (testType === 'random') {
                const shuffled = shuffle(all);
                questions = shuffled.slice(0, Math.min(SIMULACRO_COUNT, all.length));
            } else {
                questions = all;
            }

            userAnswers = new Array(questions.length).fill(null);
            initUI();
            renderQuestions();

        } catch (err) {
            showError(err.message);
        }
    }

    // ---- Inicialización de la UI ----

    function initUI() {
        const moduleName = MODULE_NAMES[moduleId];
        const typeName   = testType === 'random' ? 'Simulacro aleatorio' : 'Test global';

        document.title = `${moduleName} · ${typeName} · Tests interactivos ASIR`;

        const subtitle = document.getElementById('testSubtitle');
        if (subtitle) subtitle.textContent = `${moduleName} — ${typeName}`;

        const totalEl = document.getElementById('totalCount');
        if (totalEl) totalEl.textContent = questions.length;

        document.getElementById('loadingState').hidden = true;
        document.getElementById('testSection').hidden  = false;

        updateProgress();
    }

    // ---- Renderizado de preguntas ----

    function renderQuestions() {
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';

        questions.forEach((q, idx) => {
            const article = document.createElement('article');
            article.className = 'question-card';
            article.id        = `q-${idx}`;

            const optionsHTML = q.options.map((opt, i) => `
                <label class="option-label" for="q${idx}_opt${i}">
                    <input
                        type="radio"
                        class="option-radio"
                        name="q${idx}"
                        id="q${idx}_opt${i}"
                        value="${i}"
                    >
                    <span class="option-key">${OPTION_LABELS[i]}</span>
                    <span class="option-text">${escapeHTML(opt)}</span>
                </label>
            `).join('');

            article.innerHTML = `
                <div class="question-header">
                    <span class="question-number">${String(idx + 1).padStart(2, '0')}</span>
                    <p class="question-text">${escapeHTML(q.question)}</p>
                </div>
                <div class="options-list">${optionsHTML}</div>
            `;

            article.querySelectorAll('.option-radio').forEach(radio => {
                radio.addEventListener('change', () => {
                    userAnswers[idx] = parseInt(radio.value, 10);
                    updateProgress();
                });
            });

            container.appendChild(article);
        });
    }

    // ---- Barra de progreso ----

    function updateProgress() {
        const answered = userAnswers.filter(a => a !== null).length;
        const total    = questions.length;
        const pct      = total > 0 ? Math.round((answered / total) * 100) : 0;

        const bar  = document.getElementById('progressBar');
        const text = document.getElementById('progressText');
        if (bar)  bar.style.width      = `${pct}%`;
        if (text) text.textContent     = `${answered} / ${total}`;
    }

    // ---- Finalización y corrección ----

    function finishTest() {
        if (testDone) return;
        testDone = true;

        document.getElementById('btnFinish').disabled = true;

        let aciertos = 0;
        let fallos   = 0;
        let blancos  = 0;

        questions.forEach((q, idx) => {
            const ans  = userAnswers[idx];
            const card = document.getElementById(`q-${idx}`);

            // Deshabilitar todos los radios
            card.querySelectorAll('.option-radio').forEach(r => { r.disabled = true; });

            // Marcar la opción correcta y la elegida (si falla)
            card.querySelectorAll('.option-label').forEach((label, i) => {
                if (i === q.correctAnswer) {
                    label.classList.add('opt-correct');
                }
                if (ans !== null && i === ans && ans !== q.correctAnswer) {
                    label.classList.add('opt-wrong');
                }
            });

            // Contadores y clase de la tarjeta
            if (ans === null) {
                blancos++;
                card.classList.add('q-blank');
            } else if (ans === q.correctAnswer) {
                aciertos++;
                card.classList.add('q-correct');
            } else {
                fallos++;
                card.classList.add('q-wrong');
            }
        });

        // Fórmula según tipo de test
        let nota;
        if (testType === 'random') {
            nota = ((aciertos - fallos * 0.33) / questions.length) * 10;
            if (nota < 0) nota = 0;
        } else {
            nota = (aciertos / questions.length) * 10;
        }
        nota = Math.round(nota * 100) / 100;

        showResults({ aciertos, fallos, blancos, nota });
    }

    // ---- Pantalla de resultados ----

    function showResults({ aciertos, fallos, blancos, nota }) {
        const moduleName = MODULE_NAMES[moduleId];
        const typeName   = testType === 'random' ? 'Simulacro aleatorio' : 'Test global';

        document.getElementById('res-module').textContent   = moduleName;
        document.getElementById('res-type').textContent     = typeName;
        document.getElementById('res-total').textContent    = questions.length;
        document.getElementById('res-aciertos').textContent = aciertos;
        document.getElementById('res-fallos').textContent   = fallos;
        document.getElementById('res-blancos').textContent  = blancos;
        document.getElementById('res-nota').textContent     = nota.toFixed(2);

        // Listado de preguntas falladas
        const wrongAnswers = questions
            .map((q, i) => ({ q, i, ans: userAnswers[i] }))
            .filter(({ q, ans }) => ans !== null && ans !== q.correctAnswer);

        const wrongSection = document.getElementById('wrongSection');
        const wrongList    = document.getElementById('wrongList');

        if (wrongAnswers.length > 0) {
            wrongSection.hidden = false;
            wrongList.innerHTML = wrongAnswers.map(({ q, i, ans }) => `
                <div class="wrong-item">
                    <p class="wrong-question">
                        <span class="wrong-num">${String(i + 1).padStart(2, '0')}.</span>
                        ${escapeHTML(q.question)}
                    </p>
                    <p class="wrong-user">
                        Tu respuesta:
                        <span class="opt-wrong-text">${escapeHTML(q.options[ans])}</span>
                    </p>
                    <p class="wrong-correct">
                        Respuesta correcta:
                        <span class="opt-correct-text">${escapeHTML(q.options[q.correctAnswer])}</span>
                    </p>
                </div>
            `).join('');
        } else {
            wrongSection.hidden = true;
        }

        // Habilitar botón PDF y pasarle los datos
        const btnPDF = document.getElementById('btnPDF');
        if (btnPDF) {
            btnPDF.disabled = false;
            btnPDF.onclick = () => {
                generatePDF({
                    moduleName,
                    typeName,
                    total: questions.length,
                    aciertos,
                    fallos,
                    blancos,
                    nota,
                    wrongAnswers
                });
            };
        }

        const resultsSection = document.getElementById('resultsSection');
        resultsSection.hidden = false;
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // ---- Error ----

    function showError(msg) {
        const el = document.getElementById('loadingState');
        el.innerHTML = `<p class="error-msg">ERROR: ${escapeHTML(msg)}</p>`;
    }

    // ---- Bootstrap ----

    document.addEventListener('DOMContentLoaded', () => {
        loadQuestions();

        const btnFinish = document.getElementById('btnFinish');
        if (btnFinish) {
            btnFinish.addEventListener('click', () => {
                const blancos = userAnswers.filter(a => a === null).length;
                if (blancos > 0) {
                    const ok = window.confirm(
                        `Tienes ${blancos} pregunta${blancos > 1 ? 's' : ''} sin responder ` +
                        `(contarán como en blanco). ¿Deseas finalizar igualmente?`
                    );
                    if (!ok) return;
                }
                finishTest();
            });
        }
    });
})();
