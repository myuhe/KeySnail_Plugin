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
    <version>0.0.1</version>
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
F.prototype = CmdUtils.NounType.prototype;
RtmNounType.prototype = new F();
RtmNounType.prototype._init = function(name, expectedWords, defaultWord) {
	this._name = name;
	this._wordList = expectedWords;
	if(typeof defaultWord == "string") {
		this.default = function() {
		return CmdUtils.makeSugg(defaultWord);
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
            suggestions.push(CmdUtils.makeSugg(word, word, x));
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
		FROB: "Rtm.Ubiquity.FROB",
	},
	pref: {
		TIMEZONE: "Rtm.Ubiquity.TIMEZONE",
		TIMELINE: "Rtm.Ubiquity.TIMELINE",
		AUTH_TOKEN: "Rtm.Ubiquity.AUTH_TOKEN",
		USER_NAME: "Rtm.Ubiquity.USER_NAME",
		USER_ID: "Rtm.Ubiquity.USER_ID",
		DEFAULT_LIST: "Rtm.Ubiquity.DEFAULT_LIST",
		TIME_FORMAT: "Rtm.Ubiquity.TIME_FORMAT",
		DATE_FORMAT: "Rtm.Ubiquity.DATE_FORMAT",
	},
	url:{
		API_URL: "http://api.rememberthemilk.com/services/rest/",
		AUTH_URL: "http://api.rememberthemilk.com/services/auth/",
		ROOT_URL: "http://www.rememberthemilk.com/",
		ICON_URL: "http://www.rememberthemilk.com/favicon.ico",
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
		TASKS_RETRIEVED: "Retrieved tasks from RTM.",
	},
	TEN_MINUTES: 600000,
	TWENTY_FOUR_HOURS: 86400000,
	ALWAYS_CREATE_NEW_TIMELINE: false,
	PERMISSION_LEVEL: 'delete',
	API_KEY: "ad16f1c273c6555afcf822ccd5dee0f1",	
	PARSE_DATE_FROM_TASKNAME: 1,
	VERSION: "0.0.1",
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
	TASK: 	"<div style=\"border-top:dashed 1px grey;margin:1px;padding:2px;font-size:1.0em;\">"
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
			+ "	{for note in item.notes.note}"
			+ " 	<div style=\"margin-left:25px;text-align:left;font-size:0.8em\">"
			+ "			<li>{if (note.title)}<em>${note.title}</em><br/>{/if}${note.$t}"
			+ " 	</div>"
			+ "	{/for}"
			+ "{elseif (item.notes && item.notes.note) }"
			+ "	<div style=\"margin-left:25px;text-align:left;font-size:0.8em\">"
			+ "		<li>{if (item.notes.note.title)}<em>${item.notes.note.title}</em><br/>{/if}${item.notes.note.$t}"
			+ "	</div>"
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
    		return RTM.prefs.get(RTM.constants.pref.AUTH_TOKEN, null)
    	}
    } 

    var apiParams = {
        method: "rtm.auth.checkToken",
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
				CmdUtils.log('Error whilst calling ' + apiParams.method + '. Error Message: ' +  j.rsp.err.msg);
			} else {
				successCallback(j.rsp);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){
			CmdUtils.log('RTM Service Call Failure whilst calling ' + apiParams.method + '. Error Message: ' + textStatus +'. ' + XMLHttpRequest.statusText);
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
			CmdUtils.log('RTM Service Call Failure whilst calling ' + apiParams.method + '. Error Message: ' + textStatus +'. ' + XMLHttpRequest.statusText);
		}
		
	});
	
	if (r.status == 200){
		var j = Utils.decodeJson(r.responseText);
		if (j.rsp.stat == 'fail') {
			CmdUtils.log('Error: ' + j.rsp.err.msg);
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
            dl:	RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null)),
            tf:	tf,
            df:	df,
            tc:  RTM.tasks.count(),
            tz:  RTM.prefs.get(RTM.constants.pref.TIMEZONE, "Not Found"),
            ltc:  ltc,
            ltu:  ltu,
            v: RTM.constants.VERSION,
        }
}

RTM.login = function() {
    var frob = RTM.get_new_frob();
    if (frob == null) {
        return;
    }
    Application.storage.set(RTM.constants.store.FROB, frob);
    var authParams = {
        api_key: RTM.constants.API_KEY,
        frob: frob,
        perms: RTM.constants.PERMISSION_LEVEL,
    };
    var authUrl = RTM.constants.url.AUTH_URL + RTM.create_rtm_parameter_string(authParams, false);

    Utils.openUrlInBrowser(authUrl);
}

RTM.get_time = function(d) {
    if (!RTM.check_token()) { return null }    
    var date = d || new Date();
    var apiParams = {
        dateformat: RTM.prefs.get(RTM.constants.pref.DATE_FORMAT, 0),
        text: date.toString(),
        method: "rtm.time.parse",
        timezone: RTM.prefs.get(RTM.constants.pref.TIMEZONE, "UTC"),
    };  
	return RTM.rtm_call_json_sync(apiParams,  function(j){return j.time.$t});
}

RTM.get_settings = function() {
    if (!RTM.check_token()) {return null}
	return RTM.rtm_call_json_sync({method: "rtm.settings.getList"}, function(j){
					RTM.prefs.set(RTM.constants.pref.TIMEZONE, j.settings.timezone); 
					RTM.prefs.set(RTM.constants.pref.DEFAULT_LIST, j.settings.defaultlist); 
					RTM.prefs.set(RTM.constants.pref.TIME_FORMAT, j.settings.timeformat); 
					RTM.prefs.set(RTM.constants.pref.DATE_FORMAT, j.settings.dateformat); 
				});
}

RTM.get_timeline = function() {
    if (!RTM.constants.ALWAYS_CREATE_NEW_TIMELINE && RTM.prefs.has(RTM.constants.pref.TIMELINE)) {
        return RTM.prefs.get(RTM.constants.pref.TIMELINE, null);
    }
	if (!RTM.check_token()) {return null}

	return RTM.rtm_call_json_sync({method: "rtm.timelines.create"},  
   						function(r) { 
   							RTM.prefs.set(RTM.constants.pref.TIMELINE, r.timeline);
   							return r.timeline;});
}

RTM.get_new_frob = function() {
	return RTM.rtm_call_json_sync({method: 'rtm.auth.getFrob'}, function(r){return r.frob});
}

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
}

RTM.delete_task = function(task){	
	if (!task){
		return false;
	}			
	var apiParams = {
            list_id: task.list_id,
            method: "rtm.tasks.delete",
            task_id: task.task.id,
            taskseries_id: task.id,
            timeline: RTM.get_timeline(),
        };        
	return RTM.rtm_call_json_sync(apiParams, function(r){
				return (r.stat == "ok") ? RTM.constants.msg.TASK_DELETED : RTM.constants.msg.PROBLEM_DELETING_TASK;
			});
}

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
}

RTM.set_task_url = function(taskId, seriesId, listId, url){
	if (!taskId || !seriesId || !listId || !url) return;

	var apiParams = {
            list_id: listId,
            method: "rtm.tasks.setURL",
            task_id: taskId,
            taskseries_id: seriesId,
            timeline: RTM.get_timeline(),
            url: url,
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
            priority: priority,
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
		to_list_id: targetListId, 
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
        timeline: RTM.get_timeline(),
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

	function _get_lists(){
		
		if (	Application.storage.has(RTM.constants.store.TASK_LISTS) && 
				Application.storage.get(RTM.constants.store.TASK_LISTS, null) != null
			){
			return Application.storage.get(RTM.constants.store.TASK_LISTS, null);
		} else {
			return _update_lists();
		}
	}
	function _get_regular_list_names(){
		if (	Application.storage.has(RTM.constants.store.REGULAR_LIST) && 
				Application.storage.get(RTM.constants.store.REGULAR_LIST, null) != null
			){
			return Application.storage.get(RTM.constants.store.REGULAR_LIST, null);
		} else {
			return _update_regular_list_names();
		}
	}
	function _get_smart_list_names(){
		if (	Application.storage.has(RTM.constants.store.SMART_LIST) && 
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
		if (	Application.storage.has(RTM.constants.store.TASKS) && 
				Application.storage.get(RTM.constants.store.TASKS, null) != null
			){
			return Application.storage.get(RTM.constants.store.TASKS, null);
		} else {
			return _update(true, false, true);
		}
	}

	function _get_task_names(){
		if (	Application.storage.has(RTM.constants.store.TASKNAMES) && 
				Application.storage.get(RTM.constants.store.TASKNAMES, null) != null
			){
			return Application.storage.get(RTM.constants.store.TASKNAMES, null);
		} else {
			return _update_task_names();
		}
	}
	
	function _get_tags(){
		if (	Application.storage.has(RTM.constants.store.TAGS) && 
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
	    }			    
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
			_lastUpdated = Application.storage.get(RTM.constants.store.LAST_TASKS_UPDATE, null)

			Application.storage.set(RTM.constants.store.TASKS, tasks);
			_tasks = tasks;

			if (markSmartLists){
				_mark_smart_tasks(_tasks, force);
			}			
			_update_task_names();
			_update_tag_list();
			
			return _tasks;
		};
		
		return (async)	? RTM.rtm_call_json_async(apiParams, successCallback) 
						: RTM.rtm_call_json_sync(apiParams, successCallback);
	}
	function _update_list(listId, force, async, markSmartLists) {
	    if (!RTM.check_token()) {
	        return;
	    }
	    var apiParams = {
	        method: "rtm.tasks.getList",
	        list_id: listId
	    }
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
		
		return (async)	? RTM.rtm_call_json_async(apiParams, successCallback) 
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
			return 	tagArray;
		},
		count: function(){
			counter = 0;
			for (var i in _tasks){
				counter++;
			}
			return counter;
		},
		findMatchingTasks: function(searchTaskName, searchListId, searchPriority, searchTag){

			var matchingTasks = new Array();
			
			for (var t in _tasks) {
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
    if (RTM.check_token()) {
        display.echoStatus(M({en: "Valid Token found. Please logout first.", ja: "トークンはすでに取得しています。"}));
       // displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
    } else {
        display.echoStatusBar(M({en: "success", ja: "成功しました。"}));
        //displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
        RTM.login();
    }
}


ext.add("rtklogin", rtklogin,
        M({ja: "ログイン",
		    en: "login"}));

//ubiquity特有の設定？
// if (RTM.isParser2())
// {		
// 	/**
// 	 * Parser 2 Commands
// 	 *
// 	 */
	 
// 	CmdUtils.CreateCommand({
// 	    names:["refresh tasklists", "rtm refresh", "rtm-refresh"],  
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Force a refresh of all tasks and tasklists from RTM.",
// 	    msg_title: "RTM Ubiquity: Refresh",
// 	    preview: function(pBlock, args) {
// 	        if (!RTM.check_token()) {
// 	            pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	        
// 	        var p = this.description;
// 	        p += "<br><br>";
// 	        p += "Current Status:";
// 	        p += "<br><br>";
// 	        p += RTM.template.STATUS;
// 	        pBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
// 	    },
// 	    execute: function(args) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
	
// 			RTM.lists.update();
// 			RTM.tasks.force_update_all();
	
// 	        displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: "Refresh Complete!"});        
// 		}
// 	});	
	
// 	CmdUtils.CreateCommand({
// 	    names: ["logout rtm", "rtm-logout"],
// 		homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com",
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "RTM Logout.  Removes all traces of the ubiquity command.",
// 	    msg_title: "RTM Ubiquity: Logout",
// 	    preview: function(pBlock, args) {
	
// 	    	var p = "RTM Ubiquity Status.<br><br>";
// 			p += RTM.template.STATUS;
// 			p += "<br><br>";
// 	        p += "<span style=\"color:red;\">Warning!</span> Pressing Enter will clear all stored data for the RTM Ubiquity Command. Are you sure?";
	             
// 	        pBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
// 	    },
// 	    execute: function(args) {
// 	        RTM.prefs.remove_all();
// 	    	for (var c in RTM.constants.store){
// 		    	Application.storage.set(RTM.constants.store[c], null);
// 	    	}
	    	
// 	    	RTM.tasks.clear();
// 	    	RTM.lists.clear();
	    
// 	        displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Data Cleared!'});
// 	    }
// 	});	
	
// 	CmdUtils.CreateCommand({
// 	    names: ["login rtm", "rtm-login"],
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "RTM Login. Directs the user to RTM for an authorisation token.",
// 	    msg_title: "RTM Ubiquity: Login",
// 	    preview: function(pBlock, args) {

// 	        if (RTM.check_token()) {
// 	            pBlock.innerHTML = 'Authorisation token found. You\'re good to go!';
// 	        } else {
// 	            pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	        }
// 	    },
// 	    execute: function(args) {
// 	        if (RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
// 	        } else {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	        }
// 	    }
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    names: ["add task", "rtm add task", "rtm-add-task"],
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Add a task to RTM.",
// 	    arguments: [
// 			{role: 'object', label: 'Task', nountype: noun_arb_text},
// 			{role: 'goal', label: 'Task List', nountype: new RtmNounType("Task List", RTM.lists.get_regular_list_names)},
// 			{role: 'modifier', label: 'Priority', nountype: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )},
// 			{role: 'instrument', label: 'Url', nountype: noun_arb_text},
// 			{role: 'format', label: 'Tags', nountype: noun_arb_text},
// 		],
// 		msg_title: "RTM Ubiquity: Add Task",
// 	    preview: function(pBlock, args) {    	
// 			pBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	        
// 	        var defaultListName = RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null))||'Inbox';
	        
// 	        var taskName = args.object.summary || null;
// 	        var tags = (args.format.text) ? args.format.text.split() : [];
// 	        var priority = args.modifier.data || null;
// 	        var listName = args.goal.text || defaultListName;
// 	        var url = args.instrument.text || null;        
// 	        if (url){
// 	    	    url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
// 				url = RTM.utils.format_url(url);
// 			}
	
// 			var task = {
// 	        	id: "",
// 				name: taskName,
// 				task: {
// 					priority:args.modifier.text||""
// 				},
// 				tags: tags,
// 				list_name: listName,
// 				overdue:"",
// 				url: url,
// 				due:"<em>(Due date calculated from task when submitted)</em>",
// 	        }
	        
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 			}; 
	
// 			var ptemplate = "Add Task:";
// 			ptemplate += RTM.template.TASK;
// 			ptemplate += RTM.template.SMART_ADD;
	
// 	        pBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	        
// 	    },
// 	    execute: function(args) {	
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
// 	        if (!args.object.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
// 	            return;
// 	        }
// 	        var successMessage = RTM.constants.msg.TASK_ADDED;
// 	        var taskName = args.object.text;
// 	        var tags = args.format.text || null;
// 	        var priority = args.modifier.data || null;
// 	        var listId = args.goal.data || RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null);
// 	        if (RTM.lists.is_smart_list(listId)) {
// 	        	listId = RTM.lists.get_list_id("Inbox");
// 	        	successMessage = RTM.constants.msg.TASK_ADDED_INBOX;
// 			} 
	        
// 	        var url = args.instrument.text || null;
// 	        if (url){
// 	    	    url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
// 				url = RTM.utils.format_url(url);
// 			}
			
// 			if (RTM.add_task(taskName, listId, url, priority, tags)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: successMessage});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK});
// 			}
// 		}
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    names:["note task", "rtm note task", "rtm-note-task"],
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Adds a note to a task in RTM.",
// 	    arguments: [
// 			{role: 'object', label: 'Note', nountype: noun_arb_text},
// 			{role: 'instrument', label: 'Title', nountype: noun_arb_text},
// 			{role: 'goal', nountype: new RtmNounType("Task", RTM.tasks.get_task_names)},
// 		],
// 		msg_title: "RTM Ubiquity: Note Task",
// 	    preview: function(pBlock, args) {
// 			pBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	            
// 	        var note = args.object.summary || null;
// 	        var taskName = args.goal.text || null;
// 	        var title = args.instrument.text || null;
// 	        var taskId = args.goal.data || null;
	
// 	        var task = RTM.tasks.get_task(taskId);
	        
// 	        if (!task) {
// 				task = {
// 		        	id: "",
// 					name: taskName,
// 					task: {priority:""},
// 					tags: [],
// 					list_name: "",
// 					overdue:"",
// 					url: "",
// 					due:"",
// 	        	};
// 	    	}
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        	newNote: note,
// 	        	newNoteTitle: title,
// 			}; 
	
// 			var ptemplate = "Add Task Note:";
// 			ptemplate += RTM.template.TASK;
// 			ptemplate += " <div style=\"padding-left:2px;margin-left:26px;text-align:left;font-size:0.8em\">"
// 			ptemplate += "  <li>&nbsp;{if (newNoteTitle)}<em>${newNoteTitle}</em><br/>{/if}{if (newNote)}<b>${newNote}</b>{/if}"
// 			ptemplate += " </div>"		
	
// 	        pBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	        
// 	    },
// 	    execute: function(args) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
// 	        if (!args.object.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.NOTE_TEXT_REQUIRED});
// 	            return;
// 	        }
	        
// 	        var note = args.object.text || null;
// 	        var taskId = args.goal.data || null;
// 			var taskSeries = RTM.tasks.get_task(taskId);
// 	        var title = args.instrument.text || null;
	        
// 	        if (!taskSeries){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
// 	            return;
// 	        }
	
// 			if (RTM.add_task_note(taskSeries.task.id, taskSeries.id, taskSeries.list_id, note, title)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NOTE_ADDED});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK_NOTE});
// 			}
// 		}
// 	});
	
// 	CmdUtils.CreateCommand({
// 		names:["prioritise task", "rtm prioritise task", "rtm-prioritise-task"],
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 			name: "Gary Hodgson",
// 			email: "contact@garyhodgson.com"    
// 		},
// 		license: "MPL",
// 		icon: RTM.constants.url.ICON_URL,
// 		description: "Prioritises a task in RTM.",
// 		arguments: [
// 			{role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)},
// 			{role: 'goal', nountype: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )},
// 		],
// 		msg_title: "RTM Ubiquity: Prioritise Task",
// 	    preview: function(pBlock, args) {
	    	
// 	    	pBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        } 
// 			if (!args.object.text) {
// 				pBlock.innerHTML = "Unable to find task.";
// 	            return;
// 	        }
	
// 			var task = RTM.tasks.get_task(args.object.data) || null;
// 			if (!task) {
// 				pBlock.innerHTML = "Unable to find task in task lists.";
// 				return; 
// 			}
			
	// 		task.task.priority = args.goal.text || 'N';
	    		
	//         var previewData = {
	//         	item: task,
	//         	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
	//         	rootUrl: RTM.constants.url.ROOT_URL,
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
	//         	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No priority given.'});
	//             return;
	//         }
	//         var taskSeries = RTM.tasks.get_task(args.object.data);
	//         if (!taskSeries) {
	//             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
	//             return;
	//         }
	
	// 		if (RTM.prioritise_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, args.goal.text)){
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Task priority set to ' + args.goal.text});	
	// 		} else {
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: PROBLEM_PRIORITISING_TASK});
	// 		}
	// 		RTM.tasks.async_update_all();
	//     }
	// });
	
	// CmdUtils.CreateCommand({
	// 	names:["move task", "rtm move task", "rtm-move-task"],
	//     homepage: "http://www.garyhodgson.com/ubiquity",
	// 	author: {
	// 		name: "Gary Hodgson",
	// 		email: "contact@garyhodgson.com"    
	// 	},
	// 	license: "MPL",
	// 	icon: RTM.constants.url.ICON_URL,
	// 	description: "Moves a task between task lists in RTM.",
	// 	arguments: [
	// 		{role: 'object', label: 'Task', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)},
	// 		{role: 'goal', nountype: new RtmNounType("Task List", RTM.lists.get_regular_list_names)},
	// 	],
	// 	msg_title: "RTM Ubiquity: Move Task",
	//     preview: function(pBlock, args) {
	
	//     	pBlock.innerHTML = this.description;
	
	//         if (!RTM.check_token()) {
	//             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
	//             return;
	//         }         
	//         if (!args.object.text) {
	//             return;
	
	//         }
	
	// 		var task = RTM.tasks.get_task(args.object.data) || null;
	// 		if (!task) {
	// 			pBlock.innerHTML = "Unable to find task in task lists.";
	// 			return; 
	// 		}
	//         var toList = args.goal.text || '';
	//         var fromList = RTM.lists.get_list_name(task.list_id) || '';
	            		
	//         var previewData = {
	//         	item: task,
	//         	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
	//         	rootUrl: RTM.constants.url.ROOT_URL,
	//         	task: args.object.summary,
	//         	from: fromList,
	//         	to: toList,
	// 		}; 
	
	// 		var ptemplate = "Move the following task from [${from}] to [${to}]";
	// 		ptemplate += "<br><br>";
	// 		ptemplate += RTM.template.TASK;
	
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
	//         	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No target task list given.'});
	//             return;
	//         }
	//         var taskSeries = RTM.tasks.get_task(args.object.data);
	//         if (!taskSeries) {
	//             displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
	//             return;
	//         }
	
	// 		if (RTM.move_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, args.goal.data)){
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_MOVED});
	// 			RTM.tasks.async_update_all();
	// 		} else {
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_MOVING_TASK});
	// 		}	
	//     }
	// });
	
	
	// CmdUtils.CreateCommand({
	// 	names:["rtm-postpone-task", "rtm postpone task", "postpone task"],
	//     homepage: "http://www.garyhodgson.com/ubiquity",
	// 	author: {
	// 		name: "Gary Hodgson",
	// 		email: "contact@garyhodgson.com"    
	// 	},
	// 	license: "MPL",
	// 	icon: RTM.constants.url.ICON_URL,
	// 	description: "Postpones a task in RTM.",
	// 	arguments: [{role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)}],
	// 	msg_title: "RTM Ubiquity: Postpone Task",
	//     preview: function(pBlock, args) {
	//     	pBlock.innerHTML = this.description;
	//         if (!RTM.check_token()) {
	//             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
	//             return;
	//         } 
	//         if (!args.object.text) {
	//             return;
	//         }
	//         var task = RTM.tasks.get_task(args.object.data) || null;
	// 		if (!task) {
	// 			pBlock.innerHTML = "Unable to find task in task lists.";
	// 			return; 
	// 		}
	    		
	//         var previewData = {
	//         	item: task,
	//         	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
	//         	rootUrl: RTM.constants.url.ROOT_URL,
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
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_POSTPONED});
	// 			RTM.tasks.async_update_all();
	// 		} else {
	// 			displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_POSTPONING_TASK});
	// 		}
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
	// 	arguments: [{role: 'object', label: 'Task Names', nountype: new RtmNounType("Task Names", RTM.tasks.get_task_names)}],
	// 	msg_title: "RTM Ubiquity: Complete Task",
	//     preview: function(pBlock, args) {
	    	
	//         if (!RTM.check_token()) {
	//             pBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
	//             return;
	//         } 
	//         if (!args.object.text) {
	//             pBlock.innerHTML = this.description;
	//             return;
	//         }
	        
	// 		var task = RTM.tasks.get_task(args.object.data) || null;
	// 		if (!task) {
	// 			pBlock.innerHTML = "Unable to find task in task lists.";
	// 			return; 
	// 		}
			
	//         var previewData = {
	//         	item: task,
	//         	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
	//         	rootUrl: RTM.constants.url.ROOT_URL,
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
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find any tasks in your Task Lists.'});
// 	            return;
// 	        }
// 	        var taskSeries = tasks[args.object.data];
// 	        if (!taskSeries) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
// 	            return;
// 	        }
	
// 	        if (RTM.complete_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_COMPLETED});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_COMPLETING_TASK});
// 			}
// 	    }
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    names:["view tasks", "rtm view tasks", "rtm-view-tasks"],
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "View a list of RTM Tasks.",
// 	    arguments: [ 	
// 	    	{role: 'object', label: 'task', nountype: noun_arb_text},
// 	        {role: 'source', nountype: new RtmNounType("Task List", RTM.lists.get_all_list_names)},
// 	  		{role: 'modifier', nountype: new RtmNounType("Priority", {"1":"1","2":"2","3":"3","N":"None"})}, 
// 	        {role: 'instrument', nountype: new RtmNounType("Tag", RTM.tasks.get_tag_array)}
// 	    ],
// 	    msg_title: "RTM Ubiquity: View Tasks",
// 	    preview: function(pblock, args) {
	    	
// 	        pblock.innerHTML = this.description;        
	        
// 	    	if (!RTM.check_token()) {
// 	        	pblock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	        
// 	        var tasks = RTM.tasks.get_tasks(false);
// 	        if (!tasks) {
// 	        	pblock.innerHTML = RTM.constants.msg.NO_TASKS_FOUND;
// 	            return;
// 	        }
	
// 			var task = ".*"+args.object.text.replace(/^\s+|\s+$/g,"")+".*";
// 			var list = args.source.data || null;
// 			var priority = args.modifier.data || null;
// 			var tag = args.instrument.text || null;
	
// 			var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
			
// 			subTasks.sort(RTM.utils.sort_tasks_algorithm);
	 
// 			ptemplate = "<div>";
// 	        ptemplate += "{for item in items}";
// 	        ptemplate += RTM.template.TASK;
// 	        ptemplate += "{/for}";
// 	        ptemplate += "</div>";
	                
	
// 	        var previewData = {
// 	        	items: subTasks,
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	    	}
	    	
// 	        pblock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
// 	    },
// 	    execute: function(args) {	
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }
	        
// 	        if (!RTM.tasks.get_tasks(false)) {
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Syncing with RTM.'});
// 	        	RTM.lists.update();        
// 				RTM.tasks.force_update_all();
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Sync with RTM complete.'});
// 	        	return;
// 	        }
	        
// 	        Utils.openUrlInBrowser(RTM.constants.url.ROOT_URL, null);
// 	    }
// 	});

// } 
// else // Parser 1 commands
// {
		
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-refresh",  
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Force a refresh of all tasks and tasklists from RTM.",
// 	    msg_title: "RTM Ubiquity: Refresh",
// 	    preview: function(previewBlock, directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	        
// 	        var p = this.description;
// 	        p += "<br><br>";
// 	        p += "Current Status:";
// 	        p += "<br><br>";
// 	        p += RTM.template.STATUS;
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
	
// 			RTM.lists.update();
// 			RTM.tasks.force_update_all();
	
// 	        displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: "Refresh Complete!"});        
// 	       }
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-logout",
// 		homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com",
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "RTM Logout.  Removes all traces of the ubiquity command.",
// 	    msg_title: "RTM Ubiquity: Logout",
// 	    preview: function(previewBlock, directObject, mods) {
	    	
// 	    	var p = "RTM Ubiquity Status.<br><br>";
// 			p += RTM.template.STATUS;
// 			p += "<br><br>";
// 	        p += "<span style=\"color:red;\">Warning!</span> Pressing Enter will clear all stored data for the RTM Ubiquity Command. Are you sure?";
	             
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(p, RTM.status_data());
// 	    },
// 	    execute: function(directObject, mods) {
// 	        RTM.prefs.remove_all();
// 	    	for (var c in RTM.constants.store){
// 		    	Application.storage.set(RTM.constants.store[c], null);
// 	    	}

// 	    	RTM.tasks.clear();
// 	    	RTM.lists.clear();
	    
// 	        displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Data Cleared!'});
// 	    }
// 	});
	
	
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-login",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "RTM Login. Directs the user to RTM for an authorisation token.",
// 	    msg_title: "RTM Ubiquity: Login",
// 	    preview: function(previewBlock, directObject, mods) {
// 	        if (RTM.check_token()) {
// 	            previewBlock.innerHTML = 'Authorisation token found. You\'re good to go!';
// 	        } else {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	        }
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Valid Token found. Please logout first.'});
// 	        } else {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	        }
// 	    }
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-add-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Add a task to RTM.",
// 	    takes: {
// 	        task: noun_arb_text
// 	    },
// 	    modifiers: {
// 	        to: new RtmNounType("Task List", RTM.lists.get_regular_list_names),
// 	        pri: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} ),
// 	        url: noun_arb_text,
// 	        tags: noun_arb_text,
// 	    },
// 	    msg_title: "RTM Ubiquity: Add Task",
// 	    preview: function(previewBlock, directObject, mods) {
// 			previewBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	        
// 	        var defaultListName = RTM.lists.get_list_name(RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null))||'Inbox';
	        
// 	        var taskName = directObject.summary || null;
// 	        var tags = (mods.tags.text) ? mods.tags.text.split() : [];
// 	        var priority = mods.pri.data || null;
// 	        var listName = mods.to.text || defaultListName;
// 	        var url = mods.url.text || null;        
// 	        if (url){
// 	    	    url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
// 				url = RTM.utils.format_url(url);
// 			}
	
// 			var task = {
// 	        	id: "",
// 				name: taskName,
// 				task: {
// 					priority:mods.pri.text||""
// 				},
// 				tags: tags,
// 				list_name: listName,
// 				overdue:"",
// 				url: url,
// 				due:"<em>(Due date calculated from task when submitted)</em>",
// 	        }
	        
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 			}; 
	
// 			var ptemplate = "Add Task:";
// 			ptemplate += RTM.template.TASK;
			
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	        
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
// 	        if (!directObject.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
// 	            return;
// 	        }
// 	        var successMessage = RTM.constants.msg.TASK_ADDED;
// 	        var taskName = directObject.text;
// 	        var tags = mods.tags.text || null;
// 	        var priority = mods.pri.data || null;
// 	        var listId = mods.to.data || RTM.prefs.get(RTM.constants.pref.DEFAULT_LIST, null);
// 	        if (RTM.lists.is_smart_list(listId)) {
// 	        	listId = RTM.lists.get_list_id("Inbox");
// 	        	successMessage = RTM.constants.msg.TASK_ADDED_INBOX;
// 			} 
	        
// 	        var url = mods.url.text || null;
// 	        if (url){
// 	    	    url = (Utils.trim(url) == "this") ? (CmdUtils.getWindowInsecure().location.href || "") : Utils.trim(url);
// 				url = RTM.utils.format_url(url);
// 			}
			
// 			if (RTM.add_task(taskName, listId, url, priority, tags)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: successMessage});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK});
// 			}
// 		}
// 	});
	
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-note-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Adds a note to a task in RTM.",
// 	    takes: {
// 	        note: noun_arb_text
// 	    },
// 	    modifiers: {
// 			title: noun_arb_text,
// 			to: new RtmNounType("Task", RTM.tasks.get_task_names),
// 	    },
// 	    msg_title: "RTM Ubiquity: Note Task",
// 	    preview: function(previewBlock, directObject, mods) {
// 			previewBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
	            
// 	        var note = directObject.summary || null;
// 	        var taskName = mods.to.text || null;
// 	        var title = mods.title.text || null;
// 	        var taskId = mods.to.data || null;
	
// 	        var task = RTM.tasks.get_task(taskId);
	        
// 	        if (!task) {
// 				task = {
// 		        	id: "",
// 					name: taskName,
// 					task: {priority:""},
// 					tags: [],
// 					list_name: "",
// 					overdue:"",
// 					url: "",
// 					due:"",
// 	        	};
// 	    	}
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        	newNote: note,
// 	        	newNoteTitle: title,
// 			}; 
	
// 			var ptemplate = "Add Task Note:";
// 			ptemplate += RTM.template.TASK;
// 			ptemplate += " <div style=\"padding-left:2px;margin-left:26px;text-align:left;font-size:0.8em\">"
// 			ptemplate += "  <li>&nbsp;{if (newNoteTitle)}<em>${newNoteTitle}</em><br/>{/if}{if (newNote)}<b>${newNote}</b>{/if}"
// 			ptemplate += " </div>"		
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	        
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 				RTM.login();
// 	            return;
// 	        }
// 	        if (!directObject.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.NOTE_TEXT_REQUIRED});
// 	            return;
// 	        }
	        
// 	        var note = directObject.text || null;
// 	        var taskId = mods.to.data || null;
// 			var taskSeries = RTM.tasks.get_task(taskId);
// 	        var title = mods.title.text || null;
	        
// 	        if (!taskSeries){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NAME_REQUIRED});
// 	            return;
// 	        }
	
// 			if (RTM.add_task_note(taskSeries.task.id, taskSeries.id, taskSeries.list_id, note, title)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_NOTE_ADDED});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_ADDING_TASK_NOTE});
// 			}
// 		}
// 	});
	
// 	CmdUtils.CreateCommand({
// 		name: "rtm-prioritise-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 			name: "Gary Hodgson",
// 			email: "contact@garyhodgson.com"    
// 		},
// 		license: "MPL",
// 		icon: RTM.constants.url.ICON_URL,
// 		description: "Prioritises a task in RTM.",
// 		takes: {
// 			task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
// 		},
// 		modifiers: {
// 			to: new RtmNounType( "Priority", {"1":"1","2":"2","3":"3","N":"None"} )
// 		},
// 		msg_title: "RTM Ubiquity: Prioritise Task",
// 	    preview: function(previewBlock, directObject, mods) {
	    	
// 	    	previewBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        } 
// 			if (!directObject.text) {
// 				previewBlock.innerHTML = "Unable to find tasks.";
// 	            return;
// 	        }
	
// 			var task = RTM.tasks.get_task(directObject.data) || null;
// 			if (!task) {
// 				previewBlock.innerHTML = "Unable to find task in task lists.";
// 				return; 
// 			}
// 			task.task.priority = mods.to.text || 'N';
	    		
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        }; 
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
// 	    },
// 	    execute: function(directObject, mods) { 
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }
// 	        if (!directObject.text) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to prioritise.'});
// 	            return;
// 	        }
// 	        if (!mods.to.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No priority given.'});
// 	            return;
// 	        }
// 	        var taskSeries = RTM.tasks.get_task(directObject.data);
// 	        if (!taskSeries) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
// 	            return;
// 	        }
	
// 			if (RTM.prioritise_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, mods.to.text)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Task priority set to ' + mods.to.text});	
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: PROBLEM_PRIORITISING_TASK});
// 			}
// 			RTM.tasks.async_update_all();
// 	    }
// 	});
	
// 	CmdUtils.CreateCommand({
// 		name: "rtm-move-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 		author: {
// 			name: "Gary Hodgson",
// 			email: "contact@garyhodgson.com"    
// 		},
// 		license: "MPL",
// 		icon: RTM.constants.url.ICON_URL,
// 		description: "Moves a task between task lists in RTM.",
// 		takes: {
// 			task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
// 		},
// 		modifiers: {
// 			to: new RtmNounType("Task List", RTM.lists.get_regular_list_names)
// 		},
// 		msg_title: "RTM Ubiquity: Move Task",
// 	    preview: function(previewBlock, directObject, mods) {
	
// 	    	previewBlock.innerHTML = this.description;
	
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }         
// 	        if (!directObject.text) {
// 	            return;
	
// 	        }
	
// 			var task = RTM.tasks.get_task(directObject.data) || null;
// 			if (!task) {
// 				previewBlock.innerHTML = "Unable to find task in task lists.";
// 				return; 
// 			}
// 	        var toList = mods.to.text || '';
// 	        var fromList = RTM.lists.get_list_name(task.list_id) || '';
	            		
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        	task: directObject.summary,
// 	        	from: fromList,
// 	        	to: toList,
// 			}; 
	
// 			var ptemplate = "Move the following task from [${from}] to [${to}]";
// 			ptemplate += "<br><br>";
// 			ptemplate += RTM.template.TASK;
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }
// 	        if (!directObject.text) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to move.'});
// 	            return;
// 	        }
// 	        if (!mods.to.text){
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No target task list given.'});
// 	            return;
// 	        }
// 	        var taskSeries = RTM.tasks.get_task(directObject.data);
// 	        if (!taskSeries) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
// 	            return;
// 	        }
	
// 			if (RTM.move_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id, mods.to.data)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_MOVED});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_MOVING_TASK});
// 			}	
// 	    }
// 	});
	
	
// 	CmdUtils.CreateCommand({
// 		name: "rtm-postpone-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 		author: {
// 			name: "Gary Hodgson",
// 			email: "contact@garyhodgson.com"    
// 		},
// 		license: "MPL",
// 		icon: RTM.constants.url.ICON_URL,
// 		description: "Postpones a task in RTM.",
// 		takes: {
// 			task: new RtmNounType("Task Names",   RTM.tasks.get_task_names),
// 		},
// 		msg_title: "RTM Ubiquity: Postpone Task",
// 	    preview: function(previewBlock, directObject) {
// 	    	previewBlock.innerHTML = this.description;
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        } 
// 	        if (!directObject.text) {
// 	            return;
// 	        }
	        
// 	        var task = RTM.tasks.get_task(directObject.data) || null;
// 			if (!task) {
// 				previewBlock.innerHTML = "Unable to find task in task lists.";
// 				return; 
// 			}
	    		
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        }; 
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
// 	    },
// 	    execute: function(directObject, mods) {
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }    
// 	        if (!directObject.text) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to postpone.'});
// 	            return;
// 	        }
// 	        var taskSeries = RTM.tasks.get_task(directObject.data);
// 	        if (!taskSeries) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
// 	            return;
// 	        }
			
// 	        if (RTM.postpone_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_POSTPONED});
// 				RTM.tasks.async_update_all();
// 			} else {
// 				displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_POSTPONING_TASK});
// 			}
// 	    }
// 	});
	
	
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-complete-task",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "Complete task in RTM.",
// 	    takes: {
// 	        task: new RtmNounType("Task Names", RTM.tasks.get_task_names),
// 	    },    
// 	    msg_title: "RTM Ubiquity: Complete Task",
// 	    preview: function(previewBlock, directObject) {
// 	        if (!RTM.check_token()) {
// 	            previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        } 
// 	        if (!directObject.text) {
// 	            previewBlock.innerHTML = this.description;
// 	            return;
// 	        }
	        
// 			var task = RTM.tasks.get_task(directObject.data) || null;
// 			if (!task) {
// 				previewBlock.innerHTML = "Unable to find task in task lists.";
// 				return; 
// 			}
			
// 	        var previewData = {
// 	        	item: task,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        }; 
	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(RTM.template.TASK, previewData);
// 	    },
// 	    execute: function(directObject, mods) {
	
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }        
// 	        if (!directObject.text) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'No task given to complete.'});
// 		            return;
// 		        }
// 		        var tasks = Application.storage.get(RTM.constants.store.TASKS, null);
// 		        if (!tasks) {
// 		            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find any tasks in your Task Lists.'});
// 		            return;
// 		        }
// 		        var taskSeries = tasks[directObject.data];
// 		        if (!taskSeries) {
// 		            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Unable to find that task in your Task Lists.'});
// 		            return;
// 		        }
		
// 		        if (RTM.complete_task(taskSeries.task.id, taskSeries.id, taskSeries.list_id)){
// 					displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.TASK_COMPLETED});		
// 					RTM.tasks.async_update_all();
// 				} else {
// 					displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.PROBLEM_COMPLETING_TASK});
// 				}
// 		    }
// 		});
		
		
// 	CmdUtils.CreateCommand({
// 	    name: "rtm-view-tasks",
// 	    homepage: "http://www.garyhodgson.com/ubiquity",
// 	    author: {
// 	        name: "Gary Hodgson",
// 	        email: "contact@garyhodgson.com"
// 	    },
// 	    license: "MPL",
// 	    icon: RTM.constants.url.ICON_URL,
// 	    description: "View a list of RTM Tasks.",
// 	    takes: {
// 	        task: noun_arb_text
// 	    },
// 	    modifiers: { 
// 	    	in : new RtmNounType("Task List", RTM.lists.get_all_list_names),
// 	        pri: new RtmNounType("Priority", {"1":"1","2":"2","3":"3","N":"None"} ),
// 	        tag: new RtmNounType("Tag", RTM.tasks.get_tag_array),
// 	    },
// 	    msg_title: "RTM Ubiquity: View Tasks",
// 	    execute: function(directObject, mods) {
	    	
// 	        if (!RTM.check_token()) {
// 	            displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: RTM.constants.msg.LOGGING_IN_MSG});
// 	            RTM.login();
// 	            return;
// 	        }
	        
// 	        if (!RTM.tasks.get_tasks(false)) {
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Syncing with RTM.'});
// 	        	RTM.lists.update();        
// 				RTM.tasks.force_update_all();
// 	        	displayMessage({icon: RTM.constants.url.ICON_URL, title: this.msg_title, text: 'Sync with RTM complete.'});
// 	        	return;
// 	        }
	        
// 	        Utils.openUrlInBrowser(RTM.constants.url.ROOT_URL, null);
// 	    },
// 	    preview: function(previewBlock, directObject, mods) {
// 	        previewBlock.innerHTML = this.description;        
	        
// 	    	if (!RTM.check_token()) {
// 	        	previewBlock.innerHTML = RTM.constants.msg.LOGIN_MSG;
// 	            return;
// 	        }
// 	        var tasks = RTM.tasks.get_tasks(false);
// 	        if (!tasks) {
// 	        	previewBlock.innerHTML = RTM.constants.msg.NO_TASKS_FOUND;
// 	            return;
// 	        }
	
// 			var task = ".*"+directObject.text.replace(/^\s+|\s+$/g,"")+".*";
// 			var list = mods.in.data || null;
// 			var priority = mods.pri.data || null;
// 			var tag = mods.tag.text || null;
	
// 			var subTasks = RTM.tasks.findMatchingTasks(task, list, priority, tag);
			
// 			subTasks.sort(RTM.utils.sort_tasks_algorithm);
	 
// 			ptemplate = "<div>";
// 	        ptemplate += "{for item in items}";
// 	        ptemplate += RTM.template.TASK;
// 	        ptemplate += "{/for}";
// 	        ptemplate += "</div>";
	                
	
// 	        var previewData = {
// 	        	items: subTasks,
// 	        	rootUrl: RTM.constants.url.ROOT_URL,
// 	        	userId: RTM.prefs.get(RTM.constants.pref.USER_NAME, ''),
// 	    	}
	    	
// 	        previewBlock.innerHTML = CmdUtils.renderTemplate(ptemplate, previewData);
	
// 	    }
// 	});
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