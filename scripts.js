let map;
let markers = [];
let directionsService;
let directionsRenderer;
let autocomplete;

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
