# Brusdal Planner

Brusdal Planner is a web-based application that helps you visualize customers and deliveries on a map, turning raw data into structured JSON data. It leverages the Google Maps API for mapping, geocoding, and geoparsing to enhance user experience. The app also uses a local host for storage and a variety of libraries for front-end interactivity and smooth user interactions.

**Demo:** [Brusdal Planner Demo](https://brusdalplanner.netlify.app/)

## Key Features

- **Map Visualization**: Display customers and deliveries using the Google Maps API.
- **Data Structuring**: Convert raw delivery data into structured JSON format for easy processing.
- **Geocoding**: Use Google Maps Geoparsing API to get accurate location data.
- **Local Storage**: Store data locally on your system with the help of a local host setup.
- **Interactive UI**: Bootstrap for layout and styling, SweetAlert for enhanced user feedback, and JQuery for smooth interactions.

## Technologies Used

- **Google Maps API**: For map rendering, geocoding, and geoparsing.
- **Bootstrap**: For responsive and clean UI design.
- **JQuery**: To simplify DOM manipulation and event handling.
- **Parcel**: Bundler used for module bundling and asset management.
- **SweetAlert**: For stylish and customizable alerts.

## Installation

### Prerequisites

Before running the application, ensure that you have the following installed:

- **Node.js** (for managing dependencies and running Parcel)
- **Google Maps API Key** (you can obtain this from the Google Cloud Platform)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/brusdal-planner.git
   ```

2. Install dependencies:

   ```bash
   cd brusdal-planner
   npm install
   ```

3. Add your **Google Maps API key** in the appropriate file the config.js file

4. Run the app locally:

   ```bash
   npm run start
   ```

5. Open your browser and go to `http://localhost:1234` to view the application.

## Contributing

We welcome contributions! If you'd like to help improve Brusdal Planner, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to your branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
