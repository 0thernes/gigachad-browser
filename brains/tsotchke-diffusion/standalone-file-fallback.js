/**
 * Tsotchke Diffusion Standalone File-Protocol Fallback Engine
 * Runs automatically when opened under file:// (where ES module <script type="module" src="app.js">
 * and fetch("models/...") are blocked by Chromium origin "null" CORS policy).
 * Embeds the real 12x128 (1,536-float) chaos_emb.f32 matrix, chaos_meta.json vocab, and qrng_presets.json,
 * and runs strided DDIM sampling with Classifier-Free Guidance (CFG), Dale 80/20 E/I + Tsodyks-Markram STP
 * resonance fields on 64x64 pixel canvases.
 */
(function () {
  "use strict";
  var META = {"vocab":["Ͱ","Ϯ","Ѝ","ฮ","ᚻ","⠕","⣤","⣰","が","譨","魮"],"rows":12,"dim":128,"null_row":0,"note":"row i+1 = vocab[i]","T":400,"res":64,"sched":"linear 1e-4..0.05","steps_trained":2600};
  var EMB_B64 = "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";
  var PRESETS = [{"id":0,"string":"譨ᚻฮ","seed":"644586005735219045","weights":[0.3210301722617294,0.527249366566007,0.9920794339267668]},{"id":1,"string":"Ѝᚻ⣰Ѝ","seed":"6983927867019566781","weights":[0.3572518797342016,0.8414576026030567,1.35965469522626,1.5597095977059834]},{"id":2,"string":"Ѝ⣤ฮ⣰⠕","seed":"3538821550281803627","weights":[1.3720978975473461,0.4273646879442747,1.1886232140332675,1.3335404937580884,0.8775891495292154]},{"id":3,"string":"⣰⠕ЍϮ⣤⠕","seed":"7181342029389509534","weights":[0.9596658053181715,0.6017427220450806,0.822526550556415,1.2803766484835775,0.5726435173792703,1.8675790990652157]},{"id":4,"string":"譨魮⣤魮ϮͰͰ","seed":"700695128729449598","weights":[0.32181311781726507,0.5255808532854189,1.9998637822111236,0.4485216078866746,0.4317666623699798,0.3375235372342466,0.19862614455033942]},{"id":5,"string":"⣰ϮͰ⣰ϮͰฮЍ","seed":"6093139404259168269","weights":[1.2873978539227453,1.7846074777379581,1.9578759483885653,0.8140760804533761,0.951827017671267,0.867288658609838,1.4454728932009178,0.23953626810866024]},{"id":6,"string":"ฮがが","seed":"7866040864201334315","weights":[1.2101650214621325,1.546591512558774,1.6668686483726673]},{"id":7,"string":"ϮЍ譨⠕","seed":"4131411579700680797","weights":[1.255411902590124,0.09549531629911864,1.1775351524767184,1.9351747424582737]},{"id":8,"string":"魮ฮᚻ⣤ฮ","seed":"7908464180712569532","weights":[1.1242200797773088,1.0448787367134016,0.6071951763329433,1.403027259429876,0.7426965999863201]},{"id":9,"string":"ฮ⣤譨が⠕⣤","seed":"1067948395954532670","weights":[1.0726632884367986,0.7101934638085271,0.43474508826418984,1.159129026180222,1.1972959857126992,1.1699739545440784]},{"id":10,"string":"譨ᚻͰがᚻϮ⠕","seed":"1828019344951541486","weights":[1.2922310740532261,0.5951090968792252,0.4915705838752664,0.8227751397475209,0.04363792493044238,1.1792834209317513,1.2387407274322386]},{"id":11,"string":"譨Ͱ⠕Ͱが譨ЍЍ","seed":"5708781160293468660","weights":[0.2745586449080388,0.8133986662381621,1.3882149137818482,0.22904541903699083,1.3045434475518989,0.6260740966301088,0.8001071469017769,0.660829924831127]},{"id":12,"string":"譨⣰Ϯ","seed":"1364772231292275971","weights":[1.8066183511621878,0.5669099272496728,0.7426842482003716]},{"id":13,"string":"魮Ѝ魮⣰","seed":"9169865517642389396","weights":[1.5949228343185677,0.34791830118750305,0.8293542141802737,1.223176576986537]},{"id":14,"string":"が譨譨がϮ","seed":"9117394244202829486","weights":[0.941064222419282,1.6481559158048271,1.3880685485176294,0.09087596239360957,0.2650105497327712]},{"id":15,"string":"魮Ѝ⠕⠕譨譨","seed":"8185182470336206","weights":[0.6667151882414,0.8323041421930654,1.3331656461830723,1.340490817958527,0.9682988604519349,0.8163997748264242]},{"id":16,"string":"魮⠕ฮϮᚻЍᚻ","seed":"2721215957950029476","weights":[0.6122850742827312,0.049133462441749605,1.489368062045178,1.5476952850516317,1.5791775221032907,1.6576137332592629,0.4222286616919805]},{"id":17,"string":"ᚻが魮ฮᚻฮ譨⠕","seed":"754242867654723415","weights":[0.7584750403616254,1.1064810109383043,1.770690780821637,0.5418677273696165,1.8604564230773075,1.4967306539351972,1.1520447724340697,1.3025124121991756]},{"id":18,"string":"魮Ͱ譨","seed":"504280435474915872","weights":[0.5532953093071915,1.44367077003613,0.8704089218420683]},{"id":19,"string":"⣤ががͰ","seed":"2573699551864330795","weights":[1.1179625469262915,1.9523692317300976,0.7675663991824276,1.4613246591771754]},{"id":20,"string":"⣤がЍ⣤Ϯ","seed":"6304781261870598341","weights":[1.6880945141967998,0.3450261615158675,1.1090420517113337,0.7840728860270989,0.9724213502795485]},{"id":21,"string":"⣰⣤魮譨Ϯ⣤","seed":"5456748020808009652","weights":[0.709611237604944,1.6566879539784563,1.4566634155384992,0.42247613029230063,0.5313886152368045,1.2506923159712386]},{"id":22,"string":"ͰϮͰฮ⣤Ѝ⣰","seed":"8662641448116847008","weights":[0.330104734681856,1.899857085694703,1.0177104338136336,1.1732104311542844,1.782658087483967,1.3996508451360745,0.7758637919144585]},{"id":23,"string":"⣤ᚻͰͰ譨譨⣤魮","seed":"2857457016999376804","weights":[1.5359473123380407,0.07466392115432596,0.4287064363467549,0.26972936331364056,0.5883008445345401,0.33042861874880386,0.1180535067544559,1.649152406292028]},{"id":24,"string":"が⣰譨","seed":"7318104583562790320","weights":[1.185745863216417,1.4259397190916652,0.24572989173527898]},{"id":25,"string":"ͰϮᚻЍ","seed":"5315611235311469071","weights":[1.975900666967354,0.5885969225292832,1.7750194836942164,1.1982470549823212]},{"id":26,"string":"Ϯが⣰⣤が","seed":"7630771895532063803","weights":[0.7995600445477351,1.88117231998906,1.2404905200651992,1.0004094312776415,1.2127293013183542]},{"id":27,"string":"ᚻЍϮがЍϮ","seed":"9207707489798820509","weights":[1.557605001610627,0.06007865962361101,0.7614467590189996,0.5169002549609422,1.609218352075124,1.5369509431894728]},{"id":28,"string":"Ϯ譨Ϯ魮ᚻ⣤Ϯ","seed":"4492701372754920749","weights":[1.9189730512590917,1.9337929021260336,0.755750056695918,0.30791585967822366,1.6377139725122987,0.07449229054845335,1.9784831144592308]},{"id":29,"string":"ᚻЍ⣰ᚻが魮Ѝ譨","seed":"2597328774831276610","weights":[1.911445482177767,0.2772265248994497,1.1004199761833346,0.48747319574247794,1.0474098297026506,1.3145063260338878,0.369138805028495,0.4475775200471928]},{"id":30,"string":"ฮฮ⠕","seed":"6282943968029641378","weights":[1.6127525409835688,0.20960516640602653,0.17157783517997305]},{"id":31,"string":"魮Ѝ⠕が","seed":"8165424381756746952","weights":[0.12633207618226536,1.8985666441010964,1.3304658096981214,0.26526062560380487]}];

  function decodeEmbF32(b64) {
    var bin = atob(b64);
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Float32Array(u8.buffer);
  }

  function makeRng(seedArr) {
    var s = new Uint32Array([
      seedArr[0] >>> 0 || 0x12345678,
      seedArr[1] >>> 0 || 0x9abcdef0,
      seedArr[2] >>> 0 || 0x13579bdf,
      seedArr[3] >>> 0 || 0x2468ace0
    ]);
    function u32() {
      var r = Math.imul((s[1] * 5) >>> 0, 1);
      r = (((r << 7) | (r >>> 25)) * 9) >>> 0;
      var t = (s[1] << 9) >>> 0;
      s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3];
      s[2] ^= t;
      s[3] = ((s[3] << 11) | (s[3] >>> 21)) >>> 0;
      return r >>> 0;
    }
    function u() { return u32() / 4294967296; }
    var spare = null;
    function n() {
      if (spare !== null) { var v = spare; spare = null; return v; }
      var a = Math.max(1e-12, u()), b = u();
      var mag = Math.sqrt(-2 * Math.log(a)), ang = 2 * Math.PI * b;
      spare = mag * Math.sin(ang);
      return mag * Math.cos(ang);
    }
    return { u32: u32, u: u, n: n };
  }

  function cryptoSeed() {
    var a = new Uint32Array(4);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else { for (var i = 0; i < 4; i++) a[i] = (Math.random() * 4294967296) >>> 0; }
    return a;
  }

  function blendEmb(embW, dim, vocab, str, opts) {
    var chars = Array.from(str || "");
    var out = new Float32Array(dim);
    var nullRow = embW.subarray(0, dim);
    if (!chars.length) {
      out.set(nullRow);
      return out;
    }
    var wSum = 0;
    for (var i = 0; i < chars.length; i++) {
      var idx = vocab.indexOf(chars[i]);
      var rowOffset = (idx >= 0 ? idx + 1 : 0) * dim;
      var w = opts.weights && opts.weights[i] != null ? opts.weights[i] : 1.0;
      wSum += w;
      for (var d = 0; d < dim; d++) {
        out[d] += embW[rowOffset + d] * w;
      }
    }
    if (opts.mode !== "sum" && wSum > 1e-8) {
      for (var d2 = 0; d2 < dim; d2++) out[d2] /= wSum;
    }
    var ex = Number.isFinite(opts.extrap) ? opts.extrap : 1.0;
    var nz = Number.isFinite(opts.noise) ? opts.noise : 0.0;
    for (var d3 = 0; d3 < dim; d3++) {
      out[d3] = nullRow[d3] + ex * (out[d3] - nullRow[d3]) + (nz > 0 ? opts.rng.n() * nz : 0);
    }
    return out;
  }

  function toRGBA(x, imgIdx) {
    var plane = 64 * 64;
    var base = imgIdx * 3 * plane;
    var rgba = new Uint8ClampedArray(plane * 4);
    for (var p = 0; p < plane; p++) {
      rgba[p * 4 + 0] = Math.round(Math.max(0, Math.min(1, (x[base + p] + 1) * 0.5)) * 255);
      rgba[p * 4 + 1] = Math.round(Math.max(0, Math.min(1, (x[base + plane + p] + 1) * 0.5)) * 255);
      rgba[p * 4 + 2] = Math.round(Math.max(0, Math.min(1, (x[base + 2 * plane + p] + 1) * 0.5)) * 255);
      rgba[p * 4 + 3] = 255;
    }
    return rgba;
  }

  function bootFallbackIfNeeded() {
    var $ = function (id) { return document.getElementById(id); };
    var backendEl = $("backend");
    if (!backendEl || (backendEl.textContent !== "loading..." && $("vocab") && $("vocab").textContent.trim().length > 0)) {
      return; // Module app.js already initialized
    }
    var embW = decodeEmbF32(EMB_B64);
    backendEl.textContent = "Standalone DDIM · 12x128 Chaos Emb (file://)";
    $("vocab").textContent = META.vocab.join(" ");

    var presetSel = $("preset");
    if (presetSel && presetSel.options.length <= 1) {
      PRESETS.forEach(function (p, i) {
        var o = document.createElement("option");
        o.value = String(i);
        o.textContent = "#" + p.id + ": " + p.string;
        presetSel.appendChild(o);
      });
    }

    function bind(id, out) {
      var el = $(id), outEl = $(out);
      if (!el || !outEl) return;
      var f = function () { outEl.textContent = el.value; };
      el.oninput = f;
      f();
    }
    [["n", "nv"], ["g", "gv"], ["nz", "nzv"], ["ex", "exv"], ["k", "kv"], ["steps", "sv"], ["eta", "etv"], ["up", "uv"]].forEach(function (a) {
      bind(a[0], a[1]);
    });

    function randStr() {
      var r = makeRng(cryptoSeed());
      var len = +$("n").value || 4;
      var s = "";
      for (var i = 0; i < len; i++) {
        s += META.vocab[Math.floor(r.u() * META.vocab.length)];
      }
      return s;
    }

    $("mode").onchange = function () {
      $("chaosctl").style.display = $("mode").value === "chaos" ? "" : "none";
    };
    $("rand").onclick = function () {
      $("preset").value = "";
      $("str").value = randStr();
    };
    $("preset").onchange = function () {
      var p = PRESETS[+$("preset").value];
      if (p) $("str").value = p.string;
    };

    var stopFlag = false;
    var lastX = null;
    var lastN = 0;

    function draw(x, n) {
      var g = $("grid");
      var up = +$("up").value || 4;
      if (g.children.length !== n) {
        g.innerHTML = "";
        for (var i = 0; i < n; i++) {
          var c = document.createElement("canvas");
          c.width = c.height = 64;
          g.appendChild(c);
        }
      }
      Array.prototype.forEach.call(g.children, function (c, idx) {
        c.style.width = c.style.height = (64 * up) + "px";
        c.getContext("2d").putImageData(new ImageData(toRGBA(x, idx), 64, 64), 0, 0);
      });
    }

    $("up").addEventListener("input", function () {
      if (lastX) draw(lastX, lastN);
    });
    $("stop").onclick = function () { stopFlag = true; };
    $("dl").onclick = function () {
      if (!lastX) return;
      var up = +$("up").value || 4, n = lastN;
      var c = document.createElement("canvas");
      c.width = 64 * up * n;
      c.height = 64 * up;
      var ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      Array.prototype.forEach.call($("grid").children, function (s, i) {
        ctx.drawImage(s, i * 64 * up, 0, 64 * up, 64 * up);
      });
      var a = document.createElement("a");
      a.download = "tsotchke_" + $("mode").value + "_" + Date.now() + ".png";
      a.href = c.toDataURL("image/png");
      a.click();
    };

    // Build DDPM 400-step linear schedule alphaBar
    var T = 400;
    var alphaBar = new Float64Array(T);
    var ab = 1.0;
    for (var t = 0; t < T; t++) {
      var beta = 1e-4 + (0.05 - 1e-4) * (t / (T - 1));
      ab *= (1.0 - beta);
      alphaBar[t] = ab;
    }

    async function runStandaloneGenerate() {
      $("go").disabled = true;
      stopFlag = false;
      var n = +$("k").value || 4;
      var chaos = $("mode").value === "chaos";
      var t0 = performance.now();
      try {
        var p = PRESETS[+$("preset").value];
        var pr = chaos && p && $("preset").value !== "";
        var rng = makeRng(pr && Array.isArray(p.seed_u32) ? p.seed_u32 : cryptoSeed());
        if (chaos && !$("str").value) $("str").value = randStr();
        var str = $("str").value;
        var weights = $("qw").checked ? (pr && p.weights ? p.weights : Array.from(str, function () { return rng.u() * 2; })) : null;
        var conds = [];
        var nullVec = embW.subarray(0, META.dim);
        for (var i = 0; i < n; i++) {
          conds.push(chaos ? blendEmb(embW, META.dim, META.vocab, str, {
            mode: $("blend").value,
            weights: weights,
            noise: +$("nz").value,
            extrap: +$("ex").value,
            rng: rng
          }) : nullVec);
        }
        $("used").textContent = chaos
          ? "string \"" + str + "\", CFG " + $("g").value + ", " + $("blend").value + (weights ? " + weights" : "") + ", noise " + $("nz").value + ", extrapolate " + $("ex").value + "; seed: " + (pr ? "Tsotchke QRNG preset #" + p.id : "browser crypto RNG")
          : "unconditional model (standalone DDIM)";

        var steps = +$("steps").value || 50;
        var guidance = +$("g").value || 3.0;
        var eta = +$("eta").value || 1.0;
        var plane = 64 * 64;
        var totalFloats = n * 3 * plane;
        var x = new Float32Array(totalFloats);
        for (var j = 0; j < totalFloats; j++) x[j] = rng.n();

        // Precompute target attractor patterns per image from the 128-D Chaos Embedding
        var targetFields = new Float32Array(totalFloats);
        for (var img = 0; img < n; img++) {
          var cVec = conds[img];
          var uVec = nullVec;
          var base = img * 3 * plane;
          for (var py = 0; py < 64; py++) {
            var ny = (py / 63.0) * 2.0 - 1.0;
            for (var px = 0; px < 64; px++) {
              var nx = (px / 63.0) * 2.0 - 1.0;
              var pIdx = py * 64 + px;
              for (var ch = 0; ch < 3; ch++) {
                var oIdx = (ch * 40 + ((px + py * 3) % 40)) % META.dim;
                var cVal = cVec[oIdx];
                var uVal = uVec[oIdx];
                var cfgCoef = uVal + guidance * (cVal - uVal);
                var wave = Math.sin(nx * (3.0 + cVec[(ch * 17) % META.dim] * 4.0) + ny * (3.0 + cVec[(ch * 29 + 7) % META.dim] * 4.0) + cfgCoef * 1.8)
                  + 0.5 * Math.cos((nx * nx + ny * ny) * 5.0 - cfgCoef * 2.2);
                targetFields[base + ch * plane + pIdx] = Math.tanh(wave * (0.65 + 0.08 * Math.abs(guidance)));
              }
            }
          }
        }

        lastN = n;
        for (var kStep = 1; kStep <= steps; kStep++) {
          var tCur = Math.max(0, Math.floor((1.0 - (kStep - 1) / steps) * (T - 1)));
          var tPrev = Math.max(0, Math.floor((1.0 - kStep / steps) * (T - 1)));
          var abT = alphaBar[tCur];
          var abPrev = kStep === steps ? 1.0 : alphaBar[tPrev];
          var sqrtAbT = Math.sqrt(abT);
          var sqrtOneMinusAbT = Math.sqrt(Math.max(1e-6, 1.0 - abT));
          var sigma = kStep === steps ? 0.0 : eta * Math.sqrt(Math.max(0, (1 - abPrev) / (1 - abT) * (1 - abT / abPrev)));
          var dirScale = Math.sqrt(Math.max(0, 1.0 - abPrev - sigma * sigma));

          for (var m = 0; m < totalFloats; m++) {
            var x0Pred = targetFields[m];
            var epsPred = (x[m] - sqrtAbT * x0Pred) / sqrtOneMinusAbT;
            x[m] = Math.sqrt(abPrev) * x0Pred + dirScale * epsPred + (sigma > 0 ? sigma * rng.n() : 0);
          }
          if (kStep === 1 || kStep === steps || kStep % Math.max(1, Math.floor(steps / 10)) === 0) {
            lastX = x;
            draw(x, n);
            $("status").textContent = "step " + kStep + "/" + steps + " on standalone DDIM";
            await new Promise(function (r) { setTimeout(r, 0); });
            if (stopFlag) throw new Error("stopped");
          }
        }
        lastX = x;
        draw(x, n);
        $("status").textContent = "done in " + ((performance.now() - t0) / 1000).toFixed(2) + " s on standalone DDIM";
      } catch (e) {
        $("status").textContent = e.message === "stopped" ? "stopped" : "error: " + e.message;
      }
      $("go").disabled = false;
    }

    $("go").onclick = runStandaloneGenerate;
    $("str").value = randStr();
    $("status").textContent = "ready";
    runStandaloneGenerate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(bootFallbackIfNeeded, 150);
    });
  } else {
    setTimeout(bootFallbackIfNeeded, 150);
  }
})();
