/* ============================================================
   PhysicSim — Plano Inclinado
   Física, renderização e UI
   ============================================================ */
(function () {
    'use strict';

    // ── DOM ──
    const $ = id => document.getElementById(id);
    const dom = {
        m1: $('input-m1'), m2: $('input-m2'), m3: $('input-m3'),
        angle: $('input-angle'), angleSlider: $('input-angle-slider'),
        muE: $('input-mu-e'), muESlider: $('input-mu-e-slider'),
        muK: $('input-mu-k'), muKSlider: $('input-mu-k-slider'),
        g: $('input-g'),
        btnCalc: $('btn-calculate'), btnClear: $('btn-clear'),
        btnAnim: $('btn-animate'), btnStop: $('btn-stop'),
        canvas: $('main-canvas'),
        results: $('results-section'), tables: $('tables-section'),
        steps: $('steps-section'),
        grid: $('results-grid'), stepsC: $('steps-content'),
        tM1: document.querySelector('#table-m1 tbody'),
        tM2: document.querySelector('#table-m2 tbody'),
        tM3: document.querySelector('#table-m3 tbody'),
        badge: $('direction-badge'),
    };

    // ── Estado ──
    let res = null, animId = null, animOff = 0, anim = false;

    // ── Helpers ──
    const fmt = (n, d = 2) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d);
    const rad = deg => deg * Math.PI / 180;

    function hiDPI(canvas, w, h) {
        const dpr = devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
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

    // ── Física ──
    function calc() {
        const m1 = parseFloat(dom.m1.value) || 0.1;
        const m2 = parseFloat(dom.m2.value) || 0.1;
        const m3 = parseFloat(dom.m3.value) || 0.1;
        const deg = parseFloat(dom.angle.value) || 30;
        const muE = parseFloat(dom.muE.value) || 0;
        const muK = parseFloat(dom.muK.value) || 0;
        const g = parseFloat(dom.g.value) || 9.81;
        const a = rad(deg), sA = Math.sin(a), cA = Math.cos(a);

        const P1 = m1 * g, P2 = m2 * g, P3 = m3 * g;
        const P1x = m1 * g * sA, P1y = m1 * g * cA;
        const P2x = m2 * g * sA, P2y = m2 * g * cA;
        const N1 = P1y, N2 = P2y;
        
        // Static friction test
        const f1_max = muE * N1, f2_max = muE * N2, fT_max = f1_max + f2_max;
        const Fnet = P3 - (P1x + P2x);

        let acc, T1, T2, dir, code, f1E, f2E, f1, f2;

        if (Math.abs(Fnet) <= fT_max) {
            dir = 'Equilíbrio'; code = 'eq'; acc = 0;
            T2 = P3;
            // The static friction needed to balance Fnet
            f1E = Fnet * m1 / (m1 + m2);
            f2E = Fnet * m2 / (m1 + m2);
            T1 = P1x + f1E; // Equivalent to P3 based on mass proportion or just the general equilibrium equation
            f1 = 0; f2 = 0; // Not moving, we don't have a single kinetic friction value
        } else {
            // Kinetic friction during movement
            f1 = muK * N1; f2 = muK * N2; 
            const fT = f1 + f2;
            
            if (Fnet > 0) {
                dir = 'Blocos sobem (m₃ desce)'; code = 'up';
                f1E = f1; f2E = f2;
                acc = (P3 - P1x - P2x - fT) / (m1 + m2 + m3);
                T1 = m1 * (acc + g * sA + muK * g * cA);
                T2 = m3 * (g - acc);
            } else {
                dir = 'Blocos descem (m₃ sobe)'; code = 'down';
                f1E = f1; f2E = f2;
                acc = (P3 - P1x - P2x + fT) / (m1 + m2 + m3);
                let absAcc = Math.abs(acc);
                T1 = m1 * (g * sA - muK * g * cA - absAcc);
                T2 = m3 * (absAcc + g);
            }
        }

        return {
            m1, m2, m3, g, deg, alpha: a, muE, muK, sA, cA,
            P1, P2, P3, P1x, P1y, P2x, P2y, N1, N2,
            f1, f2, f1E, f2E, T1, T2, fT_max,
            acc, Fr: (m1 + m2 + m3) * Math.abs(acc), dir, code
        };
    }

    // ── Canvas principal ──
    function drawMain(r) {
        const W = 900, H = 460;
        const ctx = hiDPI(dom.canvas, W, H);
        ctx.clearRect(0, 0, W, H);

        const alpha = r ? r.alpha : rad(30);
        const hyp = 360;
        const Bx = 600, By = 400;
        const Ax = Bx - hyp * Math.cos(alpha), Ay = By;
        const Cx = Bx, Cy = By - hyp * Math.sin(alpha);

        // Chão
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, By); ctx.lineTo(W - 40, By); ctx.stroke();

        // Triângulo
        ctx.fillStyle = 'rgba(60,60,90,0.15)';
        ctx.strokeStyle = '#3a3a5a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Cx, Cy); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Ângulo
        ctx.strokeStyle = '#6c9ef8';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(Ax, Ay, 35, -alpha, 0); ctx.stroke();
        ctx.fillStyle = '#6c9ef8';
        ctx.font = '500 12px Inter';
        ctx.fillText('α', Ax + 40 * Math.cos(alpha / 2), Ay - 14);

        // Ângulo reto
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Bx - 12, By); ctx.lineTo(Bx - 12, By - 12); ctx.lineTo(Bx, By - 12);
        ctx.stroke();

        // Posições dos blocos
        const bW = 48, bH = 30;
        const t1 = 0.28 + (anim ? animOff * 0.08 : 0);
        const t2 = 0.55 + (anim ? animOff * 0.08 : 0);
        const p = t => ({ x: Ax + (Cx - Ax) * t, y: Ay + (Cy - Ay) * t });
        const pos1 = p(t1), pos2 = p(t2);

        function drawBlock(px, py, col, label) {
            ctx.save(); ctx.translate(px, py); ctx.rotate(-alpha);
            ctx.fillStyle = col;
            rRect(ctx, -bW / 2, -bH, bW, bH, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            rRect(ctx, -bW / 2, -bH, bW, bH, 4); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '600 11px Inter';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, -bH / 2);
            ctx.restore();
        }

        drawBlock(pos1.x, pos1.y, '#c05050', 'm₁');
        drawBlock(pos2.x, pos2.y, '#40a098', 'm₂');

        // Cordas
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(pos1.x, pos1.y); ctx.lineTo(pos2.x, pos2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos2.x, pos2.y);
        ctx.lineTo(Cx - 14 * Math.sin(alpha), Cy - 14 * Math.cos(alpha));
        ctx.stroke();

        // Polia
        const pR = 14;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(Cx, Cy, pR, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2a'; ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(Cx, Cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#777'; ctx.fill();




        // m₃
        const m3X = Cx + pR + 18;
        const m3Off = anim ? animOff * 14 : 0;
        const m3Y = Cy + 95 + m3Off;
        const m3S = 42;
        // Corda
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(Cx + pR, Cy); ctx.lineTo(m3X, m3Y - m3S / 2); ctx.stroke();
        ctx.setLineDash([]);
        // Bloco
        ctx.fillStyle = '#b8a030';
        rRect(ctx, m3X - m3S / 2, m3Y - m3S / 2, m3S, m3S, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        rRect(ctx, m3X - m3S / 2, m3Y - m3S / 2, m3S, m3S, 4); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '600 11px Inter';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('m₃', m3X, m3Y);

        // Seta de direção
        if (r && r.code !== 'eq') {
            const mt = 0.75, mp = p(mt);
            const d = r.code === 'up' ? 1 : -1;
            const dx = (Cx - Ax) / hyp * d, dy = (Cy - Ay) / hyp * d;
            ctx.strokeStyle = ctx.fillStyle = r.code === 'up' ? '#5ab868' : '#d06060';
            ctx.lineWidth = 2.5;
            arrow(ctx, mp.x - dx * 18, mp.y - dy * 18, mp.x + dx * 18, mp.y + dy * 18, 9);
        }

        // Info
        if (r) {
            ctx.fillStyle = '#555'; ctx.font = '500 11px Inter'; ctx.textAlign = 'center';
            ctx.fillText(`α=${r.deg}°   μₑ=${r.muE}   μ𝒸=${r.muK}`, (Ax + Bx) / 2, By + 20);
        }
    }

    function arrow(ctx, x1, y1, x2, y2, h) {
        const a = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
        ctx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
        ctx.closePath(); ctx.fill();
    }


    // ── Resultados ──
    function showResults(r) {
        dom.results.classList.remove('hidden');
        const items = [
            ['Aceleração', fmt(r.acc), 'm/s²'],
            ['Força Resultante', fmt(r.Fr), 'N'],
            ['Sentido', r.dir, ''],
            ['Tensão T₁', fmt(Math.abs(r.T1)), 'N'],
            ['Tensão T₂', fmt(Math.abs(r.T2)), 'N'],
            ['Peso m₁', fmt(r.P1), 'N'],
            ['Peso m₂', fmt(r.P2), 'N'],
            ['Peso m₃', fmt(r.P3), 'N'],
            ['Normal N₁', fmt(r.N1), 'N'],
            ['Normal N₂', fmt(r.N2), 'N'],
            ['Atrito f₁', r.code === 'eq' ? fmt(Math.abs(r.f1E)) : fmt(r.f1), 'N'],
            ['Atrito f₂', r.code === 'eq' ? fmt(Math.abs(r.f2E)) : fmt(r.f2), 'N'],
        ];
        dom.grid.innerHTML = items.map(i =>
            `<div class="result-item">
                <div class="label">${i[0]}</div>
                <div class="value">${i[1]} <span class="unit">${i[2]}</span></div>
            </div>`
        ).join('');
    }

    // ── Tabelas ──
    function showTables(r) {
        dom.tables.classList.remove('hidden');
        const row = rows => rows.map(r =>
            `<tr><td>${r[0]}</td><td><span class="formula">${r[1]}</span></td><td>${r[2]} N</td></tr>`).join('');

        dom.tM1.innerHTML = row([
            ['Peso P₁', 'm₁·g', fmt(r.P1)],
            ['Comp. P₁ₓ', 'm₁·g·sin α', fmt(r.P1x)],
            ['Comp. P₁ᵧ', 'm₁·g·cos α', fmt(r.P1y)],
            ['Normal N₁', 'm₁·g·cos α', fmt(r.N1)],
            ['Atrito f₁', r.code === 'eq' ? '(estático)' : 'μ𝒸·N₁', r.code === 'eq' ? fmt(Math.abs(r.f1E)) : fmt(r.f1)],
            ['Tração T₁', '—', fmt(Math.abs(r.T1))],
        ]);
        dom.tM2.innerHTML = row([
            ['Peso P₂', 'm₂·g', fmt(r.P2)],
            ['Comp. P₂ₓ', 'm₂·g·sin α', fmt(r.P2x)],
            ['Comp. P₂ᵧ', 'm₂·g·cos α', fmt(r.P2y)],
            ['Normal N₂', 'm₂·g·cos α', fmt(r.N2)],
            ['Atrito f₂', r.code === 'eq' ? '(estático)' : 'μ𝒸·N₂', r.code === 'eq' ? fmt(Math.abs(r.f2E)) : fmt(r.f2)],
            ['Tração T₁', '(reação)', fmt(Math.abs(r.T1))],
            ['Tração T₂', '—', fmt(Math.abs(r.T2))],
        ]);
        dom.tM3.innerHTML = row([
            ['Peso P₃', 'm₃·g', fmt(r.P3)],
            ['Tração T₂', '—', fmt(Math.abs(r.T2))],
        ]);
    }

    // ── Passo a passo ──
    function showSteps(r) {
        dom.steps.classList.remove('hidden');
        const s = fmt, sn = r.sA, cs = r.cA;
        let h = '';

        h += blk('Passo 1 — Dados', [
            `m₁ = ${s(r.m1)} kg,  m₂ = ${s(r.m2)} kg,  m₃ = ${s(r.m3)} kg`,
            `α = ${r.deg}°  →  sin α = ${s(sn,4)},  cos α = ${s(cs,4)}`,
            `μₑ = ${r.muE}, μ𝒸 = ${r.muK},   g = ${s(r.g)} m/s²`,
        ]);

        h += blk('Passo 2 — Pesos', [
            `P₁ = ${s(r.m1)} × ${s(r.g)} = <span class="r">${s(r.P1)} N</span>`,
            `P₂ = ${s(r.m2)} × ${s(r.g)} = <span class="r">${s(r.P2)} N</span>`,
            `P₃ = ${s(r.m3)} × ${s(r.g)} = <span class="r">${s(r.P3)} N</span>`,
        ]);

        h += blk('Passo 3 — Componentes no Plano', [
            `P₁ₓ = ${s(r.m1)}·${s(r.g)}·sin ${r.deg}° = <span class="r">${s(r.P1x)} N</span>`,
            `P₁ᵧ = ${s(r.m1)}·${s(r.g)}·cos ${r.deg}° = <span class="r">${s(r.P1y)} N</span>`,
            `P₂ₓ = ${s(r.m2)}·${s(r.g)}·sin ${r.deg}° = <span class="r">${s(r.P2x)} N</span>`,
            `P₂ᵧ = ${s(r.m2)}·${s(r.g)}·cos ${r.deg}° = <span class="r">${s(r.P2y)} N</span>`,
        ]);

        h += blk('Passo 4 — Normais', [
            `N₁ = m₁·g·cos α = <span class="r">${s(r.N1)} N</span>`,
            `N₂ = m₂·g·cos α = <span class="r">${s(r.N2)} N</span>`,
        ]);

        h += blk('Passo 5 — Atrito (Max Estático)', [
            `f1_max = μₑ·N₁ = ${r.muE} × ${s(r.N1)} = <span class="r">${s(r.muE * r.N1)} N</span>`,
            `f2_max = μₑ·N₂ = ${r.muE} × ${s(r.N2)} = <span class="r">${s(r.muE * r.N2)} N</span>`,
            `f_max_total = <span class="r">${s(r.fT_max)} N</span>`,
        ]);

        const Fn = r.P3 - r.P1x - r.P2x, fM = r.fT_max;
        let d6 = [
            `F_net = P₃ − (P₁ₓ + P₂ₓ) = ${s(r.P3)} − ${s(r.P1x + r.P2x)} = <span class="r">${s(Fn)} N</span>`,
            `f_max_total = <span class="r">${s(fM)} N</span>`,
        ];
        if (r.code === 'eq') d6.push(`|F_net| ≤ f_max_total  →  <span class="hl">EQUILÍBRIO ESTÁTICO</span>`);
        else if (r.code === 'up') d6.push(`F_net > f_max_total  →  <span class="hl">Blocos SOBEM, m₃ DESCE</span>`);
        else d6.push(`|F_net| > f_max_total  →  <span class="hl">Blocos DESCEM, m₃ SOBE</span>`);
        h += blk('Passo 6 — Sentido do Movimento', d6);

        let d7;
        if (r.code === 'eq') {
            d7 = [`<span class="hl">a = 0 m/s²</span>`];
        } else if (r.code === 'up') {
            d7 = [
                `f_total (cinético) = μ𝒸·(N₁ + N₂) = ${s(r.f1 + r.f2)} N`,
                `a = [P₃ − (P₁ₓ+P₂ₓ) − f_total] / (m₁+m₂+m₃)`,
                `a = [${s(r.P3)} − ${s(r.P1x+r.P2x)} − ${s(r.f1 + r.f2)}] / ${s(r.m1+r.m2+r.m3)}`,
                `<span class="hl">a = ${s(r.acc)} m/s²</span>`,
            ];
        } else {
            d7 = [
                `f_total (cinético) = μ𝒸·(N₁ + N₂) = ${s(r.f1 + r.f2)} N`,
                `a = [P₃ − (P₁ₓ+P₂ₓ) + f_total] / (m₁+m₂+m₃)`,
                `a = [${s(r.P3)} − ${s(r.P1x+r.P2x)} + ${s(r.f1 + r.f2)}] / ${s(r.m1+r.m2+r.m3)}`,
                `<span class="hl">a = ${s(r.acc)} m/s²</span>`,
            ];
        }
        h += blk('Passo 7 — Aceleração', d7);

        let d8;
        if (r.code === 'eq') {
            d8 = [
                `Sistema em equilíbrio.`,
                `As trações equilibram F_net.`,
                `T₂ = m₃·g = <span class="r">${s(Math.abs(r.T2))} N</span>`,
                `T₁ = P₁ₓ + f₁_ef = <span class="r">${s(Math.abs(r.T1))} N</span>`,
            ];
        } else if (r.code === 'up') {
            d8 = [
                `T₁ = m₁(a + g·sinα + μ𝒸·g·cosα) = <span class="r">${s(Math.abs(r.T1))} N</span>`,
                `T₂ = m₃(g − a) = <span class="r">${s(Math.abs(r.T2))} N</span>`,
            ];
        } else {
            d8 = [
                `T₁ = m₁(g·sinα − μ𝒸·g·cosα − |a|) = <span class="r">${s(Math.abs(r.T1))} N</span>`,
                `T₂ = m₃(g + |a|) = <span class="r">${s(Math.abs(r.T2))} N</span>`,
            ];
        }
        h += blk('Passo 8 — Trações', d8);

        dom.stepsC.innerHTML = h;
    }

    function blk(title, lines) {
        return `<div class="step-block"><h4>${title}</h4>${lines.map(l => `<div class="eq">${l}</div>`).join('')}</div>`;
    }

    // ── Animação ──
    function startAnim() {
        if (!res || res.code === 'eq') return;
        anim = true; animOff = 0;
        dom.btnAnim.disabled = true; dom.btnStop.disabled = false;
        tick();
    }
    function stopAnim() {
        anim = false;
        if (animId) cancelAnimationFrame(animId);
        animId = null;
        dom.btnAnim.disabled = false; dom.btnStop.disabled = true;
        drawMain(res);
    }
    function tick() {
        if (!anim) return;
        const d = res.code === 'up' ? 1 : -1;
        animOff += d * 0.012;
        if (animOff > 1.2) animOff = -0.5;
        if (animOff < -0.8) animOff = 0.5;
        drawMain(res);
        animId = requestAnimationFrame(tick);
    }

    // ── Badge ──
    function setBadge(r) {
        const b = dom.badge;
        b.className = 'badge';
        if (r.code === 'up')   { b.textContent = '↗ Sobem'; b.classList.add('up'); }
        else if (r.code === 'down') { b.textContent = '↘ Descem'; b.classList.add('down'); }
        else { b.textContent = '⚖ Equilíbrio'; b.classList.add('eq'); }
    }

    // ── Handlers ──
    function doCalc(scroll) {
        const vals = [dom.m1, dom.m2, dom.m3, dom.angle, dom.g].map(e => parseFloat(e.value));
        if (vals.some(v => isNaN(v) || v <= 0)) return;
        const muE = parseFloat(dom.muE.value);
        const muK = parseFloat(dom.muK.value);
        if (isNaN(muE) || muE < 0 || isNaN(muK) || muK < 0) return;

        if (anim) stopAnim();
        res = calc();
        drawMain(res);
        showResults(res);
        showTables(res);
        showSteps(res);
        setBadge(res);
        dom.btnAnim.disabled = res.code === 'eq';
        dom.btnStop.disabled = true;
    }

    function doClear() {
        if (anim) stopAnim();
        dom.m1.value = 5; dom.m2.value = 3; dom.m3.value = 10;
        dom.angle.value = 30; dom.angleSlider.value = 30;
        dom.muE.value = 0.2; dom.muESlider.value = 20;
        dom.muK.value = 0.15; dom.muKSlider.value = 15;
        dom.g.value = 9.81;
        [dom.results, dom.tables, dom.steps].forEach(s => s.classList.add('hidden'));
        dom.badge.className = 'badge hidden';
        res = null;
        dom.btnAnim.disabled = dom.btnStop.disabled = true;
        drawMain(null);
    }

    // ── Init ──
    dom.btnCalc.addEventListener('click', () => doCalc(false));
    dom.btnClear.addEventListener('click', doClear);
    dom.btnAnim.addEventListener('click', startAnim);
    dom.btnStop.addEventListener('click', stopAnim);

    // Atualizações em tempo real — SEM rolar a página
    dom.angle.addEventListener('input', () => { dom.angleSlider.value = dom.angle.value; if (res) doCalc(false); });
    dom.angleSlider.addEventListener('input', () => { dom.angle.value = dom.angleSlider.value; if (res) doCalc(false); });
    dom.muE.addEventListener('input', () => { dom.muESlider.value = Math.round(parseFloat(dom.muE.value) * 100); if (res) doCalc(false); });
    dom.muESlider.addEventListener('input', () => { dom.muE.value = (parseInt(dom.muESlider.value) / 100).toFixed(2); if (res) doCalc(false); });
    dom.muK.addEventListener('input', () => { dom.muKSlider.value = Math.round(parseFloat(dom.muK.value) * 100); if (res) doCalc(false); });
    dom.muKSlider.addEventListener('input', () => { dom.muK.value = (parseInt(dom.muKSlider.value) / 100).toFixed(2); if (res) doCalc(false); });
    [dom.m1, dom.m2, dom.m3, dom.g].forEach(e => e.addEventListener('input', () => { if (res) doCalc(false); }));

    window.addEventListener('resize', () => {
        drawMain(res);
    });

    drawMain(null);
})();
