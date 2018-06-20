"use strict";

/* MIT license */
var cssKeywords = require('color-name'); // NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)


var reverseKeywords = {};

for (var key in cssKeywords) {
  if (Object.prototype.hasOwnProperty.call(cssKeywords, key)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
}

var conversions = {
  rgb: {
    channels: 3,
    labels: 'rgb'
  },
  hsl: {
    channels: 3,
    labels: 'hsl'
  },
  hsv: {
    channels: 3,
    labels: 'hsv'
  },
  hwb: {
    channels: 3,
    labels: 'hwb'
  },
  cmyk: {
    channels: 4,
    labels: 'cmyk'
  },
  xyz: {
    channels: 3,
    labels: 'xyz'
  },
  lab: {
    channels: 3,
    labels: 'lab'
  },
  lch: {
    channels: 3,
    labels: 'lch'
  },
  hex: {
    channels: 1,
    labels: ['hex']
  },
  keyword: {
    channels: 1,
    labels: ['keyword']
  },
  ansi16: {
    channels: 1,
    labels: ['ansi16']
  },
  ansi256: {
    channels: 1,
    labels: ['ansi256']
  },
  hcg: {
    channels: 3,
    labels: ['h', 'c', 'g']
  },
  apple: {
    channels: 3,
    labels: ['r16', 'g16', 'b16']
  },
  gray: {
    channels: 1,
    labels: ['gray']
  }
}; // hide .channels and .labels properties

for (var model in conversions) {
  if (Object.prototype.hasOwnProperty.call(conversions, model)) {
    if (!('channels' in conversions[model])) {
      throw new Error('missing channels property: ' + model);
    }

    if (!('labels' in conversions[model])) {
      throw new Error('missing channel labels property: ' + model);
    }

    if (conversions[model].labels.length !== conversions[model].channels) {
      throw new Error('channel and label counts mismatch: ' + model);
    }

    var _conversions$model = conversions[model],
        channels = _conversions$model.channels,
        labels = _conversions$model.labels;
    delete conversions[model].channels;
    delete conversions[model].labels;
    Object.defineProperty(conversions[model], 'channels', {
      value: channels
    });
    Object.defineProperty(conversions[model], 'labels', {
      value: labels
    });
  }
}

conversions.rgb.hsl = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);
  var delta = max - min;
  var h;
  var s;

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  var l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

conversions.rgb.hsv = function (rgb) {
  var rdif;
  var gdif;
  var bdif;
  var h;
  var s;
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var v = Math.max(r, g, b);
  var diff = v - Math.min(r, g, b);

  var diffc = function diffc(c) {
    return (v - c) / 6 / diff + 1 / 2;
  };

  if (diff === 0) {
    s = 0;
    h = s;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
};

conversions.rgb.hwb = function (rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var h = conversions.rgb.hsl(rgb)[0];
  var w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};

conversions.rgb.cmyk = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var k = Math.min(1 - r, 1 - g, 1 - b);
  var c = (1 - r - k) / (1 - k) || 0;
  var m = (1 - g - k) / (1 - k) || 0;
  var y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
}; // See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance


function comparativeDistance(x, y) {
  return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
}

conversions.rgb.keyword = function (rgb) {
  var reversed = reverseKeywords[rgb];

  if (reversed) {
    return reversed;
  }

  var currentClosestDistance = Infinity;
  var currentClosestKeyword;

  for (var keyword in cssKeywords) {
    if (Object.prototype.hasOwnProperty.call(cssKeywords, keyword)) {
      var value = cssKeywords[keyword]; // Compute comparative distance

      var distance = comparativeDistance(rgb, value); // Check if its less, if so set as closest

      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
  }

  return currentClosestKeyword;
};

conversions.keyword.rgb = function (keyword) {
  return cssKeywords[keyword];
};

conversions.rgb.xyz = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255; // assume sRGB

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};

conversions.rgb.lab = function (rgb) {
  var xyz = conversions.rgb.xyz(rgb);
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  var l = 116 * y - 16;
  var a = 500 * (x - y);
  var b = 200 * (y - z);
  return [l, a, b];
};

conversions.hsl.rgb = function (hsl) {
  var h = hsl[0] / 360;
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var t2;
  var t3;
  var val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  var t1 = 2 * l - t2;
  var rgb = [0, 0, 0];

  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);

    if (t3 < 0) {
      t3++;
    }

    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val * 255;
  }

  return rgb;
};

conversions.hsl.hsv = function (hsl) {
  var h = hsl[0];
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var smin = s;
  var lmin = Math.max(l, 0.01);
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  var v = (l + s) / 2;
  var sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};

conversions.hsv.rgb = function (hsv) {
  var h = hsv[0] / 60;
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var hi = Math.floor(h) % 6;
  var f = h - Math.floor(h);
  var p = 255 * v * (1 - s);
  var q = 255 * v * (1 - s * f);
  var t = 255 * v * (1 - s * (1 - f));
  v *= 255; // eslint-disable-next-line default-case

  switch (hi) {
    case 0:
      return [v, t, p];

    case 1:
      return [q, v, p];

    case 2:
      return [p, v, t];

    case 3:
      return [p, q, v];

    case 4:
      return [t, p, v];

    case 5:
      return [v, p, q];
  }
};

conversions.hsv.hsl = function (hsv) {
  var h = hsv[0];
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var vmin = Math.max(v, 0.01);
  var sl;
  var l;
  l = (2 - s) * v;
  var lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}; // http://dev.w3.org/csswg/css-color/#hwb-to-rgb


conversions.hwb.rgb = function (hwb) {
  var h = hwb[0] / 360;
  var wh = hwb[1] / 100;
  var bl = hwb[2] / 100;
  var ratio = wh + bl; // wh + bl cant be > 1

  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  var i = Math.floor(6 * h);
  var v = 1 - bl;
  var f = 6 * h - i;

  if ((i & 0x01) !== 0) {
    f = 1 - f;
  }

  var n = wh + f * (v - wh); // linear interpolation

  var r;
  var g;
  var b;

  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;

    case 1:
      r = n;
      g = v;
      b = wh;
      break;

    case 2:
      r = wh;
      g = v;
      b = n;
      break;

    case 3:
      r = wh;
      g = n;
      b = v;
      break;

    case 4:
      r = n;
      g = wh;
      b = v;
      break;

    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }

  return [r * 255, g * 255, b * 255];
};

conversions.cmyk.rgb = function (cmyk) {
  var c = cmyk[0] / 100;
  var m = cmyk[1] / 100;
  var y = cmyk[2] / 100;
  var k = cmyk[3] / 100;
  var r = 1 - Math.min(1, c * (1 - k) + k);
  var g = 1 - Math.min(1, m * (1 - k) + k);
  var b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};

conversions.xyz.rgb = function (xyz) {
  var x = xyz[0] / 100;
  var y = xyz[1] / 100;
  var z = xyz[2] / 100;
  var r;
  var g;
  var b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057; // assume sRGB

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055 : r * 12.92;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055 : g * 12.92;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};

conversions.xyz.lab = function (xyz) {
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  var l = 116 * y - 16;
  var a = 500 * (x - y);
  var b = 200 * (y - z);
  return [l, a, b];
};

conversions.lab.xyz = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var x;
  var y;
  var z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  var y2 = Math.pow(y, 3);
  var x2 = Math.pow(x, 3);
  var z2 = Math.pow(z, 3);
  y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};

conversions.lab.lch = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var h;
  var hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;

  if (h < 0) {
    h += 360;
  }

  var c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};

conversions.lch.lab = function (lch) {
  var l = lch[0];
  var c = lch[1];
  var h = lch[2];
  var hr = h / 360 * 2 * Math.PI;
  var a = c * Math.cos(hr);
  var b = c * Math.sin(hr);
  return [l, a, b];
};

conversions.rgb.ansi16 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2]; // hsv -> ansi16 optimization

  var value = 1 in arguments ? arguments[1] : conversions.rgb.hsv(args)[2];
  value = Math.round(value / 50);

  if (value === 0) {
    return 30;
  }

  var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));

  if (value === 2) {
    ansi += 60;
  }

  return ansi;
};

conversions.hsv.ansi16 = function (args) {
  // optimization here; we already know the value and don't need to get
  // it conversionsed for us.
  return conversions.rgb.ansi16(conversions.hsv.rgb(args), args[2]);
};

conversions.rgb.ansi256 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2]; // we use the extended greyscale palette here, with the exception of
  // black and white. normal palette only has 4 greyscale shades.

  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }

    if (r > 248) {
      return 231;
    }

    return Math.round((r - 8) / 247 * 24) + 232;
  }

  var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};

conversions.ansi16.rgb = function (args) {
  var color = args % 10; // handle greyscale

  if (color === 0 || color === 7) {
    if (args > 50) {
      color += 3.5;
    }

    color = color / 10.5 * 255;
    return [color, color, color];
  }

  var mult = (~~(args > 50) + 1) * 0.5;
  var r = (color & 1) * mult * 255;
  var g = (color >> 1 & 1) * mult * 255;
  var b = (color >> 2 & 1) * mult * 255;
  return [r, g, b];
};

conversions.ansi256.rgb = function (args) {
  // handle greyscale
  if (args >= 232) {
    var c = (args - 232) * 10 + 8;
    return [c, c, c];
  }

  args -= 16;
  var rem;
  var r = Math.floor(args / 36) / 5 * 255;
  var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  var b = rem % 6 / 5 * 255;
  return [r, g, b];
};

conversions.rgb.hex = function (args) {
  var integer = ((Math.round(args[0]) & 0xff) << 16) + ((Math.round(args[1]) & 0xff) << 8) + Number(Math.round(args[2]) & 0xff);
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

conversions.hex.rgb = function (args) {
  var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);

  if (!match) {
    return [0, 0, 0];
  }

  var colorString = match[0];

  if (match[0].length === 3) {
    colorString = colorString.split('').map(function (char) {
      return char + char;
    }).join('');
  }

  var integer = parseInt(colorString, 16);
  var r = integer >> 16 & 0xff;
  var g = integer >> 8 & 0xff;
  var b = integer & 0xff;
  return [r, g, b];
};

conversions.rgb.hcg = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var max = Math.max(Math.max(r, g), b);
  var min = Math.min(Math.min(r, g), b);
  var chroma = max - min;
  var grayscale;
  var hue;

  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }

  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma + 4;
  }

  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale * 100];
};

conversions.hsl.hcg = function (hsl) {
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var c = 1;
  var f = 0;

  if (l < 0.5) {
    c = 2.0 * s * l;
  } else {
    c = 2.0 * s * (1.0 - l);
  }

  if (c < 1.0) {
    f = (l - 0.5 * c) / (1.0 - c);
  }

  return [hsl[0], c * 100, f * 100];
};

conversions.hsv.hcg = function (hsv) {
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var c = s * v;
  var f = 0;

  if (c < 1.0) {
    f = (v - c) / (1 - c);
  }

  return [hsv[0], c * 100, f * 100];
};

conversions.hcg.rgb = function (hcg) {
  var h = hcg[0] / 360;
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;

  if (c === 0.0) {
    return [g * 255, g * 255, g * 255];
  }

  var pure = [0, 0, 0];
  var hi = h % 1 * 6;
  var v = hi % 1;
  var w = 1 - v;
  var mg = 0;

  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;

    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;

    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;

    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;

    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;

    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }

  mg = (1.0 - c) * g;
  return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255];
};

conversions.hcg.hsv = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  var f = 0;

  if (v > 0.0) {
    f = c / v;
  }

  return [hcg[0], f * 100, v * 100];
};

conversions.hcg.hsl = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var l = g * (1.0 - c) + 0.5 * c;
  var s = 0;

  if (l > 0.0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1.0) {
    s = c / (2 * (1 - l));
  }

  return [hcg[0], s * 100, l * 100];
};

conversions.hcg.hwb = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

conversions.hwb.hcg = function (hwb) {
  var w = hwb[1] / 100;
  var b = hwb[2] / 100;
  var v = 1 - b;
  var c = v - w;
  var g = 0;

  if (c < 1) {
    g = (v - c) / (1 - c);
  }

  return [hwb[0], c * 100, g * 100];
};

conversions.apple.rgb = function (apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};

conversions.rgb.apple = function (rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};

conversions.gray.rgb = function (args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

conversions.gray.hsv = function (args) {
  return [0, 0, args[0]];
};

conversions.gray.hsl = conversions.gray.hsv;

conversions.gray.hwb = function (gray) {
  return [0, 100, gray[0]];
};

conversions.gray.cmyk = function (gray) {
  return [0, 0, 0, gray[0]];
};

conversions.gray.lab = function (gray) {
  return [gray[0], 0, 0];
};

conversions.gray.hex = function (gray) {
  var val = Math.round(gray[0] / 100 * 255) & 0xff;
  var integer = (val << 16) + (val << 8) + val;
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

conversions.rgb.gray = function (rgb) {
  var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};

module.exports = conversions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb252ZXJzaW9ucy5qcyJdLCJuYW1lcyI6WyJjc3NLZXl3b3JkcyIsInJlcXVpcmUiLCJyZXZlcnNlS2V5d29yZHMiLCJrZXkiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJjb252ZXJzaW9ucyIsInJnYiIsImNoYW5uZWxzIiwibGFiZWxzIiwiaHNsIiwiaHN2IiwiaHdiIiwiY215ayIsInh5eiIsImxhYiIsImxjaCIsImhleCIsImtleXdvcmQiLCJhbnNpMTYiLCJhbnNpMjU2IiwiaGNnIiwiYXBwbGUiLCJncmF5IiwibW9kZWwiLCJFcnJvciIsImxlbmd0aCIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJyIiwiZyIsImIiLCJtaW4iLCJNYXRoIiwibWF4IiwiZGVsdGEiLCJoIiwicyIsImwiLCJyZGlmIiwiZ2RpZiIsImJkaWYiLCJ2IiwiZGlmZiIsImRpZmZjIiwiYyIsInciLCJrIiwibSIsInkiLCJjb21wYXJhdGl2ZURpc3RhbmNlIiwieCIsInBvdyIsInJldmVyc2VkIiwiY3VycmVudENsb3Nlc3REaXN0YW5jZSIsIkluZmluaXR5IiwiY3VycmVudENsb3Nlc3RLZXl3b3JkIiwiZGlzdGFuY2UiLCJ6IiwiYSIsInQyIiwidDMiLCJ2YWwiLCJ0MSIsImkiLCJzbWluIiwibG1pbiIsInN2IiwiaGkiLCJmbG9vciIsImYiLCJwIiwicSIsInQiLCJ2bWluIiwic2wiLCJ3aCIsImJsIiwicmF0aW8iLCJuIiwieTIiLCJ4MiIsInoyIiwiaHIiLCJhdGFuMiIsIlBJIiwic3FydCIsImNvcyIsInNpbiIsImFyZ3MiLCJhcmd1bWVudHMiLCJyb3VuZCIsImFuc2kiLCJjb2xvciIsIm11bHQiLCJyZW0iLCJpbnRlZ2VyIiwiTnVtYmVyIiwic3RyaW5nIiwidG9TdHJpbmciLCJ0b1VwcGVyQ2FzZSIsInN1YnN0cmluZyIsIm1hdGNoIiwiY29sb3JTdHJpbmciLCJzcGxpdCIsIm1hcCIsImNoYXIiLCJqb2luIiwicGFyc2VJbnQiLCJjaHJvbWEiLCJncmF5c2NhbGUiLCJodWUiLCJwdXJlIiwibWciLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsSUFBTUEsY0FBY0MsUUFBUSxZQUFSLENBQXBCLEMsQ0FFQTtBQUNBO0FBQ0E7OztBQUVBLElBQU1DLGtCQUFrQixFQUF4Qjs7QUFDQSxLQUFLLElBQU1DLEdBQVgsSUFBa0JILFdBQWxCLEVBQStCO0FBQzdCLE1BQUlJLE9BQU9DLFNBQVAsQ0FBaUJDLGNBQWpCLENBQWdDQyxJQUFoQyxDQUFxQ1AsV0FBckMsRUFBa0RHLEdBQWxELENBQUosRUFBNEQ7QUFDMURELG9CQUFnQkYsWUFBWUcsR0FBWixDQUFoQixJQUFvQ0EsR0FBcEM7QUFDRDtBQUNGOztBQUVELElBQU1LLGNBQWM7QUFDbEJDLE9BQUs7QUFBRUMsY0FBVSxDQUFaO0FBQWVDLFlBQVE7QUFBdkIsR0FEYTtBQUVsQkMsT0FBSztBQUFFRixjQUFVLENBQVo7QUFBZUMsWUFBUTtBQUF2QixHQUZhO0FBR2xCRSxPQUFLO0FBQUVILGNBQVUsQ0FBWjtBQUFlQyxZQUFRO0FBQXZCLEdBSGE7QUFJbEJHLE9BQUs7QUFBRUosY0FBVSxDQUFaO0FBQWVDLFlBQVE7QUFBdkIsR0FKYTtBQUtsQkksUUFBTTtBQUFFTCxjQUFVLENBQVo7QUFBZUMsWUFBUTtBQUF2QixHQUxZO0FBTWxCSyxPQUFLO0FBQUVOLGNBQVUsQ0FBWjtBQUFlQyxZQUFRO0FBQXZCLEdBTmE7QUFPbEJNLE9BQUs7QUFBRVAsY0FBVSxDQUFaO0FBQWVDLFlBQVE7QUFBdkIsR0FQYTtBQVFsQk8sT0FBSztBQUFFUixjQUFVLENBQVo7QUFBZUMsWUFBUTtBQUF2QixHQVJhO0FBU2xCUSxPQUFLO0FBQUVULGNBQVUsQ0FBWjtBQUFlQyxZQUFRLENBQUMsS0FBRDtBQUF2QixHQVRhO0FBVWxCUyxXQUFTO0FBQUVWLGNBQVUsQ0FBWjtBQUFlQyxZQUFRLENBQUMsU0FBRDtBQUF2QixHQVZTO0FBV2xCVSxVQUFRO0FB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LElBQWpCLEdBQXdCLFVBQVNVLElBQVQsRUFBZTtBQUNyQyxTQUFPLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVVBLEtBQUssQ0FBTCxDQUFWLENBQVA7QUFDRCxDQUZEOztBQUlBakIsWUFBWWlCLElBQVosQ0FBaUJSLEdBQWpCLEdBQXVCLFVBQVNRLElBQVQsRUFBZTtBQUNwQyxTQUFPLENBQUNBLEtBQUssQ0FBTCxDQUFELEVBQVUsQ0FBVixFQUFhLENBQWIsQ0FBUDtBQUNELENBRkQ7O0FBSUFqQixZQUFZaUIsSUFBWixDQUFpQk4sR0FBakIsR0FBdUIsVUFBU00sSUFBVCxFQUFlO0FBQ3BDLE1BQU11QyxNQUFNN0IsS0FBSzBELEtBQUwsQ0FBWXBFLEtBQUssQ0FBTCxJQUFVLEdBQVgsR0FBa0IsR0FBN0IsSUFBb0MsSUFBaEQ7QUFDQSxNQUFNeUUsVUFBVSxDQUFDbEMsT0FBTyxFQUFSLEtBQWVBLE9BQU8sQ0FBdEIsSUFBMkJBLEdBQTNDO0FBRUEsTUFBTW9DLFNBQVNGLFFBQVFHLFFBQVIsQ0FBaUIsRUFBakIsRUFBcUJDLFdBQXJCLEVBQWY7QUFDQSxTQUFPLFNBQVNDLFNBQVQsQ0FBbUJILE9BQU94RSxNQUExQixJQUFvQ3dFLE1BQTNDO0FBQ0QsQ0FORDs7QUFRQTVGLFlBQVlDLEdBQVosQ0FBZ0JnQixJQUFoQixHQUF1QixVQUFTaEIsR0FBVCxFQUFjO0FBQ25DLE1BQU11RCxNQUFNLENBQUN2RCxJQUFJLENBQUosSUFBU0EsSUFBSSxDQUFKLENBQVQsR0FBa0JBLElBQUksQ0FBSixDQUFuQixJQUE2QixDQUF6QztBQUNBLFNBQU8sQ0FBRXVELE1BQU0sR0FBUCxHQUFjLEdBQWYsQ0FBUDtBQUNELENBSEQ7O0FBS0FvRCxPQUFPQyxPQUFQLEdBQWlCN0csV0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBNSVQgbGljZW5zZSAqL1xuY29uc3QgY3NzS2V5d29yZHMgPSByZXF1aXJlKCdjb2xvci1uYW1lJyk7XG5cbi8vIE5PVEU6IGNvbnZlcnNpb25zIHNob3VsZCBvbmx5IHJldHVybiBwcmltaXRpdmUgdmFsdWVzIChpLmUuIGFycmF5cywgb3Jcbi8vICAgICAgIHZhbHVlcyB0aGF0IGdpdmUgY29ycmVjdCBgdHlwZW9mYCByZXN1bHRzKS5cbi8vICAgICAgIGRvIG5vdCB1c2UgYm94IHZhbHVlcyB0eXBlcyAoaS5lLiBOdW1iZXIoKSwgU3RyaW5nKCksIGV0Yy4pXG5cbmNvbnN0IHJldmVyc2VLZXl3b3JkcyA9IHt9O1xuZm9yIChjb25zdCBrZXkgaW4gY3NzS2V5d29yZHMpIHtcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChjc3NLZXl3b3Jkcywga2V5KSkge1xuICAgIHJldmVyc2VLZXl3b3Jkc1tjc3NLZXl3b3Jkc1trZXldXSA9IGtleTtcbiAgfVxufVxuXG5jb25zdCBjb252ZXJzaW9ucyA9IHtcbiAgcmdiOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6ICdyZ2InIH0sXG4gIGhzbDogeyBjaGFubmVsczogMywgbGFiZWxzOiAnaHNsJyB9LFxuICBoc3Y6IHsgY2hhbm5lbHM6IDMsIGxhYmVsczogJ2hzdicgfSxcbiAgaHdiOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6ICdod2InIH0sXG4gIGNteWs6IHsgY2hhbm5lbHM6IDQsIGxhYmVsczogJ2NteWsnIH0sXG4gIHh5ejogeyBjaGFubmVsczogMywgbGFiZWxzOiAneHl6JyB9LFxuICBsYWI6IHsgY2hhbm5lbHM6IDMsIGxhYmVsczogJ2xhYicgfSxcbiAgbGNoOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6ICdsY2gnIH0sXG4gIGhleDogeyBjaGFubmVsczogMSwgbGFiZWxzOiBbJ2hleCddIH0sXG4gIGtleXdvcmQ6IHsgY2hhbm5lbHM6IDEsIGxhYmVsczogWydrZXl3b3JkJ10gfSxcbiAgYW5zaTE2OiB7IGNoYW5uZWxzOiAxLCBsYWJlbHM6IFsnYW5zaTE2J10gfSxcbiAgYW5zaTI1NjogeyBjaGFubmVsczogMSwgbGFiZWxzOiBbJ2Fuc2kyNTYnXSB9LFxuICBoY2c6IHsgY2hhbm5lbHM6IDMsIGxhYmVsczogWydoJywgJ2MnLCAnZyddIH0sXG4gIGFwcGxlOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6IFsncjE2JywgJ2cxNicsICdiMTYnXSB9LFxuICBncmF5OiB7IGNoYW5uZWxzOiAxLCBsYWJlbHM6IFsnZ3JheSddIH1cbn07XG5cbi8vIGhpZGUgLmNoYW5uZWxzIGFuZCAubGFiZWxzIHByb3BlcnRpZXNcbmZvciAoY29uc3QgbW9kZWwgaW4gY29udmVyc2lvbnMpIHtcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChjb252ZXJzaW9ucywgbW9kZWwpKSB7XG4gICAgaWYgKCEoJ2NoYW5uZWxzJyBpbiBjb252ZXJzaW9uc1ttb2RlbF0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgY2hhbm5lbHMgcHJvcGVydHk6ICcgKyBtb2RlbCk7XG4gICAgfVxuXG4gICAgaWYgKCEoJ2xhYmVscycgaW4gY29udmVyc2lvbnNbbW9kZWxdKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIGNoYW5uZWwgbGFiZWxzIHByb3BlcnR5OiAnICsgbW9kZWwpO1xuICAgIH1cblxuICAgIGlmIChjb252ZXJzaW9uc1ttb2RlbF0ubGFiZWxzLmxlbmd0aCAhPT0gY29udmVyc2lvbnNbbW9kZWxdLmNoYW5uZWxzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NoYW5uZWwgYW5kIGxhYmVsIGNvdW50cyBtaXNtYXRjaDogJyArIG1vZGVsKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGNoYW5uZWxzLCBsYWJlbHMgfSA9IGNvbnZlcnNpb25zW21vZGVsXTtcbiAgICBkZWxldGUgY29udmVyc2lvbnNbbW9kZWxdLmNoYW5uZWxzO1xuICAgIGRlbGV0ZSBjb252ZXJzaW9uc1ttb2RlbF0ubGFiZWxzO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJzaW9uc1ttb2RlbF0sICdjaGFubmVscycsIHsgdmFsdWU6IGNoYW5uZWxzIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJzaW9uc1ttb2RlbF0sICdsYWJlbHMnLCB7IHZhbHVlOiBsYWJlbHMgfSk7XG4gIH1cbn1cblxuY29udmVyc2lvbnMucmdiLmhzbCA9IGZ1bmN0aW9uKHJnYikge1xuICBjb25zdCByID0gcmdiWzBdIC8gMjU1O1xuICBjb25zdCBnID0gcmdiWzFdIC8gMjU1O1xuICBjb25zdCBiID0gcmdiWzJdIC8gMjU1O1xuICBjb25zdCBtaW4gPSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgY29uc3QgbWF4ID0gTWF0aC5tYXgociwgZywgYik7XG4gIGNvbnN0IGRlbHRhID0gbWF4IC0gbWluO1xuICBsZXQgaDtcbiAgbGV0IHM7XG5cbiAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgaCA9IDA7XG4gIH0gZWxzZSBpZiAociA9PT0gbWF4KSB7XG4gICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgfSBlbHNlIGlmIChnID09PSBtYXgpIHtcbiAgICBoID0gMiArIChiIC0gcikgLyBkZWx0YTtcbiAgfSBlbHNlIGlmIChiID09PSBtYXgpIHtcbiAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcbiAgfVxuXG4gIGggPSBNYXRoLm1pbihoICogNjAsIDM2MCk7XG5cbiAgaWYgKGggPCAwKSB7XG4gICAgaCArPSAzNjA7XG4gIH1cblxuICBjb25zdCBsID0gKG1pbiArIG1heCkgLyAyO1xuXG4gIGlmIChtYXggPT09IG1pbikge1xuICAgIHMgPSAwO1xuICB9IGVsc2UgaWYgKGwgPD0gMC41KSB7XG4gICAgcyA9IGRlbHRhIC8gKG1heCArIG1pbik7XG4gIH0gZWxzZSB7XG4gICAgcyA9IGRlbHRhIC8gKDIgLSBtYXggLSBtaW4pO1xuICB9XG5cbiAgcmV0dXJuIFtoLCBzICogMTAwLCBsICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5oc3YgPSBmdW5jdGlvbihyZ2IpIHtcbiAgbGV0IHJkaWY7XG4gIGxldCBnZGlmO1xuICBsZXQgYmRpZjtcbiAgbGV0IGg7XG4gIGxldCBzO1xuXG4gIGNvbnN0IHIgPSByZ2JbMF0gLyAyNTU7XG4gIGNvbnN0IGcgPSByZ2JbMV0gLyAyNTU7XG4gIGNvbnN0IGIgPSByZ2JbMl0gLyAyNTU7XG4gIGNvbnN0IHYgPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgY29uc3QgZGlmZiA9IHYgLSBNYXRoLm1pbihyLCBnLCBiKTtcbiAgY29uc3QgZGlmZmMgPSBmdW5jdGlvbihjKSB7XG4gICAgcmV0dXJuICh2IC0gYykgLyA2IC8gZGlmZiArIDEgLyAyO1xuICB9O1xuXG4gIGlmIChkaWZmID09PSAwKSB7XG4gICAgcyA9IDA7XG4gICAgaCA9IHM7XG4gIH0gZWxzZSB7XG4gICAgcyA9IGRpZmYgLyB2O1xuICAgIHJkaWYgPSBkaWZmYyhyKTtcbiAgICBnZGlmID0gZGlmZmMoZyk7XG4gICAgYmRpZiA9IGRpZmZjKGIpO1xuXG4gICAgaWYgKHIgPT09IHYpIHtcbiAgICAgIGggPSBiZGlmIC0gZ2RpZjtcbiAgICB9IGVsc2UgaWYgKGcgPT09IHYpIHtcbiAgICAgIGggPSAxIC8gMyArIHJkaWYgLSBiZGlmO1xuICAgIH0gZWxzZSBpZiAoYiA9PT0gdikge1xuICAgICAgaCA9IDIgLyAzICsgZ2RpZiAtIHJkaWY7XG4gICAgfVxuICAgIGlmIChoIDwgMCkge1xuICAgICAgaCArPSAxO1xuICAgIH0gZWxzZSBpZiAoaCA+IDEpIHtcbiAgICAgIGggLT0gMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW2ggKiAzNjAsIHMgKiAxMDAsIHYgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMucmdiLmh3YiA9IGZ1bmN0aW9uKHJnYikge1xuICBjb25zdCByID0gcmdiWzBdO1xuICBjb25zdCBnID0gcmdiWzFdO1xuICBsZXQgYiA9IHJnYlsyXTtcbiAgY29uc3QgaCA9IGNvbnZlcnNpb25zLnJnYi5oc2wocmdiKVswXTtcbiAgY29uc3QgdyA9ICgxIC8gMjU1KSAqIE1hdGgubWluKHIsIE1hdGgubWluKGcsIGIpKTtcblxuICBiID0gMSAtICgxIC8gMjU1KSAqIE1hdGgubWF4KHIsIE1hdGgubWF4KGcsIGIpKTtcblxuICByZXR1cm4gW2gsIHcgKiAxMDAsIGIgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMucmdiLmNteWsgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgciA9IHJnYlswXSAvIDI1NTtcbiAgY29uc3QgZyA9IHJnYlsxXSAvIDI1NTtcbiAgY29uc3QgYiA9IHJnYlsyXSAvIDI1NTtcbiAgY29uc3QgayA9IE1hdGgubWluKDEgLSByLCAxIC0gZywgMSAtIGIpO1xuICBjb25zdCBjID0gKDEgLSByIC0gaykgLyAoMSAtIGspIHx8IDA7XG4gIGNvbnN0IG0gPSAoMSAtIGcgLSBrKSAvICgxIC0gaykgfHwgMDtcbiAgY29uc3QgeSA9ICgxIC0gYiAtIGspIC8gKDEgLSBrKSB8fCAwO1xuXG4gIHJldHVybiBbYyAqIDEwMCwgbSAqIDEwMCwgeSAqIDEwMCwgayAqIDEwMF07XG59O1xuXG4vLyBTZWUgaHR0cHM6Ly9lbi5tLndpa2lwZWRpYS5vcmcvd2lraS9FdWNsaWRlYW5fZGlzdGFuY2UjU3F1YXJlZF9FdWNsaWRlYW5fZGlzdGFuY2VcbmZ1bmN0aW9uIGNvbXBhcmF0aXZlRGlzdGFuY2UoeCwgeSkge1xuICByZXR1cm4gKFxuICAgIE1hdGgucG93KHhbMF0gLSB5WzBdLCAyKSArXG4gICAgTWF0aC5wb3coeFsxXSAtIHlbMV0sIDIpICtcbiAgICBNYXRoLnBvdyh4WzJdIC0geVsyXSwgMilcbiAgKTtcbn1cblxuY29udmVyc2lvbnMucmdiLmtleXdvcmQgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgcmV2ZXJzZWQgPSByZXZlcnNlS2V5d29yZHNbcmdiXTtcbiAgaWYgKHJldmVyc2VkKSB7XG4gICAgcmV0dXJuIHJldmVyc2VkO1xuICB9XG5cbiAgbGV0IGN1cnJlbnRDbG9zZXN0RGlzdGFuY2UgPSBJbmZpbml0eTtcbiAgbGV0IGN1cnJlbnRDbG9zZXN0S2V5d29yZDtcblxuICBmb3IgKGNvbnN0IGtleXdvcmQgaW4gY3NzS2V5d29yZHMpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNzc0tleXdvcmRzLCBrZXl3b3JkKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcblxuICAgICAgLy8gQ29tcHV0ZSBjb21wYXJhdGl2ZSBkaXN0YW5jZVxuICAgICAgY29uc3QgZGlzdGFuY2UgPSBjb21wYXJhdGl2ZURpc3RhbmNlKHJnYiwgdmFsdWUpO1xuXG4gICAgICAvLyBDaGVjayBpZiBpdHMgbGVzcywgaWYgc28gc2V0IGFzIGNsb3Nlc3RcbiAgICAgIGlmIChkaXN0YW5jZSA8IGN1cnJlbnRDbG9zZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgY3VycmVudENsb3Nlc3REaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgICBjdXJyZW50Q2xvc2VzdEtleXdvcmQgPSBrZXl3b3JkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjdXJyZW50Q2xvc2VzdEtleXdvcmQ7XG59O1xuXG5jb252ZXJzaW9ucy5rZXl3b3JkLnJnYiA9IGZ1bmN0aW9uKGtleXdvcmQpIHtcbiAgcmV0dXJuIGNzc0tleXdvcmRzW2tleXdvcmRdO1xufTtcblxuY29udmVyc2lvbnMucmdiLnh5eiA9IGZ1bmN0aW9uKHJnYikge1xuICBsZXQgciA9IHJnYlswXSAvIDI1NTtcbiAgbGV0IGcgPSByZ2JbMV0gLyAyNTU7XG4gIGxldCBiID0gcmdiWzJdIC8gMjU1O1xuXG4gIC8vIGFzc3VtZSBzUkdCXG4gIHIgPSByID4gMC4wNDA0NSA/IE1hdGgucG93KChyICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiByIC8gMTIuOTI7XG4gIGcgPSBnID4gMC4wNDA0NSA/IE1hdGgucG93KChnICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiBnIC8gMTIuOTI7XG4gIGIgPSBiID4gMC4wNDA0NSA/IE1hdGgucG93KChiICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiBiIC8gMTIuOTI7XG5cbiAgY29uc3QgeCA9IHIgKiAwLjQxMjQgKyBnICogMC4zNTc2ICsgYiAqIDAuMTgwNTtcbiAgY29uc3QgeSA9IHIgKiAwLjIxMjYgKyBnICogMC43MTUyICsgYiAqIDAuMDcyMjtcbiAgY29uc3QgeiA9IHIgKiAwLjAxOTMgKyBnICogMC4xMTkyICsgYiAqIDAuOTUwNTtcblxuICByZXR1cm4gW3ggKiAxMDAsIHkgKiAxMDAsIHogKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMucmdiLmxhYiA9IGZ1bmN0aW9uKHJnYikge1xuICBjb25zdCB4eXogPSBjb252ZXJzaW9ucy5yZ2IueHl6KHJnYik7XG4gIGxldCB4ID0geHl6WzBdO1xuICBsZXQgeSA9IHh5elsxXTtcbiAgbGV0IHogPSB4eXpbMl07XG5cbiAgeCAvPSA5NS4wNDc7XG4gIHkgLz0gMTAwO1xuICB6IC89IDEwOC44ODM7XG5cbiAgeCA9IHggPiAwLjAwODg1NiA/IE1hdGgucG93KHgsIDEgLyAzKSA6IDcuNzg3ICogeCArIDE2IC8gMTE2O1xuICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMSAvIDMpIDogNy43ODcgKiB5ICsgMTYgLyAxMTY7XG4gIHogPSB6ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh6LCAxIC8gMykgOiA3Ljc4NyAqIHogKyAxNiAvIDExNjtcblxuICBjb25zdCBsID0gMTE2ICogeSAtIDE2O1xuICBjb25zdCBhID0gNTAwICogKHggLSB5KTtcbiAgY29uc3QgYiA9IDIwMCAqICh5IC0geik7XG5cbiAgcmV0dXJuIFtsLCBhLCBiXTtcbn07XG5cbmNvbnZlcnNpb25zLmhzbC5yZ2IgPSBmdW5jdGlvbihoc2wpIHtcbiAgY29uc3QgaCA9IGhzbFswXSAvIDM2MDtcbiAgY29uc3QgcyA9IGhzbFsxXSAvIDEwMDtcbiAgY29uc3QgbCA9IGhzbFsyXSAvIDEwMDtcbiAgbGV0IHQyO1xuICBsZXQgdDM7XG4gIGxldCB2YWw7XG5cbiAgaWYgKHMgPT09IDApIHtcbiAgICB2YWwgPSBsICogMjU1O1xuICAgIHJldHVybiBbdmFsLCB2YWwsIHZhbF07XG4gIH1cblxuICBpZiAobCA8IDAuNSkge1xuICAgIHQyID0gbCAqICgxICsgcyk7XG4gIH0gZWxzZSB7XG4gICAgdDIgPSBsICsgcyAtIGwgKiBzO1xuICB9XG5cbiAgY29uc3QgdDEgPSAyICogbCAtIHQyO1xuXG4gIGNvbnN0IHJnYiA9IFswLCAwLCAwXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICB0MyA9IGggKyAoMSAvIDMpICogLShpIC0gMSk7XG4gICAgaWYgKHQzIDwgMCkge1xuICAgICAgdDMrKztcbiAgICB9XG4gICAgaWYgKHQzID4gMSkge1xuICAgICAgdDMtLTtcbiAgICB9XG5cbiAgICBpZiAoNiAqIHQzIDwgMSkge1xuICAgICAgdmFsID0gdDEgKyAodDIgLSB0MSkgKiA2ICogdDM7XG4gICAgfSBlbHNlIGlmICgyICogdDMgPCAxKSB7XG4gICAgICB2YWwgPSB0MjtcbiAgICB9IGVsc2UgaWYgKDMgKiB0MyA8IDIpIHtcbiAgICAgIHZhbCA9IHQxICsgKHQyIC0gdDEpICogKDIgLyAzIC0gdDMpICogNjtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsID0gdDE7XG4gICAgfVxuXG4gICAgcmdiW2ldID0gdmFsICogMjU1O1xuICB9XG5cbiAgcmV0dXJuIHJnYjtcbn07XG5cbmNvbnZlcnNpb25zLmhzbC5oc3YgPSBmdW5jdGlvbihoc2wpIHtcbiAgY29uc3QgaCA9IGhzbFswXTtcbiAgbGV0IHMgPSBoc2xbMV0gLyAxMDA7XG4gIGxldCBsID0gaHNsWzJdIC8gMTAwO1xuICBsZXQgc21pbiA9IHM7XG4gIGNvbnN0IGxtaW4gPSBNYXRoLm1heChsLCAwLjAxKTtcblxuICBsICo9IDI7XG4gIHMgKj0gbCA8PSAxID8gbCA6IDIgLSBsO1xuICBzbWluICo9IGxtaW4gPD0gMSA/IGxtaW4gOiAyIC0gbG1pbjtcbiAgY29uc3QgdiA9IChsICsgcykgLyAyO1xuICBjb25zdCBzdiA9IGwgPT09IDAgPyAoMiAqIHNtaW4pIC8gKGxtaW4gKyBzbWluKSA6ICgyICogcykgLyAobCArIHMpO1xuXG4gIHJldHVybiBbaCwgc3YgKiAxMDAsIHYgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMuaHN2LnJnYiA9IGZ1bmN0aW9uKGhzdikge1xuICBjb25zdCBoID0gaHN2WzBdIC8gNjA7XG4gIGNvbnN0IHMgPSBoc3ZbMV0gLyAxMDA7XG4gIGxldCB2ID0gaHN2WzJdIC8gMTAwO1xuICBjb25zdCBoaSA9IE1hdGguZmxvb3IoaCkgJSA2O1xuXG4gIGNvbnN0IGYgPSBoIC0gTWF0aC5mbG9vcihoKTtcbiAgY29uc3QgcCA9IDI1NSAqIHYgKiAoMSAtIHMpO1xuICBjb25zdCBxID0gMjU1ICogdiAqICgxIC0gcyAqIGYpO1xuICBjb25zdCB0ID0gMjU1ICogdiAqICgxIC0gcyAqICgxIC0gZikpO1xuICB2ICo9IDI1NTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZGVmYXVsdC1jYXNlXG4gIHN3aXRjaCAoaGkpIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gW3YsIHQsIHBdO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBbcSwgdiwgcF07XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIFtwLCB2LCB0XTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gW3AsIHEsIHZdO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBbdCwgcCwgdl07XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIFt2LCBwLCBxXTtcbiAgfVxufTtcblxuY29udmVyc2lvbnMuaHN2LmhzbCA9IGZ1bmN0aW9uKGhzdikge1xuICBjb25zdCBoID0gaHN2WzBdO1xuICBjb25zdCBzID0gaHN2WzFdIC8gMTAwO1xuICBjb25zdCB2ID0gaHN2WzJdIC8gMTAwO1xuICBjb25zdCB2bWluID0gTWF0aC5tYXgodiwgMC4wMSk7XG4gIGxldCBzbDtcbiAgbGV0IGw7XG5cbiAgbCA9ICgyIC0gcykgKiB2O1xuICBjb25zdCBsbWluID0gKDIgLSBzKSAqIHZtaW47XG4gIHNsID0gcyAqIHZtaW47XG4gIHNsIC89IGxtaW4gPD0gMSA/IGxtaW4gOiAyIC0gbG1pbjtcbiAgc2wgPSBzbCB8fCAwO1xuICBsIC89IDI7XG5cbiAgcmV0dXJuIFtoLCBzbCAqIDEwMCwgbCAqIDEwMF07XG59O1xuXG4vLyBodHRwOi8vZGV2LnczLm9yZy9jc3N3Zy9jc3MtY29sb3IvI2h3Yi10by1yZ2JcbmNvbnZlcnNpb25zLmh3Yi5yZ2IgPSBmdW5jdGlvbihod2IpIHtcbiAgY29uc3QgaCA9IGh3YlswXSAvIDM2MDtcbiAgbGV0IHdoID0gaHdiWzFdIC8gMTAwO1xuICBsZXQgYmwgPSBod2JbMl0gLyAxMDA7XG4gIGNvbnN0IHJhdGlvID0gd2ggKyBibDtcblxuICAvLyB3aCArIGJsIGNhbnQgYmUgPiAxXG4gIGlmIChyYXRpbyA+IDEpIHtcbiAgICB3aCAvPSByYXRpbztcbiAgICBibCAvPSByYXRpbztcbiAgfVxuXG4gIGNvbnN0IGkgPSBNYXRoLmZsb29yKDYgKiBoKTtcbiAgY29uc3QgdiA9IDEgLSBibDtcbiAgbGV0IGYgPSA2ICogaCAtIGk7XG5cbiAgaWYgKChpICYgMHgwMSkgIT09IDApIHtcbiAgICBmID0gMSAtIGY7XG4gIH1cblxuICBjb25zdCBuID0gd2ggKyBmICogKHYgLSB3aCk7IC8vIGxpbmVhciBpbnRlcnBvbGF0aW9uXG5cbiAgbGV0IHI7XG4gIGxldCBnO1xuICBsZXQgYjtcbiAgc3dpdGNoIChpKSB7XG4gICAgZGVmYXVsdDpcbiAgICBjYXNlIDY6XG4gICAgY2FzZSAwOlxuICAgICAgciA9IHY7XG4gICAgICBnID0gbjtcbiAgICAgIGIgPSB3aDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIHIgPSBuO1xuICAgICAgZyA9IHY7XG4gICAgICBiID0gd2g7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICByID0gd2g7XG4gICAgICBnID0gdjtcbiAgICAgIGIgPSBuO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgciA9IHdoO1xuICAgICAgZyA9IG47XG4gICAgICBiID0gdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIHIgPSBuO1xuICAgICAgZyA9IHdoO1xuICAgICAgYiA9IHY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDU6XG4gICAgICByID0gdjtcbiAgICAgIGcgPSB3aDtcbiAgICAgIGIgPSBuO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufTtcblxuY29udmVyc2lvbnMuY215ay5yZ2IgPSBmdW5jdGlvbihjbXlrKSB7XG4gIGNvbnN0IGMgPSBjbXlrWzBdIC8gMTAwO1xuICBjb25zdCBtID0gY215a1sxXSAvIDEwMDtcbiAgY29uc3QgeSA9IGNteWtbMl0gLyAxMDA7XG4gIGNvbnN0IGsgPSBjbXlrWzNdIC8gMTAwO1xuXG4gIGNvbnN0IHIgPSAxIC0gTWF0aC5taW4oMSwgYyAqICgxIC0gaykgKyBrKTtcbiAgY29uc3QgZyA9IDEgLSBNYXRoLm1pbigxLCBtICogKDEgLSBrKSArIGspO1xuICBjb25zdCBiID0gMSAtIE1hdGgubWluKDEsIHkgKiAoMSAtIGspICsgayk7XG5cbiAgcmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn07XG5cbmNvbnZlcnNpb25zLnh5ei5yZ2IgPSBmdW5jdGlvbih4eXopIHtcbiAgY29uc3QgeCA9IHh5elswXSAvIDEwMDtcbiAgY29uc3QgeSA9IHh5elsxXSAvIDEwMDtcbiAgY29uc3QgeiA9IHh5elsyXSAvIDEwMDtcbiAgbGV0IHI7XG4gIGxldCBnO1xuICBsZXQgYjtcblxuICByID0geCAqIDMuMjQwNiArIHkgKiAtMS41MzcyICsgeiAqIC0wLjQ5ODY7XG4gIGcgPSB4ICogLTAuOTY4OSArIHkgKiAxLjg3NTggKyB6ICogMC4wNDE1O1xuICBiID0geCAqIDAuMDU1NyArIHkgKiAtMC4yMDQgKyB6ICogMS4wNTc7XG5cbiAgLy8gYXNzdW1lIHNSR0JcbiAgciA9IHIgPiAwLjAwMzEzMDggPyAxLjA1NSAqIE1hdGgucG93KHIsIDEuMCAvIDIuNCkgLSAwLjA1NSA6IHIgKiAxMi45MjtcblxuICBnID0gZyA+IDAuMDAzMTMwOCA/IDEuMDU1ICogTWF0aC5wb3coZywgMS4wIC8gMi40KSAtIDAuMDU1IDogZyAqIDEyLjkyO1xuXG4gIGIgPSBiID4gMC4wMDMxMzA4ID8gMS4wNTUgKiBNYXRoLnBvdyhiLCAxLjAgLyAyLjQpIC0gMC4wNTUgOiBiICogMTIuOTI7XG5cbiAgciA9IE1hdGgubWluKE1hdGgubWF4KDAsIHIpLCAxKTtcbiAgZyA9IE1hdGgubWluKE1hdGgubWF4KDAsIGcpLCAxKTtcbiAgYiA9IE1hdGgubWluKE1hdGgubWF4KDAsIGIpLCAxKTtcblxuICByZXR1cm4gW3IgKiAyNTUsIGcgKiAyNTUsIGIgKiAyNTVdO1xufTtcblxuY29udmVyc2lvbnMueHl6LmxhYiA9IGZ1bmN0aW9uKHh5eikge1xuICBsZXQgeCA9IHh5elswXTtcbiAgbGV0IHkgPSB4eXpbMV07XG4gIGxldCB6ID0geHl6WzJdO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxIC8gMykgOiA3Ljc4NyAqIHggKyAxNiAvIDExNjtcbiAgeSA9IHkgPiAwLjAwODg1NiA/IE1hdGgucG93KHksIDEgLyAzKSA6IDcuNzg3ICogeSArIDE2IC8gMTE2O1xuICB6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMSAvIDMpIDogNy43ODcgKiB6ICsgMTYgLyAxMTY7XG5cbiAgY29uc3QgbCA9IDExNiAqIHkgLSAxNjtcbiAgY29uc3QgYSA9IDUwMCAqICh4IC0geSk7XG4gIGNvbnN0IGIgPSAyMDAgKiAoeSAtIHopO1xuXG4gIHJldHVybiBbbCwgYSwgYl07XG59O1xuXG5jb252ZXJzaW9ucy5sYWIueHl6ID0gZnVuY3Rpb24obGFiKSB7XG4gIGNvbnN0IGwgPSBsYWJbMF07XG4gIGNvbnN0IGEgPSBsYWJbMV07XG4gIGNvbnN0IGIgPSBsYWJbMl07XG4gIGxldCB4O1xuICBsZXQgeTtcbiAgbGV0IHo7XG5cbiAgeSA9IChsICsgMTYpIC8gMTE2O1xuICB4ID0gYSAvIDUwMCArIHk7XG4gIHogPSB5IC0gYiAvIDIwMDtcblxuICBjb25zdCB5MiA9IE1hdGgucG93KHksIDMpO1xuICBjb25zdCB4MiA9IE1hdGgucG93KHgsIDMpO1xuICBjb25zdCB6MiA9IE1hdGgucG93KHosIDMpO1xuICB5ID0geTIgPiAwLjAwODg1NiA/IHkyIDogKHkgLSAxNiAvIDExNikgLyA3Ljc4NztcbiAgeCA9IHgyID4gMC4wMDg4NTYgPyB4MiA6ICh4IC0gMTYgLyAxMTYpIC8gNy43ODc7XG4gIHogPSB6MiA+IDAuMDA4ODU2ID8gejIgOiAoeiAtIDE2IC8gMTE2KSAvIDcuNzg3O1xuXG4gIHggKj0gOTUuMDQ3O1xuICB5ICo9IDEwMDtcbiAgeiAqPSAxMDguODgzO1xuXG4gIHJldHVybiBbeCwgeSwgel07XG59O1xuXG5jb252ZXJzaW9ucy5sYWIubGNoID0gZnVuY3Rpb24obGFiKSB7XG4gIGNvbnN0IGwgPSBsYWJbMF07XG4gIGNvbnN0IGEgPSBsYWJbMV07XG4gIGNvbnN0IGIgPSBsYWJbMl07XG4gIGxldCBoO1xuXG4gIGNvbnN0IGhyID0gTWF0aC5hdGFuMihiLCBhKTtcbiAgaCA9IChociAqIDM2MCkgLyAyIC8gTWF0aC5QSTtcblxuICBpZiAoaCA8IDApIHtcbiAgICBoICs9IDM2MDtcbiAgfVxuXG4gIGNvbnN0IGMgPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XG5cbiAgcmV0dXJuIFtsLCBjLCBoXTtcbn07XG5cbmNvbnZlcnNpb25zLmxjaC5sYWIgPSBmdW5jdGlvbihsY2gpIHtcbiAgY29uc3QgbCA9IGxjaFswXTtcbiAgY29uc3QgYyA9IGxjaFsxXTtcbiAgY29uc3QgaCA9IGxjaFsyXTtcblxuICBjb25zdCBociA9IChoIC8gMzYwKSAqIDIgKiBNYXRoLlBJO1xuICBjb25zdCBhID0gYyAqIE1hdGguY29zKGhyKTtcbiAgY29uc3QgYiA9IGMgKiBNYXRoLnNpbihocik7XG5cbiAgcmV0dXJuIFtsLCBhLCBiXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5hbnNpMTYgPSBmdW5jdGlvbihhcmdzKSB7XG4gIGNvbnN0IHIgPSBhcmdzWzBdO1xuICBjb25zdCBnID0gYXJnc1sxXTtcbiAgY29uc3QgYiA9IGFyZ3NbMl07XG4gIC8vIGhzdiAtPiBhbnNpMTYgb3B0aW1pemF0aW9uXG4gIGxldCB2YWx1ZSA9IDEgaW4gYXJndW1lbnRzID8gYXJndW1lbnRzWzFdIDogY29udmVyc2lvbnMucmdiLmhzdihhcmdzKVsyXTtcblxuICB2YWx1ZSA9IE1hdGgucm91bmQodmFsdWUgLyA1MCk7XG5cbiAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgcmV0dXJuIDMwO1xuICB9XG5cbiAgbGV0IGFuc2kgPVxuICAgIDMwICtcbiAgICAoKE1hdGgucm91bmQoYiAvIDI1NSkgPDwgMikgfFxuICAgICAgKE1hdGgucm91bmQoZyAvIDI1NSkgPDwgMSkgfFxuICAgICAgTWF0aC5yb3VuZChyIC8gMjU1KSk7XG5cbiAgaWYgKHZhbHVlID09PSAyKSB7XG4gICAgYW5zaSArPSA2MDtcbiAgfVxuXG4gIHJldHVybiBhbnNpO1xufTtcblxuY29udmVyc2lvbnMuaHN2LmFuc2kxNiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgLy8gb3B0aW1pemF0aW9uIGhlcmU7IHdlIGFscmVhZHkga25vdyB0aGUgdmFsdWUgYW5kIGRvbid0IG5lZWQgdG8gZ2V0XG4gIC8vIGl0IGNvbnZlcnNpb25zZWQgZm9yIHVzLlxuICByZXR1cm4gY29udmVyc2lvbnMucmdiLmFuc2kxNihjb252ZXJzaW9ucy5oc3YucmdiKGFyZ3MpLCBhcmdzWzJdKTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5hbnNpMjU2ID0gZnVuY3Rpb24oYXJncykge1xuICBjb25zdCByID0gYXJnc1swXTtcbiAgY29uc3QgZyA9IGFyZ3NbMV07XG4gIGNvbnN0IGIgPSBhcmdzWzJdO1xuXG4gIC8vIHdlIHVzZSB0aGUgZXh0ZW5kZWQgZ3JleXNjYWxlIHBhbGV0dGUgaGVyZSwgd2l0aCB0aGUgZXhjZXB0aW9uIG9mXG4gIC8vIGJsYWNrIGFuZCB3aGl0ZS4gbm9ybWFsIHBhbGV0dGUgb25seSBoYXMgNCBncmV5c2NhbGUgc2hhZGVzLlxuICBpZiAociA9PT0gZyAmJiBnID09PSBiKSB7XG4gICAgaWYgKHIgPCA4KSB7XG4gICAgICByZXR1cm4gMTY7XG4gICAgfVxuXG4gICAgaWYgKHIgPiAyNDgpIHtcbiAgICAgIHJldHVybiAyMzE7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGgucm91bmQoKChyIC0gOCkgLyAyNDcpICogMjQpICsgMjMyO1xuICB9XG5cbiAgY29uc3QgYW5zaSA9XG4gICAgMTYgK1xuICAgIDM2ICogTWF0aC5yb3VuZCgociAvIDI1NSkgKiA1KSArXG4gICAgNiAqIE1hdGgucm91bmQoKGcgLyAyNTUpICogNSkgK1xuICAgIE1hdGgucm91bmQoKGIgLyAyNTUpICogNSk7XG5cbiAgcmV0dXJuIGFuc2k7XG59O1xuXG5jb252ZXJzaW9ucy5hbnNpMTYucmdiID0gZnVuY3Rpb24oYXJncykge1xuICBsZXQgY29sb3IgPSBhcmdzICUgMTA7XG5cbiAgLy8gaGFuZGxlIGdyZXlzY2FsZVxuICBpZiAoY29sb3IgPT09IDAgfHwgY29sb3IgPT09IDcpIHtcbiAgICBpZiAoYXJncyA+IDUwKSB7XG4gICAgICBjb2xvciArPSAzLjU7XG4gICAgfVxuXG4gICAgY29sb3IgPSAoY29sb3IgLyAxMC41KSAqIDI1NTtcblxuICAgIHJldHVybiBbY29sb3IsIGNvbG9yLCBjb2xvcl07XG4gIH1cblxuICBjb25zdCBtdWx0ID0gKH5+KGFyZ3MgPiA1MCkgKyAxKSAqIDAuNTtcbiAgY29uc3QgciA9IChjb2xvciAmIDEpICogbXVsdCAqIDI1NTtcbiAgY29uc3QgZyA9ICgoY29sb3IgPj4gMSkgJiAxKSAqIG11bHQgKiAyNTU7XG4gIGNvbnN0IGIgPSAoKGNvbG9yID4+IDIpICYgMSkgKiBtdWx0ICogMjU1O1xuXG4gIHJldHVybiBbciwgZywgYl07XG59O1xuXG5jb252ZXJzaW9ucy5hbnNpMjU2LnJnYiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgLy8gaGFuZGxlIGdyZXlzY2FsZVxuICBpZiAoYXJncyA+PSAyMzIpIHtcbiAgICBjb25zdCBjID0gKGFyZ3MgLSAyMzIpICogMTAgKyA4O1xuICAgIHJldHVybiBbYywgYywgY107XG4gIH1cblxuICBhcmdzIC09IDE2O1xuXG4gIGxldCByZW07XG4gIGNvbnN0IHIgPSAoTWF0aC5mbG9vcihhcmdzIC8gMzYpIC8gNSkgKiAyNTU7XG4gIGNvbnN0IGcgPSAoTWF0aC5mbG9vcigocmVtID0gYXJncyAlIDM2KSAvIDYpIC8gNSkgKiAyNTU7XG4gIGNvbnN0IGIgPSAoKHJlbSAlIDYpIC8gNSkgKiAyNTU7XG5cbiAgcmV0dXJuIFtyLCBnLCBiXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5oZXggPSBmdW5jdGlvbihhcmdzKSB7XG4gIGNvbnN0IGludGVnZXIgPVxuICAgICgoTWF0aC5yb3VuZChhcmdzWzBdKSAmIDB4ZmYpIDw8IDE2KSArXG4gICAgKChNYXRoLnJvdW5kKGFyZ3NbMV0pICYgMHhmZikgPDwgOCkgK1xuICAgIE51bWJlcihNYXRoLnJvdW5kKGFyZ3NbMl0pICYgMHhmZik7XG4gIGNvbnN0IHN0cmluZyA9IGludGVnZXIudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiAnMDAwMDAwJy5zdWJzdHJpbmcoc3RyaW5nLmxlbmd0aCkgKyBzdHJpbmc7XG59O1xuXG5jb252ZXJzaW9ucy5oZXgucmdiID0gZnVuY3Rpb24oYXJncykge1xuICBjb25zdCBtYXRjaCA9IGFyZ3MudG9TdHJpbmcoMTYpLm1hdGNoKC9bYS1mMC05XXs2fXxbYS1mMC05XXszfS9pKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBbMCwgMCwgMF07XG4gIH1cblxuICBsZXQgY29sb3JTdHJpbmcgPSBtYXRjaFswXTtcblxuICBpZiAobWF0Y2hbMF0ubGVuZ3RoID09PSAzKSB7XG4gICAgY29sb3JTdHJpbmcgPSBjb2xvclN0cmluZ1xuICAgICAgLnNwbGl0KCcnKVxuICAgICAgLm1hcChjaGFyID0+IHtcbiAgICAgICAgcmV0dXJuIGNoYXIgKyBjaGFyO1xuICAgICAgfSlcbiAgICAgIC5qb2luKCcnKTtcbiAgfVxuXG4gIGNvbnN0IGludGVnZXIgPSBwYXJzZUludChjb2xvclN0cmluZywgMTYpO1xuICBjb25zdCByID0gKGludGVnZXIgPj4gMTYpICYgMHhmZjtcbiAgY29uc3QgZyA9IChpbnRlZ2VyID4+IDgpICYgMHhmZjtcbiAgY29uc3QgYiA9IGludGVnZXIgJiAweGZmO1xuXG4gIHJldHVybiBbciwgZywgYl07XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuaGNnID0gZnVuY3Rpb24ocmdiKSB7XG4gIGNvbnN0IHIgPSByZ2JbMF0gLyAyNTU7XG4gIGNvbnN0IGcgPSByZ2JbMV0gLyAyNTU7XG4gIGNvbnN0IGIgPSByZ2JbMl0gLyAyNTU7XG4gIGNvbnN0IG1heCA9IE1hdGgubWF4KE1hdGgubWF4KHIsIGcpLCBiKTtcbiAgY29uc3QgbWluID0gTWF0aC5taW4oTWF0aC5taW4ociwgZyksIGIpO1xuICBjb25zdCBjaHJvbWEgPSBtYXggLSBtaW47XG4gIGxldCBncmF5c2NhbGU7XG4gIGxldCBodWU7XG5cbiAgaWYgKGNocm9tYSA8IDEpIHtcbiAgICBncmF5c2NhbGUgPSBtaW4gLyAoMSAtIGNocm9tYSk7XG4gIH0gZWxzZSB7XG4gICAgZ3JheXNjYWxlID0gMDtcbiAgfVxuXG4gIGlmIChjaHJvbWEgPD0gMCkge1xuICAgIGh1ZSA9IDA7XG4gIH0gZWxzZSBpZiAobWF4ID09PSByKSB7XG4gICAgaHVlID0gKChnIC0gYikgLyBjaHJvbWEpICUgNjtcbiAgfSBlbHNlIGlmIChtYXggPT09IGcpIHtcbiAgICBodWUgPSAyICsgKGIgLSByKSAvIGNocm9tYTtcbiAgfSBlbHNlIHtcbiAgICBodWUgPSA0ICsgKHIgLSBnKSAvIGNocm9tYSArIDQ7XG4gIH1cblxuICBodWUgLz0gNjtcbiAgaHVlICU9IDE7XG5cbiAgcmV0dXJuIFtodWUgKiAzNjAsIGNocm9tYSAqIDEwMCwgZ3JheXNjYWxlICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmhzbC5oY2cgPSBmdW5jdGlvbihoc2wpIHtcbiAgY29uc3QgcyA9IGhzbFsxXSAvIDEwMDtcbiAgY29uc3QgbCA9IGhzbFsyXSAvIDEwMDtcbiAgbGV0IGMgPSAxO1xuICBsZXQgZiA9IDA7XG5cbiAgaWYgKGwgPCAwLjUpIHtcbiAgICBjID0gMi4wICogcyAqIGw7XG4gIH0gZWxzZSB7XG4gICAgYyA9IDIuMCAqIHMgKiAoMS4wIC0gbCk7XG4gIH1cblxuICBpZiAoYyA8IDEuMCkge1xuICAgIGYgPSAobCAtIDAuNSAqIGMpIC8gKDEuMCAtIGMpO1xuICB9XG5cbiAgcmV0dXJuIFtoc2xbMF0sIGMgKiAxMDAsIGYgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMuaHN2LmhjZyA9IGZ1bmN0aW9uKGhzdikge1xuICBjb25zdCBzID0gaHN2WzFdIC8gMTAwO1xuICBjb25zdCB2ID0gaHN2WzJdIC8gMTAwO1xuXG4gIGNvbnN0IGMgPSBzICogdjtcbiAgbGV0IGYgPSAwO1xuXG4gIGlmIChjIDwgMS4wKSB7XG4gICAgZiA9ICh2IC0gYykgLyAoMSAtIGMpO1xuICB9XG5cbiAgcmV0dXJuIFtoc3ZbMF0sIGMgKiAxMDAsIGYgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMuaGNnLnJnYiA9IGZ1bmN0aW9uKGhjZykge1xuICBjb25zdCBoID0gaGNnWzBdIC8gMzYwO1xuICBjb25zdCBjID0gaGNnWzFdIC8gMTAwO1xuICBjb25zdCBnID0gaGNnWzJdIC8gMTAwO1xuXG4gIGlmIChjID09PSAwLjApIHtcbiAgICByZXR1cm4gW2cgKiAyNTUsIGcgKiAyNTUsIGcgKiAyNTVdO1xuICB9XG5cbiAgY29uc3QgcHVyZSA9IFswLCAwLCAwXTtcbiAgY29uc3QgaGkgPSAoaCAlIDEpICogNjtcbiAgY29uc3QgdiA9IGhpICUgMTtcbiAgY29uc3QgdyA9IDEgLSB2O1xuICBsZXQgbWcgPSAwO1xuXG4gIHN3aXRjaCAoTWF0aC5mbG9vcihoaSkpIHtcbiAgICBjYXNlIDA6XG4gICAgICBwdXJlWzBdID0gMTtcbiAgICAgIHB1cmVbMV0gPSB2O1xuICAgICAgcHVyZVsyXSA9IDA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDE6XG4gICAgICBwdXJlWzBdID0gdztcbiAgICAgIHB1cmVbMV0gPSAxO1xuICAgICAgcHVyZVsyXSA9IDA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICBwdXJlWzBdID0gMDtcbiAgICAgIHB1cmVbMV0gPSAxO1xuICAgICAgcHVyZVsyXSA9IHY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBwdXJlWzBdID0gMDtcbiAgICAgIHB1cmVbMV0gPSB3O1xuICAgICAgcHVyZVsyXSA9IDE7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICBwdXJlWzBdID0gdjtcbiAgICAgIHB1cmVbMV0gPSAwO1xuICAgICAgcHVyZVsyXSA9IDE7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcHVyZVswXSA9IDE7XG4gICAgICBwdXJlWzFdID0gMDtcbiAgICAgIHB1cmVbMl0gPSB3O1xuICB9XG5cbiAgbWcgPSAoMS4wIC0gYykgKiBnO1xuXG4gIHJldHVybiBbXG4gICAgKGMgKiBwdXJlWzBdICsgbWcpICogMjU1LFxuICAgIChjICogcHVyZVsxXSArIG1nKSAqIDI1NSxcbiAgICAoYyAqIHB1cmVbMl0gKyBtZykgKiAyNTVcbiAgXTtcbn07XG5cbmNvbnZlcnNpb25zLmhjZy5oc3YgPSBmdW5jdGlvbihoY2cpIHtcbiAgY29uc3QgYyA9IGhjZ1sxXSAvIDEwMDtcbiAgY29uc3QgZyA9IGhjZ1syXSAvIDEwMDtcblxuICBjb25zdCB2ID0gYyArIGcgKiAoMS4wIC0gYyk7XG4gIGxldCBmID0gMDtcblxuICBpZiAodiA+IDAuMCkge1xuICAgIGYgPSBjIC8gdjtcbiAgfVxuXG4gIHJldHVybiBbaGNnWzBdLCBmICogMTAwLCB2ICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmhjZy5oc2wgPSBmdW5jdGlvbihoY2cpIHtcbiAgY29uc3QgYyA9IGhjZ1sxXSAvIDEwMDtcbiAgY29uc3QgZyA9IGhjZ1syXSAvIDEwMDtcblxuICBjb25zdCBsID0gZyAqICgxLjAgLSBjKSArIDAuNSAqIGM7XG4gIGxldCBzID0gMDtcblxuICBpZiAobCA+IDAuMCAmJiBsIDwgMC41KSB7XG4gICAgcyA9IGMgLyAoMiAqIGwpO1xuICB9IGVsc2UgaWYgKGwgPj0gMC41ICYmIGwgPCAxLjApIHtcbiAgICBzID0gYyAvICgyICogKDEgLSBsKSk7XG4gIH1cblxuICByZXR1cm4gW2hjZ1swXSwgcyAqIDEwMCwgbCAqIDEwMF07XG59O1xuXG5jb252ZXJzaW9ucy5oY2cuaHdiID0gZnVuY3Rpb24oaGNnKSB7XG4gIGNvbnN0IGMgPSBoY2dbMV0gLyAxMDA7XG4gIGNvbnN0IGcgPSBoY2dbMl0gLyAxMDA7XG4gIGNvbnN0IHYgPSBjICsgZyAqICgxLjAgLSBjKTtcbiAgcmV0dXJuIFtoY2dbMF0sICh2IC0gYykgKiAxMDAsICgxIC0gdikgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMuaHdiLmhjZyA9IGZ1bmN0aW9uKGh3Yikge1xuICBjb25zdCB3ID0gaHdiWzFdIC8gMTAwO1xuICBjb25zdCBiID0gaHdiWzJdIC8gMTAwO1xuICBjb25zdCB2ID0gMSAtIGI7XG4gIGNvbnN0IGMgPSB2IC0gdztcbiAgbGV0IGcgPSAwO1xuXG4gIGlmIChjIDwgMSkge1xuICAgIGcgPSAodiAtIGMpIC8gKDEgLSBjKTtcbiAgfVxuXG4gIHJldHVybiBbaHdiWzBdLCBjICogMTAwLCBnICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmFwcGxlLnJnYiA9IGZ1bmN0aW9uKGFwcGxlKSB7XG4gIHJldHVybiBbXG4gICAgKGFwcGxlWzBdIC8gNjU1MzUpICogMjU1LFxuICAgIChhcHBsZVsxXSAvIDY1NTM1KSAqIDI1NSxcbiAgICAoYXBwbGVbMl0gLyA2NTUzNSkgKiAyNTVcbiAgXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5hcHBsZSA9IGZ1bmN0aW9uKHJnYikge1xuICByZXR1cm4gW1xuICAgIChyZ2JbMF0gLyAyNTUpICogNjU1MzUsXG4gICAgKHJnYlsxXSAvIDI1NSkgKiA2NTUzNSxcbiAgICAocmdiWzJdIC8gMjU1KSAqIDY1NTM1XG4gIF07XG59O1xuXG5jb252ZXJzaW9ucy5ncmF5LnJnYiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgcmV0dXJuIFsoYXJnc1swXSAvIDEwMCkgKiAyNTUsIChhcmdzWzBdIC8gMTAwKSAqIDI1NSwgKGFyZ3NbMF0gLyAxMDApICogMjU1XTtcbn07XG5cbmNvbnZlcnNpb25zLmdyYXkuaHN2ID0gZnVuY3Rpb24oYXJncykge1xuICByZXR1cm4gWzAsIDAsIGFyZ3NbMF1dO1xufTtcbmNvbnZlcnNpb25zLmdyYXkuaHNsID0gY29udmVyc2lvbnMuZ3JheS5oc3Y7XG5cbmNvbnZlcnNpb25zLmdyYXkuaHdiID0gZnVuY3Rpb24oZ3JheSkge1xuICByZXR1cm4gWzAsIDEwMCwgZ3JheVswXV07XG59O1xuXG5jb252ZXJzaW9ucy5ncmF5LmNteWsgPSBmdW5jdGlvbihncmF5KSB7XG4gIHJldHVybiBbMCwgMCwgMCwgZ3JheVswXV07XG59O1xuXG5jb252ZXJzaW9ucy5ncmF5LmxhYiA9IGZ1bmN0aW9uKGdyYXkpIHtcbiAgcmV0dXJuIFtncmF5WzBdLCAwLCAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmdyYXkuaGV4ID0gZnVuY3Rpb24oZ3JheSkge1xuICBjb25zdCB2YWwgPSBNYXRoLnJvdW5kKChncmF5WzBdIC8gMTAwKSAqIDI1NSkgJiAweGZmO1xuICBjb25zdCBpbnRlZ2VyID0gKHZhbCA8PCAxNikgKyAodmFsIDw8IDgpICsgdmFsO1xuXG4gIGNvbnN0IHN0cmluZyA9IGludGVnZXIudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiAnMDAwMDAwJy5zdWJzdHJpbmcoc3RyaW5nLmxlbmd0aCkgKyBzdHJpbmc7XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuZ3JheSA9IGZ1bmN0aW9uKHJnYikge1xuICBjb25zdCB2YWwgPSAocmdiWzBdICsgcmdiWzFdICsgcmdiWzJdKSAvIDM7XG4gIHJldHVybiBbKHZhbCAvIDI1NSkgKiAxMDBdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb252ZXJzaW9ucztcbiJdfQ==
