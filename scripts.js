let map;
let markers = [];
let directionsService;
let directionsRenderer;
let autocomplete;
let trafficLayer; 

function initMap() {
  // Initialize the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
  });

  // Initialize Directions API
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

    // Initialize TrafficLayer
    trafficLayer = new google.maps.TrafficLayer();
 // Event listeners for show/hide traffic buttons
  document.getElementById("showTrafficButton").addEventListener("click", () => {
  trafficLayer.setMap(map); // Add traffic layer to the map
});

document.getElementById("hideTrafficButton").addEventListener("click", () => {
  trafficLayer.setMap(null); // Remove traffic layer from the map
});

  // Initialize Autocomplete for the search input
  const input = document.getElementById("locationSearch");
  autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);

  // Add event listener for the autocomplete search
  autocomplete.addListener("place_changed", handlePlaceSelection);

  // Event listener for saved locations button
  document.getElementById("savedButton").addEventListener("click", plotSavedLocations);

  // Event listener for calculate route button
  document.getElementById("calculateRoute").addEventListener("click", calculateRoute);

  // Event listener for refresh button
  document.getElementById("refreshButton").addEventListener("click", refreshMap);

  document.getElementById("currentLocationButton").addEventListener("click", showCurrentLocation);


  populateSavedLocationsDropdown();
}

function handlePlaceSelection() {
  const place = autocomplete.getPlace();
  if (!place.geometry) {
    alert("No details available for the selected location.");
    return;
  }

  // Add marker for the selected place
  addMarker(place.geometry.location, place.name || "Selected Location");
  map.setCenter(place.geometry.location);
  map.setZoom(15);

  document.getElementById("locationStatus").textContent = `Showing: ${place.name}`;

  // Ask user if they want to save the location
  const saveConfirmation = confirm(`Do you want to save this location: ${place.name}?`);
  if (saveConfirmation) {
    saveLocation(place.geometry.location);
  }
}

function showCurrentLocation() {
  // Check if Geolocation API is available
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = { lat: latitude, lng: longitude };

        // Add a marker for the current location
        addMarker(currentLocation, "My Current Location");
        map.setCenter(currentLocation);
        map.setZoom(15);

      },
      (error) => {
        console.error("Error fetching current location:", error);
        alert("Unable to fetch current location. Please ensure location services are enabled.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}


function saveLocation(latLng) {
  const timestamp = new Date().toISOString();
  const locationData = { lat: latLng.lat(), lng: latLng.lng(), timestamp, isFavorite: false };

  fetch("http://localhost:5000/saveLocation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Location saved successfully!");
      } else {
        alert("Error saving location!");
      }
    })
    .catch((err) => {
      console.error("Error saving location:", err);
    });
}

function plotSavedLocations() {
  fetch("http://localhost:5000/getLocations")
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        data.forEach((location) => {
          addMarker({ lat: location.lat, lng: location.lng }, `Saved at ${location.timestamp}`);
        });
      } else {
        alert("No saved locations found.");
      }
    })
    .catch((err) => console.error("Error fetching locations:", err));
}

function populateSavedLocationsDropdown() {
  fetch("http://localhost:5000/getLocations")
    .then((response) => response.json())
    .then((data) => {
      const dropdown = document.getElementById("savedLocations");
      dropdown.innerHTML = '<option value="">Select a location</option>'; // Reset dropdown options

      if (data.length > 0) {
        data.forEach((location) => {
          const option = document.createElement("option");
          option.value = `${location.lat},${location.lng}`;
          option.textContent = `Saved on: ${location.timestamp}`;
          dropdown.appendChild(option);
        });
      } else {
        alert("No saved locations found.");
      }
    })
    .catch((err) => console.error("Error fetching saved locations:", err));
}

document.getElementById("savedLocations").addEventListener("change", function () {
  const selectedValue = this.value;

  if (selectedValue) {
    const [lat, lng] = selectedValue.split(",").map(Number);
    const location = { lat, lng };

    // Add marker and center the map
    addMarker(location, "Saved Location");
    map.setCenter(location);
    map.setZoom(15);
  }
});


function addMarker(location, title) {
  const marker = new google.maps.Marker({
    position: location,
    map: map,
    title: title,
  });
  markers.push(marker);
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  document.getElementById("locationStatus").textContent = "All markers cleared.";
}

function calculateRoute() {
  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  if (!source || !destination) {
    alert("Please enter both source and destination.");
    return;
  }

  const request = {
    origin: source,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  directionsService.route(request, (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);
      const travelInfo = result.routes[0].legs[0];
      document.getElementById("travelInfo").textContent = `Travel Time: ${travelInfo.duration.text}, Distance: ${travelInfo.distance.text}`;
    } else {
      alert("Directions request failed due to " + status);
    }
  });
}

function refreshMap() {
  // Clear all markers
  clearMarkers();

  // Reset directions
  directionsRenderer.set("directions", null);

  // Reset location status and travel info
  document.getElementById("locationStatus").textContent = "Map refreshed.";
  document.getElementById("travelInfo").textContent = "";

  // Clear the search bar and source/destination fields
  document.getElementById("locationSearch").value = "";
  document.getElementById("source").value = "";
  document.getElementById("destination").value = "";

  // Reset the map to the default center
  map.setCenter({ lat: 51.5074, lng: -0.1278 });
  map.setZoom(12);
}