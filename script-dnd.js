// ============================================
// OC FOUNDRY — D&D 5E GENERATOR
// Inline Spinning Dice Logic
// ============================================

let selectedClass = "any";
let selectedRace = "any";
let currentDndCharacter = null;
let rollCount = 0;
let isRolling = false;

const pick = (list) => (list && list.length) ? list[Math.floor(Math.random() * list.length)] : "";

function generateAbilityScores(primaryStat = "str") {
  const standardArray = [15, 14, 13, 12, 10, 8];
  const shuffled = [...standardArray].sort(() => Math.random() - 0.5);

  const stats = { str: 10, dex: 10, con: 12, int: 10, wis: 10, cha: 10 };
  const keys = ["str", "dex", "con", "int", "wis", "cha"];

  stats[primaryStat] = 15;

  const remainingKeys = keys.filter((k) => k !== primaryStat);
  const remainingScores = shuffled.filter((s) => s !== 15);

  remainingKeys.forEach((key, i) => {
    stats[key] = remainingScores[i] || 10;
  });

  const formatMod = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return `${score} (${mod >= 0 ? "+" + mod : mod})`;
  };

  return {
    str: formatMod(stats.str),
    dex: formatMod(stats.dex),
    con: formatMod(stats.con),
    int: formatMod(stats.int),
    wis: formatMod(stats.wis),
    cha: formatMod(stats.cha),
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function buildCharacter() {
  const raceKeys = Object.keys(dndData.races);
  const classKeys = Object.keys(dndData.classes);

  const raceKey = selectedRace === "any" ? pick(raceKeys) : selectedRace;
  const classKey = selectedClass === "any" ? pick(classKeys) : selectedClass;

  const raceObj = dndData.races[raceKey];
  const classObj = dndData.classes[classKey];

  const nameList = dndData.names[raceKey] || dndData.names.human;
  const name = pick(nameList) || "Adventurer";
  const background = pick(dndData.backgrounds) || "Folk Hero";
  const alignment = pick(dndData.alignments) || "Neutral Good";
  const hook = pick(dndData.hooks) || "A mysterious hero with unfinished business.";
  const gear = pick(dndData.equipment) || "Traveler's clothes, a dagger, and 10 gp.";
  const feature = dndData.features[classKey] || "Class Feature";
  const palette = pick(dndData.palettes) || ["#E9A5A2", "#F6D7AC", "#8DB9AA", "#5B617C"];
  const scores = generateAbilityScores(classObj.primary || "str");

  // Fill UI
  setText("dnd-name", name);
  setText("dnd-meta", `${raceObj.name} ${classObj.name} · ${background}`);
  setText("dnd-alignment", alignment);
  setText("dnd-hook", `"${hook}"`);

  setText("stat-str", scores.str);
  setText("stat-dex", scores.dex);
  setText("stat-con", scores.con);
  setText("stat-int", scores.int);
  setText("stat-wis", scores.wis);
  setText("stat-cha", scores.cha);

  setText("dnd-feature", feature);
  setText("dnd-gear", gear);
  setText("dnd-personality", `Driven by a code of ${alignment}. ${raceObj.traits}`);
  setText(
    "dnd-prompt",
    `Miniature / Art Concept: Frame ${name} mid-action using ${feature.split("&")[0].trim()}, with gear that reflects their ${background} background.`
  );

  rollCount += 1;
  setText("sheet-number", `NO. ${String(rollCount).padStart(3, "0")}`);

  const paletteEl = document.getElementById("palette");
  if (paletteEl) {
    paletteEl.innerHTML = `
      <div class="palette-stack">
        ${palette
          .map(
            (color) => `
          <div class="swatch-row" title="Click to copy ${color}" onclick="navigator.clipboard.writeText('${color}')">
            <div class="swatch-pill" style="background-color:${color} !important;"></div>
            <span class="swatch-code">${color}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

          const ideal = pick(dndData.ideals) || "Greater Good: Protecting the innocent.";
    const bond = pick(dndData.bonds) || "Bound by oath to an old mentor.";
    const flaw = pick(dndData.flaws) || "Overly trusting of dangerous strangers.";
    const trinket = pick(dndData.trinkets) || "A brass orb that hums quietly.";
    const spellList = dndData.spells[classKey] || "Class Abilities & Martial Mastery";

    currentDndCharacter = {
      name,
      archetype: `${raceObj.name} ${classObj.name} (${background})`,
      age: alignment,
      hook,
      visual: `5e ${raceObj.name} ${classObj.name} with ${background} background. Primary gear: ${gear}`,
      personality: `Driven by a code of ${alignment}. ${raceObj.traits}`,
      detail: `Feature: ${feature}`,
      tension: `Flaw: ${flaw}`,
      scene: `D&D 5e Key Moment: ${name} using ${feature} in a critical encounter.`,
      palette,
      world: "fantasy",
      isDnd: true,
      dndClass: classKey,
      dndRace: raceKey,
      dndBackground: background,
      dndAlignment: alignment,
      scores,
      feature,
      gear,
      ideal,
      bond,
      flaw,
      trinket,
      spellList
    };
  
  localStorage.setItem("ocFoundryCharacter", JSON.stringify(currentDndCharacter));

  const emptyState = document.getElementById("empty-state");
  const resultContent = document.getElementById("result-content");
  const unlockTease = document.getElementById("unlock-tease");
  const characterSheet = document.getElementById("character-sheet");

  if (emptyState) emptyState.hidden = true;
  if (resultContent) resultContent.hidden = false;
  if (unlockTease) unlockTease.hidden = false;
  setText("tease-name", name.split(" ")[0]);
  if (characterSheet) characterSheet.classList.remove("empty");
}

function rollDndCharacter() {
  if (isRolling) return;
  if (typeof dndData === "undefined") {
    alert("D&D data failed to load. Please refresh the page.");
    return;
  }

  isRolling = true;

  const diceBox = document.getElementById("inline-dice");
  const diceIcon = document.getElementById("dice-icon");
  const diceLabel = document.getElementById("dice-label");
  const button = document.getElementById("dnd-generate");

  // 1. Reveal small inline dice below button and start spin
  if (diceBox) diceBox.hidden = false;
  if (diceIcon) diceIcon.classList.add("spinning");
  if (diceLabel) diceLabel.textContent = "Rolling d20...";

    const d20Svg = `<svg class="d20-svg" viewBox="0 0 24 24"><path d="M12 2L2.5 7.5v9L12 22l9.5-5.5v-9L12 2zm0 2.3l6.8 3.7-2.9 5.1L12 10.4V4.3zm-6.8 3.7L12 4.3v6.1L7.7 12.8 5.2 8zm-0.2 1.8l2.5 5.1-2.5 1.1V9.8zm6.8 9.9l-5.7-3.3 2.5-2 3.2 1.9v3.4zm0-5.1L8 12.4 12 5.8l4 6.6-4 2.2zm0 5.1v-3.4l3.2-1.9 2.5 2-5.7 3.3zm6.8-5.3l-2.5-1.1 2.5-5.1v6.2z"/></svg>`;

  if (button) {
    button.disabled = true;
    button.style.opacity = "0.7";
    button.innerHTML = `<span class="spark">${d20Svg}</span> Rolling... <span class="arrow">→</span>`;
  }

  // 2. Spin for 600ms
  setTimeout(() => {
    // 3. Stop spinning & reveal roll result
    if (diceIcon) diceIcon.classList.remove("spinning");
    const d20 = Math.floor(Math.random() * 20) + 1;
    if (diceLabel) {
      diceLabel.textContent = d20 === 20 ? "Natural 20! ✨" : `Rolled a ${d20}!`;
    }

    // 4. Generate & display character sheet
    buildCharacter();

        if (button) {
      button.disabled = false;
      button.style.opacity = "1";
      button.innerHTML = `<span class="spark">${d20Svg}</span> Roll D&amp;D Character <span class="arrow">→</span>`;
    }

    // 5. Hide dice after 1.2s
    setTimeout(() => {
      if (diceBox) diceBox.hidden = true;
      isRolling = false;
    }, 1200);

  }, 600);
}

// Filters
document.querySelectorAll("#class-filters .filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedClass = btn.dataset.class;
    document
      .querySelectorAll("#class-filters .filter")
      .forEach((b) => b.classList.toggle("active", b === btn));
  });
});

document.querySelectorAll("#race-filters .filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedRace = btn.dataset.race;
    document
      .querySelectorAll("#race-filters .filter")
      .forEach((b) => b.classList.toggle("active", b === btn));
  });
});

// Buttons
const genBtn = document.getElementById("dnd-generate");
if (genBtn) genBtn.addEventListener("click", rollDndCharacter);

const regenBtn = document.getElementById("dnd-regenerate");
if (regenBtn) regenBtn.addEventListener("click", rollDndCharacter);

const rerollBtn = document.getElementById("dnd-reroll");
if (rerollBtn) {
  rerollBtn.addEventListener("click", () => {
    if (!currentDndCharacter) return;
    const raceKey = selectedRace === "any" ? "human" : selectedRace;
    const nameList = dndData.names[raceKey] || dndData.names.human;
    const newName = pick(nameList);
    setText("dnd-name", newName);
    currentDndCharacter.name = newName;
    localStorage.setItem("ocFoundryCharacter", JSON.stringify(currentDndCharacter));
  });
}

// Bucket
// ============================================
// BUCKET / CART (same rules as OC generator)
// ============================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("ocFoundryCart") || "[]");
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("ocFoundryCart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = getCart().length;
  badge.textContent = count;
  badge.hidden = count === 0;
}

function addToCart(character) {
  if (!character) return { ok: false, reason: "No character" };

  const cart = getCart();

  // Block exact duplicates (same as OC generator)
  const alreadyInCart = cart.some(item =>
    item.name === character.name &&
    item.archetype === character.archetype &&
    item.hook === character.hook
  );

  if (alreadyInCart) {
    return { ok: false, reason: "Already in bucket" };
  }

  if (cart.length >= 10) {
    return { ok: false, reason: "Bucket full (max 10)" };
  }

  cart.push({
    ...character,
    cartId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  });

  saveCart(cart);
  return { ok: true, count: cart.length };
}

const addBucketBtn = document.getElementById("add-to-bucket");
if (addBucketBtn) {
  addBucketBtn.addEventListener("click", () => {
    if (!currentDndCharacter) return;

    // Keep latest character saved
    localStorage.setItem("ocFoundryCharacter", JSON.stringify(currentDndCharacter));

    const result = addToCart(currentDndCharacter);

    if (result.ok) {
      addBucketBtn.textContent = `Added ✓ (${result.count})`;
    } else {
      addBucketBtn.textContent = result.reason;
    }

    setTimeout(() => {
      addBucketBtn.textContent = "Add to bucket";
    }, 1600);
  });
}

// Show current bucket count on page load
updateCartBadge();
