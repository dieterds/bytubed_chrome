/* global chrome */
/* global chrome */


//chrome.storage.local.clear(function () { console.log(chrome.runtime.lastError);});
//chrome.storage.sync.clear(function () { console.log(chrome.runtime.lastError);});

var prefs = GetAllSettings();

$(document).ready(function() {

  restore_options();
  $('#load').click(function () { restore_options(); });
  $('#save').click(function () { save_options(); });
  
  // Anstatt save button wird jetzt bei jeder änderung gespeichert.
  $('input[type=checkbox]').click(function () { save_options(); });

  // $('#fetchSubtitles').click(function () { $('#subtitleLangList').prop('disabled', !$(this).prop('checked')); });
  // $('#subtitleLangList').prop('disabled', true);
  // $('#firstSubtitleLang').prop('disabled', true);
  // $('#secondSubtitleLang').prop('disabled', true);
  // $('#thirdSubtitleLang').prop('disabled', true);
  // 
  // $('#tryOtherLanguages').click(function () {
  //   $('#firstSubtitleLang').prop('disabled', !$(this).prop('checked'));
  //   $('#secondSubtitleLang').prop('disabled', !$(this).prop('checked'));
  //   $('#thirdSubtitleLang').prop('disabled', !$(this).prop('checked'));
  // });

  $('input').toggleClass('VerticalCenter', true);
  $('span').toggleClass('VerticalCenter', true);
  $('label').toggleClass('VerticalCenter', true);
});

// function SetSettinglist(obj) {
//   chrome.storage.sync.set(obj, function () { for (var key in obj) { 
//     console.log(key + '=' + obj[key]); 
//     }; 
//   console.log('successfully saved')        
//     });
// }
// 
// function GetSettinglist(obj) {
//   chrome.storage.sync.get(obj, function (items) { for (var key in items) { 
//     console.log(key + '=' + items[key]); 
//    }; 
//     console.log('successfully loaded');
//     return items; 
//     });
// }

function GetAllSettings() {
  chrome.storage.sync.get(null, function (items) {
    prefs = items; 
    console.log('successfully loaded');     
    });
}

// function SetSetting(key, value) {
// 
//     prefs[key] = value;
//     chrome.storage.sync.set(prefs, function () { console.log('successfully saved') });
// }
// 
// function GetSetting(key) {    
//     return prefs[key];
// }

// Saves options to chrome.storage
function save_options() {
  //SetSettinglist(GetAllSaveableElements());
  var obj = GetAllSaveableElements();
  chrome.storage.sync.set(obj, function () {
    for (var key in obj) {
      console.log(key + '=' + obj[key]);
      }
      console.log('successfully saved');
      var bgPage = chrome.extension.getBackgroundPage();
      bgPage.bShowNumber = obj["showcount"];
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // GetSettinglist(GetAllSaveableElements());
  //var obj =  GetAllSaveableElements();
  chrome.storage.sync.get(null, function (items) { for (var key in items) { 
    console.log(key + '=' + items[key]); 
    if ($('#' + key + '[type=checkbox]').length > 0) $('#' + key + '[type=checkbox]').prop('checked', items[key]);
    // if ($('#' + key + '[type=text]').length > 0) $('#' + key + '[type=text]').attr('value', items[key]);
    // if ($('select[id=' + key + ']').length > 0) $('select[id=' + key + ']').attr('value', items[key]);
   } 
    console.log('successfully loaded');
    });
}

function GetAllSaveableElements(){
  var liste = {};
  $('input[type=checkbox]').each(function (index, elem) {
    var id = elem.id;
    var checked = $(elem).prop("checked");
    liste[id] = checked;
  });
  //    $('input[type=text]').each(function (index, elem) {
  //   var id = elem.id;
  //   var value = elem.value;
  //   liste[id] = value;
  // });
  // $('select').each(function (index, elem) {
  //   var id = elem.id;
  //   var value = elem.value;
  //   liste[id] = value;
  // });
  return liste;  
}
