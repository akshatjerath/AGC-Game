/* THE IDLE REGISTER: game engine. Story text lives in story.js. */

const V = n => `videos/${n}.mp4`, P = n => `images/${n}.jpg`;
const $ = id => document.getElementById(id);
let paused = false, playing = false;
/* sleep that stops counting while paused or the tab is hidden */
const sleep = ms => new Promise(r => { let left = ms, last = performance.now(); const t = setInterval(() => { const now = performance.now(); if (!paused && !document.hidden) left -= now - last; last = now; if (left <= 0) { clearInterval(t); r(); } }, 50); });
const store = {
  get(k, d) { try { const v = localStorage.getItem("idle_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("idle_" + k, JSON.stringify(v)); } catch (e) {} }
};

let sprout = store.get("sprout", false), found = new Set(store.get("found", [])), e3seen = store.get("e3", false), slow = store.get("slow", false), lastName = store.get("name", "");
let S, pname = "Citizen 404";
const fresh = () => ({ compliance: 0, solidarity: 0, trust: 0, awake: 0, ready: 0, vikram: 50, honest: false, grace: false, noTools: false, smuggled: false, broadcast: false, data: false });

/* Requirements named in story.js */
const REQ = {
  awake3: () => S.awake >= RULES.awarenessForData,
  trusted: () => S.trust > RULES.trustToSmuggle,
  hasData: () => S.data
};

/* ---------- video: two players crossfade, a hidden third preloads the next clip ---------- */
let cur = $("vA"), nxt = $("vB");
const pre = $("vPre");
function preload(name) { if (!name) return; pre.src = V(name); pre.load(); }
function release(v) { v.pause(); v.removeAttribute("src"); v.load(); }

function scene(name, { loop = false, muted = false } = {}) {
  return new Promise(resolve => {
    const el = nxt;                      // lock the buffer: nxt is swapped later, closures must not read it
    el.poster = name === "prologue" ? "" : P(name); el.src = V(name); el.loop = loop; el.muted = muted;
    if (!loop) el.removeAttribute("loop");
    el.onended = loop ? null : () => el.pause();   // hold on the last frame
    let started = false;
    const go = async () => {
      if (started) return; started = true; el.oncanplay = null;
      try { await el.play(); } catch (e) { el.muted = true; try { await el.play(); } catch (_) {} }
      el.classList.add("on"); cur.classList.remove("on");
      const old = cur; cur = el; nxt = old;
      setTimeout(() => { if (old !== cur) release(old); }, 950);
      resolve();
    };
    if (el.readyState >= 3) go(); else { el.oncanplay = go; setTimeout(go, 2500); }
  });
}
/* resolves when the current clip has played to its end (pause-aware, never hangs) */
function clipDone() {
  const v = cur;
  if (v.ended) return Promise.resolve();
  return new Promise(r => { let over = false; const f = () => { if (!over) { over = true; v.removeEventListener("ended", f); r(); } };
    v.addEventListener("ended", f); sleep(((v.duration || 12) + 1) * 1000).then(f); });
}
function playOnce(name) {
  return new Promise(async r => {
    await scene(name, { loop: false });
    const v = cur, finish = () => { if (over) return; over = true; v.onended = v.onerror = null; r(); };
    let over = false;
    sleep(((v.duration || 20) + 2) * 1000).then(() => !over && finish());   // never hang on a bad file
    v.onended = finish; v.onerror = finish;
  });
}

/* ---------- UI ---------- */
function show(id) { document.querySelectorAll(".layer").forEach(l => l.classList.toggle("show", l.id === id)); }
function caption(t) {   // a short opening sentence ("1996.", "Six weeks later.") is set apart as a dateline
  const c = $("caption"); c.textContent = ""; c.classList.toggle("on", !!t); if (!t) return;
  const m = t.match(/^([^.“"]{1,18}\.)\s+(.+)$/);
  if (m && m[1].split(" ").length <= 3) { const d = document.createElement("span"); d.className = "dl"; d.textContent = m[1]; c.append(d, " ", m[2]); }
  else c.textContent = t;
}
let toastT;
function toast(m) { const t = $("toast"); t.textContent = "File updated: " + pname + " · " + m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }
async function fade(on) { $("fade").classList.toggle("on", on); await sleep(800); }
const reveal = () => sleep(slow ? RULES.revealMsSlow : RULES.revealMs);

function choose(items, secs, timeoutVal) {
  if (secs < 30) secs = 12.5;   // every normal choice: 12.5 s (Beat 15 keeps its long wait)
  if (slow) secs = Math.round(secs * RULES.slowTimerFactor);
  return new Promise(res => {
    const box = $("choices"), opts = $("opts"), bar = $("bar").firstElementChild;
    opts.innerHTML = "";
    const live = [];
    items.forEach(([label, val, req, why], i) => {
      const ok = !req || REQ[req]();
      const b = document.createElement("button");
      b.className = "ch";
      const k = document.createElement("span"); k.className = "k num"; k.textContent = i + 1;
      const t = document.createElement("span"); t.textContent = label;
      if (!ok) { b.disabled = true; if (why) { const s = document.createElement("small"); s.textContent = why; t.appendChild(s); } }
      else live[i] = val;
      b.append(k, t); b.onclick = () => done(val); opts.appendChild(b);
    });
    const key = e => { if (paused) return; const n = parseInt(e.key, 10) - 1; if (live[n] !== undefined) done(live[n]); };
    document.addEventListener("keydown", key);
    let used = 0, last = performance.now(), raf, over = false;
    const tick = now => {
      if (!document.hidden && !paused) used += now - last;
      last = now;
      const p = 1 - used / (secs * 1000);
      bar.style.transform = `scaleX(${Math.max(0, p)})`;
      if (p <= 0) done(timeoutVal); else raf = requestAnimationFrame(tick);
    };
    function done(v) {
      if (over) return; over = true;
      cancelAnimationFrame(raf); document.removeEventListener("keydown", key); $("hudBeat").textContent = "";
      const idx = items.findIndex(it => it[1] === v);
      if (idx >= 0) opts.children[idx].classList.add("picked");
      setTimeout(() => { bar.style.transform = "scaleX(0)"; box.classList.remove("on"); }, 220);
      setTimeout(() => res(v), 520);
    }
    box.classList.add("on"); raf = requestAnimationFrame(tick);
  });
}

let beatLbl = "";
const BEAT_NO = { b00: 0, b00_again: 0, b01: 1, b02: 2, b03: 3, b04: 4, tally: 4, obey: 4, b05: 5, b06: 6, b06_warm: 6, b07: 7, b08: 8, b09: 9, b10: 10, b11: 11, b12: 12, b13: 13, b14: 14, b15: 15 };
function hud(id) {
  const n = BEAT_NO[id];
  beatLbl = n === undefined ? "" : `Beat ${String(n).padStart(2, "0")} / 15`;
  $("meta").textContent = pname ? `Citizen · ${pname}` : "";
}

/* Play one beat from story.js: show the scene, caption, then ask (if it has choices) */
async function beat(id) {
  const b = STORY[id];
  hud(id); await scene(b.video); preload(b.next);
  caption((b.line || "").replace("{name}", pname)); hud(id);
  await Promise.all([reveal(), clipDone()]); await sleep(600);
  const r = b.choices ? await choose(b.choices, b.secs, b.timeout) : null; caption(""); return r;
}

/* ---------- flow ---------- */
async function run(fromSprout = false) {
  S = fresh(); show(null); music(false); playing = true; $("meta").textContent = "";
  if (!fromSprout) {
    await fade(true); await scene("intake", { loop: true }); preload("prologue"); await fade(false);
    show("intake"); $("name").value = lastName; $("name").focus();
    await new Promise(r => { $("intakeForm").onsubmit = e => { e.preventDefault(); $("imprint").querySelector("b").textContent = ($("name").value.trim() || "Citizen 404").slice(0, 24); $("bStamp").classList.add("pressed"); $("imprint").classList.add("on"); setTimeout(() => { $("frame").classList.add("thud"); setTimeout(() => $("frame").classList.remove("thud"), 200); }, 380); setTimeout(r, 1500); }; });
    $("bStamp").classList.remove("pressed"); $("imprint").classList.remove("on");
    pname = ($("name").value.trim() || "Citizen 404").slice(0, 24); store.set("name", pname); lastName = pname; show(null);
    await playOnce("prologue");
    return act0();
  }
  Object.assign(S, { trust: 25, compliance: 3 }, store.get("cp", {}));   // restore the state you carried to Beat 6
  pname = lastName || "Citizen 404";
  return act2();
}

async function act0() {
  const b = STORY.b00;
  hud("b00"); await scene(b.video); preload(b.next); caption(b.line); await Promise.all([reveal(), clipDone()]); await sleep(600);
  for (let waits = 0; ;) {
    if (await choose(b.choices, b.secs, b.timeout) === "sign") { S.compliance++; break; }
    if (++waits >= 2) return ending(0);
    caption(STORY.b00_again.line); await sleep(2200); caption("");
  }
  return act1();
}

async function act1() {
  await beat("b01"); S.compliance++; toast("receipt signed");
  if (await beat("b02") === "stop") { S.solidarity++; toast("stopped the line"); } else S.compliance++;
  if (await beat("b03") === "share") S.solidarity++; else S.compliance++;
  const r = await beat("b04");
  if (r === "report") { await beat("tally"); return ending(4); }
  if (r === "dump") { await beat("obey"); return ending(5); }
  S.trust += 25; toast("contraband concealed");
  if (await beat("b05") === "share") { S.honest = true; S.vikram += 20; } else S.vikram -= 40;
  return act2();
}

async function act2() {
  sprout = true; store.set("sprout", true);
  store.set("cp", { compliance: S.compliance, solidarity: S.solidarity, trust: S.trust, honest: S.honest, vikram: S.vikram });
  if (e3seen) { await beat("b06_warm"); e3seen = false; store.set("e3", false); return ending(6); }
  await beat("b06"); S.ready += 25;
  if (await beat("b07") === "hide") { S.awake += 2; toast("evidence retained"); } else S.compliance++;
  if (await beat("b08") === "grace") { S.grace = true; S.trust += 15; S.solidarity++; } else S.trust -= 30;
  if (await beat("b09") === "stay") return ending(3);
  if (await beat("b10") === "copy") { S.data = true; S.ready += 25; S.awake++; toast("archive copied"); }
  if (await beat("b11") === "refuse") S.noTools = true;
  if (await beat("b12") === "bury") { S.ready += 20; S.smuggled = true; toast("manifest filed"); }
  await beat("b13"); S.ready = Math.min(100, S.ready + S.solidarity * 10);
  if (await beat("b14") === "cast") { S.broadcast = true; toast("transmission logged"); }

  let r = await beat("b15");
  if (r === "wait") { if (S.honest && S.grace && S.noTools) return ending(7); r = "surrender"; }
  if (r === "burn") return ending(3);
  if (S.ready >= RULES.bloomReadiness && S.smuggled && S.broadcast) return ending(1);
  if (S.ready >= RULES.rootReadiness && S.smuggled) return ending(2);
  return ending(5);
}

async function ending(i) {
  const [vid, title, sub] = ENDS[i];
  if (i === 3) { e3seen = true; store.set("e3", true); }
  found.add(i); store.set("found", [...found]);
  caption(""); await playOnce(vid); playing = false;
  $("eNo").textContent = "Ending " + i; $("eTitle").textContent = title; $("eSub").textContent = sub;
  $("eJump").hidden = !sprout; $("eCount").textContent = `Endings found ${found.size} / 8`;
  show("end");
}

/* ---------- menus ---------- */
function refreshMenu() {
  $("mCount").textContent = `${found.size}/8`;
  $("bJump").hidden = !sprout;
  $("slowLbl").textContent = slow ? "extended" : "standard";
}
async function toMenu() { show(null); playing = false; music(true); $("meta").textContent = ""; await fade(true); await scene("b01_ration_drop", { muted: true, loop: true }); await fade(false); refreshMenu(); show("menu"); }
let galleryBack = "menu";
function gallery(from) {
  galleryBack = from;
  $("grid").innerHTML = ENDS.map(([v, t], i) => `<div class="tile ${found.has(i) ? "" : "locked"}"><img src="${P(v)}" alt="" loading="lazy"><span><b>${i}</b>${found.has(i) ? t : "Not yet found"}</span></div>`).join("");
  show("gallery");
}

$("bNew").onclick = () => run(false);
$("bJump").onclick = () => run(true);
$("bEnds").onclick = () => gallery("menu");
$("bSlow").onclick = () => { slow = !slow; store.set("slow", slow); refreshMenu(); };
$("eJump").onclick = () => run(true);
$("eNew").onclick = () => run(false);
$("eEnds").onclick = () => gallery("end");
$("eMenu").onclick = toMenu;
$("gBack").onclick = () => show(galleryBack);

/* Sound and fullscreen controls */
let muted = store.get("muted", false);
function applyMute() { $("music").volume = muted ? 0 : .55; $("stage").querySelectorAll("video").forEach(v => { if (v.id !== "vPre") v.volume = muted ? 0 : 1; }); $("bMute").textContent = muted ? "Sound off" : "Sound on"; }
$("bMute").onclick = () => { muted = !muted; store.set("muted", muted); applyMute(); };
$("bFull").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
document.addEventListener("keydown", e => { if (e.key === "f" && document.activeElement.tagName !== "INPUT") $("bFull").click(); });
applyMute();

toMenu();

/* ---------- menu music (audio/menu.mp3, optional) ---------- */
function music(on) {
  const m = $("music");
  if (on) { m.play().catch(() => {}); return; }
  const fadeOut = setInterval(() => { m.volume = Math.max(0, m.volume - .05); if (m.volume <= 0) { clearInterval(fadeOut); m.pause(); m.currentTime = 0; applyMute(); } }, 60);
}
document.addEventListener("pointerdown", () => !playing && music(true), { once: true });
document.addEventListener("keydown", () => !playing && music(true), { once: true });

/* ---------- pause (P / Esc / button) ---------- */

function setPause(on) {
  if (!playing || on === paused) return;
  paused = on; $("pause").classList.toggle("show", on); $("bPause").textContent = on ? "Resume" : "Pause";
  on ? cur.pause() : cur.play().catch(() => {});
}
$("bPause").onclick = () => setPause(!paused);
$("pResume").onclick = () => setPause(false);
$("pMenu").onclick = () => location.reload();   // progress (endings, name) is already saved
document.addEventListener("keydown", e => { if ((e.key === "p" || e.key === "Escape") && document.activeElement.tagName !== "INPUT") setPause(!paused); });
