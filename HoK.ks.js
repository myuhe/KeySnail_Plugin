var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>HoK</name>
    <name lang="ja">HoK</name>
    <description>HaH on KeySnail</description>
    <description lang="ja">KeySnailでHaH</description>
    <version>0.0.2</version>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/HoK.ks.js</updateURL>
    <iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/HoK.png</iconURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <include>main</include>
    <provides>
    <ext>HoK</ext>
    </provides>
    <options>
        <option>
            <name>hok.hint_keys</name>
            <type>string</type>
            <description>Hints keys (default asdfghjkl)</description>
            <description lang="ja">ヒントに使うキー (デフォルトは asdfghjkl)</description>
        </option>
        <option>
            <name>hok.selector</name>
            <type>string</type>
            <description>SelectorAPI query</description>
            <description lang="ja">ヒントの取得に使う SelectorAPI クエリ</description>
        </option>
        <option>
            <name>hok.hint_color_link</name>
            <type>string</type>
            <description>Color of the hints for links</description>
            <description lang="ja">リンク用ヒントの色</description>
        </option>
        <option>
            <name>hok.hint_color_form</name>
            <type>string</type>
            <description>Color of the hints for forms</description>
            <description lang="ja">フォーム用ヒントの色</description>
        </option>
        <option>
            <name>hok.hint_color_focused</name>
            <type>string</type>
            <description>Color of focused hints</description>
            <description lang="ja">フォーカスされているヒントの色</description>
        </option>
        <option>
            <name>hok.hint_base_style</name>
            <type>object</type>
            <description>Color of focused hints</description>
            <description lang="ja">ヒントのスタイルを設定する。</description>
        </option>
    </options>
    <detail><![CDATA[
		       === Usage ===
	       ]]></detail>
    <detail lang="ja"><![CDATA[
		       === Usage ===
		       ==== Suggestion ====
		       ==== Command ====
		       === 説明 ===
		       HaHをKeysnailプラグインとして移植したものです。

		       === カスタマイズ ===


	       ]]></detail>
    </KeySnailPlugin>;

var originalSuspendesStatus;

var optionsDefaultValue = {
    "hint_keys"          : 'asdfghjkl',
    "selector"           : 'a[href], input:not([type="hidden"]), textarea, select, img[onclick], button',
    "hint_base_style"    : {
            position        : 'absolute',
            zIndex          : '2147483647',
            color           : '#000',
            fontSize        : '10pt',
            fontFamily      : 'monospace',
            lineHeight      : '10pt',
            padding         : '0px',
            margin          : '0px',
            textTransform   : 'uppercase'
    },
    "hint_color_link"    : 'rgba(255, 255, 0, 0.7)',
    "hint_color_form"    : 'rgba(0, 255, 255, 0.7)',
    "hint_color_focused" : 'rgba(255, 0, 255, 0.7)'
};

function getOption(aName) {
    var fullName = "hok." + aName;
    if (typeof(plugins.options[fullName]) != "undefined") {
        return plugins.options[fullName];
    } else {
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

var hah = {
    hintKeys         : getOption("hint_keys"),
    selector         : getOption("selector"),
    hintBaseStyle    : getOption("hint_base_style"),
    hintColorLink    : getOption("hint_color_link"),
    hintColorForm    : getOption("hint_color_form"),
    hintColorFocused : getOption("hint_color_focused"),
    keyMap           : {'8': 'Bkspc', '46': 'Delete'},

    hintKeysLength  : null,
    fragment        : null,
    hintContainer   : null,
    hintContainerId : 'hintContainer',
    hintSpan        : null,
    hintElements    : [],
    html            : null,
    body            : null,
    inWidth         : null,
    inHeight        : null,
    inputKey        : '',
    lastMatchHint   : null,

    getAbsolutePosition : function (elem) {
        var style = getComputedStyle(elem, null);
        if (style.visibility === 'hidden' || style.opacity === '0') return false;
        var rect = elem.getClientRects()[0];
        if (rect && rect.right - rect.left && rect.left >= 0 && rect.top >= -5 && rect.bottom <= hah.inHeight + 5 && rect.right <= hah.inWidth) {
            return {
                top: (hah.body.scrollTop || hah.html.scrollTop) - hah.html.clientTop + rect.top,
                left: (hah.body.scrollLeft || hah.html.scrollLeft) - hah.html.clientLeft + rect.left
            };
        }
        return false;
    },
    createText : function (num) {
        var text = '';
        var l = hah.hintKeysLength;
        var iter = 0;
        while (num >= 0) {
            var n = num;
            num -= Math.pow(l, 1 + iter++);
        }
        for (var i = 0; i < iter; i++) {
            var r = n % l;
            n = Math.floor(n / l);
            text = hah.hintKeys.charAt(r) + text;
        }
        return text;
    },
    drawHints : function(){
        var k = 0;
        Array.slice(content.document.querySelectorAll(hah.selector)).forEach(
            function (elem, ind) {
                var pos = hah.getAbsolutePosition(elem);
                if (pos === false) return;
                var hint = hah.createText(k);
                var span = hah.hintSpan.cloneNode(false);
                span.appendChild(content.document.createTextNode(hint));
                var ss = span.style;
                ss.left = Math.max(0, pos.left - 8) + 'px';
                ss.top = Math.max(0, pos.top - 8) + 'px';
                if (elem.hasAttribute('href') === false)
                {
                    ss.backgroundColor = hah.hintColorForm;
                }
                hah.hintElements[hint] = span;
                span.element = elem;
                hah.hintContainer.appendChild(span);
                k++;
            });
        content.document.body.appendChild(hah.fragment);
        content.document.addEventListener('keypress', this, true);
    },
    removeHints : function(){
        content.document.body.removeChild(hah.hintContainer);
        content.document.removeEventListener('keypress', this, true);
        key.suspended = originalSuspendesStatus;
    },
    blurHint : function () {
        if (hah.lastMatchHint)
        {
            hah.lastMatchHint.style.backgroundColor = hah.lastMatchHint.element.hasAttribute('href') === true ?
                hah.hintColorLink: hah.hintColorForm;
            hah.lastMatchHint = null;
        }
    },
    handleEvent : function (event) {
        var key = event.keyCode || event.charCode;

        if (key in hah.keyMap === false)
        {
            hah.inputKey = '';
            hah.removeHints();
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        var onkey = hah.keyMap[key];

        switch (onkey) {
        case 'Bkspc' : 
        case 'Delete' :
            if (!hah.inputKey) {
                hah.removeHints();
                return;
            }
            hah.inputKey ='';
            hah.blurHint();
            return;
        default :
            hah.inputKey += onkey;
        };

        hah.blurHint();

        if (hah.inputKey in hah.hintElements === true)
        {
            hah.lastMatchHint = hah.hintElements[hah.inputKey];
            hah.lastMatchHint.style.backgroundColor = hah.hintColorFocused;
            hah.lastMatchHint.element.focus();
        }
        else
        {
            hah.lastMatchHint = null;
        }

    },
    init : function(){
        hah.hintContainer = content.document.getElementById(hah.hintContainerId);

        if (!hah.hintContainer)
        {
            hah.fragment = content.document.createDocumentFragment();
            hah.hintContainer = content.document.createElement('div');
            hah.fragment.appendChild(hah.hintContainer);
            hah.hintContainer.id = hah.hintContainerId;
            hah.hintSpan = content.document.createElement('span');

            var st = hah.hintSpan.style;

            for (var prop in hah.hintBaseStyle)
            {
                st[prop] = hah.hintBaseStyle[prop];
            }

            st.backgroundColor = hah.hintColorLink;
        }

        hah.inHeight       = window.innerHeight;
        hah.inWidth        = window.innerWidth;
        hah.html           = content.document.documentElement;
        hah.body           = content.document.body;
        hah.hintKeysLength = hah.hintKeys.length;
        
        hah.hintKeys.split('').forEach(function(l) { hah.keyMap[l.charCodeAt(0)] = l; });
    }
};

function HoK () {
    originalSuspendesStatus = key.suspended;
    key.suspended = true;
    hah.init();
    hah.drawHints();
}

ext.add("HoK", HoK,
        M({ja: "HoKを実行します",
	   en: "execute HaH"}));
