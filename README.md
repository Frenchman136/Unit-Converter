# Unit Converter

A responsive web app for converting between metric and imperial units with live updates, history, and theme support.

## Features
- Live conversion while typing
- Categories: Length, Weight, Volume, Temperature
- Swap conversion direction
- Decimal precision selector (2, 3, 4)
- Input validation (empty, invalid, negative where not allowed, very large values)
- Quick input chips (`1`, `10`, `100`)
- Copy result to clipboard
- Keyboard shortcuts:
  - `Enter` to convert
  - `Esc` to clear input
- Conversion history (up to 10 items)
- Light/Dark theme toggle
- Local storage persistence for settings and history

## Project Structure
- `index.html` - App layout and controls
- `styles.css` - Styling, responsive layout, themes
- `script.js` - Conversion logic, validation, state, events

## Run Locally
1. Open the `Unit Converter` folder.
2. Open `index.html` in your browser.

No build tools or dependencies are required.

## Notes
- Theme, history, last input, and preferences are saved in `localStorage`.
- Temperature allows negative values; other categories do not.

## Author
Copyright (c) 2026 Frenchman

