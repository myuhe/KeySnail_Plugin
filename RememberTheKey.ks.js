/**
 * description: "A collection of commands that interact with <a href=\"http://rememberthemilk.com\">Remember the Milk<a>"
 * name: "Gary Hodgson",
 * homepage: "http://www.garyhodgson.com/ubiquity/",
 * source: "http://github.com/garyhodgson/ubiquity-rtm-api", 
 * email: "contact@garyhodgson.com",
 * license: "MPL",
 * version: "0.4.2" 
*/


/**
 * Core Type Extension
 * Now returns the index of the suggestion array as the data element 
*/


var PLUGIN_INFO =
    <KeySnailPlugin>
    <name>RememberTheKey</name>
    <name lang="ja">RememberTheKey</name>
    <description>RememberTheKey</description>
    <description lang="ja">RTMを操作</description>
    <version>0.0.2</version>
    　　<iconURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/Tanything.png</iconURL>
    <updateURL>http://github.com/myuhe/KeySnail_Plugin/raw/master/RememberTheKey.ks.js</updateURL>
    <author mail="yuhei.maeda_at_gmail.com" homepage="http://sheephead.homelinux.org/">myuhe</author>
    <license>The MIT License</license>
    <license lang="ja">MIT ライセンス</license>
    <minVersion>0.9.4</minVersion>
    <include>main</include>
    <provides>
    <ext>rtklogin</ext>
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


function RtmNounType(name, expectedWords) {this._init(name, expectedWords);};
var F = function() {};
//F.prototype = CmdUtils.NounType.prototype;  //とりあえずコメントアウト
RtmNounType.prototype = new F();
RtmNounType.prototype._init = function(name, expectedWords, defaultWord) {
    this._name = name;
    this._wordList = expectedWords;
    if(typeof defaultWord == "string") {
        this.default = function() {
           // return CmdUtils.makeSugg(defaultWord); //よくわからんがコメントあうとしてる。
        };
    }
}

RtmNounType.prototype.suggest = function(text, html) {
    var suggestions = [];
    if (typeof text != "string") {
        return [];
    }

    var t = (typeof this._wordList == 'function') ? this._wordList() : this._wordList;
    for (var x in t) {
        var word = t[x].toLowerCase();
        if (word.indexOf(text.toLowerCase()) > -1) {
//             suggestions.push(CmdUtils.makeSugg(word, word, x));  //とりあえずコメントアウト
        }
    }
    return suggestions;
}

/**
 * ISO8601 Date function from Paul Sowden (http://delete.me.uk/2005/03/iso8601.html)
 */
Date.prototype.setISO8601 = function (string) {
    if (!string) return null;
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    var time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}

/**
 * Core RTM Object
 */
var RTM = {};
RTM.constants = {
    store: {
        TASK_LISTS: "Rtm.Ubiquity.TASK_LISTS",
        SMART_LIST: "Rtm.Ubiquity.SMART_LIST",
        ALL_LISTS: "Rtm.Ubiquity.ALL_LISTS",
        REGULAR_LIST: "Rtm.Ubiquity.REGULAR_LIST",      
        TASKS: "Rtm.Ubiquity.TASKS",
        LAST_TASKS_UPDATE: "Rtm.Ubiquity.LAST_TASKS_UPDATE",
        LAST_TOKEN_CHECK: "Rtm.Ubiquity.LAST_TOKEN_CHECK",
        TASKNAMES: "Rtm.Ubiquity.TASKNAMES",
        TAGS: "Rtm.Ubiquity.TAGS",
        FROB: "Rtm.Ubiquity.FROB"
    },
    pref: {
        TIMEZONE: "Rtm.Ubiquity.TIMEZONE",
        TIMELINE: "Rtm.Ubiquity.TIMELINE",
        AUTH_TOKEN: "Rtm.Ubiquity.AUTH_TOKEN",
        USER_NAME: "Rtm.Ubiquity.USER_NAME",
        USER_ID: "Rtm.Ubiquity.USER_ID",
        DEFAULT_LIST: "Rtm.Ubiquity.DEFAULT_LIST",
        TIME_FORMAT: "Rtm.Ubiquity.TIME_FORMAT",
        DATE_FORMAT: "Rtm.Ubiquity.DATE_FORMAT"
    },
    url:{
        API_URL: "http://api.rememberthemilk.com/services/rest/",
        AUTH_URL: "http://api.rememberthemilk.com/services/auth/",
        ROOT_URL: "http://www.rememberthemilk.com/",
        ICON_URL: "http://www.rememberthemilk.com/favicon.ico"
    },
    msg: {
        LOGIN_MSG: "No Authorisation Token found. Press Enter to Login.",
        LOGGING_IN_MSG: "No Authorisation Token found. Navigating to RTM for authorisation.",
        TASK_NAME_REQUIRED: "A task name is required.",
        NOTE_TEXT_REQUIRED: "A note requires some text.",
        TASK_ADDED: "Task Added.",
        TASK_NOTE_ADDED: "Task Note Added.",
        TASK_MOVED: "Task Moved.",
        TASK_DELETED: "Task Deleted.",
        TASK_POSTPONED: "Task Postponed.",
        TASK_COMPLETED: "Task Completed.",
        PROBLEM_DELETING_TASK: "A problem occurred deleting the task.",
        PROBLEM_ADDING_TASK: "A problem occurred adding the task to RTM.",
        PROBLEM_MOVING_TASK: "A problem occurred moving the task.",
        PROBLEM_PRIORITISING_TASK: "A problem occurred prioritising the task.",
        PROBLEM_ADDING_TASK_NOTE: "A problem occurred adding a note for the task.",
        PROBLEM_POSTPONING_TASK: "A problem occurred postponing the task.",
        PROBLEM_COMPLETING_TASK: "A problem occurred completing the task.",
        TASK_ADDED_INBOX: "Cannot add to a smart list. Task added to Inbox.",
        NO_TASKS_FOUND: "No tasks found. Press enter to force a sync with RTM.",
        TASKS_RETRIEVED: "Retrieved tasks from RTM."
    },
    TEN_MINUTES: 600000,
    TWENTY_FOUR_HOURS: 86400000,
    ALWAYS_CREATE_NEW_TIMELINE: false,
    PERMISSION_LEVEL: 'delete',
    API_KEY: "ad16f1c273c6555afcf822ccd5dee0f1",    
    PARSE_DATE_FROM_TASKNAME: 1,
    VERSION: "0.0.1"
}


RTM.prefs = {
    has: function(key) {
        return Application.prefs.has(key) && Application.prefs.get(key).value != undefined;
    },
    set: function(key, value) {     
        Application.prefs.setValue(key, value);
    },
    get: function(key, defaultValue) {
        return (this.has(key)) ? Application.prefs.get(key).value: defaultValue;
    },
    remove: function(key) {
        if (this.has(key)) Application.prefs.get(key).reset();
    },
    remove_all: function() {    
        for (var c in RTM.constants.pref){
            this.remove(RTM.constants.pref[c]);
        }
    }
}

RTM.template = {
    STATUS: "Authorisation Token: ${t}<br>"
        + "User Name: ${un}<br>"
        + "User Id: ${ui}<br>"
        + "Task Lists: ${tlc}<br>"
        + "Tasks: ${tc}<br>"
        + "Timezone: ${tz}<br>"
        + "Default List: ${dl}<br>"
        + "Date Format: ${df}<br>"
        + "Time Format: ${tf}<br>"
        + "Last Token Check: ${ltc}<br>"
        + "Last Tasks Update: ${ltu}<br>"
        + "Command Version: ${v}<br>",
    TASK:   "<div style=\"border-top:dashed 1px grey;margin:1px;padding:2px;font-size:1.0em;\">"
        + " <div>"
        + "   <span style=\"background-color:{if item.task.priority == 1}#ea5200{elseif item.task.priority == 2}#0060bf{elseif item.task.priority == 3}#359aff{else}white{/if};\">&nbsp;</span>"
        + " <span style=\"color:#359aff;font-size:0.7em\">"
        + "     {for tag in item.tags}"
        + "     ${tag}&nbsp;"
        + "     {/for}"
        + " </span>"
        + "   <a style=\"${item.overdue}\" href='${rootUrl}/home/${userId}/${item.list_id}/${item.id}/'>${item.name}</a>"
        + " </div>"
        + "    {if (item.url)}"
        + " <div style=\"overflow:hidden;margin-left:8px\">"
        + "         <nobr><a style=\"text-decoration:underline;font-size:0.8em;color:lightgrey;\" href='${item.url}'>${item.url}</a></nobr>"
        + " </div>"
        + "{/if}"
        + " <div style=\"padding-top:1px;text-align:right;font-size:0.8em\">"
        + "   {if (item.due)}${item.due} - {/if} {if (item.list_name)}${item.list_name}{/if}"
        + " </div>"
        + "{if (item.notes && item.notes.note && item.notes.note.length)}"
        + " {for note in item.notes.note}"
        + "     <div style=\"margin-left:25px;text-align:left;font-size:0.8em\">"
        + "         <li>{if (note.title)}<em>${note.title}</em><br/>{/if}${note.$t}"
        + "     </div>"
        + " {/for}"
        + "{elseif (item.notes && item.notes.note) }"
        + " <div style=\"margin-left:25px;text-align:left;font-size:0.8em\">"
        + "     <li>{if (item.notes.note.title)}<em>${item.notes.note.title}</em><br/>{/if}${item.notes.note.$t}"
        + " </div>"
        + "{/if}"
        + "</div>",
    SMART_ADD: "<div style=\"border:dashed 1px grey;padding:10px;margin:20px;\">"
        + "<table border='0'>"
        + "<tr><th>&nbsp;</th><th>Smart Add Syntax</th></tr>"
        + "<tr><td><strong>!</strong></td><td>Priority</td></tr>"
        + "<tr><td><strong>#</strong></td><td>List or Tag</td></tr>"
        + "<tr><td><strong>@</strong></td><td>Location</td></tr>"
        + "<tr><td><strong>*</strong></td><td>Repeat</td></tr>"
        + "<tr><td><strong>=</strong></td><td>Time Estimate</td></tr>"
        + "<tr><td>&nbsp;</td><td>URLs will be automagically recognised if they begin with http:// etc.</td></tr>"
        + "<tr><td>&nbsp;</td><td>Dates and times will be recognised when they are at the beginning of the task name. See: <a href=http://www.rememberthemilk.com/help/answers/basics/dateformat.rtm target=_blank>Accepted date formats.</a></td></tr>"
        + "</table>"
        + "<br/>"
        + "For example, the following entry would create a task called “do something” in the Inbox for today, with priority 3, a tag, url and location:"
        + "<br/>"
        + "<div style='font-family:monospace; margin-left:10px;'>add task do something today !3 #Inbox #tag1 @home http://google.com</div>" 
        + "</div>",
}

RTM.utils = {
    merge_objects: function() {
        var n = {}, stuff, j = 0, len = arguments.length;
        for (j = 0; j < len; j++) {
            stuff = arguments[j];
            for (var i in stuff) {
                n[i] = stuff[i];
            }
        }
        return n;
    },
    format_url: function(u){
        s = ["http://", "https://","ftp://","file://"];
        for (var i in s){
            l = (u.length < s[i].length) ? u.length : s[i].length;
            if ( u.substr(0,l) == s[i].substr(0,l)) {
                return u;
            }
        }
        return "http://" + u;
    },
    sort_parameters: function(o) {
        var index = new Array();
        var sorted = new Object();
        for (var s in o) {
            if (typeof(o[s]) != "function") {
                index.push(s);
            };
        };
        index.sort();
        for (var i in index) {
            sorted[index[i]] = o[index[i]];
        }    
        return sorted;
    },
    sort_tasks_algorithm: function(a, b){
        return ((a.dueTime || new Date("1/1/9999")) - (b.dueTime || new Date("1/1/9999"))) || (a.task.priority > b.task.priority);
    },
    escape: function(x){
        return x.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

RTM.check_token = function() {
    var token = RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null);

    if (!token) {
        if (Application.storage.get(RTM.constants.store.FROB,false)) {
            token = RTM.get_new_auth_token(Application.storage.get(RTM.constants.store.FROB, null));
            if (!token){
                Application.storage.set(RTM.constants.store.FROB, null);
                return null;
            }            
        } else {
            return null;
        }
    } 
    
    if ((Application.storage.has(RTM.constants.store.LAST_TOKEN_CHECK)) && (RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null) != null)) {
        var now = new Date().getTime();
        var then = Application.storage.get(RTM.constants.store.LAST_TOKEN_CHECK, 0);
        
        if ((now - then) < RTM.constants.TEN_MINUTES) {
            Application.storage.set(RTM.constants.store.LAST_TOKEN_CHECK, new Date().getTime());
            return RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null);
        }
    } 

    var apiParams = {
        method: "rtm.auth.checkToken"
    };

    return RTM.rtm_call_json_sync(apiParams, function(j){
                                      Application.storage.set(RTM.constants.store.LAST_TOKEN_CHECK, new Date().getTime());
                                      return RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null)});
}

RTM.isParser2 = function(){
    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    var branch = prefs.getBranch("extensions.ubiquity.");   
    return (branch.getPrefType("parserVersion") != 0) ? branch.getIntPref("parserVersion") == 2 : false;
}

/*
 The function below is used to sign parameters, as required by the RTM API (please have a read of RTM's authentication approach here: http://www.rememberthemilk.com/services/api/authentication.rtm). This uses an API Key (given at the very top of this script) and a Shared Secret to verify requests are from who they say they are (my app in this case) and also to help track usage.

 Getting your own API Key is nice and easy (http://www.rememberthemilk.com/services/api/keys.rtm) but people shouldn't have to get one in order to use this command. The command is released under the Mozilla Public License, so everyone is welcome to copy and modify it to their own needs,but I kindly ask that if you make major modifications (e.g. more than renaming the commands) then please apply for your own API key.

 If you have any queries/concerns then feel free to mail me: contact@garyhodgson.com
 */
RTM.create_rtm_parameter_object = function(apiParams) {
    apiParams.auth_token = RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, '');
    apiParams.api_key = RTM.constants.API_KEY;
    var s = RTM.utils.sort_parameters(apiParams);   
    var a = '';
    for (var i in s) {a += i + s[i];};
    s.api_sig = hex_md5(unescape('%35%35%63%37%65%65%33%36%33%31%32%33%66%65%33%61') + a);
    return s;
}

RTM.create_rtm_parameter_string = function(apiParams) {
    apiParams.auth_token = RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, '');
    apiParams.api_key = RTM.constants.API_KEY;
    var s = RTM.utils.sort_parameters(apiParams);   
    var paramsString = '?';
    var b = '';
    for (var j in s) {b += j + s[j];paramsString += j + '=' + s[j] + '&';};
    var authSig = hex_md5(unescape('%35%35%63%37%65%65%33%36%33%31%32%33%66%65%33%61') + b);
    paramsString += 'api_sig=' + authSig;
    return paramsString;
}

RTM.rtm_call_json_async = function(apiParams, successCallback){     
    apiParams.format = 'json';  
    jQuery.ajax({
                    type: "POST",
                    url: RTM.constants.url.API_URL,
                    async: true,
                    data: RTM.create_rtm_parameter_object(apiParams, true),
                    dataType: "json",
                    success: function(j){           
                        if (j.rsp.stat == 'fail') {
                            window.alert("error");
                            // CmdUtils.log('Error whilst calling ' + apiParams.method + '. Error Message: ' +  j.rsp.err.msg);
                        } else {
                            successCallback(j.rsp);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown){
                        window.alert("error");
                        //CmdUtils.log('RTM Service Call Failure whilst calling ' + apiParams.method + '. Error Message: ' + textStatus +'. ' + XMLHttpRequest.statusText);
                    }
                });
    
}


RTM.rtm_call_json_sync = function(apiParams, successCallback){
    apiParams.format = 'json';      
    var r = jQuery.ajax({
                            type: "POST",
                            url: RTM.constants.url.API_URL,
                            async: false,
                            data: RTM.create_rtm_parameter_object(apiParams, true),
                            dataType: "json",
                            error: function(XMLHttpRequest, textStatus, errorThrown){
                            //CmdUtils.log('RTM Service Call Failure whilst calling ' + apiParams.method + '. Error Message: ' + textStatus +'. ' + XMLHttpRequest.statusText);
                            }
                            
                        });
    
    if (r.status == 200){
        var j = Utils.decodeJson(r.responseText);
        if (j.rsp.stat == 'fail') {
                                    window.alert("error");
//            CmdUtils.log('Error: ' + j.rsp.err.msg);
        } else {
            return successCallback(j.rsp);
        }
    }
}

RTM.status_data = function(){
    var token = RTM.check_token() ? "Valid" : "Invalid/Not Found" ;
    
    var ltc = (Application.storage.has(RTM.constants.store.LAST_TOKEN_CHECK)) ? 
        (new Date(Application.storage.get(RTM.constants.store.LAST_TOKEN_CHECK,null)).toLocaleString()):
        "Not Found";
    
    var ltu = "Not Found";      
    if (RTM.tasks.last_updated()){
        var d = new Date(); 
        d.setISO8601(RTM.tasks.last_updated());
        ltu = d.toLocaleString();
    }
    
    var df = "Not Found";
    if (RTM.prefs.has(RTM.constants.pref.DATE_FORMAT)){
        df = (RTM.prefs.get(RTM.constants.pref.DATE_FORMAT) == 0) ?  "European" : "American"; 
    }
    
    var tf = "Not Found";
    if (RTM.prefs.has(RTM.constants.pref.TIME_FORMAT)){
        tf = (RTM.prefs.get(RTM.constants.pref.TIME_FORMAT) == 0) ? "12 Hour" : "24 Hour"; 
    }   

    return {t:   token,
            un:  RTM.prefs.get(RTM.constants.pref.USER_NAME, "Not Found"),
            ui:  RTM.prefs.get(RTM.constants.pref.USER_ID, "Not Found"),
            tlc: RTM.lists.count(),
            dl: RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null)),
            tf: tf,
            df: df,
            tc:  RTM.tasks.count(),
            tz:  RTM.prefs.get(RTM.constants.pref.TIMEZONE, "Not Found"),
            ltc:  ltc,
            ltu:  ltu,
            v: RTM.constants.VERSION
           };
};

RTM.login = function() {
    var frob = RTM.get_new_frob();
    window.alert("get_frob");
    // if (frob == null) {
    //     return;
    // }
    Application.storage.set(RTM.constants.store.FROB, frob);
    var authParams = {
        api_key: RTM.constants.API_KEY,
        frob: frob,
        perms: RTM.constants.PERMISSION_LEVEL
    };
    var authUrl = RTM.constants.url.AUTH_URL + RTM.create_rtm_parameter_string(authParams, false);

    Utils.openUrlInBrowser(authUrl);
};

RTM.get_time = function(d) {
    if (!RTM.check_token()) { return null }
    var date = d || new Date();
    var apiParams = {
        dateformat: RTM.prefs.get(RTM.constants.pref.DATE_FORMAT, 0),
        text: date.toString(),
        method: "rtm.time.parse",
        timezone: RTM.prefs.get(RTM.constants.pref.TIMEZONE, "UTC")
    };  
    return RTM.rtm_call_json_sync(apiParams,  function(j){return j.time.$t});
};

RTM.get_settings = function() {
    if (!RTM.check_token()) {return null}
    return RTM.rtm_call_json_sync({method: "rtm.settings.getList"}, function(j){
                                      RTM.prefs.set(RTM.constants.pref.TIMEZONE, j.settings.timezone); 
                                      RTM.prefs.set(RTM.constants.pref.DEFAULT_LIST, j.settings.defaultlist); 
                                      RTM.prefs.set(RTM.constants.pref.TIME_FORMAT, j.settings.timeformat); 
                                      RTM.prefs.set(RTM.constants.pref.DATE_FORMAT, j.settings.dateformat); 
                                  });
};

RTM.get_timeline = function() {
    if (!RTM.constants.ALWAYS_CREATE_NEW_TIMELINE && RTM.prefs.has(RTM.constants.pref.TIMELINE)) {
        return RTM.prefs.get(RTM.constants.pref.TIMELINE, null);
    }
    if (!RTM.check_token()) {return null}

    return RTM.rtm_call_json_sync({method: "rtm.timelines.create"},  
                                  function(r) { 
                                      RTM.prefs.set(RTM.constants.pref.TIMELINE, r.timeline);
                                      return r.timeline;});
};

RTM.get_new_frob = function() {
    return RTM.rtm_call_json_sync({method: 'rtm.auth.getFrob'}, function(r){return r.frob});
};

RTM.get_new_auth_token = function(frob) {
    if (frob == null || frob.length == 0) {
        return null;
    };
    var apiParams = {
        frob: frob,
        method: 'rtm.auth.getToken'
    };
    return RTM.rtm_call_json_sync(apiParams, function(r){
                                      displayMessage({icon: RTM.constants.url.ICON_URL, title: "RTM Ubiquity", text: 'Authorisation Token found for: ' + r.auth.user.fullname});
                                      RTM.prefs.set(RTM.constants.pref.AUTH_TOKEN, r.auth.token);
                                      RTM.prefs.set(RTM.constants.pref.USER_NAME, r.auth.user.username);
                                      RTM.prefs.set(RTM.constants.pref.USER_ID, r.auth.user.id);    
                                      
                                      RTM.get_settings();     
                                      
                                      RTM.lists.update();
                                      
                                      RTM.tasks.force_update_all();
                                      
                                      return RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null);
                                  });
};

RTM.delete_task = function(task){   
    if (!task){
        return false;
    }           
    var apiParams = {
        list_id: task.list_id,
        method: "rtm.tasks.delete",
        task_id: task.task.id,
        taskseries_id: task.id,
        timeline: RTM.get_timeline()
    };        
    return RTM.rtm_call_json_sync(apiParams, function(r){
                                      return (r.stat == "ok") ? RTM.constants.msg.TASK_DELETED : RTM.constants.msg.PROBLEM_DELETING_TASK;
                                  });
};

RTM.add_task = function(taskName, listId, url, priority, tags){
    if (!taskName) return false;
    
    var apiParams = {
        method: "rtm.tasks.add",
        name: taskName,
        parse: RTM.constants.PARSE_DATE_FROM_TASKNAME,

        timeline: RTM.get_timeline()
    };
    if (listId){
        apiParams.list_id = listId;
    }

    return RTM.rtm_call_json_sync(apiParams, function(r){
                                      if (r.stat == "ok" && r.list){
                                          var taskId = r.list.taskseries.task.id;
                                          var taskSeriesId = r.list.taskseries.id;
                                          var listId = r.list.id;
                                          
                                          if (url) RTM.set_task_url(taskId, taskSeriesId, listId, url);
                                          
                                          if (tags) RTM.tag_task(taskId, taskSeriesId, listId, tags);
                                          
                                          if (priority) RTM.prioritise_task(taskId, taskSeriesId, listId, priority);
                                          
                                          return true;
                                      } else {
                                          return false;
                                      }
                                  });         
};

RTM.set_task_url = function(taskId, seriesId, listId, url){
    if (!taskId || !seriesId || !listId || !url) return;

    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.setURL",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
        url: url
    };        
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});        
}

RTM.prioritise_task = function(taskId, seriesId, listId, priority){
    if (!taskId || !seriesId || !listId || !priority){
        return;
    }           
    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.setPriority",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
        priority: priority
    };
    
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});        
}

RTM.add_task_note = function(taskId, seriesId, listId, noteText, noteTitle){
    if (!taskId || !seriesId || !listId  || !noteText){
        return;
    }           
    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.notes.add",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
        note_text: noteText
    };
    if (noteTitle) apiParams.note_title = noteTitle;    
    
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});        

}

RTM.move_task = function(taskId, seriesId, currentlistId,  targetListId) {
    if (!taskId || !seriesId || !currentlistId || !targetListId){
        return;
    }           
    var apiParams = {
        method: "rtm.tasks.moveTo",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
        from_list_id: currentlistId,
        to_list_id: targetListId 
    };       
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});         
}

RTM.postpone_task = function(taskId, seriesId, listId) {
    if (!taskId || !seriesId || !listId){
        return;
    }
    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.postpone",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline()
    };    
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});
}   

RTM.complete_task = function(taskId, seriesId, listId) {
    if (!taskId || !seriesId || !listId){
        return;
    }
    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.complete",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
    };    
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});
}

RTM.tag_task = function(taskId, seriesId, listId,  tags){
    if (!taskId || !seriesId || !listId || !tags){
        return;
    }           
    var apiParams = {
        list_id: listId,
        method: "rtm.tasks.setTags",
        task_id: taskId,
        taskseries_id: seriesId,
        timeline: RTM.get_timeline(),
        tags: tags,
    };        
    return RTM.rtm_call_json_sync(apiParams, function(r){return (r.stat == "ok")});         
}

RTM.lists = function(){
    var _lists = _get_lists();
    var _regular = _get_regular_list_names();
    var _smart = _get_smart_list_names();

    function _get_lists(){//多分リストを取得する関数？？
        
        if (    Application.storage.has(RTM.constants.store.TASK_LISTS) && 
                Application.storage.get(RTM.constants.store.TASK_LISTS, null) != null
           ){
               return Application.storage.get(RTM.constants.store.TASK_LISTS, null);
           } else {
               return _update_lists();
           }
    }
    function _get_regular_list_names(){
        if (    Application.storage.has(RTM.constants.store.REGULAR_LIST) && 
                Application.storage.get(RTM.constants.store.REGULAR_LIST, null) != null
           ){
               return Application.storage.get(RTM.constants.store.REGULAR_LIST, null);
           } else {
               return _update_regular_list_names();
           }
    }
    function _get_smart_list_names(){
        if (    Application.storage.has(RTM.constants.store.SMART_LIST) && 
                Application.storage.get(RTM.constants.store.SMART_LIST, null) != null
           ){
               return Application.storage.get(RTM.constants.store.SMART_LIST, null);
           } else {
               return _update_smart_list_names();
           }
    }
    function _update_lists() {
        if (!RTM.check_token()) return null;
        return RTM.rtm_call_json_sync({method: "rtm.lists.getList"}, function(r){   
                                          Application.storage.set(RTM.constants.store.TASK_LISTS, r.lists.list);
                                          _lists = r.lists.list;
                                          _update_smart_list_names();
                                          _update_regular_list_names();
                                          return _lists;
                                      });
    }   
    
    function _update_smart_list_names(){
        if (!_lists) return null;   
        _smart = {};
        for (var i in _lists){
            if (_lists[i].smart == 1){
                _smart[""+_lists[i].id] = _lists[i].name;
            }            
        }
        Application.storage.set(RTM.constants.store.SMART_LIST, _smart);
        return _smart;
    }
    function _update_regular_list_names(){
        if (!_lists) return null;   
        _regular = {};
        
        for (var i in _lists){
            if (_lists[i].smart != 1){
                _regular[""+_lists[i].id] = _lists[i].name;
            }            
        }
        Application.storage.set(RTM.constants.store.REGULAR_LIST, _regular);
        return _regular;
    }
    function _clear(){
        _lists = null;
        _smart = null;
        _regular = null;
    }
    return {
        update: function() {    
            _update_lists();
            return _lists;
        },
        get_lists: function() { 
            return _lists;
        },
        is_smart_list: function(id){
            for (var i in _smart){
                if (i == id) return true;
            }   
            return false;
        },
        get_smart_list_names: function() {
            return _smart;
        },
        get_regular_list_names: function() {
            return _regular;
        },
        get_all_list_names: function() {
            return RTM.utils.merge_objects(_regular, _smart);
        },
        get_list_name: function(id) {
            if ((!_lists) || (!id)) return null;
            for (var i in _lists){
                if (_lists[i].id == id) return _lists[i].name;
            }
            return null;            
        },
        get_list_id: function(name) {
            if ((!_lists) || (!name)) return null;
            for (var i in _lists){
                if (_lists[i].name.toUpperCase() == name.toUpperCase()) return _lists[i].id;
            }
            return null;
        },
        count: function(){
            counter = 0;
            for (var i in _lists){
                counter++;
            }
            return counter;
        },
        clear: function(){
            _clear();
        }
    };
}();

/**
 * Core Tasks Object
 */
RTM.tasks = function(){
    
    var _lastUpdated = Application.storage.get(RTM.constants.store.LAST_TASKS_UPDATE, null) ;   
    var _tasks = _get_tasks();
    var _taskNames = _get_task_names();
    var _tags = _get_tags();

    function _get_tasks(){
        if (    Application.storage.has(RTM.constants.store.TASKS) && 
                Application.storage.get(RTM.constants.store.TASKS, null) != null
           ){
               return Application.storage.get(RTM.constants.store.TASKS, null);
           } else {
               return _update(true, false, true);
           }
    }

    function _get_task_names(){
        if (    Application.storage.has(RTM.constants.store.TASKNAMES) && 
                Application.storage.get(RTM.constants.store.TASKNAMES, null) != null
           ){
               return Application.storage.get(RTM.constants.store.TASKNAMES, null);
           } else {
               return _update_task_names();
           }
    }
    
    function _get_tags(){
        if (    Application.storage.has(RTM.constants.store.TAGS) && 
                Application.storage.get(RTM.constants.store.TAGS, null) != null
           ){
               return Application.storage.get(RTM.constants.store.TAGS, null);
           } else {
               return _update_tag_list();
           }
    }
    
    function _format_task(taskseries, listId){
        if (!taskseries) return;
        
        // this is a hack to workaround the strange data model returned after a repeating task is read from the RTM service.
        // See http://github.com/garyhodgson/ubiquity-rtm-api/issues/#issue/3

        var taskInstance = (taskseries.task.length) ? taskseries.task[1] : taskseries.task;
        taskseries.task = taskInstance;
        
        taskseries.name = RTM.utils.escape(taskseries.name);
        if (taskseries.task.due && taskseries.task.due.length > 0){
            var due = new Date();
            var now = new Date();
            due.setISO8601(taskseries.task.due);
            taskseries.due = due.toLocaleString();
            taskseries.dueTime = due.getTime();
            taskseries.overdue = ((now - due) >= RTM.constants.TWENTY_FOUR_HOURS) ? "text-decoration:underline;" : "";
            taskseries.overdue += (due.toDateString() == now.toDateString()) ? "font-size:1.1em;font-weight: bolder;" : "";
        }
        taskseries.list_id = listId||"";
        taskseries.list_name = RTM.lists.get_list_name(listId||"")||"";
        return taskseries;
    }
    
    function _mark_smart_task_list(tasks, smartListId, smartListName, force){
        
        var apiParams = {
             method: "rtm.tasks.getList",
            filter: "status:incomplete AND list:\""+smartListName+"\"",
        }
        
        if (!force){
            apiParams.last_sync = _lastUpdated;
        }
        var callback = function(j) {
            if (j.tasks.list){  
                if (Utils.isArray(j.tasks.list)){
                    for (var i in j.tasks.list){
                        
                        var ts = j.tasks.list[i].taskseries;
                        if (Utils.isArray(ts)){
                            for (var ts_index in ts){
                                var id = ts[ts_index].id;                       
                                if (tasks[id]){
                                    if (!tasks[id].smart_lists){
                                        tasks[id].smart_lists = [];
                                    } // if
                                    if (!tasks[id].smart_lists.join().match(smartListId)){
                                        tasks[id].smart_lists.push(smartListId);
                                    } // if
                                } // if
                            }   
                        }
                        else
                        {
                            if (tasks[ts.id]){
                                if (!tasks[ts.id].smart_lists){
                                    tasks[ts.id].smart_lists = [];
                                } // if
                                if (!tasks[ts.id].smart_lists.join().match(smartListId)){
                                    tasks[ts.id].smart_lists.push(smartListId);
                                } // if
                            } // if
                        }
                    }
                } else {
                    var ts = j.tasks.list.taskseries;
                    
                    if (Utils.isArray(ts)){
                        for (var ts_index in ts){
                            var id = ts[ts_index].id;                       
                            if (tasks[id]){
                                if (!tasks[id].smart_lists){
                                    tasks[id].smart_lists = [];
                                } // if
                                if (!tasks[id].smart_lists.join().match(smartListId)){
                                    tasks[id].smart_lists.push(smartListId);
                                } // if
                            } // if
                        }   
                    }
                    else
                    {
                        if (tasks[ts.id]){
                            if (!tasks[ts.id].smart_lists){
                                tasks[ts.id].smart_lists = [];
                            } // if
                            if (!tasks[ts.id].smart_lists.join().match(smartListId)){
                                tasks[ts.id].smart_lists.push(smartListId);
                            } // if
                        } // if
                    }
                }
                Application.storage.set(RTM.constants.store.TASKS, tasks)
            }
            
        }; // callback
        
        RTM.rtm_call_json_async(apiParams, callback);
        
    }
    
    function _mark_smart_tasks(tasks, force){
        var smartLists = RTM.lists.get_smart_list_names(RTM.constants.store.SMART_LIST);
        if (!smartLists) return;

        //Note to self: we have to call each smartlist individually because getting all smart list tasks in one go returns a dataset without the smartlist id, so one cannot identify the corresponding smart list when looping through the resultset.
        
        var i = 1000;
        for (var smartListId in smartLists){            
            Utils.setTimeout( _mark_smart_task_list, i+=1000, tasks, smartListId, smartLists[smartListId], force); 
        }
        return tasks;
    }
    
    function _update(force, async, markSmartLists) {    
        if (!RTM.check_token()) {
            return null;
        }
        var apiParams = {
            method: "rtm.tasks.getList",
        };          
        if (!force){
            apiParams.last_sync = _lastUpdated;
        } else {
            // If there is no lastUpdate then we only want to get all the incomplete tasks.
            apiParams.filter = "status:incomplete";
        }
        
        var successCallback = function(j){
            
            var tasks = new Object();
            if (!force && (Application.storage.get(RTM.constants.store.TASKS, null) != null)){
                tasks= Application.storage.get(RTM.constants.store.TASKS, new Object());
            }
            
            var t = j.tasks;            
            for (var i in t.list){
                var list = t.list[i];               
                var listName = RTM.lists.get_list_name(list.id);
                if (!RTM.lists.is_smart_list(list.id)){
                    tasks = _add_new_tasks_and_remove_completed_tasks(tasks, list); 
                    tasks = _remove_deleted_tasks(tasks,list.deleted);
                }
            }           
            if (Application.storage.get(RTM.constants.store.TASKS, null) == null) { 
                // show message on very first run
                displayMessage({icon: RTM.constants.url.ICON_URL, title: "RTM Ubiquity", text: RTM.constants.msg.TASKS_RETRIEVED});
            }
            
            Application.storage.set(RTM.constants.store.LAST_TASKS_UPDATE, RTM.get_time());
            _lastUpdated = Application.storage.get(RTM.constants.store.LAST_TASKS_UPDATE, null) ;

            Application.storage.set(RTM.constants.store.TASKS, tasks);
            _tasks = tasks;

            if (markSmartLists){
                _mark_smart_tasks(_tasks, force);
            }           
            _update_task_names();
            _update_tag_list();
            
            return _tasks;
        };
        
        return (async)  ? RTM.rtm_call_json_async(apiParams, successCallback) 
            : RTM.rtm_call_json_sync(apiParams, successCallback);
    }
    function _update_list(listId, force, async, markSmartLists) {
        if (!RTM.check_token()) {
            return;
        }
        var apiParams = {
            method: "rtm.tasks.getList",
            list_id: listId
        } ;
        if (!force){
            apiParams.last_sync = _lastUpdated;
        } else {
            // If there is no lastUpdate then we only want to get all the incomplete tasks.
            apiParams.filter = "status:incomplete";
        }

        var successCallback = function(j){
            var tasks = Application.storage.get(RTM.constants.store.TASKS, new Object());
            var t = j.tasks;
            var list = t.list;
            var listName = RTM.lists.get_list_name(list.id);
            
            if (!RTM.lists.is_smart_list(list.id)){
                tasks = _add_new_tasks_and_remove_completed_tasks(tasks, list); 
                tasks = _remove_deleted_tasks(tasks,list.deleted);
            }

            if (markSmartLists){
                tasks = _mark_smart_tasks(tasks, force);
            }

            Application.storage.set(RTM.constants.store.TASKS, tasks);
            _tasks = tasks;
            
            _update_task_names();
            _update_tag_list();
            return _tasks;
        };
        
        return (async)  ? RTM.rtm_call_json_async(apiParams, successCallback) 
            : RTM.rtm_call_json_sync(apiParams, successCallback);
    }
    
    function _add_new_tasks_and_remove_completed_tasks(tasks, list){
        if (list.taskseries){
            var taskseries = list.taskseries;
            if (!taskseries.length){
                if (taskseries.task.completed){
                    delete tasks[taskseries.id];

                } else {
                    tasks[taskseries.id] = _format_task(taskseries, list.id);  
                }
            } else {
                for (var j in taskseries){
                    var ts = taskseries[j];
                    if (ts.task.completed){
                        delete tasks[ts.id];

                    } else {
                        tasks[ts.id] = _format_task(ts, list.id);
                    }
                }    
            }
        }
        return tasks;
    }
    
    
    function _remove_deleted_tasks(tasks, deletedTasksList){
        if (deletedTasksList && deletedTasksList.taskseries) {
            // deleted entries
            var deletedTaskSeries = deletedTasksList.taskseries;
            if (!deletedTaskSeries.length){
                delete tasks[deletedTaskSeries.id];

            } else {
                for (var k in deletedTaskSeries){
                    delete tasks[deletedTaskSeries[k].id];
                }       
            }
        }
        return tasks;
    }
    function _update_task_names(){
        
        if (!_tasks) return null;
        
        _taskNames = new Object();
        var c = 0;
        for (var t in _tasks) {
            _taskNames[t] = _tasks[t].name;
            c++;
        }
        Application.storage.set(RTM.constants.store.TASKNAMES, _taskNames);

        return _taskNames;
    }
    function _update_tag_list(){
        _tags = _tags || new Object();
        for (var x in _tasks) {
            if (_tasks[x].tags.tag){
                var tagSet = _tasks[x].tags.tag;
                if (typeof(tagSet) == "string"){
                    _tags[tagSet] = (_tags[tagSet]) ? _tags[tagSet] + 1 : 1 ;
                } else {
                    for (var y in tagSet){
                        _tags[tagSet[y]] = (_tags[tagSet[y]]) ? _tags[tagSet[y]] + 1 : 1 ;
                    }
                }
            }
        }
        
        Application.storage.set(RTM.constants.store.TAGS, _tags);
        return _tags;
    }
    function _clear(){
        _tags = null;
        _taskNames = null;
        _tasks = null;
        _lastUpdated = null;
    }
    return {
        format_task: function(taskseries, listId){
            return _format_task(taskseries, listId);
        },      
        async_update_all: function(){
            return _update(false, true, true);
        },
        sync_update_all: function(){
            return _update(false, false, true);
        },
        sync_update_list: function(listId){
            return _update_list(listId, false, false, false);
        },
        force_update_all: function (){
            return _update(true, false, true);
        },
        get_tasks: function(update) {
            return  (update) ? _update(false, false, true) : _tasks;
        },
        get_task_names: function() {
            return _taskNames;
        },
        get_task: function(id) {
            if ((!_tasks) || (!id)) return null;
            return _tasks[id] || null;;
        },
        last_updated: function(){
            return _lastUpdated;
        },
        get_tags: function(){
            return _tags;
        },
        get_tag_array: function(){
            var tagArray = new Array();
            for (var i in _tags){
                tagArray.push(i);
            }
            return  tagArray;
        },
        count: function(){
            counter = 0;
            for (var i in _tasks){
                counter++;
            }
            return counter;
        },
        findMatchingTasks: function(searchTaskName, searchListId, searchPriority, searchTag){
            window.alert("matching");
            var matchingTasks = new Array();
            
            for (var t in _tasks) {
                window.alert(_tasks[t]);
                var subTask = _tasks[t];                
                var listId = subTask.list_id;               
                var smartListMatch = ((subTask.smart_lists) && (subTask.smart_lists.join().match(searchListId) != null)) || false;
                var tagMatch = false;
                if (searchTag && subTask.tags && subTask.tags.tag){
                    tagMatch = (typeof(subTask.tags.tag) == "string") ? 
                        (subTask.tags.tag == searchTag) : 
                        ((subTask.tags.tag.join()+",").match(searchTag+","));
                } 

                if ((!searchListId) || (searchListId == listId) || smartListMatch) {
                    if ((!searchTag) || tagMatch){
                        if ((!searchPriority) || (subTask.task.priority == searchPriority)){
                            if (subTask.name.match(new RegExp(searchTaskName, "i")) == subTask.name) {
                                matchingTasks.push(subTask);    
                            }

                        }
                    }
                }
            }           
            return matchingTasks;
        },
        clear: function(){
            _clear();
        }
    };
}();




                     function rtklogin (directObject, mods) {
                         //function rtklogin () {
                         window.alert("test");
                         if (RTM.check_token()) {
                             window.alert("no token");
                             display.echoStatus(M({en: "Valid Token found. Please logout first.", ja: "トークンはすでに取得しています。"}));
                             // displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
                         } else {
                             window.alert("token");
                             display.echoStatusBar(M({en: "success", ja: "成功しました。"}));
                             //displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
                             RTM.login();
                         } 
                     }


                     function rtkupdate (directObject, mods) {

                         RTM.lists.update();        
                         //RTM.tasks.force_update_all();
                         var tasks = RTM.tasks.get_tasks(false);

                         //var task = ".*"+directObject.text.replace(/^\s+|\s+$/g,"")+".*";
                         window.alert("first_show");
                         //var list = mods.in.data || null;
                         // window.alert("second_show");
                         // var priority = mods.pri.data || null;
                         // var tag = mods.tag.text || null;
                         // var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
                         //subTasks.sort(RTM.utils.sort_tasks_algorithm);
                         // 
                         // 
                         // prompt.selector({
                         //                     message: "select tab: ",
                         //                     flags: [ 0],
                         //                     collection: promptList,
                         //                     header: ["title"],
                         //                     callback: function (index) {
                         //                         if (index < 0 || tabs.length < index) {
	                     //                             return;
                         //                         }
                         //                         }
                         //                 });
                       //  window.alert(items[1].list_id);
                         //nowedit
                        var mylists = RTM.lists._get_lists;
                         window.alert(tasks);
                         window.alert(mylists._lists);
                         if (! _lists) {
                             window.alert("nodata");
                                         }
                         window.alert("last") ;
                         window.alert(_lists);

                         
                         window.alert(mylists[1].name);
                         window.alert(RTM.lists._lists[1].name);
                         window.alert(item);
                         Utils.openUrlInBrowser(RTM.constants.url.ROOT_URL, null);
                     }
                                                // preview: function(previewBlock, directObject, mods) {
                                                //     previewBlock.innerHTML = this.description;        
                                                    
                                                //     if (!RTM.check_token()) {
                                                //         previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
                                                //         return;
                                                //     }
                                                //     var tasks = RTM.tasks.get_tasks(false);
                                                        //     if (!tasks) {
                                                //         previewBlock.innerHTML = RTM.constants.msg.NO_TASKS_FOUND;
                                                //         return;
                                                //     }
                                                    
                                                //     var task = ".*"+directObject.text.replace(/^\s+|\s+$/g,"")+".*";
                                                //     var list = mods.in.data || null;
                                                //     var priority = mods.pri.data || null;
                                                //     var tag = mods.tag.text || null;
                                                    
                                                //     var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
                                                    
                                                //     subTasks.sort(RTM.utils.sort_tasks_algorithm);
                                                    
                                                //     ptemplate = "<div>";
                                                //     ptemplate += "{for item in items}";
                                                //     ptemplate += RTM.template.TASK;
                                                //     ptemplate += "{/for}";
                                                //     ptemplate += "</div>";
                                                    
                                                    
                                                //     var previewData = {
                                                //         items: subTasks,
                                                //         rootUrl: RTM.constants.url.ROOT_URL,
                                                //         userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, '')
                                                //     };
                                                    
                                                //     previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
                                                    
                                                // }
                                           
                    

                     ext.add("rtklogin", rtklogin,
                             M({ja: "ログイン",
                                en: "login"}));

                     ext.add("rtkupdate", rtkupdate,
                             M({ja: "アップデイト",
                                en: "update"}));

//ubiquity特有の設定？
// if (RTM.isParser2())
// {        
//  /**
//   * Parser 2 Commands
//   *
//   */
     
//  CmdUtils.CreateCommand({
//      names:["refresh tasklists", "rtm refresh", "rtm-refresh"],  
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Force a refresh of all tasks and tasklists from RTM.",
//      msg_title: "RTM Ubiquity: Refresh",
//      preview: function(pBlock, args) {
//          if (!RTM.check_token()) {
//              pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
            
//          var p = this.description;
//          p += "<br><br>";
//          p += "Current Status:";
//          p += "<br><br>";
//          p += RTM.template.STATUS;
//          pBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
//      },
//      execute: function(args) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
    
//          RTM.lists.update();
//          RTM.tasks.force_update_all();
    
//          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: "Refresh Complete!"});        
//      }
//  }); 
    
//  CmdUtils.CreateCommand({
//      names: ["logout rtm", "rtm-logout"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com",
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "RTM Logout.  Removes all traces of the ubiquity command.",
//      msg_title: "RTM Ubiquity: Logout",
//      preview: function(pBlock, args) {
    
//          var p = "RTM Ubiquity Status.<br><br>";
//          p += RTM.template.STATUS;
//          p += "<br><br>";
//          p += "<span style=\"color:red;\">Warning!</span> Pressing Enter will clear all stored data for the RTM Ubiquity Command. Are you sure?";
                 
//          pBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
//      },
//      execute: function(args) {
//          RTM.prefs.remove_all();
//          for (var c in RTM.constants.store){
//              Application.storage.set(RTM.constants.store[c], null);
//          }
            
//          RTM.tasks.clear();
//          RTM.lists.clear();
        
//          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Data Cleared!'});
//      }
//  }); 
    
//  CmdUtils.CreateCommand({
//      names: ["login rtm", "rtm-login"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "RTM Login. Directs the user to RTM for an authorisation token.",
//      msg_title: "RTM Ubiquity: Login",
//      preview: function(pBlock, args) {

//          if (RTM.check_token()) {
//              pBlock.innerHTML = 'Authorisation token found. You\'re good to go!';
//          } else {
//              pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//          }
//      },
//      execute: function(args) {
//          if (RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      names: ["add task", "rtm add task", "rtm-add-task"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Add a task to RTM.",
//      arguments: [
//          {role: 'object', label: 'Task', nountype: noun_arb_text},
//          {role: 'goal', label: 'Task List', nountype: new RtmNounType("Task List", RTM.lists.get_regular_list_names)},
//          {role: 'modifier', label: 'Priority', nountype: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )},
//          {role: 'instrument', label: 'Url', nountype: noun_arb_text},
//          {role: 'format', label: 'Tags', nountype: noun_arb_text},
//      ],
//      msg_title: "RTM Ubiquity: Add Task",
//      preview: function(pBlock, args) {       
//          pBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
            
//          var defaultListName = RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null))||'Inbox';
            
//          var taskName = args.object.summary || null;
//          var tags = (args.format.text) ? args.format.text.split() : [];
//          var priority = args.modifier.data || null;
//          var listName = args.goal.text || defaultListName;
//          var url = args.instrument.text || null;        
//          if (url){
//              url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
//              url = RTM.utils.format_url(url);
//          }
    
//          var task = {
//              id: "",
//              name: taskName,
//              task: {
//                  priority:args.modifier.text||""
//              },
//              tags: tags,
//              list_name: listName,
//              overdue:"",
//              url: url,
//              due:"<em>(Due date calculated from task when submitted)</em>",
//          }
            
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//          }; 
    
//          var ptemplate = "Add Task:";
//          ptemplate += RTM.template.TASK;
//          ptemplate += RTM.template.SMART_ADD;
    
//          pBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
            
//      },
//      execute: function(args) {   
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!args.object.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
//              return;
//          }
//          var successMessage = RTM.constants.msg.TASK_ADDED;
//          var taskName = args.object.text;
//          var tags = args.format.text || null;
//          var priority = args.modifier.data || null;
//          var listId = args.goal.data || RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null);
//          if (RTM.lists.is_smart_list(listId)) {
//              listId = RTM.lists.get_list_id("Inbox");
//              successMessage = RTM.constants.msg.TASK_ADDED_INBOX;
//          } 
            
//          var url = args.instrument.text || null;
//          if (url){
//              url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
//              url = RTM.utils.format_url(url);
//          }
            
//          if (RTM.add_task(taskName, listId, url, priority, tags)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: successMessage});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK});
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      names:["note task", "rtm note task", "rtm-note-task"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Adds a note to a task in RTM.",
//      arguments: [
//          {role: 'object', label: 'Note', nountype: noun_arb_text},
//          {role: 'instrument', label: 'Title', nountype: noun_arb_text},
//          {role: 'goal', nountype: new RtmNounType("Task", RTM.tasks.get_task_names)},
//      ],
//      msg_title: "RTM Ubiquity: Note Task",
//      preview: function(pBlock, args) {
//          pBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
                
//          var note = args.object.summary || null;
//          var taskName = args.goal.text || null;
//          var title = args.instrument.text || null;
//          var taskId = args.goal.data || null;
    
//          var task = RTM.tasks.get_task(taskId);
            
//          if (!task) {
//              task = {
//                  id: "",
//                  name: taskName,
//                  task: {priority:""},
//                  tags: [],
//                  list_name: "",
//                  overdue:"",
//                  url: "",
//                  due:"",
//              };
//          }
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//              newNote: note,
//              newNoteTitle: title,
//          }; 
    
//          var ptemplate = "Add Task Note:";
//          ptemplate += RTM.template.TASK;
//          ptemplate += " <div style=\"padding-left:2px;margin-left:26px;text-align:left;font-size:0.8em\">"
//          ptemplate += "  <li>&nbsp;{if (newNoteTitle)}<em>${newNoteTitle}</em><br/>{/if}{if (newNote)}<b>${newNote}</b>{/if}"
//          ptemplate += " </div>"      
    
//          pBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
            
//      },
//      execute: function(args) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!args.object.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.NOTE_TEXT_REQUIRED});
//              return;
//          }
            
//          var note = args.object.text || null;
//          var taskId = args.goal.data || null;
//          var taskSeries = RTM.tasks.get_task(taskId);
//          var title = args.instrument.text || null;
            
//          if (!taskSeries){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
//              return;
//          }
    
//          if (RTM.add_task_note(taskSeries.task.id, taskSeries.id, taskSeries.list_id, note, title)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NOTE_ADDED});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK_NOTE});
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      names:["prioritise task", "rtm prioritise task", "rtm-prioritise-task"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"    
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Prioritises a task in RTM.",
//      arguments: [
//          {role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)},
//          {role: 'goal', nountype: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )},
//      ],
//      msg_title: "RTM Ubiquity: Prioritise Task",
//      preview: function(pBlock, args) {
            
//          pBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          } 
//          if (!args.object.text) {
//              pBlock.innerHTML = "Unable to find task.";
//              return;
//          }
    
//          var task = RTM.tasks.get_task(args.object.data) || null;
//          if (!task) {
//              pBlock.innerHTML = "Unable to find task in task lists.";
//              return; 
//          }
            
    //      task.task.priority = args.goal.text || 'N';
                
    //         var previewData = {
    //          item: task,
    //          userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
    //          rootUrl: RTM.constants.url.ROOT_URL,
    //         }; 
    
    //         pBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
    //     },
    //     execute: function(args) { 
    //         if (!RTM.check_token()) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
    //             RTM.login();
    //             return;
    //         }
    //         if (!args.object.text) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to prioritise.'});
    //             return;
    //         }
    //         if (!args.goal.text){
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No priority given.'});
    //             return;
    //         }
    //         var taskSeries = RTM.tasks.get_task(args.object.data);
    //         if (!taskSeries) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
    //             return;
    //         }
    
    //      if (RTM.prioritise_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, args.goal.text)){
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Task priority set to ' + args.goal.text});  
    //      } else {
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: PROBLEM_PRIORITISING_TASK});
    //      }
    //      RTM.tasks.async_update_all();
    //     }
    // });
    
    // CmdUtils.CreateCommand({
    //  names:["move task", "rtm move task", "rtm-move-task"],
    //     homepage: "http://www.garyhodgson.com/ubiquity",
    //  author: {
    //      name: "Gary Hodgson",
    //      email: "contact@garyhodgson.com"    
    //  },
    //  license: "MPL",
    //  icon: RTM.constants.url.ICON_URL,
    //  description: "Moves a task between task lists in RTM.",
    //  arguments: [
    //      {role: 'object', label: 'Task', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)},
    //      {role: 'goal', nountype: new RtmNounType("Task List", RTM.lists.get_regular_list_names)},
    //  ],
    //  msg_title: "RTM Ubiquity: Move Task",
    //     preview: function(pBlock, args) {
    
    //      pBlock.innerHTML = this.description;
    
    //         if (!RTM.check_token()) {
    //             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
    //             return;
    //         }         
    //         if (!args.object.text) {
    //             return;
    
    //         }
    
    //      var task = RTM.tasks.get_task(args.object.data) || null;
    //      if (!task) {
    //          pBlock.innerHTML = "Unable to find task in task lists.";
    //          return; 
    //      }
    //         var toList = args.goal.text || '';
    //         var fromList = RTM.lists.get_list_name(task.list_id) || '';
                        
    //         var previewData = {
    //          item: task,
    //          userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
    //          rootUrl: RTM.constants.url.ROOT_URL,
    //          task: args.object.summary,
    //          from: fromList,
    //          to: toList,
    //      }; 
    
    //      var ptemplate = "Move the following task from [${from}] to [${to}]";
    //      ptemplate += "<br><br>";
    //      ptemplate += RTM.template.TASK;
    
    //         pBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
    
    //     },
    //     execute: function(args) {
    //         if (!RTM.check_token()) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
    //             RTM.login();
    //             return;
    //         }
    //         if (!args.object.text) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to move.'});
    //             return;
    //         }
    //         if (!args.goal.text){
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No target task list given.'});
    //             return;
    //         }
    //         var taskSeries = RTM.tasks.get_task(args.object.data);
    //         if (!taskSeries) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
    //             return;
    //         }
    
    //      if (RTM.move_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, args.goal.data)){
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_MOVED});
    //          RTM.tasks.async_update_all();
    //      } else {
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_MOVING_TASK});
    //      }   
    //     }
    // });
    
    
    // CmdUtils.CreateCommand({
    //  names:["rtm-postpone-task", "rtm postpone task", "postpone task"],
    //     homepage: "http://www.garyhodgson.com/ubiquity",
    //  author: {
    //      name: "Gary Hodgson",
    //      email: "contact@garyhodgson.com"    
    //  },
    //  license: "MPL",
    //  icon: RTM.constants.url.ICON_URL,
    //  description: "Postpones a task in RTM.",
    //  arguments: [{role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)}],
    //  msg_title: "RTM Ubiquity: Postpone Task",
    //     preview: function(pBlock, args) {
    //      pBlock.innerHTML = this.description;
    //         if (!RTM.check_token()) {
    //             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
    //             return;
    //         } 
    //         if (!args.object.text) {
    //             return;
    //         }
    //         var task = RTM.tasks.get_task(args.object.data) || null;
    //      if (!task) {
    //          pBlock.innerHTML = "Unable to find task in task lists.";
    //          return; 
    //      }
                
    //         var previewData = {
    //          item: task,
    //          userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
    //          rootUrl: RTM.constants.url.ROOT_URL,
    //         }; 
    
    //         pBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
    //     },
    //     execute: function(args) {
    //         if (!RTM.check_token()) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
    //             RTM.login();
    //             return;
    //         }    
    //         if (!args.object.text) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to postpone.'});
    //             return;
    //         }
    //         var taskSeries = RTM.tasks.get_task(args.object.data);
    //         if (!taskSeries) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
    //             return;
    //         }
            
    //         if (RTM.postpone_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_POSTPONED});
    //          RTM.tasks.async_update_all();
    //      } else {
    //          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_POSTPONING_TASK});
    //      }
    //     }
    // });
    
    
    // CmdUtils.CreateCommand({
    //     names:["complete task", "rtm complete task", "rtm-complete-task"],
    //     homepage: "http://www.garyhodgson.com/ubiquity",
    //     author: {
    //         name: "Gary Hodgson",
    //         email: "contact@garyhodgson.com"    },
    //     license: "MPL",
    //     icon: RTM.constants.url.ICON_URL,
    //     description: "Complete task in RTM.",
    //  arguments: [{role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)}],
    //  msg_title: "RTM Ubiquity: Complete Task",
    //     preview: function(pBlock, args) {
            
    //         if (!RTM.check_token()) {
    //             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
    //             return;
    //         } 
    //         if (!args.object.text) {
    //             pBlock.innerHTML = this.description;
    //             return;
    //         }
            
    //      var task = RTM.tasks.get_task(args.object.data) || null;
    //      if (!task) {
    //          pBlock.innerHTML = "Unable to find task in task lists.";
    //          return; 
    //      }
            
    //         var previewData = {
    //          item: task,
    //          userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
    //          rootUrl: RTM.constants.url.ROOT_URL,
    //         }; 
    
    //         pBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
    //     },
    //     execute: function(args) {
    //         if (!RTM.check_token()) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
    //             RTM.login();
    //             return;
    //         }        
    //         if (!args.object.text) {
    //             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to complete.'});
    //             return;
    //         }
    //         var tasks = Application.storage.get(RTM.constants.store.TASKS, null);
    //         if (!tasks) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find any tasks in your Task Lists.'});
//              return;
//          }
//          var taskSeries = tasks[args.object.data];
//          if (!taskSeries) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
//              return;
//          }
    
//          if (RTM.complete_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_COMPLETED});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_COMPLETING_TASK});
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      names:["view tasks", "rtm view tasks", "rtm-view-tasks"],
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "View a list of RTM Tasks.",
//      arguments: [    
//          {role: 'object', label: 'task', nountype: noun_arb_text},
//          {role: 'source', nountype: new RtmNounType("Task List", RTM.lists.get_all_list_names)},
//          {role: 'modifier', nountype: new RtmNounType("Priority", {"1":"1","2":"2","3":"3","N":"None"})}, 
//          {role: 'instrument', nountype: new RtmNounType("Tag", RTM.tasks.get_tag_array)}
//      ],
//      msg_title: "RTM Ubiquity: View Tasks",
//      preview: function(pblock, args) {
            
//          pblock.innerHTML = this.description;        
            
//          if (!RTM.check_token()) {
//              pblock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
            
//          var tasks = RTM.tasks.get_tasks(false);
//          if (!tasks) {
//              pblock.innerHTML = RTM.constants.msg.NO_TASKS_FOUND;
//              return;
//          }
    
//          var task = ".*"+args.object.text.replace(/^\s+|\s+$/g,"")+".*";
//          var list = args.source.data || null;
//          var priority = args.modifier.data || null;
//          var tag = args.instrument.text || null;
    
//          var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
            
//          subTasks.sort(RTM.utils.sort_tasks_algorithm);
     
//          ptemplate = "<div>";
//          ptemplate += "{for item in items}";
//          ptemplate += RTM.template.TASK;
//          ptemplate += "{/for}";
//          ptemplate += "</div>";
                    
    
//          var previewData = {
//              items: subTasks,
//              rootUrl: RTM.constants.url.ROOT_URL,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//          }
            
//          pblock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
//      },
//      execute: function(args) {   
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
            
//          if (!RTM.tasks.get_tasks(false)) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Syncing with RTM.'});
//              RTM.lists.update();        
//              RTM.tasks.force_update_all();
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Sync with RTM complete.'});
//              return;
//          }
            
//          Utils.openUrlInBrowser(RTM.constants.url.ROOT_URL, null);
//      }
//  });

// } 
// else // Parser 1 commands
// {
        
//  CmdUtils.CreateCommand({
//      name: "rtm-refresh",  
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Force a refresh of all tasks and tasklists from RTM.",
//      msg_title: "RTM Ubiquity: Refresh",
//      preview: function(previewBlock, directObject, mods) {
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
            
//          var p = this.description;
//          p += "<br><br>";
//          p += "Current Status:";
//          p += "<br><br>";
//          p += RTM.template.STATUS;
//          previewBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
//      },
//      execute: function(directObject, mods) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
    
//          RTM.lists.update();
//          RTM.tasks.force_update_all();
    
//          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: "Refresh Complete!"});        
//         }
//  });
    
//  CmdUtils.CreateCommand({
//      name: "rtm-logout",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com",
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "RTM Logout.  Removes all traces of the ubiquity command.",
//      msg_title: "RTM Ubiquity: Logout",
//      preview: function(previewBlock, directObject, mods) {
            
//          var p = "RTM Ubiquity Status.<br><br>";
//          p += RTM.template.STATUS;
//          p += "<br><br>";
//          p += "<span style=\"color:red;\">Warning!</span> Pressing Enter will clear all stored data for the RTM Ubiquity Command. Are you sure?";
                 
//          previewBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
//      },
//      execute: function(directObject, mods) {
//          RTM.prefs.remove_all();
//          for (var c in RTM.constants.store){
//              Application.storage.set(RTM.constants.store[c], null);
//          }

//          RTM.tasks.clear();
//          RTM.lists.clear();
        
//          displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Data Cleared!'});
//      }
//  });
    
    
//  CmdUtils.CreateCommand({
//      name: "rtm-login",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "RTM Login. Directs the user to RTM for an authorisation token.",
//      msg_title: "RTM Ubiquity: Login",
//      preview: function(previewBlock, directObject, mods) {
//          if (RTM.check_token()) {
//              previewBlock.innerHTML = 'Authorisation token found. You\'re good to go!';
//          } else {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//          }
//      },
//      execute: function(directObject, mods) {
//          if (RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      name: "rtm-add-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Add a task to RTM.",
//      takes: {
//          task: noun_arb_text
//      },
//      modifiers: {
//          to: new RtmNounType("Task List", RTM.lists.get_regular_list_names),
//          pri: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} ),
//          url: noun_arb_text,
//          tags: noun_arb_text,
//      },
//      msg_title: "RTM Ubiquity: Add Task",
//      preview: function(previewBlock, directObject, mods) {
//          previewBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
            
//          var defaultListName = RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null))||'Inbox';
            
//          var taskName = directObject.summary || null;
//          var tags = (mods.tags.text) ? mods.tags.text.split() : [];
//          var priority = mods.pri.data || null;
//          var listName = mods.to.text || defaultListName;
//          var url = mods.url.text || null;        
//          if (url){
//              url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
//              url = RTM.utils.format_url(url);
//          }
    
//          var task = {
//              id: "",
//              name: taskName,
//              task: {
//                  priority:mods.pri.text||""
//              },
//              tags: tags,
//              list_name: listName,
//              overdue:"",
//              url: url,
//              due:"<em>(Due date calculated from task when submitted)</em>",
//          }
            
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//          }; 
    
//          var ptemplate = "Add Task:";
//          ptemplate += RTM.template.TASK;
            
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
            
//      },
//      execute: function(directObject, mods) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!directObject.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
//              return;
//          }
//          var successMessage = RTM.constants.msg.TASK_ADDED;
//          var taskName = directObject.text;
//          var tags = mods.tags.text || null;
//          var priority = mods.pri.data || null;
//          var listId = mods.to.data || RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null);
//          if (RTM.lists.is_smart_list(listId)) {
//              listId = RTM.lists.get_list_id("Inbox");
//              successMessage = RTM.constants.msg.TASK_ADDED_INBOX;
//          } 
            
//          var url = mods.url.text || null;
//          if (url){
//              url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
//              url = RTM.utils.format_url(url);
//          }
            
//          if (RTM.add_task(taskName, listId, url, priority, tags)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: successMessage});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK});
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      name: "rtm-note-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Adds a note to a task in RTM.",
//      takes: {
//          note: noun_arb_text
//      },
//      modifiers: {
//          title: noun_arb_text,
//          to: new RtmNounType("Task", RTM.tasks.get_task_names),
//      },
//      msg_title: "RTM Ubiquity: Note Task",
//      preview: function(previewBlock, directObject, mods) {
//          previewBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
                
//          var note = directObject.summary || null;
//          var taskName = mods.to.text || null;
//          var title = mods.title.text || null;
//          var taskId = mods.to.data || null;
    
//          var task = RTM.tasks.get_task(taskId);
            
//          if (!task) {
//              task = {
//                  id: "",
//                  name: taskName,
//                  task: {priority:""},
//                  tags: [],
//                  list_name: "",
//                  overdue:"",
//                  url: "",
//                  due:"",
//              };
//          }
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//              newNote: note,
//              newNoteTitle: title,
//          }; 
    
//          var ptemplate = "Add Task Note:";
//          ptemplate += RTM.template.TASK;
//          ptemplate += " <div style=\"padding-left:2px;margin-left:26px;text-align:left;font-size:0.8em\">"
//          ptemplate += "  <li>&nbsp;{if (newNoteTitle)}<em>${newNoteTitle}</em><br/>{/if}{if (newNote)}<b>${newNote}</b>{/if}"
//          ptemplate += " </div>"      
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
            
//      },
//      execute: function(directObject, mods) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!directObject.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.NOTE_TEXT_REQUIRED});
//              return;
//          }
            
//          var note = directObject.text || null;
//          var taskId = mods.to.data || null;
//          var taskSeries = RTM.tasks.get_task(taskId);
//          var title = mods.title.text || null;
            
//          if (!taskSeries){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
//              return;
//          }
    
//          if (RTM.add_task_note(taskSeries.task.id, taskSeries.id, taskSeries.list_id, note, title)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NOTE_ADDED});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK_NOTE});
//          }
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      name: "rtm-prioritise-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"    
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Prioritises a task in RTM.",
//      takes: {
//          task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
//      },
//      modifiers: {
//          to: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )
//      },
//      msg_title: "RTM Ubiquity: Prioritise Task",
//      preview: function(previewBlock, directObject, mods) {
            
//          previewBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          } 
//          if (!directObject.text) {
//              previewBlock.innerHTML = "Unable to find tasks.";
//              return;
//          }
    
//          var task = RTM.tasks.get_task(directObject.data) || null;
//          if (!task) {
//              previewBlock.innerHTML = "Unable to find task in task lists.";
//              return; 
//          }
//          task.task.priority = mods.to.text || 'N';
                
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//          }; 
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
//      },
//      execute: function(directObject, mods) { 
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!directObject.text) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to prioritise.'});
//              return;
//          }
//          if (!mods.to.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No priority given.'});
//              return;
//          }
//          var taskSeries = RTM.tasks.get_task(directObject.data);
//          if (!taskSeries) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
//              return;
//          }
    
//          if (RTM.prioritise_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, mods.to.text)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Task priority set to ' + mods.to.text});    
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: PROBLEM_PRIORITISING_TASK});
//          }
//          RTM.tasks.async_update_all();
//      }
//  });
    
//  CmdUtils.CreateCommand({
//      name: "rtm-move-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"    
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Moves a task between task lists in RTM.",
//      takes: {
//          task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
//      },
//      modifiers: {
//          to: new RtmNounType("Task List", RTM.lists.get_regular_list_names)
//      },
//      msg_title: "RTM Ubiquity: Move Task",
//      preview: function(previewBlock, directObject, mods) {
    
//          previewBlock.innerHTML = this.description;
    
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }         
//          if (!directObject.text) {
//              return;
    
//          }
    
//          var task = RTM.tasks.get_task(directObject.data) || null;
//          if (!task) {
//              previewBlock.innerHTML = "Unable to find task in task lists.";
//              return; 
//          }
//          var toList = mods.to.text || '';
//          var fromList = RTM.lists.get_list_name(task.list_id) || '';
                        
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//              task: directObject.summary,
//              from: fromList,
//              to: toList,
//          }; 
    
//          var ptemplate = "Move the following task from [${from}] to [${to}]";
//          ptemplate += "<br><br>";
//          ptemplate += RTM.template.TASK;
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
    
//      },
//      execute: function(directObject, mods) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
//          if (!directObject.text) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to move.'});
//              return;
//          }
//          if (!mods.to.text){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No target task list given.'});
//              return;
//          }
//          var taskSeries = RTM.tasks.get_task(directObject.data);
//          if (!taskSeries) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
//              return;
//          }
    
//          if (RTM.move_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, mods.to.data)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_MOVED});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_MOVING_TASK});
//          }   
//      }
//  });
    
    
//  CmdUtils.CreateCommand({
//      name: "rtm-postpone-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"    
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Postpones a task in RTM.",
//      takes: {
//          task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
//      },
//      msg_title: "RTM Ubiquity: Postpone Task",
//      preview: function(previewBlock, directObject) {
//          previewBlock.innerHTML = this.description;
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          } 
//          if (!directObject.text) {
//              return;
//          }
            
//          var task = RTM.tasks.get_task(directObject.data) || null;
//          if (!task) {
//              previewBlock.innerHTML = "Unable to find task in task lists.";
//              return; 
//          }
                
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//          }; 
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
//      },
//      execute: function(directObject, mods) {
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }    
//          if (!directObject.text) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to postpone.'});
//              return;
//          }
//          var taskSeries = RTM.tasks.get_task(directObject.data);
//          if (!taskSeries) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
//              return;
//          }
            
//          if (RTM.postpone_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_POSTPONED});
//              RTM.tasks.async_update_all();
//          } else {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_POSTPONING_TASK});
//          }
//      }
//  });
    
    
//  CmdUtils.CreateCommand({
//      name: "rtm-complete-task",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"    },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "Complete task in RTM.",
//      takes: {
//          task: new RtmNounType("Task Names", RTM.tasks.get_task_names),
//      },    
//      msg_title: "RTM Ubiquity: Complete Task",
//      preview: function(previewBlock, directObject) {
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          } 
//          if (!directObject.text) {
//              previewBlock.innerHTML = this.description;
//              return;
//          }
            
//          var task = RTM.tasks.get_task(directObject.data) || null;
//          if (!task) {
//              previewBlock.innerHTML = "Unable to find task in task lists.";
//              return; 
//          }
            
//          var previewData = {
//              item: task,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//              rootUrl: RTM.constants.url.ROOT_URL,
//          }; 
    
//          previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
//      },
//      execute: function(directObject, mods) {
    
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }        
//          if (!directObject.text) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to complete.'});
//                  return;
//              }
//              var tasks = Application.storage.get(RTM.constants.store.TASKS, null);
//              if (!tasks) {
//                  displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find any tasks in your Task Lists.'});
//                  return;
//              }
//              var taskSeries = tasks[directObject.data];
//              if (!taskSeries) {
//                  displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
//                  return;
//              }
        
//              if (RTM.complete_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
//                  displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_COMPLETED});      
//                  RTM.tasks.async_update_all();
//              } else {
//                  displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_COMPLETING_TASK});
//              }
//          }
//      });
        
        
//  CmdUtils.CreateCommand({
//      name: "rtm-view-tasks",
//      homepage: "http://www.garyhodgson.com/ubiquity",
//      author: {
//          name: "Gary Hodgson",
//          email: "contact@garyhodgson.com"
//      },
//      license: "MPL",
//      icon: RTM.constants.url.ICON_URL,
//      description: "View a list of RTM Tasks.",
//      takes: {
//          task: noun_arb_text
//      },
//      modifiers: { 
//          in : new RtmNounType("Task List", RTM.lists.get_all_list_names),
//          pri: new RtmNounType("Priority", {"1":"1","2":"2","3":"3","N":"None"} ),
//          tag: new RtmNounType("Tag", RTM.tasks.get_tag_array),
//      },
//      msg_title: "RTM Ubiquity: View Tasks",
//      execute: function(directObject, mods) {
            
//          if (!RTM.check_token()) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
//              RTM.login();
//              return;
//          }
            
//          if (!RTM.tasks.get_tasks(false)) {
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Syncing with RTM.'});
//              RTM.lists.update();        
//              RTM.tasks.force_update_all();
//              displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Sync with RTM complete.'});
//              return;
//          }
            
//          Utils.openUrlInBrowser(RTM.constants.url.ROOT_URL, null);
//      },
//      preview: function(previewBlock, directObject, mods) {
//          previewBlock.innerHTML = this.description;        
            
//          if (!RTM.check_token()) {
//              previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
//              return;
//          }
//          var tasks = RTM.tasks.get_tasks(false);
//          if (!tasks) {
//              previewBlock.innerHTML = RTM.constants.msg.NO_TASKS_FOUND;
//              return;
//          }
    
//          var task = ".*"+directObject.text.replace(/^\s+|\s+$/g,"")+".*";
//          var list = mods.in.data || null;
//          var priority = mods.pri.data || null;
//          var tag = mods.tag.text || null;
    
//          var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
            
//          subTasks.sort(RTM.utils.sort_tasks_algorithm);
     
//          ptemplate = "<div>";
//          ptemplate += "{for item in items}";
//          ptemplate += RTM.template.TASK;
//          ptemplate += "{/for}";
//          ptemplate += "</div>";
                    
    
//          var previewData = {
//              items: subTasks,
//              rootUrl: RTM.constants.url.ROOT_URL,
//              userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
//          }
            
//          previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
    
//      }
//  });
// }


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

/*
 * jQuery JavaScript Library v1.3.2
 * http://jquery.com/
 *
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
 * Revision: 6246
 */
(function(){var l=this,g,y=l.jQuery,p=l.$,o=l.jQuery=l.$=function(E,F){return new o.fn.init(E,F)},D=/^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,f=/^.[^:#\[\.,]*$/;o.fn=o.prototype={init:function(E,H){E=E||document;if(E.nodeType){this[0]=E;this.length=1;this.context=E;return this}if(typeof E==="string"){var G=D.exec(E);if(G&&(G[1]||!H)){if(G[1]){E=o.clean([G[1]],H)}else{var I=document.getElementById(G[3]);if(I&&I.id!=G[3]){return o().find(E)}var F=o(I||[]);F.context=document;F.selector=E;return F}}else{return o(H).find(E)}}else{if(o.isFunction(E)){return o(document).ready(E)}}if(E.selector&&E.context){this.selector=E.selector;this.context=E.context}return this.setArray(o.isArray(E)?E:o.makeArray(E))},selector:"",jquery:"1.3.2",size:function(){return this.length},get:function(E){return E===g?Array.prototype.slice.call(this):this[E]},pushStack:function(F,H,E){var G=o(F);G.prevObject=this;G.context=this.context;if(H==="find"){G.selector=this.selector+(this.selector?" ":"")+E}else{if(H){G.selector=this.selector+"."+H+"("+E+")"}}return G},setArray:function(E){this.length=0;Array.prototype.push.apply(this,E);return this},each:function(F,E){return o.each(this,F,E)},index:function(E){return o.inArray(E&&E.jquery?E[0]:E,this)},attr:function(F,H,G){var E=F;if(typeof F==="string"){if(H===g){return this[0]&&o[G||"attr"](this[0],F)}else{E={};E[F]=H}}return this.each(function(I){for(F in E){o.attr(G?this.style:this,F,o.prop(this,E[F],G,I,F))}})},css:function(E,F){if((E=="width"||E=="height")&&parseFloat(F)<0){F=g}return this.attr(E,F,"curCSS")},text:function(F){if(typeof F!=="object"&&F!=null){return this.empty().append((this[0]&&this[0].ownerDocument||document).createTextNode(F))}var E="";o.each(F||this,function(){o.each(this.childNodes,function(){if(this.nodeType!=8){E+=this.nodeType!=1?this.nodeValue:o.fn.text([this])}})});return E},wrapAll:function(E){if(this[0]){var F=o(E,this[0].ownerDocument).clone();if(this[0].parentNode){F.insertBefore(this[0])}F.map(function(){var G=this;while(G.firstChild){G=G.firstChild}return G}).append(this)}return this},wrapInner:function(E){return this.each(function(){o(this).contents().wrapAll(E)})},wrap:function(E){return this.each(function(){o(this).wrapAll(E)})},append:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.appendChild(E)}})},prepend:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.insertBefore(E,this.firstChild)}})},before:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this)})},after:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this.nextSibling)})},end:function(){return this.prevObject||o([])},push:[].push,sort:[].sort,splice:[].splice,find:function(E){if(this.length===1){var F=this.pushStack([],"find",E);F.length=0;o.find(E,this[0],F);return F}else{return this.pushStack(o.unique(o.map(this,function(G){return o.find(E,G)})),"find",E)}},clone:function(G){var E=this.map(function(){if(!o.support.noCloneEvent&&!o.isXMLDoc(this)){var I=this.outerHTML;if(!I){var J=this.ownerDocument.createElement("div");J.appendChild(this.cloneNode(true));I=J.innerHTML}return o.clean([I.replace(/ jQuery\d+="(?:\d+|null)"/g,"").replace(/^\s*/,"")])[0]}else{return this.cloneNode(true)}});if(G===true){var H=this.find("*").andSelf(),F=0;E.find("*").andSelf().each(function(){if(this.nodeName!==H[F].nodeName){return}var I=o.data(H[F],"events");for(var K in I){for(var J in I[K]){o.event.add(this,K,I[K][J],I[K][J].data)}}F++})}return E},filter:function(E){return this.pushStack(o.isFunction(E)&&o.grep(this,function(G,F){return E.call(G,F)})||o.multiFilter(E,o.grep(this,function(F){return F.nodeType===1})),"filter",E)},closest:function(E){var G=o.expr.match.POS.test(E)?o(E):null,F=0;return this.map(function(){var H=this;while(H&&H.ownerDocument){if(G?G.index(H)>-1:o(H).is(E)){o.data(H,"closest",F);return H}H=H.parentNode;F++}})},not:function(E){if(typeof E==="string"){if(f.test(E)){return this.pushStack(o.multiFilter(E,this,true),"not",E)}else{E=o.multiFilter(E,this)}}var F=E.length&&E[E.length-1]!==g&&!E.nodeType;return this.filter(function(){return F?o.inArray(this,E)<0:this!=E})},add:function(E){return this.pushStack(o.unique(o.merge(this.get(),typeof E==="string"?o(E):o.makeArray(E))))},is:function(E){return !!E&&o.multiFilter(E,this).length>0},hasClass:function(E){return !!E&&this.is("."+E)},val:function(K){if(K===g){var E=this[0];if(E){if(o.nodeName(E,"option")){return(E.attributes.value||{}).specified?E.value:E.text}if(o.nodeName(E,"select")){var I=E.selectedIndex,L=[],M=E.options,H=E.type=="select-one";if(I<0){return null}for(var F=H?I:0,J=H?I+1:M.length;F<J;F++){var G=M[F];if(G.selected){K=o(G).val();if(H){return K}L.push(K)}}return L}return(E.value||"").replace(/\r/g,"")}return g}if(typeof K==="number"){K+=""}return this.each(function(){if(this.nodeType!=1){return}if(o.isArray(K)&&/radio|checkbox/.test(this.type)){this.checked=(o.inArray(this.value,K)>=0||o.inArray(this.name,K)>=0)}else{if(o.nodeName(this,"select")){var N=o.makeArray(K);o("option",this).each(function(){this.selected=(o.inArray(this.value,N)>=0||o.inArray(this.text,N)>=0)});if(!N.length){this.selectedIndex=-1}}else{this.value=K}}})},html:function(E){return E===g?(this[0]?this[0].innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g,""):null):this.empty().append(E)},replaceWith:function(E){return this.after(E).remove()},eq:function(E){return this.slice(E,+E+1)},slice:function(){return this.pushStack(Array.prototype.slice.apply(this,arguments),"slice",Array.prototype.slice.call(arguments).join(","))},map:function(E){return this.pushStack(o.map(this,function(G,F){return E.call(G,F,G)}))},andSelf:function(){return this.add(this.prevObject)},domManip:function(J,M,L){if(this[0]){var I=(this[0].ownerDocument||this[0]).createDocumentFragment(),F=o.clean(J,(this[0].ownerDocument||this[0]),I),H=I.firstChild;if(H){for(var G=0,E=this.length;G<E;G++){L.call(K(this[G],H),this.length>1||G>0?I.cloneNode(true):I)}}if(F){o.each(F,z)}}return this;function K(N,O){return M&&o.nodeName(N,"table")&&o.nodeName(O,"tr")?(N.getElementsByTagName("tbody")[0]||N.appendChild(N.ownerDocument.createElement("tbody"))):N}}};o.fn.init.prototype=o.fn;function z(E,F){if(F.src){o.ajax({url:F.src,async:false,dataType:"script"})}else{o.globalEval(F.text||F.textContent||F.innerHTML||"")}if(F.parentNode){F.parentNode.removeChild(F)}}function e(){return +new Date}o.extend=o.fn.extend=function(){var J=arguments[0]||{},H=1,I=arguments.length,E=false,G;if(typeof J==="boolean"){E=J;J=arguments[1]||{};H=2}if(typeof J!=="object"&&!o.isFunction(J)){J={}}if(I==H){J=this;--H}for(;H<I;H++){if((G=arguments[H])!=null){for(var F in G){var K=J[F],L=G[F];if(J===L){continue}if(E&&L&&typeof L==="object"&&!L.nodeType){J[F]=o.extend(E,K||(L.length!=null?[]:{}),L)}else{if(L!==g){J[F]=L}}}}}return J};var b=/z-?index|font-?weight|opacity|zoom|line-?height/i,q=document.defaultView||{},s=Object.prototype.toString;o.extend({noConflict:function(E){l.$=p;if(E){l.jQuery=y}return o},isFunction:function(E){return s.call(E)==="[object Function]"},isArray:function(E){return s.call(E)==="[object Array]"},isXMLDoc:function(E){return E.nodeType===9&&E.documentElement.nodeName!=="HTML"||!!E.ownerDocument&&o.isXMLDoc(E.ownerDocument)},globalEval:function(G){if(G&&/\S/.test(G)){var F=document.getElementsByTagName("head")[0]||document.documentElement,E=document.createElement("script");E.type="text/javascript";if(o.support.scriptEval){E.appendChild(document.createTextNode(G))}else{E.text=G}F.insertBefore(E,F.firstChild);F.removeChild(E)}},nodeName:function(F,E){return F.nodeName&&F.nodeName.toUpperCase()==E.toUpperCase()},each:function(G,K,F){var E,H=0,I=G.length;if(F){if(I===g){for(E in G){if(K.apply(G[E],F)===false){break}}}else{for(;H<I;){if(K.apply(G[H++],F)===false){break}}}}else{if(I===g){for(E in G){if(K.call(G[E],E,G[E])===false){break}}}else{for(var J=G[0];H<I&&K.call(J,H,J)!==false;J=G[++H]){}}}return G},prop:function(H,I,G,F,E){if(o.isFunction(I)){I=I.call(H,F)}return typeof I==="number"&&G=="curCSS"&&!b.test(E)?I+"px":I},className:{add:function(E,F){o.each((F||"").split(/\s+/),function(G,H){if(E.nodeType==1&&!o.className.has(E.className,H)){E.className+=(E.className?" ":"")+H}})},remove:function(E,F){if(E.nodeType==1){E.className=F!==g?o.grep(E.className.split(/\s+/),function(G){return !o.className.has(F,G)}).join(" "):""}},has:function(F,E){return F&&o.inArray(E,(F.className||F).toString().split(/\s+/))>-1}},swap:function(H,G,I){var E={};for(var F in G){E[F]=H.style[F];H.style[F]=G[F]}I.call(H);for(var F in G){H.style[F]=E[F]}},css:function(H,F,J,E){if(F=="width"||F=="height"){var L,G={position:"absolute",visibility:"hidden",display:"block"},K=F=="width"?["Left","Right"]:["Top","Bottom"];function I(){L=F=="width"?H.offsetWidth:H.offsetHeight;if(E==="border"){return}o.each(K,function(){if(!E){L-=parseFloat(o.curCSS(H,"padding"+this,true))||0}if(E==="margin"){L+=parseFloat(o.curCSS(H,"margin"+this,true))||0}else{L-=parseFloat(o.curCSS(H,"border"+this+"Width",true))||0}})}if(H.offsetWidth!==0){I()}else{o.swap(H,G,I)}return Math.max(0,Math.round(L))}return o.curCSS(H,F,J)},curCSS:function(I,F,G){var L,E=I.style;if(F=="opacity"&&!o.support.opacity){L=o.attr(E,"opacity");return L==""?"1":L}if(F.match(/float/i)){F=w}if(!G&&E&&E[F]){L=E[F]}else{if(q.getComputedStyle){if(F.match(/float/i)){F="float"}F=F.replace(/([A-Z])/g,"-$1").toLowerCase();var M=q.getComputedStyle(I,null);if(M){L=M.getPropertyValue(F)}if(F=="opacity"&&L==""){L="1"}}else{if(I.currentStyle){var J=F.replace(/\-(\w)/g,function(N,O){return O.toUpperCase()});L=I.currentStyle[F]||I.currentStyle[J];if(!/^\d+(px)?$/i.test(L)&&/^\d/.test(L)){var H=E.left,K=I.runtimeStyle.left;I.runtimeStyle.left=I.currentStyle.left;E.left=L||0;L=E.pixelLeft+"px";E.left=H;I.runtimeStyle.left=K}}}}return L},clean:function(F,K,I){K=K||document;if(typeof K.createElement==="undefined"){K=K.ownerDocument||K[0]&&K[0].ownerDocument||document}if(!I&&F.length===1&&typeof F[0]==="string"){var H=/^<(\w+)\s*\/?>$/.exec(F[0]);if(H){return[K.createElement(H[1])]}}var G=[],E=[],L=K.createElement("div");o.each(F,function(P,S){if(typeof S==="number"){S+=""}if(!S){return}if(typeof S==="string"){S=S.replace(/(<(\w+)[^>]*?)\/>/g,function(U,V,T){return T.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i)?U:V+"></"+T+">"});var O=S.replace(/^\s+/,"").substring(0,10).toLowerCase();var Q=!O.indexOf("<opt")&&[1,"<select multiple='multiple'>","</select>"]||!O.indexOf("<leg")&&[1,"<fieldset>","</fieldset>"]||O.match(/^<(thead|tbody|tfoot|colg|cap)/)&&[1,"<table>","</table>"]||!O.indexOf("<tr")&&[2,"<table><tbody>","</tbody></table>"]||(!O.indexOf("<td")||!O.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||!O.indexOf("<col")&&[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]||!o.support.htmlSerialize&&[1,"div<div>","</div>"]||[0,"",""];L.innerHTML=Q[1]+S+Q[2];while(Q[0]--){L=L.lastChild}if(!o.support.tbody){var R=/<tbody/i.test(S),N=!O.indexOf("<table")&&!R?L.firstChild&&L.firstChild.childNodes:Q[1]=="<table>"&&!R?L.childNodes:[];for(var M=N.length-1;M>=0;--M){if(o.nodeName(N[M],"tbody")&&!N[M].childNodes.length){N[M].parentNode.removeChild(N[M])}}}if(!o.support.leadingWhitespace&&/^\s/.test(S)){L.insertBefore(K.createTextNode(S.match(/^\s*/)[0]),L.firstChild)}S=o.makeArray(L.childNodes)}if(S.nodeType){G.push(S)}else{G=o.merge(G,S)}});if(I){for(var J=0;G[J];J++){if(o.nodeName(G[J],"script")&&(!G[J].type||G[J].type.toLowerCase()==="text/javascript")){E.push(G[J].parentNode?G[J].parentNode.removeChild(G[J]):G[J])}else{if(G[J].nodeType===1){G.splice.apply(G,[J+1,0].concat(o.makeArray(G[J].getElementsByTagName("script"))))}I.appendChild(G[J])}}return E}return G},attr:function(J,G,K){if(!J||J.nodeType==3||J.nodeType==8){return g}var H=!o.isXMLDoc(J),L=K!==g;G=H&&o.props[G]||G;if(J.tagName){var F=/href|src|style/.test(G);if(G=="selected"&&J.parentNode){J.parentNode.selectedIndex}if(G in J&&H&&!F){if(L){if(G=="type"&&o.nodeName(J,"input")&&J.parentNode){throw"type property can't be changed"}J[G]=K}if(o.nodeName(J,"form")&&J.getAttributeNode(G)){return J.getAttributeNode(G).nodeValue}if(G=="tabIndex"){var I=J.getAttributeNode("tabIndex");return I&&I.specified?I.value:J.nodeName.match(/(button|input|object|select|textarea)/i)?0:J.nodeName.match(/^(a|area)$/i)&&J.href?0:g}return J[G]}if(!o.support.style&&H&&G=="style"){return o.attr(J.style,"cssText",K)}if(L){J.setAttribute(G,""+K)}var E=!o.support.hrefNormalized&&H&&F?J.getAttribute(G,2):J.getAttribute(G);return E===null?g:E}if(!o.support.opacity&&G=="opacity"){if(L){J.zoom=1;J.filter=(J.filter||"").replace(/alpha\([^)]*\)/,"")+(parseInt(K)+""=="NaN"?"":"alpha(opacity="+K*100+")")}return J.filter&&J.filter.indexOf("opacity=")>=0?(parseFloat(J.filter.match(/opacity=([^)]*)/)[1])/100)+"":""}G=G.replace(/-([a-z])/ig,function(M,N){return N.toUpperCase()});if(L){J[G]=K}return J[G]},trim:function(E){return(E||"").replace(/^\s+|\s+$/g,"")},makeArray:function(G){var E=[];if(G!=null){var F=G.length;if(F==null||typeof G==="string"||o.isFunction(G)||G.setInterval){E[0]=G}else{while(F){E[--F]=G[F]}}}return E},inArray:function(G,H){for(var E=0,F=H.length;E<F;E++){if(H[E]===G){return E}}return -1},merge:function(H,E){var F=0,G,I=H.length;if(!o.support.getAll){while((G=E[F++])!=null){if(G.nodeType!=8){H[I++]=G}}}else{while((G=E[F++])!=null){H[I++]=G}}return H},unique:function(K){var F=[],E={};try{for(var G=0,H=K.length;G<H;G++){var J=o.data(K[G]);if(!E[J]){E[J]=true;F.push(K[G])}}}catch(I){F=K}return F},grep:function(F,J,E){var G=[];for(var H=0,I=F.length;H<I;H++){if(!E!=!J(F[H],H)){G.push(F[H])}}return G},map:function(E,J){var F=[];for(var G=0,H=E.length;G<H;G++){var I=J(E[G],G);if(I!=null){F[F.length]=I}}return F.concat.apply([],F)}});var C=navigator.userAgent.toLowerCase();o.browser={version:(C.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1],safari:/webkit/.test(C),opera:/opera/.test(C),msie:/msie/.test(C)&&!/opera/.test(C),mozilla:/mozilla/.test(C)&&!/(compatible|webkit)/.test(C)};o.each({parent:function(E){return E.parentNode},parents:function(E){return o.dir(E,"parentNode")},next:function(E){return o.nth(E,2,"nextSibling")},prev:function(E){return o.nth(E,2,"previousSibling")},nextAll:function(E){return o.dir(E,"nextSibling")},prevAll:function(E){return o.dir(E,"previousSibling")},siblings:function(E){return o.sibling(E.parentNode.firstChild,E)},children:function(E){return o.sibling(E.firstChild)},contents:function(E){return o.nodeName(E,"iframe")?E.contentDocument||E.contentWindow.document:o.makeArray(E.childNodes)}},function(E,F){o.fn[E]=function(G){var H=o.map(this,F);if(G&&typeof G=="string"){H=o.multiFilter(G,H)}return this.pushStack(o.unique(H),E,G)}});o.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(E,F){o.fn[E]=function(G){var J=[],L=o(G);for(var K=0,H=L.length;K<H;K++){var I=(K>0?this.clone(true):this).get();o.fn[F].apply(o(L[K]),I);J=J.concat(I)}return this.pushStack(J,E,G)}});o.each({removeAttr:function(E){o.attr(this,E,"");if(this.nodeType==1){this.removeAttribute(E)}},addClass:function(E){o.className.add(this,E)},removeClass:function(E){o.className.remove(this,E)},toggleClass:function(F,E){if(typeof E!=="boolean"){E=!o.className.has(this,F)}o.className[E?"add":"remove"](this,F)},remove:function(E){if(!E||o.filter(E,[this]).length){o("*",this).add([this]).each(function(){o.event.remove(this);o.removeData(this)});if(this.parentNode){this.parentNode.removeChild(this)}}},empty:function(){o(this).children().remove();while(this.firstChild){this.removeChild(this.firstChild)}}},function(E,F){o.fn[E]=function(){return this.each(F,arguments)}});function j(E,F){return E[0]&&parseInt(o.curCSS(E[0],F,true),10)||0}var h="jQuery"+e(),v=0,A={};o.extend({cache:{},data:function(F,E,G){F=F==l?A:F;var H=F[h];if(!H){H=F[h]=++v}if(E&&!o.cache[H]){o.cache[H]={}}if(G!==g){o.cache[H][E]=G}return E?o.cache[H][E]:H},removeData:function(F,E){F=F==l?A:F;var H=F[h];if(E){if(o.cache[H]){delete o.cache[H][E];E="";for(E in o.cache[H]){break}if(!E){o.removeData(F)}}}else{try{delete F[h]}catch(G){if(F.removeAttribute){F.removeAttribute(h)}}delete o.cache[H]}},queue:function(F,E,H){if(F){E=(E||"fx")+"queue";var G=o.data(F,E);if(!G||o.isArray(H)){G=o.data(F,E,o.makeArray(H))}else{if(H){G.push(H)}}}return G},dequeue:function(H,G){var E=o.queue(H,G),F=E.shift();if(!G||G==="fx"){F=E[0]}if(F!==g){F.call(H)}}});o.fn.extend({data:function(E,G){var H=E.split(".");H[1]=H[1]?"."+H[1]:"";if(G===g){var F=this.triggerHandler("getData"+H[1]+"!",[H[0]]);if(F===g&&this.length){F=o.data(this[0],E)}return F===g&&H[1]?this.data(H[0]):F}else{return this.trigger("setData"+H[1]+"!",[H[0],G]).each(function(){o.data(this,E,G)})}},removeData:function(E){return this.each(function(){o.removeData(this,E)})},queue:function(E,F){if(typeof E!=="string"){F=E;E="fx"}if(F===g){return o.queue(this[0],E)}return this.each(function(){var G=o.queue(this,E,F);if(E=="fx"&&G.length==1){G[0].call(this)}})},dequeue:function(E){return this.each(function(){o.dequeue(this,E)})}});
/*
 * Sizzle CSS Selector Engine - v0.9.3
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){var R=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,L=0,H=Object.prototype.toString;var F=function(Y,U,ab,ac){ab=ab||[];U=U||document;if(U.nodeType!==1&&U.nodeType!==9){return[]}if(!Y||typeof Y!=="string"){return ab}var Z=[],W,af,ai,T,ad,V,X=true;R.lastIndex=0;while((W=R.exec(Y))!==null){Z.push(W[1]);if(W[2]){V=RegExp.rightContext;break}}if(Z.length>1&&M.exec(Y)){if(Z.length===2&&I.relative[Z[0]]){af=J(Z[0]+Z[1],U)}else{af=I.relative[Z[0]]?[U]:F(Z.shift(),U);while(Z.length){Y=Z.shift();if(I.relative[Y]){Y+=Z.shift()}af=J(Y,af)}}}else{var ae=ac?{expr:Z.pop(),set:E(ac)}:F.find(Z.pop(),Z.length===1&&U.parentNode?U.parentNode:U,Q(U));af=F.filter(ae.expr,ae.set);if(Z.length>0){ai=E(af)}else{X=false}while(Z.length){var ah=Z.pop(),ag=ah;if(!I.relative[ah]){ah=""}else{ag=Z.pop()}if(ag==null){ag=U}I.relative[ah](ai,ag,Q(U))}}if(!ai){ai=af}if(!ai){throw"Syntax error, unrecognized expression: "+(ah||Y)}if(H.call(ai)==="[object Array]"){if(!X){ab.push.apply(ab,ai)}else{if(U.nodeType===1){for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&(ai[aa]===true||ai[aa].nodeType===1&&K(U,ai[aa]))){ab.push(af[aa])}}}else{for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&ai[aa].nodeType===1){ab.push(af[aa])}}}}}else{E(ai,ab)}if(V){F(V,U,ab,ac);if(G){hasDuplicate=false;ab.sort(G);if(hasDuplicate){for(var aa=1;aa<ab.length;aa++){if(ab[aa]===ab[aa-1]){ab.splice(aa--,1)}}}}}return ab};F.matches=function(T,U){return F(T,null,null,U)};F.find=function(aa,T,ab){var Z,X;if(!aa){return[]}for(var W=0,V=I.order.length;W<V;W++){var Y=I.order[W],X;if((X=I.match[Y].exec(aa))){var U=RegExp.leftContext;if(U.substr(U.length-1)!=="\\"){X[1]=(X[1]||"").replace(/\\/g,"");Z=I.find[Y](X,T,ab);if(Z!=null){aa=aa.replace(I.match[Y],"");break}}}}if(!Z){Z=T.getElementsByTagName("*")}return{set:Z,expr:aa}};F.filter=function(ad,ac,ag,W){var V=ad,ai=[],aa=ac,Y,T,Z=ac&&ac[0]&&Q(ac[0]);while(ad&&ac.length){for(var ab in I.filter){if((Y=I.match[ab].exec(ad))!=null){var U=I.filter[ab],ah,af;T=false;if(aa==ai){ai=[]}if(I.preFilter[ab]){Y=I.preFilter[ab](Y,aa,ag,ai,W,Z);if(!Y){T=ah=true}else{if(Y===true){continue}}}if(Y){for(var X=0;(af=aa[X])!=null;X++){if(af){ah=U(af,Y,X,aa);var ae=W^!!ah;if(ag&&ah!=null){if(ae){T=true}else{aa[X]=false}}else{if(ae){ai.push(af);T=true}}}}}if(ah!==g){if(!ag){aa=ai}ad=ad.replace(I.match[ab],"");if(!T){return[]}break}}}if(ad==V){if(T==null){throw"Syntax error, unrecognized expression: "+ad}else{break}}V=ad}return aa};var I=F.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(T){return T.getAttribute("href")}},relative:{"+":function(aa,T,Z){var X=typeof T==="string",ab=X&&!/\W/.test(T),Y=X&&!ab;if(ab&&!Z){T=T.toUpperCase()}for(var W=0,V=aa.length,U;W<V;W++){if((U=aa[W])){while((U=U.previousSibling)&&U.nodeType!==1){}aa[W]=Y||U&&U.nodeName===T?U||false:U===T}}if(Y){F.filter(T,aa,true)}},">":function(Z,U,aa){var X=typeof U==="string";if(X&&!/\W/.test(U)){U=aa?U:U.toUpperCase();for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){var W=Y.parentNode;Z[V]=W.nodeName===U?W:false}}}else{for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){Z[V]=X?Y.parentNode:Y.parentNode===U}}if(X){F.filter(U,Z,true)}}},"":function(W,U,Y){var V=L++,T=S;if(!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("parentNode",U,V,W,X,Y)},"~":function(W,U,Y){var V=L++,T=S;if(typeof U==="string"&&!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("previousSibling",U,V,W,X,Y)}},find:{ID:function(U,V,W){if(typeof V.getElementById!=="undefined"&&!W){var T=V.getElementById(U[1]);return T?[T]:[]}},NAME:function(V,Y,Z){if(typeof Y.getElementsByName!=="undefined"){var U=[],X=Y.getElementsByName(V[1]);for(var W=0,T=X.length;W<T;W++){if(X[W].getAttribute("name")===V[1]){U.push(X[W])}}return U.length===0?null:U}},TAG:function(T,U){return U.getElementsByTagName(T[1])}},preFilter:{CLASS:function(W,U,V,T,Z,aa){W=" "+W[1].replace(/\\/g,"")+" ";if(aa){return W}for(var X=0,Y;(Y=U[X])!=null;X++){if(Y){if(Z^(Y.className&&(" "+Y.className+" ").indexOf(W)>=0)){if(!V){T.push(Y)}}else{if(V){U[X]=false}}}}return false},ID:function(T){return T[1].replace(/\\/g,"")},TAG:function(U,T){for(var V=0;T[V]===false;V++){}return T[V]&&Q(T[V])?U[1]:U[1].toUpperCase()},CHILD:function(T){if(T[1]=="nth"){var U=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(T[2]=="even"&&"2n"||T[2]=="odd"&&"2n+1"||!/\D/.test(T[2])&&"0n+"+T[2]||T[2]);T[2]=(U[1]+(U[2]||1))-0;T[3]=U[3]-0}T[0]=L++;return T},ATTR:function(X,U,V,T,Y,Z){var W=X[1].replace(/\\/g,"");if(!Z&&I.attrMap[W]){X[1]=I.attrMap[W]}if(X[2]==="~="){X[4]=" "+X[4]+" "}return X},PSEUDO:function(X,U,V,T,Y){if(X[1]==="not"){if(X[3].match(R).length>1||/^\w/.test(X[3])){X[3]=F(X[3],null,null,U)}else{var W=F.filter(X[3],U,V,true^Y);if(!V){T.push.apply(T,W)}return false}}else{if(I.match.POS.test(X[0])||I.match.CHILD.test(X[0])){return true}}return X},POS:function(T){T.unshift(true);return T}},filters:{enabled:function(T){return T.disabled===false&&T.type!=="hidden"},disabled:function(T){return T.disabled===true},checked:function(T){return T.checked===true},selected:function(T){T.parentNode.selectedIndex;return T.selected===true},parent:function(T){return !!T.firstChild},empty:function(T){return !T.firstChild},has:function(V,U,T){return !!F(T[3],V).length},header:function(T){return/h\d/i.test(T.nodeName)},text:function(T){return"text"===T.type},radio:function(T){return"radio"===T.type},checkbox:function(T){return"checkbox"===T.type},file:function(T){return"file"===T.type},password:function(T){return"password"===T.type},submit:function(T){return"submit"===T.type},image:function(T){return"image"===T.type},reset:function(T){return"reset"===T.type},button:function(T){return"button"===T.type||T.nodeName.toUpperCase()==="BUTTON"},input:function(T){return/input|select|textarea|button/i.test(T.nodeName)}},setFilters:{first:function(U,T){return T===0},last:function(V,U,T,W){return U===W.length-1},even:function(U,T){return T%2===0},odd:function(U,T){return T%2===1},lt:function(V,U,T){return U<T[3]-0},gt:function(V,U,T){return U>T[3]-0},nth:function(V,U,T){return T[3]-0==U},eq:function(V,U,T){return T[3]-0==U}},filter:{PSEUDO:function(Z,V,W,aa){var U=V[1],X=I.filters[U];if(X){return X(Z,W,V,aa)}else{if(U==="contains"){return(Z.textContent||Z.innerText||"").indexOf(V[3])>=0}else{if(U==="not"){var Y=V[3];for(var W=0,T=Y.length;W<T;W++){if(Y[W]===Z){return false}}return true}}}},CHILD:function(T,W){var Z=W[1],U=T;switch(Z){case"only":case"first":while(U=U.previousSibling){if(U.nodeType===1){return false}}if(Z=="first"){return true}U=T;case"last":while(U=U.nextSibling){if(U.nodeType===1){return false}}return true;case"nth":var V=W[2],ac=W[3];if(V==1&&ac==0){return true}var Y=W[0],ab=T.parentNode;if(ab&&(ab.sizcache!==Y||!T.nodeIndex)){var X=0;for(U=ab.firstChild;U;U=U.nextSibling){if(U.nodeType===1){U.nodeIndex=++X}}ab.sizcache=Y}var aa=T.nodeIndex-ac;if(V==0){return aa==0}else{return(aa%V==0&&aa/V>=0)}}},ID:function(U,T){return U.nodeType===1&&U.getAttribute("id")===T},TAG:function(U,T){return(T==="*"&&U.nodeType===1)||U.nodeName===T},CLASS:function(U,T){return(" "+(U.className||U.getAttribute("class"))+" ").indexOf(T)>-1},ATTR:function(Y,W){var V=W[1],T=I.attrHandle[V]?I.attrHandle[V](Y):Y[V]!=null?Y[V]:Y.getAttribute(V),Z=T+"",X=W[2],U=W[4];return T==null?X==="!=":X==="="?Z===U:X==="*="?Z.indexOf(U)>=0:X==="~="?(" "+Z+" ").indexOf(U)>=0:!U?Z&&T!==false:X==="!="?Z!=U:X==="^="?Z.indexOf(U)===0:X==="$="?Z.substr(Z.length-U.length)===U:X==="|="?Z===U||Z.substr(0,U.length+1)===U+"-":false},POS:function(X,U,V,Y){var T=U[2],W=I.setFilters[T];if(W){return W(X,V,U,Y)}}}};var M=I.match.POS;for(var O in I.match){I.match[O]=RegExp(I.match[O].source+/(?![^\[]*\])(?![^\(]*\))/.source)}var E=function(U,T){U=Array.prototype.slice.call(U);if(T){T.push.apply(T,U);return T}return U};try{Array.prototype.slice.call(document.documentElement.childNodes)}catch(N){E=function(X,W){var U=W||[];if(H.call(X)==="[object Array]"){Array.prototype.push.apply(U,X)}else{if(typeof X.length==="number"){for(var V=0,T=X.length;V<T;V++){U.push(X[V])}}else{for(var V=0;X[V];V++){U.push(X[V])}}}return U}}var G;if(document.documentElement.compareDocumentPosition){G=function(U,T){var V=U.compareDocumentPosition(T)&4?-1:U===T?0:1;if(V===0){hasDuplicate=true}return V}}else{if("sourceIndex" in document.documentElement){G=function(U,T){var V=U.sourceIndex-T.sourceIndex;if(V===0){hasDuplicate=true}return V}}else{if(document.createRange){G=function(W,U){var V=W.ownerDocument.createRange(),T=U.ownerDocument.createRange();V.selectNode(W);V.collapse(true);T.selectNode(U);T.collapse(true);var X=V.compareBoundaryPoints(Range.START_TO_END,T);if(X===0){hasDuplicate=true}return X}}}}(function(){var U=document.createElement("form"),V="script"+(new Date).getTime();U.innerHTML="<input name='"+V+"'/>";var T=document.documentElement;T.insertBefore(U,T.firstChild);if(!!document.getElementById(V)){I.find.ID=function(X,Y,Z){if(typeof Y.getElementById!=="undefined"&&!Z){var W=Y.getElementById(X[1]);return W?W.id===X[1]||typeof W.getAttributeNode!=="undefined"&&W.getAttributeNode("id").nodeValue===X[1]?[W]:g:[]}};I.filter.ID=function(Y,W){var X=typeof Y.getAttributeNode!=="undefined"&&Y.getAttributeNode("id");return Y.nodeType===1&&X&&X.nodeValue===W}}T.removeChild(U)})();(function(){var T=document.createElement("div");T.appendChild(document.createComment(""));if(T.getElementsByTagName("*").length>0){I.find.TAG=function(U,Y){var X=Y.getElementsByTagName(U[1]);if(U[1]==="*"){var W=[];for(var V=0;X[V];V++){if(X[V].nodeType===1){W.push(X[V])}}X=W}return X}}T.innerHTML="<a href='#'></a>";if(T.firstChild&&typeof T.firstChild.getAttribute!=="undefined"&&T.firstChild.getAttribute("href")!=="#"){I.attrHandle.href=function(U){return U.getAttribute("href",2)}}})();if(document.querySelectorAll){(function(){var T=F,U=document.createElement("div");U.innerHTML="<p class='TEST'></p>";if(U.querySelectorAll&&U.querySelectorAll(".TEST").length===0){return}F=function(Y,X,V,W){X=X||document;if(!W&&X.nodeType===9&&!Q(X)){try{return E(X.querySelectorAll(Y),V)}catch(Z){}}return T(Y,X,V,W)};F.find=T.find;F.filter=T.filter;F.selectors=T.selectors;F.matches=T.matches})()}if(document.getElementsByClassName&&document.documentElement.getElementsByClassName){(function(){var T=document.createElement("div");T.innerHTML="<div class='test e'></div><div class='test'></div>";if(T.getElementsByClassName("e").length===0){return}T.lastChild.className="e";if(T.getElementsByClassName("e").length===1){return}I.order.splice(1,0,"CLASS");I.find.CLASS=function(U,V,W){if(typeof V.getElementsByClassName!=="undefined"&&!W){return V.getElementsByClassName(U[1])}}})()}function P(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1&&!ac){T.sizcache=Y;T.sizset=W}if(T.nodeName===Z){X=T;break}T=T[U]}ad[W]=X}}}function S(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1){if(!ac){T.sizcache=Y;T.sizset=W}if(typeof Z!=="string"){if(T===Z){X=true;break}}else{if(F.filter(Z,[T]).length>0){X=T;break}}}T=T[U]}ad[W]=X}}}var K=document.compareDocumentPosition?function(U,T){return U.compareDocumentPosition(T)&16}:function(U,T){return U!==T&&(U.contains?U.contains(T):true)};var Q=function(T){return T.nodeType===9&&T.documentElement.nodeName!=="HTML"||!!T.ownerDocument&&Q(T.ownerDocument)};var J=function(T,aa){var W=[],X="",Y,V=aa.nodeType?[aa]:aa;while((Y=I.match.PSEUDO.exec(T))){X+=Y[0];T=T.replace(I.match.PSEUDO,"")}T=I.relative[T]?T+"*":T;for(var Z=0,U=V.length;Z<U;Z++){F(T,V[Z],W)}return F.filter(X,W)};o.find=F;o.filter=F.filter;o.expr=F.selectors;o.expr[":"]=o.expr.filters;F.selectors.filters.hidden=function(T){return T.offsetWidth===0||T.offsetHeight===0};F.selectors.filters.visible=function(T){return T.offsetWidth>0||T.offsetHeight>0};F.selectors.filters.animated=function(T){return o.grep(o.timers,function(U){return T===U.elem}).length};o.multiFilter=function(V,T,U){if(U){V=":not("+V+")"}return F.matches(V,T)};o.dir=function(V,U){var T=[],W=V[U];while(W&&W!=document){if(W.nodeType==1){T.push(W)}W=W[U]}return T};o.nth=function(X,T,V,W){T=T||1;var U=0;for(;X;X=X[V]){if(X.nodeType==1&&++U==T){break}}return X};o.sibling=function(V,U){var T=[];for(;V;V=V.nextSibling){if(V.nodeType==1&&V!=U){T.push(V)}}return T};return;l.Sizzle=F})();o.event={add:function(I,F,H,K){if(I.nodeType==3||I.nodeType==8){return}if(I.setInterval&&I!=l){I=l}if(!H.guid){H.guid=this.guid++}if(K!==g){var G=H;H=this.proxy(G);H.data=K}var E=o.data(I,"events")||o.data(I,"events",{}),J=o.data(I,"handle")||o.data(I,"handle",function(){return typeof o!=="undefined"&&!o.event.triggered?o.event.handle.apply(arguments.callee.elem,arguments):g});J.elem=I;o.each(F.split(/\s+/),function(M,N){var O=N.split(".");N=O.shift();H.type=O.slice().sort().join(".");var L=E[N];if(o.event.specialAll[N]){o.event.specialAll[N].setup.call(I,K,O)}if(!L){L=E[N]={};if(!o.event.special[N]||o.event.special[N].setup.call(I,K,O)===false){if(I.addEventListener){I.addEventListener(N,J,false)}else{if(I.attachEvent){I.attachEvent("on"+N,J)}}}}L[H.guid]=H;o.event.global[N]=true});I=null},guid:1,global:{},remove:function(K,H,J){if(K.nodeType==3||K.nodeType==8){return}var G=o.data(K,"events"),F,E;if(G){if(H===g||(typeof H==="string"&&H.charAt(0)==".")){for(var I in G){this.remove(K,I+(H||""))}}else{if(H.type){J=H.handler;H=H.type}o.each(H.split(/\s+/),function(M,O){var Q=O.split(".");O=Q.shift();var N=RegExp("(^|\\.)"+Q.slice().sort().join(".*\\.")+"(\\.|$)");if(G[O]){if(J){delete G[O][J.guid]}else{for(var P in G[O]){if(N.test(G[O][P].type)){delete G[O][P]}}}if(o.event.specialAll[O]){o.event.specialAll[O].teardown.call(K,Q)}for(F in G[O]){break}if(!F){if(!o.event.special[O]||o.event.special[O].teardown.call(K,Q)===false){if(K.removeEventListener){K.removeEventListener(O,o.data(K,"handle"),false)}else{if(K.detachEvent){K.detachEvent("on"+O,o.data(K,"handle"))}}}F=null;delete G[O]}}})}for(F in G){break}if(!F){var L=o.data(K,"handle");if(L){L.elem=null}o.removeData(K,"events");o.removeData(K,"handle")}}},trigger:function(I,K,H,E){var G=I.type||I;if(!E){I=typeof I==="object"?I[h]?I:o.extend(o.Event(G),I):o.Event(G);if(G.indexOf("!")>=0){I.type=G=G.slice(0,-1);I.exclusive=true}if(!H){I.stopPropagation();if(this.global[G]){o.each(o.cache,function(){if(this.events&&this.events[G]){o.event.trigger(I,K,this.handle.elem)}})}}if(!H||H.nodeType==3||H.nodeType==8){return g}I.result=g;I.target=H;K=o.makeArray(K);K.unshift(I)}I.currentTarget=H;var J=o.data(H,"handle");if(J){J.apply(H,K)}if((!H[G]||(o.nodeName(H,"a")&&G=="click"))&&H["on"+G]&&H["on"+G].apply(H,K)===false){I.result=false}if(!E&&H[G]&&!I.isDefaultPrevented()&&!(o.nodeName(H,"a")&&G=="click")){this.triggered=true;try{H[G]()}catch(L){}}this.triggered=false;if(!I.isPropagationStopped()){var F=H.parentNode||H.ownerDocument;if(F){o.event.trigger(I,K,F,true)}}},handle:function(K){var J,E;K=arguments[0]=o.event.fix(K||l.event);K.currentTarget=this;var L=K.type.split(".");K.type=L.shift();J=!L.length&&!K.exclusive;var I=RegExp("(^|\\.)"+L.slice().sort().join(".*\\.")+"(\\.|$)");E=(o.data(this,"events")||{})[K.type];for(var G in E){var H=E[G];if(J||I.test(H.type)){K.handler=H;K.data=H.data;var F=H.apply(this,arguments);if(F!==g){K.result=F;if(F===false){K.preventDefault();K.stopPropagation()}}if(K.isImmediatePropagationStopped()){break}}}},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(H){if(H[h]){return H}var F=H;H=o.Event(F);for(var G=this.props.length,J;G;){J=this.props[--G];H[J]=F[J]}if(!H.target){H.target=H.srcElement||document}if(H.target.nodeType==3){H.target=H.target.parentNode}if(!H.relatedTarget&&H.fromElement){H.relatedTarget=H.fromElement==H.target?H.toElement:H.fromElement}if(H.pageX==null&&H.clientX!=null){var I=document.documentElement,E=document.body;H.pageX=H.clientX+(I&&I.scrollLeft||E&&E.scrollLeft||0)-(I.clientLeft||0);H.pageY=H.clientY+(I&&I.scrollTop||E&&E.scrollTop||0)-(I.clientTop||0)}if(!H.which&&((H.charCode||H.charCode===0)?H.charCode:H.keyCode)){H.which=H.charCode||H.keyCode}if(!H.metaKey&&H.ctrlKey){H.metaKey=H.ctrlKey}if(!H.which&&H.button){H.which=(H.button&1?1:(H.button&2?3:(H.button&4?2:0)))}return H},proxy:function(F,E){E=E||function(){return F.apply(this,arguments)};E.guid=F.guid=F.guid||E.guid||this.guid++;return E},special:{ready:{setup:B,teardown:function(){}}},specialAll:{live:{setup:function(E,F){o.event.add(this,F[0],c)},teardown:function(G){if(G.length){var E=0,F=RegExp("(^|\\.)"+G[0]+"(\\.|$)");o.each((o.data(this,"events").live||{}),function(){if(F.test(this.type)){E++}});if(E<1){o.event.remove(this,G[0],c)}}}}}};o.Event=function(E){if(!this.preventDefault){return new o.Event(E)}if(E&&E.type){this.originalEvent=E;this.type=E.type}else{this.type=E}this.timeStamp=e();this[h]=true};function k(){return false}function u(){return true}o.Event.prototype={preventDefault:function(){this.isDefaultPrevented=u;var E=this.originalEvent;if(!E){return}if(E.preventDefault){E.preventDefault()}E.returnValue=false},stopPropagation:function(){this.isPropagationStopped=u;var E=this.originalEvent;if(!E){return}if(E.stopPropagation){E.stopPropagation()}E.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=u;this.stopPropagation()},isDefaultPrevented:k,isPropagationStopped:k,isImmediatePropagationStopped:k};var a=function(F){var E=F.relatedTarget;while(E&&E!=this){try{E=E.parentNode}catch(G){E=this}}if(E!=this){F.type=F.data;o.event.handle.apply(this,arguments)}};o.each({mouseover:"mouseenter",mouseout:"mouseleave"},function(F,E){o.event.special[E]={setup:function(){o.event.add(this,F,a,E)},teardown:function(){o.event.remove(this,F,a)}}});o.fn.extend({bind:function(F,G,E){return F=="unload"?this.one(F,G,E):this.each(function(){o.event.add(this,F,E||G,E&&G)})},one:function(G,H,F){var E=o.event.proxy(F||H,function(I){o(this).unbind(I,E);return(F||H).apply(this,arguments)});return this.each(function(){o.event.add(this,G,E,F&&H)})},unbind:function(F,E){return this.each(function(){o.event.remove(this,F,E)})},trigger:function(E,F){return this.each(function(){o.event.trigger(E,F,this)})},triggerHandler:function(E,G){if(this[0]){var F=o.Event(E);F.preventDefault();F.stopPropagation();o.event.trigger(F,G,this[0]);return F.result}},toggle:function(G){var E=arguments,F=1;while(F<E.length){o.event.proxy(G,E[F++])}return this.click(o.event.proxy(G,function(H){this.lastToggle=(this.lastToggle||0)%F;H.preventDefault();return E[this.lastToggle++].apply(this,arguments)||false}))},hover:function(E,F){return this.mouseenter(E).mouseleave(F)},ready:function(E){B();if(o.isReady){E.call(document,o)}else{o.readyList.push(E)}return this},live:function(G,F){var E=o.event.proxy(F);E.guid+=this.selector+G;o(document).bind(i(G,this.selector),this.selector,E);return this},die:function(F,E){o(document).unbind(i(F,this.selector),E?{guid:E.guid+this.selector+F}:null);return this}});function c(H){var E=RegExp("(^|\\.)"+H.type+"(\\.|$)"),G=true,F=[];o.each(o.data(this,"events").live||[],function(I,J){if(E.test(J.type)){var K=o(H.target).closest(J.data)[0];if(K){F.push({elem:K,fn:J})}}});F.sort(function(J,I){return o.data(J.elem,"closest")-o.data(I.elem,"closest")});o.each(F,function(){if(this.fn.call(this.elem,H,this.fn.data)===false){return(G=false)}});return G}function i(F,E){return["live",F,E.replace(/\./g,"`").replace(/ /g,"|")].join(".")}o.extend({isReady:false,readyList:[],ready:function(){if(!o.isReady){o.isReady=true;if(o.readyList){o.each(o.readyList,function(){this.call(document,o)});o.readyList=null}o(document).triggerHandler("ready")}}});var x=false;function B(){if(x){return}x=true;if(document.addEventListener){document.addEventListener("DOMContentLoaded",function(){document.removeEventListener("DOMContentLoaded",arguments.callee,false);o.ready()},false)}else{if(document.attachEvent){document.attachEvent("onreadystatechange",function(){if(document.readyState==="complete"){document.detachEvent("onreadystatechange",arguments.callee);o.ready()}});if(document.documentElement.doScroll&&l==l.top){(function(){if(o.isReady){return}try{document.documentElement.doScroll("left")}catch(E){setTimeout(arguments.callee,0);return}o.ready()})()}}}o.event.add(l,"load",o.ready)}o.each(("blur,focus,load,resize,scroll,unload,click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,change,select,submit,keydown,keypress,keyup,error").split(","),function(F,E){o.fn[E]=function(G){return G?this.bind(E,G):this.trigger(E)}});o(l).bind("unload",function(){for(var E in o.cache){if(E!=1&&o.cache[E].handle){o.event.remove(o.cache[E].handle.elem)}}});(function(){o.support={};var F=document.documentElement,G=document.createElement("script"),K=document.createElement("div"),J="script"+(new Date).getTime();K.style.display="none";K.innerHTML='   <link/><table></table><a href="/a" style="color:red;float:left;opacity:.5;">a</a><select><option>text</option></select><object><param/></object>';var H=K.getElementsByTagName("*"),E=K.getElementsByTagName("a")[0];if(!H||!H.length||!E){return}o.support={leadingWhitespace:K.firstChild.nodeType==3,tbody:!K.getElementsByTagName("tbody").length,objectAll:!!K.getElementsByTagName("object")[0].getElementsByTagName("*").length,htmlSerialize:!!K.getElementsByTagName("link").length,style:/red/.test(E.getAttribute("style")),hrefNormalized:E.getAttribute("href")==="/a",opacity:E.style.opacity==="0.5",cssFloat:!!E.style.cssFloat,scriptEval:false,noCloneEvent:true,boxModel:null};G.type="text/javascript";try{G.appendChild(document.createTextNode("window."+J+"=1;"))}catch(I){}F.insertBefore(G,F.firstChild);if(l[J]){o.support.scriptEval=true;delete l[J]}F.removeChild(G);if(K.attachEvent&&K.fireEvent){K.attachEvent("onclick",function(){o.support.noCloneEvent=false;K.detachEvent("onclick",arguments.callee)});K.cloneNode(true).fireEvent("onclick")}o(function(){var L=document.createElement("div");L.style.width=L.style.paddingLeft="1px";document.body.appendChild(L);o.boxModel=o.support.boxModel=L.offsetWidth===2;document.body.removeChild(L).style.display="none"})})();var w=o.support.cssFloat?"cssFloat":"styleFloat";o.props={"for":"htmlFor","class":"className","float":w,cssFloat:w,styleFloat:w,readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",tabindex:"tabIndex"};o.fn.extend({_load:o.fn.load,load:function(G,J,K){if(typeof G!=="string"){return this._load(G)}var I=G.indexOf(" ");if(I>=0){var E=G.slice(I,G.length);G=G.slice(0,I)}var H="GET";if(J){if(o.isFunction(J)){K=J;J=null}else{if(typeof J==="object"){J=o.param(J);H="POST"}}}var F=this;o.ajax({url:G,type:H,dataType:"html",data:J,complete:function(M,L){if(L=="success"||L=="notmodified"){F.html(E?o("<div/>").append(M.responseText.replace(/<script(.|\s)*?\/script>/g,"")).find(E):M.responseText)}if(K){F.each(K,[M.responseText,L,M])}}});return this},serialize:function(){return o.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?o.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||/select|textarea/i.test(this.nodeName)||/text|hidden|password|search/i.test(this.type))}).map(function(E,F){var G=o(this).val();return G==null?null:o.isArray(G)?o.map(G,function(I,H){return{name:F.name,value:I}}):{name:F.name,value:G}}).get()}});o.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","),function(E,F){o.fn[F]=function(G){return this.bind(F,G)}});var r=e();o.extend({get:function(E,G,H,F){if(o.isFunction(G)){H=G;G=null}return o.ajax({type:"GET",url:E,data:G,success:H,dataType:F})},getScript:function(E,F){return o.get(E,null,F,"script")},getJSON:function(E,F,G){return o.get(E,F,G,"json")},post:function(E,G,H,F){if(o.isFunction(G)){H=G;G={}}return o.ajax({type:"POST",url:E,data:G,success:H,dataType:F})},ajaxSetup:function(E){o.extend(o.ajaxSettings,E)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return l.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest()},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},ajax:function(M){M=o.extend(true,M,o.extend(true,{},o.ajaxSettings,M));var W,F=/=\?(&|$)/g,R,V,G=M.type.toUpperCase();if(M.data&&M.processData&&typeof M.data!=="string"){M.data=o.param(M.data)}if(M.dataType=="jsonp"){if(G=="GET"){if(!M.url.match(F)){M.url+=(M.url.match(/\?/)?"&":"?")+(M.jsonp||"callback")+"=?"}}else{if(!M.data||!M.data.match(F)){M.data=(M.data?M.data+"&":"")+(M.jsonp||"callback")+"=?"}}M.dataType="json"}if(M.dataType=="json"&&(M.data&&M.data.match(F)||M.url.match(F))){W="jsonp"+r++;if(M.data){M.data=(M.data+"").replace(F,"="+W+"$1")}M.url=M.url.replace(F,"="+W+"$1");M.dataType="script";l[W]=function(X){V=X;I();L();l[W]=g;try{delete l[W]}catch(Y){}if(H){H.removeChild(T)}}}if(M.dataType=="script"&&M.cache==null){M.cache=false}if(M.cache===false&&G=="GET"){var E=e();var U=M.url.replace(/(\?|&)_=.*?(&|$)/,"$1_="+E+"$2");M.url=U+((U==M.url)?(M.url.match(/\?/)?"&":"?")+"_="+E:"")}if(M.data&&G=="GET"){M.url+=(M.url.match(/\?/)?"&":"?")+M.data;M.data=null}if(M.global&&!o.active++){o.event.trigger("ajaxStart")}var Q=/^(\w+:)?\/\/([^\/?#]+)/.exec(M.url);if(M.dataType=="script"&&G=="GET"&&Q&&(Q[1]&&Q[1]!=location.protocol||Q[2]!=location.host)){var H=document.getElementsByTagName("head")[0];var T=document.createElement("script");T.src=M.url;if(M.scriptCharset){T.charset=M.scriptCharset}if(!W){var O=false;T.onload=T.onreadystatechange=function(){if(!O&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){O=true;I();L();T.onload=T.onreadystatechange=null;H.removeChild(T)}}}H.appendChild(T);return g}var K=false;var J=M.xhr();if(M.username){J.open(G,M.url,M.async,M.username,M.password)}else{J.open(G,M.url,M.async)}try{if(M.data){J.setRequestHeader("Content-Type",M.contentType)}if(M.ifModified){J.setRequestHeader("If-Modified-Since",o.lastModified[M.url]||"Thu, 01 Jan 1970 00:00:00 GMT")}J.setRequestHeader("X-Requested-With","XMLHttpRequest");J.setRequestHeader("Accept",M.dataType&&M.accepts[M.dataType]?M.accepts[M.dataType]+", */*":M.accepts._default)}catch(S){}if(M.beforeSend&&M.beforeSend(J,M)===false){if(M.global&&!--o.active){o.event.trigger("ajaxStop")}J.abort();return false}if(M.global){o.event.trigger("ajaxSend",[J,M])}var N=function(X){if(J.readyState==0){if(P){clearInterval(P);P=null;if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}}else{if(!K&&J&&(J.readyState==4||X=="timeout")){K=true;if(P){clearInterval(P);P=null}R=X=="timeout"?"timeout":!o.httpSuccess(J)?"error":M.ifModified&&o.httpNotModified(J,M.url)?"notmodified":"success";if(R=="success"){try{V=o.httpData(J,M.dataType,M)}catch(Z){R="parsererror"}}if(R=="success"){var Y;try{Y=J.getResponseHeader("Last-Modified")}catch(Z){}if(M.ifModified&&Y){o.lastModified[M.url]=Y}if(!W){I()}}else{o.handleError(M,J,R)}L();if(X){J.abort()}if(M.async){J=null}}}};if(M.async){var P=setInterval(N,13);if(M.timeout>0){setTimeout(function(){if(J&&!K){N("timeout")}},M.timeout)}}try{J.send(M.data)}catch(S){o.handleError(M,J,null,S)}if(!M.async){N()}function I(){if(M.success){M.success(V,R)}if(M.global){o.event.trigger("ajaxSuccess",[J,M])}}function L(){if(M.complete){M.complete(J,R)}if(M.global){o.event.trigger("ajaxComplete",[J,M])}if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}return J},handleError:function(F,H,E,G){if(F.error){F.error(H,E,G)}if(F.global){o.event.trigger("ajaxError",[H,F,G])}},active:0,httpSuccess:function(F){try{return !F.status&&location.protocol=="file:"||(F.status>=200&&F.status<300)||F.status==304||F.status==1223}catch(E){}return false},httpNotModified:function(G,E){try{var H=G.getResponseHeader("Last-Modified");return G.status==304||H==o.lastModified[E]}catch(F){}return false},httpData:function(J,H,G){var F=J.getResponseHeader("content-type"),E=H=="xml"||!H&&F&&F.indexOf("xml")>=0,I=E?J.responseXML:J.responseText;if(E&&I.documentElement.tagName=="parsererror"){throw"parsererror"}if(G&&G.dataFilter){I=G.dataFilter(I,H)}if(typeof I==="string"){if(H=="script"){o.globalEval(I)}if(H=="json"){I=l["eval"]("("+I+")")}}return I},param:function(E){var G=[];function H(I,J){G[G.length]=encodeURIComponent(I)+"="+encodeURIComponent(J)}if(o.isArray(E)||E.jquery){o.each(E,function(){H(this.name,this.value)})}else{for(var F in E){if(o.isArray(E[F])){o.each(E[F],function(){H(F,this)})}else{H(F,o.isFunction(E[F])?E[F]():E[F])}}}return G.join("&").replace(/%20/g,"+")}});var m={},n,d=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];function t(F,E){var G={};o.each(d.concat.apply([],d.slice(0,E)),function(){G[this]=F});return G}o.fn.extend({show:function(J,L){if(J){return this.animate(t("show",3),J,L)}else{for(var H=0,F=this.length;H<F;H++){var E=o.data(this[H],"olddisplay");this[H].style.display=E||"";if(o.css(this[H],"display")==="none"){var G=this[H].tagName,K;if(m[G]){K=m[G]}else{var I=o("<"+G+" />").appendTo("body");K=I.css("display");if(K==="none"){K="block"}I.remove();m[G]=K}o.data(this[H],"olddisplay",K)}}for(var H=0,F=this.length;H<F;H++){this[H].style.display=o.data(this[H],"olddisplay")||""}return this}},hide:function(H,I){if(H){return this.animate(t("hide",3),H,I)}else{for(var G=0,F=this.length;G<F;G++){var E=o.data(this[G],"olddisplay");if(!E&&E!=="none"){o.data(this[G],"olddisplay",o.css(this[G],"display"))}}for(var G=0,F=this.length;G<F;G++){this[G].style.display="none"}return this}},_toggle:o.fn.toggle,toggle:function(G,F){var E=typeof G==="boolean";return o.isFunction(G)&&o.isFunction(F)?this._toggle.apply(this,arguments):G==null||E?this.each(function(){var H=E?G:o(this).is(":hidden");o(this)[H?"show":"hide"]()}):this.animate(t("toggle",3),G,F)},fadeTo:function(E,G,F){return this.animate({opacity:G},E,F)},animate:function(I,F,H,G){var E=o.speed(F,H,G);return this[E.queue===false?"each":"queue"](function(){var K=o.extend({},E),M,L=this.nodeType==1&&o(this).is(":hidden"),J=this;for(M in I){if(I[M]=="hide"&&L||I[M]=="show"&&!L){return K.complete.call(this)}if((M=="height"||M=="width")&&this.style){K.display=o.css(this,"display");K.overflow=this.style.overflow}}if(K.overflow!=null){this.style.overflow="hidden"}K.curAnim=o.extend({},I);o.each(I,function(O,S){var R=new o.fx(J,K,O);if(/toggle|show|hide/.test(S)){R[S=="toggle"?L?"show":"hide":S](I)}else{var Q=S.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),T=R.cur(true)||0;if(Q){var N=parseFloat(Q[2]),P=Q[3]||"px";if(P!="px"){J.style[O]=(N||1)+P;T=((N||1)/R.cur(true))*T;J.style[O]=T+P}if(Q[1]){N=((Q[1]=="-="?-1:1)*N)+T}R.custom(T,N,P)}else{R.custom(T,S,"")}}});return true})},stop:function(F,E){var G=o.timers;if(F){this.queue([])}this.each(function(){for(var H=G.length-1;H>=0;H--){if(G[H].elem==this){if(E){G[H](true)}G.splice(H,1)}}});if(!E){this.dequeue()}return this}});o.each({slideDown:t("show",1),slideUp:t("hide",1),slideToggle:t("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(E,F){o.fn[E]=function(G,H){return this.animate(F,G,H)}});o.extend({speed:function(G,H,F){var E=typeof G==="object"?G:{complete:F||!F&&H||o.isFunction(G)&&G,duration:G,easing:F&&H||H&&!o.isFunction(H)&&H};E.duration=o.fx.off?0:typeof E.duration==="number"?E.duration:o.fx.speeds[E.duration]||o.fx.speeds._default;E.old=E.complete;E.complete=function(){if(E.queue!==false){o(this).dequeue()}if(o.isFunction(E.old)){E.old.call(this)}};return E},easing:{linear:function(G,H,E,F){return E+F*G},swing:function(G,H,E,F){return((-Math.cos(G*Math.PI)/2)+0.5)*F+E}},timers:[],fx:function(F,E,G){this.options=E;this.elem=F;this.prop=G;if(!E.orig){E.orig={}}}});o.fx.prototype={update:function(){if(this.options.step){this.options.step.call(this.elem,this.now,this)}(o.fx.step[this.prop]||o.fx.step._default)(this);if((this.prop=="height"||this.prop=="width")&&this.elem.style){this.elem.style.display="block"}},cur:function(F){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null)){return this.elem[this.prop]}var E=parseFloat(o.css(this.elem,this.prop,F));return E&&E>-10000?E:parseFloat(o.curCSS(this.elem,this.prop))||0},custom:function(I,H,G){this.startTime=e();this.start=I;this.end=H;this.unit=G||this.unit||"px";this.now=this.start;this.pos=this.state=0;var E=this;function F(J){return E.step(J)}F.elem=this.elem;if(F()&&o.timers.push(F)&&!n){n=setInterval(function(){var K=o.timers;for(var J=0;J<K.length;J++){if(!K[J]()){K.splice(J--,1)}}if(!K.length){clearInterval(n);n=g}},13)}},show:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.show=true;this.custom(this.prop=="width"||this.prop=="height"?1:0,this.cur());o(this.elem).show()},hide:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(H){var G=e();if(H||G>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;var E=true;for(var F in this.options.curAnim){if(this.options.curAnim[F]!==true){E=false}}if(E){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;this.elem.style.display=this.options.display;if(o.css(this.elem,"display")=="none"){this.elem.style.display="block"}}if(this.options.hide){o(this.elem).hide()}if(this.options.hide||this.options.show){for(var I in this.options.curAnim){o.attr(this.elem.style,I,this.options.orig[I])}}this.options.complete.call(this.elem)}return false}else{var J=G-this.startTime;this.state=J/this.options.duration;this.pos=o.easing[this.options.easing||(o.easing.swing?"swing":"linear")](this.state,J,0,1,this.options.duration);this.now=this.start+((this.end-this.start)*this.pos);this.update()}return true}};o.extend(o.fx,{speeds:{slow:600,fast:200,_default:400},step:{opacity:function(E){o.attr(E.elem.style,"opacity",E.now)},_default:function(E){if(E.elem.style&&E.elem.style[E.prop]!=null){E.elem.style[E.prop]=E.now+E.unit}else{E.elem[E.prop]=E.now}}}});if(document.documentElement.getBoundingClientRect){o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}var G=this[0].getBoundingClientRect(),J=this[0].ownerDocument,F=J.body,E=J.documentElement,L=E.clientTop||F.clientTop||0,K=E.clientLeft||F.clientLeft||0,I=G.top+(self.pageYOffset||o.boxModel&&E.scrollTop||F.scrollTop)-L,H=G.left+(self.pageXOffset||o.boxModel&&E.scrollLeft||F.scrollLeft)-K;return{top:I,left:H}}}else{o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}o.offset.initialized||o.offset.initialize();var J=this[0],G=J.offsetParent,F=J,O=J.ownerDocument,M,H=O.documentElement,K=O.body,L=O.defaultView,E=L.getComputedStyle(J,null),N=J.offsetTop,I=J.offsetLeft;while((J=J.parentNode)&&J!==K&&J!==H){M=L.getComputedStyle(J,null);N-=J.scrollTop,I-=J.scrollLeft;if(J===G){N+=J.offsetTop,I+=J.offsetLeft;if(o.offset.doesNotAddBorder&&!(o.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(J.tagName))){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}F=G,G=J.offsetParent}if(o.offset.subtractsBorderForOverflowNotVisible&&M.overflow!=="visible"){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}E=M}if(E.position==="relative"||E.position==="static"){N+=K.offsetTop,I+=K.offsetLeft}if(E.position==="fixed"){N+=Math.max(H.scrollTop,K.scrollTop),I+=Math.max(H.scrollLeft,K.scrollLeft)}return{top:N,left:I}}}o.offset={initialize:function(){if(this.initialized){return}var L=document.body,F=document.createElement("div"),H,G,N,I,M,E,J=L.style.marginTop,K='<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';M={position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"};for(E in M){F.style[E]=M[E]}F.innerHTML=K;L.insertBefore(F,L.firstChild);H=F.firstChild,G=H.firstChild,I=H.nextSibling.firstChild.firstChild;this.doesNotAddBorder=(G.offsetTop!==5);this.doesAddBorderForTableAndCells=(I.offsetTop===5);H.style.overflow="hidden",H.style.position="relative";this.subtractsBorderForOverflowNotVisible=(G.offsetTop===-5);L.style.marginTop="1px";this.doesNotIncludeMarginInBodyOffset=(L.offsetTop===0);L.style.marginTop=J;L.removeChild(F);this.initialized=true},bodyOffset:function(E){o.offset.initialized||o.offset.initialize();var G=E.offsetTop,F=E.offsetLeft;if(o.offset.doesNotIncludeMarginInBodyOffset){G+=parseInt(o.curCSS(E,"marginTop",true),10)||0,F+=parseInt(o.curCSS(E,"marginLeft",true),10)||0}return{top:G,left:F}}};o.fn.extend({position:function(){var I=0,H=0,F;if(this[0]){var G=this.offsetParent(),J=this.offset(),E=/^body|html$/i.test(G[0].tagName)?{top:0,left:0}:G.offset();J.top-=j(this,"marginTop");J.left-=j(this,"marginLeft");E.top+=j(G,"borderTopWidth");E.left+=j(G,"borderLeftWidth");F={top:J.top-E.top,left:J.left-E.left}}return F},offsetParent:function(){var E=this[0].offsetParent||document.body;while(E&&(!/^body|html$/i.test(E.tagName)&&o.css(E,"position")=="static")){E=E.offsetParent}return o(E)}});o.each(["Left","Top"],function(F,E){var G="scroll"+E;o.fn[G]=function(H){if(!this[0]){return null}return H!==g?this.each(function(){this==l||this==document?l.scrollTo(!F?H:o(l).scrollLeft(),F?H:o(l).scrollTop()):this[G]=H}):this[0]==l||this[0]==document?self[F?"pageYOffset":"pageXOffset"]||o.boxModel&&document.documentElement[G]||document.body[G]:this[0][G]}});o.each(["Height","Width"],function(I,G){var E=I?"Left":"Top",H=I?"Right":"Bottom",F=G.toLowerCase();o.fn["inner"+G]=function(){return this[0]?o.css(this[0],F,false,"padding"):null};o.fn["outer"+G]=function(K){return this[0]?o.css(this[0],F,false,K?"margin":"border"):null};var J=G.toLowerCase();o.fn[J]=function(K){return this[0]==l?document.compatMode=="CSS1Compat"&&document.documentElement["client"+G]||document.body["client"+G]:this[0]==document?Math.max(document.documentElement["client"+G],document.body["scroll"+G],document.documentElement["scroll"+G],document.body["offset"+G],document.documentElement["offset"+G]):K===g?(this.length?o.css(this[0],J):null):this.css(J,typeof K==="string"?K:K+"px")}})})();

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ubiquity.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Atul Varma <atul@mozilla.com>
 *   Blair McBride <unfocused@gmail.com>
 *   Jono DiCarlo <jdicarlo@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// = Utils =
//
// This is a small library of all-purpose, general utility functions
// for use by chrome code.  Everything clients need is contained within
// the {{{Utils}}} namespace.

var EXPORTED_SYMBOLS = ["Utils"];

const Cc = Components.classes;
const Ci = Components.interfaces;

var Utils = {};

// Keep a reference to the global object, as certain utility functions
// need it.
Utils.__globalObject = this;

// ** {{{ Utils.reportWarning() }}} **
//
// This function can be used to report a warning to the JS Error Console,
// which can be displayed in Firefox by choosing "Error Console" from
// the "Tools" menu.
//
// {{{aMessage}}} is a plaintext string corresponding to the warning
// to provide.
//
// {{{stackFrameNumber}}} is an optional number specifying how many
// frames back in the call stack the warning message should be
// associated with. Its default value is 0, meaning that the line
// number of the caller is shown in the JS Error Console.  If it's 1,
// then the line number of the caller's caller is shown.

Utils.reportWarning = function reportWarning(aMessage, stackFrameNumber) {
  var stackFrame = Components.stack.caller;

  if (typeof(stackFrameNumber) != "number")
    stackFrameNumber = 0;

  for (var i = 0; i < stackFrameNumber; i++)
    stackFrame = stackFrame.caller;

  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
  var scriptError = Components.classes["@mozilla.org/scripterror;1"]
                    .createInstance(Components.interfaces.nsIScriptError);
  var aSourceName = stackFrame.filename;
  var aSourceLine = stackFrame.sourceLine;
  var aLineNumber = stackFrame.lineNumber;
  var aColumnNumber = null;
  var aFlags = scriptError.warningFlag;
  var aCategory = "ubiquity javascript";
  scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber,
                   aColumnNumber, aFlags, aCategory);
  consoleService.logMessage(scriptError);
};

// ** {{{ Utils.reportInfo() }}} **
//
// Reports a purely informational message to the JS Error Console.
// Source code links aren't provided for informational messages, so
// unlike {{{Utils.reportWarning()}}}, a stack frame can't be passed
// in to this function.

Utils.reportInfo = function reportInfo(aMessage) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
  var aCategory = "ubiquity javascript: ";
  consoleService.logStringMessage(aCategory + aMessage);
};

// ** {{{ Utils.encodeJson() }}} **
//
// This function serializes the given object using JavaScript Object
// Notation (JSON).

Utils.encodeJson = function encodeJson(object) {
  var json = Cc["@mozilla.org/dom/json;1"]
             .createInstance(Ci.nsIJSON);
  return json.encode(object);
};

// ** {{{ Utils.decodeJson() }}} **
//
// This function unserializes the given string in JavaScript Object
// Notation (JSON) format and returns the result.

Utils.decodeJson = function decodeJson(string) {
  var json = Cc["@mozilla.org/dom/json;1"]
             .createInstance(Ci.nsIJSON);
  return json.decode(string);
};

// ** {{{Utils.ellipsify()}}} **
//
// Given a DOM node and a maximum number of characters, returns a
// new DOM node that has the same contents truncated to that number of
// characters. If any truncation was performed, an ellipsis is placed
// at the end of the content.

Utils.ellipsify = function ellipsify(node, chars) {
  var doc = node.ownerDocument;
  var copy = node.cloneNode(false);
  if (node.hasChildNodes()) {
    var children = node.childNodes;
    for (var i = 0; i < children.length && chars > 0; i++) {
      var childNode = children[i];
      var childCopy;
      if (childNode.nodeType == childNode.TEXT_NODE) {
        var value = childNode.nodeValue;
        if (value.length >= chars) {
          childCopy = doc.createTextNode(value.slice(0, chars) + "\u2026");
          chars = 0;
        } else {
          childCopy = childNode.cloneNode(false);
          chars -= value.length;
        }
      } else if (childNode.nodeType == childNode.ELEMENT_NODE) {
        childCopy = ellipsify(childNode, chars);
        chars -= childCopy.textContent.length;
      }
      copy.appendChild(childCopy);
    }
  }
  return copy;
}

// ** {{{ Utils.setTimeout() }}} **
//
// This function works just like the {{{window.setTimeout()}}} method
// in content space, but it can only accept a function (not a string)
// as the callback argument.
//
// {{{callback}}} is the callback function to call when the given
// delay period expires.  It will be called only once (not at a regular
// interval).
//
// {{{delay}}} is the delay, in milliseconds, after which the callback
// will be called once.
//
// This function returns a timer ID, which can later be given to
// {{{Utils.clearTimeout()}}} if the client decides that it wants to
// cancel the callback from being triggered.

// TODO: Allow strings for the first argument like DOM setTimeout() does.

Utils.setTimeout = function setTimeout(callback, delay) {
  var classObj = Cc["@mozilla.org/timer;1"];
  var timer = classObj.createInstance(Ci.nsITimer);
  var timerID = Utils.__timerData.nextID;
  // emulate window.setTimeout() by incrementing next ID by random amount
  Utils.__timerData.nextID += Math.floor(Math.random() * 100) + 1;
  Utils.__timerData.timers[timerID] = timer;

  timer.initWithCallback(new Utils.__TimerCallback(callback),
                         delay,
                         classObj.TYPE_ONE_SHOT);
  return timerID;
};

// ** {{{ Utils.clearTimeout() }}} **
//
// This function behaves like the {{{window.clearTimeout()}}} function
// in content space, and cancels the callback with the given timer ID
// from ever being called.

Utils.clearTimeout = function clearTimeout(timerID) {
  if(!(timerID in Utils.__timerData.timers))
    return;

  var timer = Utils.__timerData.timers[timerID];
  timer.cancel();
  delete Utils.__timerData.timers[timerID];
};

// Support infrastructure for the timeout-related functions.

Utils.__TimerCallback = function __TimerCallback(callback) {
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  this._callback = callback;
  this.QueryInterface = XPCOMUtils.generateQI([Ci.nsITimerCallback]);
};

Utils.__TimerCallback.prototype = {
  notify : function notify(timer) {
    for(timerID in Utils.__timerData.timers) {
      if(Utils.__timerData.timers[timerID] == timer) {
        delete Utils.__timerData.timers[timerID];
        break;
      }
    }
    this._callback();
  }
};

Utils.__timerData = {
  nextID: Math.floor(Math.random() * 100) + 1,
  timers: {}
};

// ** {{{ Utils.url() }}} **
//
// Given a string representing an absolute URL or a {{{nsIURI}}}
// object, returns an equivalent {{{nsIURI}}} object.  Alternatively,
// an object with keyword arguments as keys can also be passed in; the
// following arguments are supported:
//
// * {{{uri}}} is a string or {{{nsIURI}}} representing an absolute or
//   relative URL.
//
// * {{{base}}} is a string or {{{nsIURI}}} representing an absolute
//   URL, which is used as the base URL for the {{{uri}}} keyword
//   argument.
//
// An optional second argument may also be passed in, which specifies
// a default URL to return if the given URL can't be parsed.

Utils.url = function url(spec, defaultUri) {
  var base = null;
  if (typeof(spec) == "object") {
    if (spec instanceof Ci.nsIURI)
      // nsIURL object was passed in, so just return it back
      return spec;

    // Assume jQuery-style dictionary with keyword args was passed in.
    base = spec.base ? Utils.url(spec.base, defaultUri) : null;
    spec = spec.uri ? spec.uri : null;
  }

  var ios = Cc["@mozilla.org/network/io-service;1"]
    .getService(Ci.nsIIOService);

  try {
    return ios.newURI(spec, null, base);
  } catch (e if (e.result == Components.results.NS_ERROR_MALFORMED_URI) &&
           defaultUri) {
    return Utils.url(defaultUri);
  }
};

// ** {{{ Utils.openUrlInBrowser() }}} **
//
// This function opens the given URL in the user's browser, using
// their current preferences for how new URLs should be opened (e.g.,
// in a new window vs. a new tab, etc).
//
// {{{urlString}}} is a string corresponding to the URL to be
// opened.
//
// {{{postData}}} is an optional argument that allows HTTP POST data
// to be sent to the newly-opened page.  It may be a string, an Object
// with keys and values corresponding to their POST analogues, or an
// {{{nsIInputStream}}}.

Utils.openUrlInBrowser = function openUrlInBrowser(urlString, postData) {
  var postInputStream = null;
  if(postData) {
    if(postData instanceof Ci.nsIInputStream) {
      postInputStream = postData;
    } else {
      if(typeof postData == "object") // json -> string
        postData = Utils.paramsToString(postData);

      var stringStream = Cc["@mozilla.org/io/string-input-stream;1"]
        .createInstance(Ci.nsIStringInputStream);
      stringStream.data = postData;

      postInputStream = Cc["@mozilla.org/network/mime-input-stream;1"]
        .createInstance(Ci.nsIMIMEInputStream);
      postInputStream.addHeader("Content-Type",
                                "application/x-www-form-urlencoded");
      postInputStream.addContentLength = true;
      postInputStream.setData(stringStream);
    }
  }

  var browserWindow = Utils.currentChromeWindow;
  var browser = browserWindow.getBrowser();

  var prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefBranch);
  var openPref = prefService.getIntPref("browser.link.open_newwindow");

  //2 (default in SeaMonkey and Firefox 1.5): In a new window
  //3 (default in Firefox 2 and above): In a new tab
  //1 (or anything else): In the current tab or window

  if(browser.mCurrentBrowser.currentURI.spec == "about:blank" &&
     !browser.webProgress.isLoadingDocument )
    browserWindow.loadURI(urlString, null, postInputStream, false);
  else if(openPref == 3)
    browser.loadOneTab(urlString, null, null, postInputStream, false, false);
  else if(openPref == 2)
    browserWindow.openDialog('chrome://browser/content', '_blank',
                             'all,dialog=no', urlString, null, null,
                             postInputStream);
  else
    browserWindow.loadURI(urlString, null, postInputStream, false);
};

// ** {{{ Utils.focusUrlInBrowser() }}} **
//
// This function focuses a tab with the given URL if one exists in the
// current window; otherwise, it delegates the opening of the URL in a
// new window or tab to {{{Utils.openUrlInBrowser()}}}.

Utils.focusUrlInBrowser = function focusUrlInBrowser(urlString) {
  let Application = Components.classes["@mozilla.org/fuel/application;1"]
                    .getService(Components.interfaces.fuelIApplication);

  var tabs = Application.activeWindow.tabs;
  for (var i = 0; i < tabs.length; i++)
    if (tabs[i].uri.spec == urlString) {
      tabs[i].focus();
      return;
    }
  Utils.openUrlInBrowser(urlString);
};

// ** {{{ Utils.getCookie() }}} **
//
// This function returns the cookie for the given domain and with the
// given name.  If no matching cookie exists, {{{null}}} is returned.

Utils.getCookie = function getCookie(domain, name) {
  var cookieManager = Cc["@mozilla.org/cookiemanager;1"].
                      getService(Ci.nsICookieManager);

  var iter = cookieManager.enumerator;
  while (iter.hasMoreElements()) {
    var cookie = iter.getNext();
    if (cookie instanceof Ci.nsICookie)
      if (cookie.host == domain && cookie.name == name )
        return cookie.value;
  }
  // if no matching cookie:
  return null;
};

// ** {{{ Utils.paramsToString() }}} **
//
// This function takes the given Object containing keys and
// values into a querystring suitable for inclusion in an HTTP
// GET or POST request.

Utils.paramsToString = function paramsToString(params) {
  var stringPairs = [];
  function valueTypeIsOk(val) {
    if (typeof val == "function")
      return false;
    if (val === undefined)
      return false;
    if (val === null)
      return false;
    return true;
  }
  function addPair(key, value) {
    if (valueTypeIsOk(value)) {
      stringPairs.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(value.toString())
      );
    }
  }
  for (key in params) {
    // note: explicitly ignoring values that are objects/functions/undefined!
    if (Utils.isArray(params[key])) {
      params[key].forEach(function(item) {
        addPair(key + "[]", item);
      });
    } else {
      addPair(key, params[key]);
    };
  }
  return "?" + stringPairs.join("&");
};

// ** {{{ Utils.urlToParams() }}} **
//
// This function takes the given url and returns an Object containing keys and
// values retrieved from its query-part

Utils.urlToParams = function urlToParams(url) {
  function isArray(key) {
    return (key.substring(key.length-2)=="[]");
  }
  var params = {};
  var paramList = url.substring(url.indexOf("?")+1).split("&");
  for (param in paramList) {
    var key="",
        value="";
    var kv = paramList[param].split("=");
    try {
      key = kv[0];
      value = decodeURIComponent(kv[1]).replace(/\+/g," ");
    }
    catch (e){};
    if (isArray(key)) {
      key = key.substring(0,key.length-2);
      if (params[key]) {
        params[key].push(value);
      }
      else {
        params[key]=[value];
      }
    }
    else {
      params[key] = value;
    }
  }
  return params;
}

// ** {{{ Utils.getLocalUrl() }}} **
//
// This function synchronously retrieves the content of the given
// local URL, such as a {{{file:}}} or {{{chrome:}}} URL, and returns
// it.

Utils.getLocalUrl = function getLocalUrl(url) {
  var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
            .createInstance(Ci.nsIXMLHttpRequest);
  req.open('GET', url, false);
  req.overrideMimeType("text/plain");
  req.send(null);
  if (req.status == 0)
    return req.responseText;
  else
    throw new Error("Failed to get " + url);
};

// ** {{{ Utils.trim() }}} **
//
// This function removes all whitespace surrounding a string and
// returns the result.

Utils.trim = function trim(str) {
  return str.replace(/^\s+|\s+$/g,"");
};

// ** {{{ Utils.isArray() }}} **
//
// This function returns whether or not its parameter is an instance
// of a JavaScript Array object.

Utils.isArray = function isArray(val) {
  if (typeof val != "object")
    return false;
  if (val == null)
    return false;
  if (!val.constructor || val.constructor.name != "Array")
    return false;
  return true;
}

// == {{{ Utils.History }}} ==
//
// This object contains functions that make it easy to access
// information about the user's browsing history.

Utils.History = {

  // ** {{{ Utils.History.visitsToDomain() }}} **
  //
  // This function returns the number of times the user has visited
  // the given domain name.

  visitsToDomain : function visitsToDomain( domain ) {

      var hs = Cc["@mozilla.org/browser/nav-history-service;1"].
               getService(Ci.nsINavHistoryService);

      var query = hs.getNewQuery();
      var options = hs.getNewQueryOptions();

      options.maxResults = 10;
      query.domain = domain;

      // execute query
      var result = hs.executeQuery(query, options );
      var root = result.root;
      root.containerOpen = true;
      var count = 0;
      for( var i=0; i < root.childCount; ++i ) {
        place = root.getChild( i );
        count += place.accessCount;
      }
    return count;
  }
};

// ** {{{ Utils.computeCryptoHash() }}} **
//
// Computes and returns a cryptographic hash for a string given an
// algorithm.
//
// {{{algo}}} is a string corresponding to a valid hash algorithm.  It
// can be any one of {{{MD2}}}, {{{MD5}}}, {{{SHA1}}}, {{{SHA256}}},
// {{{SHA384}}}, or {{{SHA512}}}.
//
// {{{str}}} is the string to be hashed.

Utils.computeCryptoHash = function computeCryptoHash(algo, str) {
  var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .createInstance(Ci.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8";
  var result = {};
  var data = converter.convertToByteArray(str, result);
  var crypto = Cc["@mozilla.org/security/hash;1"]
               .createInstance(Ci.nsICryptoHash);
  crypto.initWithString(algo);
  crypto.update(data, data.length);
  var hash = crypto.finish(false);

  function toHexString(charCode) {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  var hashString = [toHexString(hash.charCodeAt(i))
                    for (i in hash)].join("");
  return hashString;
};

// ** {{{ Utils.escapeHtml() }}} **
//
// This function returns a version of the string safe for
// insertion into HTML. Useful when you just want to
// concatenate a bunch of strings into an HTML fragment
// and ensure that everything's escaped properly.

Utils.escapeHtml = function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
};


// ** {{{ Utils.convertFromUnicode() }}} **
//
// Encodes the given unicode text to a given character set and
// returns the result.
//
// {{{toCharset}}} is a string corresponding to the character set
// to encode to.
//
// {{{text}}} is a unicode string.

Utils.convertFromUnicode = function convertFromUnicode(toCharset, text) {
  var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .getService(Ci.nsIScriptableUnicodeConverter);
  converter.charset = toCharset;
  return converter.ConvertFromUnicode(text);
};

// ** {{{ Utils.convertToUnicode() }}} **
//
// Decodes the given text from a character set to unicode and returns
// the result.
//
// {{{fromCharset}}} is a string corresponding to the character set to
// decode from.
//
// {{{text}}} is a string encoded in the character set
// {{{fromCharset}}}.

Utils.convertToUnicode = function convertToUnicode(fromCharset, text) {
  var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .getService(Ci.nsIScriptableUnicodeConverter);
  converter.charset = fromCharset;
  return converter.ConvertToUnicode(text);
};

// == {{{ Utils.tabs }}} ==
//
// This Object contains functions related to Firefox tabs.

Utils.tabs = {

  // ** {{{ Utils.tabs.get() }}} **
  //
  // Gets open tabs.
  //
  // {{{aName}}} is an optional string tab name.  If supplied, this
  // function will return the named tab or null.
  //
  // This function returns a a hash of tab names to tab references; or,
  // if a name parameter is passed, it returns the matching tab
  // reference or null.

  get: function Utils_tabs_get(aName) {
    if (aName)
      return this._cache[aName] || null;

    return this._cache;
  },

  // ** {{{ Utils.tabs.search() }}} **
  //
  // This function searches for tabs by tab name and returns a hash of
  // tab names to tab references.
  //
  // {{{aSearchText}}} is a string specifying the text to search for.
  //
  // {{{aMaxResults}}} is an integer specifying the maximum number of
  // results to return.

  search: function Utils_tabs_search(aSearchText, aMaxResults) {
    var matches = {};
    var matchCount = 0;
    for (var name in this._cache) {
       var tab = this._cache[name];
      //TODO: implement a better match algorithm
      if (name.match(aSearchText, "i") ||
          (tab.document.URL && tab.document.URL.toString().match(aSearchText, "i"))) {
        matches[name] = tab;
        matchCount++;
      }
      if (aMaxResults && aMaxResults == matchCount)
        break;
    }
    return matches;
  },

  // Handles TabOpen, TabClose and load events; clears tab cache.

  onTabEvent: function(aEvent, aTab) {
    switch ( aEvent.type ) {
      case "TabOpen":
        // this is received before the page content has loaded.
        // so need to find the new tab, and add a load
        // listener to it, and only then add it to the cache.
        // TODO: once bug 470163 is fixed, can move to a much
        // cleaner way of doing this.
        var self = this;
        var windowCount = this.Application.windows.length;
        for( var i=0; i < windowCount; i++ ) {
          var window = this.Application.windows[i];
          var tabCount = window.tabs.length;
          for (var j = 0; j < tabCount; j++) {
            let tab = window.tabs[j];
            if (!this._cache[tab.document.title]) {
              // add a load listener to the tab
              // and add the tab to the cache after it has loaded.
              tab.events.addListener("load", function(aEvent) {
                self.onTabEvent(aEvent, tab);
              });
            }
          }
        }
        break;
      case "TabClose":
        // for TabClose events, invalidate the cache.
        // TODO: once bug 470163 is fixed, can just delete the tab from
        // from the cache, instead of invalidating the entire thing.
        this.__cache = null;
        break;
      case "load":
        // handle new tab page loads, and reloads of existing tabs
        if (aTab && aTab.document.title) {

          // if a tab with this title is not cached, add it
          if (!this._cache[aTab.document.title])
            this._cache[aTab.document.title] = aTab;

          // evict previous cache entries for the tab
          for (var title in this._cache) {
            if (this._cache[title] == aTab && title != aTab.document.title) {
              // if the cache contains an entry for this tab, and the title
              // differs from the tab's current title, then evict the entry.
              delete this._cache[title];
              break;
            }
          }
        }
        break;
    }
  },

  // Smart-getter for FUEL.

  get Application() {
    delete this.Application;
    return this.Application = Cc["@mozilla.org/fuel/application;1"]
                              .getService(Ci.fuelIApplication);
  },

   // Getter for the tab cache; manages reloading the cache.

  __cache: null,
  get _cache() {
    if (this.__cache)
      return this.__cache;

    this.__cache = {};
    var windowCount = this.Application.windows.length;
    for( var j=0; j < windowCount; j++ ) {

      var win = this.Application.windows[j];
      win.events.addListener(
        "TabOpen",
        function(aEvent) { self.onTabEvent(aEvent); }
      );
      win.events.addListener(
        "TabClose",
        function(aEvent) { self.onTabEvent(aEvent); }
      );

      var tabCount = win.tabs.length;
      for (var i = 0; i < tabCount; i++) {

        let tab = win.tabs[i];

        // add load listener to tab
        var self = this;
        tab.events.addListener("load", function(aEvent) {
          self.onTabEvent(aEvent, tab);
        });

        // add tab to cache
        this.__cache[tab.document.title] = tab;
      }
    }

    return this.__cache;
  }
};

function AutoCompleteInput(aSearches) {
    this.searches = aSearches;
}

AutoCompleteInput.prototype = {
    constructor: AutoCompleteInput,

    searches: null,

    minResultsForPopup: 0,
    timeout: 10,
    searchParam: "",
    textValue: "",
    disableAutoComplete: false,
    completeDefaultIndex: false,

    get searchCount() {
        return this.searches.length;
    },

    getSearchAt: function(aIndex) {
        return this.searches[aIndex];
    },

    onSearchBegin: function() {},
    onSearchComplete: function() {},

    popupOpen: false,

    popup: {
        setSelectedIndex: function(aIndex) {},
        invalidate: function() {},

        // nsISupports implementation
        QueryInterface: function(iid) {
            if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIAutoCompletePopup)) return this;

            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    },

    // nsISupports implementation
    QueryInterface: function(iid) {
        if (iid.equals(Ci.nsISupports) || iid.equals(Ci.nsIAutoCompleteInput)) return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
};

Utils.history = {

     __createController : function createController(onSearchComplete){
          var controller = Components.classes["@mozilla.org/autocomplete/controller;1"].getService(Components.interfaces.nsIAutoCompleteController);

          var input = new AutoCompleteInput(["history"]);
          input.onSearchComplete = function(){
             onSearchComplete(controller);
          };
          controller.input = input;
          return controller;
     },

     search : function searchHistory(query, maxResults, callback){

        var ctrlr = this.__createController(function(controller){
           for (var i = 0; i < controller.matchCount; i++) {
              var url = controller.getValueAt(i);
              var title = controller.getCommentAt(i);
              if (title.length == 0) { title = url; }
              var favicon = controller.getImageAt(i);

              callback({url : url, title : title, favicon : favicon })
           }
        });

        ctrlr.startSearch(query);
     }
};

// ** {{{ Utils.appName }}} **
//
// This property provides the chrome application name found in nsIXULAppInfo.name.
// Examples values are "Firefox", "Songbird", "Thunderbird".
//
// TODO: cache the value since it won't change for the life of the application.

Utils.__defineGetter__("appName", function() {
  return Cc["@mozilla.org/xre/app-info;1"].
         getService(Ci.nsIXULAppInfo).
         name;
});

// ** {{{ Utils.appWindowType }}} **
//
// This property provides the name of "main" application windows for the chrome
// application.
// Examples values are "navigator:browser" for Firefox", and
// "Songbird:Main" for Songbird.

Utils.__defineGetter__("appWindowType", function() {
  switch(Utils.appName) {
    case "Songbird":
      return "Songbird:Main";
    default:
      return "navigator:browser";
  }
});

// ** {{{ Utils.currentChromeWindow }}} **
//
// This property is a reference to the application chrome window
// that currently has focus.

Utils.__defineGetter__("currentChromeWindow", function() {
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator);
  return wm.getMostRecentWindow(Utils.appWindowType);
});
