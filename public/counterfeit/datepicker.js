!function(a) {
    a.fn.datepicker.dates["en-IE"] = {
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        today: "Today",
        monthsTitle: "Months",
        clear: "Clear",
        weekStart: 1,
        format: "dd/mm/yyyy"
    }
}(jQuery);

// datepicker.js

window.initCounterfeitDatepicker = function initCounterfeitDatepicker() {
    // Example — adjust this part to your datepicker library
    const input = document.querySelector('#PurchaseDate');
    if (!input) return;
  
    // Example if you're using jQuery UI Datepicker:
    $(input).datepicker({
      dateFormat: 'dd/mm/yy',
      changeMonth: true,
      changeYear: true,
      yearRange: '1900:2099'
    });
  };
  
