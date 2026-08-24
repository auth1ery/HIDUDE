// Copyright (C) 2026 Ivy Lopez
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

const savekey = "hi-dude-save-v4";
const $ = (id) => document.getElementById(id);

const defaultState = {
  dudes: 5,
  maxdudes: 5,
  hidudes: 0,
  dudecost: 10,
  upgradecost: 100,
  multiplier: 1,
  presslevel: 1,
  presscost: 50,
  smashes: 0,
  crits: 0,
  autosmashers: 0,
  autocost: 250,
  critchance: 0.02,
  critmult: 5,
  critupgrades: 0,
  critcost: 300,
  critmultupgrades: 0,
  critmultcost: 900,
  comboupgrades: 0,
  combocost: 400,
  maxdudeupgrades: 0,
  maxdudecost: 350,
  gloves: 0,
  glovecost: 800,
  furnace: 0,
  furnacecost: 1500,
  turbofurnace: 0,
  turbofurnacecost: 5000,
  academy: 0,
  academycost: 1800,
  secondpress: 0,
  secondpresscost: 4000,
  shrine: 0,
  shrinecost: 2500,
  stabilizer: 0,
  stabilizercost: 1800,
  restwell: 0,
  restwellcost: 80,
  snack: 0,
  snackcost: 70,
  warmup: 0,
  warmupcost: 90,
  quickhands: 0,
  quickhandscost: 100,
  comboprimer: 0,
  comboprimercost: 110,
  oilcan: 0,
  oilcancost: 150,
  luckycharm: 0,
  luckycharmcost: 130,
  dudeshards: 0,
  dudetokens: 0,
  tokenpresstier: 0,
  tokenpresscost: 5,
  tokenautotier: 0,
  tokenautocost: 8,
  ascensions: 0,
  totalhidudesever: 0,
  runhidudes: 0,
  guaranteedCrit: false,
  totalsmashesever: 0,
  achievements: {},
  seenUnlocks: {},
  lastseen: Date.now(),
  offlineEnabled: true,
  reducedMotion: false,
  compactNumbers: true,
  stickyHeader: false,
  dojobest: 0,
  goldenclicks: 0,
};

let s = Object.assign(
  {},
  defaultState,
  JSON.parse(localStorage.getItem(savekey) || "null") || {},
);
s.lastseen = s.lastseen || Date.now();

let buymode = 1;
let comboTimer = 0;
let comboCount = 0;
let eventTimeout = null;

function fmt(n) {
  n = Math.floor(n);
  if (!s.compactNumbers) return n.toLocaleString();
  if (n < 1000) return String(n);
  const units = ["", "k", "m", "b", "t", "qa", "qi", "sx", "sp"];
  let u = 0;
  let v = n;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return v.toFixed(2) + units[u];
}

function shardMultiplier() {
  return 1 + s.dudeshards * 0.1;
}

function comboMultiplier() {
  return (
    1 +
    Math.min(comboCount, 20) * (0.02 * (1 + s.comboupgrades)) +
    s.comboprimer * 0.01
  );
}

function pressLevelEffective() {
  return s.presslevel * (1 + s.secondpress * 0.5) + s.warmup * 0.2;
}

function gainPerSmash() {
  return (
    s.multiplier *
    (1 + s.snack * 0.05) *
    pressLevelEffective() *
    shardMultiplier() *
    (1 + s.tokenpresstier * 0.2)
  );
}

function glovesBonus() {
  return 1 + s.gloves * 0.25;
}

function furnaceBonus() {
  return (
    (1 + s.furnace * 0.5) *
    (1 + s.turbofurnace * 1.5) *
    (1 + s.tokenautotier * 0.3)
  );
}

function autoStrength() {
  return s.autosmashers * furnaceBonus() + s.oilcan * 0.5;
}

function shrineBonus() {
  return 1 + s.shrine * 0.05;
}

function regenPerSecond() {
  return (
    (0.6 + s.restwell * 0.05) *
    (1 + s.maxdudeupgrades * 0.1) *
    (1 + s.academy * 0.3)
  );
}

function save() {
  s.lastseen = Date.now();
  localStorage.setItem(savekey, JSON.stringify(s));
}

const achievements = [
  {
    id: "firsthi",
    name: "first HI",
    desc: "smash a DUDE for the first time",
    check: () => s.smashes >= 1,
  },
  {
    id: "hundredsmash",
    name: "centurion",
    desc: "100 smashes",
    check: () => s.smashes >= 100,
  },
  {
    id: "thousandsmash",
    name: "smash veteran",
    desc: "1000 smashes",
    check: () => s.totalsmashesever >= 1000,
  },
  {
    id: "tensmash",
    name: "smash legend",
    desc: "10000 total smashes",
    check: () => s.totalsmashesever >= 10000,
  },
  {
    id: "firstcrit",
    name: "critical DUDE",
    desc: "land a crit",
    check: () => s.crits >= 1,
  },
  {
    id: "hundredcrit",
    name: "crit machine",
    desc: "100 crits",
    check: () => s.crits >= 100,
  },
  {
    id: "firstupgrade",
    name: "HI DUDE the DUDE",
    desc: "buy the double upgrade once",
    check: () => s.multiplier > 1,
  },
  {
    id: "tenpress",
    name: "big press",
    desc: "reach press level 10",
    check: () => s.presslevel >= 10,
  },
  {
    id: "autosmasher",
    name: "automation",
    desc: "own an auto smasher",
    check: () => s.autosmashers >= 1,
  },
  {
    id: "tenauto",
    name: "robot army",
    desc: "own 10 auto smashers",
    check: () => s.autosmashers >= 10,
  },
  {
    id: "firstascend",
    name: "ascended",
    desc: "ascend once",
    check: () => s.ascensions >= 1,
  },
  {
    id: "fiveascend",
    name: "true DUDE",
    desc: "ascend 5 times",
    check: () => s.ascensions >= 5,
  },
  {
    id: "tenascend",
    name: "DUDE eternal",
    desc: "ascend 10 times",
    check: () => s.ascensions >= 10,
  },
  {
    id: "million",
    name: "HI DUDE millionaire",
    desc: "earn 1,000,000 HI DUDE total",
    check: () => s.totalhidudesever >= 1e6,
  },
  {
    id: "billion",
    name: "HI DUDE billionaire",
    desc: "earn 1,000,000,000 HI DUDE total",
    check: () => s.totalhidudesever >= 1e9,
  },
  {
    id: "trillion",
    name: "HI DUDE trillionaire",
    desc: "earn 1,000,000,000,000 HI DUDE total",
    check: () => s.totalhidudesever >= 1e12,
  },
  {
    id: "maxdudes20",
    name: "DUDE farm",
    desc: "reach 20 max DUDEs",
    check: () => s.maxdudes >= 20,
  },
  {
    id: "maxdudes50",
    name: "DUDE metropolis",
    desc: "reach 50 max DUDEs",
    check: () => s.maxdudes >= 50,
  },
  {
    id: "gloves",
    name: "gloved up",
    desc: "buy gloves once",
    check: () => s.gloves >= 1,
  },
  {
    id: "furnace",
    name: "furnace fed",
    desc: "buy the furnace once",
    check: () => s.furnace >= 1,
  },
  {
    id: "turbofurnace",
    name: "turbo fed",
    desc: "buy the turbo furnace once",
    check: () => s.turbofurnace >= 1,
  },
  {
    id: "academy",
    name: "graduated",
    desc: "buy the DUDE academy once",
    check: () => s.academy >= 1,
  },
  {
    id: "secondpress",
    name: "double trouble",
    desc: "buy the second press once",
    check: () => s.secondpress >= 1,
  },
  {
    id: "shrine",
    name: "shrine keeper",
    desc: "buy the golden shrine once",
    check: () => s.shrine >= 1,
  },
  {
    id: "stabilizer",
    name: "stabilized",
    desc: "buy the combo stabilizer once",
    check: () => s.stabilizer >= 1,
  },
  {
    id: "combo20",
    name: "combo king",
    desc: "reach a x20 combo",
    check: () => comboCount >= 20,
  },
  {
    id: "firsttoken",
    name: "tokenized",
    desc: "earn your first DUDE token",
    check: () => s.dudetokens >= 1,
  },
  {
    id: "tengoldenclicked",
    name: "gold digger",
    desc: "click 10 golden DUDEs",
    check: () => (s.goldenclicks || 0) >= 10,
  },
  {
    id: "dojoscore",
    name: "dojo master",
    desc: "score 20 in the DUDE dojo",
    check: () => s.dojobest >= 20,
  },
  {
    id: "firstmini",
    name: "small steps",
    desc: "buy any mini upgrade",
    check: () =>
      s.restwell +
        s.snack +
        s.warmup +
        s.quickhands +
        s.comboprimer +
        s.oilcan +
        s.luckycharm >=
      1,
  },
  {
    id: "allminis",
    name: "well rounded",
    desc: "own at least one of every mini upgrade",
    check: () =>
      s.restwell >= 1 &&
      s.snack >= 1 &&
      s.warmup >= 1 &&
      s.quickhands >= 1 &&
      s.comboprimer >= 1 &&
      s.oilcan >= 1 &&
      s.luckycharm >= 1,
  },
];

function checkAchievements() {
  let unlockedNew = false;
  for (const a of achievements) {
    if (!s.achievements[a.id] && a.check()) {
      s.achievements[a.id] = true;
      unlockedNew = true;
      showEvent(`achievement unlocked: ${a.name}`);
    }
  }
  if (unlockedNew) renderAchievements();
}

function renderAchievements() {
  $("achcontainer").innerHTML = achievements
    .map((a) => {
      const got = !!s.achievements[a.id];
      return `<div class="ach ${got ? "" : "locked"}"><b>${got ? a.name : "???"}</b> - ${got ? a.desc : "locked"}</div>`;
    })
    .join("");
}

function showEvent(msg, ms) {
  $("eventbar").textContent = msg;
  clearTimeout(eventTimeout);
  eventTimeout = setTimeout(() => {
    $("eventbar").textContent = "";
  }, ms || 4000);
}

function costForN(costField, growth, n) {
  let cost = s[costField];
  let total = 0;
  let count = 0;
  if (n === "max") {
    while (total + cost <= s.hidudes && count < 100000) {
      total += cost;
      cost = cost * growth;
      count++;
    }
    return { cost: total, n: Math.max(count, 0) || 0 };
  }
  for (let i = 0; i < n; i++) {
    total += cost;
    cost = cost * growth;
  }
  return { cost: Math.ceil(total), n };
}

const shopItems = [
  {
    id: "buydude",
    cat: "dudes",
    name: "replenish DUDE",
    desc: "spend HI DUDE to bring back 1 DUDE.",
    buy: (n) => {
      const total = costForN("dudecost", 1.4, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.dudes = Math.min(s.maxdudes, s.dudes + total.n);
      s.dudecost = Math.ceil(s.dudecost * Math.pow(1.4, total.n));
    },
    cost: (n) => costForN("dudecost", 1.4, n).cost,
    label: (n) =>
      `get ${n > 1 ? n + " DUDEs" : "DUDE"} = ${fmt(costForN("dudecost", 1.4, n).cost)} HI DUDE`,
  },
  {
    id: "restwellbuy",
    cat: "dudes",
    mini: true,
    name: "rest well",
    desc: "mini upgrade. a small, cheap boost to how fast DUDEs come back to rest.",
    buy: (n) => {
      const total = costForN("restwellcost", 1.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.restwell += total.n;
      s.restwellcost = Math.ceil(s.restwellcost * Math.pow(1.5, total.n));
    },
    cost: (n) => costForN("restwellcost", 1.5, n).cost,
    label: (n) =>
      `rest well (${s.restwell} owned) x${n} = ${fmt(costForN("restwellcost", 1.5, n).cost)} HI DUDE`,
  },
  {
    id: "maxdudebuy",
    cat: "dudes",
    name: "DUDE dormitory",
    desc: "increases the maximum number of DUDEs you can have resting at once.",
    buy: (n) => {
      const total = costForN("maxdudecost", 1.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.maxdudeupgrades += total.n;
      s.maxdudes += total.n * 3;
      s.maxdudecost = Math.ceil(s.maxdudecost * Math.pow(1.5, total.n));
    },
    cost: (n) => costForN("maxdudecost", 1.5, n).cost,
    label: (n) =>
      `DUDE dormitory (max ${s.maxdudes}) x${n} = ${fmt(costForN("maxdudecost", 1.5, n).cost)} HI DUDE`,
  },
  {
    id: "academybuy",
    cat: "dudes",
    name: "DUDE academy",
    desc: "trains DUDEs to regenerate faster, so your DUDE count refills quicker.",
    buy: (n) => {
      const total = costForN("academycost", 2.2, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.academy += total.n;
      s.academycost = Math.ceil(s.academycost * Math.pow(2.2, total.n));
    },
    cost: (n) => costForN("academycost", 2.2, n).cost,
    label: (n) =>
      `DUDE academy (${s.academy} owned) x${n} = ${fmt(costForN("academycost", 2.2, n).cost)} HI DUDE`,
  },
  {
    id: "upgrade",
    cat: "power",
    name: "HI DUDE the DUDE",
    desc: "spend HI DUDE to permanently double how much a DUDE produces.",
    buy: (n) => {
      const total = costForN("upgradecost", 5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.multiplier *= Math.pow(2, total.n);
      s.upgradecost *= Math.pow(5, total.n);
    },
    cost: (n) => costForN("upgradecost", 5, n).cost,
    label: (n) =>
      `HI DUDE the DUDE x${n} = ${fmt(costForN("upgradecost", 5, n).cost)} HI DUDE`,
  },
  {
    id: "snackbuy",
    cat: "power",
    mini: true,
    name: "DUDE snack",
    desc: "mini upgrade. a cheap, small bump to HI DUDE gain per smash.",
    buy: (n) => {
      const total = costForN("snackcost", 1.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.snack += total.n;
      s.snackcost = Math.ceil(s.snackcost * Math.pow(1.5, total.n));
    },
    cost: (n) => costForN("snackcost", 1.5, n).cost,
    label: (n) =>
      `DUDE snack (${s.snack} owned) x${n} = ${fmt(costForN("snackcost", 1.5, n).cost)} HI DUDE`,
  },
  {
    id: "glovesbuy",
    cat: "power",
    name: "gloves",
    desc: "protects the DUDEs a little, and coincidentally makes every smash worth more.",
    buy: (n) => {
      const total = costForN("glovecost", 3, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.gloves += total.n;
      s.glovecost = Math.ceil(s.glovecost * Math.pow(3, total.n));
    },
    cost: (n) => costForN("glovecost", 3, n).cost,
    label: (n) =>
      `gloves (${s.gloves} owned, +25% each) x${n} = ${fmt(costForN("glovecost", 3, n).cost)} HI DUDE`,
  },
  {
    id: "pressupgrade",
    cat: "press",
    name: "bigger press",
    desc: "spend HI DUDE to increase smash force, boosting HI DUDE per smash.",
    buy: (n) => {
      const total = costForN("presscost", 2.2, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.presslevel += total.n;
      s.presscost = Math.ceil(s.presscost * Math.pow(2.2, total.n));
    },
    cost: (n) => costForN("presscost", 2.2, n).cost,
    label: (n) =>
      `upgrade press (lvl ${s.presslevel}) x${n} = ${fmt(costForN("presscost", 2.2, n).cost)} HI DUDE`,
  },
  {
    id: "warmupbuy",
    cat: "press",
    mini: true,
    name: "warm up the press",
    desc: "mini upgrade. a cheap, small flat boost to press effectiveness.",
    buy: (n) => {
      const total = costForN("warmupcost", 1.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.warmup += total.n;
      s.warmupcost = Math.ceil(s.warmupcost * Math.pow(1.5, total.n));
    },
    cost: (n) => costForN("warmupcost", 1.5, n).cost,
    label: (n) =>
      `warm up the press (${s.warmup} owned) x${n} = ${fmt(costForN("warmupcost", 1.5, n).cost)} HI DUDE`,
  },
  {
    id: "secondpressbuy",
    cat: "press",
    name: "second press",
    desc: "installs an extra piston that multiplies your press level effectiveness.",
    buy: (n) => {
      const total = costForN("secondpresscost", 3, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.secondpress += total.n;
      s.secondpresscost = Math.ceil(s.secondpresscost * Math.pow(3, total.n));
    },
    cost: (n) => costForN("secondpresscost", 3, n).cost,
    label: (n) =>
      `second press (${s.secondpress} owned) x${n} = ${fmt(costForN("secondpresscost", 3, n).cost)} HI DUDE`,
  },
  {
    id: "critbuy",
    cat: "crit",
    name: "sharper piston",
    desc: "increases the chance of a critical smash.",
    buy: (n) => {
      const total = costForN("critcost", 2.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.critupgrades += total.n;
      s.critchance = Math.min(0.5, s.critchance + 0.02 * total.n);
      s.critcost = Math.ceil(s.critcost * Math.pow(2.5, total.n));
    },
    cost: (n) => costForN("critcost", 2.5, n).cost,
    label: (n) =>
      `sharpen piston (${Math.round(s.critchance * 100)}% crit) x${n} = ${fmt(costForN("critcost", 2.5, n).cost)} HI DUDE`,
  },
  {
    id: "quickhandsbuy",
    cat: "crit",
    mini: true,
    name: "quick hands",
    desc: "mini upgrade. a cheap, small bump to crit chance.",
    buy: (n) => {
      const total = costForN("quickhandscost", 1.6, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.quickhands += total.n;
      s.critchance = Math.min(0.5, s.critchance + 0.005 * total.n);
      s.quickhandscost = Math.ceil(s.quickhandscost * Math.pow(1.6, total.n));
    },
    cost: (n) => costForN("quickhandscost", 1.6, n).cost,
    label: (n) =>
      `quick hands (${s.quickhands} owned) x${n} = ${fmt(costForN("quickhandscost", 1.6, n).cost)} HI DUDE`,
  },
  {
    id: "critmultbuy",
    cat: "crit",
    name: "heavier piston head",
    desc: "increases how much extra HI DUDE a critical smash gives.",
    buy: (n) => {
      const total = costForN("critmultcost", 2.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.critmultupgrades += total.n;
      s.critmult += 0.5 * total.n;
      s.critmultcost = Math.ceil(s.critmultcost * Math.pow(2.5, total.n));
    },
    cost: (n) => costForN("critmultcost", 2.5, n).cost,
    label: (n) =>
      `heavier piston head (${s.critmult.toFixed(1)}x crit) x${n} = ${fmt(costForN("critmultcost", 2.5, n).cost)} HI DUDE`,
  },
  {
    id: "combobuy",
    cat: "combo",
    name: "rhythm gloves",
    desc: "smashing quickly in a row builds a combo multiplier. this increases how much each combo stack is worth.",
    buy: (n) => {
      const total = costForN("combocost", 2, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.comboupgrades += total.n;
      s.combocost = Math.ceil(s.combocost * Math.pow(2, total.n));
    },
    cost: (n) => costForN("combocost", 2, n).cost,
    label: (n) =>
      `rhythm gloves lvl ${s.comboupgrades} x${n} = ${fmt(costForN("combocost", 2, n).cost)} HI DUDE`,
  },
  {
    id: "comboprimerbuy",
    cat: "combo",
    mini: true,
    name: "combo primer",
    desc: "mini upgrade. a cheap, small flat bonus to your combo multiplier, even at low combo.",
    buy: (n) => {
      const total = costForN("comboprimercost", 1.6, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.comboprimer += total.n;
      s.comboprimercost = Math.ceil(s.comboprimercost * Math.pow(1.6, total.n));
    },
    cost: (n) => costForN("comboprimercost", 1.6, n).cost,
    label: (n) =>
      `combo primer (${s.comboprimer} owned) x${n} = ${fmt(costForN("comboprimercost", 1.6, n).cost)} HI DUDE`,
  },
  {
    id: "stabilizerbuy",
    cat: "combo",
    name: "combo stabilizer",
    desc: "extends how long you have between smashes before the combo resets.",
    buy: (n) => {
      const total = costForN("stabilizercost", 2.3, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.stabilizer += total.n;
      s.stabilizercost = Math.ceil(s.stabilizercost * Math.pow(2.3, total.n));
    },
    cost: (n) => costForN("stabilizercost", 2.3, n).cost,
    label: (n) =>
      `combo stabilizer (${s.stabilizer} owned) x${n} = ${fmt(costForN("stabilizercost", 2.3, n).cost)} HI DUDE`,
  },
  {
    id: "autobuy",
    cat: "automation",
    name: "auto smasher",
    desc: "spend HI DUDE to automatically smash a DUDE every few seconds.",
    buy: (n) => {
      const total = costForN("autocost", 3, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.autosmashers += total.n;
      s.autocost = Math.ceil(s.autocost * Math.pow(3, total.n));
    },
    cost: (n) => costForN("autocost", 3, n).cost,
    label: (n) =>
      `buy auto smasher (${s.autosmashers} owned) x${n} = ${fmt(costForN("autocost", 3, n).cost)} HI DUDE`,
  },
  {
    id: "oilcanbuy",
    cat: "automation",
    mini: true,
    name: "oil can",
    desc: "mini upgrade. a cheap, small flat boost to auto smasher strength.",
    buy: (n) => {
      const total = costForN("oilcancost", 1.6, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.oilcan += total.n;
      s.oilcancost = Math.ceil(s.oilcancost * Math.pow(1.6, total.n));
    },
    cost: (n) => costForN("oilcancost", 1.6, n).cost,
    label: (n) =>
      `oil can (${s.oilcan} owned) x${n} = ${fmt(costForN("oilcancost", 1.6, n).cost)} HI DUDE`,
  },
  {
    id: "furnacebuy",
    cat: "automation",
    name: "HI DUDE furnace",
    desc: "a mysterious furnace that likes DUDEs. massively boosts auto smasher output.",
    buy: (n) => {
      const total = costForN("furnacecost", 4, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.furnace += total.n;
      s.furnacecost = Math.ceil(s.furnacecost * Math.pow(4, total.n));
    },
    cost: (n) => costForN("furnacecost", 4, n).cost,
    label: (n) =>
      `HI DUDE furnace (${s.furnace} owned) x${n} = ${fmt(costForN("furnacecost", 4, n).cost)} HI DUDE`,
  },
  {
    id: "turbofurnacebuy",
    cat: "automation",
    name: "turbo furnace",
    desc: "an upgrade kit for the furnace. requires at least one furnace.",
    buy: (n) => {
      if (s.furnace < 1) {
        showEvent("you need a furnace first.");
        return;
      }
      const total = costForN("turbofurnacecost", 3.5, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.turbofurnace += total.n;
      s.turbofurnacecost = Math.ceil(
        s.turbofurnacecost * Math.pow(3.5, total.n),
      );
    },
    cost: (n) => costForN("turbofurnacecost", 3.5, n).cost,
    label: (n) =>
      `turbo furnace (${s.turbofurnace} owned) x${n} = ${fmt(costForN("turbofurnacecost", 3.5, n).cost)} HI DUDE`,
  },
  {
    id: "shrinebuy",
    cat: "fortune",
    name: "golden DUDE shrine",
    desc: "increases the frequency and value of golden DUDE events.",
    buy: (n) => {
      const total = costForN("shrinecost", 2.4, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.shrine += total.n;
      s.shrinecost = Math.ceil(s.shrinecost * Math.pow(2.4, total.n));
    },
    cost: (n) => costForN("shrinecost", 2.4, n).cost,
    label: (n) =>
      `golden DUDE shrine (${s.shrine} owned) x${n} = ${fmt(costForN("shrinecost", 2.4, n).cost)} HI DUDE`,
  },
  {
    id: "luckycharmbuy",
    cat: "fortune",
    mini: true,
    name: "lucky charm",
    desc: "mini upgrade. a cheap, small bump to how much golden DUDEs are worth.",
    buy: (n) => {
      const total = costForN("luckycharmcost", 1.7, n);
      if (s.hidudes < total.cost) return;
      s.hidudes -= total.cost;
      s.luckycharm += total.n;
      s.luckycharmcost = Math.ceil(s.luckycharmcost * Math.pow(1.7, total.n));
    },
    cost: (n) => costForN("luckycharmcost", 1.7, n).cost,
    label: (n) =>
      `lucky charm (${s.luckycharm} owned) x${n} = ${fmt(costForN("luckycharmcost", 1.7, n).cost)} HI DUDE`,
  },
];

const shopCategories = [
  { id: "dudes", label: "DUDEs", unlockAt: 0 },
  { id: "power", label: "power", unlockAt: 0 },
  { id: "press", label: "press", unlockAt: 100 },
  { id: "crit", label: "crits", unlockAt: 500 },
  { id: "combo", label: "combo", unlockAt: 2000 },
  { id: "automation", label: "automation", unlockAt: 5000 },
  { id: "fortune", label: "fortune", unlockAt: 10000 },
];

function checkCategoryUnlocks() {
  let newlyUnlocked = null;
  for (const cat of shopCategories) {
    if (!s.seenUnlocks[cat.id] && s.totalhidudesever >= cat.unlockAt) {
      s.seenUnlocks[cat.id] = true;
      newlyUnlocked = cat;
    }
  }
  if (newlyUnlocked && newlyUnlocked.unlockAt > 0) {
    showEvent(`!!! new !!! the ${newlyUnlocked.label} shop has opened`, 6000);
  }
}

function renderShop() {
  const unlocked = shopCategories.filter(
    (cat) => s.totalhidudesever >= cat.unlockAt,
  );
  const nextLocked = shopCategories.find(
    (cat) => s.totalhidudesever < cat.unlockAt,
  );

  const unlockedHtml = unlocked
    .map((cat) => {
      const items = shopItems.filter((i) => i.cat === cat.id);
      const rows = items
        .map((item) => {
          const affordable = s.hidudes >= item.cost(buymode);
          return `
					<div class="row ${item.mini ? "mini" : ""}">
						<div class="desc"><b>${item.name}</b><br />${item.desc}</div>
						<button data-id="${item.id}" class="shopbtn ${affordable ? "" : "unaffordable"}" ${affordable ? "" : "disabled"}>${item.label(buymode)}</button>
					</div>`;
        })
        .join("");
      return `<div class="shopsection"><h3>${cat.label}</h3>${rows}</div>`;
    })
    .join("");

  const teaserHtml = nextLocked
    ? `<div class="shopsection locked-teaser"><h3>???</h3><div class="row"><div class="desc">unlocks at ${fmt(nextLocked.unlockAt)} total HI DUDE earned (${fmt(s.totalhidudesever)} so far)</div></div></div>`
    : "";

  $("shopcontainer").innerHTML = unlockedHtml + teaserHtml;

  document.querySelectorAll(".shopbtn").forEach((btn) => {
    btn.onclick = () => {
      const item = shopItems.find((i) => i.id === btn.dataset.id);
      item.buy(buymode);
      render();
      save();
    };
  });

  renderTokenConvert();
}

function renderTokenConvert() {
  const wrap = $("tokenconvertwrap");
  if (s.ascensions < 3) {
    wrap.innerHTML = "<p>ascend 3 times to unlock token conversion.</p>";
    return;
  }
  wrap.innerHTML = `
					<button id="converttoken">convert 5 DUDE shards into 1 DUDE token (have ${s.dudeshards} shards, ${s.dudetokens} tokens)</button>
					<div class="row" style="margin-top:16px">
						<div class="desc"><b>token press core</b><br />spend DUDE tokens to permanently boost press output by 20% each.</div>
						<button id="tokenpressbuy">buy for ${s.tokenpresscost} tokens (lvl ${s.tokenpresstier})</button>
					</div>
					<div class="row">
						<div class="desc"><b>token furnace core</b><br />spend DUDE tokens to permanently boost furnace output by 30% each.</div>
						<button id="tokenautobuy">buy for ${s.tokenautocost} tokens (lvl ${s.tokenautotier})</button>
					</div>
				`;
  $("converttoken").onclick = () => {
    if (s.dudeshards < 5) return;
    s.dudeshards -= 5;
    s.dudetokens += 1;
    render();
    save();
  };
  $("tokenpressbuy").onclick = () => {
    if (s.dudetokens < s.tokenpresscost) return;
    s.dudetokens -= s.tokenpresscost;
    s.tokenpresstier++;
    s.tokenpresscost = Math.ceil(s.tokenpresscost * 1.6);
    render();
    save();
  };
  $("tokenautobuy").onclick = () => {
    if (s.dudetokens < s.tokenautocost) return;
    s.dudetokens -= s.tokenautocost;
    s.tokenautotier++;
    s.tokenautocost = Math.ceil(s.tokenautocost * 1.6);
    render();
    save();
  };
}

function renderStats() {
  const rows = [
    ["total HI DUDE ever earned", fmt(s.totalhidudesever)],
    ["HI DUDE earned this run", fmt(s.runhidudes)],
    ["total smashes ever", fmt(s.totalsmashesever)],
    ["current crit chance", Math.round(s.critchance * 100) + "%"],
    ["current crit multiplier", s.critmult.toFixed(1) + "x"],
    ["current combo multiplier cap", comboMultiplier().toFixed(2) + "x"],
    ["gain per smash", fmt(gainPerSmash() * glovesBonus())],
    ["DUDE regen per second", regenPerSecond().toFixed(2)],
    ["auto smasher strength", fmt(autoStrength())],
    ["ascensions", s.ascensions],
    ["DUDE shards", s.dudeshards],
    ["DUDE tokens", s.dudetokens],
    ["best dojo score", s.dojobest],
    ["golden DUDEs clicked", s.goldenclicks || 0],
  ];
  $("statgrid").innerHTML = rows
    .map(([k, v]) => `<div>${k}</div><div><b>${v}</b></div>`)
    .join("");
}

function render() {
  $("dudes").textContent = fmt(s.dudes) + " / " + s.maxdudes;
  $("hidudes").textContent = fmt(s.hidudes);
  $("rate").textContent = fmt(s.dudes * gainPerSmash() * glovesBonus());
  $("smashes").textContent = fmt(s.smashes);
  $("crits").textContent = fmt(s.crits);
  $("ascensions").textContent = s.ascensions;
  $("dudeshards").textContent = s.dudeshards;
  $("tokens").textContent = s.dudetokens;

  $("hi").disabled = s.dudes < 1;

  if (s.dudes < 1) {
    $("status").textContent =
      "no DUDEs left. you need to spend HI DUDE to replenish them.";
  } else {
    $("status").textContent =
      `you have ${fmt(s.dudes)} DUDEs. spend them wisely!!!!!!!!!!`;
  }

  $("shardpreview").textContent = Math.floor(Math.sqrt(s.runhidudes / 10000));
  $("shardbonus").textContent = `+${s.dudeshards * 10}%`;

  checkCategoryUnlocks();
  renderShop();
  renderStats();
  checkAchievements();
}

function smash() {
  if (s.reducedMotion) return;
  const piston = $("piston");
  const dude = $("dudeart");
  piston.classList.add("slam");
  dude.classList.add("squish");
  setTimeout(() => {
    piston.classList.remove("slam");
    dude.classList.remove("squish");
  }, 180);
}

function doHi(auto) {
  if (s.dudes < 1) {
    render();
    return;
  }

  const now = Date.now();
  const comboWindow = 1500 + s.stabilizer * 300;
  if (!auto) {
    if (now - comboTimer < comboWindow) {
      comboCount++;
    } else {
      comboCount = 0;
    }
    comboTimer = now;
  }

  s.dudes--;

  let gain = gainPerSmash() * glovesBonus();
  if (!auto) gain *= comboMultiplier();

  const isCrit = s.guaranteedCrit || Math.random() < s.critchance;
  s.guaranteedCrit = false;
  if (isCrit) {
    gain *= s.critmult;
    s.crits++;
  }

  s.hidudes += gain;
  s.totalhidudesever += gain;
  s.runhidudes += gain;
  s.smashes++;
  s.totalsmashesever++;
  smash();

  if (isCrit && !auto) {
    if (!s.reducedMotion) {
      $("dudeart").classList.add("crit");
      setTimeout(() => $("dudeart").classList.remove("crit"), 180);
    }
    showEvent(`crit! +${fmt(gain)} HI DUDE`, 1200);
  }

  render();
  save();
}

$("hi").onclick = () => doHi(false);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement.tagName !== "BUTTON") {
    e.preventDefault();
    doHi(false);
  }
});

document.querySelectorAll(".buyn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".buyn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    buymode = btn.dataset.n === "max" ? "max" : parseInt(btn.dataset.n, 10);
    renderShop();
  };
});

document.querySelectorAll(".tabbtn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".tabbtn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tabpage")
      .forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "ach") renderAchievements();
    if (btn.dataset.tab === "ascend") render();
    if (btn.dataset.tab === "statspage") renderStats();
  };
});

$("ascendbtn").onclick = () => {
  const gained = Math.floor(Math.sqrt(s.runhidudes / 10000));
  if (gained < 1) {
    showEvent("you need more HI DUDE earned this run before ascending.");
    return;
  }
  const keep = {
    dudeshards: s.dudeshards + gained,
    dudetokens: s.dudetokens,
    tokenpresstier: s.tokenpresstier,
    tokenpresscost: s.tokenpresscost,
    tokenautotier: s.tokenautotier,
    tokenautocost: s.tokenautocost,
    ascensions: s.ascensions + 1,
    achievements: s.achievements,
    seenUnlocks: s.seenUnlocks,
    totalhidudesever: s.totalhidudesever,
    totalsmashesever: s.totalsmashesever,
    offlineEnabled: s.offlineEnabled,
    reducedMotion: s.reducedMotion,
    compactNumbers: s.compactNumbers,
    stickyHeader: s.stickyHeader,
    dojobest: s.dojobest,
    goldenclicks: s.goldenclicks,
  };
  s = Object.assign({}, defaultState, keep);
  showEvent(`ascended! +${gained} DUDE shards`);
  render();
  save();
};

$("hardreset").onclick = () => {
  if (!confirm("really reset your entire save?")) return;
  localStorage.removeItem(savekey);
  location.reload();
};

$("toggleoffline").onclick = () => {
  s.offlineEnabled = !s.offlineEnabled;
  $("toggleoffline").textContent = s.offlineEnabled ? "on" : "off";
  save();
};
$("togglemotion").onclick = () => {
  s.reducedMotion = !s.reducedMotion;
  $("togglemotion").textContent = s.reducedMotion ? "on" : "off";
  save();
};
$("togglecompact").onclick = () => {
  s.compactNumbers = !s.compactNumbers;
  $("togglecompact").textContent = s.compactNumbers ? "on" : "off";
  render();
  save();
};
$("togglesticky").onclick = () => {
  s.stickyHeader = !s.stickyHeader;
  $("togglesticky").textContent = s.stickyHeader ? "on" : "off";
  applyStickyHeader();
  save();
};
$("exportsave").onclick = async () => {
  try {
    await navigator.clipboard.writeText(btoa(JSON.stringify(s)));
    showEvent("save copied to clipboard.");
  } catch (e) {
    showEvent("could not access clipboard.");
  }
};
$("importsave").onclick = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(atob(text));
    s = Object.assign({}, defaultState, parsed);
    showEvent("save imported.");
    render();
    save();
  } catch (e) {
    showEvent("import failed, bad clipboard content.");
  }
};

$("toggleoffline").textContent = s.offlineEnabled ? "on" : "off";
$("togglemotion").textContent = s.reducedMotion ? "on" : "off";
$("togglecompact").textContent = s.compactNumbers ? "on" : "off";
$("togglesticky").textContent = s.stickyHeader ? "on" : "off";

function applyStickyHeader() {
  document
    .querySelector(".sticky-top")
    .classList.toggle("sticky-on", s.stickyHeader);
}
applyStickyHeader();

const randomEvents = [
  {
    msg: "a wild DUDE wanders in. +1 DUDE!",
    fn: () => (s.dudes = Math.min(s.maxdudes, s.dudes + 1)),
  },
  {
    msg: "a DUDE found spare change. +HI DUDE!",
    fn: () => (s.hidudes += s.dudes * gainPerSmash() * 5),
  },
  {
    msg: "a DUDE got tired and needs a nap. -1 DUDE.",
    fn: () => (s.dudes = Math.max(0, s.dudes - 1)),
  },
  {
    msg: "the press briefly overheats. next smash guaranteed crit!",
    fn: () => {
      s.guaranteedCrit = true;
    },
  },
];

setInterval(() => {
  if (Math.random() < 0.08) {
    const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    ev.fn();
    showEvent(ev.msg);
    render();
    save();
  }
}, 15000);

function spawnGolden() {
  const game = $("game");
  const g = document.createElement("div");
  g.className = "golden";
  g.textContent = "(o_o)";
  const maxX = game.clientWidth - 60;
  g.style.left = Math.max(0, Math.random() * maxX) + "px";
  g.style.top = 40 + Math.random() * 300 + "px";
  g.onclick = () => {
    const bonus = s.dudes * gainPerSmash() * (10 + s.shrine * 2 + s.luckycharm);
    s.hidudes += bonus;
    s.totalhidudesever += bonus;
    s.runhidudes += bonus;
    s.goldenclicks = (s.goldenclicks || 0) + 1;
    showEvent(`golden DUDE! +${fmt(bonus)} HI DUDE`);
    g.remove();
    render();
    save();
  };
  game.appendChild(g);
  setTimeout(() => g.remove(), 6000);
}

function scheduleGolden() {
  const delay = Math.max(20000, 40000 - s.shrine * 1000);
  setTimeout(() => {
    spawnGolden();
    scheduleGolden();
  }, delay);
}
scheduleGolden();

setInterval(() => {
  if (s.dudes < s.maxdudes) {
    s.dudes = Math.min(s.maxdudes, s.dudes + regenPerSecond());
  }
  render();
  save();
}, 1000);

setInterval(() => {
  const strength = autoStrength();
  for (let i = 0; i < Math.ceil(strength); i++) {
    if (s.dudes >= 1) doHi(true);
  }
}, 2000);

let dojoInterval = null;
let dojoActive = false;
let dojoScore = 0;
function buildDojoBoard() {
  const board = $("dojoboard");
  board.innerHTML = "";
  for (let i = 0; i < 15; i++) {
    const b = document.createElement("button");
    b.dataset.i = i;
    b.textContent = "";
    b.onclick = () => {
      if (!dojoActive) return;
      if (b.dataset.hit === "1") return;
      if (b.textContent !== "O") return;
      b.dataset.hit = "1";
      b.textContent = "x";
      dojoScore++;
      $("dojoscore").textContent = dojoScore;
      const bonus = gainPerSmash() * 3;
      s.hidudes += bonus;
      s.totalhidudesever += bonus;
      s.runhidudes += bonus;
      render();
    };
    board.appendChild(b);
  }
}
buildDojoBoard();

$("dojostart").onclick = () => {
  if (dojoActive) return;
  dojoActive = true;
  dojoScore = 0;
  $("dojoscore").textContent = 0;
  buildDojoBoard();
  let ticks = 0;
  dojoInterval = setInterval(() => {
    ticks++;
    const cells = document.querySelectorAll("#dojoboard button");
    cells.forEach((c) => {
      if (c.dataset.hit !== "1") {
        c.textContent = "";
      }
    });
    const idx = Math.floor(Math.random() * cells.length);
    if (cells[idx].dataset.hit !== "1") cells[idx].textContent = "O";
    if (ticks > 12) {
      clearInterval(dojoInterval);
      dojoActive = false;
      if (dojoScore > s.dojobest) s.dojobest = dojoScore;
      showEvent(`dojo round over. score: ${dojoScore}`);
      render();
      save();
    }
  }, 700);
};

(function offlineProgress() {
  const elapsed = (Date.now() - s.lastseen) / 1000;
  if (s.offlineEnabled && elapsed > 30) {
    const capped = Math.min(elapsed, 8 * 3600);
    const perSec = autoStrength() * gainPerSmash() * glovesBonus() * 0.5;
    const earned = perSec * capped * 0.5;
    if (earned > 0) {
      s.hidudes += earned;
      s.totalhidudesever += earned;
      s.runhidudes += earned;
      showEvent(
        `welcome back! earned ${fmt(earned)} HI DUDE while away.`,
        6000,
      );
    }
  }
})();

renderAchievements();
render();
