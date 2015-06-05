var cXde = {

	initApp: function() {
		var gui = require('nw.gui');
		var win = gui.Window.get();
		window.keyTimeout = null;
		window.resizeTimeout = null;
		cXde.setPHPSetting(localStorage.getItem('cXde.php'));
		cXde.setHostSetting(localStorage.getItem('cXde.host'));
		cXde.setPortSetting(localStorage.getItem('cXde.port'));
		cXde.setThemeSetting(localStorage.getItem('cXde.theme'));
		cXde.setKeyMapSetting(localStorage.getItem('cXde.keymap'));
		cXde.setActiveLineSetting(localStorage.getItem('cXde.activeline'));
		cXde.setLineNumbersSetting(localStorage.getItem('cXde.linenumbers'));
		cXde.setLineWrapSetting(localStorage.getItem('cXde.linewrap'));
		cXde.setLintingSetting(localStorage.getItem('cXde.linting'));
		cXde.setFoldingSetting(localStorage.getItem('cXde.folding'));
		cXde.setAutoMatchSetting(localStorage.getItem('cXde.automatch'));
		cXde.setAutoCloseSetting(localStorage.getItem('cXde.autoclose'));
		cXde.setIOjsSetting(localStorage.getItem('cXde.iojs'));
		cXde.createUI(gui, win, function() {
			cXde.runApp(gui, win);
		});
	},

	runApp: function(gui, win) {
		cXde.status('Loading c&hearts;de');
		cXde.createEditors(cXde.startServer);
		cXde.createMenu(gui);
		cXde.createHotkeys(gui, win);
		cXde.createWindowBindings(win);
		cXde.createToolBindings(gui, win);
		cXde.createResizeTimeout();
		cXde.createGeneralBindings();
		win.maximize();
	},

	runCode: function() {
		var async = require('async');
		var fs = require('fs');
		async.parallel([
			function(callback) {
				var markup = $('.CodeMirror')[0].CodeMirror.getValue();
				fs.writeFile('preview/index.php', markup, callback);
			},
			function(callback) {
				var script = $('.CodeMirror')[1].CodeMirror.getValue();
				fs.writeFile('preview/script.js', script, callback);
			},
			function(callback) {
				var style = $('.CodeMirror')[2].CodeMirror.getValue();
				fs.writeFile('preview/style.css', style, callback);
			},
			function(callback) {
				if ($('#cXde-window-phpfile').is(':visible')) {
					var php = $('.CodeMirror')[3].CodeMirror.getValue();
					fs.writeFile('preview/server.php', php, callback);
				} else {
					callback();
				}
			}
		], function() {
			$("#cXde-preview").attr('src', 'http://' + localStorage.getItem('cXde.host') + ':' + localStorage.getItem('cXde.currentport'));
		});
	},

	startServer: function() {
		var http = require('http');
		var php = require('./js/php');
		var express = require('express');
		var app = express();
		var server = http.createServer(app);
		var bin = localStorage.getItem('cXde.php');
		var host = localStorage.getItem('cXde.host');
		var port = localStorage.getItem('cXde.port');
		var sockets = [];
		server.on('connection', function(socket) {
			sockets.push(socket);
		});
		server.listen(port, host, function() {
			port = server.address().port;
			app.use('/', php.cgi({ "php": bin, "host": host, "port": port }));
			localStorage.setItem('cXde.currentport', port);
			$("#cXde-tool-restart").removeClass('spin');
			cXde.status('Running on <span class="selectable">http://' + host + ':' + port + '/</span>');
			cXde.runCode();
		}).on('error', function(err) {
			cXde.status('Failed to load development server: ' + err);
		});
		cXde.createRestartBinding(server, sockets);
	},

	restartServer: function(server, sockets) {
		$("#cXde-tool-restart").unbind();
		$("#cXde-tool-restart").addClass('spin');
		cXde.status('Restarting server...');
		server.close();
		sockets.forEach(function(socket) {
			socket.destroy();
		});
		setTimeout(cXde.startServer, 3000);
	},

	status: function(status) {
		$("#cXde-status").html(status);
	},

	loadFile: function(i, file, callback) {
		$.get(file, function(data) {
			var editor = $('.CodeMirror')[i].CodeMirror;
			editor.setValue(data);
			callback();
		});
	},

	resize: function() {
		cXde.refreshUI();
		cXde.refreshEditors();
	},

	refreshEditors: function() {
		$('.CodeMirror').each(function() {
			this.CodeMirror.refresh();
		});
	},

	refreshUI: function() {
		$('#cXde-layout').layout('panel', 'center').panel('resize',{width:'50%'});
		$('#cXde-layout').layout('panel', 'east').panel('resize',{width:'50%'});  
		$('#cXde-layout-left').layout('panel', 'north').panel('resize',{height:'50%'});
		$('#cXde-layout-left').layout('panel', 'center').panel('resize',{height:'50%'});
		$('#cXde-layout-right').layout('panel', 'north').panel('resize',{height:'50%'});
		$('#cXde-layout-right').layout('panel', 'center').panel('resize',{height:'50%'});
		$('#cXde-layout').layout('panel', 'south').panel('resize',{height:30});
		$('.easyui-window').window('center');
	},

	stringToBoolean: function(string) {
		if(string == "true") {
			return true;
		} else {
			return false;
		}
	},

	createMenu: function(gui) {
		$(document).on("contextmenu", function(e) {
			e.preventDefault();
			menu.popup(e.originalEvent.x, e.originalEvent.y);
		});
		var menu = new gui.Menu();
		var cut = new gui.MenuItem({
			label: "Cut",
			click: function() {
				document.execCommand("cut");
			}
		});
		var copy = new gui.MenuItem({
			label: "Copy",
			click: function() {
				document.execCommand("copy");
			}
		});
		var paste = new gui.MenuItem({
			label: "Paste",
			click: function() {
				document.execCommand("paste");
			}
		});
		menu.append(cut);
		menu.append(copy);
		menu.append(paste);
		return menu;
	},

	createHotkeys: function(gui, win) {
		var fullscreen = new gui.Shortcut({
			key: "F11",
			active: function() {
				if (document.hasFocus()) {
					win.toggleFullscreen();
				}
			}
		});
		gui.App.registerGlobalHotKey(fullscreen);
		var devtools = new gui.Shortcut({
			key: "F12",
			active: function() {
				if (document.hasFocus()) {
					cXde.openDevTools(win);
				}
			}
		});
		gui.App.registerGlobalHotKey(devtools);
	},

	createGutters: function() {
		var gutters = [];
		gutters.push("CodeMirror-lint-markers");
		if(localStorage.getItem('cXde.linenumbers') == "true") {
			gutters.push("CodeMirror-linenumbers");
		}
		if(localStorage.getItem('cXde.folding') == "true") {
			gutters.push("CodeMirror-foldgutter");
		}
		return gutters;
	},

	createEditor: function(element, mode, callback) {
		CodeMirror.fromTextArea(element, {
			styleActiveLine: cXde.stringToBoolean(localStorage.getItem('cXde.activeline')),
			theme: localStorage.getItem('cXde.theme'),
			mode: mode,
			indentUnit: 4,
			indentWithTabs: true,
			lineNumbers: cXde.stringToBoolean(localStorage.getItem('cXde.linenumbers')),
			lineWrapping: cXde.stringToBoolean(localStorage.getItem('cXde.linewrap')),
			keyMap: localStorage.getItem('cXde.keymap'),
			foldGutter: cXde.stringToBoolean(localStorage.getItem('cXde.folding')),
			gutters: cXde.createGutters(),
			scrollbarStyle: 'overlay',
			matchBrackets: cXde.stringToBoolean(localStorage.getItem('cXde.automatch')),
			autoCloseBrackets: cXde.stringToBoolean(localStorage.getItem('cXde.autoclose')),
			matchTags: cXde.stringToBoolean(localStorage.getItem('cXde.automatch')),
			autoCloseTags: cXde.stringToBoolean(localStorage.getItem('cXde.autoclose')),
			lint: cXde.stringToBoolean(localStorage.getItem('cXde.linting')),
			onLoad: callback()
		});
	},

	createEditors: function(callback) {
		var async = require('async');
		async.parallel([
			function(callback) {
				cXde.createEditor($("#cXde-markup")[0], "application/x-httpd-php", function() {
					cXde.loadFile(0, "preview/index.php", callback);
				});
			},
			function(callback) {
				cXde.createEditor($("#cXde-script")[0], "javascript", function() {
					cXde.loadFile(1, "preview/script.js", callback);
				});
			},
			function(callback) {
				cXde.createEditor($("#cXde-style")[0], "css", function() {
					cXde.loadFile(2, "preview/style.css", callback);
				});
			}
		], function() {
			for (i = 0; i < 3; i++) {
				cXde.createZoom(i);
				cXde.createKeyTimeout(i);
			}
			callback();
		});
	},

	createZoom: function(i) {
		$(".CodeMirror:eq(" + i + ")").on('mousewheel', function(event) {
			if (event.ctrlKey) {
				var editor = $('.CodeMirror')[i].CodeMirror;
				var fontSize = $(".CodeMirror:eq(" + i + ")").css('font-size').replace('px', '');
				$(".CodeMirror:eq(" + i + ")").css('font-size', (parseInt(fontSize) + event.deltaY) + "px");
				editor.refresh();
			}
		});
	},

	createKeyTimeout: function(i) {
		$(".CodeMirror:eq(" + i + ")").on('keyup', function(event) {
			if (window.keyTimeout) {
				clearTimeout(window.keyTimeout);
				window.keyTimeout = null;
			}
			window.keyTimeout = setTimeout(cXde.runCode, 1500);
		});
	},

	createResizeTimeout: function() {
		$(window).resize(function() {
			if (window.resizeTimeout) {
				clearTimeout(window.resizeTimeout);
				window.resizeTimeout = null;
			}
			window.resizeTimeout = setTimeout(cXde.resize, 500);
		});
	},

	createToolBindings: function(gui, win) {
		$("#cXde-tool-addphp").on('click', function(e) {
			cXde.openPHPFile();
		});
		$("#cXde-tool-devtools").on('click', function(e) {
			cXde.openDevTools(win);
		});
		$("#cXde-tool-settings").on('click', function(e) {
			cXde.openSettings(gui);
		});
	},

	createRestartBinding: function(server, sockets) {
		$("#cXde-tool-restart").bind('click', function(e) {
			cXde.restartServer(server, sockets);
		});
	},

	createGeneralBindings: function() {
		$("#cXde-preview").on('load', function() {
			var title = document.getElementById("cXde-preview").contentDocument.title;
			if (title == "") {
				title = "Untitled";
			}
			$(".panel-title span").text(title);
		});
		$('.layout-split-proxy-h').on('mouseup', function() {
			setTimeout(cXde.refreshEditors, 500);
		});
		$('.layout-split-proxy-v').on('mouseup', function() {
			setTimeout(cXde.refreshEditors, 500);
		});
	},

	createWindowBindings: function(win) {
		var panel = $('body').find('.panel:eq(0)');
		panel.addClass('cXde-window');
		var panelHeader = panel.find('.panel-header:eq(0)');
		panelHeader.addClass('cXde-header');
		var minBtn = panelHeader.find('.panel-tool-min');
		minBtn.unbind('click');
		minBtn.on('click', function(e) {
			win.minimize();
		});
	},

	setPHPSetting: function(value) {
		var path = require("path").dirname(process.execPath);
		var os = require('os').platform();
		if (value == undefined || value == "") {
			if (os == 'win32' || os == 'win64') {
				value = path + '/bin/php/php-cgi.exe';
			} else if (os == 'darwin') {
				value = path + '/bin/php/php-cgi.app';
			} else if (os == 'linux') {
				value = path + '/bin/php/php-cgi';
			} else {
				value = 'php-cgi';
			}
		} else if ((typeof value) == "object") {
			value = $('#cXde-setting-php').filebox('getValue');
		}
		localStorage.setItem('cXde.php', value);
	},

	setHostSetting: function(value) {
		if (value == undefined || value == "") {
			value = "localhost";
		} else if ((typeof value) == "object") {
			value = $('#cXde-setting-host').textbox('getValue');
		}
		localStorage.setItem('cXde.host', value);
	},

	setPortSetting: function(value) {
		if (value == undefined || value == "") {
			value = 0;
		} else if ((typeof value) == "object") {
			value = $('#cXde-setting-port').numberbox('getValue');
		}
		localStorage.setItem('cXde.port', value);
	},

	setThemeSetting: function(value) {
		if (value == undefined || value == "") {
			value = "light";
		} else if ((typeof value) == "object") {
			value = $('#cXde-setting-theme').combobox('getValue');
		}
		localStorage.setItem('cXde.theme', value);
		cXde.changeTheme(value);
	},

	setKeyMapSetting: function(value) {
		if (value == undefined || value == "") {
			value = "sublime";
		} else if ((typeof value) == "object") {
			value = $('#cXde-setting-keymap').combobox('getValue');
		}
		localStorage.setItem('cXde.keymap', value);
		cXde.setEditorOption('keyMap', value);
	},

	setActiveLineSetting: function(value) {
		if (value == undefined || value == "") {
			value = "false";
		}
		if (value == "true" || $('#cXde-setting-activeline').is(':checked')) {
			localStorage.setItem('cXde.activeline', 'true');
			cXde.setEditorOption('styleActiveLine', true);
		} else {
			localStorage.setItem('cXde.activeline', 'false');
			cXde.setEditorOption('styleActiveLine', false);
		}
	},

	setLineWrapSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-linewrap').is(':checked')) {
			localStorage.setItem('cXde.linewrap', 'true');
			cXde.setEditorOption('lineWrapping', true);
		} else {
			localStorage.setItem('cXde.linewrap', 'false');
			cXde.setEditorOption('lineWrapping', false);
		}
	},

	setLineNumbersSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-linenumbers').is(':checked')) {
			localStorage.setItem('cXde.linenumbers', 'true');
			cXde.setEditorOption('lineNumbers', true);
		} else {
			localStorage.setItem('cXde.linenumbers', 'false');
			cXde.setEditorOption('lineNumbers', false);
		}
		cXde.setEditorOption('gutters', cXde.createGutters());
	},

	setLintingSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-linting').is(':checked')) {
			localStorage.setItem('cXde.linting', 'true');
			cXde.setEditorOption('lint', true);
		} else {
			localStorage.setItem('cXde.linting', 'false');
			cXde.setEditorOption('lint', false);
		}
		cXde.setEditorOption('gutters', cXde.createGutters());
	},

	setFoldingSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-folding').is(':checked')) {
			localStorage.setItem('cXde.folding', 'true');
			cXde.setEditorOption('foldGutter', true);
		} else {
			localStorage.setItem('cXde.folding', 'false');
			cXde.setEditorOption('foldGutter', false);
		}
		cXde.setEditorOption('gutters', cXde.createGutters());
	},

	setAutoMatchSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-automatch').is(':checked')) {
			localStorage.setItem('cXde.automatch', 'true');
			cXde.setEditorOption('matchBrackets', true);
			cXde.setEditorOption('matchTags', true);
		} else {
			localStorage.setItem('cXde.automatch', 'false');
			cXde.setEditorOption('matchBrackets', false);
			cXde.setEditorOption('matchTags', false);
		}
	},

	setAutoCloseSetting: function(value) {
		if (value == undefined || value == "") {
			value = "true";
		}
		if (value == "true" || $('#cXde-setting-autoclose').is(':checked')) {
			localStorage.setItem('cXde.autoclose', 'true');
			cXde.setEditorOption('autoCloseBrackets', true);
			cXde.setEditorOption('autoCloseTags', true);
		} else {
			localStorage.setItem('cXde.autoclose', 'false');
			cXde.setEditorOption('autoCloseBrackets', false);
			cXde.setEditorOption('autoCloseTags', false);
		}
	},

	setIOjsSetting: function(value) {
		if (value == undefined || value == "") {
			value = "false";
		}
		if (value == "true" || $('#cXde-setting-iojs').is(':checked')) {
			localStorage.setItem('cXde.iojs', 'true');
			$('#cXde-preview').removeAttr('nwdisable');
		} else {
			localStorage.setItem('cXde.iojs', 'false');
			$('#cXde-preview').attr('nwdisable', '');
		}
	},

	populateSettings: function() {
		var path = require("path").dirname(process.execPath);
		var file = new File(localStorage.getItem('cXde.php'), 'php-cgi');
		var files = new FileList();
		files.append(file);
		$('.filebox input')[1].files = files;
		$('#cXde-setting-host').textbox({
			'value': localStorage.getItem('cXde.host')
		});
		$('#cXde-setting-port').numberbox({
			'value': localStorage.getItem('cXde.port')
		});
		$('#cXde-setting-theme').combobox({
			'valueField': 'id',
			'textField': 'text',
			'value': localStorage.getItem('cXde.theme'),
			'url': path + '/themes/themes.json'
		});
		$('#cXde-setting-keymap').combobox({
			'valueField': 'id',
			'textField': 'text',
			'value': localStorage.getItem('cXde.keymap'),
			'data': [{
				"id":"sublime",
				"text":"Sublime Text"
			},{
				"id":"emacs",
				"text":"Emacs"
			},{
				"id":"vim",
				"text":"Vim"
			}]
		});
		var activeline = localStorage.getItem('cXde.activeline');
		if (activeline == "true") {
			$('#cXde-setting-activeline').attr('checked', '');
		} else {
			$('#cXde-setting-activeline').removeAttr('checked');
		}
		var linenumbers = localStorage.getItem('cXde.linenumbers');
		if (linenumbers == "true") {
			$('#cXde-setting-linenumbers').attr('checked', '');
		} else {
			$('#cXde-setting-linenumbers').removeAttr('checked');
		}
		var linewrap = localStorage.getItem('cXde.linewrap');
		if (linewrap == "true") {
			$('#cXde-setting-linewrap').attr('checked', '');
		} else {
			$('#cXde-setting-linewrap').removeAttr('checked');
		}
		var linting = localStorage.getItem('cXde.linting');
		if (linting == "true") {
			$('#cXde-setting-linting').attr('checked', '');
		} else {
			$('#cXde-setting-linting').removeAttr('checked');
		}
		var folding = localStorage.getItem('cXde.folding');
		if (folding == "true") {
			$('#cXde-setting-folding').attr('checked', '');
		} else {
			$('#cXde-setting-folding').removeAttr('checked');
		}
		var automatch = localStorage.getItem('cXde.automatch');
		if (automatch == "true") {
			$('#cXde-setting-automatch').attr('checked', '');
		} else {
			$('#cXde-setting-automatch').removeAttr('checked');
		}
		var autoclose = localStorage.getItem('cXde.autoclose');
		if (autoclose == "true") {
			$('#cXde-setting-autoclose').attr('checked', '');
		} else {
			$('#cXde-setting-autoclose').removeAttr('checked');
		}
		var iojs = localStorage.getItem('cXde.iojs');
		if (iojs == "true") {
			$('#cXde-setting-iojs').attr('checked', '');
		} else {
			$('#cXde-setting-iojs').removeAttr('checked');
		}
		$('#cXde-version').text(process._nw_app.manifest.version);
	},

	changeTheme: function(theme) {
		var path = require("path").dirname(process.execPath);
		var link = $('head').find('link:first');
		link.attr('href', path + '/themes/' + theme + '/theme.css');
		cXde.setEditorOption('theme', theme);
	},

	setEditorOption: function(option, value) {
		if(value == "true" || value == "false") {
			value = cXde.stringToBoolean(value);
		}
		$('.CodeMirror').each(function() {
			this.CodeMirror.setOption(option, value);
		});
	},

	openPHPFile: function() {
		if ($('#cXde-window-phpfile').length == false) {
			$("#cXde-layout").append('<div id="cXde-window-phpfile" class="easyui-window"></div>');
		}
		$('#cXde-window-phpfile').window({
			title: 'PHP',
			width: 600,
			height: 300,
			closed: false,
			modal: false,
			href: 'html/phpfile.html',
			resizable: true,
			maximizable: true,
			minimizable: false,
			collapsible: true,
			inline: true,
			onLoad: function(data) {
				cXde.createEditor($("#cXde-php")[0], "php", function() {
					cXde.loadFile(3, "preview/server.php", function() {
						cXde.runCode();
					});
				});
				cXde.createZoom(3);
				cXde.createKeyTimeout(3);
			},
			onResize: function() {
				if ($('.CodeMirror')[3]) {
					$('.CodeMirror')[3].CodeMirror.refresh();
				}
			},
			beforeClose: function() {
				cXde.runCode();
				$(".CodeMirror:eq(3)").unbind();
			}
		});
	},

	openDevTools: function(win) {
		if ($('#cXde-window-devtools').length == false) {
			$("#cXde-layout").append('<div id="cXde-window-devtools" class="easyui-window"></div>');
		}
		$('#cXde-window-devtools').window({
			title: 'Developer Tools',
			width: 600,
			height: 300,
			closed: false,
			modal: false,
			href: 'html/devtools.html',
			resizable: true,
			maximizable: true,
			minimizable: false,
			collapsible: true,
			inline: true,
			onLoad: function(data) {
				win.showDevTools("cXde-preview", true);
				win.on("devtools-opened", function(url) {
					$('#cXde-devtools').attr('src', url);
					win.closeDevTools();
				});
			},
			beforeClose: function() {
				$('#cXde-devtools').attr('src', 'about:blank');
			}
		});
	},

	openSettings: function(gui) {
		if ($('#cXde-window-settings').length == false) {
			$("#cXde-layout").append('<div id="cXde-window-settings" class="easyui-window"></div>');
		}
		$('#cXde-window-settings').window({
			title: 'Settings',
			width: 400,
			height: 400,
			closed: false,
			modal: false,
			href: 'html/settings.html',
			resizable: false,
			maximizable: false,
			minimizable: false,
			collapsible: true,
			inline: true,
			onLoad: function(data) {
				$('a[target=_blank]').on('click', function() {
					gui.Shell.openExternal(this.href);
					return false;
				});
				cXde.populateSettings();
			}
		});
	},

	createUI: function(gui, win, callback) {
		$('#cXde-window').panel({
			title: 'c&hearts;de',
			href: 'html/layout.html',
			width: '100%',
			height: '100%',
			draggable: false,
			resizable: false,
			collapsible: false,
			closable: true,
			maximizable: true,
			minimizable: true,
			maximized: true,
			cache: false,
			border: false,
			onClose: function(data) {
				gui.App.quit();
			},
			beforeClose: function() {
				win.blur();
				window.close();
			},
			onMaximize: function(data) {
				win.maximize();
			},
			onRestore: function(data) {
				win.unmaximize();
			},
			onLoad: function(data) {
				callback();
			}
		});
	}

};

cXde.initApp();