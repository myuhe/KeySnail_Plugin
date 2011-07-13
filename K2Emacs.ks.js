var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>K2Emacs</name>
    <name lang="ja">K2Emacs</name>
    <description>K2Emacs</description>
    <description lang="ja">KeySnailで本当にEmacs</description>
    <version>0.0.8</version>
　　<iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/K2Emacs.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/K2Emacs.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>1.8.9</minVersion>
    <include>main</include>
    <provides>
    <ext>edit_text</ext>
    </provides>
    <options>
        <option>
            <name>K2Emacs.editor</name>
            <type>string</type>
            <description>select editor(default Emacs)</description>
            <description lang="ja">エディタを選択(デフォルトはEmacs)</description>
        </option>
        <option>
            <name>K2Emacs.ext</name>
            <type>string</type>
            <description>select file type(txt)</description>
            <description lang="ja">エディタで開くファイルの種類を選択(デフォルトはtxt)</description>
        </option>
        <option>
            <name>K2Emacs.encode</name>
            <type>string</type>
        <description>select encode(default UTF-8)</description>
        <description lang="ja">編集するテキストのエンコードを選択(デフォルトはUTF-8)</description>
        </option>
        <option>
            <name>K2Emacs.sep</name>
            <type>string</type>
        <description>select separator(default /)</description>
        <description lang="ja">プラットフォームに応じたセパレータを設定(デフォルトは/)</description>
        </option>
    </options>
    <detail><![CDATA[

		     ==== 機能 ====
		     テキストエリアなどを外部エディタで開きます。
==== 起動 ====

次のようにして適当なキーへ K2Emacs を割り当てます。
.keysnail.js 内の PRESERVE エリアへ以下のようなスクリプトを張り付けてください。
>|javascript|
key.setEditKey(["C-c", "e"], function (ev, arg) {
    ext.exec("edit_text", arg, ev);
}, "外部エディタで編集", true);
||<

==== オプションの設定 ====
プラットフォームやエディタに応じて、以下のオプションを設定します。
.keysnail.js 内の PRESERVE エリアへ以下のようなスクリプトを張り付けてください。
なお、デフォルトでは、Linuxの利用を想定した設定となっています。
以下は、Windowsを使う場合の設定例です。
>|javascript|
plugins.options["K2Emacs.editor"]    = "C:\\WINDOWS\\notepad.exe";
plugins.options["K2Emacs.ext"]    = "html";
plugins.options["K2Emacs.encode"] = "UTF-8"
plugins.options["K2Emacs.sep"] = "\\";
||<

                                     ==== 謝辞 ====
                                     このプラグインは、以下のuserChromeスクリプトを参考にしました。
　　　　　　　　　　　　　　　　　　http://space.geocities.yahoo.co.jp/gl/alice0775/view/20070223/1172156543　
		     ]]></detail>
    </KeySnailPlugin>;
 
var optionsDefaultValue = {
    "editor" : "/usr/bin/emacsclient.emacs23 -c -a emacs23",
    "ext"    : "txt",
    "encode" : "UTF-8",
    "sep"    : '/'
};

function getOption(aName) {
    var fullName = "K2Emacs." + aName;
    if (typeof(plugins.options[fullName]) != "undefined")
    {
        return plugins.options[fullName];
    }else{
        return aName in optionsDefaultValue ? optionsDefaultValue[aName] : undefined;
    }
}

var ucjs_ExternalEditor = {
//この_editor,_ext,_encodeは,自分の環境に合わせて修正のこと
    //_editor: "C:\\progra~1\\hidemaru\\hidemaru.exe", /* windows */
    // var hintKeys         = getOption("hint_keys");
    //  _editor: "/usr/bin/emacs", /* windows */
    _editor: getOption("editor"), /* windows */
  //_editor: "/bin/vi", /* unix */
    _ext: getOption("ext"),
    //  _ext: "txt",
    _encode: getOption("encode"),
    //  _encode: 'UTF-8',
//

  _tmpdir: null,
  _dir_separator: null,
  
  init: function(){
	//   this._dir_separator = '\\'; /* windows */
	//this._dir_separator = '/';  /* unix */
	this._dir_separator = getOption("sep");  /* unix */
  },

  uninit: function(){
    //後始末
    //イベント削除
    var menu = document.getElementById("contentAreaContextMenu");
    if (menu) menu.removeEventListener("popupshowing", ucjs_ExternalEditor.popupContextMenu, true);
    document.removeEventListener("focus", ucjs_ExternalEditor.checkfocus_window, true);
    //もしメインウインドウがすべて閉じられたら不要となったテンポラリファイルを削除
    if (this._tmpdir == null)return;
    var windowType = "navigator:browser";
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
    var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
    var enumerator = windowManagerInterface.getEnumerator(windowType);
    if (enumerator.hasMoreElements()) return;
    var file = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(this._tmpdir);
    var entries = file.directoryEntries;
    while (entries.hasMoreElements()){
      var entry = entries.getNext().QueryInterface(Components.interfaces.nsIFile);
      if (/^ucjs.textarea\./i.test(entry.leafName)){
        try{
          entry.remove(false);
        }catch(e){}
      }
    }

    try{
      if( file.exists() == true ) file.remove(false);
    }catch(e){}
    this._tmpdir = null;
  },


  checkfocus_window: function(){
    //メインウインドウにフォーカスが戻った, たぶん編集終わったので,テンポラリファイルの中身を書き戻す
    var target = getBrowser().contentDocument;
    var html = target.getElementsByTagName("html")[0];
    try{
      if(!html.hasAttribute("__ucjs_editor_")) return;
    }catch(e){}
    
    var textareas, filename, timestamp, encode, file, istr, sstream, utf, textBoxText;
    //すべてのtextareaとinputに関して, テンポラリファイルがあればその中身を書き戻す
    textareas = GetAllTextAreas(target);
    if (textareas.length<=0) return;
    file = Components.classes["@mozilla.org/file/local;1"].
                   createInstance(Components.interfaces.nsILocalFile);
    istr = Components.classes['@mozilla.org/network/file-input-stream;1'].
            createInstance(Components.interfaces.nsIFileInputStream);
    // FileInputStream's read is [noscript].
    sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].
            createInstance(Components.interfaces.nsIScriptableInputStream);
    utf = Components.classes['@mozilla.org/intl/utf8converterservice;1'].
          createInstance(Components.interfaces.nsIUTF8ConverterService);
  
    for(var i=0,len=textareas.length;i<len;i++){
      target = textareas[i];
      if(!target.hasAttribute("filename"))continue;
      filename = target.getAttribute("filename");
      timestamp = target.getAttribute("timestamp");
      file.initWithPath(filename);
      //タイムスタンプ古ければスキップ
      if(!file.exists() || !file.isReadable()) continue;
      if(file.lastModifiedTime <= timestamp) continue;
      target.setAttribute("timestamp", file.lastModifiedTime);

      istr.init(file, 1, 0x400, false);
      sstream.init(istr);
      textBoxText = sstream.read(sstream.available());
      encode = target.getAttribute("encode");

      if(textBoxText.length)
        target.value = utf.convertStringToUTF8(textBoxText, encode, true);
      else
        target.value = "";
      sstream.close();
      istr.close();
      try{file.remove(false);}catch(e){}
    }
    delete textareas;

    /*
       Function creates list of all textareas contained within document. It
       recursively descends to frames and iframes also.
    */
    function GetAllTextAreas(doc){
        var list_of_textareas=new Array();
        //すべてのtextarea
        var textareas=doc.getElementsByTagName('textarea');
        for (var i=0,len=textareas.length;i<len;i++){
            list_of_textareas.push(textareas.item(i));
        }
        //すべてのinput
        var textareas=doc.getElementsByTagName('input');
        for (var i=0,len=textareas.length;i<len;i++){
            list_of_textareas.push(textareas.item(i));
        }
        var frames=doc.getElementsByTagName('iframe');
        for (var i=0,len=frames.length;i<len;i++){
            list_of_textareas=list_of_textareas.concat(GetAllTextAreas(frames.item(i).contentDocument));
        }
        frames=doc.getElementsByTagName('frame');
        for (var i=0,len=frames.length;i<len;i++){
            list_of_textareas=list_of_textareas.concat(GetAllTextAreas(frames.item(i).contentDocument));
        }
        return list_of_textareas;
    }
  },

  runapp: function(ev){
    var target = ev ? ev.originalTarget : content.document.activeElement;
    this.edittarget(target);
  },
  
  edittarget: function(target){
    //targetノードで外部エディタランチ,  (別のJSA外部スクリプト UtilTextarea.js からも呼び出している)
    var textBoxText = target.value;
    // 一意のテンポラリファイル名を得る

    var file = Components.classes["@mozilla.org/file/local;1"].
               createInstance(Components.interfaces.nsILocalFile);
    if(target.hasAttribute("filename")){
      var filename = target.getAttribute("filename");
      file.initWithPath(filename);
      try{
        if( file.exists() == true ) file.remove(false);
      }catch(e){}
    }else{
      var filename = this.TmpFilenameTextarea(target.ownerDocument.URL,target.getAttribute('name'));
    }
    file.initWithPath(filename);    
    file.create(file.NORMAL_FILE_TYPE, 0600);
    // Write the data to the file.

    var ostr = Components.classes['@mozilla.org/network/file-output-stream;1'].
          createInstance(Components.interfaces.nsIFileOutputStream);
    ostr.init(file, 2, 0x200, false);
    if(navigator.platform == "Win32"){
      // Convert Unix newlines to standard network newlines.
      textBoxText = textBoxText.replace(/\n/g, "\r\n");
    }

    var conv = Components.classes['@mozilla.org/intl/saveascharset;1'].
          createInstance(Components.interfaces.nsISaveAsCharset);
    try{
      conv.Init(this._encode, 0, 0);
      textBoxText = conv.Convert(textBoxText);
    }catch(e){
      textBoxText = "";
    }
    ostr.write(textBoxText, textBoxText.length);
    ostr.flush();
    ostr.close();

    // 外部エディタをランチ
    if(this.editfile(file.path, target) == false) return;
    var html = getBrowser().contentDocument.getElementsByTagName("html")[0];
    try{
      html.setAttribute("__ucjs_editor_",true);
    }catch(e){return;}
    document.addEventListener("focus", ucjs_ExternalEditor.checkfocus_window, true);
  },

  editfile: function(filename, target) {
      // 外部エディタを起動
      // var editor = this._editor;
      var args = this._editor.split(/\s+/);
      var editorPath = args.shift();
      args.push(filename);
      var editorFile;
      var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
          .getService(Components.interfaces.nsIXULRuntime);
      if ("Darwin" == xulRuntime.OS && editorPath.match('\.app$'))
      {
          // wrap with open command (inspired from GreaseMonkey)
          args.unshift(editorPath);
          args.unshift("-a");

          editorFile = Components.classes["@mozilla.org/file/local;1"]
              .createInstance(Components.interfaces.nsILocalFile);
          editorFile.followLinks = true;
          editorFile.initWithPath("/usr/bin/open");
      }else{
          try {
              editorFile = util.openFile(editorPath);
          } catch (e) {
              display.notify(util.getLocaleString("editorErrorOccurred"));
              return;
          }
      }

      // setup target info
      target.setAttribute("encode", this._encode);
      target.setAttribute("filename", filename);
      target.setAttribute("timestamp", editorFile.lastModifiedTime);
      var process = Components.classes["@mozilla.org/process/util;1"]
          .createInstance(Components.interfaces.nsIProcess);
      process.init(editorFile);
      process.run(false, args, args.length);
      return true;
  },
 
  //Compose temporary filename
  TmpFilenameTextarea: function(strURL,strName){
    /**
     * Creates a mostly unique hash of a string
     * Most of this code is from:
     *    http://developer.mozilla.org/en/docs/nsICryptoHash
     * @param {String} some_string The string to hash.
     * @returns {String} a hashed string.
     */
    function hashString(some_string) {
      var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
            createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";

      /* result is the result of the hashing.  It's not yet a string,
       * that'll be in retval.
       * result.value will contain the array length
       */
      var result = {};
      /* data is an array of bytes */
      var data = converter.convertToByteArray(some_string, result);
      var ch   = Components.classes["@mozilla.org/security/hash;1"].
            createInstance(Components.interfaces.nsICryptoHash);
      ch.init(ch.MD5);
      ch.update(data, data.length);
      var hash = ch.finish(true);
      // return the two-digit hexadecimal code for a byte
      var toHexString = function(charCode) {
        return ("0" + charCode.toString(36)).slice(-2);
      };
      // convert the binary hash data to a hex string.
      var retval = [];
      for(i in hash) 
        retval[i] = toHexString(hash.charCodeAt(i));
      return(retval.join(""));
    }
    
    //乱数アルゴリズム参考:http://www.sm.rim.or.jp/~shishido/pie.html Math.random()の代わり
    /*メソッド一覧
    random()       :0以上1未満の実数の乱数を生成します。Math.random()と同様に使用できます。
    randomi(arg)   :0以上arg未満の整数の乱数を生成します。
    srand(arg)     :乱数の種を初期化します。引数を指定しない場合は現在時刻から種を生成します。
                    引数argを指定するとargが種になる。
    Randomize(arg) :Randomizeオブジェクトを生成するコンストラクタメソッド。
                    Randomizeオブジェクトを生成し、srandを呼び出して乱数の種を初期化します。
                    引数argを指定するとsrandに渡します。*/
    function Randomize(seed) {
      this.srand=function(seed) {
        tmpdt=new Date();
        this.seed=this.srand.arguments.length ? seed : tmpdt.getSeconds()*1000+tmpdt.getMilliseconds();
      }
      this.random=function() {
        this.seed=(this.seed*2061+7)%65536;
        return this.seed/65536;
      }
      this.randomi=function(range) {
        return Math.floor(this.random()*range*10)%range;
      }
      Randomize.arguments.length ? this.srand(seed) : this.srand();
    }
    
    // Randomizeオブジェクト生成
    var rnd=new Randomize(); // 引数なし→乱数の種は現在時刻から
    
    var TmpFilename;
    this._tmpdir = this.gettmpDir();
    do{
        TmpFilename = this._tmpdir + this._dir_separator + "ucjs.textarea." + hashString(strURL) + '_' +
                      strName + '_' + rnd.randomi(100000) + "." + this._ext;
    }while(!this.ExistsFile(TmpFilename))
    return TmpFilename;
  },
  
//Function returns true if given filename exists
  ExistsFile: function(filename){
    try{
      var file = Components.classes["@mozilla.org/file/local;1"].
                 createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(filename);
      return true;
    }catch(e){
      return false;
    }
  },

/**
* Returns the directory where we put files to edit.
* @returns nsILocalFile The location where we should write editable files.
*/
  gettmpDir: function() {
    /* Where is the directory that we use. */
    var fobj = Components.classes["@mozilla.org/file/directory_service;1"].
      getService(Components.interfaces.nsIProperties).
      get("ProfD", Components.interfaces.nsIFile);
    fobj.append('Temp_ExternalEditor');
    if (!fobj.exists()) {
      fobj.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,
                  parseInt('0700',8));
    }
    if (!fobj.isDirectory()) {
      alert('Having a problem finding or creating directory: '+fobj.path);
    }
    return fobj.path;
  }
};

function editext() {
    ucjs_ExternalEditor.runapp();
    ucjs_ExternalEditor.init();
    window.addEventListener("unload", function(){ ucjs_ExternalEditor.uninit(); }, false);
}

ext.add("edit_text", editext,
        M({ja: "外部エディタで編集",
		    en: "edit by external editor"}));
