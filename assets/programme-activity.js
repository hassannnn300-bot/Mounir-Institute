/* The green programme indicators use illustrative per-visit numbers; they are not connected to visitor tracking. */
(function () {
  "use strict";

  var doc = document, win = window;
  var cards = Array.prototype.slice.call(doc.querySelectorAll("#programmes .price-card[data-plan]"));
  if (!cards.length) return;

  var range = [2, 3, 4, 5, 6, 7, 8];
  var storageKey = "miProgrammeActivityCounts";
  var previous = {};
  try { previous = JSON.parse(win.sessionStorage.getItem(storageKey) || "{}"); } catch (_) {}

  var counts = {};
  cards.forEach(function (card) {
    var plan = card.getAttribute("data-plan");
    var choices = range.filter(function (value) { return value !== previous[plan]; });
    var count = choices[Math.floor(Math.random() * choices.length)];
    counts[plan] = count;
    previous[plan] = count;

    var line = doc.createElement("p");
    line.className = "mi-programme-viewing";
    line.setAttribute("aria-label", count + " viewing this programme");
    line.innerHTML = '<span class="mi-viewing-dot" aria-hidden="true"></span><span class="mi-viewing-text"></span>';
    line.querySelector(".mi-viewing-text").textContent = count + " viewing this programme";

    var label = card.querySelector(".choice-label");
    if (label && label.parentNode === card) {
      var labelText = doc.createElement("span");
      labelText.className = "mi-plan-label-text";
      labelText.textContent = label.textContent.trim();
      label.textContent = "";
      label.appendChild(labelText);
      label.appendChild(line);
    } else {
      card.insertBefore(line, card.firstChild);
    }
  });
  try { win.sessionStorage.setItem(storageKey, JSON.stringify(previous)); } catch (_) {}

  var pop = null, popTimer = 0, popShown = false;
  var places = doc.getElementById("founding-class");
  var left = places ? parseInt(places.getAttribute("data-places-left"), 10) : NaN;
  if (left > 0) {
    pop = doc.createElement("aside");
    pop.className = "mi-places-pop";
    pop.hidden = true;
    pop.setAttribute("aria-label", "Applied Maqamaat offer");
    pop.innerHTML = '<button type="button" class="mi-pop-close" aria-label="Close">×</button>' +
      '<span class="mi-pop-eyebrow">Applied Maqamaat</span>' +
      '<strong class="mi-pop-places">' + left + (left === 1 ? ' place' : ' places') + ' remaining</strong>' +
      '<span class="mi-pop-viewing"><span class="mi-viewing-dot" aria-hidden="true"></span><span class="mi-pop-viewing-text"></span></span>' +
      '<a class="mi-pop-cta" href="#journey">Request Your Place →</a>';
    doc.body.appendChild(pop);
    pop.querySelector(".mi-pop-viewing-text").textContent = (counts.intensive || counts[cards[0].getAttribute("data-plan")]) + " viewing this programme";

    var closePop = function () {
      clearTimeout(popTimer);
      pop.classList.remove("in");
      popTimer = setTimeout(function () { pop.hidden = true; }, 400);
    };
    var openPop = function () {
      if (popShown) return;
      popShown = true;
      popTimer = setTimeout(function () {
        pop.hidden = false;
        win.requestAnimationFrame(function () { win.requestAnimationFrame(function () { pop.classList.add("in"); }); });
        popTimer = setTimeout(closePop, 15000);
      }, 1200);
    };
    pop.querySelector(".mi-pop-close").addEventListener("click", closePop);
    pop.querySelector(".mi-pop-cta").addEventListener("click", closePop);

    if (win.IntersectionObserver) {
      var inView = {};
      var seen = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView[entry.target.getAttribute("data-plan")] = entry.isIntersecting;
        });
        var any = cards.some(function (card) { return inView[card.getAttribute("data-plan")]; });
        if (any) openPop();
        else if (popShown) setTimeout(function () {
          if (!cards.some(function (card) { return inView[card.getAttribute("data-plan")]; })) closePop();
        }, 1500);
      }, { threshold: 0.6 });
      cards.forEach(function (card) { seen.observe(card); });
    }
  }
})();
