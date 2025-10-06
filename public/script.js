// Main verification page JavaScript functionality

let currentProductCode = '';
let codesMap = null;

// Initialize the verification page
document.addEventListener('DOMContentLoaded', async function() {
    // Derive product code from URL path /:code or ?c=
    const pathPart = (location.pathname || '/').replace(/^\//, '');
    const urlParams = new URLSearchParams(window.location.search);
    let codeFromPath = pathPart && !pathPart.includes('/') ? pathPart : '';
    let codeFromQuery = (urlParams.get('c') || '').trim();
    currentProductCode = (codeFromPath || codeFromQuery || '').trim();

    // Load codes mapping once
    try {
        const res = await fetch('/api/codes.json', { cache: 'no-store' });
        if (res.ok) {
            codesMap = await res.json();
        } else {
            console.error('Failed to load codes.json:', res.status);
        }
    } catch (e) {
        console.error('Error loading codes.json:', e);
    }

    // Always auto-verify when code present in this flow
    const autoVerify = true;

    // Display the product code
    const codeEl = document.getElementById('productCodeDisplay');
    if (codeEl) codeEl.textContent = currentProductCode || '';

    // Bind button
    const verifyBtns = document.querySelectorAll('.verify-btn, .authbutton');
    if (verifyBtns && verifyBtns.length) {
        verifyBtns.forEach((btn) => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                this.style.opacity = '0.7';
                this.textContent = 'VERIFYING...';
                verifyProduct(this);
            });
        });
    }

    // Auto-verify when code present
    if (currentProductCode && autoVerify) {
        const firstBtn = document.querySelector('.verify-btn, .authbutton');
        if (firstBtn) {
            firstBtn.style.opacity = '0.7';
            firstBtn.textContent = 'VERIFYING...';
        }
        verifyProduct(firstBtn);
    }
});

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
        <p class="text-center" style="color:rgba(31,53,90,1)"><span style="font-size:24px"><strong>THIS CODE IS ASSOCIATED WITH A GUILLOCHE IMAGE</strong></span></p>
        <p class="text-center"><span style="font-size:16px"><strong>PLEASE SCROLL DOWN TO COMPARE THE IMAGE ON YOUR PHONE WITH THE ONE ON THE PRODUCT</strong></span></p>
      </div>
      <div class="col-sm-12"><hr></div>
      <div class="col-sm-12">
        <h2 class="page-header text-center" style="margin-top:10px;margin-bottom:18px;"><span>Product Details</span></h2>
      </div>
      <div class="col-sm-12 text-center" style="margin-bottom:16px;">
        <a href="https://gatsport.com/collections/essentials" target="_blank" id="moreInfoBtn" class="btn btn-primary">More product information</a>
      </div>
      <div class="col-sm-12"><hr></div>
      <div class="row" style="margin-top:28px;">
        <div class="col-md-6" style="padding-right:22px;">
          <h2 class="page-header text-center"><span>This code is associated with a Guilloche image</span></h2>
          <p>As an additional step, please check that your Guilloche image is a match on your bottle to authenticate your GAT Sport product.</p>
          <p>Thank you for verifying your purchase.</p>
        </div>
        <div class="col-md-6 padding-10" style="display:flex;align-items:center;justify-content:center;">${circleContent}</div>
      </div>
    </div>
  </div>
</div>`;

    if (!imageUrl) {
        generateGuillochePattern(currentProductCode);
    }
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
}

// Verify the product (purely client-side)
async function verifyProduct(verifyBtn) {
    try {
        if (!currentProductCode) {
            if (verifyBtn) {
                verifyBtn.style.opacity = '1';
                verifyBtn.textContent = 'VERIFY MY PRODUCT';
            }
            renderInlineError('No code provided.');
            return;
        }
        if (!codesMap || !codesMap[currentProductCode]) {
            if (verifyBtn) {
                verifyBtn.style.opacity = '1';
                verifyBtn.textContent = 'VERIFY MY PRODUCT';
            }
            renderInlineError('Invalid product code.');
            return;
        }
        const entry = codesMap[currentProductCode] || {};
        const product = {
            code: currentProductCode,
            imageUrl: entry.imageUrl || `/images/guilloche_${currentProductCode}.png`,
            name: entry.name || 'GAT Sport Product',
            description: entry.description || 'Authentic GAT Sport supplement'
        };

        if (verifyBtn) {
            verifyBtn.style.opacity = '1';
            verifyBtn.textContent = 'VERIFY MY PRODUCT';
        }

        renderInlineSuccess(product);
        const gearSection = document.getElementById('section_utility1');
        if (gearSection) gearSection.style.display = 'block';
        const aboutSection = document.getElementById('section_utility2');
        if (aboutSection) aboutSection.style.display = 'block';
        const resultSection = document.getElementById('authresponse');
        if (resultSection && typeof resultSection.scrollIntoView === 'function') {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('Error verifying product:', error);
        if (verifyBtn) {
            verifyBtn.style.opacity = '1';
            verifyBtn.textContent = 'VERIFY MY PRODUCT';
        }
        renderInlineError('Unexpected error. Please try again.');
    }
}

function showSuccessModal() {}
function showErrorModal(message) {}
function closeModal() {}
function closeErrorModal() {}

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

window.addEventListener('click', function(event) {});

document.addEventListener('keydown', function(event) {});


