/* Live viewers (31 October 2026). Each homepage plan card shows "N people viewing now" while that many people have
   it on screen, counted by /api/live-viewers (docs/live-viewers.sql). On a wide screen all three cards are in view;
   on a phone, only the card swiped to. The id below is random, made fresh on each page load and kept only in memory,
   so nothing is stored on the visitor's device. A card shows its line only when its real count is 2 or more.
   The places pop-up also lives here: the first time the plans come on screen, a small card says how many Applied
   Maqamaat places remain, read from data-places-left on the places section (#founding-class) so the page has one
   source for that number, and adds "N people viewing this offer now" while 2 or more people really have the
   Maqamaat Intensive card on screen. It closes after 15 seconds, when the plans leave the screen, or with its close
   button, and shows once per page view. */
(function () {
  "use strict";
  var doc = document, win = window;
  var cards = Array.prototype.slice.call(doc.querySelectorAll("#programmes .price-card[data-plan]"));
  if (!cards.length || !win.fetch || !win.IntersectionObserver) return;
  var id = win.crypto && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
  var url = "/api/live-viewers", every = 20000, timer = 0, soon = 0, sent = "", inView = {};
  var lines = cards.map(function (card) {
    var line = doc.createElement("p"); line.className = "mi-live"; line.hidden = true;
    line.innerHTML = '<span class="mi-live-dot" aria-hidden="true"></span><span class="mi-live-text"></span>';
    card.appendChild(line); return line;
  });
  var pop = null, popLive = null, popTimer = 0, popShown = false;
  var places = doc.getElementById("founding-class"), left = places ? parseInt(places.getAttribute("data-places-left"), 10) : NaN;
  if (left > 0) {
    pop = doc.createElement("aside"); pop.className = "mi-places-pop"; pop.hidden = true; pop.setAttribute("aria-label", "Places left");
    pop.innerHTML = '<button type="button" class="mi-pop-close" aria-label="Close">×</button>' +
      '<span class="mi-pop-eyebrow">Maqamaat Intensive · Applied Maqamaat</span>' +
      '<strong class="mi-pop-places">' + left + (left === 1 ? ' place' : ' places') + ' remaining</strong>' +
      '<span class="mi-pop-live" hidden><span class="mi-live-dot" aria-hidden="true"></span><span></span></span>' +
      '<a class="mi-pop-cta" href="#journey">Request Your Place →</a>';
    doc.body.appendChild(pop);
    popLive = pop.querySelector(".mi-pop-live");
    var closePop = function () {
      clearTimeout(popTimer); pop.classList.remove("in");
      popTimer = setTimeout(function () { pop.hidden = true; }, 400);
    };
    pop.querySelector(".mi-pop-close").addEventListener("click", closePop);
    pop.querySelector(".mi-pop-cta").addEventListener("click", closePop);
    var openPop = function () {
      if (popShown) return; popShown = true;
      popTimer = setTimeout(function () {
        pop.hidden = false;
        win.requestAnimationFrame(function () { win.requestAnimationFrame(function () { pop.classList.add("in"); }); });
        popTimer = setTimeout(closePop, 15000);
      }, 1200);
    };
  }
  /* Sits inside the right end of the card's label pill, so the card does not grow. Phones centre the label's text,
     so it moves left while the line shows; if the full wording would touch it, the line shortens to "N viewing now". */
  var place = function (line, n) {
    var card = line.parentNode, label = card.querySelector(".choice-label"), text = line.lastChild;
    text.textContent = n + " people viewing now";
    if (!label) return;
    line.style.top = label.offsetTop + "px"; line.style.height = label.offsetHeight + "px";
    line.style.right = parseFloat(win.getComputedStyle(card).paddingRight) + parseFloat(win.getComputedStyle(label).paddingRight) + 2 + "px";
    var words = doc.createRange(); words.selectNodeContents(label);
    if (line.getBoundingClientRect().left < words.getBoundingClientRect().right + 10) text.textContent = n + " viewing now";
  };
  var show = function (counts) {
    cards.forEach(function (card, i) {
      var n = counts ? counts[card.getAttribute("data-plan")] : 0, line = lines[i], on = n >= 2;
      line.hidden = !on; card.classList.toggle("mi-live-on", on);
      if (on) place(line, n);
    });
    if (popLive) {
      var offer = counts ? counts.intensive : 0;
      popLive.hidden = !(offer >= 2);
      if (!popLive.hidden) popLive.lastChild.textContent = offer + " people viewing this offer now";
    }
  };
  var plans = function () {
    return doc.visibilityState === "visible" ? cards.filter(function (c) { return inView[c.getAttribute("data-plan")]; }).map(function (c) { return c.getAttribute("data-plan"); }) : [];
  };
  var post = function (list, leaving) {
    var body = JSON.stringify({ id: id, plans: list });
    if (leaving && navigator.sendBeacon && navigator.sendBeacon(url, body)) return;
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!leaving && sent) show(d && d.counts); })
      .catch(function () { show(null); });
  };
  /* Sends the plans in view when they change (after swiping settles) and every 20 seconds while any are in view. */
  var sync = function (force) {
    var list = plans(), key = list.join(",");
    if (!force && key === sent) return;
    clearInterval(timer); timer = 0;
    if (!list.length) { if (sent) post([], true); sent = ""; return; }
    sent = key; post(list, false);
    timer = setInterval(function () { sync(true); }, every);
  };
  /* Waits longer before counting someone as gone, so the phone carousel's slide between cards is not a leave. */
  var later = function () { clearTimeout(soon); soon = setTimeout(sync, plans().length ? 400 : 1500); };
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { inView[e.target.getAttribute("data-plan")] = e.isIntersecting; });
    later();
    if (pop) {
      var any = function () { return cards.some(function (c) { return inView[c.getAttribute("data-plan")]; }); };
      /* Same grace as above, so the carousel's slide does not close it. */
      if (any()) openPop(); else if (popShown) setTimeout(function () { if (!any()) closePop(); }, 1500);
    }
  }, { threshold: 0.6 });
  cards.forEach(function (card) { seen.observe(card); });
  doc.addEventListener("visibilitychange", later);
  win.addEventListener("pagehide", function () { clearInterval(timer); timer = 0; if (sent) post([], true); sent = ""; });
  win.addEventListener("pageshow", function (e) { if (e.persisted) later(); });
  win.addEventListener("resize", function () { lines.forEach(function (line) { if (!line.hidden) place(line, parseInt(line.lastChild.textContent, 10)); }); });
})();
