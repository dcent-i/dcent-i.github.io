// main.js

// === 1. 文献渲染工具函数 ===
// 负责将 references.js 中的内容填入 HTML
function renderReferences(scope = document) {
    // 检查 references.js 是否已加载
    if (typeof refs === 'undefined') {
        console.warn("references.js is not loaded yet.");
        return;
    }
    scope.querySelectorAll("[data-ref]").forEach(el => {
        const key = el.getAttribute("data-ref");
        // 只有当标签内容为空且 refs 中有数据时才填充，避免重复
        if (refs[key] && el.innerHTML.trim() === "") {
            el.innerHTML = refs[key];
        }
    });
}

// === 2. 页面加载核心逻辑 (Include Loader) ===
document.addEventListener("DOMContentLoaded", () => {
    
    // 2.1 先尝试渲染主页面上原本就有的文献引用
    renderReferences();

    // 2.2 处理 include-html
    const elements = document.querySelectorAll('[include-html]');

    elements.forEach(el => {
        const file = el.getAttribute('include-html');
        
        if (file) {
            fetch(file)
            .then(response => {
                if (response.ok) return response.text();
                throw new Error('Page not found');
            })
            .then(text => {
                // 填入内容
                el.innerHTML = text;
                el.removeAttribute('include-html'); 
                
                // 【修复核心】：内容加载完毕后，手动触发一次文献渲染
                renderReferences(el); 

                // 如果被加载的内容里包含折叠面板(toggle)，可能需要在这里重新绑定事件
                // 为了兼容你原有的逻辑，这里暂时不做额外处理，
                // 但如果发现折叠面板失效，需要把 setupToggle 的调用移到这里。
            })
            .catch(err => {
                el.innerHTML = "Could not load file: " + file;
                console.error(err);
            });
        }
    });
});

// === 3. 辅助函数 (Offset & Scroll) ===
function getTopOffset(){
    return window.innerWidth <= 640 ? 70 : 0;  // small vs large screens
}

function smoothScrollTo(sel){
    const el = document.querySelector(sel); if(!el) return;
    openParentDetails(el);                         // ensure section is expanded
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const y = el.getBoundingClientRect().top + window.pageYOffset - getTopOffset();
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}

// === 4. 导航栏交互逻辑 ===
var btn = document.querySelector('.menu-toggle');
if (btn) {
    btn.addEventListener('click', function(){
        document.body.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', document.body.classList.contains('nav-open'));
    });
}

var links = document.querySelectorAll('.sidenav ul a');
for (var i = 0; i < links.length; i++){
    links[i].addEventListener('click', function(e){
        e.preventDefault();
        var target = this.getAttribute('href');
        smoothScrollTo(target);
        // highlight now
        var id = target && target.charAt(0)==='#' ? target.slice(1) : null;
        if (id) setActive(id);
        if (window.innerWidth <= 640){ 
            document.body.classList.remove('nav-open'); 
            if(btn) btn.setAttribute('aria-expanded','false'); 
        }
    });
}

// === 5. Scroll Spy (滚动监听) ===
var sections = document.querySelectorAll('section.panel');

// Maps: section id -> link, and data-section -> link
var byId = {}, bySection = {};
for(var i = 0; i < links.length; i++){
    var l = links[i];
    var href = l.getAttribute('href');
    if(href && href.charAt(0) === '#'){ byId[href.slice(1)] = l; }
    if(l.dataset.section){ bySection[l.dataset.section] = l; }
}

var currentId = null;

function setActive(id){
    if(id === currentId) return;
    currentId = id;
    // clear
    for (var m = 0; m < links.length; m++) links[m].removeAttribute('aria-current');
    // set current
    var link = byId[id];
    if (!link) return;
    link.setAttribute('aria-current','true');
    var parentKey = link.dataset.parent;
    if (parentKey && bySection[parentKey]) bySection[parentKey].setAttribute('aria-current','true');
}

function updateActive(){
    const offset = getTopOffset() + 5;
    let bestId = null;
    for (let s = 0; s < sections.length; s++){
        const r = sections[s].getBoundingClientRect();
        if (r.top <= offset && r.bottom > offset){ bestId = sections[s].id; break; }
    }
    if (!bestId && sections.length > 0) bestId = sections[0].id;
    setActive(bestId);
}

var ticking = false;
function onScroll(){ 
    if(!ticking){ 
        requestAnimationFrame(function(){ updateActive(); ticking = false; }); 
        ticking = true; 
    } 
}

window.addEventListener('scroll', onScroll, {passive:true});
window.addEventListener('resize', onScroll);
window.addEventListener('load', updateActive);

// === 6. Hash 处理 & Details 展开 ===
window.addEventListener('hashchange', function(){
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el){ openParentDetails(el); smoothScrollTo('#' + el.id); }
});
// Initial load update
updateActive();

function openParentDetails(el){
    for (var p = el && el.parentElement; p; p = p.parentElement){
        if (p.tagName === 'DETAILS') p.open = true;
    }
}
window.addEventListener('hashchange', function(){
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el){ openParentDetails(el); el.scrollIntoView({behavior:'smooth', block:'start'}); }
});

// === 7. Toggle (折叠面板逻辑) ===
// Reusable toggler: swaps summary <p> with .detail block and updates button text + aria-expanded
function setupToggle(section, labels){
    if (!section) return; // Safety check
    const btn = section.querySelector('.toggle-btn');
    const summary = section.querySelector('.summary');
    const detail = section.querySelector('.detail');
    if(!btn || !summary || !detail) return;

    // Ensure aria-controls points at the detail id
    if(!detail.id){ detail.id = section.id + '-detail'; }
    btn.setAttribute('aria-controls', detail.id);

    function setExpanded(expanded){
        btn.setAttribute('aria-expanded', expanded);
        summary.hidden = expanded;
        detail.hidden = !expanded;
        btn.textContent = expanded ? labels.collapse : labels.expand;
    }

    // Initial state: collapsed (summary visible)
    setExpanded(false);

    btn.addEventListener('click', function(){
        const next = btn.getAttribute('aria-expanded') !== 'true';
        setExpanded(next);
    });
}

// Attach to demos
// 注意：如果你这几个 ID (publications, dcentstory, past) 是在 include-html 加载的文件里，
// 这段代码可能需要在 fetch 完成后再次运行。
// 目前保持原样运行，如果页面里有这些 ID 就能生效。
setupToggle(document.getElementById('publications'),  {expand:'Full Publication List',    collapse:'Highlighted Publications'});
setupToggle(document.getElementById('dcentstory'),  {expand:'Read The Full Story',    collapse:'Read Less'});
setupToggle(document.getElementById('past'),  {expand:'Read More',    collapse:'Read Less'});