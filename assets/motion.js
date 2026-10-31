/* Mounir Institute motion layer (28 October 2026). Styles live in assets/motion.css.
   Sets the html classes the styles depend on, flows an orb of light between the four principles,
   and adds the soft gold light that follows the mouse. Respects prefers-reduced-motion, and only runs
   the mouse light for mouse and trackpad users. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { try { return win.matchMedia(q).matches; } catch (e) { return false; } };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(hover: hover) and (pointer: fine)");
  root.classList.toggle("mi-motion", !reduce);
  root.classList.toggle("mi-fine", fine && !reduce);
  if (reduce) return;

  /* The four principles: an orb of light flows along the numbers to whichever card the page's script marks
     .is-active, a softer glow trails behind it, and the card lights up as the orb arrives (31 October 2026). */
  try {
    var section = doc.getElementById("method"), track = section && section.querySelector(".method-timeline");
    if (track) {
      var make = function (cls) { var n = doc.createElement("span"); n.className = cls; n.setAttribute("aria-hidden", "true"); track.insertBefore(n, track.firstChild); return n; };
      var orb = make("mi-orb"), trail = make("mi-orb-trail"), line = make("mi-orb-line"), lights = [orb, trail, line];
      var core = doc.createElement("span"); core.className = "mi-orb-core"; orb.appendChild(core);
      Array.prototype.forEach.call(track.querySelectorAll(".method-card"), function (card) {
        var lit = doc.createElement("span"); lit.className = "mi-lit"; lit.setAttribute("aria-hidden", "true"); card.appendChild(lit);
      });
      var placed = false, queued = 0, last = null, settle = 0;
      section.classList.add("mi-gliding");
      var centre = function (el) {
        var t = track.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: r.left - t.left + track.scrollLeft - track.clientLeft + r.width / 2, y: r.top - t.top + track.scrollTop - track.clientTop + r.height / 2 };
      };
      var move = function (node, at) { node.style.transform = "translate(" + at.x.toFixed(1) + "px," + at.y.toFixed(1) + "px)"; };
      var place = function () {
        queued = 0;
        if (win.getComputedStyle(orb).display === "none") {
          /* Phones use the per-card glow. Reset once, so this does not keep re-triggering itself. */
          if (placed) { placed = false; last = null; lights.forEach(function (n) { n.classList.remove("ready", "on", "moving"); }); }
          return;
        }
        var steps = track.querySelectorAll(".method-step");
        var step = section.querySelector(".method-step.is-active") || steps[0];
        var num = step && step.querySelector(".method-number");
        if (!num || !num.offsetWidth) return;
        var at = centre(num);
        /* The hairline runs from the first number to the last while they share a row. */
        var a = centre(steps[0].querySelector(".method-number")), b = centre(steps[steps.length - 1].querySelector(".method-number"));
        if (Math.abs(a.y - b.y) < 2 && b.x > a.x) { line.style.width = (b.x - a.x).toFixed(1) + "px"; move(line, a); line.style.visibility = ""; }
        else line.style.visibility = "hidden";
        /* While it travels, the orb stretches along its path, then rounds off again as it arrives. */
        if (placed && last && (Math.abs(last.x - at.x) > 1 || Math.abs(last.y - at.y) > 1)) {
          core.style.setProperty("--mi-orb-angle", (Math.atan2(at.y - last.y, at.x - last.x) * 180 / Math.PI).toFixed(1) + "deg");
          orb.classList.add("moving");
          win.clearTimeout(settle);
          settle = win.setTimeout(function () { orb.classList.remove("moving"); }, 520);
        }
        move(orb, at); move(trail, at);
        last = at;
        if (!placed) {
          placed = true;
          lights.forEach(function (n) { n.classList.add("on"); });
          win.requestAnimationFrame(function () { win.requestAnimationFrame(function () { lights.forEach(function (n) { n.classList.add("ready"); }); }); });
        }
      };
      var queue = function () { if (!queued) queued = win.requestAnimationFrame(place); };
      /* Watch only the principle cards, so the light's own class changes never wake this up. */
      var watcher = new MutationObserver(queue);
      Array.prototype.forEach.call(track.querySelectorAll(".method-step"), function (step) { watcher.observe(step, { attributes: true, attributeFilter: ["class"] }); });
      if ("ResizeObserver" in win) new ResizeObserver(queue).observe(track);
      win.addEventListener("resize", queue);
      queue();
    }
  } catch (e) { if (win.console) console.warn("Mounir motion:", e); }

  if (!fine) return;
  try {
    var a = doc.createElement("div");
    a.className = "mi-aura";
    a.setAttribute("aria-hidden", "true");
    doc.body.appendChild(a);
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    var loop = function () {
      x += (tx - x) * .14; y += (ty - y) * .14;
      a.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .3 ? win.requestAnimationFrame(loop) : 0;
    };
    win.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; a.classList.add("on"); }
      if (!raf) raf = win.requestAnimationFrame(loop);
    }, { passive: true });
    root.addEventListener("mouseleave", function () { on = false; a.classList.remove("on"); });
  } catch (e) { if (win.console) console.warn("Mounir motion:", e); }
})();
