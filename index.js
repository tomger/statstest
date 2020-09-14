let lastupdatedDate = '';

const suggestedRegions = [
    'world-united_states_of_america',
    'world-france',
    'us-co-los-angeles-california',
    // 'us-co-san-francisco-california',
    ]

const iff = (condition, result) => condition ? result : '';
const dateParse = d3.timeParse("%Y-%m-%d");
function debounce(callback, wait, immediate = false) {
    let timeout = null 
    
    return function() {
    const callNow = immediate && !timeout
    const next = () => callback.apply(this, arguments)
    
    clearTimeout(timeout)
    timeout = setTimeout(next, wait)

    if (callNow) {
        next()
    }
    }
}

function onSearchFocus() {
    document.querySelector('.titlebar-wrapper').classList.add('isSearchMode')
    document.querySelector('.listing-wrapper').classList.add('isSearchMode')
    document.querySelector('.search-bar').classList.add('isFocussed')
    searchView.isSearching = true;
    history.pushState({}, 'COVID-19 Watchlist', `#search`)
}

function onSearchCancel() {
    document.querySelector('.searchinput').value='';
    document.querySelector('.searchinput').blur();
    document.querySelector('.titlebar-wrapper').classList.remove('isSearchMode')
    document.querySelector('.listing-wrapper').classList.remove('isSearchMode')
    document.querySelector('.search-bar').classList.remove('isFocussed')
    searchView.query = null
    searchView.isSearching = false;
    history.replaceState({}, 'COVID-19 Watchlist', `/`)
}

function trackEvent(name, value) {
    fetch(`/learn?${name}=${value}`, { cache: 'no-cache' });
}

var trackInput = debounce(value => trackEvent('search', value), 1500)

function onSearchInput(event) {
    searchView.query = event.target.value;
    trackInput(event.target.value)
}

function init() {
    loadRegions();
    d3.csv("/lastupdate").then(data => {
    lastupdatedDate = data[0].date;
    let span = document.querySelector('.lastupdated');
    if (span) span.innerHTML = lastUpdatedSpan();
    })
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

function loadRegions() {
    d3.csv("/data/regions.csv").then(data => {
    searchView.regions = data;

    suggestedRegions.push(...shuffleArray(data.filter(d => {
        return d.path.indexOf('us-st') === 0 && (parseInt(d['last-cases'], 10) / parseInt(d['population'], 10) > 0.00014)
    }).map(d=>d.path)))

    let region = getRegionFromLocation();
    if (region) {
        showDetailView(region)
    }
    });
}

window.onpopstate = function() {
    let region = getRegionFromLocation();
    showDetailView(region);
    onSearchCancel();
}

function getRegionFromLocation() {
    // let pathname = '/region/us-st-maine';
    let pathname = location.pathname;
    let pathMatch = pathname.match(/region\/(.*)/);
    if (pathMatch) {
    let needlePath = pathMatch[1];
    let region = searchView.regions.find(line => line.path === needlePath);
    return region;
    }
    return null;
}

function closeDetailView() {
    history.replaceState({}, 'COVID-19 Watchlist', `/`)
    showDetailView(null)
}
function navigateToDetailView(region) {
    didPushHistoryState = true;
    history.pushState({}, region.name, `/region/${region.path}`)
    showDetailView(region)
    window.scrollTo(0,0)
}

function showDetailView(region) {
    [...document.querySelectorAll('.listing-wrapper, .titlebar-wrapper')].forEach(e => {
    e.style.display = !!region ? 'none' : ''
    })
    if (region) {
    document.title = `COVID-19 Watchlist ${region.name}`;
    } else {
    document.title = `COVID-19 Watchlist`;
    }
    detailView.region = region;
}

function readSettings() {
    try {
        let storage =  localStorage.getItem('states0');
        if (storage) {
        return localStorage.getItem('states0').split(',')
        }
    } catch(e) {
    }
    return [];
}

function isRegionSelected(state) {
    return selectedRegions.indexOf(state) !== -1;
}

function toggleRegion(state) {
    if (!state) {
    return
    }
    let index = selectedRegions.indexOf(state);
    if (index === -1) {
    selectedRegions.push(state)
    } else {
    selectedRegions.splice(index, 1)
    }
    localStorage.setItem('states0', selectedRegions.join(','))

    // DEBUG
    searchView.update();
    onSearchCancel();
}

function changeNumber(region) {
    let change = region['change-cases'];
    return /*html*/`
    <div class="${change < 0 ? 'isDown' : 'isUp'}">
        ${change > 0 ? '+' : ''}${change}%
    </div>
    `;
}

function lastUpdatedSpan() {
    let options = { month: 'short', day: 'numeric', hour: 'numeric', minute:'numeric' };

    return `Last updated ${new Date(lastupdatedDate).toLocaleString(undefined, options)}. `;
}

function dataDisclaimer() {
    
    return /*html*/`
    <span class="lastupdated">${lastUpdatedSpan()}</span>United States data provided by 
    <a href="https://github.com/nytimes/covid-19-data">The New York Times</a>. 
    World data provided by
    <a href="https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide">European Centre for Disease Prevention and Control</a>.
    `;
}

function isWarningRegion(region) {
    return ((region['last-cases'] / region.population) * 100000) > 10;
}

function numberColumn(region) {
    const warnSign = `
    <svg style="transform:translateY(1px)" width="13" height="13" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M6.02051 2.52216C6.45587 1.82595 7.54427 1.82595 7.97963 2.52216L12.6326 9.96293C13.0679 10.6591 12.5237 11.5294 11.653 11.5294H2.34714C1.47642 11.5294 0.932221 10.6591 1.36758 9.96293L6.02051 2.52216ZM7.8266 9.43878C7.8266 9.89526 7.45655 10.2653 7.00007 10.2653C6.54359 10.2653 6.17354 9.89526 6.17354 9.43878C6.17354 8.9823 6.54359 8.61224 7.00007 8.61224C7.45655 8.61224 7.8266 8.9823 7.8266 9.43878ZM7.00007 4.47959C6.5674 4.47959 6.23829 4.8681 6.30942 5.29488L6.67927 7.51395C6.7054 7.67077 6.84109 7.78571 7.00007 7.78571C7.15905 7.78571 7.29474 7.67077 7.32087 7.51395L7.69072 5.29488C7.76185 4.8681 7.43274 4.47959 7.00007 4.47959Z" fill="#EAAF17"/>
    </svg>
    `;

    let relativeCases = ((region['last-cases'] / region.population) * 100000).toFixed(1);
    let changeRow = '<span class="secondaryLabel">–</span>';
    if (relativeCases > 1) {
    changeRow = changeNumber(region)
    }
    return /*html*/`
    <div style="text-align: right; font-size: 16px; width: 54px;">
        <div>${isWarningRegion(region) ? warnSign : '' }${relativeCases}</div><span style="font-size: 14px;">${changeRow}</span>
    </div>
    `;
}

function appendListItem(target, region, addButton) {
    const sparkStyle = `
            padding-top: 6px;
            margin-right: 5px;
            display: flex;
            align-items: top;
        `;
    let menuitem = target.append('a')
        .attr('class', `menuitem-wrapper`)
        .attr('href', `/region/${region.path}`)
        .on('click', function(event) { 
        d3.event.preventDefault();
        trackEvent('click-listitem', region.path);
        navigateToDetailView(region);
        })
        .html(/*html*/`
        ${iff(addButton, /*html*/`
        <div
        onclick="event.stopPropagation();event.preventDefault();trackEvent('list-follow','${region.path}');toggleRegion('${region.path}');closeDetailView()"
        style="display:flex; align-items: center; padding-right: 16px; color: var(--colorBlue)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        `)}
        <div style="flex:1">
        <div class="primaryLabel">${region.name.replace(/_/g, ' ')}</div>
        <div class="secondaryLabel">
            ${region.byline}${region.byline ? ' · ' : ''}${Number(region.population).toLocaleString()}
        </div>
        </div>
        ${iff(!addButton, /*html*/`
        <div style="${sparkStyle}">
            <spark-line class="${region["change-cases"] < 0 ? 'isDown' : 'isUp'}" src="/data/${region.path}.csv"></spark-line>
        </div>
        `)}
        ${numberColumn(region)}
    `);
}

class SearchView extends HTMLElement {
    constructor() {
    super();
    this.style.display = "block";
    this.style.marginBottom = "16px";
    this.style.transition = "opacity 50ms ease";
    this.update();
    }

    update() {
    let root = d3.select(this);
    if (!this.regions || this.regions.length === 0) {
        this.innerHTML = `
        <div style="display:flex; flex:1; justify-content: center; margin-top: 40px">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotating feather-loader"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        </div>
        `;
    } else if (this.isSearching && this.query) {
        this.innerHTML = ``;
        this.style.opacity = "1";

        let searchResults = this._regions
        .filter(region => {
            return region.name.toLowerCase().indexOf(this.query.toLowerCase()) !== -1;
        })
        .sort((a, b) => {
            return b.population - a.population;
        })
        .slice(0, 20);
        this.appendListItems({target: root, regions: searchResults, addButton: true})
    
        root.append('div').attr('class', 'info').html(dataDisclaimer());
    } else {
        if (this.isSearching) {
        this.innerHTML = ``;
        let banner = root.append('div').attr('style', `
            padding: 0 0;
            margin-top: 0px;
        
        `).html(/*html*/`
            <div style="margin: 4px 0 16px 0; color: var(--colorSecondaryLabel); font-size: 20px; font-weight: 600;">You might be interested in</div>
        `);
        let regions = this._regions
            .filter(region => {
            return suggestedRegions.indexOf(region.path) !== -1 && !isRegionSelected(region.path)
            })
            .sort((a, b) => {
            return suggestedRegions.indexOf(a.path) - suggestedRegions.indexOf(b.path)
            })
            .slice(0, 5);
        this.appendListItems({target: banner, regions: regions, addButton: true})
        } else {
        //  this.style.opacity = "1";
        this.innerHTML = ``; 
        let selectedRegions = this._regions
            .filter(region => {
            return isRegionSelected(region.path)
            })
            .sort((a, b) => {
            return (a['last-cases'] / a.population) - (b['last-cases'] / b.population)
            });
        
        this.appendListItems({target: root, regions: selectedRegions});
        if (selectedRegions.length < 1) {

            let banner = root.append('div').attr('style', `
            padding: 0 0;
            text-align: center;
            `).html(/*html*/`
            <div style="margin: 32px 10% 12px 10%; font-size: 16px; font-weight: 600;">Create your own watchlist</div>
            <div style="margin: 0 10% 16px 10%; font-size: 16px; color: var(--colorSecondaryLabel)">Add regions to see daily COVID-19 cases per 100,000 residents.</div>
            <div style="margin: 0 0 16px 0; font-size: 16px; color: var(--colorBlue);cursor: pointer" onclick="trackEvent('click', 'button-addregion'); onSearchFocus(); document.querySelector('input').focus()">
                <svg style="transform:translateY(4px)" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                <span>Add region</span>
            </div>
            `);
        } else {
            if (selectedRegions.length < 2) {
            root.append('div').html(`
                <div style="margin: 32px 0; cursor:pointer; font-size: 14px;" onclick="onSearchFocus(); document.querySelector('input').focus()">
                <span style="color: var(--colorBlue)">Add one more?</span> Where do your family or friends live?
                </div>
            `);
            }
            root.append('div').attr('class', 'info').html(dataDisclaimer());
        }
    }

        


    }
    

    }

    appendListItems({target, regions = [], addButton = false}) {
    regions
        .forEach((region, i, list) => {
        appendListItem(target, region, addButton)
        })
    }


    set isSearching(value) {
    this._isSearching = value;
    this.update();
    }

    get isSearching() {
    return this._isSearching;
    }

    set query(value) {
    this._query = value;
    this.update();
    }

    get query() {
    return this._query;
    }

    set regions(value) {
    this._regions = value;
    this.update();
    }

    get regions() {
    return this._regions;
    }
}

customElements.define("search-view", SearchView);



class DetailView extends HTMLElement {
    constructor() {
    super();
    }

    drawChart(node, data) {
    const rightPadding = 30;
    const width = node.node().getBoundingClientRect().width - rightPadding;
    const height = width / 2.2;
    const color = 'currentColor';

    let svg = node.append("svg")
        .html("")
        .attr("width", width)
        .attr("height", height)

    let denominator = this.region.population / 100000;
    let values = data.map(d => parseInt(d['rolling_cases'], 10) / denominator);
    const scaleX = d3.scaleLinear().range([0, width]).domain([0, values.length-1]);
    const scaleY = d3.scaleLinear().range([height, 0]).domain([0, Math.max(10, d3.max(values))]);

    const scaleXBand = d3.scaleBand()
        .range([0, width/30])
        .padding(0)
        .align(1)
        .domain([0, d3.max(values)]);

    svg.append("g")
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(scaleY).tickValues(scaleY.ticks(4))) //.ticks(2)
        .call(g => g.selectAll(".tick text")
        .attr('style', 'fill:var(--colorSecondaryLabel)')
        .attr("transform", `translate(${width+37}, -7)`))
        .call(g => g.selectAll(".tick line")
        .attr('x2', width+rightPadding)
        .attr('color', 'var(--colorSecondaryLabel)')
        .attr('stroke-dasharray', 1)
        .attr('style', 'opacity:.8; stroke-width: .5px'))
        .call(g => g.selectAll(".domain").attr('stroke', 'transparent'))

    svg.append("g")
        .call(d3.axisBottom(scaleX).tickFormat(d => {
        let options = {day: 'numeric'};
        if (d === 0) options.month = "short";
        return `${dateParse(data[d].date).toLocaleString(undefined, options)}`;
        }).tickValues(scaleX.ticks(7)))
        .call(g => g.selectAll(".tick text")
        .attr('style', 'fill:var(--colorSecondaryLabel)')
        .attr("transform", `translate(0, ${height})`))
        .attr("text-anchor", "start")
        .call(g => g.selectAll(".tick line")
        .attr('y2', 0))
        .call(g => g.selectAll(".domain").attr('stroke', 'transparent'))
    
    svg
        .selectAll('rect')
        .data(values)
        .enter()
        .append("g")
        .attr("opacity", 1)
        .append("rect")
        .attr("x", function(d, i) { return scaleX(i); })
        .attr("y", function(d) { return scaleY(d); })
        .attr("fill", 'currentColor')
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", scaleXBand.bandwidth()*1.3)
        .attr("height", function(d) { return (height) - scaleY(d); });

    }

    update() {
    if (!this.region) {
        this.style.display = "none";
        return;
    }
    this.style.cssText = `
        padding: 0 0;
        display: block;
    `;

    let cases = Number((this._region['last-cases'] / this.region.population) * 100000).toFixed(1);
    let bigNumberStyle = /*css*/`
        font-size: 28px;
        font-weight: 600;
    `;
    let bigNumberCaptionStyle = /*css*/`
        font-size: 12px;
        color: var(--colorSecondaryLabel);
    `
    let numberWrapperStyle = /*css*/`
        display: flex; 
        flex-direction: row;
        border: 0.5px solid var(--colorSeparator);
        border-width: 0.5px 0 0.5px 0;
        padding: 16px 0;
        gap: 40px;
    `;
    let captionStyle = ``;
    
    let warningModule = /*html*/`
        <div style="display: flex; flex-direction: column;padding: 20px 0; border-bottom: 0.5px solid var(--colorSeparator)">
        <svg style="transform:translateY(-2px)" width="24" height="24" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.02051 2.52216C6.45587 1.82595 7.54427 1.82595 7.97963 2.52216L12.6326 9.96293C13.0679 10.6591 12.5237 11.5294 11.653 11.5294H2.34714C1.47642 11.5294 0.932221 10.6591 1.36758 9.96293L6.02051 2.52216ZM7.8266 9.43878C7.8266 9.89526 7.45655 10.2653 7.00007 10.2653C6.54359 10.2653 6.17354 9.89526 6.17354 9.43878C6.17354 8.9823 6.54359 8.61224 7.00007 8.61224C7.45655 8.61224 7.8266 8.9823 7.8266 9.43878ZM7.00007 4.47959C6.5674 4.47959 6.23829 4.8681 6.30942 5.29488L6.67927 7.51395C6.7054 7.67077 6.84109 7.78571 7.00007 7.78571C7.15905 7.78571 7.29474 7.67077 7.32087 7.51395L7.69072 5.29488C7.76185 4.8681 7.43274 4.47959 7.00007 4.47959Z" fill="#EAAF17"/>
        </svg>
        <div style="padding: 6px 0 0 0; font-size: 13px;">More than 10 new cases per 100,000 residents over a seven-day rolling average. 
            States like 
            <a target="_blank" href="https://covid19.nj.gov/faqs/nj-information/travel-and-transportation/which-states-are-on-the-travel-advisory-list-are-there-travel-restrictions-to-or-from-new-jersey">New Jersey</a>
            and
            <a target="_blank" href="https://coronavirus.health.ny.gov/covid-19-travel-advisory#restricted-states">New York</a>
            issue travel restrictions based on these criteria.
        </div>
        </div>
    `;
    let shareButton = `
        <div 
        onclick="navigator.share({title: 'COVID-19 Watchlist: ${this.region.name}', text: '', url: location.href})"
        style="cursor: pointer; margin-right: 6px;text-decoration: underline;font-size: 14px; font-weight: 600; display: inline-block;padding: 8px 12px; border-radius: 40px; ">
            Share
        </div>
    `;

    let removeButton = `<div 
        onclick="toggleRegion('${this._region.path}');detailView.update()"
        style="font-size: 14px;
        cursor: pointer;
        font-weight: 600;
        padding: 8px 12px;
        border-radius: 40px;
        background: transparent; 
        color: var(--colorLabel);
        border: 1px solid var(--colorSeparator);
        display: flex;
        align-items: center;">
        <svg style="margin-right: 8px" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Following
    </div>`;
    let addButton = `<div 
        onclick="trackEvent('click-button-detail-addtolist', '${this._region.path}'); toggleRegion('${this._region.path}');detailView.update()()"
        style="font-size: 14px;
        cursor: pointer;
        white-space: nowrap;
        font-weight: 600; display: inline-block;padding: 8px 12px;
        border-radius: 40px;background: var(--colorBlue); color: var(--colorBackground)">
        Add to watchlist
    </div>`;
    let addModule = `<div style="font-size: 14px; padding: 20px 0; text-align: center; border-bottom: 0.5px solid var(--colorSeparator)">
        Follow the regions you care about in a single list.
        <div 
        onclick="trackEvent('click-button-detail-addtolist', '${this._region.path}'); toggleRegion('${this._region.path}');detailView.update()()"
        style="font-size: 14px;
        margin-top: 12px;
        cursor: pointer;
        white-space: nowrap;
        font-weight: 600; display: inline-block;padding: 8px 12px;
        border-radius: 40px;
        background: var(--colorBlue); color: var(--colorBackground)">
        Add to your free watchlist
        </div>
        
        </div>`;
    this.innerHTML = /*html*/`
        <div style="position:-webkit-sticky; background: var(--colorBackground); display:flex; flex-direction: row; position: sticky; top: 0; padding: 16px 0 8px 0; display: flex; align-items: center">
        <div onClick="closeDetailView()" style="cursor: pointer; color: var(--colorBlue);font-weight: 600;font-size:14px;transform:translateX(-7px);height: 44px; flex: 1; display: flex; align-items: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Watchlist
        </div>
        ${iff(navigator.share, shareButton)}
    
        <div>
            ${isRegionSelected(this.region.path) ? removeButton : addButton}
        </div>
        </div>
        <div style="font-size: 30px; line-height: 1.1; margin-top: 32px; margin-bottom: 20px; font-weight: 700;">
        ${this._region.name}
        </div>
        <div style="padding-bottom: 20px; color: var(--colorSecondaryLabel); font-size: 13px; margin: -12px 0 0px 0">
        ${this.region.byline ? this.region.byline + ' · ' : ''}
        <svg xmlns="http://www.w3.org/2000/svg" style="position: relative; top: 2px" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        ${Number(this.region.population).toLocaleString()} residents
        </div>
        <div style="${numberWrapperStyle}">
        <div style="flex: 1; padding-right: 16px;">
            <div style="${captionStyle}">New cases</div>
            <div style="${bigNumberStyle}">${cases}</div>
            <div style="${bigNumberCaptionStyle}">Last 7 day average per 100,000 residents</div>
        </div>
        <div style="flex: 1">
            <div style="${captionStyle}">Last 30 days</div>
            <div style="${bigNumberStyle}">${changeNumber(this.region)}</div>
            <div style="${bigNumberCaptionStyle}">First and last 7 day averages compared</div>
        </div>
        </div>
        ${iff(isWarningRegion(this.region), warningModule)}
        ${isRegionSelected(this.region.path) ? '' : addModule}
        <div class="chart-view" style="padding: 20px 0;">
        </div>
        <div class="table-view" style="padding: 20px 0; border-bottom: 0.5px solid var(--colorSeparator)">
        <div onclick="detailView.drawTable()" style="display: flex; align-items: center; justify-content: space-between">
            <span>Show data</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>  
        </div>
        </div>
        <div class="related">
        <div style="margin: 16px 0 16px 0; color: var(--colorSecondaryLabel); font-size: 16px; font-weight: 500;">Similar case levels</div>
        </div>
        <div class="info">
        ${dataDisclaimer()}
        </div>
    `;

    let similar = searchView.regions
        .filter(d => d.name !== this.region.name)
        .filter(d => d.path.indexOf('us-co-') === -1)
        .filter(d => Math.abs(cases - (parseInt(d['last-cases'], 10) / parseInt(d['population'], 10) * 100000)) < 2)
        shuffleArray(similar)
        .slice(0, 3)
        .forEach(d => {
            appendListItem(d3.select('.related'), d, false)
        })

    d3.csv(`/data/${this.region.path}.csv`).then(data => {
        let options = { month: 'short', day: 'numeric' };
        d3.select('.chart-view').html(/*html*/`
        <div style="margin-bottom: 20px">
            ${dateParse(data[0].date).toLocaleString(undefined, options)} –
            ${dateParse(data[data.length - 1].date).toLocaleString(undefined, options)}
        </div>
        `)
        this.drawChart(d3.select('.chart-view'), data)

        d3.select('.chart-view svg').attr('class', this.region["change-cases"] < 0 ? 'isDown' : 'isUp')
        this.data = data;
    })

    }

    drawTable() {
    d3.select('.table-view')
        .html(
        `<table style="font-size: 13px; border-spacing: 0"><tr><td>Date</td><td>New cases</td><td>New cases (7 day avg)</td><td>New cases 7 day avg per 100k</td></tr>
        ${this.data.map(l => {
            return `<tr><td style="color:var(--colorSecondaryLabel);white-space: nowrap ">${l.date}</td><td>${l.cases}</td><td>${l['rolling_cases']}</td><td>${Number((l['rolling_cases'] / this.region.population) * 100000).toFixed(1)}</td></tr>`
        }).join('')}
        </table>`
        )
    }

    set region(value) {
    this._region = value;
    this.update();
    }

    get region() {
    return this._region;
    }
}
customElements.define("detail-view", DetailView);

class SparklineElement extends HTMLElement {
    constructor() {
    super();
    const width = this.getAttribute('width') ||  55;
    const height = this.getAttribute('height') || 24;
    const color = this.getAttribute('color') || 'currentColor';
    d3.csv(this.getAttribute('src')).then(data => {
        this.innerHTML = ''
        let svg = d3.select(this).append("svg")
        .html("")
        .attr("width", width)
        .attr("height", height)

        let values = data.map(d => parseInt(d['rolling_cases'], 10));
        const scaleX = d3.scaleLinear().range([0, width]).domain([0, values.length]);
        const scaleY = d3.scaleLinear().range([height, 0]).domain([
        d3.min(values), d3.max(values)
        ]);
        svg
        .datum(values)
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width",1.75)
        .attr("d", d3.line()
            .x(function(d, i) { 
                return scaleX(i);
            })
            .y(function(d) {  
                return scaleY(d)
            })
        )
    })
    }

}
customElements.define("spark-line", SparklineElement);



let didPushHistoryState = false;
const searchView = document.querySelector('search-view');
const detailView = document.querySelector('detail-view');
const selectedRegions = readSettings();
init();
    