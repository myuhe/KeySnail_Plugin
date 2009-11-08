var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>misc</name>
    <name lang="ja">misc</name>
    <description>misc</description>
    <description lang="ja">misc</description>
    <version>0.0.1</version>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/misc.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <include>main</include>
    <provides>
    <ext>window_focus</ext>
    </provides>
   
    <detail><![CDATA[

		     ==== 機能 ====
		     極私的なスクリプトの集まりです。
>||
key.setGlobalKey(["C-c", "w"], function (ev, arg) {
    ext.exec("window_focus", arg);
}, "ウィンドウにフォーカス", true);
||<
		     ]]></detail>
    </KeySnailPlugin>;
 


function focus_window() {
    //    ucjs_ExternalEditor.runapp(event);
    window.content.focus()
}


ext.add("focus_window", focus_window,
        M({ja: "ウィンドウにfocus",
		    en: "focus window"}));