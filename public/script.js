// ============================================================
// ✅ GAT Sport Verification Script — Netlify-ready final
// ============================================================

// R2_BASE: Cloudflare R2 public development URL (set to your bucket)
const R2_BASE = "https://pub-13edf9061d124849897438f055509087.r2.dev/images/";

// Helper: Build the proper image URL from code
function buildImageUrl(code) {
  if (!code) return "";
  let raw = String(code).trim();

  // If already a full URL, use directly
  if (raw.toLowerCase().startsWith("http://") || raw.toLowerCase().startsWith("https://")) return raw;

  // If already formatted like guilloche_123.png
  if (raw.startsWith("guilloche_") && raw.toLowerCase().endsWith(".png")) {
    return `${R2_BASE}${raw}`;
  }

  // Remove leading slashes
  raw = raw.replace(/^\/+/, "");

  // Standard file naming pattern
  const filename = raw.startsWith("guilloche_") ? raw : `guilloche_${raw}.png`;
  return `${R2_BASE}${filename}`;
}

// ============================================================
// UI & Page Initialization
// ============================================================

let currentProductCode = '';
let codesMap = null;

document.addEventListener('DOMContentLoaded', async function () {
    if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          console.log('User location:', pos.coords.latitude, pos.coords.longitude);
        } catch (err) {
          console.warn('Location access denied or unavailable:', err);
        }
      } else {
        console.warn('Geolocation API not supported on this browser.');
      }  
// Get product code only from ?c=CODE
const urlParams = new URLSearchParams(window.location.search);
const codeFromQuery = (urlParams.get('c') || '').trim();
currentProductCode = codeFromQuery;

const autoVerify = (urlParams.get('auto') || '') === '1';


  // Load codes.json if present
  try {
    const res = await fetch('/api/codes.json', { cache: 'no-store' });
    if (res.ok) codesMap = await res.json();
    else {
      console.warn('codes.json not found; using direct R2 mapping.');
      codesMap = null;
    }
  } catch (e) {
    console.warn('Error loading codes.json, using fallback.', e);
    codesMap = null;
  }

  // Display code
  const codeEl = document.getElementById('productCodeDisplay');
  if (codeEl) codeEl.textContent = currentProductCode || '';

  // Hook verify buttons
  const verifyBtns = document.querySelectorAll('.verify-btn, .authbutton');
  if (verifyBtns.length) {
    verifyBtns.forEach((btn) => {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        this.style.display = 'none';
        smoothScrollToResults();
        setTimeout(() => {
          showLoadingOverlaySized();
          verifyProductWithMinTime();
        }, 500);
      });
    });
  }

  // Auto verify if URL requested it
  if (currentProductCode && autoVerify) {
    const firstBtn = document.querySelector('.verify-btn, .authbutton');
    if (firstBtn) firstBtn.style.display = 'none';
    smoothScrollToResults();
    setTimeout(() => {
      showLoadingOverlaySized();
      verifyProductWithMinTime();
    }, 500);
  }
});

// ============================================================
// Layout Helpers
// ============================================================

function getBarHeights() {
  const header = document.querySelector('.navbar-inverse, .navbar');
  const footer = document.querySelector('.section_footer');
  const topH = header ? header.getBoundingClientRect().height : 70;
  const botH = footer ? footer.getBoundingClientRect().height : 56;
  return { topH, botH };
}

function showLoadingOverlaySized() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  const { topH, botH } = getBarHeights();
  overlay.style.top = topH + 'px';
  overlay.style.bottom = botH + 'px';
  overlay.style.display = 'flex';
}
function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

function smoothScrollToResults() {
  const section = document.getElementById('authresponse');
  if (!section) return;
  const header = document.querySelector('.navbar-inverse, .navbar');
  const offset = header ? header.getBoundingClientRect().height + 8 : 78;
  const y = section.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

// ============================================================
// Rendering Functions
// ============================================================

function renderInlineContainer() {
  const section = document.getElementById('authresponse');
  if (!section) return null;
  section.style.display = 'block';
  return section;
}

function renderInlineSuccess(product) {
    const section = renderInlineContainer();
    if (!section) return;
    const productName = (product && product.name) || 'GAT Sport product';
    const imageUrl = product && product.imageUrl;
  
    const circleContent = imageUrl
      ? `<img id="guillocheImage" src="${imageUrl}" alt="Guilloche" style="width:260px;height:260px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 6px #000 inset;">`
      : `<div id="guillochePattern" style="width:260px;height:260px;border-radius:50%;box-shadow:0 0 0 2px #eee inset;"></div>`;
  
    section.innerHTML = `
  <input id="ResultCode" name="ResultCode" type="hidden" value="${currentProductCode}">
  <div class="container">
    <div class="row">
      <div id="authoutcome" class="validcontainer" data-result="valid" data-product="${productName}" style="display:block;">
        <div class="col-xs-12">
          <h2 class="page-header text-center margin-top-20" style="margin-top:34px;margin-bottom:6px;">Result for '${currentProductCode}'</h2>
          <h2 class="text-center" style="color:#296829">✓</h2>
          <h2 class="text-center" style="color:#296829"><strong>YOUR PRODUCT IS AUTHENTIC</strong></h2>
          <p class="text-center"><span style="font-size:18px">Thank you for your purchase of a genuine GAT Sport product</span></p>
        </div>
        <div class="col-sm-12" style="margin-top:30px;margin-bottom:30px;">
          <h2 class="text-center" style="color:#2c3e50;font-weight:700;font-size:22px;margin-bottom:15px;">THIS CODE IS ASSOCIATED WITH A GUILLOCHE IMAGE</h2>
          <p class="text-center" style="color:#7f8c8d;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">PLEASE SCROLL DOWN TO COMPARE THE IMAGE ON YOUR PHONE WITH THE ONE ON THE PRODUCT</p>
        </div>
        <div class="col-sm-12"><hr></div>
        <div class="col-sm-12">
          <h2 class="page-header text-center" style="margin-top:10px;margin-bottom:18px;"><span>Product Details</span></h2>
        </div>
        <div class="col-sm-12 left-align" style="margin-bottom:16px;">
          <a href="https://gatsport.com/collections/essentials" target="_blank" id="moreInfoBtn" class="btn btn-primary">More product information</a>
        </div>
        <div class="col-sm-12"><hr></div>
        <div class="row" style="margin-top:28px;margin-bottom:40px;">
          <div class="col-md-6" style="padding-left:40px;padding-right:40px;display:flex;flex-direction:column;justify-content:center;">
            <h2 style="color:#2c5aa0;font-weight:700;font-size:20px;margin-bottom:20px;text-align:left;">THIS CODE IS ASSOCIATED WITH A GUILLOCHE IMAGE</h2>
            <p style="color:#666;font-size:14px;line-height:1.6;margin-bottom:12px;text-align:left;">As an additional step, please check that your Guilloche image is a match on your bottle to authenticate your GAT Sport product.</p>
            <p style="color:#666;font-size:14px;line-height:1.6;text-align:left;">Thank you for verifying your purchase.</p>
          </div>
          <div class="col-md-6 padding-10" style="display:flex;align-items:center;justify-content:center;">${circleContent}</div>
        </div>
      </div>
    </div>
  </div>`;
  
    if (!imageUrl) generateGuillochePattern(currentProductCode);
  
    // ensure overlay is gone and the button restored
    hideLoadingOverlay();
    const btn = document.querySelector('.verify-btn, .authbutton');
    if (btn) {
      btn.style.opacity = '1';
      btn.textContent = 'VERIFY MY PRODUCT';
      // make sure button is visible again if you hid it earlier
      btn.style.display = '';
    }
  
    // smooth scroll the results into view
    smoothScrollToResults();
  
    // --- robust reveal helpers (ensure hidden sections show after success) ---
    try {
      console.log('revealHelper: start');
  
      // hide hero underline (optional)
      const heroUnderline = document.querySelector('.section_banner .code-underline');
      if (heroUnderline) heroUnderline.style.display = 'none';
  
      // force show known sections & preverify wrappers (use !important)
      const toReveal = Array.from(document.querySelectorAll('#section_utility1, #section_utility2, .preverify-hidden'));
      toReveal.forEach(el => {
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.removeAttribute('hidden');
      });
  
      console.log('revealHelper: done, revealed =', toReveal.length);
    } catch (e) {
      console.warn('Reveal helper error:', e);
    }
  
    // Defensive re-apply in case other code tries to hide later
    ['#section_utility1','#section_utility2','.preverify-hidden'].forEach(sel => {
      setTimeout(()=> {
        document.querySelectorAll(sel).forEach(el => {
          if (el) {
            el.style.setProperty('display', 'block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');
          }
        });
      }, 250);
      setTimeout(()=> {
        document.querySelectorAll(sel).forEach(el => {
          if (el) {
            el.style.setProperty('display', 'block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');
          }
        });
      }, 1000);
    });
  }
  

function renderInlineError(message) {
  const section = renderInlineContainer();
  if (!section) return;
  section.innerHTML = `
<div class="container">
  <div class="row">
    <div class="col-xs-12">
      <h2 class="page-header text-center margin-top-20">Result for '${currentProductCode}'</h2>
      <h2 class="text-center" style="color:#dc3545">✗</h2>
      <h2 class="text-center" style="color:#dc3545"><strong>INVALID PRODUCT CODE</strong></h2>
      <p class="text-center">${message || 'Please check the code and try again.'}</p>
    </div>
  </div>
</div>`;
  hideLoadingOverlay();
  const btn = document.querySelector('.verify-btn, .authbutton');
  if (btn) {
    btn.style.opacity = '1';
    btn.textContent = 'VERIFY MY PRODUCT';
  }
  smoothScrollToResults();
    // --- reveal hidden sections after successful verification ---

      // --- robust reveal helpers (ensure hidden sections show after success) ---
  try {
    console.log('revealHelper: start');

    // hide hero underline (optional)
    const heroUnderline = document.querySelector('.section_banner .code-underline');
    if (heroUnderline) heroUnderline.style.display = 'none';

    // force show known sections & preverify wrappers (use !important)
    const toReveal = Array.from(document.querySelectorAll('#section_utility1, #section_utility2, .preverify-hidden'));
    toReveal.forEach(el => {
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.removeAttribute('hidden');
    });

    console.log('revealHelper: done, revealed =', toReveal.length);
  } catch (e) {
    console.warn('Reveal helper error:', e);
  }

}

// ============================================================
// === NEW: helpers to call server verify and lazy-load colleague assets (Netlify-only)
// ============================================================

function getNetlifyVerifyEndpoint() {
  // Netlify function endpoint
  return '/.netlify/functions/verify';
}

async function callVerifyCounter(code) {
  try {
    const endpoint = getNetlifyVerifyEndpoint();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      console.warn('verify endpoint non-ok', res.status);
      return null;
    }
    const json = await res.json();
    // json: { success: true|false, product?, count? }
    if (json && typeof json.count !== 'undefined') return Number(json.count);
    return null;
  } catch (e) {
    console.warn('callVerifyCounter error:', e);
    return null;
  }
}

function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!href) return resolve();
    if (document.querySelector(`link[data-dynamic="${href}"]`)) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-dynamic', href);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Failed to load CSS: ' + href));
    document.head.appendChild(link);
  });
}
function loadJS(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve();
    if (document.querySelector(`script[data-dynamic="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.setAttribute('data-dynamic', src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load JS: ' + src));
    document.body.appendChild(s);
  });
}

// ============================================================
// === NEW: render counterfeit UI (fetches /counterfeit/fragment.html)
// ============================================================
// ============================================================
// renderCounterfeitUI - REPLACEMENT
// ============================================================
async function renderCounterfeitUI(context = {}) {
  try {
    showLoadingOverlaySized();

    // load colleague styles + script (adjust names to actual files you placed)
    await loadCSS('/counterfeit/counterfeitstyles.scoped.css').catch(()=>{});
    await loadJS('/counterfeit/counterfeitscript.js').catch(()=>{});
    await loadJS('/counterfeit/contacts.js').catch(()=>{});
    // NEW: load our init wiring for the form (must be loaded before calling it)
    await loadJS('/counterfeit/initCounterfeitForm.js').catch(()=>{});

    const res = await fetch('/counterfeit/fragment.html', { cache: 'no-cache' });
    if (!res.ok) {
      hideLoadingOverlay();
      renderInlineError('Could not load counterfeit UI. Please try again later.');
      return;
    }
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const bodyHTML = (doc.body && doc.body.innerHTML) ? doc.body.innerHTML.trim() : text;

    const section = renderInlineContainer();
    if (!section) {
      hideLoadingOverlay();
      renderInlineError('Internal error: display container not found.');
      return;
    }

    // Insert the colleague fragment
    section.innerHTML = '<div id="cf-root">' + bodyHTML + '</div>';

    // --- PREPEND dynamic header for counterfeit case (shows product code & warning) ---
    // Only inject if it isn't already present
    const authDiv = document.getElementById('authoutcome');
    if (!authDiv) {
      const html = `
      <div id="authoutcome" data-result="invalid" data-product="Essentials" style="display:block;">
        <div class="col-xs-12">
          <h2 class="page-header text-center margin-top-20">Result for '${currentProductCode}'</h2>
          <h2 class="text-center" style="color:#000000">
            <strong>POSSIBLE COUNTERFEIT</strong>
          </h2>
          <p style="text-align: center">
            <span style="font-size: 16px">
              Your product is a potential counterfeit. Please contact Customer Service for further verification.
            </span>
          </p>
        </div>
      </div>`;
      section.insertAdjacentHTML('afterbegin', html);
    }

    hideLoadingOverlay();
    smoothScrollToResults();

    // After DOM is inserted, ensure the init function is triggered (if present)
    if (window.initCounterfeitForm) {
      try { window.initCounterfeitForm(); } catch(e){ console.warn('initCounterfeitForm err', e); }
    }

  } catch (err) {
    console.error('renderCounterfeitUI error:', err);
    hideLoadingOverlay();
    renderInlineError('Unable to show counterfeit UI.');
  }
}

// ============================================================
// Verification Logic with Minimum Loading Time (UPDATED for Netlify)
// ============================================================
async function verifyProductWithMinTime() {
  const startTime = Date.now();
  const minLoadingTime = 2000;

  try {
    if (!currentProductCode) {
      renderInlineError('No code provided. Please scan the QR code on your product.');
      return;
    }

    // Get manifest entry if available
    let entry = null;
    if (codesMap && codesMap[currentProductCode]) {
      entry = codesMap[currentProductCode];
    }

    // Invalid if manifest exists but code missing
    if (codesMap && !entry) {
      await delayRemaining(startTime, minLoadingTime);
      renderInlineError('Invalid product code.');
      return;
    }

    // Build product data
    const product = {
      code: currentProductCode,
      imageUrl: buildImageUrl(currentProductCode),
      name: (entry && entry.name) || 'GAT Sport Product',
      description: (entry && entry.description) || 'Authentic GAT Sport supplement'
    };

    // Call Netlify serverless verify to increment counter & get count
    const count = await callVerifyCounter(currentProductCode);

    // Wait minimum loading time
    await delayRemaining(startTime, minLoadingTime);

    if (count === null) {
      // failsafe: show success if server unavailable
      renderInlineSuccess(product);
      return;
    }

    // Branch: <=10 authentic ; >10 counterfeit
    if (Number(count) > 10) {
      await renderCounterfeitUI({ code: currentProductCode, count });
    } else {
      renderInlineSuccess(product);
    }

  } catch (error) {
    console.error('Error verifying product:', error);
    await delayRemaining(startTime, minLoadingTime);
    renderInlineError('Network error. Please try again.');
  }
}

async function delayRemaining(startTime, minTime) {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minTime - elapsed);
  if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
}

// ============================================================
// Guilloche Generator
// ============================================================

function generateGuillochePattern(code) {
  const pattern = document.getElementById('guillochePattern');
  if (!pattern) return;
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const absHash = Math.abs(hash);
  const colors = [
    `hsl(${absHash % 360}, 70%, 60%)`,
    `hsl(${(absHash + 60) % 360}, 70%, 60%)`,
    `hsl(${(absHash + 120) % 360}, 70%, 60%)`,
    `hsl(${(absHash + 180) % 360}, 70%, 60%)`,
    `hsl(${(absHash + 240) % 360}, 70%, 60%)`,
    `hsl(${(absHash + 300) % 360}, 70%, 60%)`
  ];
  pattern.style.background = `conic-gradient(from 0deg, ${colors.join(', ')})`;
  const speed = 10 + (absHash % 10);
  pattern.style.animation = `rotate ${speed}s linear infinite`;
}

// ============================================================
// Modal & Event Placeholders (for future use)
// ============================================================

window.addEventListener('click', function (event) {});
document.addEventListener('keydown', function (event) {});
