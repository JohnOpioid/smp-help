(function(){
  try {
    if (!window.Telegram) window.Telegram = {}
    if (!window.Telegram.WebApp) window.Telegram.WebApp = {}
    const wa = window.Telegram.WebApp
    wa.initData = ''
    wa.platform = 'web'
    wa.version = 'stub'
    wa.expand = function(){}
    wa.ready = function(cb){ if (typeof cb === 'function') setTimeout(cb, 0) }
    wa.onEvent = function(){ return { off: function(){} } }
  } catch (e) {}
})();


