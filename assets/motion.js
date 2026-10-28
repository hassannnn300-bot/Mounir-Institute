/* Mounir Institute motion layer (28 October 2026). Styles live in assets/motion.css.
   Sets the html classes the styles depend on and adds the soft gold light that follows the mouse.
   Respects prefers-reduced-motion, and only runs the light for mouse and trackpad users. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { try { return win.matchMedia(q).matches; } catch (e) { return false; } };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var fine = mq("(hover: hover) and (pointer: fine)");
  root.classList.toggle("mi-motion", !reduce);
  root.classList.toggle("mi-fine", fine && !reduce);
  if (reduce || !fine) return;
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
