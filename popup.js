/* global queueingStatusManager */
/* global unescape */
/* global chrome */
// Todo
// - Subtitles?
// - In eigene Dateien wieder zurückpacken (VideolistManager.js, Downloadqueue.js)
// - erste seite quellcode geben lassen und nicht per request
// - mit content script alle daten per message an background script schicken und zwischenspeichern.
// - language
// wenn kein benutzender tab offen, aber clipboard, dann trotzdem machen. da muss ich wohl die handling prodezure in ne eigene prozedur packen

var LastClicked = null;
var ContextMenuID = "";
var prefs = null;
GetAllSettings2(true); // OnStart = true
// chrome.storage.clear();
// chrome.storage.sync.clear();

//  var views = chrome.extension.getViews();
//   for (var i = 0; i < views.length; i++) {
//       console.log(views[i].location.href);
//       //console.log(views[i].windowId);
//  };


function setClipboard(str) {
    var sandbox = $('#sandbox').val(str).select();
    document.execCommand('copy');
    sandbox.val('');
}

function getClipboard() {
    var result = '',
        sandbox = $('#sandbox').val('').select();
    if (document.execCommand('paste')) {
        result = sandbox.val();
    }
    sandbox.val('');
    return result;
}

function GetAllSettings2(OnStart) {
    chrome.storage.sync.get(null, function (items) {
        prefs = items;
        console.log('successfully loaded');

        $('#formatPreferenceNew').prop('selectedIndex', GetSetting('formatPreferenceNew'));
        $('#qualityNew').prop('selectedIndex', GetSetting('qualityNew'));
        $('#todo').prop('selectedIndex', GetSetting('todo'));
        $('#destination').attr('value', GetSetting('destination'));
        if (OnStart == true) {
            // Erst starten wenn die Settings geladen wurden.
            OnBeginRequestMulti();
        }
    });
}


function SetSetting(key, value) {
    if (prefs != null) {
        prefs[key] = value;
        chrome.storage.sync.set(prefs, function () { console.log('successfully saved'); });
    }
    else
        console.error('Error during saving!');
}

function GetSetting(key) {
    if (prefs != null)
        return prefs[key];
    else
        return 0;
}

$(document).ready(function () {

    $('#formatPreferenceNew').change(function (event) { 
        SetSetting(this.id, this.selectedIndex); });
    $('#qualityNew').change(function (event) { 
        SetSetting(this.id, this.selectedIndex); });
    $('#todo').change(function (event) { 
        SetSetting(this.id, this.selectedIndex); });
    $('#destination').keydown(function (event) { 
        SetSetting(this.id, this.value); });
                  
    // $('#loadsettings').click(function (event) {
    //     // console.log(GetSetting('formatPreferenceNew'));
    //     
    //     $('#formatPreferenceNew').prop('selectedIndex',
    //         GetSetting('formatPreferenceNew'));
    //     $('#qualityNew').prop('selectedIndex',
    //         GetSetting('qualityNew'));
    //     $('#todo').prop('selectedIndex',
    //         GetSetting('todo'));
    //     $('#destination').attr('value',
    //         GetSetting('destination'));
    // });

    $('#testbutton').click(function (event) { OnBeginRequestMulti(event); });
    // $('#testbutton').click(function (event) { OnBeginGetDocumentOne(event); });
    $('#loadsettings').click(function (event) { GetAllSettings2(); });
    $('#getcb').click(function (event) { getClipboard();});
    $('#setcb').click(function (event) { setClipboard($("#sandbox").val());});
    
    // $('#FilesTabButton').click(function (event) { OnTabClicked(event); });
    // $('#StatusTabButton').click(function (event) { OnTabClicked(event); });
    $('#filter').keyup(function (event) { onFilterChange(event); });
    $('#filter').focus();
    $('#selectAll').change(function (event) { onSelectAll(event); });
    $('#start').click(function (event) { onStart(event); });
    $('#cancel').click(function (event) { onCancel(event); });
    $('#help').click(function (event) { onHelp(event); });
    $('#options').click(function (event) { chrome.runtime.openOptionsPage(); });
    

    chrome.storage.onChanged.addListener(function (changed, areaName) {
        if (areaName == 'sync') {
            console.log('Settings changed');
            prefs = GetAllSettings2();
        };                
    });
    
      // $('button').toggleClass('VerticalCenter', true);
      // $('img').toggleClass('VerticalCenter', true);
      // $('label').toggleClass('VerticalCenter', true);
    // $(window).keypress(function (event) { keyPressed(event); });
    $('#links').on('contextmenu', function (event) { return false; onBuildContextMenu(event); });
    //$('#links').mouseleave(function (event) { onRemoveContextMenu(event) });    
    // $('#links').keydown(function (event) { onKeyDown(event) });
    // $('#selectfile').change(function (event) {
    //     console.log('event file picked' + event.target.files);
    // });

    // chrome.contextMenus.removeAll();
    // chrome.contextMenus.onClicked.addListener(function (info, tab)
    // {
    //     
    // }
    //OnBeginRequestOne();
    //OnBeginRequestMulti();
});

function SetActive(tab) {
    if (tab == 1) {
        $('#StatusTab').hide();
        $('#FilesTab').fadeIn();
        $('#FilesControlTab').fadeIn();
    }
    else if (tab == 2) {

        $('#FilesTab').hide();
        $('#FilesControlTab').hide();
        $('#StatusTab').fadeIn();
    }
}


// function OnTabClicked(event) {
//     if (event.target.id == 'FilesTabButton') {
//         SetActive(1);
// 
//     }
//     else if (event.target.id == 'StatusTabButton') {
//         SetActive(2);
//     }
// }

/**
 * fmtMap is a dictionary that maps itags to (fileType, resolution, quality)
 * Compute the resolution of "38" dynamically.
 **/

var fmtMap = {
    "5" :   {fileType: "flv",   resolution: "400x226",      quality: "240p",        color: "black"},
    "17":   {fileType: "3gp",   resolution: "",             quality: "144p",        color: "gray"},
    "18":   {fileType: "mp4",   resolution: "480x360",      quality: "360p",        color: "green"},
    "22":   {fileType: "mp4",   resolution: "1280x720",     quality: "720p",        color: "purple"},
    "34":   {fileType: "flv",   resolution: "640x360",      quality: "360p",        color: "green"},
    "35":   {fileType: "flv",   resolution: "854x480",      quality: "480p",        color: "lightblue"},
    "36":   {fileType: "3gp",   resolution: "",             quality: "240p",        color: "black"},
    "37":   {fileType: "mp4",   resolution: "1920x1080",    quality: "1080p",       color: "pink"},
    "38":   {fileType: "mp4",   resolution: "",             quality: "Original",    color: "red"},
    "43":   {fileType: "webm",  resolution: "640x360",      quality: "360p",        color: "green"},
    "44":   {fileType: "webm",  resolution: "854x480",      quality: "480p",        color: "lightblue"},
    "45":   {fileType: "webm",  resolution: "1280x720",     quality: "720p",        color: "purple"},
    "46":   {fileType: "webm",  resolution: "1920x1080",    quality: "1080p",       color: "pink"},
    "82":   {fileType: "mp4",   resolution: "640x360",      quality: "360p",        color: "green"},
    "84":   {fileType: "mp4",   resolution: "1280x720",     quality: "720p",        color: "purple"}
};

var Preferences = function()
{
    this.format             = "mp4";
    this.quality            = "720p";
    this.todo               = GENERATE_LINKS;
    
    this.preserveOrder      = false;
    this.ignoreFileType     = false;

//    this.showDLWindow           = false;
    this.closeQStatusWindow     = false;
    // this.suppressErrors         = false;     // Not needed
    // this.suppressWarnings       = false;     // Not needed
    
    this.fetchSubtitles         = false;
    this.subtitleLangCodes      = [];
    // this.tryOtherLanguages      = true;      // this is not needed.

    this.generateFailedLinks    = false;
    this.generateWatchLinks     = false;
    this.generateBadLinks       = false;
    this.generateGoodLinks      = false;
    
    this.destinationDirectory   = "";
    this.subtitleDest    = "";
};

// disable text selection
document.onselectstart = function() {
    return false;
};

function onSelectAll(event) {
    if (event.target.checked) {
        var selection = $('#links').children('tr');
        selection.toggleClass('selected', true);
        OnSelect();
    }
    else {
        applyFilter(document.getElementById("filter").value);
    }
}

function applyFilter(filterText) {

    var selection = $('#links').children('tr');

    if (filterText == "") {
        $('#selectAll')[0].checked = false;
        selection.toggleClass('selected', false);
        OnSelect();
        return;
    }
    else {
        $('#selectAll')[0].checked = false;
        var pattern = new RegExp(filterText, "i");
        var i = 0;
        for (i = 0; i < videoList.length; i++) {
            if (pattern.test(videoList[i].displayTitle)) {
                $(selection[i]).toggleClass('selected', true);
            }
            else {
                $(selection[i]).toggleClass('selected', false);
            }
        }
        OnSelect();
    }
}

function onFilterChange(event) {
    var filterText = event.target.value.replace(/^\s+|\s+$/g, "");
    applyFilter(filterText);
}

function onBuildContextMenu(event) {

    if (ContextMenuID == "") {
        onRemoveContextMenu(event);
        var title = "Test '" + "browser_action" + "' menu item";
        ContextMenuID = chrome.contextMenus.create({ "title": title, "contexts": ["page"], "onclick": genericOnClick });
    }
}

function onRemoveContextMenu(event) {
    chrome.contextMenus.removeAll();
    ContextMenuID = "";
}

function genericOnClick(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
}

function setStatus(statusMessage)
{
       $("#status").html(statusMessage);
}

function OnSelect() {
    if (videoList.length > 0) {
        var count = $('#links').children('tr.selected').length;
        setStatus(count + "/" +
            videoList.length +
            " " + strings.getString("VideosSelected"));
    }
}


var strings = 
{ 
    getString : function(MessageID) { 
        return chrome.i18n.getMessage(MessageID);
        },
      getFormattedString: function getFormattedString(MessageID, args) {
        return chrome.i18n.getMessage(MessageID, args);
    }
};

function keyPressed(event) {

    // if (event.keyCode == 13 && event.target.tagName != "button" && event.target.tagName != "menulist") {
    //     onStart(event);
    // }
    // else
    //     if (
    //     (event.target.tagName != "textbox" ||
    //         event.target.value == "")
    //     &&
    //     (event.charCode == 65 || event.charCode == 97)
    //     &&
    //     event.ctrlKey) {
    //     onSelectAll(event);
    // }
    //     else
    //         if (event.keyCode == event.DOM_VK_F1) {
    //     onHelp(event);
    // }    
}

function onBrowse(event) {

}

function onBrowseSubtitles(event) {
 
}

function onStart(event) {
    var selection = $('#links').children('tr');
    var destination = document.getElementById("destination");
    destinationDirectory = destination.value
        .replace(/^\s*/, "")
        .replace(/\s*$/, "");   

    var selCount = 0;
    var i = 0;

    var selectedVideoList = [];

    for (i = 0; i < videoList.length; i++) {
        videoList[i].selected = $(selection[i]).hasClass('selected');
        if (videoList[i].selected) {
            selectedVideoList[selCount++] = videoList[i];
        }
    }

    var preferences = new Preferences();
    // Preferences section begins
    var i1 = document.getElementById("formatPreferenceNew").selectedIndex;
    preferences.format = supportedFormats[i1];

    var i2 = document.getElementById("qualityNew").selectedIndex;
    preferences.quality = supportedQualities[i2];

    var i3 = document.getElementById("todo").selectedIndex;
    preferences.todo = i3;
    preferences.showDLWindow = prefs["showDLWindow"];
    preferences.closeQStatusWindow = prefs["closeQStatusWindow"];
    preferences.preserveOrder = prefs["preserveOrder"];
    preferences.generateFailedLinks = prefs["generateFailedLinks"];
    preferences.generateWatchLinks = prefs["generateWatchLinks"];
    preferences.generateBadLinks = prefs["generateBadLinks"];
    preferences.generateGoodLinks = prefs["generateGoodLinks"];
    preferences.ignoreFileType = prefs["ignoreFileType"];
    preferences.fetchSubtitles = prefs["fetchSubtitles"];
    preferences.tryOtherLanguages = prefs["tryOtherLanguages"]; // this is not needed.
            
//     preferences.tryOtherDialects = prefs["tryOtherDialects"];
//     preferences.destinationDirectory = destinationDirectory; // Used in processing subtitles
//     preferences.subtitleDest = document.getElementById("subtitleDest").value;
// 
//     if (preferences.fetchSubtitles) {
//         var subtitleLangList = document.getElementById("subtitleLangList");
// 
//         if (subtitleLangList && subtitleLangList.selectedItem && subtitleLangList.selectedItem.value)
//             preferences.subtitleLangCodes[0] = subtitleLangList.selectedItem.value;
// 
//         var secondaryLanguages = document.getElementsByClassName("secondaryLanguage");
// 
//         for (var i = 0; i < secondaryLanguages.length; i++)
//             if (secondaryLanguages[i].selectedItem && secondaryLanguages[i].selectedItem.value)
//                 preferences.subtitleLangCodes[i + 1] = preferences.fetchSubtitles ? secondaryLanguages[i].selectedItem.value : "";
//     }

    // Preferences section ends
            
    if (selCount > 0) {
        var proceed = true;
        if (selCount > 5 &&
            preferences.todo == ENQUEUE_LINKS &&
            suppressWarnings == false) {

            proceed = confirm(
                strings.getString("NotGoodIdea") + strings.getString("NotGoodIdeaMessage"));
            // proceed is true if OK was pressed, false if cancel.
        }

        if (proceed) {
            //var statuswindow = window.open(chrome.runtime.getURL('queueingStatusManager.html'));
            //statuswindow.guggi = 23;

            var qsr = queueingStatusManager;
            qsr.SetParams(selectedVideoList, destinationDirectory, preferences, invocationInfo, subtitleLanguageInfo);
            qsr.onLoad();
            // window.openDialog(
            //     "chrome://BYTubeD/content/queueingStatusManager.xul",
            //     "queueingStatusManager" + (new Date()).getTime(),
            //     "chrome,all,menubar=no,width=680,height=480,left=80,top=80",
            //     selectedVideoList,
            //     destinationDirectory,
            //     preferences,
            //     invocationInfo,
            //     subtitleLanguageInfo
            //     );

            // window.close();
        }
    }
    else {
        alert(strings.getString("Selection") +
            strings.getString("NothingSelected"));
    }
}

function onCancel(event) {
    window.close();
}

function onHelp(event) {
    chrome.tabs.create({ active: false, url: helpPageLink });
}


var videoList = [];
var destinationDirectory = null;
var invocationInfo = null;
var subtitleLanguageInfo = [];
var aborting = false;
var locked = false;

// Constants for preference.todo
var GENERATE_LINKS = 0;
var ENQUEUE_LINKS = 1;

// Suppress error/warning messages
var suppressErrors = false;
var suppressWarnings = false;




/////////////////////////////////////////
// Javascript GetContentDocument Start //
/////////////////////////////////////////
// var LocalActiveTabs = 0;
// var LocalActiveTabsHTML = {};
// var LocalTabIDs = [];
// 
// function OnBeginGetDocumentOne() {
//     LocalActiveTabs = 0;
//     LocalActiveTabsHTML = {};
//     LocalTabIDs = [];
//     chrome.tabs.query({ active: true, currentWindow: true },
//         function (activeTabs) {
//             var tab = activeTabs[0];
//             var TabID = tab.id;
//             if (tab.url.indexOf("chrome") == 0) return;
//             LocalTabIDs.push(TabID);
//             LocalActiveTabs = LocalTabIDs.length;
//             chrome.tabs.executeScript(
//                 TabID, { file: 'getcontentdocument.js', allFrames: false });
//         }
//         );
// };
// 
// function OnBeginGetDocumentMulti() {
//     var scanAllTabs = prefs["scanAllTabs"];
//     LocalActiveTabs = 0;
//     LocalActiveTabsHTML = {};
//     LocalTabIDs = [];
//     
//     // Tabs
//     chrome.tabs.query({ currentWindow: true },
//         function (activeTabs) {
//             for (var index = 0; index < activeTabs.length; index++) {
//                 var tab = activeTabs[index];
//                 // Chrome URLs überspringen
//                 if (tab.url.indexOf("chrome") == 0) { console.warn(tab.url + ' skipped!'); continue }
//                 //console.log(tab.url);
//                                 
//                 // Alle Tabs
//                 if (scanAllTabs) {
//                     // Active Tab an den Anfang
//                     if (tab.active) {
//                         console.info(tab.url);
//                         LocalTabIDs.unshift(tab.id);
//                     }
//                     // Sonst ans Ende
//                     else {
//                         console.info(tab.url);
//                         LocalTabIDs.push(tab.id);
//                     }
//                 }
//                 // Nur aktiver Tab
//                 else
//                     if (tab.active) {
//                         console.info(tab.url);
//                         LocalTabIDs.unshift(tab.id);
//                     }
//             }
//             LocalActiveTabs = LocalTabIDs.length;
// 
//             for (var index = 0; index < LocalTabIDs.length; index++) {
//                 var TabID = LocalTabIDs[index];
//                 chrome.tabs.executeScript(
//                     TabID, { file: 'getcontentdocument.js', allFrames: false });
//             }
//         });
// };
// 
// 
// chrome.runtime.onMessage.addListener(function (inmessage, sender, sendResponse) {
// 
//     //if (sender.tab == null) return;
//     console.log(sender.tab ?
//         "from a content script:" + sender.tab.url :
//         "from the extension");
//     var currentDocument = document.implementation.createHTMLDocument(sender.tab.url);
//     currentDocument.documentElement.innerHTML = inmessage;
//     currentDocument.href = sender.tab.url;
//     LocalActiveTabsHTML[sender.tab.url] = currentDocument;
//     LocalActiveTabs--;
// 
//     if (LocalActiveTabs == 0) {
//         //starten, alle elemente da.
//         console.log('Sind fertig, könnten starten!');
// 
//         var links = new Array;
// 
//         for (var key in LocalActiveTabsHTML) {
//             if (LocalActiveTabsHTML.hasOwnProperty(key)) {
//                 currentDocument = LocalActiveTabsHTML[key];
//                 buildLinks(currentDocument, links);
//             }
//         }
// 
//        
//         // If no YouTube links were found on 'this' page, alert the user
//         // "No YouTube links were found on this page."
//         if (links.length == 0) {
// 
//             var message = "NoLinksOnPage";
//             message += ".";
// 
//             alert(message);
// 
//             // selMgr.aborting = true;
//             // window.close();
//         }
//         else {
//             invocationInfo = new InvocationInfo();
//             invocationInfo.timeStamp = new Date().toString();
//             invocationInfo.sourcePageUrl = currentDocument.URL;
//             invocationInfo.sourcePageTitle = currentDocument.URL;
//             if (currentDocument.title && currentDocument.title.length > 0)
//                 invocationInfo.sourcePageTitle = currentDocument.title;
//                
//             // populate the videoList before applying default fliters
//             buildVideoList(links); // works by side-effect
//             setStatus(videoList.length +
//                 " " + strings.getString("LinkCountOnPage"));
//             loadFlags();
//         }
//     }
// });
////////////////////////////////////////
// Javascript GetContentDocument Ende //
////////////////////////////////////////

////////////////////////////
// Mit Ajax Request Start //
////////////////////////////
function OnBeginRequestMulti() {
    var scanAllTabs = prefs["scanAllTabs"] ? prefs["scanAllTabs"] : false;
    var scanCB = prefs["scanClipboard"] ? prefs["scanClipboard"] : false;
    var LocalTabURLs = [];
    
    
    // Tabs
    chrome.tabs.query({ currentWindow: true },
        function (activeTabs) {
            for (var index = 0; index < activeTabs.length; index++) {
                var tab = activeTabs[index];
                // Chrome URLs überspringen
                if (tab.url.indexOf("chrome") == 0) { console.warn(tab.url + ' skipped!'); continue }
                //console.log(tab.url);
                
                
                // Alle Tabs
                if (scanAllTabs) {
                    // Active Tab an den Anfang
                    if (tab.active) {
                        console.info(tab.url);
                        LocalTabURLs.unshift(tab.url);
                    }
                    // Sonst ans Ende
                    else {
                        console.info(tab.url);
                        LocalTabURLs.push(tab.url);
                    }
                }
                // Nur aktiver Tab
                else
                    if (tab.active) {
                        console.info(tab.url);
                        LocalTabURLs.unshift(tab.url);
                    }
            }

            AjaxRequestsMulti(LocalTabURLs,
                function (data) {
                    //console.log('callback');                                    

                      
                    //starten, alle elemente da.
                    // console.log('Sind fertig, könnten starten!');
                    var currentDocument;
                    var links = [];

                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            currentDocument = data[key];
                            buildLinks(currentDocument, links);
                        }
                    }

                    if (scanCB) {
                        getLinksFromClipboard(links);
                    }                                       
        
                    // If no YouTube links were found on 'this' page, alert the user
                    // "No YouTube links were found on this page."
                    if (links.length == 0) {

                        var message = "NoLinksOnPage";
                        message += ".";

                        alert(message);
                    }
                    else {
                        invocationInfo = new InvocationInfo();
                        invocationInfo.timeStamp = new Date().toString();
                        invocationInfo.sourcePageUrl = currentDocument.URL;
                        invocationInfo.sourcePageTitle = currentDocument.URL;
                        if (currentDocument.title && currentDocument.title.length > 0)
                            invocationInfo.sourcePageTitle = currentDocument.title;
                
                        // populate the videoList before applying default fliters
                        buildVideoList(links); // works by side-effect
                        setStatus(videoList.length +
                            " " + strings.getString("LinkCountOnPage"));

                        loadFlags();
                    }

                },
                function (data) {
                    console.log('failedcallback');
                });

        });
}


function getLinksFromClipboard(links) {

    var clipboardText = getClipboard();
    var vids = getVidsFromText(clipboardText);
    var processedVids = getVidsFromLinks(links);
    var majorityLength = 11; // getMajorityLength(links); // getMajorityLength is slow
    for (var i = 0; i < vids.length; i++) {
        // Truncate the vids to the length of the most of
        // the VIDs so far.
        vids[i] = vids[i].substring(0, majorityLength);
    }

    buildLinksForVids(vids, links, processedVids);
};

///////////////////////////
// Mit Ajax Request Ende //
///////////////////////////


/**
 * Cross-Browser AJAX request (XMLHttpRequest)
 *
 * @param string url The url of HTTP GET (AJAX) request.
 * @param function callback The callback function if the request succeeds.
 * @param function failCallback The callback function if the request fails.
 */
var AjaxRequest = function (url, callback, failCallback) {
    try {


        var xmlhttp;
        xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200)
                    callback(xmlhttp.response, url);
                else
                    failCallback(url);
            }
        };

        xmlhttp.responseType = "document";
        xmlhttp.open("GET", url, true);
        xmlhttp.setRequestHeader("Access-Control-Allow-Origin", "*");
        xmlhttp.send();
    } catch (error) {
        console.error(error);
    }
};

/**
 * Issue Multiple AJAX requests to get data, and a single callback is called
 * after all AJAX requests ar completed successfully.
 *
 * @param {Array} urls The urls of HTTP GET (AJAX) requests.
 * @param function callbackMulti The callback function to be run after all
 *                                 AJAX requests are completed successfully.
 *                                 The callbackMulti takes one argument, which
 *                                 is data object of url-responseText pairs.
 * @param function failCallbackMulti The callback function to be run if one of
 *                                     the AJAX requests fails.
 */
var AjaxRequestsMulti = function (urls, callbackMulti, failCallbackMulti) {
        // var isAllCallsCompleted = false;
        var isCallFailed = false;
        var data = {};        
        for (var i = 0; i < urls.length; i++) {
            var callback = function (responseText, url) {
                if (isCallFailed) return;

                data[url] = responseText;

                // get size of data
                var size = 0;
                for (var index in data) {
                    if (data.hasOwnProperty(index))
                        size++;
                }

                if (size == urls.length)
                    // all AJAX requests are completed successfully
                    callbackMulti(data);
            };

            var failCallback = function (url) {
                isCallFailed = true;
                failCallbackMulti(url);
            };

            AjaxRequest(urls[i], callback, failCallback);
        }
};


// processYouTubePage takes the HTML source of a YouTube page and returns swf_map
// containing title, author, fmt_list and url_encoded_fmt_stream_map
function processYouTubePage(html) {

    var swf_map = {};

    
        var i1 = html.indexOf("<title>") + 7;
        var i2 = html.indexOf("</title>");
        var title = unescape(html.substring(i1, i2));

        swf_map["display_title"] = stripHTML(title, 3).replace("YouTube -", "").replace("- YouTube", "");

        title = processTitle(title);

        var argsString = "";
        var argsStringMatch = html.match(/\"args\":\s*\{.*\},/);


        // tool
        //https://r9---sn-4g57km7e.googlevideo.com/videoplayback?dur=145.426&mime=video/mp4&itag=22&upn=lmm836bR-70&nh=EAM&ipbits=0&sver=3&signature=9DF906948EDA2AA7CB1715B2F265CBC0727CDF46.A53BA8E2336A42A70A87CC5C3498E4342D9F5443&fexp=9405183,9406010,9407662,9408142,9408420,9408710,9413420,9413503,9415304,9415436,9415488,9416104&initcwndbps=2341250&key=yt5&expire=1433861517&sparams=dur,id,initcwndbps,ip,ipbits,itag,mime,mm,mn,ms,mv,nh,pl,ratebypass,requiressl,source,upn,expire&requiressl=yes&mn=sn-4g57km7e&source=youtube&mm=31&ratebypass=yes&ip=192.35.17.17&ms=au&id=294dd7b1c93bab2d&mv=m&pl=22&mt=1433839877&type=video/mp4;%20codecs&quality=hd720&fallback_host=tc.v22.cache7.googlevideo.com&title=Add-on%20Debugger%20-%20Firefox%20Developer%20Tools
        //
        //https://r9---sn-4g57km7e.googlevideo.com/videoplayback?key=yt5&mime=video/mp4&expire=1433861580&sver=3&ipbits=0&itag=22&pl=22&initcwndbps=2341250&dur=145.426&source=youtube&ratebypass=yes&requiressl=yes&nh=EAM&id=294dd7b1c93bab2d&ip=192.35.17.17&fexp=9405183,9406010,9407662,9408142,9408420,9408710,9413420,9413503,9415304,9415436,9415488,9416104&sparams=dur,id,initcwndbps,ip,ipbits,itag,mime,mm,mn,ms,mv,nh,pl,ratebypass,requiressl,source,upn,expire&signature=42B30A535E085D14B50274AF1A21B39812FB2F54.819B9952F42ABC5C030D6B53DFA304BD37688126&ms=au&mv=m&mt=1433839877&mn=sn-4g57km7e&mm=31&upn=zUD9h7r1H9M&fallback_host=tc.v22.cache7.googlevideo.com&quality=hd720

        if (argsStringMatch) {
            argsString = argsStringMatch[0];
            i1 = argsString.indexOf("args\":") + 8;
            i2 = argsString.indexOf("},", i1);
            argsString = argsString.substring(i1, i2).replace(/\\\//g, "/").replace(/\\u0026/g, "&");
            console.log('args found on ' + title + '!');
        }
        else {
            console.log('no args found on ' + title + '!');
            return swf_map;
        }

        var keyValPairs = argsString.split(",\"");

        var fmt_list = "";
        var url_encoded_fmt_stream_map = "";
        var length_seconds = "Unknown";

        var author = "";
        var authIndex1 = argsString.indexOf("author=");
        var authIndex2 = argsString.indexOf("&", authIndex1);
        if (authIndex1 != -1 && authIndex2 != -1) {
            author = argsString.substring(authIndex1 + 7, authIndex2);
        }

        for (var i = 0; i < keyValPairs.length; i++) {
            //console.log('splitting ' + keyValPairs[i]);
            var key = keyValPairs[i].split(":")[0];
            var val = keyValPairs[i].split(":")[1];
            //console.log(html);

            	if (key === undefined) continue;
            	if (val === undefined) continue;


            //11:30:44.152 Array [ "loeid":"916634,936122,937517,9407134,9407641,9412773,9412928,9413020,9413057,9414871,9415054,9415488","iv3_module":"1","cafe_experiment_id":"56702029","ptk":"thegamestation","thumbnail_url":"https://i.ytimg.com/vi/bCRsPEhvXqw/default.jpg","adaptive_fmts":"projection_type=1&url=https%3A%2F%2Fr18---sn-4g57km76.googlevideo.com%2Fvideoplayback%3Fsignature%3DA6770F80F56AEF80BE04836C8936183FCED913A3.E4B46CD077C860A1144358868EFA2E5868D5B45D%26upn%3D_uMktUYPurY%26sparams%3Dclen%252Cdur%252Cgir%252Cid%252Cinitcwndbps%252Cip%252Cipbits%252Citag%252Ckeepalive%252Clmt%252Cmime%252Cmm%252Cmn%252Cms%252Cmv%252Cnh%252Cpl%252Crequiressl%252Csource%252Cupn%252Cexpire%26ipbits%3D0%26id%3D6c246c3c486f5eac%26initcwndbps%3D1918750%26source%3Dyoutube%26lmt%3D1426154834525199%26ip%3D192.35.17.17%26key%3Dyt5%26expire%3D1433863843%26dur%3D724.623%26sver%3D3%26requiressl%3Dyes%26mv%3Dm%26mt%3D1433842219%26ms%3Dau%26mn%3Dsn-4g57km76%26mm%3D31%26gir%3Dyes%26fexp%3D916634%252C936122%252C937517%252C9407134%252C9407"[…] ]1 videoListManager.js:214:12


            key = key.replace(/\"/g, "");
            val = val.replace("\",", "").replace(/\"/g, "");
            //console.log('splitted to key: ' + key + ' value: ' + val);

            if (key.indexOf("fmt_list") != -1)
                fmt_list = val;

            if (key.indexOf("url_encoded_fmt_stream_map") != -1) {
                url_encoded_fmt_stream_map = val.replace(/\\\//g, "/").replace(/\\u0026/g, "&");
            }

            if (key.indexOf("length_seconds") != -1)
                length_seconds = val;
        }

        swf_map["title"] = title;
        swf_map["author"] = author;
        swf_map["fmt_list"] = fmt_list;
        swf_map["length_seconds"] = length_seconds;
        swf_map["url_encoded_fmt_stream_map"] = url_encoded_fmt_stream_map;

    return swf_map;
}

// getFailureString(youTubePageHTML)
function getFailureString(aHTMLString) {
    var failureString = "";
    if (aHTMLString && aHTMLString != "") {


        var htmlDoc = document.implementation.createHTMLDocument("example");
        htmlDoc.documentElement.innerHTML = aHTMLString;

        // var htmlDoc = parser.parseFromString(aHTMLString, "text/html");
        
        if (htmlDoc.getElementsByClassName("verify-age").length > 0) {
            failureString = htmlDoc.getElementsByClassName("verify-age")[0].innerHTML;
        }

        if (htmlDoc.getElementById("unavailable-message")) {
            failureString = htmlDoc.getElementById("unavailable-message").innerHTML;
        }
        
        // Remove anchors from failureString.
        failureString = failureString.replace(/<a [^>]*>/ig, "").replace(/<\/a(\s|\n)*>/ig, "");
    }

    if (failureString == "")
        failureString = strings.getString("GenericFailureMessage");

    return failureString;
}

function buildVideoList(links) {
    
    var vidCount = 0;
    //var treeChildren = document.getElementById("treeChildren");
    var prefetchingEnabled = prefs["prefetch"];

    var ti = document.getElementById("links");
    while (ti.children.length > 1) {
         ti.removeChild(ti.children[ti.children.length - 1])
  	  }

    for (var li = 0; li < links.length; li++) {
        // li stands for link index
        links[li].href = unescape(links[li].href);

        // This is faster than getVidFromUrl
        // probably because of instruction caching.
        var curVid = getVidsFromText(links[li].href)[0];
        if (!curVid || curVid == "")
            continue;

        var title = "";
        var displayTitle = "";

        var tNdt = getTitleAndDisplayTitle(links[li]);
        title = tNdt[0];
        displayTitle = tNdt[1];

        // Insert curVid in videoList if it is not already there.
        var found = false;
        var vi = 0;
        for (vi = 0; vi < videoList.length; vi++)
            if (videoList[vi].vid == curVid) {
                found = true;
                break;
            }

        if (found && !hasUndesirablePatterns(title) &&
            videoList[vi].title.length < title.length) {
            document.getElementById("title" + vi).innerText = displayTitle;
            videoList[vi].title = title;
            videoList[vi].displayTitle = displayTitle;
        }

        if (displayTitle.length == 0 || hasUndesirablePatterns(displayTitle)) {
            displayTitle = "Loading";
            title = "";
        }

        if (found == false) {
            videoList[vidCount] = new YoutubeVideo(); // <- videoListManager.js

            videoList[vidCount].vid = curVid;
            videoList[vidCount].title = title;
            videoList[vidCount].displayTitle = displayTitle;
            
            var tr = document.createElement("tr");
            tr.id = "tr" + vidCount;

            var tc1 = document.createElement("td");
            tc1.innerText = (vidCount + 1).toString();
            tc1.id = "sno" + vidCount.toString();

            $(tr).click(function (event) {

                if (event.shiftKey) { // wenn letztes, dann zwischen letztes und aktuelles alle ab/-wählen, sonst nur neues auswählen
                    if (LastClicked) {
                        var nextlist = $(LastClicked).nextUntil(this, "tr");
                        var prevlist = $(LastClicked).prevUntil(this, "tr");
                        if (prevlist.length != $(LastClicked).prevAll("tr").length) {
                            prevlist.toggleClass('selected');
                        }
                        else {
                            nextlist.toggleClass('selected');
                        }
                        $(this).toggleClass("selected");
                    }
                    else {
                        $(this).toggleClass("selected", true);
                    }
                }
                else if (event.ctrlKey) { // vorhandene lassen und neues dazu ab-/wählen
                    $(this).toggleClass("selected");
                }
                else { // Alle abwählen und dann neues auswählen
                    $(this).siblings('tr').toggleClass("selected", false);
                    $(this).toggleClass("selected", true);
                }
                LastClicked = this;
                OnSelect();
            });
                       
            $(tr).toggleClass("selected")

            tr.appendChild(tc1);

            var tc2 = document.createElement("td");
            tc2.innerText = displayTitle;
            tc2.id = "title" + vidCount.toString();
            tr.appendChild(tc2);

            var tc3 = document.createElement("td");
            tc3.innerText = "Unknown";
            tc3.id = "maxResolution" + vidCount.toString();
            tr.appendChild(tc3);

            var tc4 = document.createElement("td");
            tc4.innerText = "Unknown";
            tc4.id = "maxQuality" + vidCount.toString();
            tr.appendChild(tc4);

            var tc5 = document.createElement("td");
            tc5.innerText = "Unknown";
            tc5.id = "clipLength" + vidCount.toString();
            tr.appendChild(tc5);

            ti.appendChild(tr);

            vidCount++;
        }

        // Prefetch when prefetchingEnabled or the title has
        // some undesirable patterns or title is too short
        if (!found && (prefetchingEnabled || hasUndesirablePatterns(title) || title.length < 4)) {
            initiatePrefetching(this, curVid);
        }
    }
}


function loadFlags() {

    // onSelectAll();
    // togglePrefetching();
    // toggleFormatDisabled();
    // toggleFetchSubtitles();
    // toggleTryOtherLanguages();
    // toggleScanTabs();
}


function resizeWindow() {
}

function centerWindow() {
}

function maintainAspectRatio() {
}


// YoutubeVideo is an ADT that encapsulates some properties related to a YouTube video
// in the context of BYTubeD.
function YoutubeVideo() {
    this.vid = "";
    this.title = "";
    this.displayTitle = "";

    this.prefetched = false;    // Set to TRUE when prefetched.

    this.availableFormats = [];

    this.videoURL = "";       // This is the downloadable URL of this video.

    this.selected = false;    // Set by selectionManager to indicate that
    // this video needs to downloaded.
    this.fileType = "";       // This is the preferred file format (Ex: .mp4) for this video.

    this.videoQuality = "";       // Used in the quality column on the generated links page
    
    this.availableSubtitleLanguages = null;    // Array of language records in which subtitles are available for this video
    // indexed by lang_code
    this.actualPrefLang = null;
    this.actualPrefLangName = null;
    this.fetchedLangName = null;

    this.failureDescription = null;

    this.swfMap = null;
    this.expiryTime = null;

    this.author = "";
    this.resolution = "";
}

// End of YoutubeVideo ADT definition.
/**
 * hasUndesirablePatterns checks if a YouTube link has certain non-title text
 * as title for the video
 *
 * @param str: The string to be tested for the presence of undesirable patterns.
 *
 * @return
 *      true, if str has undesirable patterns;
 *      false, otherwise
 */
function hasUndesirablePatterns(str) {
    return undesirablePattern.test(str);
}


// getIndexByKey returns the index of objList for which objList[index][key] and value areEqual.
// areEqual is the function to use to say whether two 'things' are equal.
// returns -1 if key is not found in objList[i] or objList[i][key] != value for any i.
function getIndexByKey(objList, key, value, areEqual) {
    // This function is only for integer-indexed objLists. 
    // Use a different function for string-indexed objLists.
    
    
    //for(var i in objList) // don't use this kind of indexing here. it generates only 'string' index.
    for (var i = 0; i < objList.length; i++) {
        if (key in objList[i] && areEqual(objList[i][key], value)) {
            return i;
        }
    }
}

function initiatePrefetching(selMgr, vid) {

        
    // var videoInfoUrlPrefix = videoInfoUrlPrefix;    // <- videoListManager.js
    // var getIndexByKey = getIndexByKey;         // <- globals.js
    var XHRManager = XmlHttpRequestManager; // <- xmlHttpRequestManager.js
            
    // Check if the video was already prefetched before intiating prefetch
    var ind = getIndexByKey(videoList, "vid", vid, function (x, y) { return x == y; });
                    
    // Don't fetch again if it was already fetched.
    if (ind != -1 && !videoList[ind].prefetched) {
        // Don't install a localErrorHanlder for these requests.
        // That will lead to failureDescription being non-null.
        // videoListManager checks for nullity of failureDescription
        // to issue requests.
        var xmlReq = new XHRManager(this, setTitleUsingInfo, null);
        xmlReq.doRequest("GET", videoInfoUrlPrefix + vid);
    }
}

function setTitleUsingInfo(selMgr, info, url) {


    var localErrorHanlder = function localErrorHanlder(html, requestedUrl) {

        var failureString = getFailureString(html);

        var vid = getParamsFromUrl(requestedUrl)["v"];
        var ind = getIndexByKey(videoList, "vid",
            vid, function (x, y) { return x == y; });

        if (ind != -1) {
            videoList[ind].failureDescription = failureString;
            var display = "(" + stripHTML(failureString, 3) + ")";

            if (getValueAt(ind, "title") == strings.getString("Loading")) {
                setValueAt(ind, "title", display);
            }
        }
    };

    var XHRManager = XmlHttpRequestManager;

    var vid = url.split("video_id=")[1];
    var swf_map = preprocessInfo(info);

    if (swf_map["status"] == "fail") {
        var xmlReq = new XHRManager(selMgr, setTitleUsingYouTubePageInfo, localErrorHanlder);
        xmlReq.doRequest("GET", watchUrlPrefix + vid);
    }
    else {
        var failureString = strings.getString("GenericFailureMessage");
        selMgr.setFieldsCommonCode(selMgr, vid, swf_map, failureString);
    }
}

function setTitleUsingYouTubePageInfo(selMgr, html, url) {

    var vid = url.split("?v=")[1];
    var swf_map = processYouTubePage(html);
    var failureString = getFailureString(html);

    setFieldsCommonCode(selMgr, vid, swf_map, failureString);
}


function setFieldsCommonCode(selMgr, vid, swf_map, failureString) {


    var ind = getIndexByKey(videoList, "vid", vid, function (x, y) { return x == y; });

    if (ind != -1) {
        if (swf_map["title"]) {
            var title = processTitle(swf_map["title"]);

            setValueAt(ind, "title", title);
            videoList[ind].title = title;
        }

        if (swf_map["display_title"]) {
            var displayTitle = swf_map["display_title"];
            videoList[ind].displayTitle = displayTitle;
            setValueAt(ind, "title", displayTitle);
        }

        if (swf_map["fmt_list"]) {
            var fmt_list = swf_map["fmt_list"].split(",");

            var maxResolution = fmt_list[0].split("/")[1];
            var maxQual = fmtMap[fmt_list[0].split("/")[0]].quality;
                    
            // var fType = fmtMap[fmt_list[0].split("/")[0]].fileType;

            setValueAt(ind, "maxResolution", maxResolution);
            setValueAt(ind, "maxQuality", maxQual);
            // + " (" + fType + ")");
        }

        if (swf_map["length_seconds"]) {
            var length_seconds = parseInt(swf_map["length_seconds"]);

            var clipLength = "";
            if (length_seconds > 3600) {
                var hh = Math.floor(length_seconds / 3600);
                clipLength += zeroPad(hh, 2) + ":";
                length_seconds = length_seconds % (hh * 3600);
            }
            var mm = Math.floor(length_seconds / 60);
            clipLength += zeroPad(mm, 2) + ":";
            if (mm > 0)
                length_seconds = length_seconds % (mm * 60);
            clipLength += zeroPad(length_seconds, 2);
            clipLength = clipLength.replace(/^0/g, "");
            setValueAt(ind, "clipLength", clipLength);
        }

        if (videoList[ind]) {
            videoList[ind].swfMap = swf_map;
        }

        if (!swf_map["url_encoded_fmt_stream_map"] ||
            swf_map["url_encoded_fmt_stream_map"].indexOf("url") == -1) {
            videoList[ind].failureDescription = failureString;
            var display = "(" + failureString + ")";

            if (getValueAt(ind, "title") == strings.getString("Loading")) {
                setValueAt(ind, "title", display);
            }
        }
    }
    videoList[ind].prefetched = true;

}


// preprocessInfo constructs swf_map based on the junk content in video_info
// swf_map is equivalent to SWF_ARGS in a YouTube page source.
function preprocessInfo(video_info) {
    var swf_map = {};

    var components = video_info.replace(/%2C/g, ",").replace(/<[^>]*>/g, ".").split('&');

    var i = 0;
    for (i = 0; i < components.length; i++) {
        var key = unescape(components[i]).substring(0, components[i].indexOf("="));
        var value = unescape(components[i]).slice(key.length + 1);

        swf_map[key] = value.replace(/\+/g, " ");

        if (key == "title") {
            swf_map[key] = utf8to16(swf_map[key]);

            if (value.indexOf("+++") != -1)  // If title contains "++ " handle it seperately.
                return { "status": "fail" };

            swf_map["display_title"] = stripHTML(swf_map[key], 3);
        }
    }
    return swf_map;
}

// The follwing section contains some DOM manipulation functions
function getValueAt(row, colId) {

    return document.getElementById(colId + row).innerText;
}

function setValueAt(row, colId, value) {

    document.getElementById(colId + row).innerText = value;

}

// Prepend a number with zeros: num is the number and count is the total number of digits at the end
function zeroPad(num, count) {
    try {
        var numZeropad = num + "";
        while (numZeropad.length < count) {
            numZeropad = "0" + numZeropad;
        }
        return numZeropad;
    }
    catch (error) {
        return ("000" + num);
    }
}

// commpute the number of digits in num
function digitCount(num) {
    try {
        var nDigits = 0;
        while (num >= 1) {
            num /= 10;
            nDigits++;
        }
        return nDigits;
    }
    catch (error) {
        return 0;
    }
}

/*
 * Interfaces:
 * utf8 = utf16to8(utf16);
 * utf16 = utf16to8(utf8);
 */

function utf16to8(str) {
    var out, i, len, c;

    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        }
        else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
        else {
            out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
    }
    return out;
}

function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }

    return out;
}


function getTitleAndDisplayTitle(link) {

    var title = "";
    var displayTitle = "";

    var stripSpace = function stripSpace(text) {
        return text.replace(/^\s*/, "").replace(/\s*$/, "");
    };


    /*
     *  The following code tries to extract the video title from the span
     *  that surrounds the current link.
     */
    var spans = link.getElementsByTagName("span");
    for (var si = 0; si < spans.length; si++) {
        // si stands for span index
        if (spans[si].hasAttribute("class") &&
            spans[si].getAttribute("class").indexOf("title") != -1) {
            if (spans[si].hasAttribute("title"))
                title = spans[si].getAttribute("title");
            else
                title = spans[si].innerHTML;

            displayTitle = stripHTML(title, 3);
            title = processTitle(displayTitle);
            break;
        }
    }

    if (!title || title.length == 0) {
        // in case title was null, set it to empty string.
        title = "";
        displayTitle = "";

        var images = link.getElementsByTagName("img");

        // ii stands for image index
        for (var ii = 0; ii < images.length; ii++) {
            if (images[ii].hasAttribute("title"))
                title = images[ii].getAttribute("title");
            else if (images[ii].hasAttribute("alt"))
                title = images[ii].getAttribute("alt");

            displayTitle = stripHTML(title, 3);
            title = processTitle(displayTitle);

            if (title && title.length > 0)
                break;
        }
    }

    title = stripSpace(title);

    if (title.length == 0 && link.title) {
        var text1 = link.title;
        displayTitle = stripHTML(text1, 3);
        title = processTitle(displayTitle);
    }

    title = stripSpace(title);

    if (title.length == 0) {
        var text = link.innerHTML;

        if (text) {
            displayTitle = stripHTML(text, 3);
            title = processTitle(displayTitle);
        }
    }

    if (hasUndesirablePatterns(title)) {
        spans = link.getElementsByClassName("album-track-name");

        if (spans.length > 0) {
            var html = spans[0].innerHTML;
            displayTitle = stripHTML(html, 3);
            title = processTitle(displayTitle);
        }
    }

    return [title, displayTitle];
}

function processTitle(title) {

    if (!title)
        return "";

    title = stripHTML(title, 3);

    title = title.replace(/^(\s)*|(\s)*$/g, "")    // Strip off white spaces
        .replace(/(&lt;)|(&gt;)|"/g, "")  // replace < >
        .replace(/&#39;|'|&quot;/g, "")   // " and ' by nothing
        .replace(/\?/g, "!")              // ? by !
        .replace(/[\\\/|:]/g, " - ")      // replace {/, |, \} by " - "
        .replace(/[*#<>%$]/g, " ")        // replace {*, #, <, >, %, $} by a single space.
        .replace(/\+/g, " plus ")         // replace '+' by "plus ". (e.g. "C++" by "C plus plus"
        .replace(/&/g, " and ")           // replace &amp; by " and "
        .replace(/(\s)+/g, " ")           // replace multiple white-spaces by a single space
        .replace(/-\s-/g, "-")            // replace all double hyphens by a single hyphen.
    ;

    return title;
}


function InvocationInfo() {
    this.timeStamp = "";
    this.sourcePageUrl = "";
    this.sourcePageTitle = "";
    this.toString = function () {
        return (this.timeStamp + "\n" + this.sourcePageTitle + "\n" +
            this.sourcePageUrl);
    };
}

// buildLinks builds anchors from contentDocument and clipboard
function buildLinks(contentDocument, links) {
    if (links == null)
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

var helpPageLink = "http://msram.github.com/bytubed/help.html";

var validVidLength = 11; // As of this writing.

var undesirablePattern =
    new RegExp("^http|^<img|thumb|Back(\\s)+$|" +
        "play.all|view.comments|return.to|play.video|" +
        "sign.out|sign.in|switch.account|^(none)$", "igm");

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
var videoInfoUrlPrefix = "https://www.youtube.com/get_video_info?video_id=";
// 
// // supportedFormats and supportedQualities are to be listed in the same order
// // as they are shown to the user in the respective fields
var supportedFormats = ["flv", "mp4", "webm", "3gp"];
var supportedQualities = ["144p", "240p", "360p", "480p", "720p", "1080p", "Original"];

// Works by side-effect; Updates the varialbe "links"
function buildLinksForVids(vids, links, processedVids) {

    try {
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
    catch (error) {
        // iccb.reportProblem(error, arguments.callee.name);
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
        .replace(/★/g, "-");
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
    return youTubePatterns.test(link);
}





function CXMLReq(freed)
{
    this.freed = (freed != "undefined")? freed: 1;
    this.xmlhttp = new XMLHttpRequest();
    this.requestCompleted = false;
}

function XmlHttpRequestManager(callerObject, callBack, errorHandler)
{
    this.xmlreqs        = [];

    this.callerObject   = callerObject;
    this.callBack       = callBack;
    this.errorHandler   = errorHandler;

    this.doRequest      = function doRequest(method, url)
    {
        var pos = this.xmlreqs.length;
        this.xmlreqs[pos] = new CXMLReq(1);

        if (this.xmlreqs[pos].xmlhttp)
        {
            this.xmlreqs[pos].freed = 0;
            this.xmlreqs[pos].xmlhttp.open(method, url, true);

            var previousBirth = this;

            this.xmlreqs[pos].xmlhttp.onreadystatechange = function()
            {
                if (typeof(previousBirth.xmlhttpChange) != 'undefined')
                {
                    previousBirth.xmlhttpChange(method, pos, url);
                }
            };

            this.xmlreqs[pos].xmlhttp.send(null);
        }
        else if(this.errorHandler)
        {
            this.errorHandler("XMLHttpRequestManager: Failed to create a new XMLHttpRequest object", url);
        }
    };

    this.xmlhttpChange = function xmlhttpChange(method, pos, url)
    {
        try
        {
            if (typeof(this.xmlreqs[pos]) && this.xmlreqs[pos].freed == 0)
            {
                var xmlhttp = this.xmlreqs[pos].xmlhttp;
                
                if(method == "GET" && xmlhttp.readyState == 4)
                {
                    if (this.xmlreqs[pos].xmlhttp.status == 200 || this.xmlreqs[pos].xmlhttp.status == 304)
                    {
                        this.xmlreqs[pos].requestCompleted = true;

                        if(this.callBack != null && this.callBack != 'undefined')
                        {
                            var returnValue = xmlhttp.responseText;
                            this.callBack(this.callerObject, returnValue, url, pos);
                        }
                    }
                    else
                    {
                        // handle_error();
                        
                        if(this.errorHandler)
                        {
                            this.errorHandler(xmlhttp.responseText, url);
                        }
                    }
                    this.xmlreqs[pos].freed = 1;

                }
                else if(method == "HEAD" && this.xmlreqs[pos].xmlhttp.readyState > 1)
                {
                    //alert(xmlhttp.readyState);
                    var returnValue = xmlhttp.getAllResponseHeaders();

                    if(this.callBack != null && this.callBack != 'undefined' && this.xmlreqs[pos].freed == 0)
                    {
                        this.xmlreqs[pos].freed = 1;
                        this.callBack(this.callerObject, returnValue, url);
                    }
                }
                else
                {
                    // You can write something here for debugging purposes.
                }
            }
        }
        catch(e)
        {
            if(this.errorHandler)
                this.errorHandler("XMLHttpRequestManager: " + e + e.lineNumber + e.fileName, url);
        }
    };

    // End
}

function VideoListManager(callerObject,
                                                    callBack,
                                                    errorHandler,
                                                    videoList,
                                                    preferences,
                                                    subtitleLanguageInfo)
{
    this.callerObject   = callerObject;
    this.videoList      = videoList;
    this.preferences    = preferences;
    this.callBack       = callBack;
    this.errorHandler   = errorHandler;

    this.subtitleLanguageInfo = subtitleLanguageInfo;
    
    this.processVideoList = function processVideoList()
    {                    
            var infoUrls = [];
            var i=0;
            for(i= 0; i<this.videoList.length; i++)
            {
                infoUrls[i] = videoInfoUrlPrefix + this.videoList[i].vid;
            }

            var videoRequestManager = new XmlHttpRequestManager(this, this.processInfoAndCallBack,
                                                                 this.errorHandler);
            
            for(i=0;i<this.videoList.length;i++)
            {
                if(this.videoList[i].displayTitle == strings.getString("Loading"))
                    this.videoList[i].displayTitle = this.videoList[i].vid;
                
                if(this.videoList[i].failureDescription) // If already tried and failed
                {
                    var message = this.videoList[i].failureDescription;
                    if(message.replace(/<[^>]*>/g, "").match(/"[^"]*"/))
                    {
                        var newTitle = message.replace(/<[^>]*>/g, "").match(/"[^"]*"/)[0].replace(/"/g, "");
                        if(this.videoList[i].displayTitle.length < newTitle.length)
                            this.videoList[i].displayTitle = newTitle;
                        message = message.replace(/^(\s|\n)+/g, "");
                        this.errorHandler(message);
                    }
                    else
                        this.errorHandler("\"" + this.videoList[i].displayTitle + "\" -- " + message);
                }
                else if(this.videoList[i].swfMap)   // If prefetched
                {
                    if(this.videoList[i].swfMap["url_encoded_fmt_stream_map"] 
                        && this.videoList[i].swfMap["url_encoded_fmt_stream_map"].indexOf("url") != -1
                        )
                    {
                        this.processInfo(this.videoList[i].swfMap, infoUrls[i], i);
                        this.callBack(this.callerObject, i);
                    }
                    else
                    {
                        this.videoList[i].failureDescription = strings.getString("GenericFailureMessage");
                        this.errorHandler("\"" + this.videoList[i].displayTitle + "\" -- " + 
                                                strings.getString("GenericFailureMessage"));
                    }
                }
                else
                    videoRequestManager.doRequest("GET", infoUrls[i]);
            }     
    };

    this.processInfoAndCallBack = function processInfoAndCallBack(previousBirth, info, url)
    {     

            var swf_map = preprocessInfo(info);

            var video_id = getParamsFromUrl(url)["video_id"];
            
            var index = getIndexByKey(previousBirth.videoList, "vid",
                                                    video_id, function(x, y){return x==y;});
            
            if(swf_map["status"] != "ok"
                || !swf_map["url_encoded_fmt_stream_map"]
                || swf_map["url_encoded_fmt_stream_map"] == ""
                || swf_map["url_encoded_fmt_stream_map"].indexOf("url") == -1
                )
            {
                var vid = previousBirth.videoList[index].vid;
                var videoUrl = watchUrlPrefix + vid;

                var localErrorHandler = function localErrorHandler(aHTMLString, requestedUrl)
                {                   
                        var message = getFailureString(aHTMLString);

                        previousBirth.videoList[index].failureDescription = message;

                        if(message.replace(/<[^>]*>/g, "").match(/"[^"]*"/))
                        {
                            var newTitle = message.replace(/<[^>]*>/g, "")
                                                  .match(/"[^"]*"/)[0]
                                                  .replace(/"/g, "");

                            if(previousBirth.videoList[index].displayTitle.length < newTitle.length)
                                previousBirth.videoList[index].displayTitle = newTitle;

                            message = message.replace(/^(\s|\n)+/g, "");
                            previousBirth.errorHandler(message);
                        }
                        else
                            previousBirth.errorHandler("\"" + previousBirth.videoList[index].displayTitle +
                                                        "\" -- " + message);             
                };

                var youTubePageHandler = function youTubePageHandler(pb, html, dummyVar1, dummyVar2)
                {
                    
                        swf_map = processYouTubePage(html);

                        if(swf_map && swf_map["url_encoded_fmt_stream_map"]
                                && swf_map["url_encoded_fmt_stream_map"] != ""
                                && swf_map["url_encoded_fmt_stream_map"].indexOf("url") != -1
                            )
                        {
                            pb.processInfo(swf_map, url, index);
                            pb.callBack(pb.callerObject, index);
                        }
                        else
                        {
                            var failureString = getFailureString(html);
                            pb.videoList[index].failureDescription = failureString;

                            if(swf_map && swf_map["display_title"])
                                pb.videoList[index].displayTitle = swf_map["display_title"];

                            pb.errorHandler("\"" + pb.videoList[index].displayTitle + "\" -- " + failureString);
                        }               
                };

                var requestManager = new XmlHttpRequestManager(previousBirth,
                                                                youTubePageHandler,
                                                                localErrorHandler);

                requestManager.doRequest("GET", videoUrl);

            }
            else
            {
                previousBirth.processInfo(swf_map, url, index);
                previousBirth.callBack(previousBirth.callerObject, index);
            }

    };

    this.processInfo = function processInfo(swf_map, url, index)
    {       

            var url_encoded_fmt_stream_map = swf_map["url_encoded_fmt_stream_map"];

            //iccb._showObjectProperties(swf_map);
            
            var availableFormats    = [];
            var fmt_list =  swf_map["fmt_list"];

            if(fmt_list)
            {
                // fmt_list looks like
                // "45/1280x720/99/0/0,22/1280x720/9/0/115," +
                // "44/854x480/99/0/0,35/854x480/9/0/115,43/640x360/99/0/0," +
                // "34/640x360/9/0/115,18/640x360/9/0/115,5/320x240/7/0/0"

                var formats = fmt_list.split(",");

                for(var i=0; i<formats.length; i++)
                {
                    var fmt = formats[i].split("/")[0];
                    var res = formats[i].split("/")[1];

                    availableFormats[i] = fmt;

                    if(fmt in fmtMap)
                        fmtMap[fmt].resolution = res;
                    else
                    {
                        fmtMap[fmt] = {};
                        fmtMap[fmt].resolution = res;
                    }
                }
            }

            var curTitle = this.videoList[index].title;
            curTitle = curTitle.replace(/^\s*/, "").replace(/\s*$/, "");

            var newTitle = "";

            if(swf_map["title"])
                newTitle = processTitle(swf_map["title"]);

            if(curTitle.length != newTitle.length)
            {
                this.videoList[index].title = newTitle;
            }

            // Prepend the s.no if preserveOrder = true
            if(preferences.preserveOrder)
            {
                var sNo = zeroPad(index+1, digitCount(this.videoList.length));
                this.videoList[index].title = sNo + " - " + this.videoList[index].title;
            }

            if(swf_map["display_title"])
                this.videoList[index].displayTitle = swf_map["display_title"];

            /*
            // If verboseTitles

            if(swf_map["author"])
            {
                this.videoList[index].author = swf_map["author"];
            }

            this.videoList[index].title = this.videoList[index].author + " - " +
                                          this.videoList[index].title + " (" +
                                          this.videoList[index].vid + ")";
            */

            var encodedUrls         = url_encoded_fmt_stream_map.split(",");
            var videoUrls           = [];
            var vUrl                = "";

            for(var i=0; i<encodedUrls.length; i++)
            {               
                    var rawUrl  = unescape(unescape(encodedUrls[i]));
                    var parts   = rawUrl.split("url=");
                    vUrl = parts[1] + "&" + parts[0];
                    var urlParams = getParamsFromUrl(vUrl.replace(/\"/g, "%22"));
                    //alert(vUrl.replace("\"", "%22"));
                    var fmt     = urlParams["itag"];
                    var type    = urlParams["type"];
                    
                    var quality = urlParams["quality"];

                    if(fmtMap[fmt] && (!fmtMap[fmt].fileType || !fmtMap[fmt].quality))
                    {
                        fmtMap[fmt].fileType = type.split(";")[0].split("/")[1].replace("x-", "");
                        fmtMap[fmt].quality  = quality;
                    }
                    
                    vUrl = vUrl.split("?")[0] + "?";
                    for(var key in urlParams)
                    {
                        if(key && urlParams[key])
                        {
                            var val = urlParams[key];
                            vUrl += "&" + (key == "sig"? "signature":key) + "=" + val;
                        }
                    }
                    
                    vUrl += "&title=" + this.videoList[index].title;

                    videoUrls[fmt] = vUrl.replace("?&", "?").replace("&&", "&");
              
            }

            this.videoList[index].availableFormats = availableFormats;
            
            var expire = vUrl.match(/expire=[^&]*&/)[0].replace(/&|expire=/g, "");
            var expiryTime = new Date(expire*1000);
            this.videoList[index].expiryTime = expiryTime;

            // Find best match URL based on the user preferences.
            var pFormat         = this.preferences.format;
            var ignoreFileType  = this.preferences.ignoreFileType;

            var found       = false;
            var loopCount   = 0; // Just to ensure that the loop ends in finite time.

            while(!found && loopCount++ < 4)
            {
                for(var qIndex = supportedQualities.indexOf(this.preferences.quality); qIndex >= 0; qIndex--)
                {
                    var pQuality = supportedQualities[qIndex];

                    for(var key in videoUrls)
                    {
                        if(fmtMap[key])
                        {
                            var props = fmtMap[key];
                            if( (ignoreFileType || props.fileType == pFormat) && props.quality == pQuality)
                            {
                                this.videoList[index].videoURL      = videoUrls[key];
                                this.videoList[index].videoQuality  = "<span class='" + props.color + "'>" +
                                                                      props.resolution + " (" +
                                                                      props.quality + ")</span>";

                                this.videoList[index].fileType   = "." + props.fileType;

                                found = true;
                                break;
                            }
                        }
                    }

                    if(found)
                        break;
                }
                if(!found)
                {
                    // This means that the video is not available in the requested format.
                    // Set ignoreFileType to true and repeat the above loop.
                    ignoreFileType = true;
                }
            }

            //alert(this.videoList[index].videoURL);
            
            if(this.videoList[index].failureDescription == null)
                this.videoList[index].failureDescription  = "";
                  
    };
}


