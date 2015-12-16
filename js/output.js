$(document).ready(function () {
	var bgPage = chrome.extension.getBackgroundPage();
	var params = getParamsFromUrl(document.URL);
	if (params["id"] != null)
	{
		this.body.innerHTML = bgPage.dataob[params["id"]];
	 }
	
});


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
