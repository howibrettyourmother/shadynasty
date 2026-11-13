// SHADYNASTY shared config: ONE place for the league id. Loaded first by the site, the games (chug/, arcade/*) and Tank Watch.
// Sleeper gives the league a NEW id every season when the commish renews it. Instead of hardcoding that id in 7 places, we keep
// one known league (ROOT) and walk forward: each renewed league's previous_league_id points at last year's, and it shows up in the
// commish's league list for the new season. We switch to the new league once last season is complete (or the new one has started
// drafting/playing), so the offseason keeps showing the finished season until it's really over.
// Override for testing: ?league=<id>.  Resolved id is cached in localStorage ('sn:lid', 6 h).
(function(){'use strict';
  var C={ROOT:'1312055708249767936',ROOT_SEASON:2026,COMMISH:'603082868373135360',JOE:'679000405232934912',
    API:'https://api.sleeper.app/v1/',SITE:'https://howibrettyourmother.github.io/shadynasty/',TTL:6*36e5};
  var q=(location.search.match(/[?&]league=(\d{6,})/)||[])[1],cache=null;
  try{cache=JSON.parse(localStorage.getItem('sn:lid')||'null')}catch(e){}
  if(cache&&cache.root!==C.ROOT)cache=null;
  C.LEAGUE=q||(cache&&cache.id)||C.ROOT;C.override=!!q;
  var get=function(u){return fetch(C.API+u).then(function(r){if(!r.ok)throw new Error(u+' '+r.status);return r.json()})};
  // walk ROOT -> newest renewal. Returns the id to use right now.
  C.resolve=async function(){
    var st=await get('state/nfl'),id=C.ROOT,lg=await get('league/'+id),top=Math.max(+st.season||0,+st.league_season||0,+st.league_create_season||0)+1;
    for(var y=+lg.season+1;y<=top;y++){
      var ls=await get('user/'+C.COMMISH+'/leagues/nfl/'+y).catch(function(){return[]});
      var nx=(ls||[]).find(function(l){return String(l.previous_league_id)===String(id)});
      if(!nx)break;
      if(lg.status!=='complete'&&nx.status==='pre_draft')break;   // last season still being played: stay on it
      id=nx.league_id;lg=nx}
    return id};
  var fresh=cache&&Date.now()-cache.at<C.TTL;
  C.ready=q||fresh?Promise.resolve(C.LEAGUE):Promise.race([
    C.resolve().then(function(id){try{localStorage.setItem('sn:lid',JSON.stringify({root:C.ROOT,id:id,at:Date.now()}))}catch(e){}C.LEAGUE=id;return id}),
    new Promise(function(res){setTimeout(function(){res(C.LEAGUE)},2500)})   // never hold the first paint hostage
  ]).catch(function(){return C.LEAGUE});
  window.SN_CFG=C})();
