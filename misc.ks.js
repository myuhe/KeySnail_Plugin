var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>misc</name>
    <name lang="ja">misc</name>
    <description>misc</description>
    <description lang="ja">misc</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/misc.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <include>main</include>
    <provides>
    <ext>focus_window</ext>
    </provides>
   
    <detail><![CDATA[

		     ==== 機能 ====
		     極私的なスクリプトの集まりです。
>||
key.setGlobalKey(["C-c", "w"], function (ev, arg) {
    ext.exec("focus_window", arg);
}, "ウィンドウにフォーカス", true);

key.setGlobalKey(["C-c", "r"], function (ev, arg) {
    ext.exec("focus_prompt", arg);
}, "プロンプトにフォーカス", true);

key.setViewKey('i', function (aEvent) {
    ext.exec("set_Caret", arg);
}, "キャレットモード", true);

key.setCaretKey('i', function (aEvent) {
    ext.exec("remove_Caret", arg);
}, "キャレットモードをキャンセル", true);

key.setGlobalKey(["C-c", "q"], function (ev, arg) {
    ext.exec("readability", arg);
}, "readability", true);


||<
		     ]]></detail>
    </KeySnailPlugin>;
 
function focus_window (ev, arg) {
    gBrowser.focus();
    _content.focus();
}

function focus_prompt (ev, arg) {
    var p = document.getElementById("keysnail-prompt");
    if (p.hidden)
        return;
    document.getElementById("keysnail-prompt-textbox").focus();
}

function remove_Caret() {
	prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null);
	prefs.setBoolPref('accessibility.browsewithcaret', false);
}

function set_Caret() {
	prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null);
	prefs.setBoolPref('accessibility.browsewithcaret', true);
}

function readability (){
    x=content.document.createElement('SCRIPT');
    x.type='text/javascript';
    x.src='http://brettterpstra.com/share/readability.js?x='+(Math.random());
    content.document.getElementsByTagName('head')[0].appendChild(x);
    y=content.document.createElement('LINK');
    y.rel='stylesheet';
    y.href='http://brettterpstra.com/share/readability.css?x='+(Math.random());
    y.type='text/css';
    y.media='screen';
    content.document.getElementsByTagName('head')[0].appendChild(y);
    }


ext.add("focus_window", focus_window,
        M({ja: "ウィンドウにfocus",
		    en: "focus window"}));

ext.add("focus_prompt", focus_prompt,
        M({ja: "プロンプトにfocus",
		    en: "focus prompt"}));

ext.add("set_Caret", set_Caret,
        M({ja: "キャレットモード",
		    en: "caret_mode"}));

ext.add("remove_Caret", remove_Caret,
        M({ja: "キャレットモードをキャンセル",
		    en: "caret_mode"}));

ext.add("readability", readability,
        M({ja: "readabilityスタート",
		    en: "start readability"}));
