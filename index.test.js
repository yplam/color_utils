import {
  colorSetA,
  colorGetA,
  alphaBlend,
  getColorWithMinimumContrast,
  getContrastRatio,
  getBlendValueWithMinimumContrast
} from './index';

test('[colorSetA]', () => {
  let color = [1,2,3];
  expect(colorSetA(color, 0.5)).toEqual([1,2,3,0.5]);
  expect(color).toEqual([1,2,3]);
});

test('[colorGetA]', () => {
  expect(colorGetA([1,2,3,0.5])).toBe(0.5);
  expect(colorGetA([1,2,3])).toBe(255);
});

// // One is fully transparent, result is partially transparent.
// back = SkColorSetA(back, 0);
// EXPECT_EQ(136U, SkColorGetA(AlphaBlend(fore, back, SkAlpha{136})));

// // Both are fully transparent, result is fully transparent.
// fore = SkColorSetA(fore, 0);
// EXPECT_EQ(0U, SkColorGetA(AlphaBlend(fore, back, 1.0f)));

test('[alphaBlend]', () => {
  let fore = [200, 200, 200, 255]
  let back = [100, 100, 100, 255];
  expect(alphaBlend(fore, back, 0)).toEqual(back);
  expect(alphaBlend(fore, back, 255)).toEqual(fore);
  let backA = colorSetA(back, 0);
  expect(colorGetA(alphaBlend(fore, backA, 136))).toEqual(136);
  let foreA = colorSetA(fore, 0);
  expect(colorGetA(alphaBlend(foreA, backA, 255))).toEqual(0);
});

test('[getColorWithMinimumContrast foreground already meets minimum]', () => {
  expect(getColorWithMinimumContrast([0, 0, 0], [255,255,255]))
    .toEqual([0, 0, 0]);
});

test('[getColorWithMinimumContrast blend darker]', () => {
  let foreground = [0xaa, 0xaa, 0xaa];
  let MIN_READABLE_CONSTRAST_RAITO = 4.5;
  let result = getColorWithMinimumContrast(foreground, [0xff, 0xff, 0xff]);
  expect(result).not.toEqual(foreground);
  let contrastRatio = getContrastRatio(result, [0xff, 0xff, 0xff]);
  expect(contrastRatio).toBeGreaterThanOrEqual(MIN_READABLE_CONSTRAST_RAITO);
});

test('[getColorWithMinimumContrast blend lighter]', () => {
  let foreground = [0x33, 0x33, 0x33];
  let MIN_READABLE_CONSTRAST_RAITO = 4.5;
  let result = getColorWithMinimumContrast(foreground, [0x00, 0x00, 0x00]);
  expect(result).not.toEqual(foreground);
  let contrastRatio = getContrastRatio(result, [0x00, 0x00, 0x00]);
  expect(contrastRatio).toBeGreaterThanOrEqual(MIN_READABLE_CONSTRAST_RAITO);
});

test('[getColorWithMinimumContrast as expected]', () => {
  let source = [0xDE, 0xE1, 0xE6];
  let target = [0xFF, 0xFF, 0xFF];
  let base = source.slice(0, 3);
  let alpha = getBlendValueWithMinimumContrast(source, target, base, 1.11);
  expect(alpha/255).toBeCloseTo(0.4, 2);
  alpha = getBlendValueWithMinimumContrast(source, target, base, 1.19);
  expect(alpha/255).toBeCloseTo(0.65, 1);
  alpha = getBlendValueWithMinimumContrast(source, target, base, 1.13728);
  expect(alpha/255).toBeCloseTo(0.45, 1);
});
