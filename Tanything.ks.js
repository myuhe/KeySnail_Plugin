var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>Tanything</name>
    <name lang="ja">Tanything</name>
    <description>Tanything</description>
    <description lang="ja">KeySnailからタブを操作</description>
    <version>0.0.9</version>
    　　<iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Tanything.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Tanything.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <include>main</include>
    <provides>
    <ext>tanything</ext>
    </provides>
    <detail><![CDATA[

                       ==== 機能 ====
                       タブをKeySnailから操作します。
                       ==== 起動 ====

                   適当なキーへ Tanythingを割り当てます。
                       .keysnail.js へ以下のようなスクリプトを張り付けてください。以下の例では"a"に割り当ててます。
                       >||
                       key.setViewKey("a", function (ev, arg) {
                                          ext.exec("tanything", arg);
                                      }, "タブを一覧表示", true);
                       ||<
                       
                       ==== キーバインドの設定 ====

                   次のような設定を .keysnail.js の PRESERVE エリアへ張り付けておくと、かくだんに操作がしやすくなります。

                       >||
                       plugins.options["tanything_opt.keymap"] = {
                           "C-z"   : "prompt-toggle-edit-mode",
                           "SPC"   : "prompt-next-page",
                           "b"     : "prompt-previous-page",
                           "j"     : "prompt-next-completion",
                           "k"     : "prompt-previous-completion",
                           "g"     : "prompt-beginning-of-candidates",
                           "G"     : "prompt-end-of-candidates",
                           "D"     : "prompt-cancel",
                           // Tanything specific actions
                           "O"     : "localOpen",
                           "q"     : "localClose",
                           "p"     : "localLeftclose",
                           "n"     : "localRightclose
                           "a"     : "localAllclose",
                           "d"     : "localDomainclose",
                           "c"     : "localClipUT",
                           "C"     : "localClipU",
                           "e"     : "localMovetoend",
                       };
                       ||<

                   このままではアルファベットが入力できないので、もし絞り込み健作などでアルファベットを入力したくなった場合は C-z を入力するか「閉じる」ボタン左の「地球マーク」をクリックし、編集モードへと切り替えてください。

               ]]></detail>
    </KeySnailPlugin>;



// ================ Key Bindings ====================== //
var optionsDefaultValue = {
    "keymap" : {}
};

function getOption(aName) {
    var fullName = "tanything_opt." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
    {
        return plugins.options[fullName];
    }
    else
    {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

var tanything =
    (function () {
         var tanythingAction = [
             [function (aIndex) {
                  //if (aIndex)
                      open(aIndex);
                       },M({ja: "このタブを開く : ", en: ""}) + "open tab","localOpen,c"],
             [function (aIndex) {
                  //if (aIndex)
                      close(aIndex);
                       }, M({ja: "このタブを閉じる : ", en: ""}) + "close tab", "localClose,c"],
             [function (aIndex) {
                  leftclose(aIndex);
              }, M({ja: "左のタブをすべて閉じる : ", en: ""}) + "close left tab", "localLeftclose,c"],
             [
                 function (aIndex) {
                     rightclose(aIndex);
                 }
                 , M({ja: "右のタブをすべて閉じる : ", en: ""}) + "close right tab", "localRightclose,c"],
             [function (aIndex) {
                  allclose(aIndex);
              }, M({ja: "他のタブをすべて閉じる : ", en: ""}) + "close other all tab", "localAllclose,c"],
             [function (aIndex) {
                  domainclose(aIndex);
              }, M({ja: "同じドメインのタブをすべて閉じる : ", en: ""}) + "close same domain tab", "localDomainclose,c"],
             [function (aIndex) {
                  if (aIndex)
                      clipUT(aIndex);
              }, M({ja: "URLとタイトルをHTMLタグ付きでクリップボードにコピー : ", en: ""}) + "copy URL and title", "localClipUT,c"],
             [function (aIndex) {
                  if (aIndex)
                      clipU(aIndex);
              },  M({ja: "URLをHTMLタグ付きでクリップボードにコピー : ", en: ""}) + "copy URL","localClipU,c"],
             [function (aIndex) {
                  if (aIndex)
                      movetoend(aIndex);
              }, M({ja: "タブを末尾に移動する : ", en: ""}) + "move to end", "localMovetoend,c"]
         ];
         
         function callSelector() {
                      var deleteNO = 0;
                           var promptList = 
             function(collection){
                 var tmpList =[];
                 var w = Application.activeWindow;
                 var tabs = Array.apply(null, w.tabs);
                 for each (var tab in tabs) {
                     try{
                         favic = "http://" + tab.uri.host + "/favicon.ico";
                     }
                     catch(e){
                         favic = "chrome://keysnail/skin/icon16.png";
                     }
                     tmpList.push([favic, tab.document.title, tab.uri.spec]);
                 }
                 return tmpList;
             };
             //   );
             prompt.selector({
                                 message: "select tab: ",
                                 flags: [ICON | IGNORE,0, 0],
                                 collection: promptList,
                                 header: ["title", "url"],
                                 callback: function (index) {
                                     if (index < 0 || tabs.length < index) {
                                         return;
                                     }

                                 },
                                 keymap :getOption("keymap"),
                                 actions:tanythingAction
                             });
         }
         
         
         
         function open (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             tabs[aIndex].focus();
             gBrowser.focus();
             _content.focus();
         }
         function close(aIndex) {
              var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
               for (var i = tabs.length - 1; i != -1; i--){
             if(tabs[i].uri.spec == tabs[aIndex].uri.spec){
                     tabs[i].close();
               }
             }
        }
         function leftclose (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             for (var i = tabs.length - 1; i != aIndex; i--){}
             for (i--; i >=0 ; i--){
                 tabs[i].close();
             }
         }
         function rightclose (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             for (var i = tabs.length - 1; i != aIndex; i--)
             {
                 tabs[i].close();
             }
         }
         function allclose (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             for (var i = tabs.length - 1; i != aIndex; i--){}
             for (i--; i >=0 ; i--){
                 tabs[i].close();

             }
             for (var i = tabs.length - 1; i != aIndex; i--)
             {
                 tabs[i].close();
             }
         }
         
         function domainclose (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             for (var i = tabs.length - 1; i != aIndex; i--){}
             for (i--; i >=0 ; i--){
                 if(tabs[i].uri.host == tabs[aIndex].uri.host){
                     tabs[i].close();
                 }
             }
             for (var i = tabs.length - 1; i != aIndex; i--)
             {
                 if(tabs[i].uri.host == tabs[aIndex].uri.host){
                     tabs[i].close();
                 }
             }
         }
         
         function clipUT (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             var txt = "<a href=\"" + tabs[aIndex].uri.spec + "\">" + tabs[aIndex].document.title + "</a>";
             const CLIPBOARD = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
             CLIPBOARD.copyString(txt);
         }
         
         function clipU(aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             var txt = "<a href=\"" + tabs[aIndex].uri.spec + "\">" + "</a>";
             const CLIPBOARD = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
             CLIPBOARD.copyString(txt);
         }
         
         function movetoend (aIndex) {
             var w = Application.activeWindow;
             var tabs = Array.apply(null, w.tabs);
             tabs[aIndex].moveToEnd();
         }
         
         
         var self = {
             showAlltab: function(){
                 callSelector();
                         //var spec = Array.apply(null, Application.activeWindow.tabs);
                         //window.alert(spec[1].uri.spec);
             }
         };
         
         return self;
         
     })();
ext.add("tanything", tanything.showAlltab,
        M({ja: "タブを一覧表示",
           en: "view all tabs "}));