function getCurrentCulture() {
    return culture = navigator.language,
    culture || (culture = "en"),
    culture
}
function getCultureForDatepicker() {
    var n = getCurrentCulture();
    return n === "en-US" || n === "en" ? n = "" : n.startsWith("es-") ? n = "es" : n.startsWith("zh-") && (n = "zh"),
    n
}
function addSharingFunction() {
    window.__sharethis__.initialize()
}
function verifyCatpcha(n) {
    var t = n.find(".h-captcha").find("iframe").attr("data-hcaptcha-response");
    return t != ""
}
function bindContactForm() {
    $("#contactFormSuccess").hide();
    $("#contactFormContainer").show();
    var n = getCultureForDatepicker();
    $("#PurchaseDate").datepicker({
        language: n
    });
    $("#btnSubmitContact").click(function(n) {
        var t, i;
        n.preventDefault();
        $("#contactForm").valid() && (verifyCatpcha($("#contactForm")) ? ($("#captchaError").hide(),
        t = $("#contactForm").serializeArray(),
        (t.AuthenticationCode == undefined || t.AuthenticationCode == null || t.AuthenticationCode == "") && $("#ResultCode").val() != undefined && $("#ResultCode").val() != null && $("#ResultCode").val() != "" && (t[t.findIndex(n => n.name == "AuthenticationCode")].value = $("#ResultCode").val()),
        i = this,
        $(i).attr("disabled", "disabled"),
        $.ajax({
            url: buildUrl("/Home/SendMoreInfo", companyIdenfier, language),
            data: t,
            type: "POST",
            success: function() {
                $("#contactFormContainer").hide();
                $("#contactFormSuccess").fadeIn();
                $("#resetContact").on("click", function() {
                    var n = new URL(buildUrl("/Home/GetSendMoreInfo", companyIdenfier, language));
                    n.searchParams.append("c", t.AuthenticationCode);
                    $.ajax({
                        url: n,
                        type: "GET",
                        success: function(n) {
                            $("#contactformarea").html(n);
                            bindContactForm();
                            $(i).removeAttr("disabled")
                        }
                    })
                })
            },
            error: function(n) {
                n.status === 403 ? ($("#contactFormContainer").hide(),
                $("#contactFormFailure").fadeIn()) : $("#authresponse").html("<div class='alert alert-danger'>" + generalError + "<\/div>");
                $(i).removeAttr("disabled")
            }
        })) : $("#captchaError").show())
    })
}
function bindCarousels() {
    var n = $(".gfecarousel");
    n.carousel("cycle")
}
function storePosition(n) {
    longitude = n.coords.longitude;
    latitude = n.coords.latitude;
    accuracy = n.coords.accuracy;
    authenticateAutomatically != undefined && authenticateAutomatically && authenticate()
}
function moveOn(n) {
    console.warn(`ERROR(${n.code}): ${n.message}`);
    authenticateAutomatically != undefined && authenticateAutomatically && authenticate()
}
function buildUrl(n, t, i) {
    n = n.includes("Home/") ? n.replace("Home/", t + "/") : t + n;
    var n = new URL(n,window.location.origin);
    return i && n.searchParams.append("culture", i),
    n
}
function setupUtilitiesVisibility(n, t) {
    for (var u = t == "valid", r = 1; r <= $(".feaure_utility").length; r++) {
        var i = "#section_utility" + r
          , f = $(i).data("productsforshowingutility")
          , e = $(i).data("showonvalid") == "True";
        e ? u ? showUtility(f, n) ? $(i).parent().fadeIn(fadeTime) : $(i).parent().fadeOut(fadeTime) : $(i).parent().fadeOut(fadeTime) : $(i).parent().fadeIn(fadeTime)
    }
}
function showUtility(n, t) {
    var i, r;
    return n === "" || n === undefined || n == null ? !0 : t.toString() !== "" ? (i = [],
    i.push(n.toString().split("|")),
    r = !1,
    i[0].forEach(function(n) {
        n === t.toString() && (r = !0)
    }),
    r) : !1
}
function authenticate() {
    $("#authoutcome").fadeOut(fadeTime);
    $("#authresponse").html(loader);
    $("#authresponse").show();
    $("#contactFormSuccess").hide();
    $("#contactFormFailure").hide();
    $("#authloader").fadeIn(fadeTime);
    $("html, body").animate({
        scrollTop: parseInt($("#authresponse").offset().top)
    }, fadeTime);
    processAuthentication()
}
function processAuthentication() {
    var n = getAuthenticatioModel()
      , t = buildUrl("/Home/QRValidate", companyIdenfier, language);
    $.ajax({
        url: t,
        data: n,
        type: "POST",
        success: function(t) {
            setTimeout(function() {
                $("#authloader").fadeOut(fadeTime);
                $("#authresponse").html(t);
                $("#authoutcome").fadeIn(fadeTime);
                var i = $("#authoutcome").data("result")
                  , u = $("#authoutcome").data("product")
                  , f = $("#contactformarea").data("showinfochoice")
                  , r = !1;
                r = f == "ShowOnFakeAndInvalidResponse" ? i === "counterfeit" || i === "invalid" : !0;
                r && $("#reportLink").fadeIn(fadeTime);
                setupUtilitiesVisibility(u, i);
                fixView();
                codepresent ? window.setTimeout(function() {
                    $("#authform").remove();
                    $(".authbutton").remove()
                }, fadeTime) : $("#Code").val("");
                typeof runTNT == "function" && runTNT(n)
            }, spinnerDelay)
        },
        error: function(n) {
            n.status === 403 ? $("#authresponse").html("<div class='alert alert-danger'>" + forbiddenError + "<\/div>") : $("#authresponse").html("<div class='alert alert-danger'>" + generalError + "<\/div>")
        }
    })
}
function fixView() {
    $("#btnTryAgain").click(function() {
        $("#authresponse").fadeOut(fadeTime);
        $("#authoutcome").fadeOut(fadeTime);
        $("html, body").animate({
            scrollTop: parseInt($("#section_authenicate").offset().top) - 80
        }, fadeTime);
        $("#Code").focus()
    });
    $("#btnReportLink").click(function() {
        $("#contactformarea").fadeIn(fadeTime, function() {
            $("html, body").animate({
                scrollTop: parseInt($("#section_contact").offset().top) - 80
            }, fadeTime);
            bindContactForm();
            $("#reportLink").hide()
        })
    });
    $(".validcontainer").length && ($(".sharethis-inline-share-buttons").length && addSharingFunction(),
    typeof runMarketing == "function" && runMarketing());
    bindCarousels();
    var n = document.querySelector(".productVideo .video-js");
    n != null && hasVideo && videojs(n, {
        controlBar: {
            fullscreenToggle: !0
        }
    })
}
function getAuthenticatioModel() {
    var n = (new Date).getTimezoneOffset();
    return {
        Code: $("#Code").val(),
        Longitude: longitude,
        Latitude: latitude,
        Confidence: accuracy,
        Offset: n
    }
}
var longitude, latitude, accuracy;
$.ajaxSetup({
    beforeSend: function(n) {
        n.setRequestHeader("RequestVerificationToken", $("#RequestVerificationToken").val())
    }
});
$(document).ajaxComplete(function(n, t) {
    if (t.status == 301 || t.status == 307) {
        var i = null;
        try {
            i = $.parseJSON(t.responseText)
        } catch {}
        i != null && (i.responseCode == 301 || i.responseCode == 307) && (window.location.href = i.url)
    }
});
document.addEventListener("DOMContentLoaded", function() {
    var n, t, i;
    if ("IntersectionObserver"in window)
        n = document.querySelectorAll("img.lazy"),
        t = new IntersectionObserver(function(n) {
            n.forEach(function(n) {
                if (n.isIntersecting) {
                    var i = n.target;
                    i.src = i.dataset.src;
                    i.classList.remove("lazy");
                    t.unobserve(i)
                }
            })
        }
        ,{
            rootMargin: "0px 0px 500px 0px"
        }),
        n.forEach(function(n) {
            t.observe(n)
        });
    else {
        n = document.querySelectorAll("img.lazy");
        function t() {
            i && clearTimeout(i);
            i = setTimeout(function() {
                var i = window.pageYOffset;
                n.forEach(function(n) {
                    n.offsetTop < window.innerHeight + i + 500 && (n.src = n.dataset.src,
                    n.classList.remove("lazy"))
                });
                n.length == 0 && (document.removeEventListener("scroll", t),
                window.removeEventListener("resize", t),
                window.removeEventListener("orientationChange", t))
            }, 20)
        }
        document.addEventListener("scroll", t);
        window.addEventListener("resize", t);
        window.addEventListener("orientationChange", t)
    }
});
$("#authform").submit(function(n) {
    n.preventDefault();
    authenticate()
});
$(document).ready(function() {
    navigator.geolocation && navigator.geolocation.getCurrentPosition(storePosition);
    bindCarousels()
});
$(".authbutton").on("click", function() {
    $("#authform").valid() && authenticate()
})
