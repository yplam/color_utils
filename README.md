# color_utils

color_utils from chromium ui/gfx/color_utils.cc.

Provides functions like:

- getColorWithMinimumContrast: Attempts to select a color based on |default_foreground| that will meet the minimum contrast ratio when used as a text color on top of |background|.
- getBlendValueWithMinimumContrast: Attempts to select an alpha value such that blending |target| onto |source| with that alpha produces a color of at least |contrast_ratio| against |base|.
- findBlendValueForContrastRatio: Returns the minimum alpha value such that blending |target| onto |source| produces a color that contrasts against |base| with at least |contrast_ratio| unless this is impossible.
- alphaBlend: Returns a blend of the supplied colors, ranging from |background| (for |alpha| == 0) to |foreground| (for |alpha| == 255).
