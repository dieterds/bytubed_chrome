var copybuttonstring = "<p><div class=\"center\"><button id=\"copytoclipboard\"><img src=\"gfx/Start-16.png\"> Copy all links to clipboard</button></div><p/>";
var sandboxstring = "<textarea hidden id=\"sandbox\"></textarea>";
var statusstring = "<p hidden id=\"copystatus\" class=\"center\"></p>"
$(document).ready(function() {
    var bgPage = chrome.extension.getBackgroundPage();
    var params = getParamsFromUrl(document.URL);
    if (params["data"] !== null && bgPage.data[params["data"]] !== undefined) {
        this.body.innerHTML = copybuttonstring + statusstring + bgPage.data[params["data"]] + sandboxstring;
    }
    else{
        this.body.innerHTML =  "No data under this ID !";
    }
    $('#copytoclipboard').click(function () {
        var linksToCopy = "";

        $('a[href*=http]').each(function (index, ele) {
            linksToCopy += ele.href + "\n";
        });
        $('#sandbox').show();
        try {
            setClipboard(linksToCopy);
            $('#copystatus').html("Successfully copied links to clipboard!");
        } catch (err) {
            $('#copystatus').html("Failed to copy links to clipboard!");
        }
        $('#sandbox').hide();
        $('#copystatus').show();
        $('#copystatus').fadeOut(3000);
    });
});

function setClipboard(str) {
    var sandbox = $('#sandbox').val(str).select();
    document.execCommand('copy');
    sandbox.val('');
}

function getParamsFromUrl(url) {
    try {
        if (url.indexOf("?") == -1)
            return null;

        var params = [];

        var qString = url.split("?")[1];
        var keyValPairs = qString.split("&");
        for (var i = 0; i < keyValPairs.length; i++) {
            var parts = keyValPairs[i].split("=");
            var key = unescape(parts[0]);
            var val = unescape(parts[1]);

            params[key] = val;
        }
        return params;
    }
    catch (error) {
        return null;
    }
}
