// initCounterfeitForm.js
// Cleaned-up version: no modal/dialog, in-page green success only
(function () {
    'use strict';
  
    function qs(root, sel) { return (root || document).querySelector(sel); }
    function qsa(root, sel) { return Array.from((root || document).querySelectorAll(sel)); }
  
    // Date validation: dd/mm/yyyy and real calendar validity
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
  
        // Initially show report link, hide form and success/failure blocks
        if (reportSection) reportSection.style.display = 'block';
        if (formContainer) formContainer.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        if (failureDiv) failureDiv.style.display = 'none';
  
        function setMsg(fieldId, msg) {
          if (!form) return;
          var span = form.querySelector('[data-valmsg-for="'+fieldId+'"]') || qs(container, '[data-valmsg-for="'+fieldId+'"]');
          if (span) span.textContent = msg || '';
        }
  
        // Show the form when "Click Here" is pressed
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
  
        // Clear validation messages on input
        qsa(form, 'input, textarea, select').forEach(function (el) {
          el.addEventListener('input', function () { setMsg(el.id, ''); }, { passive: true });
        });
  
        // Form submit handler
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
  
          // Show green in-page success block after submission
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
  