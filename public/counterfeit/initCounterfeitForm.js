// initCounterfeitForm.js
// Final version: client-only, strict dd/mm/yyyy, green success block, in-page modal
(function () {
    'use strict';
  
    function qs(root, sel) { return (root || document).querySelector(sel); }
    function qsa(root, sel) { return Array.from((root || document).querySelectorAll(sel)); }
    function createEl(tag, attrs) {
      var el = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
      return el;
    }
  
    // Date validation: dd/mm/yyyy and real calendar validity (checks leap years)
    function isValidDateDMY(s) {
      if (typeof s !== 'string') return false;
      s = s.trim();
      var rx = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      var m = s.match(rx);
      if (!m) return false;
      var d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
      if (y < 1900 || y > 2099) return false;
      if (mo < 1 || mo > 12) return false;
      var mdays = [31, (y%4===0 && (y%100!==0 || y%400===0)) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
      if (d < 1 || d > mdays[mo-1]) return false;
      return true;
    }
  
    // Ensure modal and styles exist
    function ensureModalMarkup() {
      if (document.getElementById('cc-success-modal')) return;
      var style = createEl('style');
      style.id = 'cc-success-modal-style';
      style.type = 'text/css';
      style.appendChild(document.createTextNode(
        '\n#cc-success-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:12000}\n' +
        '#cc-success-modal .cc-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.45)}\n' +
        '#cc-success-modal .cc-dialog{position:relative;max-width:520px;width:94%;background:#fff;border-radius:10px;padding:20px 20px 18px;box-shadow:0 12px 30px rgba(0,0,0,0.25);transform:translateY(0);}\n' +
        '#cc-success-modal .cc-dialog h3{margin:0 0 8px;font-size:20px;color:#222}\n' +
        '#cc-success-modal .cc-dialog p{margin:0 0 12px;color:#444}\n' +
        '#cc-success-modal .cc-close{position:absolute;right:12px;top:10px;border:none;background:transparent;font-size:18px;cursor:pointer}\n' +
        '#cc-success-modal .cc-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}\n' +
        '#cc-success-modal .cc-btn{padding:8px 12px;border-radius:6px;border:0;cursor:pointer}\n' +
        '#cc-success-modal .cc-btn--primary{background:#2c5aa0;color:#fff}\n' +
        '@media (max-width:420px){#cc-success-modal .cc-dialog{padding:14px}}'
      ));
      document.head.appendChild(style);
  
      var modal = createEl('div', { id: 'cc-success-modal', role: 'dialog', 'aria-modal': 'true' });
      modal.innerHTML = '' +
        '<div class="cc-overlay" tabindex="-1"></div>' +
        '<div class="cc-dialog" role="document">' +
          '<button class="cc-close" aria-label="Close">&times;</button>' +
          '<h3 id="cc-modal-title">Information submitted successfully</h3>' +
          '<p id="cc-modal-body">Thank you — we have recorded your details and will investigate this invalid scan.</p>' +
          '<div class="cc-actions">' +
            '<button class="cc-btn cc-btn--primary" id="cc-modal-ok">Close</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
  
      modal.querySelector('.cc-close').addEventListener('click', function () { modal.style.display = 'none'; }, { passive: true });
      modal.querySelector('#cc-modal-ok').addEventListener('click', function () { modal.style.display = 'none'; }, { passive: true });
      modal.querySelector('.cc-overlay').addEventListener('click', function () { modal.style.display = 'none'; }, { passive: true });
    }
  
    window.initCounterfeitForm = function initCounterfeitForm() {
      try {
        var container = qs(document, '#authresponse') || document;
        var reportSection = qs(container, '#reportLink');
        var formContainer = qs(container, '#contactFormContainer');
        var form = qs(container, '#contactForm');
        var successDiv = qs(container, '#contactFormSuccess');
        var failureDiv = qs(container, '#contactFormFailure');
        var btnReportLink = qs(container, '#btnReportLink');
        var btnSubmit = qs(container, '#btnSubmitContact');
  
        ensureModalMarkup();
        var modal = document.getElementById('cc-success-modal');
  
        if (reportSection) reportSection.style.display = 'block';
        if (formContainer) formContainer.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        if (failureDiv) failureDiv.style.display = 'none';
  
        function setMsg(fieldId, msg) {
          if (!form) return;
          var span = form.querySelector('[data-valmsg-for="'+fieldId+'"]') || qs(container, '[data-valmsg-for="'+fieldId+'"]');
          if (span) span.textContent = msg || '';
        }
  
        if (btnReportLink) {
          btnReportLink.addEventListener('click', function (ev) {
            ev.preventDefault();
            if (reportSection) reportSection.style.display = 'none';
            if (formContainer) {
              formContainer.style.display = 'block';
              var first = formContainer.querySelector('input, textarea, select');
              if (first) try { first.focus(); } catch (e) {}
            }
          }, { passive: false });
        }
  
        if (!form) return;
  
        qsa(form, 'input, textarea, select').forEach(function (el) {
          el.addEventListener('input', function () { setMsg(el.id, ''); }, { passive: true });
        });
  
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
  
          ['RetailerName','RetailerLocation','PurchaseDate','Product','CustomerEmail'].forEach(function(n){ setMsg(n,''); });
  
          function val(id){ var el = form.querySelector('#' + id); return el ? (String(el.value || '').trim()) : ''; }
  
          var retailer = val('RetailerName');
          var location = val('RetailerLocation');
          var purchaseDate = val('PurchaseDate');
          var product = val('Product');
          var email = val('CustomerEmail');
  
          var ok = true;
          if (!retailer) { setMsg('RetailerName', 'You must tell us (whom/where/when) you bought the product'); ok = false; }
          if (!location) { setMsg('RetailerLocation', 'You must tell us (whom/where/when) you bought the product'); ok = false; }
          if (!purchaseDate) { setMsg('PurchaseDate', 'You must tell us (whom/where/when) you bought the product'); ok = false; }
          if (!product) { setMsg('Product', 'You must tell us what it was that you bought.'); ok = false; }
  
          var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRe.test(email)) { setMsg('CustomerEmail', 'Email is not valid.'); ok = false; }
  
          if (purchaseDate && !isValidDateDMY(purchaseDate)) {
            setMsg('PurchaseDate', 'Date must be in dd/mm/yyyy format.'); ok = false;
          }
  
          if (!ok) {
            var firstInvalid = ['RetailerName','RetailerLocation','PurchaseDate','Product','CustomerEmail'].find(function(id){
              var sp = form.querySelector('[data-valmsg-for="'+id+'"]');
              return sp && sp.textContent && sp.textContent.length > 0;
            });
            if (firstInvalid) {
              var el = form.querySelector('#' + firstInvalid);
              if (el) try { el.focus(); } catch(e){}
            }
            return;
          }
  
          var origBtnText = null;
          if (btnSubmit) { origBtnText = btnSubmit.textContent; btnSubmit.setAttribute('disabled','disabled'); btnSubmit.textContent = 'Submitting...'; }
  
          // Client-only: show green in-page success block & modal
          setTimeout(function () {
            try { form.style.display = 'none'; } catch (e) {}
            if (successDiv) {
              successDiv.innerHTML = `
                <div style="background:#e9f7ec;border-left:6px solid #28a745;color:#155724;padding:16px;border-radius:6px;">
                  <h2 style="margin:0 0 6px;font-size:18px;color:#155724">Information submitted successfully.</h2>
                  <p style="margin:0;color:#155724">Thank you for taking the time to supply this information. We really appreciate it.</p>
                </div>`;
              successDiv.style.display = 'block';
            }
            // show modal
            var title = qs(document, '#cc-modal-title'); if (title) title.textContent = 'Information submitted successfully';
            var body = qs(document, '#cc-modal-body'); if (body) body.textContent = 'Thank you for taking the time to supply this information. We really appreciate it.';
            if (modal) modal.style.display = 'flex';
          }, 450);
  
          setTimeout(function () {
            if (btnSubmit) { btnSubmit.removeAttribute('disabled'); btnSubmit.textContent = origBtnText || 'Submit'; }
          }, 800);
  
        }, { passive: false });
  
      } catch (err) {
        if (window && window.console) console.warn('initCounterfeitForm error', err);
      }
    };
  
    // NO auto-run here: main script will call window.initCounterfeitForm() after injecting fragment
  })();
  