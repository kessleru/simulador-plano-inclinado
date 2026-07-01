/* ============================================================
   PhysicSim — Home Page Script
   Particle animation and card interactions
   ============================================================ */
(function () {
    'use strict';

    // ── Subtle particle system on hover ──
    const cards = document.querySelectorAll('.home-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', x + '%');
            card.style.setProperty('--my', y + '%');
        });
    });

    // ── Keyboard navigation ──
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '1') {
            window.location.href = '../simulador/index.html';
        }
        if (e.key === '2') {
            window.location.href = '../apresentacao/index.html';
        }
    });
})();
