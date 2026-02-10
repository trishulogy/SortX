# SortX

<div align="center">

**High-Performance Sorting Algorithm Visualizer**

[![License: MIT](https://img.shields.io/badge/License-MIT-00ff41.svg)](https://opensource.org/licenses/MIT)



*A cyberpunk-themed, real-time sorting algorithm visualization engine*

</div>

---

## Overview

SortX is a high-performance, browser-based sorting algorithm visualizer designed for educational purposes and algorithm analysis. Built with vanilla JavaScript and HTML5 Canvas, it features a distinctive cyberpunk aesthetic with real-time audio feedback, dual-view comparison mode, and comprehensive performance metrics.

**Live Demo:** Open [SortX](https://sortx-silk.vercel.app/) in any modern browser

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **12 Sorting Algorithms** | From Bubble Sort to Bogo Sort, covering all major complexity classes |
| **Dual View Modes** | Single algorithm focus or side-by-side comparison mode |
| **Real-time Metrics** | Live tracking of time, comparisons, and array accesses |
| **Audio Engine** | Web Audio API-powered sonification of sorting operations |
| **Manual Data Input** | CSV input support for custom datasets |
| **Responsive Design** | Adaptive canvas rendering for any viewport size |
| **Scanline Effects** | CRT monitor aesthetic with CSS overlay effects |

### Implemented Algorithms

| Algorithm | Time (Avg) | Space | Stability |
|-----------|-----------|-------|-----------|
| **Quick Sort** | O(n log n) | O(log n) | No |
| **Merge Sort** | O(n log n) | O(n) | Yes |
| **Heap Sort** | O(n log n) | O(1) | No |
| **Shell Sort** | O(n log n) | O(1) | No |
| **Comb Sort** | O(n²/2^p) | O(1) | No |
| **Cocktail Sort** | O(n²) | O(1) | Yes |
| **Radix Sort (LSD)** | O(nk) | O(n+k) | Yes |
| **Bucket Sort** | O(n+k) | O(n+k) | Yes |
| **Insertion Sort** | O(n²) | O(1) | Yes |
| **Selection Sort** | O(n²) | O(1) | No |
| **Bubble Sort** | O(n²) | O(1) | Yes |
| **Bogo Sort** | O(∞) | O(1) | No |

---

## Installation

No build process required. SortX is a standalone HTML application.

```bash
# Clone or download the repository
git clone https://github.com/TejashweenKumar/sortx.git

# Navigate to directory
cd sortx

# Open in browser (or simply double-click the file)
open sortX.html        # macOS
xdg-open sortX.html    # Linux
start sortX.html       # Windows
