var data = [];

var bShowNumber = false;
var prefs = null;
GetAllSettings2();

function GetAllSettings2(OnStart) {
    chrome.storage.sync.get(null, function(items) {
        prefs = items;
        console.log('successfully loaded');
        bShowNumber = prefs['showcount'];

        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (bShowNumber) {
                OnGetVideoCount();
            }
        });
    });
}


function OnGetVideoCount(event) {
    chrome.tabs.query({ active: true, currentWindow: true },
        function(activeTabs) {
            var tab = activeTabs[0];
            if (tab === undefined) return;

            var TabID = tab.id;
            if (tab.url.indexOf("chrome") === 0) return;

            chrome.tabs.executeScript(
                TabID, { file: 'js/getcontentdocumentsmall.js', allFrames: false });
        }
    );
}

chrome.runtime.onMessage.addListener(function(inmessage, sender, sendResponse) {
    if (inmessage["smallcontent"] === undefined) return;
    var innerHTML = inmessage["smallcontent"];

    var currentDocument = document.implementation.createHTMLDocument(sender.tab.url);
    currentDocument.documentElement.innerHTML = innerHTML;
    currentDocument.href = sender.tab.url;

    var links = [];
    buildLinks(currentDocument, links);

    var count = Math.floor(links.length);;
    if (count > 0) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#00FF00" });
    }
    else {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#FF0000" });
    }
    chrome.browserAction.setBadgeText({ text: count.toString(), tabId: sender.tab.id });
});


// buildLinks builds anchors from contentDocument and clipboard
function buildLinks(contentDocument, links) {
    if (links === null)
        links = [];

    var processedVids = [];

    /**
     *  Get all the anchors in the current page and append them to links.
     *  Anchors are handled specially, instead of getting just the vid
     *  through youTubePatterns, because innerHTML is useful as the default
     *  display title.
     */

    var anchors = contentDocument.getElementsByTagName("a");

    for (var i = 0; i < anchors.length; i++) {
        if (anchors[i].href) {
            var vid = '';

            if (isYouTubeLink(anchors[i].href)) {
                vid = getVidsFromText(anchors[i].href)[0];
                if (isValidVid(vid)) {
                    // Allow duplicates so that the getTitleAndDisplayTitle
                    // method can choose the best diplay title
                    links[links.length] = anchors[i]; // This is special
                    processedVids.push(vid);
                }
            }
            else if (anchors[i].href.indexOf('youtube.com/watch?') != -1) {
                // To deal with cases like the following:
                // http://www.youtube.com/watch?feature=player_embedded&v=U6Z6_sc9mLE
                // in which "v=" appears not after "watch?", but at some random place.
                vid = getParamsFromUrl(anchors[i].href)['v'];
                buildLinksForVids([vid], links, processedVids);
            }
        }
    }

    // Some times anchor.href is not proper; but the title has a valid YouTube URL
    // Ex: <a title="http://www.youtube.com/watch?v=Y4MnpzG5Sqc" 
    //        href="http://t.co/zeZUtIeg">
    //          youtube.com/watch?v=Y4Mnpz...
    //     </a>
    for (i = 0; i < anchors.length; i++) {
        if (anchors[i].title && isYouTubeLink(anchors[i].title)) {
            var vids = getVidsFromText(anchors[i].title);
            buildLinksForVids(vids, links, processedVids);
        }
    }

    //var t1 = new Date().getTime();    // Let it be;
    // will use during development

    var innerHTML = contentDocument.documentElement.innerHTML;

    if (innerHTML) {
        /*
            Scan the current page HTML to see if there are any patterns
            that look like YouTube URLs even though they are not hyper
            links.
        */

        var vids = getVidsFromText(innerHTML);
        buildLinksForVids(vids, links, processedVids);

        /*
         *  There are certain videos on YouTube pages hiding behind span
         *  tags. Video IDs of such videos are present in the
         *  "data-video-ids" property. The block below tries to form YouTube
         *  'watch' links based on such tags.
         */
        var dvIDpattern = /(")?(data-video-ids)(")?(\s)*=(\s)*"[^"]*"/ig;
        var dataVideoIds = innerHTML.match(dvIDpattern);
        if (dataVideoIds) {
            for (i = 0; i < dataVideoIds.length; i++) {
                var pattern = /(")?(data-video-ids)(")?(\s)*=(\s)*|"/g;
                var dvids = dataVideoIds[i].replace(pattern, "").split(",");

                buildLinksForVids(dvids, links, processedVids);
            }
        }

        //var t2 = new Date().getTime(); // Let it be;
        //will use during development
        //alert(t2 - t1);

        /*
         *  The following code block is needed to deal with the case like
         *  the following.
         *
         *      Ex1: <b>youtube</b>.com/watch?v=_1MMn25iWmo<button ...>...
         *      Ex2: <em>youtube</em>.com/watch?<em>v</em>=co1CU3-Ms5Q.
         *
         *  We will need to get "_1MMn25iWmo" and "co1CU3-Ms5Q" in these
         *  cases respectively.
        */

        // t2 = new Date().getTime();
        var text = stripHTML(innerHTML, 3);
        vids = getVidsFromText(text);

        var majorityLength = 11; // iccb.getMajorityLength(links);  // getMajorityLength is slow
        for (i = 0; i < vids.length; i++) {
            // Truncate the vids to the length of the most of the VIDs
            // so far.
            vids[i] = vids[i].substring(0, majorityLength);
        }
        buildLinksForVids(vids, links, processedVids);

        //var t3 = new Date().getTime();	// Let it be;
        // will use during development
        //alert(t3 - t2);
    }


}

var youTubeFilterPatterns =
    new RegExp("^http.+?http.+?youtube\\.com.+", "ig");

var youTubePatterns =
    new RegExp("(youtube\\.com\\/v\\/|\\/watch\\?v=|" +
        "youtube\\.com\\/embed\\/|\\/movie?v=|" +
        "youtu\\.be\\/|y2u\\.be\\/)([a-zA-Z0-9_-]{11})", "igm");

var patternToBeRemoved =
    new RegExp("(youtube\\.com\\/v\\/|\\/watch\\?(.)*v=|" +
        "youtube\\.com\\/embed\\/|\\/movie?v=|" +
        "youtu\\.be\\/|y2u\\.be\\/)", "igm");

var invalidVids = ["__video_id_", "__playlist_", null, ""];


// Some YouTube URLs
var watchUrlPrefix = "https://www.youtube.com/watch?v=";

// Works by side-effect; Updates the variable "links"
function buildLinksForVids(vids, links, processedVids) {

    if (!processedVids)
        processedVids = getVidsFromLinks(links);

    for (var j = 0; j < vids.length; j++) {
        var vid = vids[j];
        // Need not allow duplicates here, because there are no display
        // titles available for non-anchor URLs.
        // See the anchors code block above

        // with yetToBeProcessed(), this function becomes a bit slower;
        // but the overall responsiveness increases.
        if (isValidVid(vid) && yetToBeProcessed(vid, processedVids)) {
            var link = document.createElement("a");
            link.href = watchUrlPrefix + vid;
            links[links.length] = link;
            processedVids.push(vid);
        }
    }
}


function stripHTML(text, stripLevel) {
    try {
        // Based on the post by Lenka (http://stackoverflow.com/users/876375/lenka) on
        // http://stackoverflow.com/questions/822452/strip-html-from-text-javascript
        // and ThiefMaster (http://stackoverflow.com/users/298479/thiefmaster) on
        // http://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression

        var returnText = text;

        switch (stripLevel) {
            case 3:
                //-- remove all inside SCRIPT and STYLE tags
                returnText = returnText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gim, "");
                returnText = returnText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gim, "");
            // DO NOT break.

            case 2:
                //-- remove BR tags and replace them with line break
                returnText = returnText.replace(/<br>/gi, "\n");
                returnText = returnText.replace(/<br(\s)*\/>/gim, "\n");
            // DO NOT break.

            case 1:
                //-- remove all else
                returnText = returnText.replace(/<(?:.|\s|\n)*?>/gm, "");

                //-- get rid of more than 2 multiple line breaks:
                returnText = returnText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");

                //-- get rid of html-encoded characters:
                returnText = escapeEntities(returnText);

                //-- get rid of more than 1 spaces:
                returnText = returnText.replace(/(\s)+/gm, ' ');

                //-- strip space at the beginning and ending
                returnText = returnText.replace(/^(\s)+|(\s)+$/gm, "");

                break;

            default:
                returnText = escapeEntities(text.replace(/<(?:.|\n)*?>/gm, ''));
                break;
        }

        //-- return
        return returnText;
    }
    catch (e) {
        return escapeEntities(text.replace(/<(?:.|\n)*?>/gm, ''));
    }
}

function escapeEntities(inputText) {
    return inputText.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, "\"")
        .replace(/&nbsp;/gi, " ")
}



/**
 * yetToBeProcessed searchs for vid in vids
 *
 * @return
 *      true, if vid was found in vids;
 *      false, otherwise
 */
function yetToBeProcessed(vid, vids) {
    return vids.indexOf(vid) == -1;
}
// 
// /**
//  * Use this function when you are sure that what you are passing to it is a
//  * YouTube URL.
//  *
//  * @param ytURL: the YouTube URL to be scanned for vid
//  *
//  * @return
//  *      YouTube video-id found in ytURL
//  **/
function getVidFromUrl(ytURL) {
    try {
        return getParamsFromUrl(ytURL)["v"];
    }
    catch (error) {
        // Do nothing.
    }
    return "";
}

function getVidsFromLinks(links) {
    var vids = [];
    try {
        for (var i = 0; i < links.length; i++) {
            vids.push(getVidFromUrl(links[i].href));
        }
    }
    catch (error) {
        // Ignore
    }
    return vids;
}

function isValidVid(vid) {
    return (invalidVids.indexOf(vid) == -1 && vid.length > 10 && ! /[^a-zA-Z0-9_-]/.test(vid));
}


// getParamsFromUrl returns a dictionary of key-val pairs based on the query string in url
// returns null if there is no query string in the url
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

/**
 *
 * Use this function if you are not sure what kind of text you are passing
 * to it.
 *
 * @param text: the text to be scanned for YouTube video IDs.
 *
 * @return array of YouTube video IDs found in text
 *
 */
function getVidsFromText(text) {
    var vids = [];
    var results = text.match(youTubePatterns);
    if (results) {
        for (var i = 0; i < results.length; i++)
            vids.push(results[i].replace(patternToBeRemoved, ""));
    }
    return vids;
}

function isYouTubeLink(link) {
    // Reset the lastIndex to 0 so that the next regex pattern match will
    // happen from the beginning. This is a fix suggested by Phil, 
    // to overcome the problem of skipped anchors.
    youTubePatterns.lastIndex = 0;
    youTubeFilterPatterns.lastIndex = 0;

    if (youTubeFilterPatterns.test(link))
        return false;
    else
        return youTubePatterns.test(link);
}



