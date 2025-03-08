# Hardware Resource Usage Analyzer

A **Next.js**-based web application for monitoring **CPU usage, memory usage, disk I/O, and network requests** in real-time. The application provides insights into hardware resource allocation and performance trends.

## Features 🚀
- **Real-time Resource Monitoring**: Track CPU, memory, and disk I/O usage dynamically.
- **Web Performance Analysis**: Analyze website performance by providing a URL.
- **Graphical Visualization**: Displays performance metrics using interactive charts.
- **Performance Advice**: Get automated recommendations based on the collected metrics.

## Installation & Setup 🛠️

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v16+ recommended)
- **Git**
- **A package manager** (npm or yarn)

### Clone the Repository
```sh
git clone https://github.com/RachitaPant/Hardware-Resource-Usage-Analyzer.git
cd Hardware-Resource-Usage-Analyzer
```

### Install Dependencies
```sh
npm install  # or yarn install
```

### Start the Development Server
```sh
npm run dev  # or yarn dev
```
Visit **http://localhost:3000** in your browser.

## API Usage 📡
### Analyze Website Performance
Endpoint: `POST /api/analyze`

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "performanceMetrics": {
    "cpuUsage": "45%",
    "memoryUsage": "2.5 GB",
    "diskIO": "150 MB/s"
  },
  "jsExecutionTime": 120,
  "networkRequests": [ ... ]
}
```

## Contribution 🤝
Contributions are welcome! Feel free to fork the repository and submit pull requests.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m "Added new feature"`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License 📜
This project is **MIT Licensed**. Feel free to modify and use it as needed!

## Contact 📧
For any issues or suggestions, reach out via [GitHub Issues](https://github.com/RachitaPant/Hardware-Resource-Usage-Analyzer/issues).
Made with ❤️ by Rachita Pant
