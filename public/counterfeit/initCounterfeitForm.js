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
  
    // Initialize datepicker if available (safe - checks jQuery + plugin)
    function initDatepicker() {
      try {
        if (window.jQuery && typeof jQuery.fn.datepicker === 'function') {
          var lang = (navigator.language || navigator.userLanguage || 'en');
          // map culture similar to original site behavior
          var n = (lang === 'en-US' || lang === 'en') ? '' : (lang.indexOf('es-') === 0 ? 'es' : (lang.indexOf('zh-') === 0 ? 'zh' : ''));
          jQuery('#PurchaseDate').datepicker({ language: n, autoclose: true });
        }
      } catch (e) {
        // fail silently if datepicker isn't loaded yet
        console.warn('datepicker init error', e);
      }
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
  
        // NEW: reference to full contact section (hide/show & scroll target)
        var sectionContact = qs(container, '#section_contact');
  
        // Initially show report link, hide form and success/failure blocks
        if (reportSection) reportSection.style.display = 'block';
        if (formContainer) formContainer.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        if (failureDiv) failureDiv.style.display = 'none';
  
        // Ensure the entire contact section is hidden initially (prevents premature visibility)
        if (sectionContact) sectionContact.style.display = 'none';
  
        // setMsg: put message text AND make the validation span visible (CSS previously hid it)
        function setMsg(fieldId, msg) {
          if (!form) return;
          // prefer the in-form span; fallback to container-level selector
          var span = form.querySelector('[data-valmsg-for="'+fieldId+'"]') || qs(container, '[data-valmsg-for="'+fieldId+'"]');
          if (!span) return;
          span.textContent = msg || '';
          // make sure the message is visible even if CSS had .field-validation-valid {display:none;}
          if (msg && msg.length) {
            span.style.display = 'block';
            span.classList.remove('field-validation-valid');
            span.classList.add('field-validation-error');
          } else {
            span.style.display = 'none';
            span.classList.remove('field-validation-error');
            span.classList.add('field-validation-valid');
          }
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
  
            // reveal full contact section and scroll into view
            if (sectionContact) {
              try {
                sectionContact.style.display = 'block';
                sectionContact.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } catch (e) {
                try { window.scrollTo(0, sectionContact.offsetTop - 80); } catch(err){}
              }
            }
  
            // initialize datepicker once the form is revealed (safe to call multiple times)
            initDatepicker();
  
            // enforce phone-only input (init on reveal to ensure element exists)
            var phoneInput = qs(container, '#CustomerPhoneNumber');
            if (phoneInput) {
              phoneInput.setAttribute('inputmode','numeric');
              phoneInput.setAttribute('pattern','[0-9]*');
              // immediate clean in case value exists
              phoneInput.value = (phoneInput.value || '').replace(/\D+/g,'');
              phoneInput.addEventListener('input', function () {
                var pos = this.selectionStart;
                this.value = this.value.replace(/\D+/g,'');
                try { this.setSelectionRange(pos, pos); } catch (e) {}
              }, { passive: true });
            }
  
          }, { passive: false });
        }
  
        if (!form) return;
  
        // Clear validation messages on input
        qsa(form, 'input, textarea, select').forEach(function (el) {
          el.addEventListener('input', function () {
            setMsg(el.id, '');
          }, { passive: true });
        });
  
        // Form submit handler
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
  
          ['RetailerName','RetailerLocation','PurchaseDate','Product','CustomerEmail','CustomerPhoneNumber'].forEach(function(n){ setMsg(n,''); });
  
          function val(id){ var el = form.querySelector('#' + id); return el ? (String(el.value || '').trim()) : ''; }
  
          var retailer = val('RetailerName');
          var location = val('RetailerLocation');
          var purchaseDate = val('PurchaseDate');
          var product = val('Product');
          var email = val('CustomerEmail');
          var phone = val('CustomerPhoneNumber');
  
          var ok = true;
          if (!retailer) { setMsg('RetailerName', 'You must tell us whom you bought the product from.'); ok = false; }
          if (!location) { setMsg('RetailerLocation', 'You must tell us where you bought the product.'); ok = false; }
          if (!purchaseDate) { setMsg('PurchaseDate', 'You must tell us when you bought the product.'); ok = false; }
          if (!product) { setMsg('Product', 'You must tell us what it was that you bought.'); ok = false; }
  
          var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRe.test(email)) { setMsg('CustomerEmail', 'Email is not valid.'); ok = false; }
  
          // phone optional? If required, validate digits-only and a min length (example 7)
          if (phone && !/^\d+$/.test(phone)) { setMsg('CustomerPhoneNumber', 'Phone number must contain digits only.'); ok = false; }
  
          if (purchaseDate && !isValidDateDMY(purchaseDate)) {
            setMsg('PurchaseDate', 'Date must be in dd/mm/yyyy format.'); ok = false;
          }

          // require hcaptcha response on client (simple UX-only check)
            var captchaToken = '';
            var captchaTextarea = form.querySelector('textarea[name="h-captcha-response"], textarea[id^="h-captcha-response"], textarea[name="g-recaptcha-response"]');
            if (captchaTextarea) captchaToken = String(captchaTextarea.value || '').trim();

            if (!captchaToken) {
            var capSpan = qs(container, '#captchaError') || qs(form, '#captchaError');
            if (capSpan) capSpan.style.display = 'block';
            ok = false;
            } else {
            var capSpan = qs(container, '#captchaError') || qs(form, '#captchaError');
            if (capSpan) capSpan.style.display = 'none';
            }

  
          if (!ok) {
            var firstInvalid = ['RetailerName','RetailerLocation','PurchaseDate','Product','CustomerEmail','CustomerPhoneNumber'].find(function(id){
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
    try { 
      // hide the form
      form.style.display = 'none'; 
    } catch (e) {}
  
    if (successDiv) {
      successDiv.innerHTML = `
        <div class="alert alert-success">
          <h2>Information submitted successfully.</h2>
          <p>Thank you for taking the time to supply this information. We really appreciate it.</p>
        </div>`;
      
      // ensure visible (removes any inline hidden styles)
      successDiv.style.display = 'block';
    }
  
    // scroll into view nicely
    try {
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch(e){}
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
  