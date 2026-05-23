const express = require('express');
const app = express();
const port = 3001;

// Enable JSON parsing for incoming requests
app.use(express.json());

// Define a route handler for the root URL ('/')
app.get('/', (req, res) => {
  // Send a simple 'Hello World!' message as the response
  res.send('Hello World from test.js!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  // Log a message to the console indicating the server has started
  console.log(`Server started on port ${port}`);
});