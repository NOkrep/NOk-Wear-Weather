# Avatar assets

Source: Quaternius, Universal Base Characters **Standard (free)**.
https://quaternius.itch.io/universal-base-characters

License: CC0 1.0 Universal. Original pack notice: [LICENSE-Quaternius.txt](LICENSE-Quaternius.txt).
Provenance and archive hash: [source.json](source.json).

Only 2 base bodies, 5 hairstyles and 1 beard are included; the full paid Source pack was not used. No face morph targets are present. Original texture references were repaired, unused normal/roughness maps omitted, and base colour textures resized/encoded as WebP. These are real glTF meshes, not generated character images. Preview PNGs were rendered from these models in the application.

The app poses the rig, aligns the hair to the selected base body, tints materials, and derives fitted colour-preview surfaces from body topology. Those surfaces are not digital twins of catalogue products or a fitting simulation. See [development handoff](../../DEVELOPMENT_HANDOFF.md) for current scope and verification.

## Representative garments — 18 October 2026

The viewer now derives separate skinned garment surfaces using six generic templates, plus beanie/scarf/gloves/socks. Sleeve and hem cuts, fit ease and locally generated pattern textures use the shared appearance contract. Collars/hoods/soles use small procedural mesh details. The body/hair source files are unchanged; these garment surfaces are runtime derivatives, not retailer models or cloth simulation. Hair above a beanie is clipped visually without changing the saved hairstyle. Unsupported skirt/dress/sandal/sun-hat/equipment shapes remain on their cards with an explicit note. See development handoff section 15 for evidence and limits.
