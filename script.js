// OPEN LINKS IN NEW TAB
const links = {
    init: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        let links = document.body.getElementsByTagName('a');
        
        for(let link of links) {
            link.addEventListener('click', this.open.bind(this))
        }
    },
    open: function() {
        chrome.tabs.create({
            url: this.getAttribute('href')
        });
        return false;
    }
}

// APP OPTIONS
const options = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },
    cacheDOM: function() {
        this.btn = document.querySelector('#setLocation');
        this.zip = document.querySelector('#zip');
    },
    bindEvents: function() {
        this.btn.addEventListener('click', this.saveLocation.bind(this))
    },
    saveLocation: function() {
        chrome.storage.sync.set({ zip: this.zip.value }, () => {
           console.log('set zip');
        });
    },
    getStoredData(key, fn) {
        chrome.storage.sync.get(key, result => {
            fn(result);
        });
    }
}

// APP SHIZZ
const apps = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.getApps();
    },
    cacheDOM: function() {
        this.nav = document.querySelector('.icons');
        this.btn = document.querySelector('.apps');
        this.apps = document.querySelector('#apps');
    },
    bindEvents: function() {
        this.btn.addEventListener('click', this.openPanel.bind(this));
        this.apps.addEventListener('click', this.launchApp.bind(this));
    },
    getApps: function() {
        chrome.management.getAll(data => {
            let html = data.map(app => {
                if(app.isApp && app.enabled) {
                    return this.createIcon(app);
                }
            }).join('');

            this.apps.innerHTML = html;
        });
    },
    createIcon: function(app) {
        let icon = app.icons.filter(function(icon) {
            return icon.size == 128;
        });
        return `<img class="icon" src='${icon[0].url}' data-appId='${app.id}'>`
    },
    openPanel: function() {
        let panel = this.apps.style;
        let nav = this.nav.style;
        panel.display = (panel.display == '') ? 'block' : '';
        nav.opacity = (panel.display == 'block') ? '1' : '';
    },
    launchApp: function(e) {
        if (e.target && e.target.className == 'icon') {
            chrome.management.launchApp(e.target.dataset.appid, () => {
                this.openPanel();
            });
        }
    }
}

// TIME
const time = {
    init: function() {
        this.cacheDOM();
        this.displayTime();
        this.updateTime();
    },
    cacheDOM: function() {
        this.time = document.querySelector('.time');
    },
    getTime: function() {
        let d = new Date();
        let hours = d.getHours();
        let mins = d.getMinutes();
        return `${hours}:${this.formatMins(mins)}`
    },
    formatMins: function(mins) {
        return (mins < 10) ? '0'+ mins : mins
    },
    displayTime: function() {
        this.time.innerText = this.getTime();
    },
    updateTime: function() {
        setInterval(this.displayTime.bind(this), 1000);
    }
 }

// SEARCHBAR
const searchBar = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },
    cacheDOM: function() {
        this.searchbar = document.querySelector('#search');
        this.close = document.querySelector('.times');
        this.open = document.querySelector('.mag');
        this.search = document.querySelector('.search');
    },
    bindEvents: function() {
        this.search.addEventListener('keyup', this.closeSearch.bind(this))
        this.searchbar.addEventListener('keyup', this.query.bind(this));
        this.close.addEventListener('click', this.closeSearch.bind(this));
        this.open.addEventListener('click', this.openSearch.bind(this));
    },
    query: function(e) {
        if(e.which == 13) {
            window.open(`http://www.google.com/search?q=${this.searchbar.value}`, '_self')
        }
    },
    openSearch: function() {
        this.search.style.opacity = '1';
        this.search.style.visibility = 'visible';

        //setTimeout to account for CSS opacity animation
        setTimeout(() => {
            this.searchbar.focus();
        }, 300);
    },
    closeSearch: function(e) {
        if(e.type == 'click' || e.which == 27) {
            this.search.style.opacity = '0';
            this.search.style.visibility = 'hidden';
        }
    }
}

// QUOTE
const quote = {
    quotes: [
        'Yesterday is not ours to recover, but tomorrow is ours to win or lose.',
        'Once you replace negative thoughts with positive ones, you\'ll start having positive results.',
        'If you are positive, you\'ll see opportunities instead of obstacles.',
        'Believe you can and you\'re halfway there.' 
    ],
    init: function() {
        this.cacheDOM();
        this.displayQuote();
    },
    cacheDOM: function() {
        this.quote = document.querySelector('.quote');
    },
    displayQuote: function() {
        let rand = Math.floor(Math.random() * this.quotes.length);
        this.quote.innerText = this.quotes[rand];
    }
}

// BACKGROUND SHIZZ
const background = {
    // Pick image from array of IDs? 9Y5Wk7favpE,Y-MGVIkpyFw
    url: `https://api.unsplash.com/search/photos?page=1&per_page=15&query=landscape&client_id=${keys.unsplash}`,
    init: function() {
        this.cacheDOM();
        this.fetchImage(this.url);
    },
    cacheDOM: function() {
        this.name = document.querySelector('.name');
    },
    fetchImage: function(url) {
        fetch(url)
        .then(response => {
            if (response.status !== 200) {
                console.log('Oops!');
                return;
            }
            response.json().then(data => {
                let rand = Math.floor(Math.random() * data.results.length);
                let img = data.results[rand].urls.regular;
                let name = data.results[rand].user.name;
                let userURL = data.results[rand].user.links.html;

                this.setImage(img);
                this.setUser(name, userURL);
            });
        });
    },
    setImage: function(url) {
        let style = document.body.style;
        style.backgroundImage = `url(${url})`;
        style.backgroundSize = 'cover';
        style.backgroundRepeat = 'no-repeat';
        
        let ss = document.styleSheets[2];
        ss.cssRules[13].style.background = `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)),url(${url})`;
        ss.cssRules[13].style.backgroundSize = 'cover';
    },
    setUser: function(name, url) {
        this.name.innerHTML = `<a href='${url}' target='_blank'>${name}</a>`;
    }
}

// CURRENT WEATHER
const weather = {
    url: `http://api.openweathermap.org/data/2.5/weather?appid=${keys.ow}&units=imperial`,
    init: function() {
        this.cacheDOM();
        this.getWeather();
    },
    cacheDOM: function() {
        this.weather = document.querySelector('.weather');
    },
    getLocation: function() {
        console.log('get location init')
        let data = navigator.geolocation.getCurrentPosition(this.getWeather.bind(this));

    },
    getWeather: function() {
        options.getStoredData('zip', data =>{
            if (!data.zip) return;

            options.zip.value = data.zip;
            let url = `${this.url}&zip=${data.zip}`;

            fetch(url)
            .then(res => {
                if (res.status !== 200) {
                    console.log('Oops!');
                    return;
                }

                res.json().then(data => {
                    console.log(data)
                    let temp = data.main.temp;
                    let conditions = data.weather[0].main;

                    this.weather.innerText = `${Math.round(temp)} °F, ${conditions}`;
                });
            });
        });
    }
}

// quote.init();
options.init();
apps.init();
weather.init();
time.init();
searchBar.init();
links.init();
background.init();
