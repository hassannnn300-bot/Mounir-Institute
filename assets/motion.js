/* Mounir Institute motion layer (28 October 2026). Styles live in assets/motion.css.
   Sets the html classes the styles depend on, glides a single light between the four principles,
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

  /* The four principles: one white light glides to whichever card the page's script marks .is-active. */
  try {
    var section = doc.getElementById("method"), track = section && section.querySelector(".method-timeline");
    if (track) {
      var make = function (cls) { var n = doc.createElement("span"); n.className = cls; n.setAttribute("aria-hidden", "true"); track.appendChild(n); return n; };
      var glide = make("mi-glide"), halo = make("mi-glide-halo"), placed = false, queued = 0, lastSpot = "", settle = 0;
      section.classList.add("mi-gliding");
      var put = function (node, target) {
        var t = track.getBoundingClientRect(), r = target.getBoundingClientRect();
        var x = r.left - t.left + track.scrollLeft - track.clientLeft, y = r.top - t.top + track.scrollTop - track.clientTop;
        node.style.width = r.width.toFixed(1) + "px";
        node.style.height = r.height.toFixed(1) + "px";
        node.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      };
      var place = function () {
        queued = 0;
        if (win.getComputedStyle(glide).display === "none") { placed = false; glide.classList.remove("ready", "on"); halo.classList.remove("ready", "on"); return; }
        var step = section.querySelector(".method-step.is-active") || section.querySelector(".method-step");
        if (!step) return;
        var card = step.querySelector(".method-card"), num = step.querySelector(".method-number");
        if (card) { glide.style.borderRadius = win.getComputedStyle(card).borderTopLeftRadius; put(glide, card); }
        if (num && num.offsetWidth) { halo.style.visibility = ""; put(halo, num); } else { halo.style.visibility = "hidden"; }
        /* While it travels, the light softens into a wider glow, then sharpens again on arrival. */
        var spot = glide.style.transform;
        if (placed && lastSpot && spot !== lastSpot) {
          glide.classList.add("moving"); halo.classList.add("moving");
          win.clearTimeout(settle);
          settle = win.setTimeout(function () { glide.classList.remove("moving"); halo.classList.remove("moving"); }, 1250);
        }
        lastSpot = spot;
        if (!placed) {
          placed = true;
          glide.classList.add("on"); halo.classList.add("on");
          win.requestAnimationFrame(function () { win.requestAnimationFrame(function () { glide.classList.add("ready"); halo.classList.add("ready"); }); });
        }
      };
      var queue = function () { if (!queued) queued = win.requestAnimationFrame(place); };
      new MutationObserver(queue).observe(track, { subtree: true, attributes: true, attributeFilter: ["class"] });
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
