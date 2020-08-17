
var LiveChatBot = function ( args ) {
  var oScriptTag = document.getElementById("TelegramLiveChatLoader");

  // get domain of calling script for dev server support
  var src = oScriptTag.getAttribute('src');
  var matches = src.match( /\/\/([^\/]+)/ );

  this.domain    = '//' + matches[1];
  this.bot       = oScriptTag.getAttribute('data-bot');
  this.referer   = window.location.href;
};

LiveChatBot.prototype.iframe                   = {};
LiveChatBot.prototype.iframe.id                = 'iFrameResizer0';
LiveChatBot.prototype.iframe.src               = '/assets/chat/index.html';
LiveChatBot.prototype.iframe.allowtransparency = true;

LiveChatBot.prototype.iframe.style = {}
LiveChatBot.prototype.iframe.style.zIndex   = '99999999';
LiveChatBot.prototype.iframe.style.position = 'fixed';
LiveChatBot.prototype.iframe.style.right    = '0px';
LiveChatBot.prototype.iframe.style.bottom   = '10px';
LiveChatBot.prototype.iframe.style.width    = '75px';
LiveChatBot.prototype.iframe.style.height   = '75px';
LiveChatBot.prototype.iframe.style.border   = 'none';

// http://davidjbradshaw.github.io/iframe-resizer/
LiveChatBot.prototype.resizer = {};
LiveChatBot.prototype.resizer.url = '/assets/iframe-resizer/js/iframeResizer.js';

// http://stackoverflow.com/questions/950087/include-a-javascript-file-in-another-javascript-file#answer-950146
LiveChatBot.prototype.resizer.load = function() {
  var head    = document.getElementsByTagName('head')[0];
  var script  = document.createElement('script');
  script.type = 'text/javascript';
  script.src  = telegram_livechatbot.domain + telegram_livechatbot.resizer.url;

  script.onreadystatechange = telegram_livechatbot.resizer.callback;
  script.onload             = telegram_livechatbot.resizer.callback;

  // Fire the loading
  head.appendChild(script);
};

LiveChatBot.prototype.resizer.callback = function() {
  var iframe = document.createElement('iframe');

  // http://www.w3schools.com/jsref/met_element_setattribute.asp
  iframe.setAttribute('id',  telegram_livechatbot.iframe.id );
  var src     = telegram_livechatbot.domain + telegram_livechatbot.iframe.src;
  var bot     = '?bot='     + ((!! telegram_livechatbot.bot)      ? telegram_livechatbot.bot                           : '');
  var referer = '&referer=' + ((!! telegram_livechatbot.referer ) ? encodeURIComponent( telegram_livechatbot.referer ) : '');
  iframe.setAttribute('src', src + bot + referer );
  iframe.setAttribute('allowtransparency', 'true');

  // http://www.w3schools.com/jsref/dom_obj_style.asp
  var style      = iframe.style;
  style.zIndex   = telegram_livechatbot.iframe.style.zIndex;
  style.position = telegram_livechatbot.iframe.style.position;
  style.right    = telegram_livechatbot.iframe.style.right;
  style.bottom   = telegram_livechatbot.iframe.style.bottom;
  style.width    = telegram_livechatbot.iframe.style.width;
  style.height   = telegram_livechatbot.iframe.style.height;
  style.border   = telegram_livechatbot.iframe.style.border;
  
  var body = document.getElementsByTagName('body')[0];
  body.appendChild( iframe );

  iFrameResize({
    checkOrigin: [ 'https:' + telegram_livechatbot.domain ],
    widthCalculationMethod: 'bodyCss',
    sizeWidth: true
  });
};

var telegram_livechatbot = new LiveChatBot();
telegram_livechatbot.resizer.load();
