/* --- AUDIO ENGINE --- */
    const AudioEngine = {
        ctx: null, gain: null, enabled: false,
        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.gain = this.ctx.createGain();
                this.gain.gain.value = 0.05;
                this.gain.connect(this.ctx.destination);
            }
        },
        play(valRatio) {
            if (!this.enabled || !this.ctx) return;
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200 + (valRatio * 600), this.ctx.currentTime);
            osc.connect(this.gain);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        }
    };

    function toggleSound() {
        AudioEngine.enabled = !AudioEngine.enabled;
        if(AudioEngine.enabled) AudioEngine.init();
        document.getElementById('btnSound').classList.toggle('on', AudioEngine.enabled);
    }

    /* --- GLOBAL STATE --- */
    const STATE = {
        array: [],
        mode: 'single',
        running: false,
        stopSignal: false,
        speed: 85,
        instances: { A: null, B: null }
    };

    /* --- VISUALIZER ENGINE --- */
    class Visualizer {
        constructor(canvasId, array) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.array = [...array];
            this.states = new Array(array.length).fill(0);
            this.resize();
            this.resizeHandler = () => this.resize();
            window.addEventListener('resize', this.resizeHandler);
        }

        resize() {
            const parent = this.canvas.parentElement;
            if (parent.clientWidth > 0 && parent.clientHeight > 0) {
                this.canvas.width = parent.clientWidth;
                this.canvas.height = parent.clientHeight;
                this.draw();
            }
        }

        update(newArr, indices = [], stateType = 0) {
            this.array = newArr;
            for(let i=0; i<this.states.length; i++) {
                if(this.states[i] !== 3) this.states[i] = 0;
            }
            indices.forEach(i => { if(i >= 0 && i < this.states.length) this.states[i] = stateType });
            this.draw();
        }

        markSorted(index) {
            if(index >= 0 && index < this.states.length) {
                this.states[index] = 3;
                this.draw();
            }
        }

        draw() {
            const w = this.canvas.width;
            const h = this.canvas.height;
            if (w === 0 || h === 0) return;
            this.ctx.clearRect(0, 0, w, h);

            const len = this.array.length;
            const barW = w / len;
            const maxVal = Math.max(...STATE.array, 10);
            const bottomPadding = 2;
            const availableHeight = h - bottomPadding;

            for(let i = 0; i < len; i++) {
                const val = this.array[i];
                let barHeight = (val / maxVal) * availableHeight;
                if (barHeight < 3) barHeight = 3;

                const x = i * barW;
                const y = h - barHeight - bottomPadding;

                let fill = '#00ff41'; // Green
                let glow = false;

                if (this.states[i] === 1) { fill = '#ff2a2a'; glow = true; } // Compare
                else if (this.states[i] === 2) { fill = '#00f0ff'; glow = true; } // Swap
                else if (this.states[i] === 3) { fill = '#ffffff'; glow = true; } // Sorted
                else {
                    const hue = 120 + (val/maxVal) * 30; 
                    fill = `hsl(${hue}, 100%, 50%)`;
                }

                this.ctx.fillStyle = fill;
                this.ctx.shadowBlur = glow ? 15 : 0;
                this.ctx.shadowColor = fill;
                
                const width = barW > 2 ? barW - 0.5 : barW;
                this.ctx.fillRect(x, y, width, barHeight);
            }
        }
    }

    /* --- UI CONTROLS --- */
    window.onload = () => { randomize(); };

    function updateSizeUI(val) {
        document.getElementById('valSize').innerText = val;
        if(!STATE.running) randomize();
    }

    function updateSpeedUI(val) {
        STATE.speed = parseInt(val);
        document.getElementById('valSpeed').innerText = val > 90 ? "Inst" : val > 50 ? "Fast" : "Slow";
    }

    function setMode(mode) {
        if(STATE.running) return;
        STATE.mode = mode;
        document.getElementById('btnSingle').classList.toggle('active', mode === 'single');
        document.getElementById('btnCompare').classList.toggle('active', mode === 'compare');
        
        const bElements = [document.getElementById('vpB'), document.getElementById('groupAlgoB')];
        if (mode === 'compare') {
            bElements.forEach(el => el.classList.remove('hidden'));
            if(!STATE.instances.B) STATE.instances.B = new Visualizer('canvasB', STATE.array);
            requestAnimationFrame(() => {
                STATE.instances.A.resize();
                STATE.instances.B.resize();
            });
        } else {
            bElements.forEach(el => el.classList.add('hidden'));
            STATE.instances.A.resize();
        }
    }

    function randomize() {
        if(STATE.running) return;
        const size = parseInt(document.getElementById('rngSize').value);
        STATE.array = Array.from({length: size}, () => Math.floor(Math.random() * 950) + 10);
        resetVisualizers();
        updateStatus("DATA_RANDOMIZED");
    }

    function loadManualData() {
        if(STATE.running) return;
        const input = document.getElementById('manualInput').value;
        const arr = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (arr.length > 1) {
            STATE.array = arr;
            document.getElementById('rngSize').value = arr.length;
            document.getElementById('valSize').innerText = arr.length;
            resetVisualizers();
            updateStatus("CUSTOM_DATA_LOADED");
        }
    }

    function resetVisualizers() {
        STATE.instances.A = new Visualizer('canvasA', STATE.array);
        if(STATE.mode === 'compare' || STATE.instances.B) {
            STATE.instances.B = new Visualizer('canvasB', STATE.array);
        }
        ['A', 'B'].forEach(id => {
            document.getElementById(`time${id}`).innerText = '0.00s';
            document.getElementById(`cmp${id}`).innerText = '0';
            document.getElementById(`acc${id}`).innerText = '0';
        });
    }

    function updateStatus(text, active=false) {
        document.getElementById('statusText').innerText = text;
        const dot = document.getElementById('statusDot');
        active ? dot.classList.add('active') : dot.classList.remove('active');
    }

    /* --- EXECUTION CORE --- */
    async function run() {
        if(STATE.running) return;
        STATE.running = true;
        STATE.stopSignal = false;
        document.getElementById('btnStop').disabled = false;
        updateStatus("PROCESSING...", true);

        const algoA = document.getElementById('algoA').value;
        document.getElementById('titleA').innerText = algoA;
        
        STATE.instances.A = new Visualizer('canvasA', STATE.array);
        const tasks = [runAlgo('A', algoA, STATE.instances.A)];
        
        if(STATE.mode === 'compare') {
            const algoB = document.getElementById('algoB').value;
            document.getElementById('titleB').innerText = algoB;
            STATE.instances.B = new Visualizer('canvasB', STATE.array);
            tasks.push(runAlgo('B', algoB, STATE.instances.B));
        }

        await Promise.all(tasks);
        
        STATE.running = false;
        document.getElementById('btnStop').disabled = true;
        updateStatus(STATE.stopSignal ? "ABORTED" : "COMPLETE", false);
    }

    function stop() { STATE.stopSignal = true; }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function frame(viz, indices, type, statsObj, statsUI) {
        if(STATE.stopSignal) throw new Error('Stopped');
        
        document.getElementById(`cmp${statsUI}`).innerText = statsObj.comparisons;
        document.getElementById(`acc${statsUI}`).innerText = statsObj.accesses;
        
        viz.update(viz.array, indices, type);

        let delay = Math.floor(Math.pow(101 - STATE.speed, 1.4));
        
        if(indices.length > 0 && AudioEngine.enabled) {
            if (delay > 5 || Math.random() > 0.8) {
                const val = viz.array[indices[0]];
                const max = Math.max(...STATE.array);
                AudioEngine.play(val/max);
            }
        }
        
        if (delay > 0) await sleep(delay);
    }

    /* --- ALGORITHMS --- */
    async function runAlgo(id, algoName, viz) {
        await sleep(10); 
        
        const stats = { comparisons: 0, accesses: 0, start: Date.now() };
        
        const timer = setInterval(() => {
            if(STATE.stopSignal) clearInterval(timer);
            document.getElementById(`time${id}`).innerText = ((Date.now() - stats.start)/1000).toFixed(2) + 's';
        }, 50);

        const swap = async (arr, i, j) => {
            stats.accesses += 2;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            await frame(viz, [i, j], 2, stats, id);
        };
        const compare = async (arr, i, j) => {
            stats.comparisons++;
            await frame(viz, [i, j], 1, stats, id);
            return arr[i] > arr[j];
        };
        const write = async (arr, i, val) => {
            stats.accesses++;
            arr[i] = val;
            await frame(viz, [i], 2, stats, id);
        };

        try {
            const arr = viz.array; 

            switch(algoName) {
                case 'bubble':
                    for(let i=0; i<arr.length; i++) {
                        for(let j=0; j<arr.length-i-1; j++) {
                            if(await compare(arr, j, j+1)) await swap(arr, j, j+1);
                        }
                    }
                    break;
                case 'selection':
                    for(let i=0; i<arr.length; i++) {
                        let min = i;
                        for(let j=i+1; j<arr.length; j++) {
                            stats.comparisons++;
                            await frame(viz, [j, min], 1, stats, id);
                            if(arr[j] < arr[min]) min = j;
                        }
                        if(min !== i) await swap(arr, i, min);
                    }
                    break;
                case 'insertion':
                    for(let i=1; i<arr.length; i++) {
                        let key = arr[i];
                        let j = i-1;
                        stats.accesses++;
                        while(j >= 0) {
                            stats.comparisons++;
                            await frame(viz, [j, i], 1, stats, id);
                            if(arr[j] > key) {
                                await write(arr, j+1, arr[j]);
                                j--;
                            } else break;
                        }
                        await write(arr, j+1, key);
                    }
                    break;
                case 'quick':
                    await quickSort(arr, 0, arr.length-1, compare, swap, viz, stats, id);
                    break;
                case 'merge':
                    await mergeSort(arr, 0, arr.length-1, viz, stats, id);
                    break;
                case 'heap':
                    await heapSort(arr, viz, stats, id, swap);
                    break;
                case 'shell':
                    await shellSort(arr, viz, stats, id);
                    break;
                case 'comb':
                    await combSort(arr, viz, stats, id, swap, compare);
                    break;
                case 'cocktail':
                    await cocktailSort(arr, viz, stats, id, swap, compare);
                    break;
                case 'radix':
                    await radixSort(arr, viz, stats, id);
                    break;
                case 'bucket':
                    await bucketSort(arr, viz, stats, id);
                    break;
                case 'bogo':
                    await bogoSort(arr, viz, stats, id, swap, compare);
                    break;
            }

            clearInterval(timer);
            
            if(!STATE.stopSignal) {
                viz.update(arr, [], 0); 
                for(let i=0; i<arr.length; i++) {
                    if(STATE.stopSignal) break;
                    viz.markSorted(i);
                    if(AudioEngine.enabled && i % 4 === 0) AudioEngine.play(i/arr.length);
                    const sweepSpeed = arr.length > 200 ? 2 : 10;
                    await sleep(sweepSpeed);
                }
            }

        } catch(e) {
            clearInterval(timer);
            console.log(e);
        }
    }

    /* --- SORTING IMPLEMENTATIONS --- */

    async function quickSort(arr, low, high, compareFn, swapFn, viz, stats, id) {
        if (low < high) {
            let pi = await partition(arr, low, high, compareFn, swapFn, viz, stats, id);
            await quickSort(arr, low, pi - 1, compareFn, swapFn, viz, stats, id);
            await quickSort(arr, pi + 1, high, compareFn, swapFn, viz, stats, id);
        }
    }
    
    async function partition(arr, low, high, compareFn, swapFn, viz, stats, id) {
        let pivot = arr[high]; 
        let i = (low - 1);
        for (let j = low; j <= high - 1; j++) {
            stats.comparisons++;
            await frame(viz, [j, high], 1, stats, id);
            if (arr[j] < pivot) { 
                i++;
                await swapFn(arr, i, j);
            }
        }
        await swapFn(arr, i + 1, high);
        return (i + 1);
    }

    async function mergeSort(arr, l, r, viz, stats, id) {
        if(l >= r) return;
        const m = l + Math.floor((r - l) / 2);
        await mergeSort(arr, l, m, viz, stats, id);
        await mergeSort(arr, m + 1, r, viz, stats, id);
        await merge(arr, l, m, r, viz, stats, id);
    }

    async function merge(arr, l, m, r, viz, stats, id) {
        const n1 = m - l + 1; const n2 = r - m;
        let L = new Array(n1); let R = new Array(n2);
        for (let i = 0; i < n1; i++) L[i] = arr[l + i];
        for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
        
        let i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
            stats.comparisons++;
            await frame(viz, [k], 1, stats, id);
            if (L[i] <= R[j]) { arr[k] = L[i]; i++; } 
            else { arr[k] = R[j]; j++; }
            stats.accesses++;
            await frame(viz, [k], 2, stats, id);
            k++;
        }
        while (i < n1) {
            arr[k] = L[i]; i++; k++; stats.accesses++;
            await frame(viz, [k-1], 2, stats, id);
        }
        while (j < n2) {
            arr[k] = R[j]; j++; k++; stats.accesses++;
            await frame(viz, [k-1], 2, stats, id);
        }
    }

    async function heapSort(arr, viz, stats, id, swapFn) {
        const n = arr.length;
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
            await heapify(arr, n, i, viz, stats, id, swapFn);
        for (let i = n - 1; i > 0; i--) {
            await swapFn(arr, 0, i);
            await heapify(arr, i, 0, viz, stats, id, swapFn);
        }
    }

    async function heapify(arr, n, i, viz, stats, id, swapFn) {
        let largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n) {
            stats.comparisons++;
            await frame(viz, [l, largest], 1, stats, id);
            if (arr[l] > arr[largest]) largest = l;
        }
        if (r < n) {
            stats.comparisons++;
            await frame(viz, [r, largest], 1, stats, id);
            if (arr[r] > arr[largest]) largest = r;
        }
        if (largest !== i) {
            await swapFn(arr, i, largest);
            await heapify(arr, n, largest, viz, stats, id, swapFn);
        }
    }

    async function shellSort(arr, viz, stats, id) {
        let n = arr.length;
        for (let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {
            for (let i = gap; i < n; i += 1) {
                let temp = arr[i];
                let j;
                stats.accesses++;
                for (j = i; j >= gap; j -= gap) {
                    stats.comparisons++;
                    await frame(viz, [j, j-gap], 1, stats, id);
                    if (arr[j - gap] > temp) {
                        arr[j] = arr[j - gap];
                        stats.accesses++;
                        await frame(viz, [j], 2, stats, id);
                    } else break;
                }
                arr[j] = temp;
                stats.accesses++;
                await frame(viz, [j], 2, stats, id);
            }
        }
    }

    // --- NEW SORTING ALGORITHMS FROM IMAGE ---

    async function combSort(arr, viz, stats, id, swapFn, compareFn) {
        let n = arr.length;
        let gap = n;
        let shrunk = true;
        while (gap !== 1 || shrunk) {
            gap = Math.floor(gap / 1.3);
            if (gap < 1) gap = 1;
            shrunk = false;
            for (let i = 0; i < n - gap; i++) {
                if (await compareFn(arr, i, i + gap)) {
                    await swapFn(arr, i, i + gap);
                    shrunk = true;
                }
            }
        }
    }

    async function cocktailSort(arr, viz, stats, id, swapFn, compareFn) {
        let swapped = true;
        let start = 0;
        let end = arr.length;
        while (swapped) {
            swapped = false;
            for (let i = start; i < end - 1; ++i) {
                if (await compareFn(arr, i, i + 1)) {
                    await swapFn(arr, i, i + 1);
                    swapped = true;
                }
            }
            if (!swapped) break;
            swapped = false;
            end--;
            for (let i = end - 1; i >= start; i--) {
                if (await compareFn(arr, i, i + 1)) {
                    await swapFn(arr, i, i + 1);
                    swapped = true;
                }
            }
            start++;
        }
    }

    async function bogoSort(arr, viz, stats, id, swapFn, compareFn) {
        // Safety: Limit Bogo to small arrays for sanity
        if (arr.length > 8 && !confirm("Bogo Sort on > 8 elements might run forever. Continue?")) return;
        
        const isSorted = async () => {
            for (let i = 1; i < arr.length; i++) {
                stats.comparisons++;
                await frame(viz, [i-1, i], 1, stats, id);
                if (arr[i-1] > arr[i]) return false;
            }
            return true;
        };
        
        while (!(await isSorted())) {
            // Shuffle
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                await swapFn(arr, i, j);
            }
        }
    }

    async function radixSort(arr, viz, stats, id) {
        const max = Math.max(...arr);
        for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
            await countSort(arr, exp, viz, stats, id);
        }
    }

    async function countSort(arr, exp, viz, stats, id) {
        let n = arr.length;
        let output = new Array(n).fill(0);
        let count = new Array(10).fill(0);

        for (let i = 0; i < n; i++) {
            stats.accesses++;
            count[Math.floor(arr[i] / exp) % 10]++;
            await frame(viz, [i], 1, stats, id);
        }

        for (let i = 1; i < 10; i++) count[i] += count[i - 1];

        for (let i = n - 1; i >= 0; i--) {
            stats.accesses++;
            output[count[Math.floor(arr[i] / exp) % 10] - 1] = arr[i];
            count[Math.floor(arr[i] / exp) % 10]--;
        }

        for (let i = 0; i < n; i++) {
            arr[i] = output[i];
            stats.accesses++;
            await frame(viz, [i], 2, stats, id);
        }
    }

    async function bucketSort(arr, viz, stats, id) {
        if (arr.length <= 0) return;
        
        let n = arr.length;
        let max = Math.max(...arr);
        let min = Math.min(...arr);
        
        // Create buckets
        let bucketCount = Math.floor(Math.sqrt(n));
        let buckets = Array.from({length: bucketCount}, () => []);

        // Distribute
        for (let i = 0; i < n; i++) {
            stats.accesses++;
            let idx = Math.floor((arr[i] - min) / (max - min + 1) * bucketCount);
            buckets[idx].push(arr[i]);
            await frame(viz, [i], 1, stats, id);
        }

        // Sort and overwrite
        let k = 0;
        for (let i = 0; i < bucketCount; i++) {
            // Simple Insertion Sort for buckets (standard practice)
            let b = buckets[i];
            for(let x=1; x<b.length; x++) {
                let key = b[x];
                let y = x-1;
                while(y >= 0 && b[y] > key) {
                    b[y+1] = b[y];
                    y--;
                }
                b[y+1] = key;
            }

            // Write back to main array for visualization
            for (let j = 0; j < b.length; j++) {
                arr[k] = b[j];
                stats.accesses++;
                await frame(viz, [k], 2, stats, id);
                k++;
            }
        }
    }