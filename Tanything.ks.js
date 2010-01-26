// original author myuhe
// modified by mooz

var PLUGIN_INFO =
<KeySnailPlugin>
    <name>Tanything</name>
    <name lang="ja">Tanything</name>
    <description>Tanything</description>
    <description lang="ja">KeySnailからタブを操作</description>
    <version>0.1.3</version>
    <iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Tanything.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Tanything.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.2.7</minVersion>
    <include>main</include>
    <provides>
        <ext>tanything</ext>
    </provides>
    <detail><![CDATA[
==== What's this ====

This plugin allows you to manipulate tabs using prompt.selector.

==== Launching ====

Paste code below to your .keysnail.js file and you can call tanything by pressing *a* key.

>||
key.setViewKey("a", function (ev, arg) {
                   ext.exec("tanything", arg);
               }, "view all tabs", true);
||<

==== Setting keybindings ====

You can set keybindings by inserting the settings like below example to the PRESERVE area in your .keysnail.js file.

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
    "n"     : "localRightclose",
    "a"     : "localAllclose",
    "d"     : "localDomainclose",
    "c"     : "localClipUT",
    "C"     : "localClipU",
    "e"     : "localMovetoend"
};
||<

When you want to input the alphabet which bounds to the command, press C-z or click *Earth icon* and switch to the edit mode.
]]></detail>
    <detail lang="ja"><![CDATA[
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
    "n"     : "localRightclose",
    "a"     : "localAllclose",
    "d"     : "localDomainclose",
    "c"     : "localClipUT",
    "C"     : "localClipU",
    "e"     : "localMovetoend"
};
||<

このままではアルファベットが入力できないので、もし絞り込み検索などでアルファベットを入力したくなった場合は C-z を入力するか「閉じる」ボタン左の「地球マーク」をクリックし、編集モードへと切り替えてください。
]]></detail>
</KeySnailPlugin>;

// ================ Key Bindings ====================== //

var optionsDefaultValue = {
    "keymap" : {}
};

function getOption(aName) {
    var fullName = "tanything_opt." + aName;
    if (typeof plugins.options[fullName] !== "undefined")
        return plugins.options[fullName];
    else
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
}

var tanything =
    (function () {
         var currentCollection;

         var tanythingAction = [
             [function (aIndex) {
                  if (aIndex >= 0) open(aIndex);
              }, M({ja: "このタブを開く : ", en: ""}) + "open tab", "localOpen,c"],
             [function (aIndex) {
                  if (aIndex >= 0) close(aIndex);
              }, M({ja: "このタブを閉じる : ", en: ""}) + "close tab", "localClose,c"],
             [function (aIndex) {
                  if (aIndex >= 0) leftclose(aIndex);
              }, M({ja: "左のタブをすべて閉じる : ", en: ""}) + "close left tab", "localLeftclose,c"],
             [function (aIndex) {
                  if (aIndex >= 0) rightclose(aIndex);
              }, M({ja: "右のタブをすべて閉じる : ", en: ""}) + "close right tab", "localRightclose,c"],
             [function (aIndex) {
                  if (aIndex >= 0) allclose(aIndex);
              }, M({ja: "他のタブをすべて閉じる : ", en: ""}) + "close other all tab", "localAllclose,c"],
             [function (aIndex) {
                  if (aIndex >= 0) domainclose(aIndex);
              }, M({ja: "同じドメインのタブをすべて閉じる : ", en: ""}) + "close same domain tab", "localDomainclose,c"],
             [function (aIndex) {
                  if (aIndex >= 0) clipUT(aIndex);
              }, M({ja: "URLとタイトルをHTMLタグ付きでクリップボードにコピー : ", en: ""}) + "copy URL and title", "localClipUT,c"],
             [function (aIndex) {
                  if (aIndex >= 0) clipU(aIndex);
              },  M({ja: "URLをHTMLタグ付きでクリップボードにコピー : ", en: ""}) + "copy URL", "localClipU,c"],
             [function (aIndex) {
                  if (aIndex >= 0) movetoend(aIndex);
              }, M({ja: "タブを末尾に移動する : ", en: ""}) + "move to end", "localMovetoend,c"],
             [function (aIndex) {
                  if (aIndex >= 0) movetostart(aIndex);
              }, M({ja: "タブを先頭に移動する : ", en: ""}) + "move to start", "localMovetostart,c"],
             [function (aIndex) {
                  if (aIndex >= 0) addToBookmarks(aIndex);
              }, M({ja: "タブをブックマークに追加 : ", en: ""}) + "add selected tab to bookmarks", "localAddBokmark,c"]
         ];

         function getTabs() Array.slice(getBrowser().mTabContainer.childNodes);

         function callSelector() {
             // const defaultIcon = "chrome://keysnail/skin/icon16.png";

             currentCollection = [[util.getFaviconPath(tab.linkedBrowser.contentDocument.URL /*, defaultIcon */),
                                   tab.label,
                                   tab.linkedBrowser.contentDocument.URL]
                                  for each (tab in getTabs())];

             prompt.selector({
                                 message             : "select tab: ",
                                 initialIndex        : getBrowser().mTabContainer.selectedIndex,
                                 flags               : [ICON | IGNORE, 0, 0],
                                 collection          : currentCollection,
                                 header              : ["title", "url"],
                                 keymap              : getOption("keymap"),
                                 actions             : tanythingAction,
                                 supressRecoverFocus : true,
                                 onFinish            : focusContent
                             });
         }

         function focusContent() {
             getBrowser().focus();
             _content.focus();
         }

         function open(aIndex) {
             getBrowser().mTabContainer.selectedIndex = aIndex;
         }

         function close(aIndex) {
             if (currentCollection.length === 1)
             {
                 prompt.finish(true);
                 return;
             }

             getBrowser().removeTab(getTabs()[aIndex]);
             currentCollection.splice(aIndex, 1);
             prompt.refresh();
         }

         function leftclose(aIndex) {
             let tabs = getTabs();

             for (let i = 0; i < aIndex; ++i)
                 getBrowser().removeTab(tabs[i]);

             currentCollection.splice(0, aIndex);
             prompt.refresh(0);
         }

         function rightclose(aIndex) {
             let tabs = getTabs();

             for (let i = aIndex + 1; i < tabs.length; ++i)
                 getBrowser().removeTab(tabs[i]);

             currentCollection.splice(aIndex + 1, tabs.length - (aIndex + 1));
             prompt.refresh(aIndex);
         }

         function allclose(aIndex) {
             let tabs = getTabs();

             for (let i = 0; i < tabs.length; ++i)
             {
                 if (i !== aIndex)
                     getBrowser().removeTab(tabs[i]);
             }

             currentCollection = [currentCollection[aIndex]];
             prompt.refresh(0);
         }

         function getURIFromTab(aTab) aTab.linkedBrowser.currentURI;

         function domainclose(aIndex) {
             function getHost(aNsURI) {
                 try {
                     return aNsURI.host;
                 } catch (e) {
                     return "";
                 }
             }

             let tabs        = getTabs();
             let selectedURI = getURIFromTab(tabs[aIndex]);
             let host        = getHost(selectedURI);

             if (host)
             {
                 for (let i = tabs.length - 1; i >= 0; --i)
                 {
                     if (host === getHost(getURIFromTab(tabs[i])))
                     {
                         getBrowser().removeTab(tabs[i]);
                         currentCollection.splice(i, 1);
                     }
                 }
             }

             prompt.refresh();
         }

         function clipUT(aIndex) {
             let row   = currentCollection[aIndex];
             let uri   = row[2];
             let title = row[1];

             var txt = "<a href=\"" + uri + "\">" + title + "</a>";
             command.setClipboardText(txt);
         }

         function clipU(aIndex) {
             let row   = currentCollection[aIndex];
             let uri   = row[2];
             let title = row[1];

             var txt = "<a href=\"" + uri + "\">" + "</a>";
             command.setClipboardText(txt);
         }

         function movetoend(aIndex) {
             let browser = getBrowser();
             let tabs    = getTabs();

             browser.moveTabTo(tabs[aIndex], tabs.length - 1);

             let selected = currentCollection[aIndex].slice(0);
             currentCollection.splice(aIndex, 1);
             currentCollection.push(selected);

             prompt.refresh(tabs.length - 1);
         }

         function movetostart(aIndex) {
             let browser = getBrowser();
             let tabs    = getTabs();

             browser.moveTabTo(tabs[aIndex], 0);

             let selected = currentCollection[aIndex].slice(0);
             currentCollection.splice(aIndex, 1);
             currentCollection.unshift(selected);

             prompt.refresh(0);
         }

         function addToBookmarks(aIndex) {
             let tab = getTabs()[aIndex];

             [title, uri] = [tab.linkedBrowser.contentDocument.title, getURIFromTab(tab)];
             PlacesUIUtils.showAddBookmarkUI(uri, title);
         }

         var self = {
             showAlltab: function () {
                 callSelector();
             }
         };

         return self;
     })();

ext.add("tanything", tanything.showAlltab,
        M({ja: "タブを一覧表示",
           en: "view all tabs "}));
