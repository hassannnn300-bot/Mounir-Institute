/* The recitation recorder (1 November 2026): record on the page or upload an audio file, listen back, remove and try
   again. The homepage questionnaire's details step uses it (optional, up to 30 seconds, sent to Supabase after Secure
   My Place) and so does the 1-to-1 assessment's details step (required, Surah Al-Fatiha in up to 90 seconds, attached
   to the email draft). Styles are in assets/recitation.css.
   miRecitation.mount(element, options) fills the element and returns stop(), which ends a recording still running
   when the visitor leaves the step. Options: label and hint (HTML), privacy (a line under it), min and max seconds,
   value (a recording kept from before) and onChange(recording or null). A recording is
   {blob, type, seconds, source: "recorded" or "uploaded", name}; seconds is 0 for a file whose length can't be read. */
(function () {
  "use strict";
  var BYTES = 20 * 1024 * 1024;
  var TYPES = { m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg", opus: "audio/ogg", webm: "audio/webm", caf: "audio/x-caf" };
  var clock = function (s) { return Math.floor(s / 60) + ":" + ("0" + Math.floor(s % 60)).slice(-2); };
  var mounted = 0;
  function mount(el, o) {
    var min = o.min || 5, max = o.max || 30, value = o.value || null, recorder = null, stopNow = null, id = "recite-" + (++mounted);
    el.classList.add("recite"); el.setAttribute("role", "group"); el.setAttribute("aria-labelledby", id + "-label");
    el.innerHTML = '<label id="' + id + '-label">' + o.label + '</label><p class="recite-hint">' + o.hint + '</p>' +
      '<div class="recite-start"><button type="button" class="recite-btn recite-record"><span class="recite-dot" aria-hidden="true"></span>Record now</button>' +
      '<button type="button" class="recite-btn recite-pick">Upload a recording</button>' +
      '<input class="recite-file" type="file" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.caf" hidden tabindex="-1" aria-hidden="true"></div>' +
      '<div class="recite-live" role="status" aria-live="polite"><span class="recite-dot" aria-hidden="true"></span><span class="recite-clock"></span><span class="recite-note"></span><button type="button" class="recite-btn recite-stop">Stop</button></div>' +
      '<div class="recite-done"><audio controls preload="metadata" aria-label="Your recitation"></audio><div class="recite-row"><span class="recite-summary"></span><button type="button" class="recite-link recite-redo">Remove and try again</button></div></div>' +
      '<p class="recite-error" role="alert" hidden></p>' + (o.privacy ? '<p class="recite-privacy">' + o.privacy + '</p>' : '');
    var q = function (s) { return el.querySelector(s); };
    var record = q(".recite-record"), pick = q(".recite-pick"), file = q(".recite-file"), clockEl = q(".recite-clock"), note = q(".recite-note");
    var stop = q(".recite-stop"), player = q("audio"), summary = q(".recite-summary"), redo = q(".recite-redo"), error = q(".recite-error");
    var fail = function (m) { error.textContent = m || ""; error.hidden = !m; };
    var show = function () {
      el.dataset.state = value ? "done" : "empty";
      if (value) {
        player.src = URL.createObjectURL(value.blob);
        summary.textContent = (value.source === "recorded" ? "Recorded" : "Uploaded") + " · " + (value.seconds ? clock(value.seconds) : value.name);
      }
      if (o.onChange) o.onChange(value);
    };
    var keep = function (v) { value = v; fail(""); show(); };
    record.addEventListener("click", function () {
      fail("");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { fail("This browser can’t record here. Please upload a recording instead."); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0] || "";
        var chunks = [], started = Date.now(), cancelled = false, tick = 0;
        recorder = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
        var release = function () { clearInterval(tick); stream.getTracks().forEach(function (t) { t.stop(); }); stopNow = null; };
        recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = function () {
          release();
          if (cancelled) return;
          var seconds = Math.min((Date.now() - started) / 1000, max), kind = (recorder.mimeType || type || "audio/webm").split(";")[0];
          if (seconds < min) { el.dataset.state = "empty"; fail("That was " + clock(seconds) + ". Please record at least " + min + " seconds."); return; }
          keep({ blob: new Blob(chunks, { type: kind }), type: kind, seconds: seconds, source: "recorded", name: "" });
        };
        stopNow = function () { cancelled = true; if (recorder.state !== "inactive") recorder.stop(); release(); el.dataset.state = value ? "done" : "empty"; };
        recorder.start(1000); el.dataset.state = "recording";
        var update = function () {
          var s = (Date.now() - started) / 1000;
          clockEl.textContent = clock(Math.min(s, max)) + " / " + clock(max);
          note.textContent = s < min ? "Keep going, at least " + min + " seconds" : "You can stop when you’re ready";
          if (s >= max && recorder.state === "recording") recorder.stop();
        };
        update(); tick = setInterval(update, 250);
      }, function () { fail("We couldn’t use your microphone. Allow it in your browser’s settings, or upload a recording instead."); });
    });
    stop.addEventListener("click", function () { if (recorder && recorder.state === "recording") recorder.stop(); });
    pick.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () {
      var f = file.files[0]; file.value = ""; if (!f) return; fail("");
      var ext = (f.name.split(".").pop() || "").toLowerCase(), kind = /^audio\//.test(f.type) ? f.type.split(";")[0] : TYPES[ext];
      if (!kind) { fail("Please choose an audio file, such as a voice memo."); return; }
      if (f.size > BYTES) { fail("That file is over 20 MB. Please choose a smaller recording."); return; }
      // Reads the length from the file itself; a file whose length can't be read is accepted as it is.
      var probe = new Audio(), url = URL.createObjectURL(f), settled = false;
      var finish = function (seconds) {
        if (settled) return; settled = true; URL.revokeObjectURL(url);
        var known = isFinite(seconds) && seconds > 0;
        if (known && seconds > max + 0.5) { fail("That recording is " + clock(seconds) + ". Please choose one of up to " + max + " seconds."); return; }
        if (known && seconds < min - 0.5) { fail("That recording is " + clock(seconds) + ". Please choose one of at least " + min + " seconds."); return; }
        keep({ blob: f, type: kind, seconds: known ? seconds : 0, source: "uploaded", name: f.name });
      };
      probe.preload = "metadata"; probe.onloadedmetadata = function () { finish(probe.duration); }; probe.onerror = function () { finish(NaN); };
      setTimeout(function () { finish(NaN); }, 5000); probe.src = url;
    });
    redo.addEventListener("click", function () { value = null; player.removeAttribute("src"); player.load(); show(); record.focus(); });
    show();
    return { stop: function () { if (stopNow) stopNow(); } };
  }
  window.miRecitation = { mount: mount };
})();
