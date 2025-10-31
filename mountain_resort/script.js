let weather = {
    "apiKey": "1970ba83e8c0664dd1766339eba8d0fe",
    fetchWeather: function(city){
        fetch(
            "https://api.openweathermap.org/data/2.5/weather?q="
            + city
            + "&units=metric&appid="
            + this.apiKey
        )
        .then((response) => {
            if (!response.ok) {
                // Log the status and throw an error for better debugging
                console.error("Weather API response not OK:", response.status, response.statusText);
                throw new Error("No weather found for this city.");
            }
            return response.json();
        })
        .then((data) => this.displayWeather(data))
        .catch((error) => {
            console.error("Error fetching weather:", error);
            // Optionally, display an error message on the page
            document.querySelector(".city").innerText = "Weather unavailable";
            document.querySelector(".temp").innerText = "--°C";
            document.querySelector(".wind").innerText = "--km/h";
            document.querySelector(".icon").src = ""; // Clear icon
        });
    },
    displayWeather: function(data){
        const {name} = data;
        const {country} = data.sys;
        const {icon} = data.weather[0]; // Removed description as it's not used in HTML currently
        const {temp} = data.main; // Removed humidity as it's not used in HTML currently
        const {speed} = data.wind;
             
        let temperature = Math.round(temp); // Changed variable name to avoid conflict with `temp` in the object
        
        document.querySelector(".city").innerText = "Weather in "+name+", "+country;
        document.querySelector(".icon").src = "https://openweathermap.org/img/wn/"+icon+".png";
        document.querySelector(".temp").innerText = temperature+"°C";
        document.querySelector(".wind").innerText = "Wind speed: "+speed+" km/h"; // Corrected units
    },
    // The search function is not directly used in the provided HTML for an input field,
    // but kept here for potential future use if a search bar is added.
    search:function(){
        // Assuming a search bar with class .search-bar exists
        // this.fetchWeather(document.querySelector(".search-bar").value);
    },
};

// Initialize weather for Szklarska Poręba on page load
weather.fetchWeather("Szklarska Poręba");

// Defer the script execution in HTML by adding 'defer' attribute to script tag.
// This ensures the DOM is fully loaded before the script runs.