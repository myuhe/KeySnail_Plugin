
var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>Keydledo</name>
    <name lang="ja">Keydledo</name>
    <description>Keydledo</description>
    <description lang="ja">Toodledoを操作</description>
    <version>0.0.1</version>
    　　<iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Keydledo.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Keydledo.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.7</minVersion>
    <include>main</include>
    <provides>  
    <ext>Keydledo_param</ext>
    </provides>
    <detail><![CDATA[
==== 機能 ====
KeydledoはToodledoをKeySnailから管理します。
==== 設定 ====
                       まず、ToodledoのuniqueIDを設定します。toodledoのAccount SettingのページからUniqueIDをコピーして、.keysnail.js へ以下のようなスクリプトを編集して張り付けてください。
                        >||
plugins.options["Keydledo_opt.Keydledo_id"] = "ここにuniqueIDを入力";
                       ||<
                       次のようにして適当なキーへ割り当てます。
                       .keysnail.js へ以下のようなスクリプトを張り付けてください。今回の"d"にToDoのリスト表示機能を、"C-c　d"にToDoの追加機能を割り振っています。
                       >||
key.setViewKey("d", function (ev, arg) {
                   ext.exec("show_ToDolist", arg);
               }, "ToDoリストを一覧表示", true);

                   key.setViewKey(['C-c', 'd'], function (ev, arg) {
                                      ext.exec("show_ToDolist", arg);
                                  }, "ToDoを追加", true);
                       ||<

以下のような設定をしておくと、後述するToDoをリスト表示させた時のアクションにキーバインドをあてることができます。
                       >||
plugins.options["Keydledo_opt.keymap"] = {
    "C-z"   : "prompt-toggle-edit-mode",
    "SPC"   : "prompt-next-page", 
    "b"     : "prompt-previous-page",
    "j"     : "prompt-next-completion",
    "k"     : "prompt-previous-completion",
    "g"     : "prompt-beginning-of-candidates",
    "G"     : "prompt-end-of-candidates",
    "D"     : "prompt-cancel",
    // Keydledo client specific actions
    "d"     : "ToDo_done",　//ToDoを完了する。
    "D"     : "delete_ToDo" //ToDoを削除する。                      
        ||<
        ==== ToDoの追加 ====
        以上の設定を行った場合、"d"キーを押すとプロンプトが起動します。まずはToDoの内容を入力しましょう。その後はtag,期日の入力フォームが起動します。tagと期日は補完機能があります。TABキーを押せば補完候補が出てくるので選択してください。

        ==== ToDoのリスト表示 ====
        以上の設定を行った場合、"C-c　d"キーを押すとリストが表示されます。"C-i"　キーを押すことでリストの編集等いろいろなアクションを選択できます。また、このアクション選択後もtagや期日はTABキーを押すことで補完候補を表示することが可能です。
    
    
               ]]></detail>
    </KeySnailPlugin>;
var optionsDefaultValue = {
    "keymap" : {},
    "Keydledo_id" : "input your id"
};

function getOption(aName) {
    var fullName = "Keydledo_opt." + aName;
    if (typeof plugins.options[fullName] !== "undefined") 
    {
        return plugins.options[fullName];
    }
    else
    {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}


var MD5_sig = (function () {
                   var password;
                   var username;
                   var passwordManager = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager);
                   var logins = passwordManager.findLogins({}, "http://www.toodledo.com", "https://www.toodledo.com", null);
                   [username, password] = [logins[0].username, logins[0].password];
                   var userID = getOption("Keydledo_id");
                   var xhr = new XMLHttpRequest;
                   var url = "http://api.toodledo.com/api.php?method=getToken;appid=Keydledo;userid=" + userID;
                   xhr.open("GET", url, false);
                   xhr.send("");
                   var xml = xhr.responseXML;
                   try{
                       var token_node = xml.getElementsByTagName("token");
                       token = token_node[0].firstChild.nodeValue;
                      // window.alert("トークンは" + token);
                   }
                   catch(e){
                       var error_node = xml.getElementsByTagName("error");
                       error = error_node[0].firstChild.nodeValue;
                   }
                   //token ="td4b4ad19b0a71d";
                   var MD5_pass = hex_md5(password);
                   var sig = hex_md5(MD5_pass + token +userID);
                   //window.alert(sig);
                   return sig;
               })();


var Keydledo =
    (function () {


         var KeydledoAction = [
             [function (aIndex) {
                  if (aIndex >= 0) done_ToDo(aIndex);
              }, M({ja: "このToDoを完了する : ", en: ""}) + "ToDo done", "ToDo_done,c"],
             [function (aIndex) {
                  if (aIndex >= 0) tag_ToDo(aIndex);
              }, M({ja: "タグを変更する : ", en: ""}) + "edit tag", "edit_tag,c"],
             [function (aIndex) {
                  if (aIndex >= 0) duedate_ToDo(aIndex);
              }, M({ja: "期日を変更する : ", en: ""}) + "edit duedate", "edit_duedate,c"],
             [function (aIndex) {
                  if (aIndex >= 0) priority_ToDo(aIndex);
              }, M({ja: "優先度を変更する : ", en: ""}) + "edit priority", "edit_priority,c"],
             [function (aIndex) {
                  if (aIndex >= 0) title_ToDo(aIndex);
              }, M({ja: "タイトルを変更する : ", en: ""}) + "edit title", "edit_title,c"],
            [function (aIndex) {
                  if (aIndex >= 0) delete_ToDo(aIndex);
              }, M({ja: "ToDoを削除する : ", en: ""}) + "delete ToDO", "delete_ToDo,c"]
             
         ];

         let tPrompt = {
             forced  : false,
             get visible() {
                 return !document.getElementById("keysnail-prompt").hidden;
             },
             close   : function () {
                 if (tPrompt.forced)
                 {
                     tPrompt.forced = false;

                     if (tPrompt.visible)
                     {
                         prompt.finish(true);
                     }
                 }
             }
         };

         function callSelector() {
             var promptList = 
                 function(collection){
                     var tmpList =[];
                     var xhr = new XMLHttpRequest;
                     var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
                     xhr.open("GET", url, false);
                     xhr.send("");
                     var xml = xhr.responseXML;
                     var task_node = xml.getElementsByTagName("task");

                     function get_each_data(row,data_name){
                         try{
                             var tmp_data = task_node[row].getElementsByTagName(data_name)[0].firstChild.nodeValue;
                         }
                         catch(e){
                             var tmp_data = "";
                         }
                         return tmp_data; 
                     }
                     for (var i = 0; i < task_node.length; i++) {
                         var    id       = get_each_data(i,"id");
                         var    title    = get_each_data(i,"title");
                         var    tag      = get_each_data(i,"tag");
                         var    folder   = get_each_data(i,"folder");
                         var    duedate  = get_each_data(i,"duedate");
                         var    duetime  = get_each_data(i,"duetime");
                         var    status   = get_each_data(i,"status");
                        if (status == "0"){
                             status = "";
                         }
                         else if (status == "1"){
                             status ="Next action";
                         }
                         else if (status == "2"){
                             status ="Active";
                         }
                         else if (status == "3"){
                             status ="Planning";
                         }
                         else if (status == "4"){
                             status ="Delegated";
                         }
                         else if (status == "5"){
                             status ="Active";
                         }
                         else if (status == "6"){
                             status ="Hold";
                         }
                         else if (status == "7"){
                             status ="Postponed";
                         }
                         else if (status == "8"){
                             status ="Someday";
                         }
                         else if (status == "9"){
                             status ="Canceled";
                         }
                         else if (status == "10"){
                             status ="Reference";
                         }
                         else {
                             status ="";
                         }
                         var    priority = get_each_data(i,"priority");
                          if (priority == "-1"){
                             priority = "Negative";
                         }
                         else if (priority == "0"){
                             priority = "Low";
                         }
                         else if (priority == "1"){
                             priority ="Medium";
                         }
                         else if (priority == "2"){
                             priority ="High";
                         }
                         else if (priority == "3"){
                             priority ="Top";
                         }
                         else {
                             priority ="";
                         }
                         var    note     = get_each_data(i,"note");
                         
                         tmpList.push([title,tag,folder,status,duedate,priority]);
                     }
                     return tmpList;
                 };
             prompt.selector({
                                 message: "ToDo list: ",
                                 flags: [0 , 0, 0, 0, 0, 0],
                                 collection: promptList,
                                 header: ["title", "tag","folder","status","duedate","priority"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [45, 20, 15,15,15,15],
                                 keymap :getOption("keymap"),
                                 actions:KeydledoAction
                             });
         }
         
         try {
             var alertsService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
         } catch (x) {
             popUpStatusWhenUpdated = false;
         }

         var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator); 
         
         function showPopup(arg) {
             if (false /* plugins.lib.xulGrowl */)
             {
                 plugins.lib.xulGrowl.update(
                     {
                         title   : arg.title,
                         message : arg.message,
                         link    : arg.link,
                         icon    : arg.icon
                     }
                 );

                 setTimeout(function () {
                                if (typeof arg.callback === "function")
                                    arg.callback();
                            }, 1000);
             }
             else
             {
                 alertsService.showAlertNotification(arg.icon,
                                                     arg.title,
                                                     arg.message,
                                                     !!arg.link,
                                                     arg.link,
                                                     arg.observer);
             }
         }


         function done_ToDo (aIndex) {
             var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             var edit_xhr = new XMLHttpRequest;
             var edit_url ="http://api.toodledo.com/api.php?method=editTask;id=" + Key_id + ";completed=1;key=" +MD5_sig;
             edit_xhr.open("GET", edit_url, false);
             edit_xhr.send("");
             var edit_xml = edit_xhr.responseXML;
             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                 showPopup({
                               title   : M({ja: "ToDo完了！！", en: "Done!!"}),
                               message : M({ja: "おつかれさまでした！！",
                                            en: "Waohhh"}) 
                           });
             }
             else{
                 showPopup({
                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                               message : M({ja: "同期に失敗しました",
                                            en: "failed sync"}) 
                           });
             }
              prompt.refresh();
         }
         
         
         function tag_ToDo (aIndex) {
             var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             var tag_list =new Array();
             function get_each_data(row,data_name){
                 try{
                     var tmp_data = task_node[row].getElementsByTagName(data_name)[0].firstChild.nodeValue;
                 }
                 catch(e){
                     var tmp_data = "none";
                 }
                 return tmp_data; 
             }
             for (var i = 0; i < task_node.length; i++) {
                 var    tag      = get_each_data(i,"tag");
                 tag_list.push(tag);
             }
             
             function uniq(arr) {
                 var o = {};
                 return Array.filter(arr,
                                     function(i) i in o? false: o[i] = true);
             };
             uniq_tag = uniq(tag_list);
             tPrompt.close();
             prompt.read("tag:", function (aTweet) {
                             var encode_value = encodeURIComponent(aTweet);
                             var edit_xhr = new XMLHttpRequest;
                             var edit_url ="http://api.toodledo.com/api.php?method=editTask;id="
                                 + Key_id + ";completed=0;key=" +MD5_sig
                                 + ";tag=" + encode_value;
                             edit_xhr.open("GET", edit_url, false);
                             edit_xhr.send("");
                             var edit_xml = edit_xhr.responseXML;     
                             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                                 showPopup({
                                               title   : M({ja: "編集完了", en: "Done!!"}),
                                               message : M({ja: "タグを",en: ""}) + aTweet + M({ja: "に変更しました",en: ""})
                                           });
                             }
                             else{
                                 showPopup({
                                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                                               message : M({ja: "同期に失敗しました",
                                                            en: "failed sync"}) 
                                           });
                             }
                         },null,uniq_tag);
         }
         
         function duedate_ToDo (aIndex) {
             var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             tPrompt.close();

             var date_list = new Array();
             var now = new Date();
             var nYear = now.getFullYear();
             var nMonth = now.getMonth();
             var nDate = now.getDate();
             for (var i = 0; i < 29; i++) {
                 var next_day = new Date(nYear, nMonth, nDate + i);
                 var year = next_day.getFullYear();
                 var mon = next_day.getMonth() + 1;
                 var date = next_day.getDate();
                 var date_unix = year + "-" + mon + "-" + date ;
                 date_list.push(date_unix);
             }             
             prompt.read("duedate:", function (aTweet) {
                             var encode_value = encodeURIComponent(aTweet);
                             var edit_xhr = new XMLHttpRequest;
                             var edit_url ="http://api.toodledo.com/api.php?method=editTask;id="
                                 + Key_id + ";completed=0;key=" +MD5_sig
                                 + ";duedate=" + encode_value;
                             edit_xhr.open("GET", edit_url, false);
                             edit_xhr.send("");
                             var edit_xml = edit_xhr.responseXML;     
                             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                                 showPopup({
                                               title   : M({ja: "編集完了", en: "Done!!"}),
                                               message : M({ja: "期日を",en: ""}) + aTweet + M({ja: "に変更しました",en: ""})
                                           });
                             }
                             else{
                                 showPopup({
                                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                                               message : M({ja: "同期に失敗しました",
                                                            en: "failed Sync"}) 
                                           });
                             }
                         },null,date_list);
         }
         
         function priority_ToDo (aIndex) {
                         var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             tPrompt.close();
             prompt.read("tag:", function (aTweet) {
                             var encode_value = encodeURIComponent(aTweet);
                             var edit_xhr = new XMLHttpRequest;
                             var edit_url ="http://api.toodledo.com/api.php?method=editTask;id="
                                 + Key_id + ";completed=0;key=" +MD5_sig
                                 + ";tag=" + encode_value;
                             edit_xhr.open("GET", edit_url, false);
                             edit_xhr.send("");
                             var edit_xml = edit_xhr.responseXML;     
                             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                                 showPopup({
                                               title   : M({ja: "編集完了", en: "Done!!"}),
                                               message : M({ja: "優先度",en: ""}) + aTweet + M({ja: "に変更しました",en: ""})
                                           });
                             }
                             else{
                                 showPopup({
                                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                                               message : M({ja: "同期に失敗しました",
                                                            en: "failed sync"}) 
                                           });
                             }
                         }); 
         }
         
         function title_ToDo (aIndex) {
                         var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             tPrompt.close();
             prompt.read("tag:", function (aTweet) {
                             var encode_value = encodeURIComponent(aTweet);
                             var edit_xhr = new XMLHttpRequest;
                             var edit_url ="http://api.toodledo.com/api.php?method=editTask;id="
                                 + Key_id + ";completed=0;key=" +MD5_sig
                                 + ";tag=" + encode_value;
                             edit_xhr.open("GET", edit_url, false);
                             edit_xhr.send("");
                             var edit_xml = edit_xhr.responseXML;     
                             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                                 showPopup({
                                               title   : M({ja: "編集完了", en: "Done!!"}),
                                               message : M({ja: "タグを",en: ""}) + aTweet + M({ja: "に変更しました",en: ""})
                                           });
                             }
                             else{
                                 showPopup({
                                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                                               message : M({ja: "同期に失敗しました",
                                                            en: "failed sync"}) 
                                           });
                             }
                         }); 
         }
         
         function delete_ToDo (aIndex) {
             var xhr = new XMLHttpRequest;
             var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
             xhr.open("GET", url, false);
             xhr.send("");
             var xml = xhr.responseXML;
             var task_node = xml.getElementsByTagName("task");
             var Key_id = task_node[aIndex].getElementsByTagName("id")[0].firstChild.nodeValue;
             var edit_xhr = new XMLHttpRequest;
             var edit_url ="http://api.toodledo.com/api.php?method=deleteTask;id=" + Key_id + ";key=" +MD5_sig;
             edit_xhr.open("GET", edit_url, false);
             edit_xhr.send("");
             var edit_xml = edit_xhr.responseXML;
             if (edit_xml.getElementsByTagName("success")[0].firstChild.nodeValue == 1){
                 showPopup({
                               title   : M({ja: "ToDo削除！！", en: "Done!!"}),
                               message : M({ja: "おつかれさまでした！！",
                                            en: "Waohhh"}) 
                           });
             }
             else{
                 showPopup({
                               title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                               message : M({ja: "同期に失敗しました",
                                            en: "failed sync"}) 
                           });
             }
              prompt.refresh(0);
         }
         
         
         var self = {
             show_ToDolist: function(){
                 callSelector();
             },
             post: function(){
                 var date_list = new Array();
                 var month_flag =1;
                 function checkDate(year, month, day) {
                     var dt = new Date(year, month - 1, day);
                     if(dt == null || dt.getFullYear() != year || dt.getMonth() + 1 != month || dt.getDate() != day) {
                         return false;
                     }
                     return true;
                 }
                 
                     var now = new Date();
                     var nYear = now.getFullYear();
                     var nMonth = now.getMonth() + 1;
                     var nDate = now.getDate();
                 for (var i = 0; i < 29; i++) {
                     var next_day = new Date(nYear, nMonth, nDate + i);
                     var year = next_day.getFullYear();
                     var mon = next_day.getMonth();
                     var date = next_day.getDate();
                     var date_unix = year + "-" + mon + "-" + date ;
                     date_list.push(date_unix);
                 }
                 var xhr = new XMLHttpRequest;
                 var url = "http://api.toodledo.com/api.php?method=getTasks;notcomp=1;key=" + MD5_sig;
                 xhr.open("GET", url, false);
                 xhr.send("");
                 var xml = xhr.responseXML;
                 var task_node = xml.getElementsByTagName("task");
                 var tag_list =new Array();
                 function get_each_data(row,data_name){
                     try{
                         var tmp_data = task_node[row].getElementsByTagName(data_name)[0].firstChild.nodeValue;
                     }
                     catch(e){
                         var tmp_data = "none";
                     }
                     return tmp_data; 
                 }
                 for (var i = 0; i < task_node.length; i++) {
                     var    tag      = get_each_data(i,"tag");
                     tag_list.push(tag);
                 }
                                                             function uniq(arr) {
                                                var o = {};
                                                return Array.filter(arr,
                                                function(i) i in o? false: o[i] = true);
                                            };
                                         uniq_tag = uniq(tag_list);
                 prompt.read(
                     "title:", function (aVa) {
                         let title = aVa;
                         prompt.read(
                             "tag:", function (aVa) {
                                 prompt.read(
                                     "duedate:", function (aVa) {
                                         let tag = aVa;
                                         var encode_title = encodeURIComponent(title);
                                         var encode_tag = encodeURIComponent(tag);
                                         var edit_xhr = new XMLHttpRequest;
                                         var edit_url ="http://api.toodledo.com/api.php?method=addTask"
                                             + ";key=" +MD5_sig
                                             + ";title=" + encode_title + ";tag=" + encode_tag;
                                         edit_xhr.open("GET", edit_url, false);
                                         edit_xhr.send("");
                                         var edit_xml = edit_xhr.responseXML;     
                                         if (edit_xml.getElementsByTagName("added")[0].firstChild.nodeValue != null){
                                             showPopup({
                                                           title   : M({ja: "ToDo追加完了", en: "Done!!"}),
                                                           message : M({ja: "ToDo: ",en: ""}) + 
                                                               encode_title + M({ja: "を追加しました。",en: ""})
                                                       });
                                         }
                                         else{
                                             showPopup({
                                                           title   : M({ja: "ごめんなさい。。。", en: "sorry..."}),
                                                           message : M({ja: "同期に失敗しました",
                                                                        en: "failed sync"}) 
                                                       });
                                         }
                                     },null,date_list);
                             },null,uniq_tag);     
                     });
             }
         };
    //};
    
         
         return self;
         
     })();



function get_param () {
    window.alert(MD5_sig);
}

ext.add("get_param", get_param,
        M({ja: "パラメータ",
           en: "param"}));

ext.add("show_ToDolist", Keydledo.show_ToDolist,
        M({ja: "ToDoリストを表示",
           en: "show ToDo list"}));

ext.add("post_ToDo", Keydledo.post,
        M({ja: "ToDoを追加",
           en: "add ToDo "}));




/* 
 * MD5 Hashing Algorithm taken, with thanks, from Paul Johnston.
 * Packed to save space using Dean Edwards' Packer: http://dean.edwards.name/packer/
 *
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2-alpha Copyright (C) Paul Johnston 1999 - 2005
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
var hexcase=0;var b64pad="";function hex_md5(s){return rstr2hex(rstr_md5(str2rstr_utf8(s)))}function b64_md5(s){return rstr2b64(rstr_md5(str2rstr_utf8(s)))}function any_md5(s,e){return rstr2any(rstr_md5(str2rstr_utf8(s)),e)}function hex_hmac_md5(k,d){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)))}function b64_hmac_md5(k,d){return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)))}function any_hmac_md5(k,d,e){return rstr2any(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)),e)}function md5_vm_test(){return hex_md5("abc")=="900150983cd24fb0d6963f7d28e17f72"}function rstr_md5(s){return binl2rstr(binl_md5(rstr2binl(s),s.length*8))}function rstr_hmac_md5(a,b){var c=rstr2binl(a);if(c.length>16)c=binl_md5(c,a.length*8);var d=Array(16),opad=Array(16);for(var i=0;i<16;i++){d[i]=c[i]^0x36363636;opad[i]=c[i]^0x5C5C5C5C}var e=binl_md5(d.concat(rstr2binl(b)),512+b.length*8);return binl2rstr(binl_md5(opad.concat(e),512+128))}function rstr2hex(a){var b=hexcase?"0123456789ABCDEF":"0123456789abcdef";var c="";var x;for(var i=0;i<a.length;i++){x=a.charCodeAt(i);c+=b.charAt((x>>>4)&0x0F)+b.charAt(x&0x0F)}return c}function rstr2b64(a){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var c="";var d=a.length;for(var i=0;i<d;i+=3){var e=(a.charCodeAt(i)<<16)|(i+1<d?a.charCodeAt(i+1)<<8:0)|(i+2<d?a.charCodeAt(i+2):0);for(var j=0;j<4;j++){if(i*8+j*6>a.length*8)c+=b64pad;else c+=b.charAt((e>>>6*(3-j))&0x3F)}}return c}function rstr2any(a,b){var c=b.length;var i,j,q,x,quotient;var d=Array(Math.ceil(a.length/2));for(i=0;i<d.length;i++){d[i]=(a.charCodeAt(i*2)<<8)|a.charCodeAt(i*2+1)}var e=Math.ceil(a.length*8/(Math.log(b.length)/Math.log(2)));var f=Array(e);for(j=0;j<e;j++){quotient=Array();x=0;for(i=0;i<d.length;i++){x=(x<<16)+d[i];q=Math.floor(x/c);x-=q*c;if(quotient.length>0||q>0)quotient[quotient.length]=q}f[j]=x;d=quotient}var g="";for(i=f.length-1;i>=0;i--)g+=b.charAt(f[i]);return g}function str2rstr_utf8(a){var b="";var i=-1;var x,y;while(++i<a.length){x=a.charCodeAt(i);y=i+1<a.length?a.charCodeAt(i+1):0;if(0xD800<=x&&x<=0xDBFF&&0xDC00<=y&&y<=0xDFFF){x=0x10000+((x&0x03FF)<<10)+(y&0x03FF);i++}if(x<=0x7F)b+=String.fromCharCode(x);else if(x<=0x7FF)b+=String.fromCharCode(0xC0|((x>>>6)&0x1F),0x80|(x&0x3F));else if(x<=0xFFFF)b+=String.fromCharCode(0xE0|((x>>>12)&0x0F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));else if(x<=0x1FFFFF)b+=String.fromCharCode(0xF0|((x>>>18)&0x07),0x80|((x>>>12)&0x3F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F))}return b}function str2rstr_utf16le(a){var b="";for(var i=0;i<a.length;i++)b+=String.fromCharCode(a.charCodeAt(i)&0xFF,(a.charCodeAt(i)>>>8)&0xFF);return b}function str2rstr_utf16be(a){var b="";for(var i=0;i<a.length;i++)b+=String.fromCharCode((a.charCodeAt(i)>>>8)&0xFF,a.charCodeAt(i)&0xFF);return b}function rstr2binl(a){var b=Array(a.length>>2);for(var i=0;i<b.length;i++)b[i]=0;for(var i=0;i<a.length*8;i+=8)b[i>>5]|=(a.charCodeAt(i/8)&0xFF)<<(i%32);return b}function binl2rstr(a){var b="";for(var i=0;i<a.length*32;i+=8)b+=String.fromCharCode((a[i>>5]>>>(i%32))&0xFF);return b}function binl_md5(x,e){x[e>>5]|=0x80<<((e)%32);x[(((e+64)>>>9)<<4)+14]=e;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var f=a;var g=b;var h=c;var j=d;a=md5_ff(a,b,c,d,x[i+0],7,-680876936);d=md5_ff(d,a,b,c,x[i+1],12,-389564586);c=md5_ff(c,d,a,b,x[i+2],17,606105819);b=md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=md5_ff(a,b,c,d,x[i+4],7,-176418897);d=md5_ff(d,a,b,c,x[i+5],12,1200080426);c=md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=md5_ff(b,c,d,a,x[i+7],22,-45705983);a=md5_ff(a,b,c,d,x[i+8],7,1770035416);d=md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=md5_ff(c,d,a,b,x[i+10],17,-42063);b=md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=md5_ff(a,b,c,d,x[i+12],7,1804603682);d=md5_ff(d,a,b,c,x[i+13],12,-40341101);c=md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=md5_ff(b,c,d,a,x[i+15],22,1236535329);a=md5_gg(a,b,c,d,x[i+1],5,-165796510);d=md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=md5_gg(c,d,a,b,x[i+11],14,643717713);b=md5_gg(b,c,d,a,x[i+0],20,-373897302);a=md5_gg(a,b,c,d,x[i+5],5,-701558691);d=md5_gg(d,a,b,c,x[i+10],9,38016083);c=md5_gg(c,d,a,b,x[i+15],14,-660478335);b=md5_gg(b,c,d,a,x[i+4],20,-405537848);a=md5_gg(a,b,c,d,x[i+9],5,568446438);d=md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=md5_gg(c,d,a,b,x[i+3],14,-187363961);b=md5_gg(b,c,d,a,x[i+8],20,1163531501);a=md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=md5_gg(d,a,b,c,x[i+2],9,-51403784);c=md5_gg(c,d,a,b,x[i+7],14,1735328473);b=md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=md5_hh(a,b,c,d,x[i+5],4,-378558);d=md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=md5_hh(c,d,a,b,x[i+11],16,1839030562);b=md5_hh(b,c,d,a,x[i+14],23,-35309556);a=md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=md5_hh(d,a,b,c,x[i+4],11,1272893353);c=md5_hh(c,d,a,b,x[i+7],16,-155497632);b=md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=md5_hh(a,b,c,d,x[i+13],4,681279174);d=md5_hh(d,a,b,c,x[i+0],11,-358537222);c=md5_hh(c,d,a,b,x[i+3],16,-722521979);b=md5_hh(b,c,d,a,x[i+6],23,76029189);a=md5_hh(a,b,c,d,x[i+9],4,-640364487);d=md5_hh(d,a,b,c,x[i+12],11,-421815835);c=md5_hh(c,d,a,b,x[i+15],16,530742520);b=md5_hh(b,c,d,a,x[i+2],23,-995338651);a=md5_ii(a,b,c,d,x[i+0],6,-198630844);d=md5_ii(d,a,b,c,x[i+7],10,1126891415);c=md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=md5_ii(b,c,d,a,x[i+5],21,-57434055);a=md5_ii(a,b,c,d,x[i+12],6,1700485571);d=md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=md5_ii(c,d,a,b,x[i+10],15,-1051523);b=md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=md5_ii(a,b,c,d,x[i+8],6,1873313359);d=md5_ii(d,a,b,c,x[i+15],10,-30611744);c=md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=md5_ii(b,c,d,a,x[i+13],21,1309151649);a=md5_ii(a,b,c,d,x[i+4],6,-145523070);d=md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=md5_ii(c,d,a,b,x[i+2],15,718787259);b=md5_ii(b,c,d,a,x[i+9],21,-343485551);a=safe_add(a,f);b=safe_add(b,g);c=safe_add(c,h);d=safe_add(d,j)}return Array(a,b,c,d)}function md5_cmn(q,a,b,x,s,t){return safe_add(bit_rol(safe_add(safe_add(a,q),safe_add(x,t)),s),b)}function md5_ff(a,b,c,d,x,s,t){return md5_cmn((b&c)|((~b)&d),a,b,x,s,t)}function md5_gg(a,b,c,d,x,s,t){return md5_cmn((b&d)|(c&(~d)),a,b,x,s,t)}function md5_hh(a,b,c,d,x,s,t){return md5_cmn(b^c^d,a,b,x,s,t)}function md5_ii(a,b,c,d,x,s,t){return md5_cmn(c^(b|(~d)),a,b,x,s,t)}function safe_add(x,y){var a=(x&0xFFFF)+(y&0xFFFF);var b=(x>>16)+(y>>16)+(a>>16);return(b<<16)|(a&0xFFFF)}function bit_rol(a,b){return(a<<b)|(a>>>(32-b))}


