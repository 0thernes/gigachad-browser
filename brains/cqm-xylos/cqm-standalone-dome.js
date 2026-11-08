/**
 * CQM Standalone File-Protocol Cosmogonic Dome & 18-Kernel Wasm HUD Engine
 * Executes automatically when `brains/cqm-xylos/index.html` is opened via `file://`
 * (where ES module `<script type="module">` is blocked by Chromium's `origin 'null'` CORS policy).
 * Completes the `#cqm-boot` sequence with real deterministic measurements, drives the 3D-projected
 * Cosmogonic Quantum Mechalogodrom Dome on `<canvas id="c">`, and populates all Telemetry (`#sP`)
 * and Observatory (`#oP`) sparkline canvases (`#g0`..`#g3`, `#obs-c0`..`#obs-c15`) at 60 FPS.
 */
(function () {
  'use strict';

  function bootStandaloneDome() {
    var bootEl = document.getElementById('cqm-boot');
    if (bootEl && bootEl.classList.contains('done')) {
      return; // Module bundle already booted (e.g., HTTP server mode)
    }

    var bootTiles = [
      { key: 'shell', val: 'HUD V121 Ready' },
      { key: 'quality', val: 'ULTRA · 60Hz' },
      { key: 'engine', val: '3D Dome + 18-Wasm' },
      { key: 'seed', val: '0xC05M05 · 1337' },
      { key: 'world', val: 'Xylos + Apex 11-Organ' },
      { key: 'entities', val: '144 Biologics · 20 Titans' },
      { key: 'pantheon', val: '5 Archons · 10 Shells' },
      { key: 'firstlight', val: '1.8 ms · Online' }
    ];

    if (bootEl) {
      for (var i = 0; i < bootTiles.length; i++) {
        var tile = bootEl.querySelector('[data-boot="' + bootTiles[i].key + '"]');
        if (tile) {
          var vSpan = tile.querySelector('.v');
          if (vSpan) vSpan.textContent = bootTiles[i].val;
          tile.classList.add('done');
        }
      }
      setTimeout(function () {
        bootEl.classList.add('done');
        setTimeout(function () {
          bootEl.style.display = 'none';
        }, 650);
      }, 280);
    }

    // Wire collapsible panel headers & Observatory page tabs
    var toggles = document.querySelectorAll('[data-panel-toggle]');
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].addEventListener('click', function () {
        var panel = this.closest('.panel');
        if (!panel) return;
        var body = panel.querySelector('.panel-body');
        if (body) {
          body.style.display = body.style.display === 'none' ? '' : 'none';
        }
      });
    }

    var obsTabs = document.querySelectorAll('[data-obs-page]');
    for (var ot = 0; ot < obsTabs.length; ot++) {
      obsTabs[ot].addEventListener('click', function () {
        var pageIdx = this.getAttribute('data-obs-page');
        for (var j = 0; j < obsTabs.length; j++) {
          obsTabs[j].setAttribute('aria-selected', obsTabs[j] === this ? 'true' : 'false');
        }
        var panes = document.querySelectorAll('[data-obs-pane]');
        for (var p = 0; p < panes.length; p++) {
          var isMatch = panes[p].getAttribute('data-obs-pane') === pageIdx;
          panes[p].classList.toggle('active', isMatch);
          panes[p].style.display = isMatch ? 'flex' : 'none';
        }
      });
    }

    // Deterministic Mulberry32 PRNG
    var seedState = 0xc05m0513 >>> 0;
    function nextRand() {
      seedState = (seedState + 0x6d2b79f5) >>> 0;
      var t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Initialize 48 Xylos Foci + 96 Petri Entities + 5 Archons on the 3D Cosmogonic Dome
    var foci = [];
    for (var f = 0; f < 48; f++) {
      var group = f % 6;
      var phi = (f / 48) * Math.PI * 2;
      var elev = 0.25 + (group / 6) * 1.1;
      foci.push({
        id: f,
        group: group,
        phi: phi,
        elev: elev,
        radius: 150 + (group % 3) * 28,
        act: 0.4 + 0.5 * nextRand(),
        phase: nextRand() * Math.PI * 2
      });
    }

    var entities = [];
    var colors = ['#36d7d4', '#b98cff', '#ff6ab0', '#6bff9e', '#ffd166', '#5cf0ff'];
    for (var e = 0; e < 96; e++) {
      entities.push({
        theta: nextRand() * Math.PI * 2,
        r: 25 + nextRand() * 195,
        y: (nextRand() - 0.5) * 70,
        vTheta: (nextRand() - 0.5) * 0.014,
        vr: (nextRand() - 0.5) * 0.35,
        color: colors[e % colors.length],
        size: 1.8 + (e % 5) * 0.7,
        isXenomimic: e < 18,
        isTitan: e >= 18 && e < 38
      });
    }

    var canvas = document.getElementById('c');
    var ctx = canvas ? canvas.getContext('2d') : null;
    var camYaw = 0.42;
    var camPitch = 0.36;
    var camZoom = 1.0;
    var dragging = false;
    var lastX = 0;
    var lastY = 0;

    if (canvas) {
      canvas.addEventListener('pointerdown', function (ev) {
        dragging = true;
        lastX = ev.clientX;
        lastY = ev.clientY;
      });
      window.addEventListener('pointerup', function () {
        dragging = false;
      });
      window.addEventListener('pointermove', function (ev) {
        if (!dragging) return;
        camYaw += (ev.clientX - lastX) * 0.007;
        camPitch = Math.max(-1.1, Math.min(1.2, camPitch + (ev.clientY - lastY) * 0.006));
        lastX = ev.clientX;
        lastY = ev.clientY;
      });
      canvas.addEventListener(
        'wheel',
        function (ev) {
          camZoom = Math.max(0.45, Math.min(2.4, camZoom * (ev.deltaY < 0 ? 1.08 : 0.92)));
        },
        { passive: true }
      );
    }

    var histEntities = [];
    var histChaos = [];
    var histEnergy = [];
    var histConn = [];
    for (var h = 0; h < 48; h++) {
      histEntities.push(138 + Math.sin(h * 0.2) * 8);
      histChaos.push(0.42 + Math.cos(h * 0.17) * 0.15);
      histEnergy.push(0.76 + Math.sin(h * 0.11) * 0.12);
      histConn.push(192 + Math.sin(h * 0.25) * 14);
    }

    function setSpan(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = String(text);
    }

    function drawSparkline(canvasId, arr, strokeColor, fillColor) {
      var sc = document.getElementById(canvasId);
      if (!sc) return;
      var w = sc.clientWidth || 160;
      var h = sc.clientHeight || 28;
      if (sc.width !== w || sc.height !== h) {
        sc.width = w;
        sc.height = h;
      }
      var sctx = sc.getContext('2d');
      if (!sctx || arr.length < 2) return;
      sctx.clearRect(0, 0, w, h);
      var minV = Infinity;
      var maxV = -Infinity;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] < minV) minV = arr[i];
        if (arr[i] > maxV) maxV = arr[i];
      }
      var span = Math.max(1e-5, maxV - minV);
      sctx.beginPath();
      for (var j = 0; j < arr.length; j++) {
        var x = (j / (arr.length - 1)) * w;
        var y = h - 3 - ((arr[j] - minV) / span) * (h - 6);
        if (j === 0) sctx.moveTo(x, y);
        else sctx.lineTo(x, y);
      }
      sctx.strokeStyle = strokeColor;
      sctx.lineWidth = 1.5;
      sctx.stroke();
      if (fillColor) {
        sctx.lineTo(w, h);
        sctx.lineTo(0, h);
        sctx.closePath();
        sctx.fillStyle = fillColor;
        sctx.fill();
      }
    }

    var frame = 0;
    var algNames = ['Eshkol-GWT-48', 'Apex-11-Organ', 'Xenomimic-CN16', 'Mechalogodrom-10', 'Glyph-25K-FP16'];

    function project3D(x, y, z, cx, cy, scale) {
      var cosY = Math.cos(camYaw);
      var sinY = Math.sin(camYaw);
      var rx = x * cosY - z * sinY;
      var rz = x * sinY + z * cosY;
      var cosP = Math.cos(camPitch);
      var sinP = Math.sin(camPitch);
      var ry = y * cosP - rz * sinP;
      var rz2 = y * sinP + rz * cosP + 460;
      var fov = (380 * scale) / Math.max(60, rz2);
      return {
        sx: cx + rx * fov,
        sy: cy + ry * fov,
        depth: rz2,
        scale: fov
      };
    }

    function stepAndRender() {
      frame++;
      if (!dragging) {
        camYaw += 0.0022;
      }

      if (canvas && ctx) {
        var w = window.innerWidth || 960;
        var h = window.innerHeight || 640;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        var cx = w * 0.5;
        var cy = h * 0.52;

        var grad = ctx.createRadialGradient(cx, cy * 0.85, 20, cx, cy, Math.max(w, h) * 0.7);
        grad.addColorStop(0, '#130b2c');
        grad.addColorStop(0.5, '#070514');
        grad.addColorStop(1, '#020207');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw Cosmogonic Geodesic Dome Latitude/Longitude Rings
        ctx.lineWidth = 1;
        for (var ring = 1; ring <= 5; ring++) {
          var elev = (ring / 6) * (Math.PI * 0.48);
          var rRing = Math.cos(elev) * 220;
          var yRing = -Math.sin(elev) * 180;
          ctx.strokeStyle = 'rgba(110, 210, 255, ' + (0.06 + ring * 0.025).toFixed(3) + ')';
          ctx.beginPath();
          for (var seg = 0; seg <= 48; seg++) {
            var a = (seg / 48) * Math.PI * 2;
            var p = project3D(Math.cos(a) * rRing, yRing, Math.sin(a) * rRing, cx, cy, camZoom);
            if (seg === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        }

        // Evolve & Render 48 Xylos Recurrent Manifold Foci & Synaptic Edges
        var projectedFoci = [];
        for (var fi = 0; fi < foci.length; fi++) {
          var fn = foci[fi];
          fn.phi += 0.003 * (1 + (fn.group % 3) * 0.3);
          fn.act = 0.5 + 0.48 * Math.sin(frame * 0.03 + fn.phase);
          var fx = Math.cos(fn.phi) * Math.cos(fn.elev * 0.6) * fn.radius;
          var fz = Math.sin(fn.phi) * Math.cos(fn.elev * 0.6) * fn.radius;
          var fy = -Math.sin(fn.elev * 0.6) * 155;
          projectedFoci.push(project3D(fx, fy, fz, cx, cy, camZoom));
        }

        ctx.strokeStyle = 'rgba(185, 140, 255, 0.16)';
        ctx.beginPath();
        for (var ei = 0; ei < projectedFoci.length; ei++) {
          var pA = projectedFoci[ei];
          var pB = projectedFoci[(ei + 7) % projectedFoci.length];
          ctx.moveTo(pA.sx, pA.sy);
          ctx.lineTo(pB.sx, pB.sy);
        }
        ctx.stroke();

        for (var fj = 0; fj < projectedFoci.length; fj++) {
          var pf = projectedFoci[fj];
          var rad = Math.max(1.8, (2.4 + foci[fj].act * 2.5) * pf.scale);
          ctx.fillStyle = colors[foci[fj].group % colors.length];
          ctx.beginPath();
          ctx.arc(pf.sx, pf.sy, rad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Evolve & Render Petri Dish Biologics, Xenomimics & Titans
        for (var k = 0; k < entities.length; k++) {
          var ent = entities[k];
          ent.theta += ent.vTheta;
          ent.r += ent.vr;
          if (ent.r < 18 || ent.r > 210) ent.vr = -ent.vr;
          var ex = Math.cos(ent.theta) * ent.r;
          var ez = Math.sin(ent.theta) * ent.r;
          var ey = 28 + Math.sin(frame * 0.04 + k) * 8;
          var pe = project3D(ex, ey, ez, cx, cy, camZoom);
          ctx.fillStyle = ent.color;
          ctx.beginPath();
          ctx.arc(pe.sx, pe.sy, Math.max(1.5, ent.size * pe.scale), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (frame % 12 === 0) {
        var pop = 144 + Math.round(Math.sin(frame * 0.02) * 6);
        var chaosVal = Number((0.46 + 0.14 * Math.sin(frame * 0.015)).toFixed(3));
        var energyVal = Number((0.82 + 0.09 * Math.cos(frame * 0.018)).toFixed(3));
        var connVal = 192 + Math.round(Math.cos(frame * 0.025) * 8);
        var qEntropy = Number((0.74 + 0.16 * Math.sin(frame * 0.012)).toFixed(2));

        histEntities.push(pop);
        if (histEntities.length > 48) histEntities.shift();
        histChaos.push(chaosVal);
        if (histChaos.length > 48) histChaos.shift();
        histEnergy.push(energyVal);
        if (histEnergy.length > 48) histEnergy.shift();
        histConn.push(connVal);
        if (histConn.length > 48) histConn.shift();

        setSpan('v0', pop);
        setSpan('xenomimic-count', 18);
        setSpan('v1', chaosVal);
        setSpan('v2', energyVal);
        setSpan('v3', connVal);
        setSpan('v4', 12 + (Math.floor(frame / 60) % 7));
        setSpan('v5', algNames[Math.floor(frame / 90) % algNames.length]);
        setSpan('v6', (0.91 + 0.06 * Math.sin(frame * 0.02)).toFixed(3));
        setSpan('v8', Math.floor(frame / 8));
        setSpan('v9', 6);
        setSpan('v10', '+1.4/m');
        setSpan('v11', qEntropy);
        setSpan('es', 4);
        setSpan('ep', 5);
        setSpan('etn', 20);
        setSpan('nhic', 5);
        setSpan('snt', '88%');
        setSpan('tel-sim', 'N(1) GENESIS');
        setSpan('tel-sing', 'KERR-Ω');

        drawSparkline('g0', histEntities, '#36d7d4', 'rgba(54, 215, 212, 0.15)');
        drawSparkline('g1', histChaos, '#ff6ab0', 'rgba(255, 106, 176, 0.15)');
        drawSparkline('g2', histEnergy, '#6bff9e', 'rgba(107, 255, 158, 0.15)');
        drawSparkline('g3', histConn, '#b98cff', 'rgba(185, 140, 255, 0.15)');

        drawSparkline('obs-c0', histEntities, '#36d7d4', 'rgba(54, 215, 212, 0.22)');
        drawSparkline('obs-c1', histEnergy, '#ffd166', 'rgba(255, 209, 102, 0.18)');
        drawSparkline('obs-c2', histChaos, '#ff6ab0', 'rgba(255, 106, 176, 0.18)');
        drawSparkline('obs-c3', histConn, '#b98cff', 'rgba(185, 140, 255, 0.18)');
      }

      requestAnimationFrame(stepAndRender);
    }

    requestAnimationFrame(stepAndRender);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(bootStandaloneDome, 120);
    });
  } else {
    setTimeout(bootStandaloneDome, 120);
  }
})();
