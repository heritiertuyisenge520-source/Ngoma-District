// Root server entry point for Render deployment
// This file runs the compiled backend from the Backend folder

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Backend', '.env') });

// Change to Backend directory and run the compiled server
process.chdir(path.join(__dirname, 'Backend'));
require(path.join(__dirname, 'Backend', 'dist', 'index.js'));

