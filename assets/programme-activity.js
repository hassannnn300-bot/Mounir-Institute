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
})();
