# Third-party notices and thanks

Weathrobe is built on other people's work. The in-app list lives in **Sources & privacy → Thanks & sources** and is generated from [`lib/credits.ts`](lib/credits.ts). `tests/credits.test.cjs` checks that every `package.json` dependency is listed there with the licence its own package declares.

## Ported code

### pythermalcomfort

[`lib/thermal-model.ts`](lib/thermal-model.ts) ports the clothing insulation functions (ISO 9920 / ISO 7730 Annex C) and the IREQ model (ISO 11079 Annex A) to TypeScript from pythermalcomfort (`pythermalcomfort/clothing/*`, `pythermalcomfort/models/ireq.py`). [`lib/comfort-model.ts`](lib/comfort-model.ts) ports its Gagge two-node model and ASHRAE 55 SolarCal (`pythermalcomfort/models/two_nodes_gagge.py`, `pythermalcomfort/models/solar_gain.py`); pinned SolarCal values in `tests/comfort-model.test.cjs` come from its `tests/test_solar_gain.py`. The garment insulation values and metabolic rates come from its `utilities.clo_individual_garments` and `utilities.met_typical_tasks` (ASHRAE 55 tables). Validation values in `tests/thermal-model.test.cjs` come from its tests (`tests/test_clothing.py`, `tests/test_ireq.py`, including ISO 11079 Table F1).

Source: https://github.com/pythermalcomfort/pythermalcomfort

```
MIT License

Copyright (c) 2019 Federico Tartarini

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice (including the next paragraph) shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### validation-data-comfort-models

`tests/fixtures/comfort-validation/ts_two_nodes_gagge.json` and `ts_solar_gain.json` are copied unchanged from tag v1.1.0 of https://github.com/FedericoTartarini/validation-data-comfort-models.

```
MIT License

Copyright (c) 2021 Federico Tartarini

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Standards and methods (cited, not copied)

- ISO 9920 (clothing insulation), ISO 7730 Annex C (dynamic clothing insulation), ISO 11079 (IREQ) — International Organization for Standardization.
- ASHRAE Standard 55 garment insulation table and Appendix C SolarCal — ASHRAE.
- Gagge two-node model — A. P. Gagge, A. P. Fobelets, L. G. Berglund (1986).
- Measured ensemble insulation — J. Lee, H. Zhang, E. Arens, "Typical Clothing Ensemble Insulation Levels for Sixteen Body Parts", CLIMA 2013, Center for the Built Environment, UC Berkeley (https://escholarship.org/uc/item/18f0r375). Whole-body values are transcribed as numbers with attribution in `tests/fixtures/cbe-2013-ensembles.json`; no text or images are copied.
- NOAA Solar Calculation equations — NOAA Global Monitoring Laboratory (public domain).

## Data and services

Open-Meteo (CC BY 4.0), MET Norway (CC BY 4.0 / NLOD 2.0), Bright Sky with Deutscher Wetterdienst data (DWD terms), OpenStreetMap contributors via Nominatim (ODbL 1.0), Project OSRM (BSD-2-Clause software), CARTO basemaps (CARTO attribution terms), WeatherAPI.com and OpenWeatherMap (optional, with the user's own key), UPCitemdb (trial endpoint), Google Gemini API (optional, with the user's own key). Terms and links: `lib/credits.ts`.

## Assets

`public/avatars`: Universal Base Characters (Standard) by Quaternius, CC0 1.0. Original notice: [`public/avatars/LICENSE-Quaternius.txt`](public/avatars/LICENSE-Quaternius.txt).

## npm packages

Each package keeps its own licence file under `node_modules/<package>/`. Runtime and development packages, their authors, licences and what they do here are listed in `lib/credits.ts`.
