/* BMI Calculator — live BMI with metric/imperial toggle and category scale. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var heightInput = $("height-input");
  var heightInchesInput = $("height-inches-input");
  var heightInchesWrap = $("height-inches-wrap");
  var weightInput = $("weight-input");
  var heightLabel = $("height-label");
  var weightLabel = $("weight-label");
  var weightHint = $("weight-hint");
  var inputGrid = document.querySelector(".input-grid");
  var resultEmpty = $("result-empty");
  var resultBody = $("result-body");
  var bmiValue = $("bmi-value");
  var bmiCategory = $("bmi-category");
  var bmiNote = $("bmi-note");
  var scaleMarker = $("scale-marker");
  var healthyRange = $("healthy-range");
  var toastEl = $("toast");

  var units = "metric";
  var toastTimer = null;

  /* ---------- Pure helpers (also unit-tested in node) ---------- */
  function calcBmi(weightKg, heightM) {
    if (!weightKg || !heightM || heightM <= 0) return null;
    return weightKg / (heightM * heightM);
  }

  function bmiCategoryFor(bmi) {
    if (bmi < 18.5) return { key: "under", label: "Underweight", note: "Your BMI is below the healthy range. Consider talking to a clinician or dietitian about gaining weight healthily." };
    if (bmi < 25) return { key: "healthy", label: "Healthy weight", note: "Nice — your BMI sits inside the healthy range. Keep up the balanced habits." };
    if (bmi < 30) return { key: "over", label: "Overweight", note: "Your BMI is above the healthy range. Small, steady changes to food and movement can bring it down." };
    return { key: "obese", label: "Obese", note: "Your BMI is in the obese range. A clinician can help you plan a safe, sustainable path down." };
  }

  /* Marker position on the 15–40 scale (clamped). Scale segments: <18.5 = 30%,
     18.5–24.9 = 24%, 25–29.9 = 18%, 30+ = rest. Map linearly within segments. */
  function markerPct(bmi) {
    var clamped = Math.min(40, Math.max(15, bmi));
    if (clamped < 18.5) return ((clamped - 15) / 3.5) * 30;
    if (clamped < 25) return 30 + ((clamped - 18.5) / 6.4) * 24;
    if (clamped < 30) return 54 + ((clamped - 25) / 5) * 18;
    return 72 + ((clamped - 30) / 10) * 28;
  }

  function healthyWeightRange(heightM) {
    return { low: 18.5 * heightM * heightM, high: 24.9 * heightM * heightM };
  }

  function kgToLb(kg) { return kg * 2.20462; }
  function lbToKg(lb) { return lb / 2.20462; }
  function cmToInches(cm) { return cm / 2.54; }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- Calculation ---------- */
  function readInputs() {
    if (units === "metric") {
      var cm = parseFloat(heightInput.value);
      var kg = parseFloat(weightInput.value);
      if (isNaN(cm) || isNaN(kg) || cm <= 0 || kg <= 0) return null;
      return { heightM: cm / 100, weightKg: kg, heightCm: cm, displayWeight: kg, weightUnit: "kg" };
    }
    var ft = parseFloat(heightInput.value);
    var inch = parseFloat(heightInchesInput.value || "0");
    var lb = parseFloat(weightInput.value);
    if (isNaN(ft) || isNaN(lb) || ft <= 0 || lb <= 0) return null;
    if (isNaN(inch)) inch = 0;
    var totalInches = ft * 12 + inch;
    return {
      heightM: totalInches * 0.0254,
      weightKg: lbToKg(lb),
      heightCm: totalInches * 2.54,
      displayWeight: lb,
      weightUnit: "lb"
    };
  }

  function calculate() {
    var data = readInputs();
    if (!data) {
      resultEmpty.classList.remove("hidden");
      resultBody.classList.add("hidden");
      return;
    }
    var bmi = calcBmi(data.weightKg, data.heightM);
    if (bmi === null) {
      resultEmpty.classList.remove("hidden");
      resultBody.classList.add("hidden");
      return;
    }
    var cat = bmiCategoryFor(bmi);
    var range = healthyWeightRange(data.heightM);

    bmiValue.textContent = bmi.toFixed(1);
    bmiCategory.textContent = cat.label;
    bmiCategory.className = "result-category cat-" + cat.key;
    bmiNote.textContent = cat.note;
    scaleMarker.style.left = markerPct(bmi).toFixed(1) + "%";

    if (units === "metric") {
      healthyRange.innerHTML = "Healthy weight for your height: <strong>" +
        range.low.toFixed(1) + " – " + range.high.toFixed(1) + " kg</strong>";
    } else {
      healthyRange.innerHTML = "Healthy weight for your height: <strong>" +
        kgToLb(range.low).toFixed(1) + " – " + kgToLb(range.high).toFixed(1) + " lb</strong>";
    }

    if (resultBody.classList.contains("hidden")) {
      resultEmpty.classList.add("hidden");
      resultBody.classList.remove("hidden");
      resultBody.classList.remove("pop");
      void resultBody.offsetWidth; /* restart animation */
      resultBody.classList.add("pop");
    }
  }

  /* ---------- Units toggle ---------- */
  function setUnits(next) {
    if (next === units) return;
    // Convert existing values so nothing is lost.
    var data = readInputs();
    units = next;
    document.querySelectorAll(".unit-btn").forEach(function (b) {
      var active = b.getAttribute("data-units") === units;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (units === "metric") {
      heightLabel.textContent = "Height (cm)";
      weightLabel.textContent = "Weight (kg)";
      weightHint.textContent = "10 – 500 kg";
      heightInput.setAttribute("min", "50");
      heightInput.setAttribute("max", "300");
      heightInput.setAttribute("step", "0.1");
      heightInput.placeholder = "175";
      weightInput.setAttribute("min", "10");
      weightInput.setAttribute("max", "500");
      weightInput.placeholder = "70";
      heightInchesWrap.classList.add("hidden");
      inputGrid.classList.remove("three");
      if (data) {
        heightInput.value = String(Math.round(data.heightCm * 10) / 10);
        weightInput.value = String(Math.round(data.weightKg * 10) / 10);
      }
    } else {
      heightLabel.textContent = "Height (ft)";
      weightLabel.textContent = "Weight (lb)";
      weightHint.textContent = "22 – 1100 lb";
      heightInput.setAttribute("min", "1");
      heightInput.setAttribute("max", "9");
      heightInput.setAttribute("step", "1");
      heightInput.placeholder = "5";
      weightInput.setAttribute("min", "22");
      weightInput.setAttribute("max", "1100");
      weightInput.placeholder = "154";
      heightInchesWrap.classList.remove("hidden");
      inputGrid.classList.add("three");
      if (data) {
        var totalIn = cmToInches(data.heightCm);
        heightInput.value = String(Math.floor(totalIn / 12));
        heightInchesInput.value = String(Math.round(totalIn % 12));
        weightInput.value = String(Math.round(kgToLb(data.weightKg) * 10) / 10);
      }
    }
    calculate();
  }

  document.querySelectorAll(".unit-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { setUnits(btn.getAttribute("data-units")); });
  });

  [heightInput, heightInchesInput, weightInput].forEach(function (el) {
    el.addEventListener("input", calculate);
  });

  $("clear-btn").addEventListener("click", function () {
    heightInput.value = "";
    heightInchesInput.value = "";
    weightInput.value = "";
    resultEmpty.classList.remove("hidden");
    resultBody.classList.add("hidden");
    heightInput.focus();
    showToast("Cleared.");
  });

  $("copy-btn").addEventListener("click", function () {
    if (resultBody.classList.contains("hidden")) { showToast("Calculate your BMI first."); return; }
    var text = "My BMI is " + bmiValue.textContent + " (" + bmiCategory.textContent + "). " + healthyRange.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("Result copied!"); }, function () { showToast("Copy failed."); });
    } else {
      showToast(text);
    }
  });

  /* ---------- Header / nav / reveal ---------- */
  var header = $("site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  var navToggle = $("nav-toggle");
  var mobileMenu = $("mobile-menu");
  navToggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  $("year").textContent = new Date().getFullYear();

  /* Expose pure helpers for node-based verification. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      calcBmi: calcBmi, bmiCategoryFor: bmiCategoryFor, markerPct: markerPct,
      healthyWeightRange: healthyWeightRange, kgToLb: kgToLb, lbToKg: lbToKg
    };
  }
})();
