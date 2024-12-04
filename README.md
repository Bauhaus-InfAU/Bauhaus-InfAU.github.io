# Score Checker

## Overview

Score Checker is a web-based tool designed for students to evaluate their answers for weekly tasks and questions. The app dynamically processes question data from a CSV file and provides an interface for task selection and answer validation. It is deployed on GitHub Pages for easy access.

## Features

Score Checker provides several key capabilities:

- **Dynamic Question Loading**: processes questions directly from a CSV file
- **Interactive UI**: enables selection of weeks, tasks, and question variants
- **Real-time Feedback**: validates answers and provides feedback
- **Responsive Design**: ensures functionality across all devices

## Access

The application is hosted on GitHub Pages and can be accessed directly via: [Score Checker Live ](https://bauhaus-infau.github.io/)

## Requirements

A modern web browser with JavaScript enabled
Internet connection to load the hosted CSV file

## File Structure

- index.html - Main HTML file defining the page structure
- styles.css - Stylesheet for design and UI
- app.js - JavaScript logic for data handling, UI updates, and answer validation
- course-questions.csv - CSV file containing question and answer data

## Setup for Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/score-checker.git
   cd score-checker 
   ```

2. Use a local server (e.g., Python HTTP server) to serve the files:
   ```bash
   python -m http.server
   ```

3. Open http://localhost:8000 in a browser.

## Usage

1. Visit the hosted page or open index.html via a server
2. Select Week: Choose a week to load related tasks
3. Select Task: Pick a task
4. Select Variant (if applicable): Choose a variant group for unique questions
5. Answer the Question: Input your responses
6. Check Answer: Submit your answer and receive feedback

## Feedback and Contributing

For issues or feature requests, create a GitHub issue or submit a pull request. Contributions are welcome.

## License
MIT License - Free to use and modify.
