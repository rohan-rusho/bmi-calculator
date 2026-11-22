# BMI Calculator ⚖️

A free, instant Body Mass Index calculator. Enter your height and weight —
metric or imperial — and get your BMI, your category, a marker on the scale,
and the healthy weight range for your height.

## Features

- **Live results** — BMI updates as you type, no button needed
- **Metric + imperial toggle** — kg/cm or lb/ft+in, values convert when you switch
- **Category scale** — underweight / healthy / overweight / obese, with a marker
  positioned exactly where your BMI lands
- **Healthy-range hint** — the weight range that keeps your BMI between 18.5 and 24.9
- **Copy result** — one tap to copy your BMI and range
- Responsive, keyboard-friendly, `aria-live` results, `prefers-reduced-motion` respected
- Nothing is stored — everything is calculated in your browser

## The math

BMI = weight (kg) ÷ height (m)². Example: 70 kg ÷ (1.75 m)² = **22.9 — healthy**.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no dependencies — just open `index.html` (or serve it).

## Deploy

Static site — drop the folder on any static host (GitHub Pages, Netlify,
Vercel, or any web server). The only external dependency is Google Fonts.
