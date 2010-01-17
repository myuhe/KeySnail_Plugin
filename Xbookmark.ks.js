
var Xbookmark_google_sig = (function () {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", 'http://www.google.com/bookmarks/lookup?output=rss&sort=date&start=0&num=10', false);
    xhr.send(null);
    var google_node = xhr.responseXML;
    var sig = google_node.getElementsByTagName("smh:signature")[0].childNodes[0].nodeValue;
    return sig;
        })();

var optionsDefaultValue = {
    "keymap" : {},
    "Xbookmark_list" : "hatebu",//diigo,delicious,hatebu,googleのうちいずれかを選択。
    "diigo_post" : false,
    "delicious_post" : false,
    "delicious_username" : "",
    "google_post" : false,
    "hatebu_post" : false
};



//オプション設定用関数
function getOption(aName) {
    var fullName = "Xbookmark_opt." + aName;
    if (typeof plugins.options[fullName] !== "undefined") 
    {
        return plugins.options[fullName];
    }
    else
    {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

//WSSE認証
const Cc = Components.classes;
const Ci = Components.interfaces;

function WSSEUtils(aUserName, aPassword){
    this._init(aUserName, aPassword);
}

WSSEUtils.prototype = {

    get userName(){
        return this._userName;
    },

    get noce(){
        return this._nonce;
    },

    get created(){
        return this._created;
    },

    get passwordDigest(){
        return this._passwordDigest;
    },

    getWSSEHeader: function(){
        var result = [
            'UsernameToken Username="' + this._userName + '", ',
            'PasswordDigest="' + this._passwordDigest + '=", ',
            'Nonce="' + this._nonce + '", ',
            'Created="' + this._created + '"'
                ].join("");

        return result;
    },

    _init: function(aUserName, aPassword){
        var uuidGenerator = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);
        var seed = (new Date()).toUTCString() + uuidGenerator.generateUUID().toString();

        this._userName = aUserName;
        this._nonce = this._getSha1Digest(seed, true);
        this._created = this._getISO8601String((new Date()));
        this._passwordDigest = this._getSha1Digest(this._getSha1Digest(seed, false) + this._created + aPassword, true);
    },

    _getSha1Digest: function(aString, aBase64){
        var cryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
        cryptoHash.init(Ci.nsICryptoHash.SHA1);

        var inputStream = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        inputStream.setData(aString, aString.length);
        cryptoHash.updateFromStream(inputStream, -1);

        return cryptoHash.finish(aBase64);
    },

    _getISO8601String: function(aDate){
        function zeropad(s, l) {
            s = String(s);
            while(s.length < l){
                s = "0" + s;
            }
            return s;
        }

        var result = [
            zeropad(aDate.getUTCFullYear(), 4), "-",
            zeropad(aDate.getUTCMonth() + 1, 2), "-",
            zeropad(aDate.getUTCDate(), 2), "T",
            zeropad(aDate.getUTCHours(), 2), ":",
            zeropad(aDate.getUTCMinutes(), 2), ":",
            zeropad(aDate.getUTCSeconds(), 2), "Z"
        ].join("");
        return result;
    }

};
//end;;WSSE認証

var Xbookmark =
    (function () {
         
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
         
                 //ポップアップ用
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
          
         
         //配列からユニークな値を取り出す関数
         function uniq(arr) {
             var o = {};
             return Array.filter(arr,
                                 function(i) i in o? false: o[i] = true);
         };
         //usernameとpassword取得
         var passwordManager = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager);

         if ( getOption("diigo_post") || getOption("Xbookmark_list") === "diigo"){
             try{
                 var logins = passwordManager.findLogins({}, "https://secure.diigo.com", "https://secure.diigo.com", null);
                 var diigo_username = logins[0].username;
                 var diigo_passaord = logins[0].password;
             }
             catch(e){
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "diigoパスワード認証エラー", en: "diigo password error"}),
                               message : M({ja: "diigoのパスワードをFirefoxに保存してください。",en: "failed"})
                           });
             }
         }
         
         if ( getOption("hatebu_post") || getOption("Xbookmark_list") === "hatebu"){
             try{
                 var logins = passwordManager.findLogins({}, "https://www.hatena.ne.jp", "https://www.hatena.ne.jp", null);
                 var hatebu_username = logins[0].username;
                 var hatebu_passaord = logins[0].password;
             }
             catch(e){
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "hatenaパスワード認証エラー", en: "hatena password error"}),
                               message : M({ja: "hatenaのパスワードをFirefoxに保存してください。",en: "failed"})
                           });
             }
         }
         
         if ( getOption("delicious_post"|| getOption("Xbookmark_list") === "delicious")){
             var request = new XMLHttpRequest();

             request.open('POST', "https://api.del.icio.us", true);
             request.setRequestHeader('Authorization', 'Basic '+ window.btoa('cookie:cookie'));
             request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

             var authToken = null;

             var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
                 .getService(Components.interfaces.nsICookieManager);
             var iter = cookieManager.enumerator;
             while(iter.hasMoreElements()) { 
                 var cookie = iter.getNext(); 
                 if (cookie instanceof Components.interfaces.nsICookie) {
                     if ((cookie.host == '.delicious.com') && cookie.name == '_user') {
                         authToken = '_user=' + encodeURIComponent(cookie.value);
                     }
                 }
             }

             request.send(authToken);
         }
         //タグリスト生成用
         var tag_list =(function (){
                            var tmp_tag_list = new Array();
                            if ( getOption("diigo_post") || getOption("Xbookmark_list") === "diigo"){
                                var xhr = new XMLHttpRequest;
                                var url = "http://api2.diigo.com/bookmarks?rows=100&users=" + diigo_username;
                                xhr.open("GET", url, false);
                                xhr.send("");
                                if (xhr.responseText == 'API Limit Exceeded'){
                                    showPopup({
                                                  icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                  title   : M({ja: "ごめんなさい...", en: "sorry!!"}),
                                                  message : M({ja: "diigoAPIの制限にひっかかってしまいました。",en: "failed"})
                                              });
                                    return;
                                }
                                var obj = util.safeEval(xhr.responseText);
                                for (var i = 0; i < 49; i++) {
                                    var    tag       = obj[i].tags;
                                    tmp_tag_list.push(tag);
                                }
                            }
                            if ( getOption("hatebu_post") ||getOption("Xbookmark_list") === "hatebu"){
                                var api_url = "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=0"  ;
                                //window.alert(url);
                                //window.alert(xhr.responseText);
                                function get_hatebu_data(api_url){
                                    var xhr = new XMLHttpRequest;
                                    xhr.open("GET", api_url, false);
                                    xhr.send("");
                                    var xml = xhr.responseXML;
                                    var entry_node = xml.getElementsByTagName("entry");
                                    for (var i = 0; i < 20; i++) {
                                        for (var j = 0; j < entry_node[i].getElementsByTagName('dc:subject').length; j++) {
                                            tmp_tag_list.push(entry_node[i].getElementsByTagName('dc:subject')[j].childNodes[0].nodeValue);
                                        }
                                    }
                                    get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=0");
                                    get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=20");
                                    get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=40");
                                    get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=60");
                                    get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=80");
                                    // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=100");
                                    // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=120");
                                    // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=140");
                                    // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=160");
                                    // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=180");
                                    
                                };
                            }
                            if ( getOption("delicious_post") ||getOption("Xbookmark_list") === "delicious"){
                                var xhr = new XMLHttpRequest;
                                var url = "http://feeds.delicious.com/v2/json/" + getOption("delicious_username") + "?count=100" ;
                                
                                xhr.open("GET", url, false);
                                xhr.send("");
                                var obj = util.safeEval(xhr.responseText);
                                for (var i = 0; i < 99; i++) {
                                    var    tag       = obj[i].t[0];
                                    tmp_tag_list.push(tag);
                                }
                            }
                            
                            var xhr = new XMLHttpRequest;
                            var url = "http://feeds.delicious.com/v2/json/" + getOption("delicious_username") + "?count=100" ;
                            
                            xhr.open("GET", url, false);
                            xhr.send("");
                            var obj = util.safeEval(xhr.responseText);
                            for (var i = 0; i < 99; i++) {
                                var    tag       = obj[i].t[0];
                                tmp_tag_list.push(tag);
                            }
                            uniq_tag_list = uniq(tmp_tag_list);
                            return uniq_tag_list;
                        })();

   
//はてブユーザをリスト表示する関数         
         function show_hatebu_user(aURL){
             tPrompt.close();
             var promptList = 
                 function(){
                     var tmpList =[];
                     var xhr = new XMLHttpRequest;
                     var hatebu_url = 'http://b.hatena.ne.jp/entry/jsonlite/?url=' + encodeURIComponent(aURL);
                     xhr.open('GET',hatebu_url,false);
                     xhr.send('');
                     var  hatena_json = util.safeEval('(' + xhr.responseText + ')');
                     
                     for (var i = 0; i < hatena_json.bookmarks.length; i++) {
                             var user        = hatena_json.bookmarks[i].user;
                            var list_tag    = hatena_json.bookmarks[i].tags;
                             var tag         = list_tag.toString();
                            var date        = hatena_json.bookmarks[i].timestamp;
                             var comment     = hatena_json.bookmarks[i].comment;
                             var favicon_url = 'http://www.hatena.ne.jp/users/' + user + '/profile_s.gif';
                         tmpList.push([favicon_url,user,comment,tag,date]);
                     }
                     return tmpList;
                 };
                          prompt.selector({
                                 message: "pattern: ",
                                 flags: [ICON | IGNORE, 0 , 0, 0, 0],
                                 collection: promptList,
                                 header: ["user", "comment",'tag',"date"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [10, 40,20,10],
                                 keymap :getOption("keymap"),
                                 actions:Xbookmark_Action
                             });
             }
         
         function get_number_hatebu(aURL){
              var xhr = new XMLHttpRequest;
                             var hatebu_url = 'http://b.hatena.ne.jp/entry/jsonlite/?url=' + encodeURIComponent(aURL);
                             xhr.open('GET',hatebu_url,false);
                             xhr.send('');
                             var  hatena_json   = util.safeEval('(' + xhr.responseText + ')');
             if (hatena_json == undefined){
                 return '0';
             }
             else{
                 return hatena_json.count;
             }
         }
         
         function callSelector_google() {
             var promptList = 
                 function (){
                     var tmpList =[];
                     global_google_List = null;
                     var xhr = new XMLHttpRequest;
                     var api_url ='http://www.google.com/bookmarks/?output=xml&num=1000&sort=date';
                     xhr.open("GET", api_url, false);
                     xhr.send("");
                     var xml = xhr.responseXML;
                     var entry_node = xml.getElementsByTagName("bookmark");
                     var tags_node =xml.getElementsByTagName("labels");
                     for (var i = 0; i < 100; i++) {
                         var title = entry_node[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
                         var url = entry_node[i].getElementsByTagName("url")[0].childNodes[0].nodeValue;
                         var tmp_tag =new Array();
                         var hatebu_user = get_number_hatebu(url);
                         for (var j = 0; j < tags_node[i].getElementsByTagName('label').length; j++) {
                             // for (var j = 0; j < 1; j++) {
                             tmp_tag.push(tags_node[i].getElementsByTagName('label')[j].childNodes[0].nodeValue);
                         }
                         var tag = tmp_tag.toString();
                         var favicon_url = util.getFaviconPath(url);
                         tmpList.push([favicon_url,title,tag,hatebu_user ,url]);
                     }
                     global_google_List = tmpList;
                     return tmpList;
                 };
             
             prompt.selector({
                                 message: "pattern: ",
                                 flags: [ICON | IGNORE, 0 , 0, 0,0],
                                 collection: promptList,
                                 header: ["title", "tag","user","url"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [40, 22,5,15],
                                 keymap :getOption("keymap"),
                                 actions:Xbookmark_Action
                             });
     }
         
         function callSelector_hatebu(param,dat) {
             var promptList = 
                 function(){
                     var tmpList =[];
                     global_hatebu_List = null;
                     var tmp_tag_list =new Array();
                     function get_hatebu_data(api_url,param,dat){
                         var xhr = new XMLHttpRequest;
                         xhr.open("GET", api_url + param + dat, false);
                         xhr.send("");
                         var xml = xhr.responseXML;
                         var entry_node = xml.getElementsByTagName("entry");
                         for (var i = 0; i < 20; i++) {
                             if (entry_node[i] ==undefined){
                                 break;
                             }
                             var title = entry_node[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
                             var url   = entry_node[i].getElementsByTagName("link")[0].getAttribute("href");
                             var date  = entry_node[i].getElementsByTagName("issued")[0].childNodes[0].nodeValue;
                             try{
                                 var comment  = entry_node[i].getElementsByTagName("summary")[0].childNodes[0].nodeValue;
                             }
                             catch(e){
                                 var comment  = '';
                             }
                             var tmp_tag =new Array();
                             for (var j = 0; j < entry_node[i].getElementsByTagName('dc:subject').length; j++) {
                                 tmp_tag.push(entry_node[i].getElementsByTagName('dc:subject')[j].childNodes[0].nodeValue);
                             }
                             var tag        = tmp_tag.toString();
                             var hatebu_xhr = new XMLHttpRequest;
                             var hatebu_url = 'http://b.hatena.ne.jp/entry/jsonlite/?url=' + encodeURIComponent(url);
                             hatebu_xhr.open('GET',hatebu_url,false);
                             hatebu_xhr.send('');
                             //window.alert(hatebu_xhr.responseText);
                             var  hatena_json   = util.safeEval('(' + hatebu_xhr.responseText + ')');
                             var number_hatebu = hatena_json.count;
                             var favicon_url   = util.getFaviconPath(url);
                             tmpList.push([favicon_url,title,tag,comment,number_hatebu,url,date]);
                         }  
                     }
                     get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=0",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=20",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=40",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=60",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=80",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=100",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=120",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=140",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=160",param,dat);
                     // get_hatebu_data( "http://b.hatena.ne.jp/"+ hatebu_username +"/atomfeed?of=180",param,dat);
                     global_hatebu_List = tmpList;
                     return tmpList;
                 };
             prompt.selector({
                                 message    : "pattern: ",
                                 flags      : [ICON | IGNORE, 0 , 0, 0, 0, 0, 0],
                                 collection : promptList,
                                 header     : ["title", "tag",'comment','users',"url","date"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [40, 15,15,3, 22,15],
                                 keymap :getOption("keymap"),
                                 actions:Xbookmark_Action
                             });
         }
         
         function callSelector_delicious(param,dat) {
            var promptList = 
                 function(){
                     global_delicious_List = null;
                     var tmpList =[];
                     var xhr = new XMLHttpRequest;
                     var delicious_url = "http://feeds.delicious.com/v2/json/" + getOption("delicious_username") + param + dat +"?count=100" ;
                     xhr.open("GET", delicious_url, false);
                     xhr.send("");
                     var obj = util.safeEval(xhr.responseText);
                     
                     for (var i = 0; i < 99; i++) {
                         if (obj[i] ==undefined){
                             break;
                         }
                         var    title       = obj[i].d;
                         var    tag       = obj[i].t.join();
                         var    url       = obj[i].u;
                         var    date       = obj[i].dt;
                         var comment = decodeURIComponent(obj[i].n);
                         var favicon_url = util.getFaviconPath(url);
                         var hatebu_user = get_number_hatebu(url);
                         tmpList.push([favicon_url,title,tag,comment,hatebu_user,url,date]);
                         
                     }
                     global_delicious_List = tmpList;
                     return tmpList;
                 };
             prompt.selector({
                                 message: "pattern: ",
                                 flags: [ICON|IGNORE,0 , 0,0, 0, 0, 0],
                                 collection: promptList,
                                 header: ["title", "tag",'comment','user',"url","date"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [45, 20,20, 5,15,15],
                                 keymap :getOption("keymap"),
                                 actions:Xbookmark_Action
                             });
         }
             
         function callSelector_diigo(param, dat) {
             promptList = 
                 function(){
                     global_diigo_List = null;
                     var tmpList =[];
                     var xhr = new XMLHttpRequest;
                     var url = "http://api2.diigo.com/bookmarks?rows=100&users=" + diigo_username + param + dat;

                     xhr.open("GET", url, false);
                     xhr.send("");
                     if (xhr.responseText == 'API Limit Exceeded'){
                         showPopup({
                                       icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                       title   : M({ja: "ごめんなさい。。。", en: "sorry!!"}),
                                       message : M({ja: "diigoAPIの制限にひっかかってしまいました。",en: "failed"})
                                   });
                     };
                     var obj = util.safeEval(xhr.responseText);
                     for (var i = 0; i < 99; i++) {
                         if (obj[i] ==undefined){
                             break;
                         }
                         var    title   = obj[i].title;
                         var    comment = obj[i].desc;
                         var    tag     = obj[i].tags;
                         var    url     = obj[i].url;
                         var    date    = obj[i].created_at;
                         var hatebu_user = get_number_hatebu(url);
                         var favicon_url = util.getFaviconPath(url);
                         tmpList.push([favicon_url,title,tag,comment,hatebu_user,url,date]);
                     }
                     global_diigo_List = tmpList;
                     return tmpList;
                 };
             prompt.selector({
                                 message: "pattern: ",
                                 flags: [ICON|IGNORE,0 , 0, 0, 0,0,0],
                                 collection: promptList,
                                 header: ["title", "tag","comment","user","url","date"],
                                 callback: function (index) {
                                     if (index < 0 || promptList.length < index) {
                                         return;
                                     }

                                 },
                                 width: [45, 20, 15,5,15,15],
                                 keymap :getOption("keymap"),
                                 actions:Xbookmark_Action
                             });
         }
         
          



         function post_bookmark() {
             prompt.read( M({ja: "タグ:", en: "tag:"}),function (aVa) {
                              display.echoStatusBar(M({en: "", ja: "タグの間はカンマで区切って下さい。"}));
                              let tag_scope = aVa;
                              prompt.read( M({ja: "コメント:", en: "comment:"}),function (comment_post) {
                                               
                                              if ( getOption("diigo_post")){
                                                   let tag_post =tag_scope;
                                                   var w = window._content;
                                                   var d = w.document;
                                                   var url_post = d.location.href;
                                                   var title_post =d.title;
                                                   bookmarks = [
                                                       {
                                                           "title":title_post, 
                                                           "url":url_post, 
                                                           "shared":"yes", 
                                                           "tags":tag_post, 
                                                           "desc":comment_post
                                                       }
                                                   ];
                                                   var xhr = new XMLHttpRequest();
                                                   var URL = 'http://api2.diigo.com/bookmarks';
                                                   xhr.open("POST", URL, false);
                                                   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
                                                   xhr.send("bookmarks=" + encodeURIComponent(JSON.stringify(bookmarks)));
                                                   var obj = util.safeEval('[' + xhr.responseText + ']');
                                                   showPopup({
                                                                 icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                                 title   : M({ja: "diigoにポストしました。", en: "post diigo"}),
                                                                 message : M({ja: obj[0].message,en: obj[0].message})
                                                             });
                                               } 
                                               
                                                  if ( getOption("hatebu_post")){
                                                   var w = window._content;
                                                   var d = w.document;
                                                   var post_url = d.location.href;
                                                   var post_title =d.title;
                                                   let tag_post =tag_scope;
                                                   var hatebu_tag_list = tag_post.split(',');
                                                   var joined_tag = hatebu_tag_list.join('][');
                                                   var send_tag = '[' + joined_tag + ']' + comment_post;
                                                   var request =
                                                       <entry xmlns="http://purl.org/atom/ns#">
                                                       <title>dummy</title>
                                                       <link rel="related" type="text/html" href={post_url}/>
                                                       <summary type="text/plain">{send_tag}</summary>
                                                       </entry>;
                                                   
                                                   var data = request.toString();
                                                   var wsse = new WSSEUtils(hatebu_username,hatebu_passaord);
                                                   var URL = 'http://b.hatena.ne.jp/atom/post';
                                                   var xhr = new XMLHttpRequest();
                                                   xhr.open("POST", URL, true);
                                                   xhr.setRequestHeader("Content-Type", "application/atom+xml");
                                                   xhr.setRequestHeader("X-WSSE", wsse.getWSSEHeader());
                                                   xhr.send(data);
                                                     showPopup({
                                                         icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                  title       : M({ja: "はてブにポストしました。", en: "Done!!"}),
                                                  message     : M({ja: post_title,en: post_title})
                                                               });
                                                   } 
                                               
                                               if  ( getOption("delicious_post")){
                                                   let tag_post =tag_scope;
                                                   var w          = window._content;
                                                   var d          = w.document;
                                                   var url_post   = encodeURIComponent(d.location.href);
                                                   var title_post = encodeURIComponent(d.title);
                                                   var delicious_tmp_tag_list = tag_post.split(',');
                                                   var post_tag   = encodeURIComponent(delicious_tmp_tag_list.join(' '));
                                                   var delicious_comment_post = encodeURIComponent(comment_post);
                                                   var xhr        = new XMLHttpRequest();
                                                   var api        = 'https://api.del.icio.us/v1/posts/add?';
                                                   var URL        = api+'url=' + url_post + '&description=' + title_post +'&shared=yes'+'&tags='+ post_tag 
                                                                        + '&extended=' + delicious_comment_post;
                                                   xhr.open("GET", URL, false);
                                                   xhr.send("");
                                                     showPopup({
                                                                 icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                                 title   : M({ja: "deliciousにポストしました。", en: "post delicious"}),
                                                                 message : M({ja: d.title,en: d.title})
                                                             });
                                              }
                                               
                                               
                                               if ( getOption("google_post")){
                                                   var w = window._content;
                                                   var d = w.document;
                                                   var post_url = d.location.href;
                                                   var post_title =d.title;
                                                   var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
                                                   req.open("POST", 'https://www.google.com/bookmarks/mark', true);
                                                   req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                                                   var http=Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler);
                                                   var useragent=http.userAgent;
                                                   req.setRequestHeader('User-Agent', useragent+" GoogleToolbarFF");
                                                   // req.setRequestHeader('User-Agent', useragent+" GMarks");
                                                   req.setRequestHeader('Accept','text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5');
                                                   var data='s='+Xbookmark_google_sig+'&bkmk='+post_url+'&title='+post_title+
                                                       '&labels='+tag_scope+'&annotation='+comment_post+"&zx="+Math.floor(Math.random()*32768);
                                                   req.send(data);
                                                     showPopup({
                                                                 icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                                 title   : M({ja: "Googleにポストしました。", en: "post Google"}),
                                                                 message : M({ja: post_title,en: post_title})
                                                             });
                                               }
                                           
                                             });
                         },null,tag_list);
         }
         
         
                 var Xbookmark_Action = [
             [function (aIndex) {
                  if (aIndex >= 0) open_site(aIndex);
              }, M({ja: "このサイトを開く : ", en: ""}) + "open this site", "local_open,c"],
             // [function (aIndex) {
             //      if (aIndex >= 0) open_site(aIndex);
             //  }, M({ja: "次のブックマークリストへ : ", en: ""}) + "open this site", "local_open,c"],
             [function (aIndex) {
                  if (aIndex >= 0) wrap_show_hatebu_user(aIndex);
              }, M({ja: "ブクマしているユーザを見る : ", en: ""}) + "show hatebu user", "local_show_hatebu_user"],
                      [function (aIndex) {
                  if (aIndex >= 0) delete_bookmark(aIndex);
              }, M({ja: "ブックマークを削除する。 : ", en: ""}) + "delete bookmark", "local_delete_bookmark"],
             [function (aIndex) {
                  if (aIndex >= 0) edit_tag(aIndex);
              }, M({ja: "タグを変更する : ", en: ""}) + "edit tag", "local_edit_tag"]
             
         ];

         function open_site (aIndex) {  //0favicon_url,1title,2tag,3comment,4hatebu_user,5url,6date
             if ( getOption("Xbookmark_list") === "diigo"){
                 gBrowser.loadOneTab(global_diigo_List[aIndex][5], null, null, null, false);
             }
             else if ( getOption("Xbookmark_list") === "delicious"){//favicon_url,title,tag,comment,hatebu_user,url,date
                 gBrowser.loadOneTab(global_delicious_List[aIndex][5], null, null, null, false);
             }
             else if ( getOption("Xbookmark_list") === "hatebu"){//0favicon_url,1title,2tag,3comment,4number_hatebu,5url,6date
                 gBrowser.loadOneTab(global_hatebu_List[aIndex][5], null, null, null, false);
             }
             
             else if ( getOption("Xbookmark_list") === "google"){//0favicon_url,1title,2tag,3hatebu_user ,4url
                 gBrowser.loadOneTab(global_google_List[aIndex][4], null, null, null, false);
             } 
             else{
                 showPopup({
                               icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                               message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                           });
             }
         }
         
         function wrap_show_hatebu_user(aIndex){
             if ( getOption("Xbookmark_list") === "diigo"){ //0favicon_url,1title,2tag,3comment,4hatebu_user,5url,6date
                 show_hatebu_user(global_diigo_List[aIndex][5]);
             }
             else if ( getOption("Xbookmark_list") === "delicious"){//favicon_url,title,tag,comment,hatebu_user,url,date
                 show_hatebu_user(global_delicious_List[aIndex][5]);
             }
             else if ( getOption("Xbookmark_list") === "hatebu"){
                 show_hatebu_user(global_hatebu_List[aIndex][5]);
             }
             
             else if ( getOption("Xbookmark_list") === "google"){//0favicon_url,1title,2tag,3hatebu_user ,4url
                 show_hatebu_user(global_google_List[aIndex][4]);
             } 
             else{
                 showPopup({
                               icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                               message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                           });
             }
         }
         
         function edit_tag (aIndex) {  
             if ( getOption("Xbookmark_list") === "diigo"){ //0favicon_url,1title,2tag,3comment,4hatebu_user,5url,6date
                 tPrompt.close();
                 prompt.read( M({ja: "タグ:", en: "tag:"}),function (aVa) {
                                  display.echoStatusBar(M({en: "", ja: "タグの間はカンマで区切って下さい。"}));
                                  bookmarks = [
                                      {
                                          "title":global_diigo_List[aIndex][1], 
                                          "url":global_diigo_List[aIndex][5], 
                                          "shared":"yes", 
                                          "tags":aVa, 
                                          "desc":global_diigo_List[aIndex][3]
                                      }
                                  ];
                                  var xhr = new XMLHttpRequest();
                                  var URL = 'http://api2.diigo.com/bookmarks';
                                  xhr.open("PUT", URL, false);
                                  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
                                  xhr.send("bookmarks=" + encodeURIComponent(JSON.stringify(bookmarks)));
                                  var obj = util.safeEval('[' + xhr.responseText + ']');
                                  showPopup({
                                                icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                title   : M({ja: "diigoでタグを変更しました。", en: "edit tag"}),
                                                message : M({ja: global_diigo_List[aIndex][1],en: global_diigo_List[aIndex][1]})
                                            });
                              },null,tag_list,global_diigo_List[aIndex][2]);
             }
             else if ( getOption("Xbookmark_list") === "delicious"){//0favicon_url,1title,2tag,3comment,4hatebu_user,5url,6date
                 tPrompt.close();
                 prompt.read( M({ja: "タグ:", en: "tag:"}),function (aVa) {
                                  var delicious_tmp_tag_list = global_delicious_List[aIndex][2].split(',');
                                  var post_tag   = encodeURIComponent(delicious_tmp_tag_list.join(' '));
                                  var delicious_comment_post = encodeURIComponent(global_delicious_List[aIndex][3]);
                                  var xhr        = new XMLHttpRequest();
                                  var api        = 'https://api.del.icio.us/v1/posts/add?';
                                  var URL        = api+'url=' + encodeURIComponent(global_delicious_List[aIndex][5]) + '&description=' + encodeURIComponent(global_delicious_List[aIndex][1]) +'&shared=yes'+'&tags='+ post_tag + '&extended=' + encodeURIComponent(global_delicious_List[aIndex][3]);
                                  xhr.open("GET", URL, false);
                                  xhr.send("");
                                  showPopup({
                                                icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                title   : M({ja: "deliciousでタグを変更しました。", en: "edit tag"}),
                                                message : M({ja: xhr.responseText,en: global_delicious_List[aIndex][5]})
                                            });
                              },null,tag_list,global_delicious_List[aIndex][2]);
             }
             else if ( getOption("Xbookmark_list") === "hatebu"){ //favicon_url,title,tag,comment,number_hatebu,url,date
                 tPrompt.close();
                 prompt.read( M({ja: "タグ:", en: "tag:"}),function (aVa) {
                                  var xhr_json = new XMLHttpRequest;
                                  var hatebu_url = 'http://b.hatena.ne.jp/entry/jsonlite/?url=' + encodeURIComponent(global_hatebu_List[aIndex][5]);
                                  xhr_json.open('GET',hatebu_url,false);
                                  xhr_json.send('');
                                  var  hatena_json = util.safeEval('(' + xhr_json.responseText + ')');
                                  var hatebu_eid = hatena_json.eid;
                                  var hatebu_tag_list = aVa.split(',');
                                  var joined_tag = hatebu_tag_list.join('][');
                                  var send_tag = '[' + joined_tag + ']' + global_hatebu_List[aIndex][3];
                                  //  <title>dummy</title>
                                  //  <link rel="related" type="text/html" href={global_hatebu_List[aIndex][5]}/>
                                  var request =
                                      <entry xmlns="http://purl.org/atom/ns#">
                                      <summary type="text/plain">{send_tag}</summary>
                                      </entry>;
                                  
                                  var data = request.toString();
                                  var wsse = new WSSEUtils(hatebu_username,hatebu_passaord);
                                  var URL = 'http://b.hatena.ne.jp/atom/edit/' + hatebu_eid;
                                  var xhr = new XMLHttpRequest();
                                  xhr.open("PUT", URL, false);
                                  xhr.setRequestHeader("Content-Type", "application/atom+xml");
                                  xhr.setRequestHeader("X-WSSE", wsse.getWSSEHeader());
                                  xhr.send(data);
                                  showPopup({
                                                icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                                title       : M({ja: "はてブのタグを編集しました。", en: "Done!!"}),
                                                message     : M({ja: global_hatebu_List[aIndex][1],en: global_hatebu_List[aIndex][1]})
                                            });
                              },null,tag_list,global_hatebu_List[aIndex][2]);
             } 
             
             
             else if ( getOption("Xbookmark_list") === "google"){//0favicon_url,1title,2tag,3hatebu_user ,4url
                 // tPrompt.close();
                 // prompt.read( M({ja: "タグ:", en: "tag:"}),function (aVa) {
                 //                  var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
                 //                  req.open("POST", 'https://www.google.com/bookmarks/mark', true);
                 //                  req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                 //                  var http=Components.classes["@mozilla.org/network/protocol;1?name=http"].getService(Components.interfaces.nsIHttpProtocolHandler);
                 //                  var useragent=http.userAgent;
                 //                  req.setRequestHeader('User-Agent', useragent+" GoogleToolbarFF");
                 //                  // req.setRequestHeader('User-Agent', useragent+" GMarks");
                 //                  req.setRequestHeader('Accept','text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5');
                 //                  var data='s='+Xbookmark_google_sig+'&bkmk='+global_google_List[aIndex][4]+'&title='+global_google_List[aIndex][1]+
                 //                      '&labels='+aVa+'&annotation='+ここをどこかから持ってくる。+"&zx="+Math.floor(Math.random()*32768);
                 //                  req.send(data);
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "ごめんなさい。。。", en: "sorry...."}),
                               message : M({ja: 'Google bookmarksではこの機能は使えません。',en: ''})
                           });
                 //   },null,tag_list,global_hatebu_List[aIndex][2]);
             } 
             else{
                 showPopup({
                               icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                               message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                           });
             }
         }
         
         function delete_bookmark (aIndex) {  //0favicon_url,1title,2tag,3comment,4hatebu_user,5url,6date
             if ( getOption("Xbookmark_list") === "diigo"){
                 var delete_url = [global_diigo_List[aIndex][5]];
                 var xhr = new XMLHttpRequest();
                 var URL = 'http://api2.diigo.com/bookmarks';
                 xhr.open("DELETE", URL, false);
                 xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
                 xhr.send("urls=" + encodeURIComponent(JSON.stringify(delete_url)));
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "diigoでブックマークを削除しました。", en: "delete bookmark"}),
                               message : M({ja: xhr.responseText,en: global_diigo_List[aIndex][1]})
                           });
             }
             else if ( getOption("Xbookmark_list") === "delicious"){
                 var xhr        = new XMLHttpRequest();
                 var api        = 'https://api.del.icio.us/v1/posts/delete?';
                 var URL        = api+'url=' + encodeURIComponent(global_delicious_List[aIndex][5]);
                 xhr.open("GET", URL, false);
                 xhr.send("");
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "deliciousでタグを変更しました。", en: "edit tag"}),
                               message : M({ja: xhr.responseText,en: xhr.responseText})
                           });
             }
             else if ( getOption("Xbookmark_list") === "hatebu"){
                 var xhr_json = new XMLHttpRequest;
                 var hatebu_url = 'http://b.hatena.ne.jp/entry/jsonlite/?url=' + encodeURIComponent(global_hatebu_List[aIndex][5]);
                 xhr_json.open('GET',hatebu_url,false);
                 xhr_json.send('');
                 var  hatena_json = util.safeEval('(' + xhr_json.responseText + ')');
                 var hatebu_eid = hatena_json.eid;
                 var wsse = new WSSEUtils(hatebu_username,hatebu_passaord);
                 var URL = 'http://b.hatena.ne.jp/atom/edit/' + hatebu_eid;
                 var xhr = new XMLHttpRequest();
                 xhr.open("DELETE", URL, false);
                 xhr.setRequestHeader("Content-Type", "application/atom+xml");
                 xhr.setRequestHeader("X-WSSE", wsse.getWSSEHeader());
                 xhr.send('');
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title       : M({ja: "はてブのブックマークを削除しました。", en: "Done!!"}),
                               message     : M({ja: global_hatebu_List[aIndex][1],en: global_hatebu_List[aIndex][1]})
                           });
             }
             
             else if ( getOption("Xbookmark_list") === "google"){
                 showPopup({
                               icon : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "ごめんなさい。。。", en: "sorry...."}),
                               message : M({ja: 'Google bookmarksではこの機能は使えません。',en: ''})
                           });
             } 
             else{
                 showPopup({
                               icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                               title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                               message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                           });
             }
         }

         var self = {
             show_bookmark: function(){
                 if ( getOption("Xbookmark_list") === "diigo"){
                     callSelector_diigo('','');
                 }
                 else if ( getOption("Xbookmark_list") === "delicious"){
                     callSelector_delicious('','');
                 }
                 else if ( getOption("Xbookmark_list") === "hatebu"){
                     callSelector_hatebu('','');
                 }
                 else if ( getOption("Xbookmark_list") === "google"){
                     callSelector_google();
                 }
                 else{
                     showPopup({
                                   icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                   title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                                   message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                               });
                 }
             },
             show_bookmark_tag: function(){
                 if ( getOption("Xbookmark_list") === "diigo"){
                     prompt.read(
                         M({ja: "タグ:", en: "tag:"}), function (aVa) {
                             tPrompt.close();
                             callSelector_diigo("&tags=", aVa);
                         },null,tag_list);
                 }
               else  if ( getOption("Xbookmark_list") === "delicious"){
                     prompt.read(
                         M({ja: "タグ:", en: "tag:"}), function (aVa) {
                             tPrompt.close();
                             callSelector_delicious("/", aVa);
                         },null,tag_list);
                 }
               else  if ( getOption("Xbookmark_list") === "hatebu"){
                     prompt.read(
                         M({ja: "タグ:", en: "tag:"}), function (aVa) {
                             tPrompt.close();
                             callSelector_hatebu("&tag=", aVa);
                         },null,tag_list);
                 }
                   else  if ( getOption("Xbookmark_list") === "hatebu"){
                      showPopup({
                                   icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                   title   : M({ja: "ごめんなさい。。。", en: "sorry...."}),
                                   message : M({ja: 'Google bookmarksではこの昨日は使えません。',en: 'can not use on Google bookmarks.'})
                                });
                                                                                                      }
                  else{
                     showPopup({
                                   icon    : 'http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png',
                                   title   : M({ja: "オプション設定がされていません。", en: "can not find option prefference"}),
                                   message : M({ja: '初期設定ファイルのオプション設定を確認して下さい。',en: 'see your .keysnail.js'})
                               });
                 }
                 },
             post_bookmark: function(){
                 post_bookmark();
             },
             
             view_hatebu_users:function(){
                 var w          = window._content;
                 var d          = w.document;
                 var url   = d.location.href;
                 show_hatebu_user(url);
             }
             
         };
             
return self;
         
         
     })();

ext.add("Xbookmark_show_bookmark", Xbookmark.show_bookmark,
        M({ja: "ブックマークをリスト表示",
           en: "show bookmark list"}));

ext.add("Xbookmark_show_bookmark_tag", Xbookmark.show_bookmark_tag,
        M({ja: "タグで絞り込んだブックマークをリスト表示",
           en: "show bookmark list"}));

ext.add("Xbookmark_post_bookmark", Xbookmark.post_bookmark,
        M({ja: "ブックマークを追加",
           en: "post bookmark"}));

ext.add("Xbookmark_view_bookmark_users", Xbookmark.view_hatebu_users,
        M({ja: "ブクマしているユーザーを見る",
           en: "hatena bookmarks "}));
     
var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>Xbookmark</name>
    <name lang="ja">Xbookmark</name>
    <description>Xbookmark</description>
    <description lang="ja">複数のSBMにクロスポスト</description>
    <version>0.0.3</version>
    <iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Xbookmark.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.3.2</minVersion>
    <include>main</include>
    <provides>  
    <ext>Xbookmark_show_bookmark</ext>
    <ext>Xbookmark_show_bookmark_tag</ext>
    <ext>Xbookmark_post_bookmark</ext>
    <ext>Xbookmark_view_bookmark_users</ext>
    </provides>
    <detail><![CDATA[
                       ==== 機能 ====
                       複数のソーシャルブックマークにポストしたりします。
                       ==== 設定 ====
                       リスト表示に用いるSBMを選択します。diigo,delicious,hatebu,googleのうちいずれかを選択してください。以下の例は、はてなブックマークを選択した例です。
                   　　以下のスクリプトを.keysnail.js内のPRESERVEエリアに書いてください。
                       >||
                       plugins.options["Xbookmark_opt.Xbookmark_list"] = "hatebu";
                       ||<
                       投稿先のSBMを選択します。選択する場合は「true」選択しない場合は、「false」とします。delisiousを選択する場合は、ユーザ名を指定して下さい。以下の例では全てのSBMに投稿する場合の例です、deliciousのユーザ名はhogeです。以下のスクリプトを.keysnail.js内のPRESERVEエリアに書いてください。
                       >||
plugins.options["Xbookmark_opt.diigo_post"]         = true;
plugins.options["Xbookmark_opt.delicious_post"]     = true;
plugins.options["Xbookmark_opt.delicious_username"] = "hoge";
plugins.options["Xbookmark_opt.google_post"]        = true;
plugins.options["Xbookmark_opt.hatebu_post"]        = true;
                       ||<

                   ブックマークをリスト表示した時に、任意のアイテムに対して様々なアクションを選べるのですが、それぞれのアクションに対してもキーバインドを設定できます。以下のようなスクリプトを.keysnail.js内のPRESERVEエリアに書いてください。
                       >||
plugins.options["Xbookmark_opt.keymap"] = {
    "C-z" : "prompt-toggle-edit-mode",
    "SPC" : "prompt-next-page", 
    "b"   : "prompt-previous-page",
    "j"   : "prompt-next-completion",
    "k"   : "prompt-previous-completion",
     "g"  : "prompt-beginning-of-candidates",
     "G"  : "prompt-end-of-candidates",
     "D"  : "prompt-cancel",
    // Xbookmark specific actions
    "o"   : "local_open",              //選択したブックマークのサイトを開く。
    "h"   : "local_show_hatebu_user",  //選択したブックマークをブックマークしているはてブユーザをリスト表示
    "e"   : "local_delete_bookmark",　 //選択したブックマークを削除
    "d"   : "local_edit_tag"           //選択したブックマークのタグを編集
};                              
                       ||<
                  次のようなスクリプトをを.keysnail.js内のPRESERVEエリアに追加しておくとブックマークの投稿及びリスト表示に任意のキーバインドを当てられます。
                   今回はCtrlキーを押しながらcを押して、bを押すとブックマーク投稿用のプロンプトが開き、Ctrlキーを押しながらxを押して、bを押すとブックマークのリストが表示されます。
                                          >||
key.setViewKey(['C-c', 'b'], function (ev, arg) {
                     ext.exec("Xbookmark_post_bookmark", arg);
                 }, 'ブックマークをポスト', true);
key.setViewKey(['C-x', 'b'], function (ev, arg) {
                     ext.exec("Xbookmark_show_bookmark", arg);
                 }, '最近のブックマークをリスト表示', true);
                       ||<
                   
                   
                               ==== タグの補完機能 ====
                               
ブックマークを投稿する時、タグで検索する時、タグの入力プロンプトでは補完機能が使えます。TABキーで補完候補を表示させることができます。
                           
                       ]]></detail>
               </KeySnailPlugin>;