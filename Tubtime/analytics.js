/* TubTime website measurement: opt-in only; no app/child data. */
(() => {
  'use strict';
  const script = document.currentScript;
  const id = script?.dataset.measurementId || '';
  const enabledHost = ['tubtime.app', 'www.tubtime.app', 'matthewcoxall12.github.io'].includes(location.hostname);
  const params = new URLSearchParams(location.search);
  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const qa = params.get('tt_qa') === '1' || navigator.webdriver || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // Query flags are carried to internal links for the whole QA journey; never sent to GA.
  if (params.get('tt_qa') === '1') document.querySelectorAll('a[href]').forEach(a => {
    const u = new URL(a.href, location.href);
    if (u.origin === location.origin && !a.href.startsWith('mailto:')) { u.searchParams.set('tt_qa', '1'); a.href = u.href; }
  });
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const configured = /^G-[A-Z0-9]{6,15}$/.test(id);
  let active = false, loaded = false, viewed = false;
  const page = location.pathname.includes('wash-log-guide') ? 'guide' : location.pathname.includes('weekly-wash-record') ? 'printable' : 'home';
  const titles = {home:'TubTime Android app',guide:'Family wash-log guide',printable:'Weekly wash record'};
  const campaigns = new Set(['free_listings_2026_11','organic_search','parent_resources','parent_washlog_20261103','tracking_verification_20261103']);
  const sources = new Set(['applauncher','appbreakup','google','bing','newsletter','directory','appvetter','appireview','familyapp','appsforkids','igamemom','setup_check']);
  const media = new Set(['referral','organic','email','earned_editorial','resource_listing','internal']);
  const verification = params.get('utm_source') === 'setup_check' && params.get('utm_campaign') === 'tracking_verification_20261103';
  const cleaned = new URL(location.origin + (page === 'home' ? '/Tubtime/' : '/Tubtime/' + (page === 'guide' ? 'wash-log-guide.html' : 'weekly-wash-record.html')));
  for (const [key, values] of [['utm_source',sources],['utm_medium',media],['utm_campaign',campaigns]]) {
    const value = params.get(key); if (values.has(value)) cleaned.searchParams.set(key, value);
  }
  // Carry only approved campaign labels through this site's pages and on deliberate Play navigation.
  document.querySelectorAll('a[href]').forEach(a => {
    const u = new URL(a.href, location.href);
    if (u.hostname === 'play.google.com' && u.pathname === '/store/apps/details' && u.searchParams.get('id') === 'com.tubtime.app') {
      const play = new URL('https://play.google.com/store/apps/details?id=com.tubtime.app');
      if (!qa) for (const [key,value] of cleaned.searchParams) play.searchParams.set(key,value);
      a.href=play.href;
    } else if (u.origin === location.origin && /^\/(?:Tubtime\/(?:index\.html|wash-log-guide\.html|weekly-wash-record\.html)?)?$/.test(u.pathname)) {
      for (const [key,value] of cleaned.searchParams) u.searchParams.set(key,value);
      a.href=u.href;
    }
  });
  let referrer = '', referrerBucket = 'direct';
  try { const u = new URL(document.referrer); if (u.origin !== location.origin && /^https?:$/.test(u.protocol)) { const allowed = ['google.com','google.co.uk','bing.com','duckduckgo.com','appbreakup.com','applauncher.dev','appvetter.com','appireview.com','familyapp.com','appsforkids.org','igamemom.com']; const host = allowed.find(h => u.hostname === h || u.hostname.endsWith('.'+h)); referrer = host ? 'https://'+host+'/' : ''; referrerBucket = host || 'other_referral'; } } catch {}
  const gtag = function(){window.dataLayer.push(arguments);};
  const notice = document.createElement('section');
  notice.className = 'tt-measurement screen-only'; notice.setAttribute('aria-label','Optional website analytics');
  notice.innerHTML = '<p>May we count visits and Google Play clicks? Optional Google Analytics uses cookies only if you allow it. It does not read your family’s app records.</p><div><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">No thanks</button><a href="./website-privacy.html">Website privacy</a></div>';
  const privacy = new URL('website-privacy.html', script?.src || location.href); notice.querySelector('a').href = privacy.href;
  const controls = document.createElement('button'); controls.type='button'; controls.className='tt-settings screen-only'; controls.textContent='Website analytics choices';
  const status = document.createElement('p'); status.className='tt-status screen-only'; status.setAttribute('role','status'); status.hidden=true;
  const clearCookies = () => document.cookie.split(';').forEach(part => {
    const name=part.trim().split('=')[0]; if (!/^_ga(?:_|$)/.test(name)) return;
    for (const domain of ['',location.hostname,'.'+location.hostname,'.tubtime.app']) document.cookie=name+'=;Max-Age=0;path=/;SameSite=Lax'+(domain?';domain='+domain:'');
  });
  function start() {
    if (!configured || !enabledHost || qa || privacySignal) return;
    active=true; window['ga-disable-'+id]=false; window.dataLayer=window.dataLayer||[];
    if (!loaded) {
      loaded=true;
      gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('js',new Date());
      gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_expires:2592000,cookie_update:false,page_location:cleaned.href,page_referrer:referrer,page_title:titles[page],referrer_bucket:referrerBucket,...(verification?{debug_mode:true}: {})});
      const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(tag);
    } else gtag('consent','update',{analytics_storage:'granted'});
    if (!viewed) {viewed=true;gtag('event','page_view',{page_location:cleaned.href,page_referrer:referrer,page_title:titles[page],referrer_bucket:referrerBucket,...(verification?{debug_mode:true}: {})});}
  }
  function choose(value) {
    save('tt_analytics_consent_v1',value);notice.hidden=true;status.hidden=false;
    if (value==='yes') { start(); status.textContent=qa?'QA mode: analytics excluded.':privacySignal?'Your browser privacy preference keeps analytics off.':configured?'Analytics allowed. You can change this below.':'Analytics is not configured; no data has been sent.'; }
    else {active=false;window['ga-disable-'+id]=true;if(loaded)gtag('consent','update',{analytics_storage:'denied'});clearCookies();status.textContent='Analytics is off. You can still use every page and Google Play link.';}
  }
  controls.addEventListener('click',()=>{notice.hidden=false;notice.querySelector('button').focus();});
  notice.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.choice)));
  document.body.append(notice,controls,status);
  const hero = document.querySelector?.('.hero');
  if (hero) hero.after(notice);
  else document.querySelector?.('footer')?.before(notice);
  notice.hidden=qa||privacySignal||read('tt_analytics_consent_v1')!==null;
  if (read('tt_analytics_consent_v1')==='yes') start();
  const click = e => {
    if (!active || (e.type==='auxclick'&&e.button!==1)) return;
    const a=e.target.closest?.('a[href]');if(!a)return;
    const u=new URL(a.href);if(u.hostname!=='play.google.com'||u.pathname!=='/store/apps/details'||u.searchParams.get('id')!=='com.tubtime.app')return;
    const placement=a.closest('.hero')?'hero':a.closest('.final-cta')?'footer':a.closest('.closing')?'guide_end':a.closest('#paper-app')?'guide_compare':page==='printable'?'printable':'guide_top';
    gtag('event','play_click',{page,placement,transport_type:'beacon',page_location:cleaned.href,page_referrer:referrer,page_title:titles[page],referrer_bucket:referrerBucket,...(verification?{debug_mode:true}: {})});
  };
  document.addEventListener('click',click);document.addEventListener('auxclick',click);
})();
