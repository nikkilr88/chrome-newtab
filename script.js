// OPEN LINKS IN NEW TAB
const links = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        let links = document.body.getElementsByTagName('a');
        
        for(link of links) {
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

// SEARCHBAR
const searchBar = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM: function() {
        this.searchbar = document.querySelector('#search');
    },

    bindEvents: function() {
        this.searchbar.addEventListener('keyup', this.query.bind(this));
    },

    query: function(e) {
        if(e.which == 13) {
            window.open(`http://www.google.com/search?q=${this.searchbar.value}`, '_self')
        }
    }
}

// BACKGROUND SHIZZ
const background = {
    url: `https://api.unsplash.com/search/photos?page=1&query=landscape&client_id=${keys.unsplash}`,

    init: function() {
        this.cacheDOM();
        this.fetchImage(this.url);
    },

    cacheDOM: function() {
        this.name = document.querySelector('.name');
    },

    fetchImage: function(url) {
        fetch(url)
            .then(function (response) {
                if (response.status !== 200) {
                    console.log('Oops!');
                    return;
                }
                response.json().then(function(data) {
                    console.log(data.results)
                    let rand = Math.floor(Math.random() * data.results.length);
                    let img = data.results[rand].urls.regular;
                    let name = data.results[rand].user.name;
                    let userURL = data.results[rand].user.links.html;

                    this.setImage(img);
                    this.setUser(name, userURL);
                }.bind(this));
            }.bind(this));
    },

    setImage: function(url) {
        let style = document.body.style;
        style.backgroundImage = `url(${url})`;
        style.backgroundSize = 'cover';
        style.backgroundRepeat = 'no-repeat';
    },

    setUser: function(name, url) {
        this.name.innerHTML = `<a href='${url}' target='_blank'>${name}</a>`;
    }
}

searchBar.init();
links.init();
background.init();
