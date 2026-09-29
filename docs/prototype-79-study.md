# Scene CC — Verdant Filaments

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250710 / graphic. User-supplied source and screenshot inspected 2026-09-28. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference combines many translucent green elliptical marks with alternating dark and white hairline outlines. Overlap creates a continuous mint-to-forest-green field, although the underlying ground is white. Circular tangles form local densities rather than a grid. Sparse, sharply angular fan-like filaments add a second scale of detail and subtle shadows.

## Independent implementation

190 seeded clusters each contain two cached Canvas layers of 22 anisotropic elliptical marks. Color washes and thin outlines are composited into each transparent layer. These independently drift, rotate, shear and expand at explicit timestamps, changing their interference without regenerating noisy geometry. A separate field of 118 alternating-radius filament accents provides sharper forms and faint shadows.

This uses native Canvas cached layers and independently parameterized accent profiles, not the reference functions. Layer transforms preserve the fine loops while making the whole texture move coherently. All seeds and motion are deterministic, with no frame history.

## Audio and states

- Bass expands the ellipse layers.
- Mids alter shear, changing overlap and apparent density.
- RMS subtly modulates layer opacity.
- Decaying transients extend filament accents.
- Calm/active/extreme motion and impulse parameters increase turning and transient response. Other shared feature/state fields are retained but not separately mapped.

The real-track controls use the established timestamp interpolation, envelopes and short spatial delays. Autonomous movement remains active with audio response disabled.

## Output and reuse

25-second standalone review study, real track **02:08–02:33**, 960 × 540, 30 fps, 750 frames, H.264/AAC. This retains the existing study interval rather than assigning final timeline placement.

- Video: `renders/prototype-79/signal-lattice-79-scene-cc-25s.mp4`
- Contact sheet: `renders/prototype-79/contact-sheet.jpg`
- Implementation: `src/prototype-79/scene-cc.js`
- Preview: `pages/prototype-79.html`
- Render: `node scripts/render-prototype-79.mjs`

Seeded partial introductions preserve the outgoing canvas. Arbitrary later reuse requires no simulation warm-up. Cached layers target the current output scale and may need higher-resolution regeneration for larger renders. Loop-level motion occurs through layer transforms, not independent deformation of every ellipse. Previous scenes and segment assemblies are unchanged; slot 78 is untouched.

## Dynamic revision

Loop banks now counter-rotate continuously with larger, faster oscillations, anisotropic stretching, stronger shear, wider cluster travel and relative orbital motion. Bass and mids more strongly reshape overlaps. The filament accents travel farther, rotate continuously, flex faster and respond more strongly to transients. Seeded marks and colors are unchanged; motion remains explicit-time.
