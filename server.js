const express = require('express');
const cors = require('cors'); // Import the cors package
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Allow CORS from any origin (you can restrict it to specific origins for more security)
app.use(cors());

// Parse incoming JSON requests
app.use(bodyParser.json());

// MongoDB connection setup (ensure your MongoDB is running)
mongoose.connect('mongodb://localhost/mapPulse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error: ", err));

// Define the location schema and model
const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  timestamp: String,
  isFavorite: Boolean,
});

const Location = mongoose.model('Location', locationSchema);

// POST endpoint for saving a location
app.post('/saveLocation', (req, res) => {
  const { lat, lng, timestamp, isFavorite } = req.body;

  const newLocation = new Location({ lat, lng, timestamp, isFavorite });

  newLocation.save()
    .then(savedLocation => {
      res.json({ success: true, data: savedLocation });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: 'Error saving location', error: err });
    });
});

// GET endpoint to fetch all saved locations
app.get('/searchLocation', (req, res) => {
  const query = req.query.query.trim(); // Get the query parameter
  const coords = query.split(','); // Split the input string by the comma
  let lat = parseFloat(coords[0]);
  let lng = parseFloat(coords[1]);

  // Check if both latitude and longitude are provided
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Invalid format. Please enter "latitude,longitude".' });
  }

  // Search the database by latitude and longitude
  Location.findOne({ lat: lat, lng: lng })
    .then(location => {
      if (location) {
        res.json({ success: true, data: location });
      } else {
        res.json({ success: false, message: 'Location not found.' });
      }
    })
    .catch(err => {
      res.status(500).json({ success: false, message: 'Error searching locations', error: err });
    });
});

app.get('/getLocations', (req, res) => {
  Location.find()
    .then(locations => res.json(locations))
    .catch(err => {
      res.status(500).json({ success: false, message: 'Error fetching locations', error: err });
    });
});



app.put('/updateLocation/:id', (req, res) => {
  const { id } = req.params;
  const { isFavorite } = req.body;

  Location.findByIdAndUpdate(id, { isFavorite }, { new: true })
    .then(updatedLocation => {
      res.json({ success: true, data: updatedLocation });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: 'Error updating location', error: err });
    });
});


app.delete('/deleteLocation/:id', (req, res) => {
  const { id } = req.params;

  Location.findByIdAndDelete(id)
    .then(() => {
      res.json({ success: true, message: 'Location deleted successfully' });
    })
    .catch(err => {
      res.status(500).json({ success: false, message: 'Error deleting location', error: err });
    });
});


// Start the server
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
