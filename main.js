// Funcao dedicada e segura para renderizar todas as formulas entre $ e $$
function renderMath(targetElement = document.body) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(targetElement, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }
}

// Inicializacao de Icones, Formulas Matematicas e Componentes
function initApp() {
  if (window.lucide) {
    lucide.createIcons();
  }
  renderMath(document.body);
  highlightMooreKmap("Y1");
  updateSimVisuals();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
window.addEventListener("load", () => renderMath(document.body));

// Barra de Progresso de Leitura
window.addEventListener("scroll", () => {
  const winScroll =
    document.body.scrollTop || document.documentElement.scrollTop;
  const height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
  const readingProgress = document.getElementById("reading-progress");
  if (readingProgress) {
    readingProgress.style.width = scrolled + "%";
  }
});

// Alternancia de Tema Claro / Escuro com suporte a mudanca em tempo real no sistema
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

const themeToggleDesktop = document.getElementById("theme-toggle-desktop");
if (themeToggleDesktop) {
  themeToggleDesktop.addEventListener("click", toggleTheme);
}

const themeToggleMobile = document.getElementById("theme-toggle-mobile");
if (themeToggleMobile) {
  themeToggleMobile.addEventListener("click", toggleTheme);
}

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  });

// ==========================================
// 1. SECAO ARQUITETURA: MOORE VS MEALY
// ==========================================
function setArchitecture(type) {
  const btnMoore = document.getElementById("btn-arch-moore");
  const btnMealy = document.getElementById("btn-arch-mealy");
  const feedforward = document.getElementById("mealy-feedforward");
  const wire = document.getElementById("mealy-wire");
  const badge = document.getElementById("arch-badge");
  const title = document.getElementById("arch-title");
  const exp = document.getElementById("arch-explanation");

  if (type === "moore") {
    btnMoore.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all bg-blue-600 text-white shadow";
    btnMealy.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all text-slate-600 dark:text-slate-300";
    feedforward.classList.remove("opacity-100");
    feedforward.classList.add("opacity-15");
    wire.classList.remove("flow-active");
    badge.textContent = "Arquitetura de Moore";
    badge.className =
      "text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold";
    title.innerHTML = "Saída depende exclusivamente do Estado Atual ($Q$)";
    exp.innerHTML =
      "Na <strong>Máquina de Moore</strong>, a linha vermelha superior está desconectada. A saída $Z$ é calculada apenas a partir dos Flip-Flops ($Q$). Por isso, nos diagramas de estado, a saída fica escrita <strong>dentro da bolinha do estado</strong>. Ela é mais segura contra ruídos nas entradas, mas geralmente precisa de mais estados.";
  } else {
    btnMealy.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all bg-emerald-600 text-white shadow";
    btnMoore.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all text-slate-600 dark:text-slate-300";
    feedforward.classList.remove("opacity-15");
    feedforward.classList.add("opacity-100");
    wire.classList.add("flow-active");
    badge.textContent = "Arquitetura de Mealy";
    badge.className =
      "text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold";
    title.innerHTML = "Saída depende do Estado Atual ($Q$) e da Entrada ($X$)";
    exp.innerHTML =
      "Na <strong>Máquina de Mealy</strong>, a via direta vermelha está ativa! A entrada $X$ alimenta diretamente o bloco combinacional de saída $g$. Por isso, a saída é anotada <strong>nas setas de transição ($X / Z$)</strong> e responde no mesmo instante em que a entrada muda, economizando Flip-Flops.";
  }
  renderMath(title);
  renderMath(exp);
}

// ==========================================
// 2. SIMULADOR PASSO A PASSO (MOORE & MEALY)
// ==========================================
const mooreMachine = {
  A: {
    code: "00",
    out: 0,
    next: { 0: "B", 1: "A" },
    desc: "Estado A ($00$): Inicial. Nenhum bit $0$ recente detectado. Saída $z = 0$.",
  },
  B: {
    code: "01",
    out: 0,
    next: { 0: "B", 1: "C" },
    desc: "Estado B ($01$): Bit $0$ detectado! Aguardando $x = 1$ para completar $01$. Saída $z = 0$.",
  },
  C: {
    code: "11",
    out: 1,
    next: { 0: "B", 1: "D" },
    desc: "Estado C ($11$): Sequência $01$ completa! Saída síncrona ativada ($z = 1$).",
  },
  D: {
    code: "10",
    out: 0,
    next: { 0: "B", 1: "D" },
    desc: "Estado D ($10$): Recebeu outro bit $1$ após a detecção. Aguardando novo $0$. Saída $z = 0$.",
  },
};

const mealyMachine = {
  A: {
    code: "0",
    next: { 0: "B", 1: "A" },
    out: { 0: 0, 1: 0 },
    desc: "Estado A ($y=0$): Nenhum bit $0$ pendente. Se vier $x=0$, avança para B.",
  },
  B: {
    code: "1",
    next: { 0: "B", 1: "A" },
    out: { 0: 0, 1: 1 },
    desc: "Estado B ($y=1$): Bit $0$ já armazenado! Se vier $x=1$ agora, a transição emite $z=1$ imediatamente!",
  },
};

let simState = {
  moore: "A",
  mealy: "A",
  lastInput: null,
  lastMealyOut: 0,
  step: 0,
  history: [],
  waveform: [
    { t: 0, x: 0, mooreZ: 0, mealyZ: 0, glitch: false, mealyGlitch: false },
  ],
};

function stepSimulation(x) {
  const prevMoore = simState.moore;
  const prevMealy = simState.mealy;

  const nextMoore = mooreMachine[prevMoore].next[x];
  const nextMealy = mealyMachine[prevMealy].next[x];
  const mealyOut = mealyMachine[prevMealy].out[x];
  const mooreOut = mooreMachine[nextMoore].out;

  simState.step++;
  simState.lastInput = x;
  simState.moore = nextMoore;
  simState.mealy = nextMealy;
  simState.lastMealyOut = mealyOut;

  simState.history.push({
    step: simState.step,
    x: x,
    mooreTransition: `${prevMoore}→${nextMoore}`,
    mooreZ: mooreOut,
    mealyTransition: `${prevMealy}→${nextMealy}`,
    mealyZ: mealyOut,
  });

  simState.waveform.push({
    t: simState.step,
    x: x,
    mooreZ: mooreOut,
    mealyZ: mealyOut,
    glitch: false,
    mealyGlitch: false,
  });

  updateSimVisuals(prevMoore, prevMealy, x);
}

function resetSimulation() {
  simState = {
    moore: "A",
    mealy: "A",
    lastInput: null,
    lastMealyOut: 0,
    step: 0,
    history: [],
    waveform: [
      { t: 0, x: 0, mooreZ: 0, mealyZ: 0, glitch: false, mealyGlitch: false },
    ],
  };
  updateSimVisuals();
  const tape = document.getElementById("history-tape");
  if (tape) {
    tape.innerHTML = `<div class="text-xs font-mono text-slate-400 italic">Simulação reiniciada no Estado A. Envie um bit acima!</div>`;
  }
  const alertEl = document.getElementById("glitch-alert");
  if (alertEl) {
    alertEl.classList.add("hidden");
    alertEl.innerHTML = "";
  }
}

function triggerGlitch() {
  const isStateB = simState.mealy === "B";
  const alertEl = document.getElementById("glitch-alert");

  const lastIndex = simState.waveform.length - 1;
  if (lastIndex >= 0) {
    simState.waveform[lastIndex].glitch = true;
    simState.waveform[lastIndex].mealyGlitch = isStateB;
  }

  if (alertEl) {
    alertEl.classList.remove("hidden");
    if (isStateB) {
      alertEl.innerHTML =
        '<div class="flex items-start gap-2.5 font-sans">' +
        '<i data-lucide="zap" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5"></i>' +
        "<div>" +
        '<span class="font-bold text-amber-900 dark:text-amber-200 block text-xs uppercase font-mono tracking-wider mb-0.5">Glitch Assoberbado na Saída de Mealy (z = 1)!</span>' +
        '<p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">' +
        "No estado B ($y=1$), a saída de Mealy tem caminho puramente combinacional: $z = x \\cdot y$. O pulso espúrio na entrada $x$ acionou imediatamente $z=1$ de forma assíncrona antes da borda do clock. Em contraste, a máquina de Moore permaneceu estável com $z=0$, filtrada com segurança pelos Flip-Flops." +
        "</p>" +
        "</div>" +
        "</div>";
    } else {
      alertEl.innerHTML =
        '<div class="flex items-start gap-2.5 font-sans">' +
        '<i data-lucide="info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"></i>' +
        "<div>" +
        '<span class="font-bold text-blue-900 dark:text-blue-200 block text-xs uppercase font-mono tracking-wider mb-0.5">Ruído na Entrada x (Estado A)</span>' +
        '<p class="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">' +
        'O pulso espúrio em $x$ ocorreu durante o estado A ($y=0$). Como $z = x \\cdot y = x \\cdot 0 = 0$, a saída de Mealy não foi ativada. Envie o bit $x=0$ para avançar ao estado B e clique em "Simular Glitch" novamente para presenciar o pulso espúrio na saída!' +
        "</p>" +
        "</div>" +
        "</div>";
    }
    renderMath(alertEl);
    if (window.lucide) lucide.createIcons();
  }

  drawTimingDiagram();
}

function updateSimVisuals(prevMoore = null, prevMealy = null, x = null) {
  const counter = document.getElementById("step-counter");
  if (counter) counter.textContent = `Ciclo t = ${simState.step}`;

  // Atualiza Textos Moore
  const mInfo = mooreMachine[simState.moore];
  const mooreStateEl = document.getElementById("moore-curr-state");
  if (mooreStateEl)
    mooreStateEl.textContent = `${simState.moore} (${mInfo.code})`;

  const mOutEl = document.getElementById("moore-curr-out");
  if (mOutEl) {
    mOutEl.textContent = mInfo.out;
    mOutEl.className =
      mInfo.out === 1 ? "text-emerald-500 font-bold" : "text-slate-500";
  }

  const mooreDescEl = document.getElementById("moore-desc");
  if (mooreDescEl) {
    mooreDescEl.innerHTML = `<strong>${mInfo.desc}</strong>`;
    renderMath(mooreDescEl);
  }

  // Atualiza Textos Mealy
  const meInfo = mealyMachine[simState.mealy];
  const mealyStateEl = document.getElementById("mealy-curr-state");
  if (mealyStateEl)
    mealyStateEl.textContent = `${simState.mealy} (${meInfo.code})`;

  const meOutEl = document.getElementById("mealy-curr-out");
  if (meOutEl) {
    meOutEl.textContent = simState.lastMealyOut;
    meOutEl.className =
      simState.lastMealyOut === 1
        ? "text-emerald-500 font-bold"
        : "text-slate-500";
  }

  const mealyDescEl = document.getElementById("mealy-desc");
  if (mealyDescEl) {
    mealyDescEl.innerHTML = `<strong>${meInfo.desc}</strong>`;
    renderMath(mealyDescEl);
  }

  // Destaca No Ativo Moore
  ["A", "B", "C", "D"].forEach((st) => {
    const circle = document.querySelector(`#moore-node-${st} circle`);
    if (circle) {
      if (st === simState.moore) {
        circle.setAttribute(
          "class",
          "fill-blue-500/10 dark:fill-blue-500/20 stroke-blue-500",
        );
        circle.setAttribute("stroke-width", "3.5");
      } else {
        circle.setAttribute(
          "class",
          "fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700",
        );
        circle.setAttribute("stroke-width", "2");
      }
    }
  });

  // Destaca Aresta Ativa Moore
  document.querySelectorAll('[id^="moore-edge-"]').forEach((el) => {
    el.setAttribute("stroke", "#64748b");
    el.setAttribute("stroke-width", "2");
    el.setAttribute("marker-end", "url(#m-arrow)");
    el.classList.remove("flow-active");
  });
  if (prevMoore && x !== null) {
    const activeEdge = document.getElementById(`moore-edge-${prevMoore}-${x}`);
    if (activeEdge) {
      activeEdge.setAttribute("stroke", "#3b82f6");
      activeEdge.setAttribute("stroke-width", "3");
      activeEdge.setAttribute("marker-end", "url(#m-arrow-active)");
      activeEdge.classList.add("flow-active");
    }
  }

  // Destaca No Ativo Mealy
  ["A", "B"].forEach((st) => {
    const circle = document.querySelector(`#mealy-node-${st} circle`);
    if (circle) {
      if (st === simState.mealy) {
        circle.setAttribute(
          "class",
          "fill-emerald-500/10 dark:fill-emerald-500/20 stroke-emerald-500",
        );
        circle.setAttribute("stroke-width", "3.5");
      } else {
        circle.setAttribute(
          "class",
          "fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700",
        );
        circle.setAttribute("stroke-width", "2");
      }
    }
  });

  // Destaca Aresta Ativa Mealy
  document.querySelectorAll('[id^="mealy-edge-"]').forEach((el) => {
    el.setAttribute("stroke", "#64748b");
    el.setAttribute("stroke-width", "2");
    el.setAttribute("marker-end", "url(#me-arrow)");
    el.classList.remove("flow-active");
  });
  if (prevMealy && x !== null) {
    const activeEdge = document.getElementById(`mealy-edge-${prevMealy}-${x}`);
    if (activeEdge) {
      activeEdge.setAttribute("stroke", "#10b981");
      activeEdge.setAttribute("stroke-width", "3");
      activeEdge.setAttribute("marker-end", "url(#me-arrow-active)");
      activeEdge.classList.add("flow-active");
    }
  }

  // Renderiza Fita de Historico
  if (simState.history.length > 0) {
    const tape = document.getElementById("history-tape");
    if (tape) {
      tape.innerHTML = simState.history
        .map(
          (item) => `
        <div class="shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border ${item.mooreZ === 1 || item.mealyZ === 1 ? "border-emerald-500/60 shadow-sm shadow-emerald-500/10" : "border-slate-200 dark:border-slate-800"} text-[11px] font-mono">
          <div class="flex items-center justify-between gap-3 text-slate-400">
            <span>t=${item.step}</span>
            <span class="font-bold text-slate-800 dark:text-white">x=${item.x}</span>
          </div>
          <div class="text-blue-500">Moore: ${item.mooreTransition} (z=${item.mooreZ})</div>
          <div class="text-emerald-500">Mealy: ${item.mealyTransition} (z=${item.mealyZ})</div>
        </div>
      `,
        )
        .join("");
      tape.scrollLeft = tape.scrollWidth;
    }
  }

  // Atualiza o Diagrama de Tempo (Waveforms)
  drawTimingDiagram();
}

function drawTimingDiagram() {
  const svg = document.getElementById("timing-svg");
  if (!svg) return;

  const history = simState.waveform || [];
  const totalSlots = Math.max(6, history.length);
  const slotW = 68;
  const startX = 105;
  const svgWidth = startX + totalSlots * slotW + 25;
  const svgHeight = 220;

  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
  svg.style.width = `${svgWidth}px`;

  const clkHigh = 26,
    clkLow = 50;
  const xHigh = 74,
    xLow = 98;
  const mooreHigh = 122,
    mooreLow = 146;
  const mealyHigh = 170,
    mealyLow = 194;

  let gridSvg = "";
  let clkPath = `M ${startX} ${clkLow}`;
  let xPath = `M ${startX} ${history[0] && history[0].x === 1 ? xHigh : xLow}`;
  let moorePath = `M ${startX} ${history[0] && history[0].mooreZ === 1 ? mooreHigh : mooreLow}`;
  let mealyPath = `M ${startX} ${history[0] && history[0].mealyZ === 1 ? mealyHigh : mealyLow}`;
  let glitchElements = "";

  for (let i = 0; i < totalSlots; i++) {
    const x0 = startX + i * slotW;
    const xMid = x0 + slotW / 2;
    const x1 = x0 + slotW;

    gridSvg += `
      <line x1="${x0}" y1="18" x2="${x0}" y2="204" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" opacity="0.35"/>
      <text x="${x0 + 4}" y="14" class="font-mono text-[10px] fill-slate-400 font-bold">t${i}</text>
    `;

    clkPath += ` L ${x0} ${clkHigh} L ${xMid} ${clkHigh} L ${xMid} ${clkLow} L ${x1} ${clkLow}`;

    if (i < history.length) {
      const cur = history[i];

      // Onda Entrada x
      const curXY = cur.x === 1 ? xHigh : xLow;
      xPath += ` L ${x0} ${curXY}`;

      if (cur.glitch) {
        const gStart = x0 + slotW * 0.35;
        const gEnd = x0 + slotW * 0.65;
        const gPulseY = cur.x === 1 ? xLow : xHigh;
        xPath += ` L ${gStart} ${curXY} L ${gStart} ${gPulseY} L ${gEnd} ${gPulseY} L ${gEnd} ${curXY} L ${x1} ${curXY}`;

        glitchElements += `
          <rect x="${gStart - 3}" y="${xHigh - 4}" width="${gEnd - gStart + 6}" height="32" rx="4" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2 2"/>
          <text x="${(gStart + gEnd) / 2}" y="${xHigh - 7}" text-anchor="middle" class="font-mono text-[9px] font-bold fill-amber-500">Glitch x</text>
        `;
      } else {
        xPath += ` L ${x1} ${curXY}`;
      }

      // Onda Saida z (Moore) - Estavel por todo o ciclo
      const curMooreY = cur.mooreZ === 1 ? mooreHigh : mooreLow;
      moorePath += ` L ${x0} ${curMooreY} L ${x1} ${curMooreY}`;

      // Onda Saida z (Mealy)
      const curMealyY = cur.mealyZ === 1 ? mealyHigh : mealyLow;
      mealyPath += ` L ${x0} ${curMealyY}`;

      if (cur.glitch && cur.mealyGlitch) {
        const gStart = x0 + slotW * 0.35;
        const gEnd = x0 + slotW * 0.65;
        mealyPath += ` L ${gStart} ${curMealyY} L ${gStart} ${mealyHigh} L ${gEnd} ${mealyHigh} L ${gEnd} ${curMealyY} L ${x1} ${curMealyY}`;

        glitchElements += `
          <rect x="${gStart - 4}" y="${mealyHigh - 6}" width="${gEnd - gStart + 8}" height="34" rx="4" fill="#ef4444" fill-opacity="0.25" stroke="#ef4444" stroke-width="1.5"/>
          <text x="${(gStart + gEnd) / 2}" y="${mealyHigh - 8}" text-anchor="middle" class="font-mono text-[9px] font-bold fill-rose-500">! Glitch Mealy</text>
        `;
      } else {
        mealyPath += ` L ${x1} ${curMealyY}`;
      }
    } else {
      xPath += ` L ${x1} ${xLow}`;
      moorePath += ` L ${x1} ${mooreLow}`;
      mealyPath += ` L ${x1} ${mealyLow}`;
    }
  }

  const lastX = startX + totalSlots * slotW;
  gridSvg += `
    <line x1="${lastX}" y1="18" x2="${lastX}" y2="204" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3" opacity="0.35"/>
  `;

  svg.innerHTML = `
    <!-- Fundo das pistas -->
    <rect x="0" y="20" width="${svgWidth}" height="36" fill="rgba(148, 163, 184, 0.05)" rx="6"/>
    <rect x="0" y="68" width="${svgWidth}" height="36" fill="rgba(148, 163, 184, 0.08)" rx="6"/>
    <rect x="0" y="116" width="${svgWidth}" height="36" fill="rgba(148, 163, 184, 0.05)" rx="6"/>
    <rect x="0" y="164" width="${svgWidth}" height="36" fill="rgba(148, 163, 184, 0.08)" rx="6"/>

    <!-- Rotulos dos Canais a Esquerda -->
    <g class="font-mono text-xs font-bold select-none">
      <text x="14" y="42" fill="#818cf8">CLK</text>
      <text x="14" y="90" fill="#3b82f6">x (In)</text>
      <text x="14" y="138" fill="#38bdf8">z Moore</text>
      <text x="14" y="186" fill="#10b981">z Mealy</text>
    </g>

    <!-- Linhas de referencia pontilhadas -->
    <g stroke="currentColor" class="text-slate-300 dark:text-slate-800" stroke-width="0.75" stroke-dasharray="2 4">
      <line x1="${startX}" y1="${clkHigh}" x2="${svgWidth}" y2="${clkHigh}"/>
      <line x1="${startX}" y1="${clkLow}" x2="${svgWidth}" y2="${clkLow}"/>
      <line x1="${startX}" y1="${xHigh}" x2="${svgWidth}" y2="${xHigh}"/>
      <line x1="${startX}" y1="${xLow}" x2="${svgWidth}" y2="${xLow}"/>
      <line x1="${startX}" y1="${mooreHigh}" x2="${svgWidth}" y2="${mooreHigh}"/>
      <line x1="${startX}" y1="${mooreLow}" x2="${svgWidth}" y2="${mooreLow}"/>
      <line x1="${startX}" y1="${mealyHigh}" x2="${svgWidth}" y2="${mealyHigh}"/>
      <line x1="${startX}" y1="${mealyLow}" x2="${svgWidth}" y2="${mealyLow}"/>
    </g>

    <!-- Grade Vertical -->
    ${gridSvg}

    <!-- Linhas de Sinal -->
    <path d="${clkPath}" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${xPath}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${moorePath}" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${mealyPath}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>

    <!-- Elementos de Destaque de Glitch -->
    ${glitchElements}
  `;

  const container = document.getElementById("timing-diagram-container");
  if (container) {
    container.scrollLeft = container.scrollWidth;
  }
}

function inspectState(machine, state) {
  if (machine === "moore") {
    const info = mooreMachine[state];
    const el = document.getElementById("moore-desc");
    if (el) {
      el.innerHTML = `<strong>Inspeção • ${info.desc}</strong>`;
      renderMath(el);
    }
  } else {
    const info = mealyMachine[state];
    const el = document.getElementById("mealy-desc");
    if (el) {
      el.innerHTML = `<strong>Inspeção • ${info.desc}</strong>`;
      renderMath(el);
    }
  }
}

function runDemoSequence() {
  resetSimulation();
  const seq = [1, 0, 1, 0, 1];
  seq.forEach((bit, idx) => {
    setTimeout(() => stepSimulation(bit), (idx + 1) * 450);
  });
}

// ==========================================
// 3. MAPAS DE KARNAUGH INTERATIVOS
// ==========================================
function setSynthesisTab(tab) {
  const pMoore = document.getElementById("synth-panel-moore");
  const pMealy = document.getElementById("synth-panel-mealy");
  const bMoore = document.getElementById("btn-synth-moore");
  const bMealy = document.getElementById("btn-synth-mealy");

  if (tab === "moore") {
    pMoore.classList.remove("hidden");
    pMealy.classList.add("hidden");
    bMoore.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all bg-blue-600 text-white shadow";
    bMealy.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all text-slate-600 dark:text-slate-300";
    renderMath(pMoore);
  } else {
    pMealy.classList.remove("hidden");
    pMoore.classList.add("hidden");
    bMealy.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all bg-emerald-600 text-white shadow";
    bMoore.className =
      "px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all text-slate-600 dark:text-slate-300";
    renderMath(pMealy);
  }
}

const kmapData = {
  Y1: {
    title: "Mapa de Karnaugh para Próximo Estado $Y_1$ ($D_1$)",
    values: {
      "00-0": 0,
      "00-1": 0,
      "01-0": 0,
      "01-1": 1,
      "11-0": 0,
      "11-1": 1,
      "10-0": 0,
      "10-1": 1,
    },
    ones: ["01-1", "11-1", "10-1"],
    exp: 'Agrupando os três "1"s na coluna $x=1$: $Y_1 = x \\cdot y_0 + x \\cdot y_1 = x \\cdot (y_1 + y_0)$',
  },
  Y0: {
    title: "Mapa de Karnaugh para Próximo Estado $Y_0$ ($D_0$)",
    values: {
      "00-0": 1,
      "00-1": 0,
      "01-0": 1,
      "01-1": 1,
      "11-0": 1,
      "11-1": 0,
      "10-0": 1,
      "10-1": 0,
    },
    ones: ["00-0", "01-0", "11-0", "10-0", "01-1"],
    exp: "Coluna inteira $x=0$ vale 1 (termo $\\overline{x}$) mais o par na linha 01 (termo $\\overline{y_1} \\cdot y_0$): $Y_0 = \\overline{x} + \\overline{y_1} \\cdot y_0$",
  },
  z: {
    title: "Mapa de Karnaugh para a Saída de Moore $z$",
    values: {
      "00-0": 0,
      "00-1": 0,
      "01-0": 0,
      "01-1": 0,
      "11-0": 1,
      "11-1": 1,
      "10-0": 0,
      "10-1": 0,
    },
    ones: ["11-0", "11-1"],
    exp: "A saída $z$ independe de $x$! Linha 11 inteira ativa: $z = y_1 \\cdot y_0$",
  },
};

function highlightMooreKmap(funcKey) {
  ["Y1", "Y0", "z"].forEach((k) => {
    const btn = document.getElementById(`kbtn-${k}`);
    if (btn) {
      if (k === funcKey) {
        btn.className =
          "px-4 py-2 rounded-xl text-xs font-mono font-bold bg-blue-600 text-white shadow transition-all";
      } else {
        btn.className =
          "px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all";
      }
    }
  });

  const data = kmapData[funcKey];
  const titleEl = document.getElementById("kmap-title");
  const expEl = document.getElementById("kmap-explanation");
  if (titleEl) titleEl.innerHTML = data.title;
  if (expEl) expEl.innerHTML = data.exp;
  if (titleEl) renderMath(titleEl);
  if (expEl) renderMath(expEl);

  Object.keys(data.values).forEach((coord) => {
    const cell = document.getElementById(`kcell-${coord}`);
    if (cell) {
      const val = data.values[coord];
      cell.textContent = val;
      if (data.ones.includes(coord)) {
        cell.className =
          "kmap-cell p-3 rounded-xl border-2 border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold scale-105 shadow-sm";
      } else {
        cell.className =
          "kmap-cell p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400";
      }
    }
  });
}

// ==========================================
// 4. QUIZ DE REVISAO
// ==========================================
function checkQuiz(btn, isCorrect, qId) {
  const feedback = document.getElementById(`${qId}-feedback`);
  if (!feedback) return;
  feedback.classList.remove("hidden");
  if (isCorrect) {
    btn.className =
      "w-full text-left p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold transition-all";
    feedback.innerHTML =
      "✓ Resposta correta! Excelente domínio do conceito de estados ($2^n$ combinações).";
    feedback.className = "text-xs font-mono pt-1 text-emerald-500 font-bold";
  } else {
    btn.className =
      "w-full text-left p-3 rounded-xl border-2 border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs transition-all";
    feedback.innerHTML =
      "✗ Tente novamente! Observe a relação entre estados ($Q^t$) e Flip-Flops.";
    feedback.className = "text-xs font-mono pt-1 text-rose-500";
  }
  renderMath(feedback);
}

// Registro do Service Worker do PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
