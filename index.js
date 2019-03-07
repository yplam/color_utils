const COLOR_WHITE = [0xff, 0xff, 0xff];
const DARKEST_COLOR = [0x20, 0x21, 0x24];
const LUMINANCE_MIDPOINT = 0.211692036;
const MIN_READABLE_CONSTRAST_RAITO = 4.5;
const ALPHA_OPAQUE = 255;
const ALPHA_TRANSPARENT= 0;

/**
 * This function attempts to select a color based on |default_foreground| that
 * will meet the minimum contrast ratio when used as a text color on top of
 * |background|. If |default_foreground| already meets the minimum contrast
 * ratio, this function will simply return it. Otherwise it will blend the color
 * darker/lighter until either the contrast ratio is acceptable or the color
 * cannot become any more extreme. Only use with opaque background.
 * @param array[r,g,b,a] default_foreground
 * @param array[r,g,b,a] background
 * @returns array[r,g,b,a] new_foreground
 */
export function getColorWithMinimumContrast(default_foreground, background) {
  let contrasting_color = getColorWithMaxContrast(background);
  let alpha = getBlendValueWithMinimumContrast(default_foreground,
      contrasting_color, background, MIN_READABLE_CONSTRAST_RAITO);
  return alphaBlend(contrasting_color, default_foreground, alpha);
}

/**
 * Attempts to select an alpha value such that blending |target| onto |source|
 * with that alpha produces a color of at least |contrast_ratio| against |base|.
 * If |source| already meets the minimum contrast ratio, this function will
 * simply return 0. Otherwise it will blend the |target| onto |source| until
 * either the contrast ratio is acceptable or the color cannot become any more
 * extreme. |base| must be opaque.
 * @param source
 * @param target
 * @param base
 * @param contrast_ratio
 * @returns {number}
 */
export function getBlendValueWithMinimumContrast(source, target,
                                                 base, contrast_ratio) {
  source = getResultingPaintColor(source, base);
  if (getContrastRatio(source, base) >= contrast_ratio) {
    return 0;
  }
  target = getResultingPaintColor(target, base);
  let kCloseEnoughAlphaDelta = 0x04;
  return findBlendValueForContrastRatio(source, target, base, contrast_ratio,
      kCloseEnoughAlphaDelta);
}


/**
 * Returns the minimum alpha value such that blending |target| onto |source|
 * produces a color that contrasts against |base| with at least |contrast_ratio|
 * unless this is impossible, in which case SK_AlphaOPAQUE is returned.
 * Use only with opaque colors. |alpha_error_tolerance| should normally be 0 for
 * best accuracy, but if performance is critical then it can be a positive value
 * (4 is recommended) to save a few cycles and give "close enough" alpha.
 * @param source
 * @param target
 * @param base
 * @param contrast_ratio
 * @param alpha_error_tolerance
 * @returns {number}
 */
export function findBlendValueForContrastRatio( source, target, base,
                                                contrast_ratio, alpha_error_tolerance) {
  // console.assert(colorGetA(source) == ALPHA_OPAQUE, "Wrong source alpha");
  // console.assert(colorGetA(target) == ALPHA_OPAQUE, "Wrong target alpha");
  // console.assert(colorGetA(base) == ALPHA_OPAQUE, "Wrong soure alpha");
  let base_luminance = getRelativeLuminance(base);

  // Use int for inclusive lower bound and exclusive upper bound, reserving
  // conversion to SkAlpha for the end (reduces casts).
  let low = ALPHA_TRANSPARENT;
  let high = ALPHA_OPAQUE + 1;
  let best = ALPHA_OPAQUE;
  while (low + alpha_error_tolerance < high) {
    let alpha = (low + high) / 2;
    let blended = alphaBlend(target, source, alpha);
    let luminance = getRelativeLuminance(blended);
    let contrast = getContrastLuminanceRatio(luminance, base_luminance);
    if (contrast >= contrast_ratio) {
      best = alpha;
      high = alpha;
    } else {
      low = alpha + 1;
    }
  }
  return best;
}

/**
 * Returns a blend of the supplied colors, ranging from |background| (for
 * |alpha| == 0) to |foreground| (for |alpha| == 255). The alpha channels of
 * the supplied colors are also taken into account, so the returned color may
 * be partially transparent.
 * @param foreground
 * @param background
 * @param alpha
 * @returns {*}
 */
export function alphaBlend(foreground, background, alpha) {
  // console.assert(alpha>=ALPHA_TRANSPARENT && alpha<=ALPHA_OPAQUE,
  //   'alpha need to >=0 and <=255');
  if(alpha == ALPHA_TRANSPARENT){
    return background;
  }
  if(alpha == ALPHA_OPAQUE){
    return foreground;
  }
  let tAlpha = alpha/255.0;
  let fAlpha = colorGetA(foreground);
  let bAlpha = colorGetA(background);
  // [0-255]
  let normalizer = fAlpha * tAlpha + bAlpha * (1.0 - tAlpha);

  if(normalizer == ALPHA_TRANSPARENT){
    return [0, 0, 0, 0];
  }
  let fWeight = fAlpha * tAlpha/normalizer;
  let bWeight = bAlpha * (1.0 - tAlpha)/normalizer;

  let r = Math.round( foreground[0]*fWeight + background[0]*bWeight );
  let g = Math.round( foreground[1]*fWeight + background[1]*bWeight );
  let b = Math.round( foreground[2]*fWeight + background[2]*bWeight );
  return [r, g, b, normalizer];
}

/**
 * Determines the contrast ratio of two colors or two relative luminance values
 * (as computed by RelativeLuminance()), calculated according to
 * http://www.w3.org/TR/WCAG20/#contrast-ratiodef .
 * @param color_a
 * @param color_b
 * @returns {*}
 */
export function getContrastRatio(color_a, color_b) {
  return getContrastLuminanceRatio(getRelativeLuminance(color_a),
      getRelativeLuminance(color_b));
}

export function colorSetA(color, alpha) {
  // console.assert(color.length === 3 || color.length === 4,
  //   {"message": "color len not eq to 3|4", "color": color});
  // console.assert(alpha>=0 && alpha<=255,
  //   {"message": "alpha should be >=0 and <= 255", "alpha": alpha});
  let newColor = color.slice(0, 3);
  newColor.push(alpha);
  return newColor;
}

export function colorGetA(color) {
  // console.assert(color.length === 3 || color.length === 4,
  //   {"message": "color len not eq to 3|4", "color": color});
  if(color.length === 3){
    return ALPHA_OPAQUE;
  }
  else {
    return color[3];
  }
}

/**
 * Returns the color that results from painting |foreground| on top of
 * |background|.
 * @param foreground
 * @param background
 * @returns {*}
 */
function getResultingPaintColor(foreground, background) {
  return alphaBlend(colorSetA(foreground, ALPHA_OPAQUE), background,
    colorGetA(foreground));
}

function getContrastLuminanceRatio(luminance_a, luminance_b) {
  luminance_a += 0.05;
  luminance_b += 0.05;
  return (luminance_a > luminance_b) ? (luminance_a / luminance_b)
                                     : (luminance_b / luminance_a);
}

function getColorWithMaxContrast(color) {
  return isDark(color) ? COLOR_WHITE : DARKEST_COLOR;
}

function isDark(color) {
  return getRelativeLuminance(color) < LUMINANCE_MIDPOINT;
}

function getRelativeLuminance(color) {
  // console.assert(color.length === 3 || color.length === 4,
  //   {"message": "color len not eq to 3|4", "color": color});
  return (0.2126 * linearize(color[0])) +
      (0.7152 * linearize(color[1])) +
      (0.0722 * linearize(color[2]));
}

function linearize(eight_bit_component) {
  let component = eight_bit_component / 255.0;
  // The W3C link in the header uses 0.03928 here.  See
  // https://en.wikipedia.org/wiki/SRGB#Theory_of_the_transformation for
  // discussion of why we use this value rather than that one.
  return (component <= 0.04045) ? (component / 12.92)
      : Math.pow((component + 0.055) / 1.055, 2.4);
}


