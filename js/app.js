(() => {
const STORAGE = {favorites:"krasnyArchive.favorites.v1",custom:"krasnyArchive.customArticles.v1",profile:"krasnyArchive.localProfile.v1"};
const $ = s => document.querySelector(s);
const grid=$("#articleGrid"), search=$("#searchInput"), filters=$("#categoryFilters"), dialog=$("#articleDialog");
let activeCategory="Все материалы", activeArticle=null, showingFavorites=false;
const base=() => (window.ARCHIVE_ARTICLES||[]).map(a=>({...a,custom:false}));
const readJSON=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const favorites=()=>readJSON(STORAGE.favorites,[]);
const custom=()=>readJSON(STORAGE.custom,[]);
const allArticles=()=>[...base(),...custom()];
const saveFavorites=ids=>localStorage.setItem(STORAGE.favorites,JSON.stringify(ids));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const categories=()=>["Все материалы",...new Set(allArticles().map(a=>a.category))];
function renderFilters(){filters.innerHTML=categories().map(c=>`<button class="filter-chip ${c===activeCategory?"active":""}" data-category="${esc(c)}">${esc(c)}</button>`).join("");}
function render(){
  renderFilters();
  const q=search.value.trim().toLocaleLowerCase("ru"), fav=favorites();
  let list=allArticles().filter(a=>(activeCategory==="Все материалы"||a.category===activeCategory)&&(!showingFavorites||fav.includes(a.id))&&(!q||[a.title,a.description,a.category,a.date,a.body.replace(/<[^>]*>/g," ")].join(" ").toLocaleLowerCase("ru").includes(q)));
  const sort=$("#sortSelect").value;
  if(sort==="title")list.sort((a,b)=>a.title.localeCompare(b.title,"ru"));
  else if(sort==="category")list.sort((a,b)=>a.category.localeCompare(b.category,"ru")||a.title.localeCompare(b.title,"ru"));
  else list.sort((a,b)=>(a.featured??99)-(b.featured??99));
  $("#resultCount").textContent=`Материалов: ${list.length}${showingFavorites?" · избранное":""}`;
  $("#favoriteCount").textContent=fav.length;
  grid.innerHTML=list.map(a=>`<article class="article-card"><div class="card-top"><span class="card-category">${esc(a.category)}</span><span class="card-date">${esc(a.date||"Архив")}</span></div><h3 class="card-title">${esc(a.title)}</h3><p class="card-description">${esc(a.description)}</p><div class="card-bottom"><button class="read-link" data-read="${esc(a.id)}">Читать статью ↗</button><button class="save-card ${fav.includes(a.id)?"saved":""}" data-save="${esc(a.id)}" aria-label="${fav.includes(a.id)?"Убрать из избранного":"Добавить в избранное"}">${fav.includes(a.id)?"★":"☆"}</button></div></article>`).join("");
  $("#noResults").hidden=list.length>0;grid.hidden=list.length===0;
}
function renderTimeline(){$("#timeline").innerHTML=(window.ARCHIVE_TIMELINE||[]).map(e=>`<article class="timeline-item"><strong class="timeline-year">${esc(e.year)}</strong><p>${esc(e.text)}</p></article>`).join("");}
function openArticle(id){const a=allArticles().find(x=>x.id===id);if(!a)return;activeArticle=a;$("#dialogCategory").textContent=a.category;$("#dialogTitle").textContent=a.title;$("#dialogDescription").textContent=a.description;$("#dialogContent").innerHTML=a.body.replace(/\n/g,"<br>");$("#dialogSourceNote").textContent=a.custom?"Пользовательский материал · сохранён локально":"Материал архива · вводная справочная статья";updateBookmark();dialog.showModal();}
function updateBookmark(){if(!activeArticle)return;const yes=favorites().includes(activeArticle.id);$("#bookmarkButton").textContent=yes?"★ В избранном":"☆ В избранное";$("#bookmarkButton").setAttribute("aria-pressed",String(yes));}
function toggleFavorite(id){let f=favorites();f=f.includes(id)?f.filter(x=>x!==id):[...f,id];saveFavorites(f);render();updateBookmark();}
filters.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;showingFavorites=false;render();});
grid.addEventListener("click",e=>{const read=e.target.closest("[data-read]"),save=e.target.closest("[data-save]");if(read)openArticle(read.dataset.read);if(save)toggleFavorite(save.dataset.save);});
search.addEventListener("input",render);$("#sortSelect").addEventListener("change",render);
$("#clearSearch").addEventListener("click",()=>{search.value="";activeCategory="Все материалы";showingFavorites=false;render();});
$("#resetFilters").addEventListener("click",()=>{search.value="";activeCategory="Все материалы";showingFavorites=false;render();});
document.querySelectorAll("[data-theory-filter]").forEach(a=>a.addEventListener("click",()=>{activeCategory=a.dataset.theoryFilter;showingFavorites=false;render();}));
$("#favoritesNav").addEventListener("click",()=>{showingFavorites=!showingFavorites;activeCategory="Все материалы";$("#library").scrollIntoView({behavior:"smooth"});render();});
$("#bookmarkButton").addEventListener("click",()=>activeArticle&&toggleFavorite(activeArticle.id));
$("#dialogClose").addEventListener("click",()=>dialog.close());$("#dialogCloseTop").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
const account=$("#accountDialog");
$("#accountBtn").addEventListener("click",()=>account.showModal());$("#accountClose").addEventListener("click",()=>account.close());
$("#demoLogin").addEventListener("click",()=>{const name=$("#demoUser").value.trim();if(!name){$("#demoUser").focus();return;}localStorage.setItem(STORAGE.profile,JSON.stringify({name}));$("#accountBtn").textContent=`Привет, ${name.slice(0,16)}`;account.close();});
const savedProfile=readJSON(STORAGE.profile,null);if(savedProfile?.name)$("#accountBtn").textContent=`Привет, ${savedProfile.name.slice(0,16)}`;
const admin=$("#adminDialog");let adminClicks=0;
$("#accountBtn").addEventListener("contextmenu",e=>{e.preventDefault();admin.showModal();});
$("#accountBtn").addEventListener("dblclick",()=>admin.showModal());
$("#adminClose").addEventListener("click",()=>admin.close());$("#adminCancel").addEventListener("click",()=>admin.close());
$("#articleForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const title=String(fd.get("title")).trim(),description=String(fd.get("description")).trim(),body=String(fd.get("body")).trim();if(!title||!description||!body)return;const plainBody=body.split(/\n{2,}/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("");const id="local-"+Date.now();const entry={id,category:String(fd.get("category")),date:"Локальная статья",featured:99,title,description,body:plainBody,custom:true};localStorage.setItem(STORAGE.custom,JSON.stringify([...custom(),entry]));e.currentTarget.reset();$("#adminMessage").textContent="Сохранено в этом браузере. Это не публикация на сервере.";render();});
$("#mobileMenu").addEventListener("click",()=>{const nav=$("#mainNav"),open=nav.classList.toggle("open");$("#mobileMenu").setAttribute("aria-expanded",String(open));});
$("#mainNav").addEventListener("click",e=>{if(e.target.closest("a"))$("#mainNav").classList.remove("open");});
renderTimeline();render();
})();