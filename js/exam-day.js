/* =========================================================
   Tests interactivos ASIR — exam-day.js
   Hub del simulacro día de exámenes
   ========================================================= */

(function () {
    'use strict';

    const EXAM_DAY_ORDER = ['par', 'mpo', 'bbdd', 'iso', 'lmsgi', 'fuhar', 'ipe'];
    const STORAGE_KEY    = 'examDayProgress';

    const MODULE_INFO = {
        par:   { name: 'PAR',   abbr: 'PA', desc: 'Planificación y Administración de Redes' },
        mpo:   { name: 'MPO',   abbr: 'MP', desc: 'Módulo Profesional Optativo Cloud' },
        bbdd:  { name: 'BBDD',  abbr: 'BD', desc: 'Gestión de Bases de Datos' },
        iso:   { name: 'ISO',   abbr: 'IS', desc: 'Implantación de Sistemas Operativos' },
        lmsgi: { name: 'LMSGI', abbr: 'LM', desc: 'Lenguajes de Marcas y Sistemas de Gestión de Información' },
        fuhar: { name: 'FUHAR', abbr: 'FH', desc: 'Fundamentos de Hardware' },
        ipe:   { name: 'IPE',   abbr: 'IP', desc: 'Itinerario Personal Para la Empleabilidad' },
    };

    function getProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { completed: [], results: {} };
        } catch {
            return { completed: [], results: {} };
        }
    }

    function render() {
        const { completed = [], results = {} } = getProgress();
        const count = completed.length;

        document.getElementById('edpCompleted').textContent = count;
        document.getElementById('edpFill').style.width      = `${Math.round(count / 7 * 100)}%`;

        const container = document.getElementById('examDayModules');
        container.innerHTML = '';

        EXAM_DAY_ORDER.forEach((modId, idx) => {
            const info     = MODULE_INFO[modId];
            const isDone   = completed.includes(modId);
            const isActive = !isDone && (idx === 0 || completed.includes(EXAM_DAY_ORDER[idx - 1]));

            const stateClass = isDone   ? 'exam-day-card--done'
                             : isActive ? 'exam-day-card--active'
                             :            'exam-day-card--locked';

            const res = results[modId];
            const resultHTML = isDone && res
                ? `<div class="edc-result">
                       <span class="edc-nota">${res.nota.toFixed(2)}</span>
                       <span class="edc-stats">${res.aciertos} AC · ${res.fallos} FL · ${res.blancos} BL</span>
                   </div>`
                : '';

            const statusHTML = isDone
                ? `<span class="edc-status edc-status--done">COMPLETADO</span>`
                : isActive
                ? `<span class="edc-status edc-status--active">INICIAR</span>`
                : `<span class="edc-status edc-status--locked">BLOQUEADO</span>`;

            const tag  = (isActive || isDone) ? 'a' : 'div';
            const card = document.createElement(tag);
            card.className = `exam-day-card ${stateClass}`;
            if (isActive) card.href = `test.html?module=${modId}&type=examday`;
            if (isDone)   card.href = `test.html?module=${modId}&type=examday&review=true`;

            card.innerHTML = `
                <div class="edc-order">${String(idx + 1).padStart(2, '0')}</div>
                <div class="edc-icon">${info.abbr}</div>
                <div class="edc-info">
                    <span class="edc-name">${info.name}</span>
                    <span class="edc-desc">${info.desc}</span>
                    ${resultHTML}
                </div>
                <div class="edc-status-wrap">${statusHTML}</div>
            `;

            container.appendChild(card);
        });

        const finalEl = document.getElementById('examDayFinal');
        if (count === 7) {
            const vals = Object.values(results);
            const avg  = vals.length ? vals.reduce((s, r) => s + r.nota, 0) / vals.length : 0;
            finalEl.hidden = false;
            finalEl.innerHTML = `
                <p class="exam-day-final-text">
                    Simulacro completado &middot; Nota media:
                    <strong class="exam-day-final-nota">${avg.toFixed(2)}</strong>
                </p>
            `;
        } else {
            finalEl.hidden = true;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        render();
        document.getElementById('btnReset').addEventListener('click', () => {
            if (window.confirm('¿Reiniciar el simulacro? Se perderá todo el progreso actual.')) {
                localStorage.removeItem(STORAGE_KEY);
                render();
            }
        });
    });
})();
