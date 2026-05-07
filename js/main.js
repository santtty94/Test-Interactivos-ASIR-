/* =========================================================
   Tests interactivos ASIR — main.js
   Navegación entre módulos y tipos de test (Fase 1)
   ========================================================= */

(function () {
    'use strict';

    /**
     * Nombres legibles de los módulos.
     * Se usan en module.html para mostrar el módulo activo.
     */
    const MODULE_NAMES = {
        lmsgi: 'LMSGI',
        fuhar: 'FUHAR',
        par:   'PAR',
        mpo:   'MPO',
        ipe:   'IPE',
        bbdd:  'BBDD',
        iso:   'ISO'
    };

    /**
     * Devuelve un parámetro de la URL actual.
     */
    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    /**
     * Inicializa la página de módulo (module.html):
     *  - Lee ?module=xxx de la URL
     *  - Muestra el nombre del módulo
     *  - Construye los enlaces a test.html con módulo + tipo de test
     */
    function initModulePage() {
        const moduleNameEl = document.getElementById('moduleName');
        if (!moduleNameEl) return; // No estamos en module.html

        const moduleId = (getQueryParam('module') || '').toLowerCase();
        const moduleName = MODULE_NAMES[moduleId];

        if (!moduleName) {
            moduleNameEl.textContent = 'Desconocido';
            return;
        }

        moduleNameEl.textContent = moduleName;
        document.title = `${moduleName} · Tests interactivos ASIR`;

        // Asignar URL a las tarjetas de tipo de test
        const globalCard = document.getElementById('globalTestCard');
        const randomCard = document.getElementById('randomTestCard');

        if (globalCard) {
            globalCard.href = `test.html?module=${moduleId}&type=global`;
        }
        if (randomCard) {
            randomCard.href = `test.html?module=${moduleId}&type=random`;
        }
    }

    /**
     * Inicializa la página principal (index.html).
     * Por ahora no hace gran cosa, pero sirve para futuras
     * mejoras (estadísticas, último test realizado, etc.).
     */
    function initIndexPage() {
        const cards = document.querySelectorAll('.module-card[data-module]');
        if (!cards.length) return;

        // Pequeña animación al hacer hover con teclado
        cards.forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    // -------- Bootstrap --------
    document.addEventListener('DOMContentLoaded', () => {
        initIndexPage();
        initModulePage();
    });
})();
