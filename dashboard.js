// dashboard.js
// The dashboard reads the current source file each time the page is opened.

(() => {
    'use strict';

    const DCENT_LIVE_DATA_URL = 'https://dl.dropboxusercontent.com/scl/fi/c8ohkby3kbq98jyx7c7i1/DCENT_DCENT_I_GMST_annual_statistics.txt?rlkey=wt7436fexkijiqfltnvt43681&st=px7uqc2n&dl=0';
    const DCENT_MONTHLY_LIVE_DATA_URL = 'https://dl.dropboxusercontent.com/scl/fi/fuirz2t34i421d2nsehkr/DCENT_DCENT_I_GMST_monthly_statistics.txt?rlkey=yvh9slt1buw6ptx56rkpuwzhc&st=fkbmn0c9&dl=0';
    const BERKELEY_LIVE_DATA_URL = 'https://storage.googleapis.com/storage/v1/b/berkeley-earth-temperature-hr/o/global%2FGlobal_TAVG_annual.txt?alt=media';
    const NOAA_LIVE_DATA_URL = 'https://www.ncei.noaa.gov/data/noaa-global-surface-temperature/v6.1/access/timeseries/aravg.ann.land_ocean.90S.90N.v6.1.0.202606.asc';
    const HADCRUT_LOCAL_DATA_URL = 'data/HadCRUT.5.1.0.0.analysis.summary_series.global.annual.csv';
    const GISS_LOCAL_DATA_URL = 'data/GLB.Ts%2BdSST.txt';
    const CONFIDENCE_INTERVAL_SD = 2;
    const BASELINE_START_YEAR = 1850;
    const BASELINE_END_YEAR = 1900;
    const ALIGNMENT_START_YEAR = 1981;
    const ALIGNMENT_END_YEAR = 2010;
    const WARMING_STRIPES_BASELINE_START_YEAR = 1961;
    const WARMING_STRIPES_BASELINE_END_YEAR = 2010;
    const DASHBOARD_SESSION_STATE_KEY = 'dcent-dashboard-session-state-v1';
    const POINT_RADIUS = 3;
    const HOVER_POINT_RADIUS = 4.2;
    const ANNUAL_CHART_PLOT_HEIGHT = 550;
    const VERTICAL_HIT_TOLERANCE_PX = 19;
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const SPATIAL_MAP_GRID = { longitudes: 72, latitudes: 36 };
    const DCENT_MISSING_CELL_COLOR = '#d7d7d7';
    const SPATIAL_COLD_RANK_COLORS = [[44, 19, 157], [34, 96, 214], [103, 166, 220], [161, 220, 227]];
    const SPATIAL_WARM_RANK_COLORS = [[134, 20, 21], [203, 82, 95], [239, 168, 126], [249, 231, 178]];
    const SPATIAL_SIGNAL_WARM_COLOR_BANDS = [
        [255, 251, 239], [249, 231, 178], [244, 200, 152], [239, 168, 126],
        [227, 139, 116], [215, 111, 105], [203, 82, 95], [180, 61, 70],
        [157, 41, 46], [134, 20, 21], [104, 20, 21], [74, 20, 21]
    ];
    const SPATIAL_SIGNAL_COLOR_BANDS = [
        [47, 20, 160], [35, 29, 184], [27, 51, 199], [31, 78, 211], [47, 105, 218], [72, 136, 222],
        [103, 166, 220], [137, 194, 222], [169, 219, 224], [198, 235, 231], [225, 244, 237], [246, 248, 238],
        ...SPATIAL_SIGNAL_WARM_COLOR_BANDS
    ];
    const SPATIAL_MAP_URLS = {
        dcentI: {
            annual: 'https://dl.dropboxusercontent.com/scl/fi/soac74wlws2oop62glahg/DCENT-I_latest_year.txt?rlkey=mlpctb79rlbkuenihpu8v6wgv&dl=0',
            months: [
                'https://dl.dropboxusercontent.com/scl/fi/99te0fd5gzgrody2vabhd/DCENT-I_latest_month_minus_11.txt?rlkey=c2qvg4s3s72ls8a0q59u9k0p7&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/qvzuqzn2d3yrpu8yrdgij/DCENT-I_latest_month_minus_10.txt?rlkey=u2cdn7r03qtxxj6qlr0pyo30f&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/4riwgg00vngx5dcqb7fqr/DCENT-I_latest_month_minus_9.txt?rlkey=ys2u9yh4ph13iz6y836s1yvc2&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/alzyqcbi8s3teisvzl8ot/DCENT-I_latest_month_minus_8.txt?rlkey=j029ya36e33ihtxwvem6rw6fk&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/3ytgv9eqnmgcd2lvk0cca/DCENT-I_latest_month_minus_7.txt?rlkey=eu744vchdzhk1heiftz8lww1o&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/jwur0np502df1c4b5dxfc/DCENT-I_latest_month_minus_6.txt?rlkey=t3tm4sskk905q9dqahefhu1wk&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/rg9uv77puw7gihntgr2ca/DCENT-I_latest_month_minus_5.txt?rlkey=qaw41jt8nwdfm6wogw9n89yo4&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/udzd8b48mbaqkiq3dh84q/DCENT-I_latest_month_minus_4.txt?rlkey=sltvx06bqw7l1uhrza45md9ta&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/44q6al7oyd94xvi2922g2/DCENT-I_latest_month_minus_3.txt?rlkey=591ipy4zmphm0iwewhoze3grj&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/5n40b70tv8lnb20ce6wvb/DCENT-I_latest_month_minus_2.txt?rlkey=8m5pquan0z9uunztw41e1cqqd&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/gw2y4qzmtis36k1w7eh87/DCENT-I_latest_month_minus_1.txt?rlkey=rx5yj3lyaozc1pgmh73f7ialv&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/vfwhvfq8kxw4oq677tvze/DCENT-I_latest_month_minus_0.txt?rlkey=d002c133l71d6kylcss9wr1y7&dl=0'
            ]
        },
        dcent: {
            annual: 'https://dl.dropboxusercontent.com/scl/fi/acf1aloz4jhyewty3wlt6/DCENT_latest_year.txt?rlkey=36a0p0bssrfacpofcj3fe8cj9&dl=0',
            months: [
                'https://dl.dropboxusercontent.com/scl/fi/1btiaxtsl2zsv5ylkjveo/DCENT_latest_month_minus_11.txt?rlkey=1vcs7cwqo20uhark1200l7l2w&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/qs17ic343dpvutpxv4xxo/DCENT_latest_month_minus_10.txt?rlkey=yjx1g9qnijj5db1ovcaa81ae5&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/7peqrw66oqubkxoieobtg/DCENT_latest_month_minus_9.txt?rlkey=te1gvezvwpkr4pniqaq6jnanz&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/64oanedoy09kxs4y84oxu/DCENT_latest_month_minus_8.txt?rlkey=bgej1gmhe5xsbi0usrwzqgmk6&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/nmii74tm24lwbs1aomq9f/DCENT_latest_month_minus_7.txt?rlkey=y7krddeg6chl9z8xua4bue42b&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/mai5v5et7ggv8b0perpah/DCENT_latest_month_minus_6.txt?rlkey=tj3fhckvff4oju2rqeof1kvzm&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/prt402vywxp9jw0ue8bi4/DCENT_latest_month_minus_5.txt?rlkey=ph0q34zt0ihub1hx9ei7z911u&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/tav50z5noedon07v5if7b/DCENT_latest_month_minus_4.txt?rlkey=eu52ztlmcr0htuehitakp2lm0&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/8harvdq8unqpcfthjhil7/DCENT_latest_month_minus_3.txt?rlkey=085b5g0eui6gsgryu02fvuljm&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/q48zy376twt05nwdkkdrm/DCENT_latest_month_minus_2.txt?rlkey=us65z9m38of56k9wuuvdz3plb&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/9owo6wkqr2t1xj7djl149/DCENT_latest_month_minus_1.txt?rlkey=3tejaf42tkq2n8j5785ew8gn3&dl=0',
                'https://dl.dropboxusercontent.com/scl/fi/wbiqqnjv0lqishsb3p2fy/DCENT_latest_month_minus_0.txt?rlkey=2im1hd0koi7tttyhfa5vvye8h&dl=0'
            ]
        }
    };
    const WORLD_BOUNDARIES_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
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

        return {
            commonOffset,
            series: series.map(item => ({
                ...item,
                records: item.records.map(record => ({
                    ...record,
                    value: record.value + commonOffset,
                    ...(Number.isFinite(record.lower) ? { lower: record.lower + commonOffset } : {}),
                    ...(Number.isFinite(record.upper) ? { upper: record.upper + commonOffset } : {})
                }))
            }))
        };
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

    function parseMonthlyDcentSeries(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const headerIndices = lines.reduce((indices, line, index) => {
            if (line.trim().startsWith('Year,')) indices.push(index);
            return indices;
        }, []);

        if (headerIndices.length < 2) {
            throw new Error('The live monthly data file does not contain both DCENT-I and DCENT tables.');
        }

        const latestCompletedYear = new Date().getFullYear() - 1;
        const parseTable = (startIndex, endIndex) => {
            const rows = lines.slice(startIndex + 1, endIndex)
                .map(line => line.split(',').map(value => value.trim()))
                .filter(values => values.length >= 14 && /^\d{4}$/.test(values[0]))
                .map(values => ({
                    year: Number.parseInt(values[0], 10),
                    months: values.slice(1, 13).map(value => Number.parseFloat(value)),
                    closingYear: Number.parseInt(values[13], 10)
                }));
            const availableMonths = rows
                .flatMap(row => row.months.map((value, monthIndex) => (
                    Number.isFinite(value) ? { year: row.year, monthIndex } : null
                )))
                .filter(Boolean)
                .sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex);

            return {
                coverage: availableMonths.length ? {
                    start: availableMonths[0],
                    end: availableMonths[availableMonths.length - 1]
                } : null,
                records: rows
                    .filter(row => (
                        row.closingYear === row.year
                        && row.months.every(Number.isFinite)
                        && row.year <= latestCompletedYear
                    ))
                    .map(row => ({ year: row.year, months: row.months }))
            };
        };

        const dcentI = parseTable(headerIndices[0], headerIndices[1]);
        const dcent = parseTable(headerIndices[1], lines.length);
        if (dcentI.records.length < 2 || dcent.records.length < 2) {
            throw new Error('The live monthly data file does not contain enough complete years.');
        }

        return [
            { key: 'dcentI', label: 'DCENT-I', records: dcentI.records, coverage: dcentI.coverage },
            { key: 'dcent', label: 'DCENT', records: dcent.records, coverage: dcent.coverage }
        ];
    }

    function updateSidebarCoverage(datasets) {
        const label = document.querySelector('[data-monthly-coverage]');
        const coverage = datasets.find(dataset => dataset.key === 'dcentI')?.coverage;
        if (!label || !coverage) return;
        const formatMonth = ({ year, monthIndex }) => `${MONTH_LABELS[monthIndex]}. ${year}`;
        label.textContent = `${formatMonth(coverage.start)} – ${formatMonth(coverage.end)}`;
    }

    function alignMonthlyToAnnualReference(datasets, annualOffset) {
        if (!Number.isFinite(annualOffset)) {
            throw new Error('The annual alignment offset is unavailable.');
        }

        return datasets.map(dataset => {
            const monthlyBaselines = MONTH_LABELS.map((_, monthIndex) => {
                const baselineValues = dataset.records
                    .filter(record => record.year >= ALIGNMENT_START_YEAR && record.year <= ALIGNMENT_END_YEAR)
                    .map(record => record.months[monthIndex]);
                const expectedLength = ALIGNMENT_END_YEAR - ALIGNMENT_START_YEAR + 1;
                if (baselineValues.length !== expectedLength || !baselineValues.every(Number.isFinite)) {
                    throw new Error(`The monthly data do not contain a complete ${ALIGNMENT_START_YEAR}–${ALIGNMENT_END_YEAR} baseline.`);
                }
                return baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length;
            });

            return {
                ...dataset,
                records: dataset.records.map(record => ({
                    ...record,
                    months: record.months.map((value, monthIndex) => value - monthlyBaselines[monthIndex] + annualOffset)
                }))
            };
        });
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

    function readDashboardSessionState() {
        try {
            const value = sessionStorage.getItem(DASHBOARD_SESSION_STATE_KEY);
            return value ? JSON.parse(value) : {};
        } catch (error) {
            return {};
        }
    }

    function writeDashboardSessionState(state) {
        try {
            sessionStorage.setItem(DASHBOARD_SESSION_STATE_KEY, JSON.stringify(state));
        } catch (error) {
            // State persistence is optional; the dashboard remains usable if storage is unavailable.
        }
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
        const punctuation = ranking.rank <= 3 ? '!' : '.';
        if (ranking.year === new Date().getFullYear()) {
            const emphasis = ranking.rank === 1 ? ' by far' : '';
            const rankText = ranking.rank === 1 ? 'warmest' : `${ordinal(ranking.rank)} warmest`;
            return `${ranking.year} is${emphasis} the ${rankText} year in ${ranking.label}${punctuation}`;
        }

        return `${ranking.year} ranked as the ${ordinal(ranking.rank)} warmest year in ${ranking.label}${punctuation}`;
    }

    function latestMonthlyRanking(dataset) {
        const latest = dataset.records[dataset.records.length - 1];
        let monthIndex = latest.months.length - 1;
        while (monthIndex >= 0 && !Number.isFinite(latest.months[monthIndex])) monthIndex -= 1;
        if (monthIndex < 0) throw new Error(`The ${dataset.label} monthly record has no latest-month value.`);
        const value = latest.months[monthIndex];
        const rank = 1 + dataset.records.filter(record => record.months[monthIndex] > value).length;
        return { year: latest.year, monthIndex, rank, label: dataset.label };
    }

    function monthlyRankingSubtitle(ranking) {
        const month = MONTH_NAMES[ranking.monthIndex];
        const punctuation = ranking.rank <= 3 ? '!' : '.';
        return `${month} ${ranking.year} ranked as the <span class="dashboard-panel-rank">${ordinal(ranking.rank)}</span> warmest ${month} in ${ranking.label}${punctuation}`;
    }

    function renderChart(host, series, onSeriesFocus) {
        const width = 1100;
        const margin = { top: 20, right: 40, bottom: 86, left: 88 };
        const height = margin.top + ANNUAL_CHART_PLOT_HEIGHT + margin.bottom;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = ANNUAL_CHART_PLOT_HEIGHT;
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

    function blendColor(from, to, amount) {
        const clampedAmount = Math.max(0, Math.min(1, amount));
        return from.map((channel, index) => Math.round(channel + (to[index] - channel) * clampedAmount));
    }

    function rgbColor(channels) {
        return `rgb(${channels.join(' ')})`;
    }

    function darkenRgbColor(color, amount = 0.34) {
        const channels = (color.match(/\d+(?:\.\d+)?/g) || []).map(Number);
        if (channels.length !== 3) return color;
        return rgbColor(channels.map(channel => Math.round(channel * (1 - amount))));
    }

    function monthlyYearColor(year, firstYear, lastYear) {
        const early = [204, 213, 225];
        const yellow = [248, 202, 108];
        const orange = [232, 99, 45];
        const recent = [193, 42, 69];
        if (year <= 1980) return rgbColor(early);
        const proportion = (year - 1980) / Math.max(1, lastYear - 1980);
        if (proportion <= 2 / 3) return rgbColor(blendColor(early, yellow, proportion / (2 / 3)));
        if (proportion <= 0.9) return rgbColor(blendColor(yellow, orange, (proportion - 2 / 3) / (0.9 - 2 / 3)));
        return rgbColor(blendColor(orange, recent, (proportion - 0.9) / 0.1));
    }

    function renderMonthlyChart(host, datasets) {
        const width = 1100;
        const height = 700;
        const margin = { top: 20, right: 120, bottom: 102, left: 88 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const firstYear = Math.min(...datasets.flatMap(dataset => dataset.records.map(record => record.year)));
        const lastYear = Math.max(...datasets.flatMap(dataset => dataset.records.map(record => record.year)));
        const yMin = -0.7;
        const yMax = 1.9;
        const x = month => margin.left + ((month - 0.5) / 12) * chartWidth;
        const y = value => margin.top + ((yMax - value) / (yMax - yMin)) * chartHeight;
        const datasetByKey = new Map(datasets.map(dataset => [dataset.key, dataset]));
        let selectedKey;

        function lineForRecord(record, recordsByYear) {
            const previousRecord = recordsByYear.get(record.year - 1);
            const nextRecord = recordsByYear.get(record.year + 1);
            const points = [
                ...(previousRecord ? [{ month: 0.5, value: previousRecord.months[11] }] : []),
                ...record.months.map((value, index) => ({ month: index + 1, value })),
                ...(nextRecord ? [{ month: 12.5, value: nextRecord.months[0] }] : [])
            ];
            return points.map((point, index) => (
                `${index === 0 ? 'M' : 'L'} ${x(point.month).toFixed(2)} ${y(point.value).toFixed(2)}`
            )).join(' ');
        }

        function selectDataset(key) {
            const dataset = datasetByKey.get(key);
            if (!dataset) return;
            selectedKey = key;
            host.replaceChildren();
            const recordsByYear = new Map(dataset.records.map(record => [record.year, record]));

            const svg = svgEl('svg', {
                viewBox: `0 0 ${width} ${height}`,
                role: 'img',
                'aria-label': `Monthly global mean surface temperature anomalies for ${dataset.label}, ${firstYear} to ${lastYear}`
            });
            const defs = appendSvg(svg, 'defs');
            const clipPath = appendSvg(defs, 'clipPath', { id: 'monthly-gmst-clip' });
            appendSvg(clipPath, 'rect', { x: margin.left, y: margin.top, width: chartWidth, height: chartHeight });
            const transitionStart = 1980;

            const grid = appendSvg(svg, 'g');
            const minorGridStep = 0.1;
            const majorGridStep = 0.5;
            for (let gridValue = Math.ceil(yMin / minorGridStep) * minorGridStep; gridValue <= yMax + 0.001; gridValue += minorGridStep) {
                const value = Math.round(gridValue * 100) / 100;
                const isMajor = Math.abs(value / majorGridStep - Math.round(value / majorGridStep)) < 0.000001;
                appendSvg(grid, 'line', {
                    class: Math.abs(value) < 0.000001
                        ? 'dashboard-zero-line'
                        : isMajor ? 'dashboard-grid-line-major' : 'dashboard-grid-line-minor',
                    x1: margin.left,
                    x2: width - margin.right,
                    y1: y(value),
                    y2: y(value)
                });
                if (isMajor) {
                    appendSvg(grid, 'text', {
                        class: 'dashboard-tick dashboard-monthly-tick',
                        x: margin.left - 12,
                        y: y(value) + 6,
                        'text-anchor': 'end'
                    }, tickLabel(value, majorGridStep));
                }
            }
            for (let monthBoundary = 0.5; monthBoundary <= 12.5; monthBoundary += 1) {
                const monthX = x(monthBoundary);
                const isSeasonBoundary = [2.5, 5.5, 8.5, 11.5].includes(monthBoundary);
                appendSvg(grid, 'line', {
                    class: isSeasonBoundary ? 'dashboard-monthly-season-grid-line' : 'dashboard-grid-line-minor',
                    x1: monthX,
                    x2: monthX,
                    y1: margin.top,
                    y2: height - margin.bottom
                });
            }
            const yearKeyX = width - margin.right + 26;
            const yearKeyY = margin.top;
            const colorYears = Array.from(
                { length: lastYear - firstYear + 1 },
                (_, index) => lastYear - index
            );
            const yearKeyStepHeight = chartHeight / colorYears.length;
            colorYears.forEach((year, index) => appendSvg(svg, 'rect', {
                class: 'dashboard-monthly-year-key-step',
                x: yearKeyX,
                y: yearKeyY + index * yearKeyStepHeight,
                width: 16,
                height: yearKeyStepHeight + 0.25,
                fill: monthlyYearColor(year, firstYear, lastYear)
            }));
            appendSvg(svg, 'rect', {
                class: 'dashboard-monthly-year-key',
                x: yearKeyX,
                y: yearKeyY,
                width: 16,
                height: chartHeight
            });
            const yearKeyHighlight = appendSvg(svg, 'rect', {
                class: 'dashboard-monthly-year-key-highlight',
                visibility: 'hidden'
            });
            appendSvg(svg, 'text', {
                class: 'dashboard-monthly-year-key-label',
                x: yearKeyX + 24,
                y: yearKeyY + 14
            }, String(lastYear));
            appendSvg(svg, 'text', {
                class: 'dashboard-monthly-year-key-label',
                x: yearKeyX + 24,
                y: yearKeyY + chartHeight
            }, String(firstYear));
            const yearKeyHitArea = appendSvg(svg, 'rect', {
                class: 'dashboard-monthly-year-key-hit-area',
                x: yearKeyX - 8,
                y: yearKeyY,
                width: 32,
                height: chartHeight
            });

            const dataLayer = appendSvg(svg, 'g', { 'clip-path': 'url(#monthly-gmst-clip)' });
            const lineLayer = appendSvg(dataLayer, 'g');
            const interactionLayer = appendSvg(dataLayer, 'g', { class: 'dashboard-monthly-interaction-layer' });
            const latestYear = dataset.records[dataset.records.length - 1].year;
            const lineStates = dataset.records.map(record => {
                const color = monthlyYearColor(record.year, firstYear, lastYear);
                const line = appendSvg(lineLayer, 'path', {
                    class: 'dashboard-monthly-line',
                    d: lineForRecord(record, recordsByYear)
                });
                const hitLine = appendSvg(interactionLayer, 'path', {
                    class: 'dashboard-monthly-hit-line',
                    d: lineForRecord(record, recordsByYear)
                });
                return { record, color, highlightColor: darkenRgbColor(color), line, hitLine };
            });
            const lineStatesByYear = new Map(lineStates.map(state => [state.record.year, state]));
            const hoverGridLines = [];
            for (let gridValue = Math.ceil(yMin * 10) / 10; gridValue <= yMax + 0.001; gridValue += 0.1) {
                const value = Math.round(gridValue * 10) / 10;
                hoverGridLines.push(appendSvg(lineLayer, 'line', {
                    class: 'dashboard-monthly-hover-grid-line',
                    x1: margin.left,
                    x2: width - margin.right,
                    y1: y(value),
                    y2: y(value)
                }));
            }

            const interactionBackground = svgEl('rect', {
                class: 'dashboard-monthly-hit-background',
                x: margin.left,
                y: margin.top,
                width: chartWidth,
                height: chartHeight
            });
            interactionLayer.insertBefore(interactionBackground, interactionLayer.firstChild);

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
            }

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
            MONTH_LABELS.forEach((month, index) => {
                const monthX = x(index + 1);
                appendSvg(axis, 'line', {
                    class: 'dashboard-axis',
                    x1: monthX,
                    x2: monthX,
                    y1: height - margin.bottom,
                    y2: height - margin.bottom + 6
                });
                appendSvg(axis, 'text', {
                    class: 'dashboard-tick dashboard-monthly-tick',
                    x: monthX,
                    y: height - margin.bottom + 29,
                    'text-anchor': 'middle'
                }, month);
            });
            appendSvg(axis, 'text', {
                class: 'dashboard-axis-label dashboard-monthly-axis-label',
                x: margin.left + chartWidth / 2,
                y: height - 10,
                'text-anchor': 'middle'
            }, 'Month');
            appendSvg(axis, 'text', {
                class: 'dashboard-axis-label dashboard-monthly-axis-label',
                x: 23,
                y: margin.top + chartHeight / 2,
                transform: `rotate(-90 23 ${margin.top + chartHeight / 2})`,
                'text-anchor': 'middle'
            }, 'GMST anomalies (°C)');

            const latestPointLayer = appendSvg(svg, 'g', { class: 'dashboard-monthly-point-layer' });
            const hoverPointLayer = appendSvg(svg, 'g', { class: 'dashboard-monthly-point-layer' });
            const latestRecord = dataset.records.find(record => record.year === latestYear);
            latestRecord.months.forEach((value, monthIndex) => appendSvg(latestPointLayer, 'circle', {
                class: 'dashboard-monthly-latest-point',
                cx: x(monthIndex + 1),
                cy: y(value),
                r: 7
            }));

            const tooltipWidth = 60;
            const tooltipHeight = 31;
            const tooltip = appendSvg(svg, 'g', { class: 'dashboard-monthly-tooltip', visibility: 'hidden' });
            appendSvg(tooltip, 'rect', { class: 'dashboard-monthly-tooltip-background', width: tooltipWidth, height: tooltipHeight, rx: 4 });
            const tooltipText = appendSvg(tooltip, 'text', {
                class: 'dashboard-monthly-tooltip-text',
                x: tooltipWidth / 2,
                y: 22,
                'text-anchor': 'middle'
            });
            let highlightedState;

            function restingStrokeWidth(year) {
                if (year <= 1980) return 1.05;
                const yearsFromLatest = lastYear - year;
                if (yearsFromLatest === 0) return 3.9;
                if (yearsFromLatest === 1) return 3.0;
                if (yearsFromLatest === 2) return 2.5;
                return 1.05 + ((year - 1980) / (lastYear - 1980)) * 1.15;
            }

            function applyRestingStyle(state) {
                state.line.style.stroke = state.color;
                state.line.style.strokeWidth = String(restingStrokeWidth(state.record.year));
                state.line.style.opacity = state.record.year === latestYear ? '1' : '0.7';
            }

            function clearHighlight() {
                if (!highlightedState) return;
                lineStates.forEach(applyRestingStyle);
                latestPointLayer.style.opacity = '1';
                hoverPointLayer.replaceChildren();
                hoverGridLines.forEach(line => { line.style.opacity = '0'; });
                yearKeyHighlight.setAttribute('visibility', 'hidden');
                tooltip.setAttribute('visibility', 'hidden');
                highlightedState = undefined;
            }

            function showHoverGrid() {
                hoverGridLines.forEach(line => { line.style.opacity = '1'; });
            }

            function moveTooltip(state) {
                const yearIndex = lastYear - state.record.year;
                const yearCentreY = yearKeyY + (yearIndex + 0.5) * yearKeyStepHeight;
                const tooltipX = yearKeyX + 24;
                const tooltipY = Math.max(0, Math.min(height - tooltipHeight, yearCentreY - tooltipHeight / 2));
                tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
                tooltipText.textContent = String(state.record.year);
                tooltipText.style.fill = state.highlightColor;
                tooltip.setAttribute('visibility', 'visible');
            }

            function highlight(state, event) {
                if (highlightedState !== state) {
                    highlightedState = state;
                    lineStates.forEach(candidate => {
                        const isHighlighted = candidate === state;
                        candidate.line.style.stroke = isHighlighted ? candidate.highlightColor : candidate.color;
                        candidate.line.style.strokeWidth = isHighlighted
                            ? String(Math.max(2.9, restingStrokeWidth(candidate.record.year) + 0.65))
                            : '1.0';
                        candidate.line.style.opacity = isHighlighted ? '1' : '0.32';
                    });
                    showHoverGrid();
                    lineLayer.appendChild(state.line);
                    latestPointLayer.style.opacity = state.record.year === latestYear ? '1' : '0';
                    hoverPointLayer.replaceChildren();
                    state.record.months.forEach((value, monthIndex) => appendSvg(hoverPointLayer, 'circle', {
                        class: 'dashboard-monthly-hover-point',
                        cx: x(monthIndex + 1),
                        cy: y(value),
                        r: state.record.year === latestYear ? 7 : 5,
                        style: `fill:${state.highlightColor}`
                    }));
                    const yearIndex = lastYear - state.record.year;
                    yearKeyHighlight.setAttribute('x', String(yearKeyX - 2));
                    yearKeyHighlight.setAttribute('y', String(yearKeyY + yearIndex * yearKeyStepHeight - 1));
                    yearKeyHighlight.setAttribute('width', '20');
                    yearKeyHighlight.setAttribute('height', String(yearKeyStepHeight + 2));
                    yearKeyHighlight.style.stroke = state.highlightColor;
                    yearKeyHighlight.setAttribute('visibility', 'visible');
                }
                moveTooltip(state);
            }

            lineStates.forEach(state => {
                applyRestingStyle(state);
                state.hitLine.addEventListener('pointerenter', event => highlight(state, event));
                state.hitLine.addEventListener('pointermove', event => highlight(state, event));
                state.hitLine.addEventListener('pointerleave', event => {
                    const nextTarget = event.relatedTarget;
                    if (!(nextTarget instanceof Element && nextTarget.classList.contains('dashboard-monthly-hit-line'))) {
                        clearHighlight();
                    }
                });
            });
            interactionBackground.addEventListener('pointermove', clearHighlight);
            yearKeyHitArea.addEventListener('pointermove', event => {
                const bounds = svg.getBoundingClientRect();
                const pointerY = (event.clientY - bounds.top) * (height / bounds.height);
                const yearIndex = Math.max(0, Math.min(
                    colorYears.length - 1,
                    Math.floor((pointerY - yearKeyY) / yearKeyStepHeight)
                ));
                highlight(lineStatesByYear.get(colorYears[yearIndex]), event);
            });
            yearKeyHitArea.addEventListener('pointerleave', clearHighlight);
            svg.addEventListener('pointerleave', clearHighlight);

            host.appendChild(svg);
        }

        selectDataset('dcentI');
        return { selectDataset, selectedKey: () => selectedKey };
    }

    function warmingStripeColor(value) {
        const stripeLimit = 0.8;
        const normalizedValue = Math.max(0, Math.min(0.999999, (value + stripeLimit) / (2 * stripeLimit)));
        return rgbColor(SPATIAL_SIGNAL_COLOR_BANDS[Math.floor(normalizedValue * SPATIAL_SIGNAL_COLOR_BANDS.length)]);
    }

    function renderWarmingStripes(host, records) {
        const width = 1100;
        // This is the SVG's internal aspect ratio only. The flex layout keeps
        // the card itself at the carousel's existing height.
        const height = 700;
        const margin = { top: 16, right: 34, bottom: 50, left: 34 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const firstYear = records[0].year;
        const lastYear = records[records.length - 1].year;
        const stripeWidth = chartWidth / records.length;

        host.replaceChildren();
        const svg = svgEl('svg', {
            viewBox: `0 0 ${width} ${height}`,
            role: 'img',
            'aria-label': `DCENT-I global mean surface temperature warming stripes, ${firstYear} to ${lastYear}`
        });
        const defs = appendSvg(svg, 'defs');
        const clipPath = appendSvg(defs, 'clipPath', { id: 'warming-stripes-clip' });
        appendSvg(clipPath, 'rect', { x: margin.left, y: margin.top, width: chartWidth, height: chartHeight });
        const waveClipPath = appendSvg(defs, 'clipPath', { id: 'warming-stripes-wave-clip' });
        const waveClipShape = appendSvg(waveClipPath, 'path', {
            d: `M ${margin.left} ${margin.top} H ${margin.left + chartWidth} V ${margin.top + chartHeight} H ${margin.left} Z`
        });
        const shadowFilter = appendSvg(defs, 'filter', {
            id: 'warming-stripes-shadow-filter',
            x: '-10%',
            y: '-100%',
            width: '120%',
            height: '300%'
        });
        appendSvg(shadowFilter, 'feGaussianBlur', { stdDeviation: 3 });
        const sheenGradient = appendSvg(defs, 'linearGradient', {
            id: 'warming-stripes-sheen',
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '0%'
        });
        [
            ['0%', '#ffffff', 0],
            ['27%', '#ffffff', 0],
            ['43%', '#ffffff', 0.16],
            ['50%', '#ffffff', 0.3],
            ['58%', '#223c67', 0.16],
            ['74%', '#223c67', 0],
            ['100%', '#223c67', 0]
        ].forEach(([offset, color, opacity]) => appendSvg(sheenGradient, 'stop', {
            offset,
            'stop-color': color,
            'stop-opacity': opacity
        }));

        appendSvg(svg, 'rect', {
            class: 'dashboard-stripe-field',
            x: margin.left,
            y: margin.top,
            width: chartWidth,
            height: chartHeight
        });
        const stripeLayer = appendSvg(svg, 'g');
        const stripeElements = records.map((record, index) => appendSvg(stripeLayer, 'rect', {
            class: 'dashboard-stripe',
            x: margin.left + index * stripeWidth,
            y: margin.top,
            width: stripeWidth + 0.2,
            height: chartHeight,
            fill: warmingStripeColor(record.value)
        }));
        const sheenWidth = stripeWidth * 30;
        const sheenLayer = appendSvg(svg, 'g', {
            class: 'dashboard-stripe-sheen-layer',
            'clip-path': 'url(#warming-stripes-wave-clip)'
        });
        const sheen = appendSvg(sheenLayer, 'rect', {
            class: 'dashboard-stripe-sheen',
            x: margin.left,
            y: margin.top - 60,
            width: sheenWidth,
            height: chartHeight + 120,
            fill: 'url(#warming-stripes-sheen)',
            opacity: 0
        });
        const waveShadow = appendSvg(svg, 'path', {
            class: 'dashboard-stripe-shadow',
            filter: 'url(#warming-stripes-shadow-filter)',
            opacity: 0
        });
        const hitArea = appendSvg(svg, 'rect', {
            class: 'dashboard-stripe-hit-area',
            x: margin.left,
            y: margin.top,
            width: chartWidth,
            height: chartHeight
        });
        const creditLink = appendSvg(svg, 'a', {
            class: 'dashboard-stripe-credit-link',
            href: 'https://showyourstripes.info/',
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-label': 'Inspired by Ed Hawkins’ Warming Stripes — opens in a new tab'
        });
        appendSvg(creditLink, 'text', {
            class: 'dashboard-stripe-credit-text',
            x: width - margin.right - 12,
            y: height - 16,
            'text-anchor': 'end'
        }, 'Visualisation concept inspired by Ed Hawkins’ Warming Stripes ↗');
        const peakLift = 50;
        const standardDeviationInStripes = 10;
        const standardDeviation = stripeWidth * standardDeviationInStripes;
        let targetX = null;
        let renderedX = null;
        let previousPointerX = null;
        let motionDirection = 1;
        let motionFrame = null;

        function stripeLift(stripeCentre, waveCentre) {
            const distance = stripeCentre - waveCentre;
            const trailingSide = motionDirection > 0 ? distance < 0 : distance > 0;
            const localDeviation = standardDeviation * (trailingSide ? 1.3 : 0.72);
            if (Math.abs(distance) > localDeviation * 3) return 0;
            return peakLift * Math.exp(-(distance ** 2) / (2 * localDeviation ** 2));
        }

        function liftStripe(stripe, index, lift) {
            const baseX = margin.left + index * stripeWidth;
            const baseWidth = stripeWidth + 0.2;
            stripe.removeAttribute('transform');
            stripe.setAttribute('x', String(baseX));
            stripe.setAttribute('y', String(margin.top - lift));
            stripe.setAttribute('width', String(baseWidth));
            stripe.setAttribute('height', String(chartHeight));
        }

        function renderSilkWave() {
            motionFrame = null;
            if (!Number.isFinite(targetX)) return;
            if (!Number.isFinite(renderedX)) renderedX = targetX;
            renderedX += (targetX - renderedX) * 0.24;

            stripeElements.forEach((stripe, stripeIndex) => {
                const stripeCentre = margin.left + (stripeIndex + 0.5) * stripeWidth;
                liftStripe(stripe, stripeIndex, stripeLift(stripeCentre, renderedX));
            });
            const sheenBias = motionDirection > 0 ? -standardDeviation * 0.16 : standardDeviation * 0.16;
            sheen.setAttribute('x', String(renderedX + sheenBias - sheenWidth * 0.48));
            sheen.setAttribute('opacity', '1');
            const wavePoints = Array.from({ length: 65 }, (_, index) => {
                const x = margin.left + chartWidth * index / 64;
                const lift = stripeLift(x, renderedX);
                return {
                    x,
                    top: margin.top - lift,
                    bottom: margin.top + chartHeight - lift
                };
            });
            const waveTop = wavePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.top}`).join(' ');
            const waveBottom = wavePoints.slice().reverse().map(point => `L ${point.x} ${point.bottom}`).join(' ');
            waveClipShape.setAttribute('d', `${waveTop} ${waveBottom} Z`);
            waveShadow.setAttribute('d', wavePoints.map((point, index) => (
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.bottom + 5}`
            )).join(' '));
            waveShadow.setAttribute('opacity', '1');

            if (Math.abs(targetX - renderedX) > 0.25) {
                motionFrame = requestAnimationFrame(renderSilkWave);
            }
        }

        hitArea.addEventListener('pointermove', event => {
            const bounds = svg.getBoundingClientRect();
            const pointerX = (event.clientX - bounds.left) * (width / bounds.width);
            const clampedPointerX = Math.max(margin.left, Math.min(width - margin.right, pointerX));
            if (Number.isFinite(previousPointerX) && Math.abs(clampedPointerX - previousPointerX) > 0.2) {
                motionDirection = Math.sign(clampedPointerX - previousPointerX);
            }
            previousPointerX = clampedPointerX;
            targetX = clampedPointerX;
            if (motionFrame === null) motionFrame = requestAnimationFrame(renderSilkWave);
        });
        hitArea.addEventListener('pointerleave', () => {
            targetX = null;
            renderedX = null;
            previousPointerX = null;
            if (motionFrame !== null) cancelAnimationFrame(motionFrame);
            motionFrame = null;
            stripeElements.forEach((stripe, index) => liftStripe(stripe, index, 0));
            sheen.setAttribute('opacity', '0');
            waveShadow.setAttribute('opacity', '0');
        });

        host.appendChild(svg);
    }

    function parseSpatialMapFrame(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const header = lines.find(line => line.trim().startsWith('Year:'));
        const dateMatch = header && header.match(/Year\s*:\s*(\d{4})(?:\s+Mon\s*:\s*(\d{1,2}))?/i);
        const dataStart = lines.findIndex(line => line.trim().toLowerCase() === 'data:');
        const rankingStart = lines.findIndex(line => line.trim().toLowerCase() === 'ranking:');

        if (!dateMatch || dataStart === -1 || rankingStart === -1 || rankingStart <= dataStart) {
            throw new Error('The spatial map file does not contain the expected date, data, and ranking sections.');
        }

        const parseGrid = (gridLines, label) => {
            const rows = gridLines
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => line.split(',')
                    .map(value => value.trim())
                    .filter(Boolean)
                    .map(value => Number.parseFloat(value)));

            if (rows.length !== SPATIAL_MAP_GRID.longitudes || rows.some(row => row.length !== SPATIAL_MAP_GRID.latitudes)) {
                throw new Error(`The ${label} grid does not have the expected ${SPATIAL_MAP_GRID.longitudes} × ${SPATIAL_MAP_GRID.latitudes} dimensions.`);
            }

            const grid = new Float32Array(SPATIAL_MAP_GRID.longitudes * SPATIAL_MAP_GRID.latitudes);
            rows.forEach((row, longitudeIndex) => {
                row.forEach((value, latitudeIndex) => {
                    grid[longitudeIndex * SPATIAL_MAP_GRID.latitudes + latitudeIndex] = value;
                });
            });
            return grid;
        };

        return {
            year: Number.parseInt(dateMatch[1], 10),
            month: dateMatch[2] ? Number.parseInt(dateMatch[2], 10) : undefined,
            values: parseGrid(lines.slice(dataStart + 1, rankingStart), 'temperature'),
            rankings: parseGrid(lines.slice(rankingStart + 1), 'ranking')
        };
    }

    function spatialSignalColor(value) {
        const normalizedValue = Math.max(0, Math.min(0.999999, (value + 4) / 8));
        return rgbColor(SPATIAL_SIGNAL_COLOR_BANDS[Math.floor(normalizedValue * SPATIAL_SIGNAL_COLOR_BANDS.length)]);
    }

    function spatialSignalLegendGradient() {
        const bandWidth = 100 / SPATIAL_SIGNAL_COLOR_BANDS.length;
        const stops = SPATIAL_SIGNAL_COLOR_BANDS.map((color, index) => {
            const start = (index * bandWidth).toFixed(4);
            const end = ((index + 1) * bandWidth).toFixed(4);
            return `${rgbColor(color)} ${start}% ${end}%`;
        });
        return `linear-gradient(90deg, ${stops.join(', ')})`;
    }

    function spatialRankColor(rank) {
        const colorIndex = Math.min(3, Math.max(0, Math.abs(Math.round(rank)) - 1));
        return rgbColor((rank < 0 ? SPATIAL_COLD_RANK_COLORS : SPATIAL_WARM_RANK_COLORS)[colorIndex]);
    }

    function spatialPeriodLabel(frame, mode) {
        if (mode === 'annual') return `${frame.year} annual mean`;
        return `${MONTH_LABELS[frame.month - 1]} ${frame.year}`;
    }

    function normaliseCentralLongitude(longitude) {
        const normalised = longitude % 360;
        return normalised < 0 ? normalised + 360 : normalised;
    }

    function parseWorldBoundaryPaths(text) {
        const topology = JSON.parse(text);
        const countries = topology.objects && topology.objects.countries;
        const transform = topology.transform;
        if (!countries || !transform || !Array.isArray(topology.arcs)) {
            throw new Error('The world boundary file does not contain the expected TopoJSON data.');
        }

        const arcUses = new Map();
        const collectArcIndexes = arcs => {
            if (Array.isArray(arcs)) {
                arcs.forEach(collectArcIndexes);
            } else if (Number.isInteger(arcs)) {
                const index = arcs < 0 ? ~arcs : arcs;
                arcUses.set(index, (arcUses.get(index) || 0) + 1);
            }
        };
        const collectGeometry = geometry => {
            if (geometry.type === 'GeometryCollection') {
                geometry.geometries.forEach(collectGeometry);
            } else {
                collectArcIndexes(geometry.arcs);
            }
        };
        collectGeometry(countries);

        const decodeArc = index => {
            const arc = topology.arcs[index];
            if (!arc) throw new Error('The world boundary file references a missing arc.');
            let longitude = 0;
            let latitude = 0;
            return arc.map(([deltaLongitude, deltaLatitude]) => {
                longitude += deltaLongitude;
                latitude += deltaLatitude;
                return [
                    longitude * transform.scale[0] + transform.translate[0],
                    latitude * transform.scale[1] + transform.translate[1]
                ];
            });
        };

        return [...arcUses].reduce((paths, [index, uses]) => {
            paths[uses === 1 ? 'coastlines' : 'borders'].push(decodeArc(index));
            return paths;
        }, { coastlines: [], borders: [] });
    }

    function robinsonRelativeLongitude(longitude, centralLongitude = 180) {
        let relativeLongitude = longitude - centralLongitude;
        while (relativeLongitude < -180) relativeLongitude += 360;
        while (relativeLongitude > 180) relativeLongitude -= 360;
        return relativeLongitude;
    }

    function createRobinsonProjection(width, height, centralLongitude = 180) {
        const xCoefficients = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
        const yCoefficients = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];
        const xScale = 0.8487;
        const yScale = 1.3523;
        const scale = Math.min(
            (width - 48) / (2 * xScale * Math.PI),
            (height - 44) / (2 * yScale)
        );
        const centreX = width / 2;
        const centreY = height / 2;

        const interpolate = (coefficients, latitude) => {
            const position = Math.min(90, Math.abs(latitude)) / 5;
            const lowerIndex = Math.floor(position);
            const upperIndex = Math.min(coefficients.length - 1, lowerIndex + 1);
            return coefficients[lowerIndex] + (coefficients[upperIndex] - coefficients[lowerIndex]) * (position - lowerIndex);
        };

        return (longitude, latitude) => {
            const relativeLongitude = robinsonRelativeLongitude(longitude, centralLongitude);
            const xCoefficient = interpolate(xCoefficients, latitude);
            const yCoefficient = interpolate(yCoefficients, latitude);
            return {
                x: centreX + xScale * scale * (relativeLongitude * Math.PI / 180) * xCoefficient,
                y: centreY - Math.sign(latitude) * yScale * scale * yCoefficient
            };
        };
    }

    function drawProjectedBoundaryPath(context, coordinates, project, centralLongitude) {
        context.beginPath();
        let previousLongitude;
        coordinates.forEach(([longitude, latitude], index) => {
            const point = project(longitude, latitude);
            const crossesMapSeam = index > 0
                && Math.abs(
                    robinsonRelativeLongitude(longitude, centralLongitude)
                    - robinsonRelativeLongitude(previousLongitude, centralLongitude)
                ) > 180;
            if (index === 0 || crossesMapSeam) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
            previousLongitude = longitude;
        });
        context.stroke();
    }

    function drawSpatialMap(canvas, frame, metric, product, boundaryPaths, centralLongitude = 180) {
        const context = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const project = createRobinsonProjection(width, height, centralLongitude);
        const field = metric === 'signal' ? frame.values : frame.rankings;
        const mapWest = centralLongitude - 180;
        const mapEast = centralLongitude + 180;

        context.clearRect(0, 0, width, height);
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);

        for (let longitudeIndex = 0; longitudeIndex < SPATIAL_MAP_GRID.longitudes; longitudeIndex += 1) {
            for (let latitudeIndex = 0; latitudeIndex < SPATIAL_MAP_GRID.latitudes; latitudeIndex += 1) {
                const value = field[longitudeIndex * SPATIAL_MAP_GRID.latitudes + latitudeIndex];
                const west = longitudeIndex * 5;
                const east = west + 5;
                const south = -90 + latitudeIndex * 5;
                const north = south + 5;
                const isMissing = !Number.isFinite(value);
                const isOutsideRankTopFive = metric === 'rank' && !isMissing && (value === 0 || Math.abs(value) > 5);
                if (isOutsideRankTopFive) continue;
                if (isMissing && product !== 'dcent') continue;
                context.fillStyle = isMissing
                    ? DCENT_MISSING_CELL_COLOR
                    : metric === 'signal'
                        ? spatialSignalColor(value)
                        : spatialRankColor(value);
                for (let worldOffset = -360; worldOffset <= 360; worldOffset += 360) {
                    const segmentWest = Math.max(mapWest, west + worldOffset);
                    const segmentEast = Math.min(mapEast, east + worldOffset);
                    if (segmentEast <= segmentWest) continue;

                    const corners = [[segmentWest, south], [segmentEast, south], [segmentEast, north], [segmentWest, north]];
                    context.beginPath();
                    corners.forEach(([longitude, latitude], index) => {
                        const point = project(longitude, latitude);
                        if (index === 0) context.moveTo(point.x, point.y);
                        else context.lineTo(point.x, point.y);
                    });
                    context.closePath();
                    context.fill();
                }
            }
        }

        context.save();
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = 'rgba(20, 26, 36, 0.95)';
        context.lineWidth = 1.65;
        boundaryPaths.coastlines.forEach(path => drawProjectedBoundaryPath(context, path, project, centralLongitude));
        context.strokeStyle = 'rgba(20, 26, 36, 0.8)';
        context.lineWidth = 0.72;
        boundaryPaths.borders.forEach(path => drawProjectedBoundaryPath(context, path, project, centralLongitude));
        context.restore();
    }

    function initialiseSpatialMap(host, initialState = {}, onStateChange) {
        const canvas = host.querySelector('.dashboard-spatial-map-canvas');
        const period = host.closest('.dashboard-panel').querySelector('[data-spatial-period]');
        const status = host.querySelector('[data-spatial-status]');
        const legend = host.querySelector('[data-spatial-legend]');
        const timeButtons = [...host.querySelectorAll('[data-spatial-time]')];
        const dataButtons = [...host.querySelectorAll('[data-spatial-product]')];
        const metricButtons = [...host.querySelectorAll('[data-spatial-metric]')];
        const previousMonth = host.querySelector('[data-spatial-previous-month]');
        const nextMonth = host.querySelector('[data-spatial-next-month]');
        const monthNavigation = host.querySelector('[data-spatial-month-navigation]');
        const cache = new Map();
        let boundaryPathsPromise;
        let timeMode = initialState.timeMode === 'monthly' ? 'monthly' : 'annual';
        let product = initialState.product === 'dcent' ? 'dcent' : 'dcentI';
        let metric = initialState.metric === 'rank' ? 'rank' : 'signal';
        let monthIndex = Number.isInteger(initialState.monthIndex)
            ? Math.max(0, Math.min(SPATIAL_MAP_URLS[product].months.length - 1, initialState.monthIndex))
            : SPATIAL_MAP_URLS[product].months.length - 1;
        let centralLongitude = Number.isFinite(initialState.centralLongitude)
            ? normaliseCentralLongitude(initialState.centralLongitude)
            : 180;
        let started = false;
        let hasRenderedFrame = false;
        let requestId = 0;
        let displayedFrame;
        let displayedBoundaryPaths;
        let dragPointerId;
        let dragStartX;
        let dragStartLongitude;
        let hasDragged = false;
        let redrawFrame;

        function currentUrl() {
            return timeMode === 'annual'
                ? SPATIAL_MAP_URLS[product].annual
                : SPATIAL_MAP_URLS[product].months[monthIndex];
        }

        function currentKey() {
            return `${product}:${timeMode}:${timeMode === 'annual' ? 'latest' : monthIndex}`;
        }

        function saveState() {
            onStateChange?.({ timeMode, product, metric, monthIndex, centralLongitude });
        }

        function redrawMap() {
            if (!displayedFrame || !displayedBoundaryPaths) return;
            drawSpatialMap(canvas, displayedFrame, metric, product, displayedBoundaryPaths, centralLongitude);
        }

        function scheduleMapRedraw() {
            if (redrawFrame) return;
            redrawFrame = requestAnimationFrame(() => {
                redrawFrame = undefined;
                redrawMap();
            });
        }

        function setButtonState(buttons, selectedValue, datasetKey) {
            buttons.forEach(button => {
                const isActive = button.dataset[datasetKey] === selectedValue;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        }

        function updateControls(frame) {
            setButtonState(timeButtons, timeMode, 'spatialTime');
            setButtonState(dataButtons, product, 'spatialProduct');
            setButtonState(metricButtons, metric, 'spatialMetric');
            monthNavigation.hidden = false;
            previousMonth.disabled = timeMode !== 'monthly' || monthIndex === 0;
            nextMonth.disabled = timeMode !== 'monthly' || monthIndex === SPATIAL_MAP_URLS[product].months.length - 1;
            if (frame) {
                period.textContent = spatialPeriodLabel(frame, timeMode);
            } else {
                period.textContent = timeMode === 'annual' ? 'Loading annual mean…' : 'Loading month…';
            }
        }

        function updateLegend(frame) {
            if (metric === 'signal') {
                legend.innerHTML = `
                    <div class="dashboard-spatial-legend-scale">
                        <span class="dashboard-spatial-gradient dashboard-spatial-gradient--signal" aria-hidden="true" style="background:${spatialSignalLegendGradient()}"></span>
                        <div class="dashboard-spatial-legend-ticks" aria-hidden="true">
                            <span>−4</span><span>−2</span><span>0</span><span>+2</span><span>+4</span>
                        </div>
                    </div>
                    <p class="dashboard-spatial-legend-description">Temperature anomalies relative to the 1850–1900 mean (°C)</p>`;
                return;
            }

            const rankSwatch = color => `<span class="dashboard-spatial-rank-swatch" style="background:${rgbColor(color)}"></span>`;
            legend.innerHTML = `
                <div class="dashboard-spatial-legend-scale dashboard-spatial-legend-scale--rank">
                    <div class="dashboard-spatial-rank-swatches" aria-hidden="true">
                        <div class="dashboard-spatial-rank-swatch-group">
                            ${rankSwatch(SPATIAL_COLD_RANK_COLORS[0])}
                            ${rankSwatch(SPATIAL_COLD_RANK_COLORS[1])}
                            ${rankSwatch(SPATIAL_COLD_RANK_COLORS[2])}
                            ${rankSwatch(SPATIAL_COLD_RANK_COLORS[3])}
                        </div>
                        <span class="dashboard-spatial-rank-poles">cold&nbsp;|&nbsp;warm</span>
                        <div class="dashboard-spatial-rank-swatch-group">
                            ${rankSwatch(SPATIAL_WARM_RANK_COLORS[3])}
                            ${rankSwatch(SPATIAL_WARM_RANK_COLORS[2])}
                            ${rankSwatch(SPATIAL_WARM_RANK_COLORS[1])}
                            ${rankSwatch(SPATIAL_WARM_RANK_COLORS[0])}
                        </div>
                    </div>
                    <div class="dashboard-spatial-legend-ticks dashboard-spatial-legend-ticks--rank" aria-hidden="true">
                        <div class="dashboard-spatial-rank-tick-group"><span>1st</span><span>2nd</span><span>3rd</span><span>top 5</span></div>
                        <span></span>
                        <div class="dashboard-spatial-rank-tick-group"><span>top 5</span><span>3rd</span><span>2nd</span><span>1st</span></div>
                    </div>
                </div>`;
        }

        function loadFrameFor(key, url) {
            if (!cache.has(key)) {
                cache.set(key, fetchLiveText(url)
                    .then(parseSpatialMapFrame)
                    .catch(error => {
                        cache.delete(key);
                        throw error;
                    }));
            }
            return cache.get(key);
        }

        function loadFrame() {
            return loadFrameFor(currentKey(), currentUrl());
        }

        function loadBoundaryPaths() {
            if (!boundaryPathsPromise) {
                boundaryPathsPromise = fetchLiveText(WORLD_BOUNDARIES_URL)
                    .then(parseWorldBoundaryPaths)
                    .catch(error => {
                        console.warn('Unable to load world boundaries for the spatial map:', error);
                        return { coastlines: [], borders: [] };
                    });
            }
            return boundaryPathsPromise;
        }

        function preloadMonth(productKey, index) {
            if (index < 0) return Promise.resolve();
            return loadFrameFor(
                `${productKey}:monthly:${index}`,
                SPATIAL_MAP_URLS[productKey].months[index]
            ).catch(error => {
                console.warn('Unable to preload a spatial monthly map:', error);
            });
        }

        function renderFrame(frame, boundaryPaths) {
            displayedFrame = frame;
            displayedBoundaryPaths = boundaryPaths;
            redrawMap();
            updateControls(frame);
            updateLegend(frame);
            canvas.setAttribute('aria-label', `${product === 'dcentI' ? 'DCENT-I' : 'DCENT'} ${metric === 'signal' ? 'warming signal' : 'temperature ranking'} map for ${spatialPeriodLabel(frame, timeMode)}. Drag left or right to rotate the map.`);
            status.hidden = true;
            hasRenderedFrame = true;
            if (timeMode === 'monthly') preloadMonth(product, monthIndex - 1);
        }

        async function refresh() {
            if (!started) return;
            const localRequestId = ++requestId;
            updateControls();
            status.hidden = false;
            status.textContent = 'Loading spatial map data…';
            status.classList.remove('error');

            try {
                const [frame, boundaryPaths] = await Promise.all([loadFrame(), loadBoundaryPaths()]);
                if (localRequestId !== requestId) return;
                renderFrame(frame, boundaryPaths);
            } catch (error) {
                if (localRequestId !== requestId) return;
                status.textContent = 'The spatial map data could not be loaded. Please try again later.';
                status.classList.add('error');
                console.error('Unable to load spatial map data:', error);
            }
        }

        timeButtons.forEach(button => button.addEventListener('click', () => {
            const nextMode = button.dataset.spatialTime;
            if (nextMode === timeMode) return;
            timeMode = nextMode;
            saveState();
            refresh();
        }));
        dataButtons.forEach(button => button.addEventListener('click', () => {
            const nextProduct = button.dataset.spatialProduct;
            if (nextProduct === product) return;
            product = nextProduct;
            monthIndex = Math.min(monthIndex, SPATIAL_MAP_URLS[product].months.length - 1);
            saveState();
            refresh();
        }));
        metricButtons.forEach(button => button.addEventListener('click', () => {
            const nextMetric = button.dataset.spatialMetric;
            if (nextMetric === metric) return;
            metric = nextMetric;
            saveState();
            refresh();
        }));
        previousMonth.addEventListener('click', () => {
            if (monthIndex === 0) return;
            monthIndex -= 1;
            saveState();
            refresh();
        });
        nextMonth.addEventListener('click', () => {
            if (monthIndex === SPATIAL_MAP_URLS[product].months.length - 1) return;
            monthIndex += 1;
            saveState();
            refresh();
        });

        canvas.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            dragPointerId = event.pointerId;
            dragStartX = event.clientX;
            dragStartLongitude = centralLongitude;
            hasDragged = false;
            canvas.setPointerCapture(event.pointerId);
            canvas.classList.add('is-dragging');
            event.preventDefault();
        });
        canvas.addEventListener('pointermove', event => {
            if (event.pointerId !== dragPointerId) return;
            const canvasWidth = canvas.getBoundingClientRect().width;
            if (!canvasWidth) return;
            const longitudeShift = ((event.clientX - dragStartX) / canvasWidth) * 360;
            if (Math.abs(longitudeShift) > 0.5) hasDragged = true;
            centralLongitude = normaliseCentralLongitude(dragStartLongitude - longitudeShift);
            scheduleMapRedraw();
        });
        const endMapDrag = event => {
            if (event.pointerId !== dragPointerId) return;
            dragPointerId = undefined;
            canvas.classList.remove('is-dragging');
            if (hasDragged) saveState();
        };
        canvas.addEventListener('pointerup', endMapDrag);
        canvas.addEventListener('pointercancel', endMapDrag);
        canvas.addEventListener('lostpointercapture', endMapDrag);

        updateControls();
        return {
            ensureLoaded() {
                if (started) return;
                started = true;
                if (hasRenderedFrame) return;
                refresh();
            },
            preloadInitial() {
                return Promise.all([
                    loadFrame(),
                    loadBoundaryPaths()
                ])
                    .then(([frame, boundaryPaths]) => {
                        if (!started) renderFrame(frame, boundaryPaths);
                    })
                    .catch(error => {
                        console.warn('Unable to preload the default spatial map:', error);
                    });
            },
            preloadLatestMonth() {
                return preloadMonth(product, SPATIAL_MAP_URLS[product].months.length - 1);
            }
        };
    }

    function initialiseCarousel(carousel, onActiveChange, initialIndex = 0) {
        const viewport = carousel.querySelector('.dashboard-carousel-viewport');
        const slides = [...carousel.querySelectorAll('.dashboard-slide')];
        const previous = carousel.querySelector('[data-carousel-previous]');
        const next = carousel.querySelector('[data-carousel-next]');
        const dots = [...carousel.querySelectorAll('[data-carousel-slide]')];
        let activeIndex = Math.max(0, Math.min(slides.length - 1, Number.isInteger(initialIndex) ? initialIndex : 0));
        let reportedIndex;
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
            if (activeIndex !== reportedIndex) {
                reportedIndex = activeIndex;
                onActiveChange?.(activeIndex);
            }
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

        if (activeIndex > 0) viewport.scrollLeft = slides[activeIndex].offsetLeft;
        updateActive();
    }

    function renderDashboard() {
        const content = document.querySelector('#dashboard .dashboard-content');
        if (!content || content.dataset.initialized === 'true') return;

        const dashboardState = readDashboardSessionState();
        function saveDashboardState(changes) {
            Object.assign(dashboardState, changes);
            writeDashboardSessionState(dashboardState);
        }

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
                        <section class="dashboard-panel">
                            <div class="dashboard-panel-heading">
                                <div>
                                    <h2 id="monthly-panel-heading">Monthly Global Mean Surface Temperature Anomalies (GMST)</h2>
                                    <p class="dashboard-panel-subtitle" data-monthly-subtitle></p>
                                </div>
                            </div>
                            <figure class="dashboard-figure">
                                <div class="dashboard-chart-frame">
                                    <div class="dashboard-chart dashboard-monthly-chart" role="status"><p class="dashboard-status">Loading monthly GMST data…</p></div>
                                </div>
                                <div class="dashboard-monthly-controls" role="group" aria-label="Choose the monthly GMST product">
                                    <button class="dashboard-monthly-product is-active" type="button" data-monthly-product="dcentI" aria-pressed="true">DCENT-I</button>
                                    <button class="dashboard-monthly-product" type="button" data-monthly-product="dcent" aria-pressed="false">DCENT</button>
                                </div>
                            </figure>
                        </section>
                    </article>
                    <article class="dashboard-slide" aria-label="Spatial temperature maps">
                        <section class="dashboard-panel dashboard-panel--map" aria-label="Spatial temperature maps">
                            <div class="dashboard-spatial-map">
                                <div class="dashboard-spatial-top-controls" role="group" aria-label="Choose the map time scale">
                                    <button class="dashboard-spatial-control is-active" type="button" data-spatial-time="annual" aria-pressed="true">Annual</button>
                                    <button class="dashboard-spatial-control" type="button" data-spatial-time="monthly" aria-pressed="false">Monthly</button>
                                    <div class="dashboard-spatial-month-navigation" data-spatial-month-navigation aria-label="Browse recent monthly maps">
                                        <button class="dashboard-spatial-step" type="button" data-spatial-previous-month aria-label="Previous month">‹</button>
                                        <button class="dashboard-spatial-step" type="button" data-spatial-next-month aria-label="Next month">›</button>
                                    </div>
                                </div>
                                <p class="dashboard-spatial-period" data-spatial-period>Loading annual mean…</p>
                                <figure class="dashboard-figure dashboard-spatial-figure">
                                    <div class="dashboard-spatial-canvas-frame">
                                        <canvas class="dashboard-spatial-map-canvas" width="1100" height="600" role="img" aria-label="Loading spatial temperature map"></canvas>
                                        <p class="dashboard-spatial-status" data-spatial-status>Spatial maps load when this view is opened.</p>
                                    </div>
                                    <div class="dashboard-spatial-legend" data-spatial-legend aria-live="polite"></div>
                                </figure>
                                <div class="dashboard-spatial-bottom-controls">
                                    <div class="dashboard-spatial-control-group" role="group" aria-label="Choose the temperature product">
                                        <button class="dashboard-spatial-control is-active" type="button" data-spatial-product="dcentI" aria-pressed="true">DCENT-I</button>
                                        <button class="dashboard-spatial-control" type="button" data-spatial-product="dcent" aria-pressed="false">DCENT</button>
                                    </div>
                                    <div class="dashboard-spatial-control-group" role="group" aria-label="Choose the map measure">
                                        <button class="dashboard-spatial-control is-active" type="button" data-spatial-metric="signal" aria-pressed="true">Warming signal</button>
                                        <button class="dashboard-spatial-control" type="button" data-spatial-metric="rank" aria-pressed="false">Temperature rank</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </article>
                    <article class="dashboard-slide" aria-labelledby="warming-stripes-heading">
                        <section class="dashboard-panel dashboard-panel--stripes">
                            <div class="dashboard-panel-heading">
                                <div>
                                    <h2 id="warming-stripes-heading">DCENT-I GMST Warming Stripes</h2>
                                    <p class="dashboard-panel-subtitle" aria-hidden="true">&nbsp;</p>
                                </div>
                            </div>
                            <figure class="dashboard-figure">
                                <div class="dashboard-chart-frame">
                                    <div class="dashboard-chart dashboard-stripe-chart" role="status"><p class="dashboard-status">Loading DCENT-I warming stripes…</p></div>
                                </div>
                            </figure>
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
                            <button class="dashboard-carousel-dot" type="button" data-carousel-slide="3" aria-label="Show DCENT-I warming stripes"></button>
                        </div>
                    </div>
                    <button class="dashboard-carousel-arrow" type="button" data-carousel-next aria-label="Next dashboard view">›</button>
                </nav>
            </section>`;

        const chartHost = content.querySelector('.dashboard-chart:not(.dashboard-monthly-chart)');
        const monthlyChartHost = content.querySelector('.dashboard-monthly-chart');
        const monthlySubtitle = content.querySelector('[data-monthly-subtitle]');
        const stripeChartHost = content.querySelector('.dashboard-stripe-chart');
        const spatialMap = initialiseSpatialMap(
            content.querySelector('.dashboard-spatial-map'),
            dashboardState.spatialMap,
            spatialMapState => saveDashboardState({ spatialMap: spatialMapState })
        );
        const monthlyProductButtons = [...content.querySelectorAll('[data-monthly-product]')];
        let annualCommonOffset;
        let monthlyRawDatasets;
        let monthlyDatasets;
        let monthlyChart;
        let selectedMonthlyProduct = dashboardState.monthlyProduct === 'dcent' ? 'dcent' : 'dcentI';

        function setMonthlyProduct(key) {
            if (!monthlyChart) return;
            selectedMonthlyProduct = key;
            monthlyChart.selectDataset(key);
            const dataset = monthlyDatasets.find(candidate => candidate.key === key);
            monthlySubtitle.innerHTML = monthlyRankingSubtitle(latestMonthlyRanking(dataset));
            monthlyProductButtons.forEach(button => {
                const isActive = button.dataset.monthlyProduct === key;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
            saveDashboardState({ monthlyProduct: selectedMonthlyProduct });
        }

        function renderMonthlyWhenReady() {
            if (!monthlyRawDatasets || !Number.isFinite(annualCommonOffset)) return;
            monthlyChartHost.removeAttribute('role');
            monthlyDatasets = alignMonthlyToAnnualReference(monthlyRawDatasets, annualCommonOffset);
            monthlyChart = renderMonthlyChart(
                monthlyChartHost,
                monthlyDatasets
            );
            setMonthlyProduct(selectedMonthlyProduct);
        }

        monthlyProductButtons.forEach(button => {
            button.addEventListener('click', () => setMonthlyProduct(button.dataset.monthlyProduct));
        });
        initialiseCarousel(content.querySelector('.dashboard-carousel'), activeIndex => {
            saveDashboardState({ activeSlide: activeIndex });
            if (activeIndex === 2) {
                spatialMap.ensureLoaded();
                spatialMap.preloadLatestMonth();
            }
        }, dashboardState.activeSlide);
        const annualDataRequest = Promise.allSettled([
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

                const annualAlignment = alignToCommonPreindustrialReference(series);
                annualCommonOffset = annualAlignment.commonOffset;
                chartHost.removeAttribute('role');
                const subtitle = content.querySelector('.dashboard-panel-subtitle');
                renderChart(chartHost, annualAlignment.series, activeSeries => {
                    const ranking = latestYearRanking(activeSeries.records, activeSeries.label);
                    subtitle.innerHTML = rankingSubtitle(ranking).replace(
                        ordinal(ranking.rank),
                        `<span class="dashboard-panel-rank">${ordinal(ranking.rank)}</span>`
                    );
                });
                const dcentIStripes = annualAlignment.series.find(item => item.key === 'dcentI');
                stripeChartHost.removeAttribute('role');
                renderWarmingStripes(
                    stripeChartHost,
                    rebaseAnomalies(
                        dcentIStripes.records,
                        WARMING_STRIPES_BASELINE_START_YEAR,
                        WARMING_STRIPES_BASELINE_END_YEAR
                    )
                );
                renderMonthlyWhenReady();
            })
            .catch(error => {
                chartHost.innerHTML = `<p class="dashboard-status error">The annual GMST data could not be loaded. Please try again later.</p>`;
                monthlyChartHost.innerHTML = `<p class="dashboard-status error">The monthly GMST data could not be aligned because the annual GMST reference could not be loaded.</p>`;
                stripeChartHost.innerHTML = `<p class="dashboard-status error">The DCENT-I warming stripes could not be loaded because the annual GMST reference could not be loaded.</p>`;
                console.error('Unable to load annual GMST data:', error);
            });

        const monthlyDataRequest = fetchLiveText(DCENT_MONTHLY_LIVE_DATA_URL)
            .then(parseMonthlyDcentSeries)
            .then(datasets => {
                monthlyRawDatasets = datasets;
                updateSidebarCoverage(datasets);
                renderMonthlyWhenReady();
            })
            .catch(error => {
                monthlyChartHost.innerHTML = `<p class="dashboard-status error">The monthly GMST data could not be loaded. Please try again later.</p>`;
                console.error('Unable to load monthly GMST data:', error);
            });

        Promise.allSettled([annualDataRequest, monthlyDataRequest])
            .then(() => spatialMap.preloadInitial());
    }

    document.addEventListener('include-html-loaded', event => {
        if (event.detail && event.detail.file === 'sections/dashboard.html') renderDashboard();
    });
    document.addEventListener('DOMContentLoaded', renderDashboard);
})();
