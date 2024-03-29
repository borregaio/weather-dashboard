// API keys
const apiKeyOpenCage = '067aae2211484d238b0cff439ab93db1';
const apiKeyOpenWeather = '91e283268747deb9c5dedf7f54029a13';

// jQuery selectors
const cityHistory = $('#history');
const searchButton = $('#search-button');
const searchInput = $('#search-input');
const clearButton = $('#clear-button');

// Local storage
let cityNames = JSON.parse(localStorage.getItem('cityNames')) || [];

// Fetch weather data function
function fetchWeatherData(searchValue) {
    // Convert city name to latitude/longitude
    const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchValue)}&key=${apiKeyOpenCage}`;

    fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const cityComponent = data.results[0].components.city;

                if (cityComponent && cityComponent.toLowerCase() === searchValue.toLowerCase()) {
                    const location = data.results[0].geometry;
                    const latitude = location.lat;
                    const longitude = location.lng;

                    // Use latitude/longitude to fetch city weather
                    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKeyOpenWeather}`;

                    return fetch(weatherApiUrl);
                } else {
                    console.error('City not recognized by the geocoding service');
                }
            } else {
                console.error('Error getting coordinates for the city');
            }
        })
        .then(weatherResponse => weatherResponse.json())
        .then(weatherData => {
            displayWeatherData(searchValue, weatherData);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Display today's weather function
function displayWeatherData(city, weatherData) {
    const today = dayjs();
    const todayInfo = $('#today').addClass('today').empty();

    const iconCode = weatherData.list[0].weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;

    const temperatureKelvin = weatherData.list[0].main.temp;
    const temperatureCelsius = (temperatureKelvin - 273.15).toFixed(0);

    const windCode = weatherData.list[0].wind.speed;

    const humidityCode = weatherData.list[0].main.humidity;

    todayInfo.append($('<h1>').text(city.charAt(0).toUpperCase() + city.slice(1)));
    todayInfo.append(' ');
    todayInfo.append($('<h4>').text(today.format('DD/MM/YYYY')));
    todayInfo.append(' ');
    todayInfo.append($('<img>').attr('src', iconUrl));
    todayInfo.append($('<p>').text('Temp: ' + temperatureCelsius + '°C'));
    todayInfo.append($('<p>').text('Wind: ' + windCode + 'KPH'));
    todayInfo.append($('<p>').text('Humidity: ' + humidityCode + '%'));

    // Display 5-day forecast
    const forecast = $('#forecast').empty();
    // Array with API index numbers for each day's information
    const indexArray = [7, 15, 23, 31, 39];

    forecast.append($('<h3>').text('5-Day Forecast:'));
    const container = $('<div>').addClass('container');
    const row = $('<div>').addClass('row justify-content-center');

    //Generate information divs for each day
    for (let i = 0; i < indexArray.length; i++) {
        const dayIndex = indexArray[i];
        const day = $('<div>').addClass('col-lg-2 col-sm-12 forecast');
        const dayh4 = $('<h4>');
        const dayDate = today.add(i + 1, 'day');
        const dayIcon = weatherData.list[dayIndex].weather[0].icon;
        const dayIconUrl = `http://openweathermap.org/img/wn/${dayIcon}.png`;
        const dayTemperatureKelvin = weatherData.list[dayIndex].main.temp;
        const dayTemperatureCelsius = (dayTemperatureKelvin - 273.15).toFixed(0);
        const dayWindCode = weatherData.list[dayIndex].wind.speed;
        const dayHumidityCode = weatherData.list[dayIndex].main.humidity;

        dayh4.text(dayDate.format('DD/MM/YYYY'));
        day.append(dayh4);
        day.append($('<img>').attr('src', dayIconUrl));
        day.append($('<p>').text('Temp: ' + dayTemperatureCelsius + '°C'));
        day.append($('<p>').text('Wind: ' + dayWindCode + 'KPH'));
        day.append($('<p>').text('Humidity: ' + dayHumidityCode + '%'));
        row.append(day);
    }

    container.append(row);
    forecast.append(container);
}

// Get local storage information to generate history buttons on page load
function initializeCityButtons() {
    for (const cityName of cityNames) {
        const newButton = $('<button>').addClass('btn btn-secondary').text(cityName.charAt(0).toUpperCase() + cityName.slice(1));
        newButton.on('click', function () {
            const clickedCity = $(this).text();
            fetchWeatherData(clickedCity);
        });
        cityHistory.append(newButton);
    }
}

// Function to initialize city buttons when the page loads
initializeCityButtons();

// Clear city history function
function clearCityHistory() {
    cityHistory.empty();
    localStorage.removeItem('cityNames');
    cityNames = [];
}

// Clear button click event 
clearButton.on('click', function (event) {
    event.preventDefault();
    clearCityHistory();
});

// Search button click event
searchButton.on('click', function (event) {
    event.preventDefault();
    const searchValue = searchInput.val().trim();

    // Check if searchValue is not empty
    if (searchValue !== '') {
        if (!cityNames.includes(searchValue)) {
            console.log('Before fetchWeatherData:', searchValue);
            fetchWeatherData(searchValue);

            // Add new buttons everytime a city is entered on the search box
            const newButton = $('<button>').addClass('btn btn-secondary').text(searchValue.charAt(0).toUpperCase() + searchValue.slice(1));
            newButton.on('click', function () {
                const clickedCity = $(this).text();
                console.log('Before fetchWeatherData (from button click):', clickedCity);
                fetchWeatherData(clickedCity);
            });

            // Append the new button and update local storage with city
            cityHistory.append(newButton);
            cityNames.push(searchValue);
            localStorage.setItem('cityNames', JSON.stringify(cityNames));
            searchInput.val('');
        }
    }
});