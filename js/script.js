const app = {
  init: function() {
    options.init()
    apps.init()
    weather.init()
    time.init()
    searchBar.init()
    links.init()
    background.init()
  }
}

// OPEN LINKS IN NEW TAB
const links = {
  init: function() {
    this.bindEvents()
  },
  bindEvents: function() {
    let links = document.body.getElementsByTagName('a')

    for (let link of links) {
      link.addEventListener('click', this.open.bind(this))
    }
  },
  open: function() {
    chrome.tabs.create({
      url: this.getAttribute('href')
    })
    return false
  }
}

// APP OPTIONS
const options = {
  hidden: true,
  init: function() {
    this.cacheDOM()
    this.bindEvents()
    this.onLoad()
  },
  cacheDOM: function() {
    this.btn = document.querySelector('#setLocation')
    this.cog = document.querySelector('.cog')
    this.zip = document.querySelector('#zip')
    this.timeInputs = document.querySelectorAll('#time input')
    this.settingsPanel = document.querySelector('.settings')
    this.ok = document.querySelector('.ok')
    this.panelBtns = document.querySelectorAll('.openPanel')
    this.panels = document.querySelectorAll('.panel')
  },
  bindEvents: function() {
    this.btn.addEventListener('click', this.saveLocation.bind(this))
    this.timeInputs.forEach(input => {
      input.addEventListener('change', this.setTimeFormat.bind(this))
    })
    this.cog.addEventListener('click', this.toggleSettings.bind(this))
    this.ok.addEventListener('click', this.toggleSettings.bind(this))
    this.panelBtns.forEach(btn =>
      btn.addEventListener('click', this.togglePanel)
    )
    document.addEventListener('click', this.closePanel.bind(this))
  },
  onLoad: function() {
    this.getStoredData('time', data => {
      if (!data.time) return

      for (let input of this.timeInputs) {
        if (input.id == data.time) {
          input.checked = true
        }
      }
    })
  },
  setTimeFormat: function() {
    for (let input of this.timeInputs) {
      if (input.checked) {
        this.saveData('time', input.value)
        time.display()
      }
    }
  },
  saveData: function(key, val) {
    chrome.storage.sync.set({ [key]: val }, () => {
      console.log('saved: ', key, val)
    })
  },
  saveLocation: function() {
    chrome.storage.sync.set({ zip: this.zip.value }, () => {
      weather.display()
    })
  },
  getStoredData: function(key, fn) {
    chrome.storage.sync.get(key, result => {
      fn(result)
    })
  },
  toggleSettings: function() {
    let panel = this.settingsPanel.style
    if (this.hidden) {
      panel.transform = 'translateX(0)'
      this.hidden = false
    } else {
      panel.transform = 'translateX(-260px)'
      this.panels.forEach(panel => (panel.style.maxHeight = '0px'))

      this.hidden = true
    }
  },
  togglePanel: function() {
    let panel = this.parentNode.children[1]
    panel.style.maxHeight =
      panel.style.maxHeight == '0px' || panel.style.maxHeight == ''
        ? '500px'
        : '0px'
  },
  closePanel: function(e) {
    if (
      !this.settingsPanel.contains(e.target) &&
      !e.target.classList.contains('cog')
    ) {
      let panel = this.settingsPanel.style
      panel.transform = 'translateX(-260px)'
      this.panels.forEach(panel => (panel.style.maxHeight = '0px'))
      this.hidden = true
    }
  }
}

// APP SHIZZ
const apps = {
  init: function() {
    this.cacheDOM()
    this.bindEvents()
    this.getApps()
  },
  cacheDOM: function() {
    this.nav = document.querySelector('.icons')
    this.btn = document.querySelector('.apps')
    this.apps = document.querySelector('#apps')
  },
  bindEvents: function() {
    this.btn.addEventListener('click', this.togglePanel.bind(this))
    this.apps.addEventListener('click', this.launchApp.bind(this))
    document.addEventListener('click', this.closePanel.bind(this))
  },
  getApps: function() {
    chrome.management.getAll(data => {
      let html = data
        .map(app => {
          if (app.isApp && app.enabled) {
            return this.createIcon(app)
          }
        })
        .join('')

      this.apps.innerHTML = html
    })
  },
  createIcon: function(app) {
    let icon = app.icons.filter(function(icon) {
      return icon.size == 128
    })
    return `<img class="icon" src='${icon[0].url}' data-appId='${app.id}'>`
  },
  togglePanel: function() {
    let panel = this.apps.style
    let nav = this.nav.style
    panel.display = panel.display == '' ? 'block' : ''
    nav.opacity = panel.display == 'block' ? '1' : ''
  },
  closePanel: function(e) {
    if (!this.apps.contains(e.target) && !e.target.classList.contains('apps')) {
      let panel = this.apps.style
      let nav = this.nav.style
      panel.display = ''
      nav.opacity = ''
    }
  },
  launchApp: function(e) {
    if (e.target && e.target.className == 'icon') {
      chrome.management.launchApp(e.target.dataset.appid, () => {
        this.openPanel()
      })
    }
  }
}

// TIME
const time = {
  init: function() {
    this.cacheDOM()
    this.display()
    this.updateTime()
  },
  cacheDOM: function() {
    this.time = document.querySelector('.time')
  },
  getTime: function(fn) {
    options.getStoredData('time', data => {
      let format
      let d = new Date()
      let hours = d.getHours()
      if (data.time) {
        format = data.time
      } else {
        for (let input of options.timeInputs) {
          if (input.checked) {
            format = input.checked.value
          }
        }
      }
      let hrsFormat = format == '12hr' ? this.convertTo12(hours) : hours
      let mins = d.getMinutes()

      fn(`${hrsFormat}:${this.formatMins(mins)}`)
    })
  },
  convertTo12: function(hr) {
    let h = hr % 12
    if (h === 0) h = 12
    return h
  },
  formatMins: function(mins) {
    return mins < 10 ? '0' + mins : mins
  },
  display: function() {
    this.getTime(time => {
      this.time.innerText = time
    })
  },
  updateTime: function() {
    let update = setInterval(this.display.bind(this), 1000)
  }
}

// SEARCHBAR
const searchBar = {
  init: function() {
    this.cacheDOM()
    this.bindEvents()
  },
  cacheDOM: function() {
    this.searchbar = document.querySelector('#search')
    this.close = document.querySelector('.times')
    this.open = document.querySelector('.mag')
    this.search = document.querySelector('.search')
  },
  bindEvents: function() {
    this.search.addEventListener('keyup', this.closeSearch.bind(this))
    this.searchbar.addEventListener('keyup', this.query.bind(this))
    this.close.addEventListener('click', this.closeSearch.bind(this))
    this.open.addEventListener('click', this.openSearch.bind(this))
  },
  query: function(e) {
    if (e.which == 13) {
      window.open(
        `http://www.google.com/search?q=${this.searchbar.value}`,
        '_self'
      )
    }
  },
  openSearch: function() {
    this.search.style.opacity = '1'
    this.search.style.visibility = 'visible'

    //setTimeout to account for CSS opacity animation
    setTimeout(() => {
      this.searchbar.focus()
    }, 300)
  },
  closeSearch: function(e) {
    if (e.type == 'click' || e.which == 27) {
      this.search.style.opacity = '0'
      this.search.style.visibility = 'hidden'
    }
  }
}

// BACKGROUND SHIZZ
const background = {
  ids: [
    '9Y5Wk7favpE',
    'Y-MGVIkpyFw',
    'dVFiG8RL99E',
    'Defzr230Q7I',
    'i2KibvLYjqk',
    '2XfDYMK9cSE',
    '1JHzqk5oTy8',
    'Jztmx9yqjBw',
    'eKU3JGNCCMg',
    'xJ2tjuUHD9M',
    'upXoQv5GAr8'
  ],
  init: function() {
    this.cacheDOM()
    this.fetchImage()
  },
  cacheDOM: function() {
    this.name = document.querySelector('.name')
    this.searchBg = document.querySelector('.search-bg')
  },
  fetchImage: function() {
    let rand = Math.floor(Math.random() * this.ids.length)
    let url = `https://api.unsplash.com/photos/${this.ids[rand]}?client_id=${
      keys.unsplash
    }`
    fetch(url).then(response => {
      if (response.status !== 200) {
        console.log('Oops!')
        return
      }
      response.json().then(data => {
        let img = data.urls.regular
        let name = data.user.name
        let link = data.user.links.html

        this.setImage(img)
        this.setUser(name, link)
      })
    })
  },
  setImage: function(url) {
    let styles = {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat'
    }

    let gradient = {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)),url(${url})`
    }

    let mainStyles = document.body.style
    let searchStyles = this.searchBg.style

    Object.assign(mainStyles, styles)
    Object.assign(searchStyles, styles, gradient)
  },
  setUser: function(name, url) {
    this.name.innerHTML = `<a href='${url}' target='_blank'>${name}</a>`
  }
}

// CURRENT WEATHER
const weather = {
  url: `http://api.openweathermap.org/data/2.5/weather?appid=${
    keys.ow
  }&units=imperial`,
  init: function() {
    this.cacheDOM()
    this.display()
  },
  cacheDOM: function() {
    this.weather = document.querySelector('.weather')
  },
  getLocation: function() {
    console.log('get location init')
    let data = navigator.geolocation.getCurrentPosition(
      this.getWeather.bind(this)
    )
  },
  getWeather: function(fn) {
    options.getStoredData('zip', data => {
      if (!data.zip) return

      options.zip.value = data.zip
      let url = `${this.url}&zip=${data.zip}`

      fetch(url).then(res => {
        if (res.status !== 200) {
          console.log('Oops!')
          return
        }

        res.json().then(data => {
          let iconId = data.weather[0].icon
          let temp = data.main.temp

          let weather = {
            icon: this.getIcon(iconId),
            temp: Math.round(data.main.temp)
          }

          fn(weather)
        })
      })
    })
  },
  getIcon: function(id) {
    switch (id) {
      case '01d':
        return '<i class="wi wi-day-sunny"></i>'
      case '01n':
        return '<i class="wi wi-night-clear"></i>'

      case '02d':
      case '02n':
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return '<i class="wi wi-cloudy"></i>'

      case '09d':
      case '09n':
      case '10d':
      case '10n':
        return '<i class="wi wi-showers"></i>'

      case '11d':
        return '<i class="wi wi-thunderstorm"></i>'

      case '13d':
      case '13n':
        return '<i class="wi wi-snowflake-cold"></i>'

      case '50d':
      case '50n':
        return '<i class="wi-fog"></i>'
    }
  },
  display: function() {
    this.getWeather(data => {
      this.weather.innerHTML = `${data.icon} ${data.temp}°`
    })
  }
}

app.init()
