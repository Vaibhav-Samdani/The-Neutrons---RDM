import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Search,
  Home,
  BookOpen,
  Users,
  Map,
  AlertCircle,
  Wind,
  Sun,
  Droplets,
  Thermometer,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Atom,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = "http://127.0.0.1:5000/api/data";

function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(data?.city);
  const weatherData = data?.weatherdata;
  const earthquakeData = data?.earthquakedata;
  const coordinates = data?.coordinates;
  const riskdata = data?.riskdata;
  const [inputValue, setInputValue] = useState("");
  const [position,setPosition] = useState([26.9154576,75.8189817]);

  if (loading) {
    return (
      <>
        <h1>Loading....</h1>
      </>
    );
  }

  const disasterRiskData = riskdata?.map((day) => ({
    rainAmount: day.rainAmount,
    date: day.date,
    floodRisk:
      day.floodRisk > 3 ? "High" : day.floodRisk > 2 ? "Medium" : "Low",
    heavyRainRisk: day.heavyRainRisk === 3 ? "High" : "Low",
    tsunamiRisk: day.tsunamiRisk === 2 ? "Possible" : "None",
    landslideRisk: day.rainrate > 0.4 && day.humidity > 25 ? "High" : "Low",
  }));

  const chartData = {
    labels: riskdata?.map((day) => day.date),
    datasets: [
      {
        label: "Flood Risk",
        data: riskdata?.map((risk) => risk.floodRisk),
        backgroundColor: "rgba(255, 206, 86, 0.5)",
      },
      {
        label: "Heavy Rain Risk",
        data: riskdata?.map((risk) => risk.heavyRainRisk),
        backgroundColor: "rgba(153, 102, 255, 0.5)",
      },
      {
        label: "Tsunami Risk",
        data: riskdata?.map((risk) => risk.tsunamiRisk),
        backgroundColor: "rgba(255, 159, 64, 0.5)",
      },
    ],
  };

  const handleSearch = () => {
    // Implement your search logic here
    console.log("Search button clicked");

    const url = `${API_URL}?city=${inputValue}`;
    axios
      .get(url)
      .then((response) => {
        setData(response.data);
        console.log(response.data);
        setCity(response.data.city);
        setPosition([response.data.coordinates.latitude,response.data.coordinates.longitude])
      })
      .catch((error) => console.error("Error fetching data:", error));

    console.log("Okaay");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Navigation */}
      <nav className="top-0 w-full p-4 text-white bg-blue-700 z-5000">
        <div className="container flex items-center justify-between mx-auto">
          <div className="flex items-center space-x-2">
            <Atom className="w-6 h-6" />
            <span className="text-xl font-bold">The Neutrons</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <BookOpen className="w-5 h-5" />
              <span>Survival Tips</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <Users className="w-5 h-5" />
              <span>About Us</span>
            </a>
          </div>
          <div></div>
        </div>
      </nav>

      {/* Recent Alerts Banner */}
      {/* <div className="p-3 mt-16 bg-red-100 z-1000">
        <div className="container flex items-center mx-auto text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="font-semibold">Recent Alerts:</span>
          <span className="ml-2">
            Flash flood warning in Downtown area - Take immediate precautions
          </span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="container grid grid-cols-12 gap-4 p-4 mx-auto">
        {/* Side Navigation - Fixed */}
        <div className="col-span-2">
          <div className="sticky p-4 bg-white rounded-lg shadow top-24">
            <h2 className="mb-4 font-bold">Quick Navigation</h2>
            <ul className="space-y-2">
              <li className="p-2 rounded cursor-pointer hover:bg-gray-100">
                Map
              </li>
              <li className="p-2 rounded cursor-pointer hover:bg-gray-100">
                Weather Data
              </li>
              <li className="p-2 rounded cursor-pointer hover:bg-gray-100">
                Disaster Risk Predication
              </li>
              <li className="p-2 rounded cursor-pointer hover:bg-gray-100">
                Disaster Risk Graph
              </li>
              <li className="p-2 rounded cursor-pointer hover:bg-gray-100">
                Earthquake
              </li>
            </ul>
          </div>
        </div>

        {/* Middle Section */}
        <div className="col-span-7 space-y-6">
          {/* Map Section */}
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="bg-gray-200 rounded-lg h-[400px] flex items-center justify-center">
              <MapContainer
                center={position}
                zoom={5}
                className="z-[-1]"
                style={{zIndex: "5", height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={position}>
                  <Popup>Default Location: Jaipur</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Disaster Risk Prediction */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold">Disaster Risk Prediction</h2>
            <div className="grid grid-cols-3 gap-4">
              {disasterRiskData?.map((day, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg shadow-sm bg-gray-50"
                >
                  <div className="mb-2 text-lg font-semibold">{day.date}</div>
                  <div className="space-y-2">
                    <div className={`p-2 rounded ${"bg-red-100 text-red-700"}`}>
                      Rain Amount: {day.rainAmount}
                    </div>

                    <div
                      className={`p-2 rounded ${
                        day.floodRisk === "High"
                          ? "bg-red-100 text-red-700"
                          : day.floodRisk === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Flood Risk: {day.floodRisk}
                    </div>

                    <div
                      className={`p-2 rounded ${
                        day.heavyRainRisk === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Heavy Rain Risk: {day.heavyRainRisk}
                    </div>
                    <div
                      className={`p-2 rounded ${
                        day.tsunamiRisk === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Tsunami Risk: {day.tsunamiRisk}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather Section */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold">
              3-Day Weather Forecast in {city}
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {weatherData?.map((day, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg shadow-sm bg-gray-50"
                >
                  <div className="mb-2 text-lg font-semibold">{day.date}</div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Sun className="w-5 h-5 mr-2 text-yellow-500" />
                      <span>{day.weather}</span>
                    </div>
                    <div className="flex items-center">
                      <Thermometer className="w-5 h-5 mr-2 text-red-500" />
                      <span>{day.temperature}°C</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="w-5 h-5 mr-2 text-blue-500" />
                      <span>Humidity: {day.humidity}%</span>
                    </div>
                    <div className="flex items-center">
                      <Wind className="w-5 h-5 mr-2 text-gray-500" />
                      <span>{day.windspeed} km/h</span>
                    </div>
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
                      <span>Rain: {day.rainrate} mm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disaster Statistics Chart */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold">Disaster Risk Analysis</h2>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  title: {
                    display: true,
                    text: "Disaster Risk Levels by Date",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 3,
                  },
                },
              }}
            />
          </div>

          {/* Recent Earthquake Data */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-bold">
              Latest Earthquake Information
            </h2>
            <div className="p-4 rounded-lg bg-gray-50">
              <EarthquakeBox earthquakeData={earthquakeData} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="col-span-3">
          <div className="sticky space-y-4 top-24">
            {/* Search Box */}
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  className="w-full py-2 pl-10 pr-4 border rounded-lg"
                />
                <Search
                  onClick={handleSearch}
                  className="absolute right-5 top-2.5 h-5 w-5 text-gray-400 cursor-pointer  hover:text-black"
                />
              </div>
            </div>

            {/* AQI Box */}
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Air Quality Index</h3>
                <Wind className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">65</div>
              <div className="text-sm text-gray-500">Moderate</div>
            </div>

            {/* Recent News */}
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="mb-3 font-bold">Recent Disaster News</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="pb-2 border-b last:border-b-0 last:pb-0"
                  >
                    <h4 className="font-semibold">Earthquake Update {item}</h4>
                    <p className="text-sm text-gray-600">
                      Latest updates on seismic activity...
                    </p>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-white bg-gray-800">
        <div className="container px-4 py-8 mx-auto">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h3 className="mb-4 text-xl font-bold">About Us</h3>
              <p className="text-gray-400">
                DisasterInfo provides real-time disaster monitoring and early
                warning systems to help communities stay safe and prepared.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  <span>info@disasterinfo.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>123 Safety Street, Secure City</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-blue-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-xl font-bold">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-blue-400">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="hover:text-blue-400">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="hover:text-blue-400">
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 mt-8 text-center border-t border-gray-700">
            <p className="text-gray-400">
              © 2025 DisasterInfo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const EarthquakeBox = ({ earthquakeData }) => {
  if (earthquakeData?.error === "No data found") {
    return <h1>No data found</h1>;
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-gray-600">Magnitude</div>
          <div className="text-2xl font-bold text-red-600">
            {earthquakeData?.magnitude}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-gray-600">Time</div>
          <div className="font-semibold">{earthquakeData?.time}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-gray-600">Location</div>
        <div className="flex items-center mt-1 font-semibold">
          <MapPin className="w-5 h-5 mr-2 text-gray-500" />
          {earthquakeData?.place}
        </div>
      </div>
    </>
  );
};

export default App;
