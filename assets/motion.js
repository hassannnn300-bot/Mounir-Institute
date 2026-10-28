/* Mounir Institute motion layer (28 October 2026). Styles live in assets/motion.css.
   Decoration only: each part runs on its own, and if one fails the page still works as before.
   Respects prefers-reduced-motion, and keeps cursor effects to mouse and trackpad users. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { try { return win.matchMedia(q).matches; } catch (e) { return false; } };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(hover: hover) and (pointer: fine)");
  root.classList.toggle("mi-motion", !reduce);
  root.classList.toggle("mi-fine", fine && !reduce);

  function safe(fn) { try { fn(); } catch (e) { if (win.console) console.warn("Mounir motion:", e); } }
  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    n.setAttribute("aria-hidden", "true");
    if (html) n.innerHTML = html;
    return n;
  }
  function reveal(nodes, margin) {
    if (reduce || !("IntersectionObserver" in win)) { nodes.forEach(function (n) { n.classList.add("mi-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("mi-in"); io.unobserve(e.target); } });
    }, { rootMargin: margin || "0px 0px -18% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* Wrap each word in a span so it can move on its own. Nested elements (the gold words) are kept. */
  function splitWords(target) {
    if (!target || target.classList.contains("mi-split")) return 0;
    var count = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          var frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            var w = doc.createElement("span");
            w.className = "mi-w";
            w.style.setProperty("--i", count++);
            w.textContent = part;
            frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !/^(SCRIPT|STYLE|SUP|SVG|BR|IMG)$/i.test(child.tagName)) {
          walk(child);
        }
      });
    })(target);
    target.classList.add("mi-split");
    return count;
  }

  /* An Islamic geometric rosette: a sixteen-point ring, two interlaced squares and two eight-point star polygons. */
  function rosette(id, cls) {
    var f = function (v) { return v.toFixed(2); };
    var pts = function (n, r, rot) {
      var out = [];
      for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2 + rot; out.push([r * Math.cos(a), r * Math.sin(a)]); }
      return out;
    };
    var poly = function (p) { return "M" + p.map(function (q) { return f(q[0]) + "," + f(q[1]); }).join("L") + "Z"; };
    var starOf = function (p) { var s = []; for (var i = 0; i < p.length; i++) s.push(p[(i * 3) % p.length]); return s; };
    var ring = [];
    for (var i = 0; i < 32; i++) { var a = (i / 32) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 86 : 97; ring.push([r * Math.cos(a), r * Math.sin(a)]); }
    var spokes = "";
    for (var k = 0; k < 16; k++) {
      var b = (k / 16) * Math.PI * 2;
      spokes += "M" + f(41 * Math.cos(b)) + "," + f(41 * Math.sin(b)) + "L" + f(64 * Math.cos(b)) + "," + f(64 * Math.sin(b));
    }
    var dots = pts(8, 78, -Math.PI / 2 + Math.PI / 8).map(function (q) {
      return '<circle class="mi-dot" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="1.5" fill="url(#' + id + ')" stroke="none"/>';
    }).join("");
    var d = function (delay, attrs) { return 'class="mi-d" pathLength="1" style="--d:' + delay + 's" ' + (attrs || ""); };
    return '<svg class="mi-rosette' + (cls ? " " + cls : "") + '" viewBox="-100 -100 200 200" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="-100" y1="-100" x2="100" y2="100" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#fff1c9"/><stop offset=".5" stop-color="#d7b56d"/><stop offset="1" stop-color="#8e6d34"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#' + id + ')" stroke-width=".35" stroke-linejoin="round">' +
      '<g class="mi-r-outer"><circle r="99" ' + d(.9, 'stroke-width=".25"') + '/><path d="' + poly(ring) + '" ' + d(1.1) + '/><circle r="90" ' + d(1.3, 'stroke-width=".22"') + '/></g>' +
      '<g class="mi-r-mid"><path d="' + poly(pts(4, 88, -Math.PI / 2)) + '" ' + d(.5) + '/><path d="' + poly(pts(4, 88, -Math.PI / 4)) + '" ' + d(.65) + '/><circle r="70" ' + d(.8, 'stroke-width=".25"') + '/>' + dots + '</g>' +
      '<g class="mi-r-inner"><path d="' + poly(starOf(pts(8, 64, -Math.PI / 2))) + '" ' + d(.15) + '/><path d="' + spokes + '" ' + d(.3, 'stroke-width=".2"') + '/><circle r="40" ' + d(.35) + '/>' +
      '<path d="' + poly(starOf(pts(8, 36, -Math.PI / 2 + Math.PI / 8))) + '" ' + d(.45) + '/><circle r="12" ' + d(.55) + '/></g>' +
      '</g></svg>';
  }

  var STAR = (function () {
    var p = [];
    for (var i = 0; i < 16; i++) { var a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 4.4 : 11; p.push((r * Math.cos(a)).toFixed(2) + "," + (r * Math.sin(a)).toFixed(2)); }
    return '<svg viewBox="-12 -12 24 24" focusable="false"><path d="M' + p.join("L") + 'Z" fill="currentColor"/><circle r="2.2" fill="#090909"/></svg>';
  })();

  /* ---------- Hero: rosette, rays and halo in CSS; gold dust and voice waves on a canvas ---------- */
  function hero() {
    var heroEl = doc.querySelector(".hero");
    if (!heroEl) return;
    heroEl.classList.add("mi-hero");
    var stage = el("div", "mi-stage", '<div class="mi-rays"></div><div class="mi-halo"></div>' + rosette("miGoldHeroL", "mi-l") + rosette("miGoldHeroR", "mi-r") + '<canvas class="mi-canvas"></canvas><div class="mi-sweep"></div>');
    heroEl.insertBefore(stage, heroEl.firstChild);
    if (!reduce) splitWords(heroEl.querySelector("h1"));

    var canvas = stage.querySelector("canvas"), ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    var w = 1, h = 1, base = 1, particles = [], running = false, inView = true, raf = 0, last = 0, t = 2.2;
    var px = 0, py = 0, tpx = 0, tpy = 0, mx = -9999, tmx = -9999, prox = 0, tprox = 0, lastVars = "";
    var sprite = doc.createElement("canvas");
    sprite.width = sprite.height = 64;
    var sg = sprite.getContext("2d"), grd = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,246,220,1)");
    grd.addColorStop(.18, "rgba(240,220,165,.85)");
    grd.addColorStop(.45, "rgba(215,181,109,.22)");
    grd.addColorStop(1, "rgba(215,181,109,0)");
    sg.fillStyle = grd;
    sg.fillRect(0, 0, 64, 64);

    var strands = [
      { amp: 1, f: 1, sp: .55, ph: 0, a: .55, lw: 1.4 },
      { amp: .8, f: 1.35, sp: -.42, ph: 1.7, a: .38, lw: 1 },
      { amp: .62, f: .8, sp: .33, ph: 3.1, a: .32, lw: 1 },
      { amp: .45, f: 1.9, sp: .7, ph: 4.4, a: .26, lw: .8 },
      { amp: .35, f: 2.4, sp: -.6, ph: 5.2, a: .2, lw: .7 }
    ];
    function spawn(anywhere) {
      var z = Math.random();
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, z: z, r: .6 + z * 1.9, vy: .08 + z * .34 + Math.random() * .08,
        ph: Math.random() * 6.283, tw: .6 + Math.random() * 1.6, dx: (Math.random() - .5) * .12 };
    }
    function resize() {
      var r = stage.getBoundingClientRect(), small = r.width < 700;
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      /* The waves run just below the buttons; on phones the hero has less room underneath, so they sit a little higher. */
      base = Math.min(h - 40, heroEl.offsetHeight + (small ? -10 : 12));
      var dpr = Math.min(win.devicePixelRatio || 1, small ? 1.5 : 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(110, Math.max(26, (w * h) / 12000)));
      particles = [];
      for (var i = 0; i < n; i++) particles.push(spawn(true));
      if (!running) draw(0);
    }
    function waves() {
      var small = w < 700;
      var breath = .55 + .45 * (.5 - .5 * Math.cos((t * 2 * Math.PI) / 9));
      var A = (small ? 15 : 28) * breath, step = small ? 10 : 7;
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(215,181,109,0)");
      g.addColorStop(.2, "rgba(215,181,109,1)");
      g.addColorStop(.5, "rgba(255,240,200,1)");
      g.addColorStop(.8, "rgba(215,181,109,1)");
      g.addColorStop(1, "rgba(215,181,109,0)");
      ctx.strokeStyle = g;
      ctx.globalCompositeOperation = "lighter";
      for (var s = 0; s < strands.length; s++) {
        var st = strands[s];
        ctx.beginPath();
        for (var x = 0; x <= w + step; x += step) {
          var u = Math.min(1, x / w), env = Math.pow(Math.sin(Math.PI * u), 1.4);
          var bump = prox * 1.6 * Math.exp(-Math.pow((x - mx) / (w * .12), 2));
          var k = u * Math.PI * 2 * st.f;
          var y = base + A * st.amp * env * (1 + bump) *
            (.62 * Math.sin(k * 1.6 + t * st.sp * 2 + st.ph) + .28 * Math.sin(k * 3.1 - t * st.sp * 1.3 + st.ph * 1.7) + .1 * Math.sin(k * 7 + t * 2.2 + s));
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.globalAlpha = st.a * .3; ctx.lineWidth = st.lw * 4; ctx.stroke();
        ctx.globalAlpha = st.a; ctx.lineWidth = st.lw; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function dust(dt) {
      var step = dt * .06;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.vy * step;
        p.x += (p.dx + Math.sin(t * .6 + p.ph) * .08) * step;
        if (p.y < -12) { particles[i] = p = spawn(false); }
        if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
        var tw = .45 + .55 * Math.pow(.5 + .5 * Math.sin(t * p.tw + p.ph), 2);
        var fade = Math.max(0, Math.min(1, p.y / (h * .22)) * Math.min(1, (h - p.y) / (h * .12)));
        var a = tw * fade * (.35 + p.z * .65);
        if (a < .02) continue;
        var size = p.r * 7;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, p.x + px * (6 + p.z * 22) - size / 2, p.y + py * (4 + p.z * 14) - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    }
    function draw(dt) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      waves();
      dust(dt);
      ctx.globalCompositeOperation = "source-over";
    }
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(50, now - last) : 16.7;
      last = now; t += dt / 1000;
      px += (tpx - px) * .06; py += (tpy - py) * .06; prox += (tprox - prox) * .05;
      mx = mx < -999 ? tmx : mx + (tmx - mx) * .12;
      draw(dt);
      var vars = px.toFixed(3) + "," + py.toFixed(3);
      if (vars !== lastVars) { lastVars = vars; stage.style.setProperty("--mi-px", px.toFixed(3)); stage.style.setProperty("--mi-py", py.toFixed(3)); }
      if (running) raf = win.requestAnimationFrame(frame);
    }
    function start() { if (running || reduce) return; running = true; last = 0; raf = win.requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) win.cancelAnimationFrame(raf); raf = 0; }

    if (!reduce) {
      win.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        var r = stage.getBoundingClientRect(), y = e.clientY - r.top;
        tmx = e.clientX - r.left;
        tpx = (e.clientX / win.innerWidth - .5) * 2;
        tpy = (e.clientY / win.innerHeight - .5) * 2;
        tprox = y >= 0 && y <= h ? Math.max(0, 1 - Math.abs(y - base) / (h * .45)) : 0;
      }, { passive: true });
      if ("IntersectionObserver" in win) {
        new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; if (inView && !doc.hidden) start(); else stop(); }).observe(stage);
      }
      doc.addEventListener("visibilitychange", function () { if (!doc.hidden && inView) start(); else stop(); });
    }
    if ("ResizeObserver" in win) new ResizeObserver(function () { resize(); }).observe(stage);
    else win.addEventListener("resize", resize);
    resize();
    start();
  }

  /* ---------- Sections: a gold divider draws in and the heading rises word by word ---------- */
  function sections() {
    var list = Array.prototype.slice.call(doc.querySelectorAll("main > section")).filter(function (s) {
      return !s.classList.contains("hero") && !s.classList.contains("vsl-section");
    });
    var foot = doc.querySelector("footer");
    if (foot) list.push(foot);
    list.forEach(function (sec) {
      sec.classList.add("mi-sec");
      sec.appendChild(el("div", "mi-divider", '<span class="mi-divider-line"></span><span class="mi-divider-spark l"></span><span class="mi-divider-spark r"></span><span class="mi-divider-star">' + STAR + "</span>"));
      if (!reduce && sec !== foot) {
        Array.prototype.forEach.call(sec.querySelectorAll("h2"), function (h) { if (!h.closest("#journey-box")) splitWords(h); });
      }
    });
    reveal(list);
  }

  /* ---------- Cards tilt toward the cursor, with a glare and a lit edge ---------- */
  function cards() {
    if (!fine || reduce) return;
    Array.prototype.forEach.call(doc.querySelectorAll(".price-card, .method-card"), function (card) {
      var max = card.classList.contains("method-card") ? 6 : 4.5, raf = 0, rx = 0, ry = 0;
      card.classList.add("mi-tilt");
      card.appendChild(el("span", "mi-glare"));
      card.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        ry = (x - .5) * max * 2; rx = (.5 - y) * max * 2;
        if (!raf) raf = win.requestAnimationFrame(function () {
          raf = 0;
          card.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        });
      });
      card.addEventListener("pointerleave", function () { if (raf) win.cancelAnimationFrame(raf); raf = 0; card.style.transform = ""; });
    });
  }

  /* ---------- Buttons: a ripple where you click, and a magnetic pull for the main calls to action ---------- */
  function buttons() {
    if (reduce) return;
    doc.addEventListener("pointerdown", function (e) {
      var b = e.target && e.target.closest && e.target.closest(".cta, .topbar-cta");
      if (!b) return;
      var r = b.getBoundingClientRect(), s = el("span", "mi-click");
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      b.appendChild(s);
      win.setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 800);
    }, { passive: true });
    if (!fine) return;
    Array.prototype.forEach.call(doc.querySelectorAll(".hero .cta, .topbar-cta, #founding-class .cta"), function (b) {
      b.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = "translate(" + (x * 10).toFixed(1) + "px," + (y * 8 - 2).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- A soft gold light that follows the mouse ---------- */
  function aura() {
    if (!fine || reduce) return;
    var a = el("div", "mi-aura");
    doc.body.appendChild(a);
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    function loop() {
      x += (tx - x) * .14; y += (ty - y) * .14;
      a.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? win.requestAnimationFrame(loop) : 0;
    }
    win.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; a.classList.add("on"); }
      if (!raf) raf = win.requestAnimationFrame(loop);
    }, { passive: true });
    root.addEventListener("mouseleave", function () { on = false; a.classList.remove("on"); });
  }

  /* ---------- Scroll: progress line, and the hero rosette turning as you leave it ---------- */
  function scrolling() {
    var bar = el("div", "mi-progress"), stage = doc.querySelector(".mi-stage"), heroEl = doc.querySelector(".hero"), raf = 0;
    doc.body.appendChild(bar);
    function update() {
      raf = 0;
      var max = root.scrollHeight - win.innerHeight, y = win.pageYOffset || root.scrollTop || 0;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
      if (stage && heroEl && !reduce) {
        var end = heroEl.offsetTop + heroEl.offsetHeight;
        stage.style.setProperty("--mi-sy", Math.min(1, Math.max(0, y / Math.max(1, end))).toFixed(3));
      }
    }
    var queue = function () { if (!raf) raf = win.requestAnimationFrame(update); };
    win.addEventListener("scroll", queue, { passive: true });
    win.addEventListener("resize", queue);
    update();
  }

  /* ---------- Accents: orbiting light, play-button ripples, the thirty-places ring, the footer ---------- */
  function accents() {
    Array.prototype.forEach.call(doc.querySelectorAll(".price-card.featured, .vsl-frame"), function (n) { n.appendChild(el("span", "mi-orbit")); });
    var play = doc.querySelector(".vsl-play");
    if (play) {
      play.classList.add("mi-rippled");
      for (var i = 0; i < 3; i++) { var r = el("span", "mi-ripple"); r.style.animationDelay = (i * 1.2) + "s"; play.appendChild(r); }
    }
    var box = doc.querySelector(".founding-number");
    if (box) {
      var ticks = "";
      for (var k = 0; k < 30; k++) ticks += '<line class="mi-tick" style="--i:' + k + '" x1="0" y1="-47" x2="0" y2="-42" transform="rotate(' + (k * 12) + ')"/>';
      box.classList.add("mi-ringed");
      box.appendChild(el("span", "mi-ring", '<svg viewBox="-50 -50 100 100" focusable="false"><g class="mi-ring-spin"><circle class="mi-ring-dash" r="37"/>' + ticks +
        '</g><circle class="mi-ring-arc" r="39.5" pathLength="1"/></svg>'));
      reveal([box], "0px 0px -10% 0px");
    }
    var foot = doc.querySelector("footer");
    if (foot) {
      foot.classList.add("mi-foot");
      foot.appendChild(el("div", "mi-footer-art", rosette("miGoldFoot")));
      var title = foot.querySelector(".mi-footer-title");
      if (title) title.classList.add("mi-shimmer-text");
    }
  }

  safe(hero);
  safe(sections);
  safe(cards);
  safe(buttons);
  safe(aura);
  safe(scrolling);
  safe(accents);
})();
