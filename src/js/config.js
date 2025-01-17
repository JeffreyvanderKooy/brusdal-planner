import dotenv from 'dotenv';
dotenv.config();

export const API_URL = 'https://maps.googleapis.com/maps/api/geocode';

export const API_KEY = process.env.API_KEY;

export const API_WAIT = 0.15;

export const DELAY_SEARCH_FILTER = 1000;

export const DELAY_LOADER_FADEOUT = 3000;

export const STANDARD_COORDS = { latitude: 51.505, longitude: -0.09 };

export const UPDATE_LOADBTN_MS = 250;

export const CANVAS_TOGGLE_DELAY_MS = 1000;
