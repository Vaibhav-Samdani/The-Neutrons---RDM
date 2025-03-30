from flask import Flask, request, jsonify
import requests
from datetime import datetime
from flask_cors import CORS
from datetime import datetime

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
    result = []
    if(len(data["features"]) == 0 ):
        return {"error": "No data found"}
    for eq in data['features']:
         place = eq['properties']["place"]
         mag = eq['properties']["mag"]
         time  = eq['properties']["time"]
         result.append({"place": place,"magnitude": mag,"time": time,})
    return result

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



# --------------------------- news scrapper -----------------------------------

import requests
import re
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

API_KEY = 'pub_7703057407b77e7247aa8d824037a4426c39b'
geolocator = Nominatim(user_agent="disaster-news-locator")

DISASTER_KEYWORDS = [
    'flood', 'earthquake', 'cyclone', 'tsunami', 'landslide', 'storm',
    'wildfire', 'heatwave', 'lightning', 'avalanche', 'drought',
    'monsoon', 'cloudburst'
]

SEVERITY_WORDS = [
    'killed', 'dead', 'death', 'rescue', 'damage', 'destroyed', 'evacuated', 'injured', 'missing', 'survivor'
]




def compute_relevance(text):
    text = text.lower()
    score = sum(text.count(word) for word in SEVERITY_WORDS)
    return score

# Try to extract disaster type
def detect_disaster_type(text):
    for keyword in DISASTER_KEYWORDS:
        if keyword in text.lower():
            return keyword
    return None

# Attempt to extract city or region from title
def extract_location(text):
    match = re.search(r'in ([A-Za-z\s]+)', text)
    return match.group(1).strip() if match else None

# Convert location to lat/lon
def get_coordinates(place):
    try:
        location = geolocator.geocode(place, timeout=5)
        if location:
            return (location.latitude, location.longitude)
    except GeocoderTimedOut:
        pass
    return (None, None)

def fetch_disaster_news():
    url = f'https://newsdata.io/api/1/news?apikey={API_KEY}&language=en&q=' \
          f'{"%20OR%20".join(DISASTER_KEYWORDS)}'

    response = requests.get(url)
    data = response.json()
    articles = data.get("results", [])
    result = []

        

    for article in articles:
        title = article.get('title', '')
        description = article.get('description') or ''
        text = title + " " + description
        disaster_type = detect_disaster_type(text)
        relevance_score = compute_relevance(text)
        # Filter out low relevance or irrelevant articles
        if disaster_type is None or relevance_score == 0:
            continue
        place = extract_location(text)
        lat, lon = get_coordinates(place) if place else (None, None)
        
        disc = {"title" : title, "link": article.get('link'), "pubDate": article.get('pubDate'), "disasterType": disaster_type}
        
        result.append(disc)
            
    return result     

    



@app.route("/api/news",methods=['GET'])
def get_news():
    result = fetch_disaster_news()
    return jsonify(result)






# Route to accept user input and process it
@app.route('/api/data', methods=['GET'])
def send_data():
    # Get the 'name' parameter from the request
    city = request.args.get('city', 'Myanmar') 
    # Return JSON response
    coordinates = get_lat_lon(city)
    fetch_data(city)
    fetch_earthquake_data(coordinates["latitude"],coordinates["longitude"],100)
    sendData["coordinates"] = coordinates
    sendData["city"]= city
    return jsonify(sendData)


if __name__ == '__main__':
    app.run(debug=True)
