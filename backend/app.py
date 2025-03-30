from flask import Flask, request, jsonify
import requests
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# apikey = "807064c1a5684ab3a6d150851252903";
apikey = "b1fab2921c2a4edaa6f80559232412"
sendData = {}
city = "Jaipur"
from geopy.geocoders import Nominatim

def isNearWaterBody(lat,lng):
    waterBodyRanges = [
        { "latMin": 84, "latMax": 60, "lngMin": -80, "lngMax": 20 },
        { "latMin": 65, "latMax": 65, "lngMin": 120, "lngMax": -80 },
        { "latMin": 30, "latMax": 60, "lngMin": 20, "lngMax": 120 },
        { "latMin": 65, "latMax": 90, "lngMin": -180, "lngMax": 180 },
        { "latMin": 5, "latMax": 20, "lngMin": 92, "lngMax": 100 }
    ]
    return any( range['latMin'] <= lat <= range['latMax'] and range['lngMin'] <= lng <= range['lngMax'] for range in waterBodyRanges)
    
def displayWeatherdata(data):
    forcasts = data["forecast"]["forecastday"]
    weatherData = []
    
    for day in forcasts:
        date_obj = datetime.strptime(day["date"], "%Y-%m-%d")
        date = date_obj.strftime("%d/%m/%Y") 
        avgtemp_c = day["day"]["avgtemp_c"]
        condition_text = day["day"]["condition"]["text"]
        avghumidity = day["day"]["avghumidity"]
        maxwind_kph = day["day"]["maxwind_kph"]
        totalprecip_mm = day["day"]["totalprecip_mm"]
        weatherData.append({"date":date,"temperature": avgtemp_c,"weather": condition_text,"humidity": avghumidity,"windspeed": maxwind_kph,"rainrate": totalprecip_mm}) 
    return weatherData

def displayRiskData(lat,lng,data):
    forecasts = data["forecast"]["forecastday"]
    riskData = []
    for day in forecasts:
        date_obj = datetime.strptime(day["date"], "%Y-%m-%d")
        date = date_obj.strftime("%d/%m/%Y") 
        rainAmount = day["day"]["totalprecip_mm"]
        floodRisk = 3 if rainAmount > 50 else 2 if rainAmount > 20 else 1
        heavyRainRisk = 3 if rainAmount > 20 else 1
        tsunamiRisk = 2 if isNearWaterBody(lat,lng) else 1
        riskData.append({
            "date": date,
            "rainAmount": rainAmount,
            "floodRisk": floodRisk,
            "heavyRainRisk": heavyRainRisk,
            "tsunamiRisk": tsunamiRisk,

        }) 
    return riskData


def get_lat_lon(location):
    geolocator = Nominatim(user_agent="geoapi")
    location_data = geolocator.geocode(location)

    if location_data:
        return {"latitude": location_data.latitude, "longitude": location_data.longitude}
    else:
        return {"error": "Location not found"}


def fetch_data(location_name = city):
    coordinates = get_lat_lon(location_name)
    if("error" in coordinates):
        return {"error": "Location not found"}
    
    latitude = coordinates["latitude"]
    longitude = coordinates["longitude"]
    
    
    
    # external_api_url = f'https://api.weatherapi.com/v1/forecast.json?key=${apikey}&q=${latitude},${longitude}&days=3'
    external_api_url = f'http://api.weatherapi.com/v1/forecast.json?key={apikey}&q={location_name}&days=3&aqi=yes&alerts=yes'

    try:
        # Fetch data from the external API
        response = requests.get(external_api_url)
        data = response.json()  # Convert response to JSON

        # Return the fetched data as JSON
        # return jsonify(data);
        sendData["weatherdata"] = displayWeatherdata(data)
        sendData["riskdata"] = displayRiskData(latitude, longitude,data)
        
    
    except Exception as e:
        print("error : ",e)
        return {"status": "error", "message": str(e)}

def displayEarthquakeData(data):
    if(len(data["features"]) == 0 ):
        return {"error": "No data found"}
    for eq in data['features']:
         place = eq['properties']["place"]
         mag = eq['properties']["mag"]
         time  = eq['properties']["time"]
         return {"place": place,"magnitude": mag,"time": time,}

def fetch_earthquake_data(lat, lng, maxRadiusKm=100):
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude={lat}&longitude={lng}&maxradiuskm={maxRadiusKm}"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)
        
        data = response.json()
        

        
        # print("Earthquake Data:", response.text)  # Display or process the data
        sendData["earthquakedata"] =  displayEarthquakeData(data)
    
    except requests.exceptions.RequestException as e:
        print("Error fetching earthquake data:", e)
        return {"error": "Failed to fetch earthquake data"}






# Route to accept user input and process it
@app.route('/api/data', methods=['GET'])
def send_data():
    # Get the 'name' parameter from the request
    city = request.args.get('city', 'Manipal') 
    # Return JSON response
    coordinates = get_lat_lon(city)
    fetch_data(city)
    fetch_earthquake_data(coordinates["latitude"],coordinates["longitude"],100)
    sendData["coordinates"] = coordinates
    sendData["city"]= city
    return jsonify(sendData)

@app.route('/', methods=['GET'])
def data():
    return jsonify({
"city": "Mandalay,Myanmar",
"coordinates": {
"latitude": 21.9596834,
"longitude": 96.0948743
},
"earthquakedata": {
"magnitude": 4.6,
"place": "12 km WNW of Mandalay, Burma (Myanmar)",
"time": 1743164516553
},
"riskdata": [
{
"date": "30/03/2025",
"floodRisk": 1,
"heavyRainRisk": 1,
"rainAmount": 0,
"tsunamiRisk": 1
},
{
"date": "31/03/2025",
"floodRisk": 1,
"heavyRainRisk": 1,
"rainAmount": 0,
"tsunamiRisk": 1
},
{
"date": "01/04/2025",
"floodRisk": 1,
"heavyRainRisk": 1,
"rainAmount": 0,
"tsunamiRisk": 1
}
],
"weatherdata": [
{
"date": "30/03/2025",
"humidity": 20,
"rainrate": 0,
"temperature": 33.4,
"weather": "Sunny",
"windspeed": 21.2
},
{
"date": "31/03/2025",
"humidity": 22,
"rainrate": 0,
"temperature": 33.6,
"weather": "Sunny",
"windspeed": 20.9
},
{
"date": "01/04/2025",
"humidity": 23,
"rainrate": 0,
"temperature": 33.2,
"weather": "Sunny",
"windspeed": 19.8
}
]
})

if __name__ == '__main__':
    app.run(debug=True)
