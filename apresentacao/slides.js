/* ============================================================
   PhysicSim — Apresentação de Slides
   Navegação, Diagramas de Corpo Livre & Canvas
   ============================================================ */
(function () {
    'use strict';

    // ── State ──
    let current = 1;
    const total = document.querySelectorAll('.slide').length;

    // ── DOM ──
    const slides = document.querySelectorAll('.slide');
    const counter = document.getElementById('slide-counter');
    const progress = document.getElementById('progress-bar');
    const dotsContainer = document.getElementById('slide-dots');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const kbHint = document.getElementById('kb-hint');

    // ── Init dots ──
    for (let i = 1; i <= total; i++) {
        const dot = document.createElement('button');
        dot.className = 'slide-dot' + (i === 1 ? ' active' : '');
        dot.dataset.slide = i;
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    }

    // ── Navigation ──
    function goTo(n, direction) {
        if (n < 1 || n > total || n === current) return;

        const prev = document.querySelector('.slide.active');
        const next = slides[n - 1];

        // Exit direction
        if (prev) {
            prev.classList.remove('active');
            prev.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
            if (n > current) {
                prev.style.transform = 'translateX(-60px)';
            } else {
                prev.style.transform = 'translateX(60px)';
            }
            prev.style.opacity = '0';
            setTimeout(() => {
                prev.style.visibility = 'hidden';
            }, 450);
        }

        // Enter
        next.style.transition = 'none';
        next.style.visibility = 'visible';
        if (n > current) {
            next.style.transform = 'translateX(60px)';
        } else {
            next.style.transform = 'translateX(-60px)';
        }
        next.style.opacity = '0';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                next.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
                next.style.transform = 'translateX(0)';
                next.style.opacity = '1';
                next.classList.add('active');
            });
        });

        current = n;
        updateUI();
        drawCanvases();
    }

    function updateUI() {
        counter.textContent = `${current} / ${total}`;
        progress.style.width = `${(current / total) * 100}%`;

        // Update dots
        document.querySelectorAll('.slide-dot').forEach(d => {
            d.classList.toggle('active', parseInt(d.dataset.slide) === current);
        });
    }

    function prev() { goTo(current - 1); }
    function next() { goTo(current + 1); }

    // ── Event Listeners ──
    btnPrev.addEventListener('click', prev);
    btnNext.addEventListener('click', next);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
        if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); next(); }
        if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
        if (e.key === 'Home') { e.preventDefault(); goTo(1); }
        if (e.key === 'End') { e.preventDefault(); goTo(total); }
        if (e.key === 'f' || e.key === 'F') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        }
    });

    // ── Autohide Controls ──
    let hideTimer;
    function resetHideTimer() {
        document.body.classList.remove('hide-controls');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            document.body.classList.add('hide-controls');
        }, 2500);
    }
    
    document.addEventListener('mousemove', resetHideTimer);
    document.addEventListener('keydown', resetHideTimer);
    document.addEventListener('click', resetHideTimer);
    resetHideTimer(); // Init

    // ── Touch swipe support ──
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    document.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 60) {
            if (diff > 0) next(); else prev();
        }
    });

    // Keyboard hint
    setTimeout(() => kbHint.classList.add('visible'), 2000);
    setTimeout(() => kbHint.classList.remove('visible'), 6000);

    // ── Init ──
    slides[0].classList.add('active');
    slides[0].style.opacity = '1';
    slides[0].style.visibility = 'visible';
    slides[0].style.transform = 'translateX(0)';
    updateUI();

    // ============================================================
    //  CANVAS DRAWINGS — Free Body Diagrams & System Overview
    // ============================================================

    const PI = Math.PI;
    const DEG = PI / 180;

    function hiDPI(canvas, w, h) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
    }

    function arrow(ctx, x1, y1, x2, y2, headLen, color, lineWidth) {
        headLen = headLen || 10;
        lineWidth = lineWidth || 2.5;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - headLen * Math.cos(angle) * 0.5, y2 - headLen * Math.sin(angle) * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - 0.38), y2 - headLen * Math.sin(angle - 0.38));
        ctx.lineTo(x2 - headLen * Math.cos(angle + 0.38), y2 - headLen * Math.sin(angle + 0.38));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function labelAt(ctx, text, x, y, color, size, align, bold) {
        ctx.save();
        ctx.fillStyle = color || '#fff';
        ctx.font = (bold ? '700 ' : '500 ') + (size || 12) + 'px Outfit, Inter, sans-serif';
        ctx.textAlign = align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    function rRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // ── Draw: System Overview (Slide 2) ──
    function drawOverview() {
        const canvas = document.getElementById('diagram-overview');
        if (!canvas) return;
        const W = 520, H = 380;
        const ctx = hiDPI(canvas, W, H);
        ctx.clearRect(0, 0, W, H);

        const alpha = 30 * DEG;
        const hyp = 280;
        const Bx = 420, By = 320;
        const Ax = Bx - hyp * Math.cos(alpha), Ay = By;
        const Cx = Bx, Cy = By - hyp * Math.sin(alpha);

        // Ground
        ctx.strokeStyle = '#2a2a35';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, By); ctx.lineTo(W - 20, By); ctx.stroke();

        // Triangle
        ctx.fillStyle = 'rgba(60,60,90,0.12)';
        ctx.strokeStyle = '#3a3a5a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Cx, Cy); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Angle arc
        ctx.strokeStyle = '#6c9ef8';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(Ax, Ay, 30, -alpha, 0); ctx.stroke();
        labelAt(ctx, 'α', Ax + 36, Ay - 12, '#6c9ef8', 13);

        // Right angle mark
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Bx - 10, By); ctx.lineTo(Bx - 10, By - 10); ctx.lineTo(Bx, By - 10);
        ctx.stroke();

        // Block positions
        const bW = 42, bH = 28;
        const t1 = 0.28, t2 = 0.55;
        const px = t => Ax + (Cx - Ax) * t;
        const py = t => Ay + (Cy - Ay) * t;

        function drawBlock(posX, posY, col, label) {
            ctx.save();
            ctx.translate(posX, posY);
            ctx.rotate(-alpha);
            ctx.fillStyle = col;
            rRect(ctx, -bW / 2, -bH, bW, bH, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            rRect(ctx, -bW / 2, -bH, bW, bH, 4); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '600 11px Outfit, Inter, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, -bH / 2);
            ctx.restore();
        }

        drawBlock(px(t1), py(t1), '#c05050', 'm₁');
        drawBlock(px(t2), py(t2), '#40a098', 'm₂');

        // Ropes
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(px(t1), py(t1)); ctx.lineTo(px(t2), py(t2)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(t2), py(t2)); ctx.lineTo(Cx - 12 * Math.sin(alpha), Cy - 12 * Math.cos(alpha)); ctx.stroke();
        ctx.setLineDash([]);

        // Pulley
        const pR = 12;
        ctx.beginPath(); ctx.arc(Cx, Cy, pR, 0, PI * 2);
        ctx.fillStyle = '#1a1a2a'; ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(Cx, Cy, 2.5, 0, PI * 2);
        ctx.fillStyle = '#777'; ctx.fill();

        // m3
        const m3X = Cx + pR + 16;
        const m3Y = Cy + 80;
        const m3S = 38;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(Cx + pR, Cy); ctx.lineTo(m3X, m3Y - m3S / 2); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#b8a030';
        rRect(ctx, m3X - m3S / 2, m3Y - m3S / 2, m3S, m3S, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        rRect(ctx, m3X - m3S / 2, m3Y - m3S / 2, m3S, m3S, 4); ctx.stroke();
        labelAt(ctx, 'm₃', m3X, m3Y, '#fff', 11, 'center', true);

        // Labels for tensions
        const tMid1x = (px(t1) + px(t2)) / 2;
        const tMid1y = (py(t1) + py(t2)) / 2;
        labelAt(ctx, 'T₁', tMid1x - 15, tMid1y - 15, '#e06060', 12, 'center', true);

        const tMid2x = (px(t2) + Cx) / 2;
        const tMid2y = (py(t2) + Cy) / 2;
        labelAt(ctx, 'T₂', tMid2x - 15, tMid2y - 8, '#c080e0', 12, 'center', true);

        // Info text
        labelAt(ctx, 'Sistema de 3 blocos com polia', W / 2, By + 22, '#555', 11);
    }

    // ── Draw: DCL m1 (Slide 3) ──
    function drawDCL_m1() {
        const canvas = document.getElementById('dcl-m1');
        if (!canvas) return;
        const W = 440, H = 400;
        const ctx = hiDPI(canvas, W, H);
        ctx.clearRect(0, 0, W, H);

        const alpha = 30 * DEG;
        const sA = Math.sin(alpha), cA = Math.cos(alpha);
        const cx = W / 2, cy = H / 2;
        const bW = 64, bH = 44;
        const L = 85;

        // Incline surface reference (dashed)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx - cA * 170, cy + sA * 170);
        ctx.lineTo(cx + cA * 170, cy - sA * 170);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + sA * 120, cy + cA * 120);
        ctx.lineTo(cx - sA * 120, cy - cA * 120);
        ctx.stroke();
        ctx.setLineDash([]);

        // Block
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-alpha);
        ctx.fillStyle = 'rgba(192, 80, 80, 0.18)';
        ctx.strokeStyle = '#c05050';
        ctx.lineWidth = 2;
        rRect(ctx, -bW / 2, -bH / 2, bW, bH, 6); ctx.fill();
        rRect(ctx, -bW / 2, -bH / 2, bW, bH, 6); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '700 14px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('m₁', 0, 0);
        ctx.restore();

        // Weight P₁ — straight down
        const pLen = L * 1.1;
        arrow(ctx, cx, cy, cx, cy + pLen, 11, '#6fcf80', 2.8);
        labelAt(ctx, 'P₁', cx + 16, cy + pLen + 12, '#6fcf80', 13, 'left', true);

        // Normal N₁ — perpendicular to surface, away (up-left)
        arrow(ctx, cx, cy, cx - sA * L, cy - cA * L, 11, '#60a0f0', 2.8);
        labelAt(ctx, 'N₁', cx - sA * L - 14, cy - cA * L - 10, '#60a0f0', 13, 'center', true);

        // Tension T₁ — along surface upward (up-right)
        arrow(ctx, cx, cy, cx + cA * L * 0.95, cy - sA * L * 0.95, 11, '#e06060', 2.8);
        labelAt(ctx, 'T₁', cx + cA * L * 0.95 + 12, cy - sA * L * 0.95 - 8, '#e06060', 13, 'left', true);

        // Friction f₁ — along surface downward (opposing upward motion)
        arrow(ctx, cx, cy, cx - cA * L * 0.7, cy + sA * L * 0.7, 11, '#f0a040', 2.8);
        labelAt(ctx, 'f₁', cx - cA * L * 0.7 - 14, cy + sA * L * 0.7 + 12, '#f0a040', 13, 'center', true);
    }

    // ── Draw: DCL m2 (Slide 4) ──
    function drawDCL_m2() {
        const canvas = document.getElementById('dcl-m2');
        if (!canvas) return;
        const W = 440, H = 400;
        const ctx = hiDPI(canvas, W, H);
        ctx.clearRect(0, 0, W, H);

        const alpha = 30 * DEG;
        const sA = Math.sin(alpha), cA = Math.cos(alpha);
        const cx = W / 2, cy = H / 2;
        const bW = 64, bH = 44;
        const L = 80;

        // Incline surface reference (dashed)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx - cA * 170, cy + sA * 170);
        ctx.lineTo(cx + cA * 170, cy - sA * 170);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + sA * 120, cy + cA * 120);
        ctx.lineTo(cx - sA * 120, cy - cA * 120);
        ctx.stroke();
        ctx.setLineDash([]);

        // Block
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-alpha);
        ctx.fillStyle = 'rgba(64, 160, 152, 0.18)';
        ctx.strokeStyle = '#40a098';
        ctx.lineWidth = 2;
        rRect(ctx, -bW / 2, -bH / 2, bW, bH, 6); ctx.fill();
        rRect(ctx, -bW / 2, -bH / 2, bW, bH, 6); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '700 14px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('m₂', 0, 0);
        ctx.restore();

        // Weight P₂ — straight down
        const pLen = L * 1.1;
        arrow(ctx, cx, cy, cx, cy + pLen, 11, '#6fcf80', 2.8);
        labelAt(ctx, 'P₂', cx + 16, cy + pLen + 12, '#6fcf80', 13, 'left', true);

        // Normal N₂ — perpendicular to surface
        arrow(ctx, cx, cy, cx - sA * L, cy - cA * L, 11, '#60a0f0', 2.8);
        labelAt(ctx, 'N₂', cx - sA * L - 14, cy - cA * L - 10, '#60a0f0', 13, 'center', true);

        // T₂ — along surface upward (pulled by polia/m₃)
        arrow(ctx, cx, cy, cx + cA * L * 1.05, cy - sA * L * 1.05, 11, '#c080e0', 2.8);
        labelAt(ctx, 'T₂', cx + cA * L * 1.05 + 12, cy - sA * L * 1.05 - 10, '#c080e0', 13, 'left', true);

        // T₁ — along surface downward (pulled by m₁)
        arrow(ctx, cx, cy, cx - cA * L * 0.65, cy + sA * L * 0.65, 11, '#e06060', 2.8);
        labelAt(ctx, 'T₁', cx - cA * L * 0.65 - 14, cy + sA * L * 0.65 + 10, '#e06060', 13, 'center', true);

        // Friction f₂ — along surface downward, offset to avoid overlap with T₁
        var fOx = -sA * 10, fOy = -cA * 10;
        arrow(ctx, cx + fOx, cy + fOy, cx + fOx - cA * L * 0.6, cy + fOy + sA * L * 0.6, 11, '#f0a040', 2.8);
        labelAt(ctx, 'f₂', cx + fOx - cA * L * 0.6 - 16, cy + fOy + sA * L * 0.6 + 6, '#f0a040', 13, 'center', true);
    }

    // ── Draw: DCL m3 (Slide 5) ──
    function drawDCL_m3() {
        const canvas = document.getElementById('dcl-m3');
        if (!canvas) return;
        const W = 440, H = 400;
        const ctx = hiDPI(canvas, W, H);
        ctx.clearRect(0, 0, W, H);

        const cx = W / 2, cy = H / 2 - 20; // Shifted up slightly to give more room at bottom
        const bS = 68;

        // Vertical reference (dashed)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx, H - 70); ctx.stroke();
        ctx.setLineDash([]);

        // Block
        ctx.fillStyle = 'rgba(184, 160, 48, 0.18)';
        ctx.strokeStyle = '#b8a030';
        ctx.lineWidth = 2;
        rRect(ctx, cx - bS / 2, cy - bS / 2, bS, bS, 6); ctx.fill();
        rRect(ctx, cx - bS / 2, cy - bS / 2, bS, bS, 6); ctx.stroke();
        labelAt(ctx, 'm₃', cx, cy, '#fff', 16, 'center', true);

        // Weight P₃ — from bottom edge, straight down
        var pStart = cy + bS / 2 + 6;
        arrow(ctx, cx, pStart, cx, pStart + 80, 12, '#6fcf80', 3);
        labelAt(ctx, 'P₃ = m₃·g', cx, pStart + 96, '#6fcf80', 13, 'center', true);

        // Tension T₂ — from top edge, straight up
        var tStart = cy - bS / 2 - 6;
        arrow(ctx, cx, tStart, cx, tStart - 90, 12, '#c080e0', 3);
        labelAt(ctx, 'T₂', cx, tStart - 106, '#c080e0', 14, 'center', true);
    }

    // ── Draw all canvases for current slide ──
    function drawCanvases() {
        if (current === 2) drawOverview();
        if (current === 3) drawDCL_m1();
        if (current === 4) drawDCL_m2();
        if (current === 5) drawDCL_m3();
    }

    // Initial draw
    setTimeout(drawCanvases, 100);

    // Redraw on resize
    window.addEventListener('resize', () => {
        drawCanvases();
    });

})();
