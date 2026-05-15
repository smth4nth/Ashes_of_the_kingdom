const N = 5;
const OBJECT_NAMES = ["a", "b", "c", "d", "e"];

const COLOR_ALIASES = {
  r: { key: "r", label: "红", css: "#dc2626" },
  h: { key: "r", label: "红", css: "#dc2626" },
  红: { key: "r", label: "红", css: "#dc2626" },
  red: { key: "r", label: "红", css: "#dc2626" },

  g: { key: "g", label: "绿", css: "#16a34a" },
  绿: { key: "g", label: "绿", css: "#16a34a" },
  green: { key: "g", label: "绿", css: "#16a34a" },

  b: { key: "b", label: "蓝", css: "#2563eb" },
  蓝: { key: "b", label: "蓝", css: "#2563eb" },
  blue: { key: "b", label: "蓝", css: "#2563eb" },

  y: { key: "y", label: "黄", css: "#ca8a04" },
  黄: { key: "y", label: "黄", css: "#ca8a04" },
  yellow: { key: "y", label: "黄", css: "#ca8a04" },

  p: { key: "p", label: "紫", css: "#9333ea" },
  紫: { key: "p", label: "紫", css: "#9333ea" },
  purple: { key: "p", label: "紫", css: "#9333ea" },
};

const COLOR_BY_KEY = {
  r: COLOR_ALIASES.r,
  g: COLOR_ALIASES.g,
  b: COLOR_ALIASES.b,
  y: COLOR_ALIASES.y,
  p: COLOR_ALIASES.p,
};

const form = document.querySelector("#solverForm");
const hammerInput = document.querySelector("#hammerInput");
const paintInput = document.querySelector("#paintInput");
const exampleButton = document.querySelector("#exampleButton");
const messageEl = document.querySelector("#message");
const maxMatchEl = document.querySelector("#maxMatch");
const moveListEl = document.querySelector("#moveList");
const finalBoardEl = document.querySelector("#finalBoard");
const stepsEl = document.querySelector("#steps");

function parseColors(raw) {
  const clean = raw.trim().toLowerCase();
  const compact = clean.replace(/[\s,，、;；]+/g, "");
  const source = compact.length === N ? [...compact] : clean.split(/[\s,，、;；]+/);
  const colors = source.filter(Boolean).map((token) => {
    const color = COLOR_ALIASES[token];
    if (!color) {
      throw new Error(`不认识颜色 "${token}"`);
    }
    return color.key;
  });

  if (colors.length !== N) {
    throw new Error("木槌和颜料都需要刚好 5 个颜色");
  }

  return colors;
}

function stateKey(state) {
  return `${state.paints.join("")}|${state.hammers.join("")}`;
}

function countMatches(state) {
  return state.paints.filter((color, index) => color === state.hammers[index]).length;
}

function applyMove(state, index) {
  const paints = [...state.paints];
  const hammers = [...state.hammers];
  const left = (index - 1 + N) % N;
  const rightSecond = (index + 2) % N;

  [paints[index], paints[left]] = [paints[left], paints[index]];
  [hammers[index], hammers[rightSecond]] = [hammers[rightSecond], hammers[index]];

  return { paints, hammers };
}

function solve(paints, hammers) {
  const start = { paints, hammers };
  const queue = [start];
  const parents = new Map([[stateKey(start), null]]);
  const states = new Map([[stateKey(start), start]]);
  const parentMoves = new Map();
  let bestState = start;
  let bestScore = countMatches(start);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor];
    const score = countMatches(state);

    if (score > bestScore) {
      bestScore = score;
      bestState = state;
    }

    if (bestScore === N) {
      break;
    }

    OBJECT_NAMES.forEach((name, index) => {
      const nextState = applyMove(state, index);
      const key = stateKey(nextState);
      if (parents.has(key)) {
        return;
      }

      parents.set(key, stateKey(state));
      parentMoves.set(key, name);
      states.set(key, nextState);
      queue.push(nextState);
    });
  }

  const moves = [];
  let currentKey = stateKey(bestState);
  while (parents.get(currentKey) !== null) {
    moves.push(parentMoves.get(currentKey));
    currentKey = parents.get(currentKey);
  }
  moves.reverse();

  const timeline = [{ move: "开始", state: start }];
  let replay = start;
  moves.forEach((moveName) => {
    const moveIndex = OBJECT_NAMES.indexOf(moveName);
    replay = applyMove(replay, moveIndex);
    timeline.push({ move: moveName, state: replay });
  });

  return {
    maxMatch: bestScore,
    moves,
    finalState: bestState,
    timeline,
  };
}

function colorLabel(key) {
  return COLOR_BY_KEY[key].label;
}

function renderSwatch(key) {
  const color = COLOR_BY_KEY[key];
  return `<span class="swatch" style="background:${color.css}">${color.label}</span>`;
}

function renderBoard(state) {
  finalBoardEl.innerHTML = OBJECT_NAMES.map((name, index) => {
    const matched = state.paints[index] === state.hammers[index];
    const paint = state.paints[index];
    const hammer = state.hammers[index];
    return `
      <article class="object-card">
        <div class="object-name">
          <span>${name}</span>
          ${matched ? '<em>合</em>' : '<em class="miss">差</em>'}
        </div>
        <div class="object-dial">
          <div class="dial-ring">
            ${renderSwatch(paint)}
          </div>
          <div class="object-readout">
            <span>颜料 ${colorLabel(paint)}</span>
            <span>木槌 ${colorLabel(hammer)}</span>
          </div>
        </div>
        ${matched ? '<div class="match-badge">MATCH</div>' : '<div class="match-badge miss">未合</div>'}
      </article>
    `;
  }).join("");
}

function explainMove(moveName) {
  if (moveName === "开始") {
    return "输入后的原始状态。";
  }

  const index = OBJECT_NAMES.indexOf(moveName);
  const left = OBJECT_NAMES[(index - 1 + N) % N];
  const rightSecond = OBJECT_NAMES[(index + 2) % N];
  return `动 ${moveName}：颜料和 ${left} 交换，木槌和 ${rightSecond} 交换。`;
}

function renderSteps(timeline) {
  stepsEl.innerHTML = timeline.map((entry, index) => {
    const paints = entry.state.paints.map(colorLabel).join(" ");
    const hammers = entry.state.hammers.map(colorLabel).join(" ");
    return `
      <article class="step-card">
        <div class="step-title">${index === 0 ? "开始" : `第 ${index} 步：${entry.move}`}</div>
        <p>${explainMove(entry.move)}</p>
        <p>颜料：${paints}</p>
        <p>木槌：${hammers}</p>
      </article>
    `;
  }).join("");
}

function runSolver() {
  try {
    messageEl.textContent = "";
    const hammers = parseColors(hammerInput.value);
    const paints = parseColors(paintInput.value);
    const result = solve(paints, hammers);

    maxMatchEl.textContent = `${result.maxMatch} / 5`;
    moveListEl.textContent = result.moves.length ? result.moves.join(" -> ") : "已经是最佳";
    renderBoard(result.finalState);
    renderSteps(result.timeline);
  } catch (error) {
    messageEl.textContent = error.message;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSolver();
});

exampleButton.addEventListener("click", () => {
  hammerInput.value = "pgryb";
  paintInput.value = "pbgyr";
  runSolver();
});

runSolver();
