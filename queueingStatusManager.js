/* global escape */
// window.onload = queueingStatusManager.onload;
// window.onunload = queueingStatusManager.onUnload;

var AsHTMLFile = true;

var DownloadQueueManager = function (callBack, errorHandler, destDir, vList, prefs, subtitleLanguageInfo) {
    //this.caller                    = caller;
    this.destinationDirectory = destDir;
    this.videoList = vList;
    this.callBack = callBack;
    this.errorHandler = errorHandler;
    this.preferences = prefs;
    this.subtitleLanguageInfo = subtitleLanguageInfo;

    this.processQueue = function processQueue() {
        var allIsWell = true;
        if (allIsWell) {
            var videoListManager = new VideoListManager(this,
                this.enqueueAndCallBack,
                this.errorHandler,
                this.videoList,
                this.preferences,
                this.subtitleLanguageInfo);

            videoListManager.processVideoList();
        }
        else {
            this.errorHandler(null, null, !allIsWell);
        }
    };

    this.enqueueAndCallBack = function enqueueAndCallBack(previousBirth, videoIndex) {
        if (this.preferences.todo == ENQUEUE_LINKS)
            previousBirth.enqueue(videoIndex);

        previousBirth.manageSubtitles(videoIndex);
    };

    // Following code is to manage subtitles.
    this.manageSubtitles = function manageSubtitles(index) {			
        // 				if(this.preferences.fetchSubtitles)
        // 				{
        // 					var subtitleLangRequestManager = new XmlHttpRequestManager(this, this.processSubtitleLangList, null);
        // 
        // 					var vid = this.videoList[index].vid;
        // 					if(this.videoList[index].availableSubtitleLanguages == null)    // Not yet fetched available languages
        // 					{
        // 						subtitleLangRequestManager.doRequest("GET",
        // 						subtitleLangListURL.replace("VIDEO_ID", vid));
        // 					}
        // 					else
        // 					{
        // 						this.processSubtitleRequest(index);
        // 					}
        // 				}
        // 				else
        this.callBack(strings.getFormattedString("RequestSuccessfullyProcessed",
            [this.videoList[index].displayTitle]));
    };

    this.enqueue = function enqueue(videoIndex) {
        var urllink = this.videoList[videoIndex].videoURL;
        var filenamelocal = this.videoList[videoIndex].title + this.videoList[videoIndex].fileType;
        chrome.downloads.download({ url: urllink, filename: filenamelocal, conflictAction: "uniquify" }, function (id) {
 	      });
    };
};

var queueingStatusManager = {
    selectedVideoList: null,
    destinationDirectory: "undefined",
    preferences: null,
    invocationInfo: null,

    successCount: 0,
    failureCount: 0,
    expiryTime: null,
    alreadyFinished: false,
    subtitleLanguageInfo: null,

    SetParams: function SetParams(selectedVideoList, destinationDirectory, preferences, invocationInfo, subtitleLanguageInfo) {
        this.selectedVideoList = selectedVideoList;
        this.destinationDirectory = destinationDirectory;
        this.preferences = preferences;
        this.invocationInfo = InvocationInfo;
        this.subtitleLanguageInfo = subtitleLanguageInfo;
    },

    // onLoad is the handler for the event window.onload of qsMgr
    onLoad: function onLoad(event) {
        SetActive(2);
        document.getElementById("successConsole").focus();

        // qsMgr.selectedVideoList = window.arguments[0];
        // qsMgr.destinationDirectory = window.arguments[1];
        // qsMgr.preferences = window.arguments[2];
        // qsMgr.invocationInfo = window.arguments[3];
        // qsMgr.subtitleLanguageInfo = window.arguments[4];

        setStatus(parent.strings.getString("ProcessingSelection"));
        //document.getElementById("progressmeter").mode = "undetermined";

        var dqManager = new DownloadQueueManager(
            this.reportProgress,
            this.reportError,
            this.destinationDirectory,
            this.selectedVideoList,
            this.preferences,
            this.subtitleLanguageInfo);
        dqManager.processQueue();
    },

    // setStatus sets the given statusMessage in the status bar.
    setStatus: function setStatus(statusMessage) {

        document.getElementById("status").innerHTML = statusMessage;
    },

    // reportProgress is the callback function for the layers below this layer;
    // it's job is to report progress to the user.
    reportProgress: function reportProgress(progressMessage) {

        var qsMgr = queueingStatusManager;
        qsMgr.successCount++;
        document.getElementById("successConsole").innerHTML += "[" + qsMgr.successCount + "] " +
        progressMessage + "\n\n";

        var TextBoxElement = document.getElementById("successConsole");
        // var ti = document.getAnonymousNodes(TextBoxElement)[0].childNodes[0];
        TextBoxElement.scrollTop = TextBoxElement.scrollHeight;

        qsMgr.updateProgress();
    },

    // reportError is the callback error handler function for the layers below this layer;
    // it's job is to report failures to the user.
    reportError: function reportError(errorMessage, requestedUrl, criticalError) {

        //         if (criticalError)
        //             window.close();
        // 
        //         else {
        var qsMgr = queueingStatusManager;
        qsMgr.failureCount++;

        var console = document.getElementById("errorConsole");

        errorMessage = stripHTML(errorMessage, 3);

        if (errorMessage.indexOf("--") == -1)
            errorMessage = errorMessage.replace(/"(\s|\n)+/g, "\" -- ");
        if (!(/\.$/).test(errorMessage)) // if message doesn't end in '.' then append '.'.
            errorMessage += ".";

        console.value += "[" + qsMgr.failureCount + "] " + errorMessage + "\n\n";

        var TextBoxElement = document.getElementById("errorConsole");
        // var ti = document.getAnonymousNodes(TextBoxElement)[0].childNodes[0];
        TextBoxElement.scrollTop = TextBoxElement.scrollHeight;

        qsMgr.updateProgress();

        // };
    },
    // updateProgress is the common task for reportProgress and reportError functions to
    // check if the assigned task is completed.
    updateProgress: function updateProgress() {


        var qsMgr = queueingStatusManager;

        var selCount = qsMgr.selectedVideoList.length;

        var progress = document.getElementById("progressmeter");
        var progressvalue = document.getElementById("progressvalue");
        // progress.mode = "determined";
        progress.value = 100 * ((qsMgr.successCount + qsMgr.failureCount) / selCount);
        progressvalue.innerText = (Math.round(100 * ((qsMgr.successCount + qsMgr.failureCount) / selCount))).toString() + "%";

        qsMgr.setStatus(qsMgr.successCount +
            "/" + selCount + " " + strings.getString("RequestsSuccessful") + " " +
            qsMgr.failureCount + " " + strings.getString("RequestsFailed"));

        if (qsMgr.successCount + qsMgr.failureCount == qsMgr.selectedVideoList.length) {
            qsMgr.finishUp();
            qsMgr.alreadyFinished = true;
        }

        var TextBoxElement = document.getElementById("successConsole");
        // var ti = document.getAnonymousNodes(TextBoxElement)[0].childNodes[0];
        TextBoxElement.scrollTop = TextBoxElement.scrollHeight;
    },

    finishUp: function finishUp() {


        var qsMgr = queueingStatusManager;

        document.getElementById("successConsole").value +=
        strings.getString("AllRequestsProcessed");

        if (qsMgr.preferences.todo == GENERATE_LINKS) {
            // qsMgr.prepareWatchLinksFile();
            // qsMgr.prepareBadLinksTextFile();
            // qsMgr.prepareGoodLinksTextFile();
            qsMgr.launchDownloadLinksFile();
            if (qsMgr.preferences.closeQStatusWindow && qsMgr.failureCount === 0) {
                window.close();
            }
        }

        // if (qsMgr.failureCount > 0) {
        //     window.focus();
        //     document.getElementById("consoleTabs").selectedIndex = 1;
        //     document.getElementById("consolePanels").selectedIndex = 1;
        // }

        //            if(qsMgr.preferences.todo == iccb.ENQUEUE_LINKS &&
        //                qsMgr.successCount > 0 && qsMgr.preferences.showDLWindow)
        //                iccb.services.downloadManagerUI.show();

        

    },

    commonHtml: function commonHtml() {
        var htmlString = "";

        htmlString += " <!DOCTYPE html>" +
        "\n <html>" +
        "\n\t <head>" +
        "\n\t\t <title>" + strings.getString("HtmlPageTitle") + "</title>" +
        "\n\t\t <meta http-equiv=\"content-type\" content=\"text/html;charset=utf-8\">" +
        "\n\t\t <style>" +
        "\n\t\t\t body      { font-family:Georgia,Ubuntu,Times,Sans; text-align:justify }" +
        "\n\t\t\t table     { border-collapse:collapse; margin-left:auto; margin-right:auto }" +
        "\n\t\t\t .green    { color:#006600; }" +
        "\n\t\t\t .gray     { color:#808080; }" +
        "\n\t\t\t .red      { color:#FF0000; }" +
        "\n\t\t\t .pink     { color:#FF00C0; }" +
        "\n\t\t\t .purple   { color:#C000FF; }" +
        "\n\t\t\t .ruby     { color:#C00000; }" +
        "\n\t\t\t .lightblue{ color:#4480FF; }" +
        "\n\t\t\t .center   { text-align:center; }" +
        "\n\t\t\t .fullwidth{ width:100%; }" +
        "\n\t\t\t .centerdiv{ margin:auto; }" +
        "\n\t\t\t .pad20    { padding:20px }" +
        "\n\t\t </style>" +
        "\n\t </head>" +
        "\n\t <body>";

        return htmlString;
    },

    //     function prepareBadLinksTextFile()
    //     {      
    //             var qsMgr = queueingStatusManager;
    //             if(qsMgr.preferences.generateBadLinks)
    //             {
    //                 var text = "";
    // 
    //                 for(var i=0; i < qsMgr.selectedVideoList.length; i++)
    //                 {
    //                     if(qsMgr.selectedVideoList[i].videoURL == "")
    //                     {
    //                         text += "http://www.youtube.com/watch?v=" + qsMgr.selectedVideoList[i].vid + "\n";
    //                     }
    //                 }
    //                 writeTextToFile(text,
    //                                     "bad_links_bytubed@cs213.cse.iitk.ac.in.txt",
    //                                     qsMgr.destinationDirectory,
    //                                     iccb.services.downloadManager.userDownloadsDirectory.path);
    //             }
    //    
    //         };
    // 
    //     function prepareGoodLinksTextFile()
    //     {      
    //             var qsMgr = queueingStatusManager;
    // 
    //             if(qsMgr.preferences.generateGoodLinks)
    //             {
    //                 var text = "";
    // 
    //                 for(var i=0; i < qsMgr.selectedVideoList.length; i++)
    //                 {
    //                     if(qsMgr.selectedVideoList[i].videoURL != "")
    //                     {
    //                         text += "http://www.youtube.com/watch?v=" + qsMgr.selectedVideoList[i].vid + "\n";
    //                     }
    //                 }
    //                 writeTextToFile(text,
    //                                     "good_links_bytubed@cs213.cse.iitk.ac.in.txt",
    //                                     qsMgr.destinationDirectory,
    //                                     services.downloadManager.userDownloadsDirectory.path);
    //             }
    //         }   
    //     };

    //     function prepareWatchLinksFile()
    //     {   
    //             var qsMgr = queueingStatusManager;
    // 
    //             if( qsMgr.successCount + qsMgr.failureCount == qsMgr.selectedVideoList.length &&
    //                 (!(qsMgr.preferences.generateFailedLinks || qsMgr.preferences.generateWatchLinks) || 
    //                 (!qsMgr.preferences.generateFailedLinks && qsMgr.successCount == 0) ||
    //                 (!qsMgr.preferences.generateWatchLinks && qsMgr.failureCount == 0)))
    //                 return;
    //             
    //             var htmlString = qsMgr.commonHtml();
    // 
    //             htmlString += "\n\t\t <div class=\"fullwidth center gray\">" +
    //                           "\n\t\t\t <b>" + strings.getString("InvocationTime") + "</b> " +
    //                           qsMgr.invocationInfo.timeStamp + "" + "<br/>" +
    //                           "\n\t\t\t <b>" + strings.getString("SourcePage") + "</b> <a href=\"" +
    //                           qsMgr.invocationInfo.sourcePageUrl + "\">" +
    //                           qsMgr.invocationInfo.sourcePageTitle + "</a>" +
    //                           "\n\t\t </div>";
    // 
    //             // if there is atleast one failure and generateFailedLinks is true
    //             if(qsMgr.successCount < qsMgr.selectedVideoList.length && qsMgr.preferences.generateFailedLinks)
    //             {
    //                 htmlString += "\n\t\t <br/><h2 class=\"red center\">" + 
    //                               strings.getString("LinkGenerationFailedFor") + "</h2>" +
    //                               "\n\t\t <div id=\"failed_links\" class=\"pad20\">" +
    //                               "\n\t\t\t <table border=\"1\" cellpadding=\"5px\" " +
    //                               "style=\"border-collapse:collapse;margin-left:auto;margin-right:auto\">" +
    //                               "\n\t\t\t\t <tr><th>" + strings.getString("SNo") + 
    //                               "</th><th>" + strings.getString("Title") + 
    //                               "</th><th>" + strings.getString("ReasonForFailure") + "</th></tr>";
    // 
    //                 var k = 1;
    //                 for(var i=0; i < qsMgr.selectedVideoList.length; i++)
    //                 {
    //                     if(qsMgr.selectedVideoList[i].videoURL == "")
    //                     {
    //                         if(qsMgr.selectedVideoList[i].failureDescription == null ||
    //                             qsMgr.selectedVideoList[i].failureDescription == "")
    //                         {
    //                             qsMgr.selectedVideoList[i].failureDescription =
    //                                     strings.getString("NotEnoughTime");
    //                         }
    //                         if(qsMgr.selectedVideoList[i].displayTitle == strings.getString("Loading"))
    //                             qsMgr.selectedVideoList[i].displayTitle = qsMgr.selectedVideoList[i].vid;
    // 
    //                         htmlString += "\n\t\t\t\t <tr><td>"+ (k++) +
    //                                         "</td><td><a href=\"http://www.youtube.com/watch?v=" +
    //                                         qsMgr.selectedVideoList[i].vid + "\">" +
    //                                         qsMgr.selectedVideoList[i].displayTitle +
    //                                         "</a></td><td>" +
    //                                         qsMgr.selectedVideoList[i].failureDescription.replace(/\n/g, " ") +
    //                                         "</td></tr>";
    //                     }
    //                 }
    //                 htmlString += "\n\t\t\t </table>" +
    //                               "\n\t\t </div>";
    //             }
    // 
    //             if(qsMgr.successCount && qsMgr.preferences.generateWatchLinks)
    //             {
    //                 if(qsMgr.failureCount)
    //                     htmlString += "\n\n\t\t <br /><hr size=\"1\" />";
    // 
    //                 htmlString += "\n\t\t" +
    //                               "\n\t\t <br/><h2 class=\"center\">" +
    //                               strings.getString("LinkGenerationSucessfulFor") + "</h2>" +
    //                               "\n\t\t <div id=\"successful_links\" class=\"pad20\">" +
    //                               "\n\t\t\t <table border=\"1\" cellpadding=\"5px\">" +
    //                               "\n\t\t\t\t <tr><th>" + strings.getString("SNo") + 
    //                               "</th><th>" + strings.getString("Title") + "</th></tr>";
    // 
    //                 var k = 1;
    //                 for(var i=0; i < qsMgr.selectedVideoList.length; i++)
    //                 {
    //                     if(qsMgr.selectedVideoList[i].videoURL != "")
    //                     {
    //                         htmlString += "\n\t\t\t\t <tr><td>"+ (k++) +
    //                             "</td><td><a href=\"http://www.youtube.com/watch?v=" +
    //                             qsMgr.selectedVideoList[i].vid + "\">" +
    //                             qsMgr.selectedVideoList[i].displayTitle + "</a></td></tr>";
    //                     }
    //                 }
    //                 htmlString += "\n\t\t\t </table>" +
    //                               "\n\t\t </div>";
    //             }
    // 
    //             htmlString += "\n\t </body>" +
    //                           "\n </html>";
    // 
    //             writeTextToFile(htmlString,
    //                                     "watch_links_bytubed@cs213.cse.iitk.ac.in.html",
    //                                     qsMgr.destinationDirectory,
    //                                     services.downloadManager.userDownloadsDirectory.path);
    //     },

    launchDownloadLinksFile: function launchDownloadLinksFile() {

        var qsMgr = queueingStatusManager;

        var htmlString = qsMgr.commonHtml();

        if (qsMgr.successCount) {
            for (var i = 0; i < qsMgr.selectedVideoList.length; i++)
                if (qsMgr.selectedVideoList[i].expiryTime)
                    qsMgr.expiryTime = qsMgr.selectedVideoList[i].expiryTime;

            htmlString += "\n\t\t <br/>" +
            "\n\t\t <div class=\"center\">" +
            "\n\t\t\t <h2 class=\"green\"> " +
            strings.getFormattedString("HasGeneratedLinks",
                [qsMgr.successCount]) +
            "</h2>" +
            "\n\t\t\t " + strings.getFormattedString("InvokeDTA",
                ["<b>DownThemAll</b>"]) +
            "\n\t\t\t <br/>" +
            "\n\t\t\t <br/><hr size=\"1\" width=\"80%\"/><br/>" +
            "\n\t\t\t <span class=\"gray\">" +
            "\n\t\t\t\t " + strings.getString("IfNoDM") + "<br/>" +
            "\n\t\t\t </span>" +
            "\n\t\t </div>" +
            "\n\t\t <p/>";

            htmlString += "\n\t\t <div id=\"links\">" +
            "\n\t\t\t <table border=\"1\" cellpadding=\"5px\">" +
            "\n\t\t\t\t <tr><th>" + strings.getString("SNo") +
            "</th><th>Title</th><th>" + strings.getString("Quality") +
            "</th>" + (qsMgr.preferences.fetchSubtitles ?
                "<th>" + strings.getString("Subtitles")
                + "</th>" : "") +
            "</tr>";

            var k = 1;
            for (i = 0; i < qsMgr.selectedVideoList.length; i++) {
                if (qsMgr.selectedVideoList[i].videoURL !== "") {
                    var fetchedLangName = qsMgr.selectedVideoList[i].fetchedLangName;
                    var actualPrefLangName = qsMgr.selectedVideoList[i].actualPrefLangName;

                    htmlString += "\n\t\t\t\t <tr><td>" + (k++) + "</td><td><a href=\"" +
                    qsMgr.selectedVideoList[i].videoURL + "\">" +
                    (AsHTMLFile ? qsMgr.selectedVideoList[i].displayTitle : escape(qsMgr.selectedVideoList[i].displayTitle)) +
                    qsMgr.selectedVideoList[i].fileType +
                    "</a></td><td>" + qsMgr.selectedVideoList[i].videoQuality + "</td>" +
                    (qsMgr.preferences.fetchSubtitles ?
                        "<td>" + (fetchedLangName === null ?
                            strings.getString("None") :
                            "<span class='ruby'>" + fetchedLangName + "</span>") +
                        ((!actualPrefLangName || fetchedLangName == actualPrefLangName) ?
                            "" :
                            "<br/>" + strings.getString("For") + " " + actualPrefLangName) + "</td>"
                        : "") +
                    "</tr>";
                }
            }
            htmlString += "\n\t\t\t </table>" +
            "\n\t\t </div>";
        }
        else {
            htmlString += "\n\t\t <br/><h2 calss=\"center\"> " +
            strings.getString("NoDownloadLinksGenerated") + "</h2>\n";
        }

        if (qsMgr.expiryTime)
            htmlString += "\n\t\t <br/><div class='center gray'>" +
            strings.getString("LinkGenerationTime") + " " + new Date() +
            "<br/>" + strings.getString("LinkExpiryTime") + " " + qsMgr.expiryTime +
            "</div><br/><hr size=\"1\" width=\"80%\"/><br/><br/>";
        // var file1 = null;
        if (qsMgr.failureCount + qsMgr.successCount != qsMgr.selectedVideoList.length ||
            (qsMgr.preferences.generateFailedLinks && qsMgr.failureCount > 0) ||
            (qsMgr.preferences.generateWatchLinks && qsMgr.successCount)) {                
            // file1 = Components.classes["@mozilla.org/file/local;1"]
            //                  .createInstance(Components.interfaces.nsILocalFile);
            // file1.initWithPath(qsMgr.destinationDirectory);
            // file1.append("watch_links_bytubed@cs213.cse.iitk.ac.in.html");
            htmlString += "<div class=\"center\">" +
            strings.getFormattedString("WatchLinksFile",
                ["<a href=\"watch_links_bytubed@cs213.cse.iitk.ac.in.html\">" +
                    "file1.path" + "</a>"]) +
            "</div><br/>";
        }

        htmlString += "\n\t </body>" +
        "\n </html>";

        if (AsHTMLFile) {
            var bgPage = chrome.extension.getBackgroundPage();
            
            chrome.tabs.create({ active: false, url: chrome.extension.getURL('output.html?data=' + bgPage.data.length) }, function(newtab) {
                bgPage.data[bgPage.data.length] = htmlString;
            })
        }
        else {                        

            var urldata = "data:text/html," + htmlString;
            chrome.tabs.create({ active: false, url: urldata }, function (newtab) {
            });
        }
        

        // chrome.tabs.create({ active: false, url: 'result.html' });

        
        //         var newnew = chrome.extension.getURL('result.html');
        //         chrome.tabs.create({ active: false, url: newnew }, function (newtab) {
        // 
        //             chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        //                 if (tabId == newtab.id) {
        //                     if (changeInfo.status == 'complete') {
        //                         chrome.tabs.sendMessage(tabId, { action: "show", value: htmlString });
        //                         // var wins = chrome.extension.getViews({ type: 'tab' });
        //                         // for (var i = 0, win; win = wins[i]; i++) {
        //                         //     if (win.location.href == newnew) {
        //                         //         //win.document.innerHTML = htmlString;
        //                         //         win.document.write(htmlString);
        //                         //     }
        //                         // }
        //                     }
        //                 }
        //             });
        //         });


        // var file = writeTextToFile(htmlString,
        //                             "download_links_bytubed@cs213.cse.iitk.ac.in.html",
        //                             qsMgr.destinationDirectory,
        //                             services.downloadManager.userDownloadsDirectory.path);

        // if(file == null && file1 == null)
        // {
        //     
        // }
        // else
        // {
        // var launchPath = (qsMgr.successCount > 0 || file1 == null) ? file.path : file1.path;
                
        //                 var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
        //                                 .getService(Components.interfaces.nsIWindowMediator)
        //                                 .getMostRecentWindow('navigator:browser');
        // 
        //                 if(win)
        //                     win.openUILinkIn("file:///" + launchPath, 'tab');
        //                 else
        //                 {
        //                     window.open("about:blank", "_old_window");  // Opens firefox
        //                     window.open("file:///" + launchPath, "_old_window"); // opens launchPath
        //                 }
        // }            
    },

    onUnload: function onUnload(event) {
        var qsMgr = queueingStatusManager;
        if (!qsMgr.alreadyFinished)
            qsMgr.finishUp();
    }
};
