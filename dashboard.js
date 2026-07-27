// dashboard.js
// The dashboard reads the current source file each time the page is opened.

(() => {
    'use strict';

    const DCENT_LIVE_DATA_URL = 'https://dl.dropboxusercontent.com/scl/fi/c8ohkby3kbq98jyx7c7i1/DCENT_DCENT_I_GMST_annual_statistics.txt?rlkey=wt7436fexkijiqfltnvt43681&st=px7uqc2n&dl=0';
    const BERKELEY_LIVE_DATA_URL = 'https://storage.googleapis.com/storage/v1/b/berkeley-earth-temperature-hr/o/global%2FGlobal_TAVG_annual.txt?alt=media';
    const NOAA_LIVE_DATA_URL = 'https://www.ncei.noaa.gov/data/noaa-global-surface-temperature/v6.1/access/timeseries/aravg.ann.land_ocean.90S.90N.v6.1.0.202606.asc';
    const HADCRUT_LOCAL_DATA_URL = 'data/HadCRUT.5.1.0.0.analysis.summary_series.global.annual.csv';
    const GISS_LOCAL_DATA_URL = 'data/GLB.Ts%2BdSST.txt';
    const CONFIDENCE_INTERVAL_SD = 2;
    const BASELINE_START_YEAR = 1850;
    const BASELINE_END_YEAR = 1900;
    const ALIGNMENT_START_YEAR = 1981;
    const ALIGNMENT_END_YEAR = 2010;
    const POINT_RADIUS = 3;
    const HOVER_POINT_RADIUS = 4.2;
    const VERTICAL_HIT_TOLERANCE_PX = 19;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SERIES_STYLES = {
        dcentI: {
            key: 'dcentI',
            className: 'dcent-i',
            label: 'DCENT-I',
            activeColor: '#c9344f',
            inactiveColor: '#eca8b4',
            pointColor: '#9e1f36',
            areaOpacity: 0.22
        },
        dcent: {
            key: 'dcent',
            className: 'dcent',
            label: 'DCENT',
            activeColor: '#5474b8',
            inactiveColor: '#9cb5df',
            pointColor: '#264c91',
            areaOpacity: 0.2
        },
        berkeley: {
            key: 'berkeley',
            className: 'berkeley',
            label: 'Berkeley',
            activeColor: '#ad7226',
            inactiveColor: '#dfbe91',
            pointColor: '#845116',
            areaOpacity: 0.18
        },
        noaa: {
            key: 'noaa',
            className: 'noaa',
            label: 'NOAA GT6',
            activeColor: '#287f70',
            inactiveColor: '#9fcbbf',
            pointColor: '#17675a',
            areaOpacity: 0
        },
        hadcrut: {
            key: 'hadcrut',
            className: 'hadcrut',
            label: 'HadCRUT5',
            activeColor: '#7253a2',
            inactiveColor: '#c5b4dc',
            pointColor: '#51357d',
            areaOpacity: 0.18
        },
        giss: {
            key: 'giss',
            className: 'giss',
            label: 'GISTEMP4',
            activeColor: '#397798',
            inactiveColor: '#a8c6d7',
            pointColor: '#205d7e',
            areaOpacity: 0
        }
    };

    function svgEl(name, attributes = {}) {
        const element = document.createElementNS(SVG_NS, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    function appendSvg(parent, name, attributes = {}, content = '') {
        const element = svgEl(name, attributes);
        if (content) element.textContent = content;
        parent.appendChild(element);
        return element;
    }

    function rebaseAnomalies(records, baselineStartYear = ALIGNMENT_START_YEAR, baselineEndYear = ALIGNMENT_END_YEAR) {
        const baseline = records.filter(record => (
            record.year >= baselineStartYear && record.year <= baselineEndYear
        ));

        if (baseline.length !== baselineEndYear - baselineStartYear + 1) {
            throw new Error(`The data file does not contain a complete ${baselineStartYear}–${baselineEndYear} baseline.`);
        }

        const baselineMean = baseline.reduce((sum, record) => sum + record.value, 0) / baseline.length;
        return records.map(record => ({
            ...record,
            value: record.value - baselineMean,
            ...(Number.isFinite(record.lower) ? { lower: record.lower - baselineMean } : {}),
            ...(Number.isFinite(record.upper) ? { upper: record.upper - baselineMean } : {})
        }));
    }

    function alignToCommonPreindustrialReference(series) {
        const valuesByYear = new Map();
        series.forEach(item => {
            item.records.forEach(record => {
                if (!valuesByYear.has(record.year)) valuesByYear.set(record.year, []);
                valuesByYear.get(record.year).push(record.value);
            });
        });

        const ensembleMeanByYear = [...valuesByYear.entries()].map(([year, values]) => ({
            year,
            value: values.reduce((sum, value) => sum + value, 0) / values.length
        }));
        const meanForPeriod = (startYear, endYear) => {
            const values = ensembleMeanByYear
                .filter(record => record.year >= startYear && record.year <= endYear)
                .map(record => record.value);
            if (values.length !== endYear - startYear + 1) {
                throw new Error(`The comparison records do not contain a complete ${startYear}–${endYear} period.`);
            }
            return values.reduce((sum, value) => sum + value, 0) / values.length;
        };

        const alignmentMean = meanForPeriod(ALIGNMENT_START_YEAR, ALIGNMENT_END_YEAR);
        const preindustrialMean = meanForPeriod(BASELINE_START_YEAR, BASELINE_END_YEAR);
        const commonOffset = alignmentMean - preindustrialMean;

        return series.map(item => ({
            ...item,
            records: item.records.map(record => ({
                ...record,
                value: record.value + commonOffset,
                ...(Number.isFinite(record.lower) ? { lower: record.lower + commonOffset } : {}),
                ...(Number.isFinite(record.upper) ? { upper: record.upper + commonOffset } : {})
            }))
        }));
    }

    function completedYears(records) {
        const latestCompletedYear = new Date().getFullYear() - 1;
        return records.filter(record => record.year <= latestCompletedYear);
    }

    function parseDcentSeries(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const headerIndex = lines.findIndex(line => line.trim().startsWith('Year,'));

        if (headerIndex === -1) {
            throw new Error('The live data file does not contain the expected header.');
        }

        const records = completedYears(lines.slice(headerIndex + 1)
            .map(line => line.split(',').map(value => Number.parseFloat(value.trim())))
            .filter(values => values.length === 5 && values.every(Number.isFinite))
            .map(([year, dcentI, dcentISd, dcent, dcentSd]) => ({
                year,
                dcentI,
                dcentISd,
                dcent,
                dcentSd
            })));

        if (records.length < 2) {
            throw new Error('The live data file does not contain enough annual records.');
        }

        return [
            {
                ...SERIES_STYLES.dcentI,
                records: rebaseAnomalies(records.map(record => ({
                    year: record.year,
                    value: record.dcentI,
                    uncertainty: record.dcentISd * CONFIDENCE_INTERVAL_SD
                })))
            },
            {
                ...SERIES_STYLES.dcent,
                records: rebaseAnomalies(records.map(record => ({
                    year: record.year,
                    value: record.dcent,
                    uncertainty: record.dcentSd * CONFIDENCE_INTERVAL_SD
                })))
            }
        ];
    }

    function parseBerkeleySeries(text) {
        const records = completedYears(text.replace(/\r/g, '').split('\n')
            .map(line => line.trim().split(/\s+/))
            .filter(values => /^\d{4}$/.test(values[0]) && Number.isFinite(Number.parseFloat(values[1])))
            .map(values => ({
                year: Number.parseInt(values[0], 10),
                value: Number.parseFloat(values[1]),
                uncertainty: Number.parseFloat(values[2])
            }))
            .filter(record => Number.isFinite(record.uncertainty)));

        if (records.length < 2) throw new Error('Berkeley Earth did not provide enough annual records.');

        return {
            ...SERIES_STYLES.berkeley,
            records: rebaseAnomalies(records)
        };
    }

    function parseNoaaSeries(text) {
        const records = completedYears(text.replace(/\r/g, '').split('\n')
            .map(line => line.trim().split(/\s+/))
            .filter(values => /^\d{4}$/.test(values[0]) && Number.isFinite(Number.parseFloat(values[1])))
            .map(values => ({
                year: Number.parseInt(values[0], 10),
                value: Number.parseFloat(values[1])
            }))
            .filter(record => record.value > -90));

        if (records.length < 2) throw new Error('NOAA did not provide enough annual records.');

        return {
            ...SERIES_STYLES.noaa,
            records: rebaseAnomalies(records)
        };
    }

    function parseHadcrutSeries(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const headerIndex = lines.findIndex(line => line.trim().startsWith('Time,'));
        if (headerIndex === -1) throw new Error('HadCRUT5 does not contain the expected annual-data header.');

        const records = completedYears(lines.slice(headerIndex + 1)
            .map(line => line.split(',').map(value => Number.parseFloat(value.trim())))
            .filter(values => values.length >= 4 && values.slice(0, 4).every(Number.isFinite))
            .map(([year, value, lower, upper]) => ({ year, value, lower, upper })));

        if (records.length < 2) throw new Error('HadCRUT5 did not provide enough annual records.');

        return {
            ...SERIES_STYLES.hadcrut,
            records: rebaseAnomalies(records)
        };
    }

    function parseGissSeries(text) {
        const records = completedYears(text.replace(/\r/g, '').split('\n')
            .map(line => line.trim().split(/\s+/))
            .filter(values => values.length >= 14 && /^\d{4}$/.test(values[0]) && Number.isFinite(Number.parseFloat(values[13])))
            .map(values => ({
                year: Number.parseInt(values[0], 10),
                value: Number.parseFloat(values[13]) / 100
            })));

        if (records.length < 2) throw new Error('NASA GISS did not provide enough annual records.');

        return {
            ...SERIES_STYLES.giss,
            records: rebaseAnomalies(records)
        };
    }

    function fetchLiveText(url) {
        return fetch(url, { cache: 'no-store' }).then(response => {
            if (!response.ok) throw new Error(`The data source returned ${response.status}.`);
            return response.text();
        });
    }

    function niceStep(value) {
        const power = 10 ** Math.floor(Math.log10(value));
        const fraction = value / power;
        const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
        return multiplier * power;
    }

    function tickLabel(value, step) {
        const decimals = step < 1 ? Math.max(1, Math.ceil(-Math.log10(step))) : 0;
        return value.toFixed(decimals).replace(/\.0+$/, '');
    }

    function linePath(records, x, y) {
        return records.map((record, index) => `${index === 0 ? 'M' : 'L'} ${x(record.year).toFixed(2)} ${y(record.value).toFixed(2)}`).join(' ');
    }

    function areaPath(records, x, y) {
        const upper = records.map((record, index) => {
            const upperValue = Number.isFinite(record.upper) ? record.upper : record.value + record.uncertainty;
            return `${index === 0 ? 'M' : 'L'} ${x(record.year).toFixed(2)} ${y(upperValue).toFixed(2)}`;
        });
        const lower = records.slice().reverse().map(record => {
            const lowerValue = Number.isFinite(record.lower) ? record.lower : record.value - record.uncertainty;
            return `L ${x(record.year).toFixed(2)} ${y(lowerValue).toFixed(2)}`;
        });
        return `${upper.join(' ')} ${lower.join(' ')} Z`;
    }

    function ordinal(value) {
        const remainder = value % 100;
        if (remainder >= 11 && remainder <= 13) return `${value}th`;
        if (value % 10 === 1) return `${value}st`;
        if (value % 10 === 2) return `${value}nd`;
        if (value % 10 === 3) return `${value}rd`;
        return `${value}th`;
    }

    function latestYearRanking(records, label) {
        const latest = records[records.length - 1];
        const rank = 1 + records.filter(record => record.value > latest.value).length;
        return { year: latest.year, rank, label };
    }

    function rankingSubtitle(ranking) {
        if (ranking.year === new Date().getFullYear()) {
            const emphasis = ranking.rank === 1 ? ' by far' : '';
            const rankText = ranking.rank === 1 ? 'warmest' : `${ordinal(ranking.rank)} warmest`;
            return `${ranking.year} is${emphasis} the ${rankText} year in the ${ranking.label} record!`;
        }

        return `${ranking.year} ranked as the ${ordinal(ranking.rank)} warmest year in the ${ranking.label} record!`;
    }

    function renderChart(host, series, onSeriesFocus) {
        const width = 1100;
        const height = 620;
        const margin = { top: 20, right: 40, bottom: 86, left: 88 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const firstYear = Math.min(...series.flatMap(item => item.records.map(record => record.year)));
        const lastYear = Math.max(...series.flatMap(item => item.records.map(record => record.year)));
        const xDomainStart = firstYear - 0.5;
        const xDomainEnd = lastYear + 0.5;
        const yMin = -0.6;
        const yMax = 1.7;
        const majorGridStep = 0.5;
        const minorGridStep = 0.1;
        const x = year => margin.left + ((year - xDomainStart) / (xDomainEnd - xDomainStart)) * chartWidth;
        const y = value => margin.top + ((yMax - value) / (yMax - yMin)) * chartHeight;

        host.replaceChildren();
        const svg = svgEl('svg', {
            viewBox: `0 0 ${width} ${height}`,
            role: 'img',
            'aria-label': `Annual global mean surface temperature anomalies, ${firstYear} to ${lastYear}`
        });

        const defs = appendSvg(svg, 'defs');
        const clipPath = appendSvg(defs, 'clipPath', { id: 'annual-gmst-clip' });
        appendSvg(clipPath, 'rect', { x: margin.left, y: margin.top, width: chartWidth, height: chartHeight });

        const grid = appendSvg(svg, 'g');
        for (let gridValue = Math.ceil(yMin / minorGridStep) * minorGridStep; gridValue <= yMax + minorGridStep / 100; gridValue += minorGridStep) {
            const value = Math.round(gridValue * 10) / 10;
            const yPosition = y(value);
            const isMajor = Math.abs(value / majorGridStep - Math.round(value / majorGridStep)) < 0.000001;
            appendSvg(grid, 'line', {
                class: Math.abs(value) < 0.000001
                    ? 'dashboard-zero-line'
                    : isMajor ? 'dashboard-grid-line-major' : 'dashboard-grid-line-minor',
                x1: margin.left,
                x2: width - margin.right,
                y1: yPosition,
                y2: yPosition
            });
            if (isMajor) {
                appendSvg(grid, 'text', {
                    class: 'dashboard-tick',
                    x: margin.left - 12,
                    y: yPosition + 7,
                    'text-anchor': 'end'
                }, tickLabel(value, majorGridStep));
            }
        }

        const dataLayer = appendSvg(svg, 'g', { 'clip-path': 'url(#annual-gmst-clip)' });
        const areaLayer = appendSvg(dataLayer, 'g');
        const lineLayer = appendSvg(dataLayer, 'g');
        const pointLayer = appendSvg(dataLayer, 'g');
        const markerLayer = appendSvg(svg, 'g');
        const seriesState = new Map();
        series.forEach(item => {
            const area = item.records.some(record => (
                Number.isFinite(record.uncertainty)
                || (Number.isFinite(record.lower) && Number.isFinite(record.upper))
            ))
                ? appendSvg(areaLayer, 'path', { class: `dashboard-series-area ${item.className}`, d: areaPath(item.records, x, y) })
                : undefined;
            const line = appendSvg(lineLayer, 'path', { class: `dashboard-series-line ${item.className}`, d: linePath(item.records, x, y) });
            const points = appendSvg(pointLayer, 'g', { class: `dashboard-series-points ${item.className}` });
            const entries = item.records.map(record => {
                const point = appendSvg(points, 'circle', {
                    class: 'dashboard-series-point',
                    cx: x(record.year),
                    cy: y(record.value),
                    r: POINT_RADIUS
                });
                const rank = 1 + item.records.filter(candidate => candidate.value > record.value).length;
                return { point, record, rank, color: item.pointColor };
            });
            seriesState.set(item.key, { ...item, area, line, points, entries });
        });

        const latestMarker = appendSvg(markerLayer, 'g', { class: 'dashboard-latest-marker' });
        const rippleRings = [];
        const createRippleRing = delay => {
            const ring = appendSvg(latestMarker, 'circle', {
                class: 'dashboard-latest-ripple-ring',
                cx: 0,
                cy: 0,
                r: POINT_RADIUS,
                opacity: 0.7
            });
            appendSvg(ring, 'animate', {
                attributeName: 'r',
                values: `${POINT_RADIUS};18`,
                dur: '2.8s',
                begin: `${delay}s`,
                repeatCount: 'indefinite'
            });
            appendSvg(ring, 'animate', {
                attributeName: 'opacity',
                values: '0.7;0',
                dur: '2.8s',
                begin: `${delay}s`,
                repeatCount: 'indefinite'
            });
            rippleRings.push(ring);
        };
        createRippleRing(0);
        createRippleRing(0.9);
        const latestMarkerDot = appendSvg(latestMarker, 'circle', { class: 'dashboard-latest-marker-dot', cx: 0, cy: 0, r: POINT_RADIUS });
        const hitArea = appendSvg(svg, 'rect', {
            class: 'dashboard-hit-area',
            x: margin.left,
            y: margin.top,
            width: chartWidth,
            height: chartHeight
        });
        const parisLimit = 1.5;
        if (parisLimit >= yMin && parisLimit <= yMax) {
            const parisY = y(parisLimit);
            appendSvg(svg, 'line', {
                class: 'dashboard-paris-limit-line',
                x1: margin.left,
                x2: width - margin.right,
                y1: parisY,
                y2: parisY
            });
            appendSvg(svg, 'text', {
                class: 'dashboard-paris-limit-label',
                x: margin.left + 700,
                y: parisY - 10
            }, 'Paris Agreement 1.5°C limit');
        }

        const legendEntryWidths = {
            dcentI: 138,
            dcent: 115,
            berkeley: 132,
            noaa: 132,
            hadcrut: 152,
            giss: 150
        };
        const legendWidth = series.reduce((sum, item) => sum + legendEntryWidths[item.key], 0);
        const legend = appendSvg(svg, 'g', {
            class: 'dashboard-svg-legend',
            transform: `translate(${width - margin.right - legendWidth - 10} ${height - margin.bottom - 45})`
        });
        appendSvg(legend, 'rect', {
            class: 'dashboard-svg-legend-background',
            x: -10,
            y: -16,
            width: legendWidth + 20,
            height: 57,
            rx: 4
        });
        let legendOffset = 0;
        series.forEach((item, index) => {
            const entry = appendSvg(legend, 'g', {
                class: `dashboard-svg-legend-entry ${item.className}`,
                transform: `translate(${legendOffset} 0)`,
                tabindex: 0,
                role: 'button',
                'aria-label': `Focus ${item.label}`
            });
            const band = appendSvg(entry, 'rect', { class: `dashboard-svg-legend-band ${item.className}`, x: 0, y: -8, width: 24, height: 16 });
            const line = appendSvg(entry, 'line', { class: `dashboard-svg-legend-line ${item.className}`, x1: 0, x2: 24, y1: 0, y2: 0 });
            const point = appendSvg(entry, 'circle', { class: `dashboard-svg-legend-point ${item.className}`, cx: 12, cy: 0, r: POINT_RADIUS });
            const label = appendSvg(entry, 'text', { class: 'dashboard-svg-legend-label', x: 32, y: 5 }, item.label);
            seriesState.get(item.key).legend = { band, line, point, label, entry };
            legendOffset += legendEntryWidths[item.key];
        });

        const axis = appendSvg(svg, 'g');
        appendSvg(axis, 'line', {
            class: 'dashboard-axis',
            x1: margin.left,
            x2: width - margin.right,
            y1: height - margin.bottom,
            y2: height - margin.bottom
        });
        appendSvg(axis, 'line', {
            class: 'dashboard-axis',
            x1: margin.left,
            x2: margin.left,
            y1: margin.top,
            y2: height - margin.bottom
        });

        const tickInterval = 25;
        for (let year = Math.ceil(firstYear / tickInterval) * tickInterval; year <= lastYear; year += tickInterval) {
            const xPosition = x(year);
            appendSvg(axis, 'line', {
                class: 'dashboard-axis',
                x1: xPosition,
                x2: xPosition,
                y1: height - margin.bottom,
                y2: height - margin.bottom + 6
            });
            appendSvg(axis, 'text', {
                class: 'dashboard-tick',
                x: xPosition,
                y: height - margin.bottom + 32,
                'text-anchor': 'middle'
            }, String(year));
        }

        appendSvg(axis, 'text', {
            class: 'dashboard-axis-label',
            x: margin.left + chartWidth / 2,
            y: height - 20,
            'text-anchor': 'middle'
        }, 'Year');
        appendSvg(axis, 'text', {
            class: 'dashboard-axis-label',
            x: 23,
            y: margin.top + chartHeight / 2,
            transform: `rotate(-90 23 ${margin.top + chartHeight / 2})`,
            'text-anchor': 'middle'
        }, 'GMST anomalies (°C)');

        const tooltipWidth = 84;
        const tooltipHeight = 78;
        const tooltip = appendSvg(svg, 'g', { class: 'dashboard-tooltip', visibility: 'hidden' });
        appendSvg(tooltip, 'rect', { class: 'dashboard-tooltip-background', width: tooltipWidth, height: tooltipHeight, rx: 5 });
        const tooltipYear = appendSvg(tooltip, 'text', { class: 'dashboard-tooltip-year', x: 11, y: 21 });
        const tooltipValue = appendSvg(tooltip, 'text', { class: 'dashboard-tooltip-value', x: 11, y: 43 });
        const tooltipRank = appendSvg(tooltip, 'text', { class: 'dashboard-tooltip-rank', x: 11, y: 65 });
        let hoveredEntry;
        let activeSeriesKey;

        function formatAnomaly(value) {
            return `${value >= 0 ? '+' : ''}${value.toFixed(2)} °C`;
        }

        function hideTooltip() {
            tooltip.setAttribute('visibility', 'hidden');
            if (hoveredEntry) hoveredEntry.point.setAttribute('r', POINT_RADIUS);
            hoveredEntry = undefined;
        }

        function showTooltip(entry) {
            if (hoveredEntry && hoveredEntry !== entry) hoveredEntry.point.setAttribute('r', POINT_RADIUS);
            hoveredEntry = entry;
            hoveredEntry.point.setAttribute('r', HOVER_POINT_RADIUS);

            let tooltipX = x(entry.record.year) + 12;
            let tooltipY = y(entry.record.value) - tooltipHeight - 12;
            if (tooltipX + tooltipWidth > width - margin.right) tooltipX = x(entry.record.year) - tooltipWidth - 12;
            if (tooltipY < margin.top) tooltipY = y(entry.record.value) + 12;

            tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
            tooltipYear.textContent = String(entry.record.year);
            tooltipValue.textContent = formatAnomaly(entry.record.value);
            tooltipRank.textContent = ordinal(entry.rank);
            tooltipValue.setAttribute('fill', entry.color);
            tooltip.setAttribute('visibility', 'visible');
        }

        function updateNearestPoint(event) {
            const svgBounds = svg.getBoundingClientRect();
            const pointerX = (event.clientX - svgBounds.left) * (width / svgBounds.width);
            const pointerY = (event.clientY - svgBounds.top) * (height / svgBounds.height);
            const activeEntries = seriesState.get(activeSeriesKey).entries;
            const nearestEntry = activeEntries.reduce((nearest, entry) => (
                Math.abs(x(entry.record.year) - pointerX) < Math.abs(x(nearest.record.year) - pointerX)
                    ? entry
                    : nearest
            ));
            const verticalTolerance = VERTICAL_HIT_TOLERANCE_PX * (height / svgBounds.height);

            if (Math.abs(y(nearestEntry.record.value) - pointerY) <= verticalTolerance) {
                showTooltip(nearestEntry);
            } else {
                hideTooltip();
            }
        }

        hitArea.addEventListener('pointermove', updateNearestPoint);
        hitArea.addEventListener('pointerleave', hideTooltip);

        function focusSeries(key) {
            hideTooltip();
            activeSeriesKey = key;
            seriesState.forEach(state => {
                const isActive = state.key === key;
                if (state.area) {
                    state.area.style.fill = state.activeColor;
                    state.area.style.fillOpacity = String(state.areaOpacity);
                    state.area.style.opacity = isActive ? '1' : '0';
                }
                state.line.style.stroke = isActive ? state.activeColor : state.inactiveColor;
                state.line.style.strokeWidth = isActive ? '1.8' : '1.2';
                state.entries.forEach(entry => {
                    entry.point.style.fill = state.pointColor;
                    entry.point.style.opacity = isActive ? '1' : '0';
                });
                state.legend.band.style.fill = state.activeColor;
                state.legend.band.style.fillOpacity = String(state.areaOpacity);
                state.legend.band.style.opacity = isActive && state.area ? '1' : '0';
                state.legend.line.style.stroke = isActive ? state.activeColor : state.inactiveColor;
                state.legend.point.style.fill = state.pointColor;
                state.legend.point.style.opacity = isActive ? '1' : '0';
                state.legend.label.style.fill = isActive ? state.activeColor : state.inactiveColor;
                state.legend.label.style.fontWeight = isActive ? '700' : '400';
            });

            const activeState = seriesState.get(key);
            if (activeState.area) areaLayer.appendChild(activeState.area);
            lineLayer.appendChild(activeState.line);
            pointLayer.appendChild(activeState.points);
            const latest = activeState.records[activeState.records.length - 1];
            latestMarker.setAttribute('transform', `translate(${x(latest.year)} ${y(latest.value)})`);
            rippleRings.forEach(ring => { ring.style.stroke = activeState.activeColor; });
            latestMarkerDot.style.fill = activeState.pointColor;
            onSeriesFocus(activeState);
        }

        seriesState.forEach(state => {
            state.legend.entry.addEventListener('pointerenter', () => focusSeries(state.key));
            state.legend.entry.addEventListener('focus', () => focusSeries(state.key));
        });

        focusSeries('dcentI');
        host.appendChild(svg);
    }

    function initialiseCarousel(carousel) {
        const viewport = carousel.querySelector('.dashboard-carousel-viewport');
        const slides = [...carousel.querySelectorAll('.dashboard-slide')];
        const previous = carousel.querySelector('[data-carousel-previous]');
        const next = carousel.querySelector('[data-carousel-next]');
        const dots = [...carousel.querySelectorAll('[data-carousel-slide]')];
        let activeIndex = 0;
        let scrollFrame;

        function goTo(index) {
            const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
            viewport.scrollTo({ left: slides[targetIndex].offsetLeft, behavior: 'smooth' });
        }

        function updateActive() {
            const viewportCentre = viewport.scrollLeft + viewport.clientWidth / 2;
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            slides.forEach((slide, index) => {
                const slideCentre = slide.offsetLeft + slide.offsetWidth / 2;
                const distance = Math.abs(slideCentre - viewportCentre);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });

            activeIndex = nearestIndex;
            previous.disabled = activeIndex === 0;
            next.disabled = activeIndex === slides.length - 1;
            dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === activeIndex)));
        }

        previous.addEventListener('click', () => goTo(activeIndex - 1));
        next.addEventListener('click', () => goTo(activeIndex + 1));
        dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
        viewport.addEventListener('scroll', () => {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(() => {
                updateActive();
                scrollFrame = undefined;
            });
        }, { passive: true });
        viewport.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                goTo(activeIndex + 1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goTo(activeIndex - 1);
            } else if (event.key === 'Home') {
                event.preventDefault();
                goTo(0);
            } else if (event.key === 'End') {
                event.preventDefault();
                goTo(slides.length - 1);
            }
        });

        updateActive();
    }

    function renderDashboard() {
        const content = document.querySelector('#dashboard .dashboard-content');
        if (!content || content.dataset.initialized === 'true') return;

        content.dataset.initialized = 'true';
        content.innerHTML = `
            <section class="dashboard-carousel" aria-label="DCENT data dashboard">
                <div class="dashboard-carousel-viewport" tabindex="0" aria-label="Dashboard views. Use the arrow keys or navigation buttons to change view.">
                    <article class="dashboard-slide" aria-labelledby="annual-gmst-heading">
                        <section class="dashboard-panel">
                            <div class="dashboard-panel-heading">
                                <div>
                                    <h2 id="annual-gmst-heading">Annual Global Mean Surface Temperature Anomalies (GMST)</h2>
                                    <p class="dashboard-panel-subtitle"></p>
                                </div>
                            </div>
                            <figure class="dashboard-figure">
                                <div class="dashboard-chart-frame">
                                    <div class="dashboard-chart" role="status"><p class="dashboard-status">Loading annual GMST comparison data…</p></div>
                                </div>
                                <figcaption class="dashboard-chart-note"><em>Anomalies are first computed relative to each product’s 1981–2010 mean, then aligned using a common offset: the mean 1850–1900 minus 1981–2010 difference across products. Shading is shown as 95% c.i., where a source provides uncertainty estimates.</em></figcaption>
                            </figure>
                        </section>
                    </article>
                    <article class="dashboard-slide" aria-labelledby="monthly-panel-heading">
                        <section class="dashboard-panel dashboard-panel--placeholder">
                            <span class="dashboard-panel-eyebrow">Next view</span>
                            <h2 id="monthly-panel-heading">Monthly time series</h2>
                            <p>This panel is reserved for the monthly data view. No chart is shown until its source data and presentation are defined.</p>
                        </section>
                    </article>
                    <article class="dashboard-slide" aria-labelledby="maps-panel-heading">
                        <section class="dashboard-panel dashboard-panel--placeholder">
                            <span class="dashboard-panel-eyebrow">Next view</span>
                            <h2 id="maps-panel-heading">Spatial maps</h2>
                            <p>This panel is reserved for spatial views. No map is shown until the required data and map design are defined.</p>
                        </section>
                    </article>
                </div>
                <nav class="dashboard-carousel-navigation" aria-label="Dashboard view navigation">
                    <button class="dashboard-carousel-arrow" type="button" data-carousel-previous aria-label="Previous dashboard view">‹</button>
                    <div class="dashboard-carousel-pages">
                        <div class="dashboard-carousel-dots" aria-label="Choose dashboard view">
                            <button class="dashboard-carousel-dot" type="button" data-carousel-slide="0" aria-label="Show annual global mean surface temperature"></button>
                            <button class="dashboard-carousel-dot" type="button" data-carousel-slide="1" aria-label="Show monthly time series"></button>
                            <button class="dashboard-carousel-dot" type="button" data-carousel-slide="2" aria-label="Show spatial maps"></button>
                        </div>
                    </div>
                    <button class="dashboard-carousel-arrow" type="button" data-carousel-next aria-label="Next dashboard view">›</button>
                </nav>
            </section>`;

        const chartHost = content.querySelector('.dashboard-chart');
        initialiseCarousel(content.querySelector('.dashboard-carousel'));
        Promise.allSettled([
            fetchLiveText(DCENT_LIVE_DATA_URL).then(parseDcentSeries),
            fetchLiveText(BERKELEY_LIVE_DATA_URL).then(parseBerkeleySeries),
            fetchLiveText(NOAA_LIVE_DATA_URL).then(parseNoaaSeries),
            fetchLiveText(HADCRUT_LOCAL_DATA_URL).then(parseHadcrutSeries),
            fetchLiveText(GISS_LOCAL_DATA_URL).then(parseGissSeries)
        ])
            .then(results => {
                const [dcentResult, berkeleyResult, noaaResult, hadcrutResult, gissResult] = results;
                if (dcentResult.status !== 'fulfilled') throw dcentResult.reason;

                const series = [...dcentResult.value];
                if (berkeleyResult.status === 'fulfilled') {
                    series.push(berkeleyResult.value);
                } else {
                    console.warn('Unable to load Berkeley Earth annual GMST data:', berkeleyResult.reason);
                }
                if (gissResult.status === 'fulfilled') {
                    series.push(gissResult.value);
                } else {
                    console.warn('Unable to load local NASA GISS annual GMST data:', gissResult.reason);
                }
                if (hadcrutResult.status === 'fulfilled') {
                    series.push(hadcrutResult.value);
                } else {
                    console.warn('Unable to load local HadCRUT5 annual GMST data:', hadcrutResult.reason);
                }
                if (noaaResult.status === 'fulfilled') {
                    series.push(noaaResult.value);
                } else {
                    console.warn('Unable to load NOAA GlobalTemp annual GMST data:', noaaResult.reason);
                }

                chartHost.removeAttribute('role');
                const subtitle = content.querySelector('.dashboard-panel-subtitle');
                renderChart(chartHost, alignToCommonPreindustrialReference(series), activeSeries => {
                    const ranking = latestYearRanking(activeSeries.records, activeSeries.label);
                    subtitle.innerHTML = rankingSubtitle(ranking).replace(
                        ordinal(ranking.rank),
                        `<span class="dashboard-panel-rank">${ordinal(ranking.rank)}</span>`
                    );
                });
            })
            .catch(error => {
                chartHost.innerHTML = `<p class="dashboard-status error">The annual GMST data could not be loaded. Please try again later.</p>`;
                console.error('Unable to load annual GMST data:', error);
            });
    }

    document.addEventListener('include-html-loaded', event => {
        if (event.detail && event.detail.file === 'sections/dashboard.html') renderDashboard();
    });
    document.addEventListener('DOMContentLoaded', renderDashboard);
})();
