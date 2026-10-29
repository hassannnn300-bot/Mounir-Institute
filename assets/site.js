/* Mounir Institute shared page script (29 October 2026). Loaded on every public page with defer.
   It runs the header dropdowns (Discover, Courses) for mouse, keyboard and touch, adds the dimmed backdrop
   and panel titles used on phones, and fills the footer year. Styles live in assets/site.css. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, win = window;

  var year = doc.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var menus = Array.prototype.slice.call(doc.querySelectorAll(".site-topbar .topbar-dropdown"));
  if (!menus.length) return;

  var phone = function () { try { return win.matchMedia("(max-width: 760px)").matches; } catch (e) { return false; } };
  var timer = 0, openedAt = 0, lastPointer = 0, autoOpened = null;

  var scrim = doc.createElement("div");
  scrim.className = "mi-scrim";
  scrim.setAttribute("aria-hidden", "true");
  doc.body.appendChild(scrim);

  var close = function (except) { menus.forEach(function (m) { if (m !== except) m.open = false; }); };
  var sync = function () {
    var any = menus.some(function (m) { return m.open; });
    root.classList.toggle("mi-menu-open", any && phone());
    menus.forEach(function (m) { var s = m.querySelector("summary"); if (s) s.setAttribute("aria-expanded", m.open ? "true" : "false"); });
    if (any) openedAt = win.scrollY || 0;
  };

  menus.forEach(function (m) {
    var summary = m.querySelector("summary"), panel = m.querySelector(".topbar-menu");
    if (summary) {
      summary.setAttribute("aria-haspopup", "true");
      summary.setAttribute("aria-expanded", "false");
    }
    /* On phones each panel opens full width under the header, so it carries its own small title. */
    if (summary && panel && !panel.querySelector(".mi-menu-title")) {
      var title = doc.createElement("span");
      title.className = "mi-menu-title";
      title.setAttribute("aria-hidden", "true");
      title.textContent = summary.textContent.replace(/[\u2304\u2228\s]+$/, "").trim();
      panel.insertBefore(title, panel.firstChild);
    }
    m.addEventListener("toggle", sync);

    /* A mouse opens a menu on hover and closes it shortly after leaving. */
    m.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      win.clearTimeout(timer); close(m);
      if (!m.open) { m.open = true; autoOpened = m; }
    });
    m.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      win.clearTimeout(timer);
      timer = win.setTimeout(function () { if (!m.matches(":hover") && !m.contains(doc.activeElement)) m.open = false; }, 260);
    });

    /* A tap or click toggles it. A menu that hover or keyboard focus has just opened stays open on that first
       click. Android focuses the button on tap, so focus from a pointer is ignored here: the old script opened
       the menu on that focus and the tap then closed it again straight away, so the menus never showed. */
    if (summary) {
      summary.addEventListener("pointerdown", function () { lastPointer = Date.now(); });
      summary.addEventListener("click", function (e) {
        e.preventDefault(); win.clearTimeout(timer);
        if (autoOpened === m && m.open) { autoOpened = null; return; }
        autoOpened = null;
        var was = m.open; close(); m.open = !was;
      });
    }
    m.addEventListener("focusin", function () {
      if (Date.now() - lastPointer < 800) return;
      win.clearTimeout(timer); close(m);
      if (!m.open) { m.open = true; autoOpened = m; }
    });
    m.addEventListener("focusout", function () {
      win.clearTimeout(timer);
      timer = win.setTimeout(function () { if (!m.contains(doc.activeElement) && !m.matches(":hover")) m.open = false; }, 260);
    });
    if (panel) Array.prototype.forEach.call(panel.querySelectorAll("a"), function (a) { a.addEventListener("click", function () { m.open = false; }); });
  });

  doc.addEventListener("pointerdown", function (e) {
    if (!e.target.closest(".site-topbar .topbar-dropdown")) { win.clearTimeout(timer); close(); }
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !menus.some(function (m) { return m.open; })) return;
    var open = menus.filter(function (m) { return m.open; })[0];
    win.clearTimeout(timer); close();
    var s = open && open.querySelector("summary"); if (s) s.focus();
  });
  /* Scrolling the page away closes an open menu, and leaving phone width drops the backdrop. */
  win.addEventListener("scroll", function () {
    if (menus.some(function (m) { return m.open; }) && Math.abs((win.scrollY || 0) - openedAt) > 60) close();
  }, { passive: true });
  win.addEventListener("resize", sync);
})();
