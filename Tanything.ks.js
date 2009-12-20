var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>Tanything</name>
    <name lang="ja">Tanything</name>
    <description>Tanything</description>
    <description lang="ja">タブをKeySnailで制御</description>
    <version>0.0.5</version>
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
		     タブをKeySnailから制御します。
==== 起動 ====

次のようにして適当なキーへ Tanythingを割り当てます。
.keysnail.js へ以下のようなスクリプトを張り付けてください。
>||
key.setViewKey("a", function (ev, arg) {
    ext.exec("tanything", arg);
}, "タブを一覧表示", true);
||<

		     ]]></detail>
    </KeySnailPlugin>;



// ================ Key Bindings ====================== //


function tanything () {
  var promptList = [];
  var w = Application.activeWindow;
  var tabs = Array.apply(null, w.tabs);
  for each (var tab in tabs) {
    favic = "http://" + tab.uri.host + "/favicon.ico";
    promptList.push([favic, tab.document.title, tab.uri.spec]);
  }

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
      actions: [
      [function (aIndex) {
	  tabs[aIndex].focus();
          gBrowser.focus();
          _content.focus();
       },M({ja: "このタブを開く", en: "open tab"})],
      [function (aIndex) {
	 tabs[aIndex].close();
       }, M({ja: "このタブを閉じる", en: "close tab"})],
      [function (aIndex) {
	 for (var i = tabs.length - 1; i != aIndex; i--){}
	 for (i--; i >=0 ; i--){
	   tabs[i].close();

	   }
	 }, M({ja: "左のタブをすべて閉じる", en: "open left tab"})],
      [function (aIndex) {
	 for (var i = tabs.length - 1; i != aIndex; i--)
	 {
	   tabs[i].close();
	 }
      }, M({ja: "右のタブをすべて閉じる", en: "close right tab"})],
      [function (aIndex) {
	 for (var i = tabs.length - 1; i != aIndex; i--){}
	 for (i--; i >=0 ; i--){
	   tabs[i].close();

	   }
	 for (var i = tabs.length - 1; i != aIndex; i--)
	 {
	   tabs[i].close();
	 }
      }, M({ja: "他のタブをすべて閉じる", en: "close other all tab"})],
      [function (aIndex) {
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
      }, M({ja: "同じドメインのタブをすべて閉じる", en: "close same domain tab"})],
	[function (aIndex) {
	   var txt = "<a href=\"" + tabs[aIndex].uri.spec + "\">" + tabs[aIndex].document.title + "</a>";
	   const CLIPBOARD = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
	   CLIPBOARD.copyString(txt);
             }, M({ja: "タイトルとURLをHTMLタグ付きでクリップボードにコピー", en: ""})],
	[function (aIndex) {
	   var txt = "<a href=\"" + tabs[aIndex].uri.spec + "\">" + "</a>";
		       const CLIPBOARD = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
	   CLIPBOARD.copyString(txt);
	 },  M({ja: "URLをHTMLタグ付きでクリップボードにコピー", en: ""})],
      [function (aIndex) {
	 tabs[aIndex].moveToEnd();
       }, M({ja: "タブを末尾に移動する", en: ""})]
       ]
		  });
       }
ext.add("tanything", tanything,
        M({ja: "タブを一覧表示",
		    en: "view all tabs "}));