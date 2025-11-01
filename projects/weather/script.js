 let weather = {
	// public key lol :)
 	"apiKey": "1970ba83e8c0664dd1766339eba8d0fe",
 	fetchWeather: function(city){
 		fetch(
 			"https://api.openweathermap.org/data/2.5/weather?q="
 			+ city
 			+ "&units=metric&appid="
 			+ this.apiKey
 		)
 		.then((response) => response.json())
 		.then((data) => this.displayWeather(data));
 	},
 	displayWeather: function(data){
 		const {name} = data;

 		console.log(data);
 		const {country} = data.sys;
 		const {icon, description } = data.weather[0];
 		const {temp, humidity} = data.main;
 		const {speed} = data.wind;
 		// console.log(name,icon,description,temp,humidity,speed);        +country
 		document.querySelector(".city").innerText = "Weather in "+name+", "+country;
 		document.querySelector(".icon").src = "https://openweathermap.org/img/wn/"+icon+".png";
 		document.querySelector(".description").innerText = description;
 		document.querySelector(".temp").innerText = temp+"°C";
 		document.querySelector(".humidity").innerText = "Humidity: "+ humidity+"%";
 		document.querySelector(".wind").innerText = "Wind speed: "+speed+"km/h";
 		document.querySelector(".weather").classList.remove("loading");
 		document.body.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?"+description+"')"
 	},
 	search:function(){
 		this.fetchWeather(document.querySelector(".search-bar").value);
 	},
 };

let geocode = {
	reverseGeocode: function(latitude, longitude){
		var api_key = 'fa1b5df9e9084de09839a1bf737e20e5';
		// var latitude = 'l';
		// var longitude = '7.0';

		var api_url = 'https://api.opencagedata.com/geocode/v1/json'

		var request_url = api_url
		    + '?'
		    + 'key=' + api_key
		    + '&q=' + encodeURIComponent(latitude + ',' + longitude)
		    + '&pretty=1'
		    + '&no_annotations=1';

		  // see full list of required and optional parameters:
		  // https://opencagedata.com/api#forward

		var request = new XMLHttpRequest();
		request.open('GET', request_url, true);

		request.onload = function() {
		    // see full list of possible response codes:
		    // https://opencagedata.com/api#codes

		    // .components.city
			if (request.status === 200){ 
			      // Success!
			    var data = JSON.parse(request.responseText);
			    console.log(data.results[0].components);
			    if (typeof data.results[0].components.city === 'undefined') {	
			    	if (typeof data.results[0].components.town === 'undefined') {			    			    	
				    	if (typeof data.results[0].components.county === 'undefined') {
				    		if (typeof data.results[0].components.country === 'undefined') {
				    			weather.fetchWeather("brno");
				    		}else{
				    			// country
				    			console.log(data.results); // print the location
						    	weather.fetchWeather(data.results[0].components.country);
				    		}
				    	}else{
				    		// county
				    		console.log(data.results); // print the location
						    weather.fetchWeather(data.results[0].components.county);
				    	}
				    } else {
				    	// town
				    	console.log(data.results); // print the location
						weather.fetchWeather(data.results[0].components.town);
				    }
			    }else{
			    	// city
					console.log(data.results); // print the location
				    if (data.results[0].components.city == "Hlavní město Praha") {
				    	data.results[0].components.city = "Praha";
				    }
				    weather.fetchWeather(data.results[0].components.city);
				}
			    
			} else if (request.status <= 500){ 
			      // reached target server, but it returned an error
			                           
			    console.log("unable to geocode! Response code: " + request.status);
			    var data = JSON.parse(request.responseText);
			    console.log('error msg: ' + data.status.message);
			} else {
			    console.log("server error");
			}
		};

		request.onerror = function() {
		    // There was a connection error of some sort
		  console.log("unable to connect to server");        
		};

		request.send();  // make the request
	},
	getLocation: function(){
		function succes(data){
			geocode.reverseGeocode(data.coords.latitude, data.coords.longitude);
		}
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(succes, console.errror);
		}
		else{
			weather.fetchWeather("praha");
		}
	}
};

document.querySelector(".search button").addEventListener("click",function(){
	weather.search();
});
document.querySelector(".search-bar").addEventListener("keyup", function(event){
	if (event.key == "Enter"){
		weather.search();
	}
});
geocode.getLocation();