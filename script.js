const API_CONFIG = {
    bitcoin: {
        provider: "BlockCypher",
        baseUrl: "https://api.blockcypher.com/v1/btc/main",
        apiKey: null,
        endpoint: "/addrs/{address}?limit=10",
        coingeckoId: "bitcoin"
    },
    ethereum: {
        provider: "Etherscan",
        baseUrl: "https://api.etherscan.io",
        apiKey: "2SG5RUASRREBKCRS7EJ51MI168J1FAP4FN",
        endpoint: "/api?module=account&action=txlist&address={address}&sort=desc&page=1&offset=10&apikey={apiKey}",
        coingeckoId: "ethereum"
    },
    bnb: {
        provider: "BscScan",
        baseUrl: "https://api.bscscan.com",
        apiKey: "VKJMPXUPEGH316D4Z92FY9EE49DD2NWH7K",
        endpoint: "/api?module=account&action=txlist&address={address}&sort=desc&page=1&offset=10",
        coingeckoId: "binancecoin"
    },
    ton: {
        provider: "TONCenter",
        baseUrl: "https://toncenter.com/api/v2",
        apiKey: "03f9a831bd14bfd65f61a47ac5abb923adfef36ac3f2cd2e59f561b704f06f2d",
        endpoint: "/getTransactions?address={address}&limit=10&api_key={apiKey}",
        coingeckoId: "the-open-network"
    },
    marketData: {
        provider: "CoinGecko",
        baseUrl: "https://api.coingecko.com/api/v3",
        endpoints: { prices: "/simple/price", market: "/coins/markets", search: "/search" },
        rateLimit: 10
    },
    economicCalendar: {
        provider: "PlaceholderAPI",
        baseUrl: "https://api.example.com/economic-calendar",
        apiKey: null,
        endpoint: "/events?date={date}¤cy={currency}"
    },
    news: {
        provider: "GNews",
        baseUrl: "https://gnews.io/api/v4",
        // apiKey: "4f22c2719a98d05aadb57665940b8c6a",
        endpoint: "/top-headlines"
    },
    geolocation: {
        provider: "OpenCage",
        baseUrl: "https://api.opencagedata.com/geocode/v1/json",
        apiKey: "c3732fd755a0459f987b2eea2f46e906"
    }
};

const TINIFY_API_KEY = '7c2mD2Wvs1HzynnxzzZ6LWSKjtT3g8WH';

const economicEventsFallback = [
    {
        date: "2025-05-26",
        time: "08:30",
        currency: "USD",
        impact: "High",
        event: "Non-Farm Payrolls"
    },
    {
        date: "2025-05-27",
        time: "14:00",
        currency: "EUR",
        impact: "Medium",
        event: "ECB Interest Rate Decision"
    },
    {
        date: "2025-05-28",
        time: "10:00",
        currency: "GBP",
        impact: "Low",
        event: "Retail Sales"
    },
    {
        date: "2025-05-29",
        time: "09:00",
        currency: "JPY",
        impact: "High",
        event: "Bank of Japan Policy Rate"
    },
    {
        date: "2025-05-30",
        time: "11:00",
        currency: "AUD",
        impact: "Medium",
        event: "GDP Growth Rate"
    }
];

const mockTransactions = {
    bitcoin: [
        {
            hash: "mock1234567890abcdef",
            total: 100000000,
            received: new Date().toISOString(),
            confirmations: 6
        }
    ],
    ethereum: [
        {
            hash: "0xmock1234567890abcdef",
            value: 1000000000000000000,
            timeStamp: Math.floor(Date.now() / 1000),
            isError: "0"
        }
    ],
    bnb: [
        {
            hash: "0xmock1234567890abcdef",
            value: 1000000000000000000,
            timeStamp: Math.floor(Date.now() / 1000),
            isError: "0"
        }
    ],
    ton: [
        {
            transaction_id: { hash: "mock1234567890abcdef" },
            in_msg: { value: 1000000000 },
            utime: Math.floor(Date.now() / 1000),
            in_progress: false
        }
    ]
};

async function fetchCryptoPrice(cryptoId, vsCurrency = 'usd') {
    try {
        const response = await fetch(
            `${API_CONFIG.marketData.baseUrl}${API_CONFIG.marketData.endpoints.prices}?ids=${cryptoId}&vs_currencies=${vsCurrency}`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const data = await response.json();
        if (!data[cryptoId] || !data[cryptoId][vsCurrency]) throw new Error('Price data not available');
        return data[cryptoId][vsCurrency];
    } catch (error) {
        console.error(`Error fetching price for ${cryptoId}:`, error);
        return 0;
    }
}

async function fetchEconomicEvents(date, currency) {
    try {
        const config = API_CONFIG.economicCalendar;
        let url = `${config.baseUrl}${config.endpoint}`
            .replace('{date}', encodeURIComponent(date || ''))
            .replace('{currency}', encodeURIComponent(currency === 'all' ? '' : currency || ''));
        if (config.apiKey) {
            url += `&apiKey=${config.apiKey}`;
        }
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error(`Economic Calendar API error: ${response.status}`);
        const data = await response.json();
        return data.events || [];
    } catch (error) {
        console.error('Error fetching economic events:', error);
        return economicEventsFallback.filter(event => {
            const dateMatch = !date || event.date === date;
            const currencyMatch = currency === 'all' || event.currency === currency;
            return dateMatch && currencyMatch;
        });
    }
}

function getGreeting() {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
}

function updateLocalTime() {
    const greetingText = document.getElementById('greeting-text');
    const timeDateDisplay = document.getElementById('greeting-time-date');
    if (greetingText && timeDateDisplay) {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeString = now.toLocaleTimeString('en-US', timeOptions);
        const dateString = now.toLocaleDateString('en-US', dateOptions);
        
        greetingText.textContent = window.location.pathname.includes('technexus.html') ? 'Welcome to Tech Nexus' : `${getGreeting()}!, welcome to my portfolio!`;
        timeDateDisplay.textContent = `Current Time: ${timeString} | Date: ${dateString}`;
    }
}

// Enhanced Scroll Reveal Functionality
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Add staggered animation for child elements
                const children = entry.target.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
                children.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('revealed');
                    }, index * 100);
                });
            }
        });
    }, observerOptions);

    // Observe all scroll reveal elements
    const scrollElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
    scrollElements.forEach(el => observer.observe(el));
}

// Enhanced Scroll Progress Bar
function updateScrollProgress() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (scrollTop / scrollHeight) * 100;
        progressFill.style.width = `${Math.min(scrollProgress, 100)}%`;
    }
}

// Enhanced Form Interactions
function enhanceFormInputs() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Add floating label effect
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Add ripple effect on click
        input.addEventListener('click', (e) => {
            createRipple(e, input);
        });
    });
}

// Create ripple effect
function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Enhanced Button Interactions
function enhanceButtons() {
    const buttons = document.querySelectorAll('.btn, button');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            createRipple(e, button);

            // If the button is inside a form, validate it
            const form = button.closest('form');
            if (form && button.type === 'submit') {
                if (!form.checkValidity()) {
                    e.preventDefault();

                    // Highlight invalid inputs
                    const invalidFields = form.querySelectorAll(':invalid');
                    invalidFields.forEach(field => field.classList.add('input-error'));

                    button.classList.add('btn-error');
                    setTimeout(() => button.classList.remove('btn-error'), 2000);
                    return;
                }

                // Form is valid – show success animation
                button.classList.add('btn-loading');
                setTimeout(() => {
                    button.classList.remove('btn-loading');
                    button.classList.add('btn-success');

                    const inputs = form.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        input.classList.remove('input-error');
                        input.classList.add('input-success');
                    });

                    setTimeout(() => {
                        button.classList.remove('btn-success');
                        inputs.forEach(input => input.classList.remove('input-success'));
                    }, 2000);
                }, 1000);
            }
        });
    });
}


// Parallax Effect
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-section');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const rate = scrolled * -0.5;
            element.style.transform = `translateY(${rate}px)`;
        });
    });
}

// Enhanced Card Animations
function enhanceCards() {
    const cards = document.querySelectorAll('.project-card, .skill-item, .about-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function toggleMenu(isOpen) {
    document.body.classList.toggle('menu-open', isOpen);
}

function toggleDarkMode() {
    const body = document.body;
    const toggleIcons = document.querySelectorAll('#dark-mode-toggle');
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    toggleIcons.forEach(icon => {
        icon.className = isDarkMode ? 'bx bx-sun' : 'bx bx-moon';
    });
    localStorage.setItem('darkMode', isDarkMode);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateAddress(crypto, address) {
    if (!address) return false;
    try {
        if (crypto === 'bitcoin' && !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address)) return false;
        if (crypto === 'ethereum' && !/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
        if (crypto === 'bnb' && !/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
        if (crypto === 'ton' && !/^[0-9A-Za-z\-_=]{48}$/.test(address)) return false;
        return true;
    } catch (e) {
        console.error(`Validation error for ${crypto} address:`, e);
        return false;
    }
}

async function fetchTransactions(walletAddress, crypto, retries = 3, delay = 2000) {
    if (!validateAddress(crypto, walletAddress)) {
        // throw new Error('Invalid wallet address format');
        throw new Error('⚠️⚠️');
    }
    if (!crypto || !API_CONFIG[crypto]) {
        // throw new Error('Invalid cryptocurrency');
        throw new Error('⚠️⚠️');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const config = API_CONFIG[crypto];
            let url = `${config.baseUrl}${config.endpoint.replace('{address}', encodeURIComponent(walletAddress))}`;
            let options = { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };

            if (crypto === 'ethereum') {
                url = url.replace('{apiKey}', config.apiKey);
            } else if (crypto === 'bnb') {
                url += `&apikey=${config.apiKey}`;
            } else if (crypto === 'ton') {
                options.headers['Accept'] = 'application/json';
            }

            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(5000)
            });
            if (response.status === 429) {
                console.warn(`Rate limit hit for ${crypto}, attempt ${attempt}/${retries}`);
                if (attempt === retries) throw new Error('Rate limit exceeded');
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                continue;
            }
            if (!response.ok) {
                const text = await response.text();
                console.error(`API error for ${crypto}: Status ${response.status}, Response: ${text}`);
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Fetched data for ${crypto}:`, data);

            let transactions = data;
            if (crypto === 'ethereum' || crypto === 'bnb') {
                transactions = data.result || [];
            }

            const price = await fetchCryptoPrice(config.coingeckoId);
            return { data: transactions, price };
        } catch (error) {
            if (attempt === retries) {
                console.error(`Failed to fetch ${crypto} transactions after ${retries} attempts:`, error.message);
                throw error;
            }
        }
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatAmount(amount, decimals = 6) {
    return parseFloat(amount).toFixed(decimals).replace(/\.?0+$/, '');
}

function renderTransactions({ data, price }, crypto, container) {
    container.innerHTML = '';
    let transactions = [];
    const seenTxIds = new Set();

    try {
        if (crypto === 'bitcoin') {
            transactions = (data.txrefs || [])
                .filter(tx => {
                    if (seenTxIds.has(tx.tx_hash) || !tx.confirmed) return false;
                    seenTxIds.add(tx.tx_hash);
                    return true;
                })
                .map(tx => ({
                    txId: tx.tx_hash,
                    amount: tx.value ? tx.value / 1e8 : 'N/A',
                    amountUsd: tx.value && price ? (tx.value / 1e8 * price).toFixed(2) : 'N/A',
                    time: tx.confirmed ? formatTimestamp(new Date(tx.confirmed).getTime() / 1000) : 'Pending',
                    confirmations: tx.confirmations || '0',
                    txLink: `https://live.blockcypher.com/btc/tx/${tx.tx_hash}`,
                    unit: 'BTC'
                }));
        } else if (crypto === 'ethereum') {
            transactions = (data || [])
                .filter(tx => {
                    if (seenTxIds.has(tx.hash)) return false;
                    seenTxIds.add(tx.hash);
                    return true;
                })
                .map(tx => ({
                    txId: tx.hash,
                    amount: tx.value ? tx.value / 1e18 : 'N/A',
                    amountUsd: tx.value && price ? (tx.value / 1e18 * price).toFixed(2) : 'N/A',
                    time: tx.timeStamp ? formatTimestamp(tx.timeStamp) : 'Pending',
                    confirmations: tx.isError === '0' ? 'Confirmed' : 'Failed',
                    txLink: `https://etherscan.io/tx/${tx.hash}`,
                    unit: 'ETH'
                }));
        } else if (crypto === 'bnb') {
            transactions = (data || [])
                .filter(tx => {
                    if (seenTxIds.has(tx.hash)) return false;
                    seenTxIds.add(tx.hash);
                    return true;
                })
                .map(tx => ({
                    txId: tx.hash,
                    amount: tx.value ? tx.value / 1e18 : 'N/A',
                    amountUsd: tx.value && price ? (tx.value / 1e18 * price).toFixed(2) : 'N/A',
                    time: tx.timeStamp ? formatTimestamp(tx.timeStamp) : 'Pending',
                    confirmations: tx.isError === '0' ? 'Confirmed' : 'Failed',
                    txLink: `https://bscscan.com/tx/${tx.hash}`,
                    unit: 'BNB'
                }));
        } else if (crypto === 'ton') {
            transactions = (data || [])
                .filter(tx => {
                    if (seenTxIds.has(tx.transaction_id.hash)) return false;
                    seenTxIds.add(tx.transaction_id.hash);
                    return true;
                })
                .map(tx => ({
                    txId: tx.transaction_id.hash,
                    amount: tx.in_msg?.value ? tx.in_msg.value / 1e9 : 'N/A',
                    amountUsd: tx.in_msg?.value && price ? (tx.in_msg.value / 1e9 * price).toFixed(2) : 'N/A',
                    time: tx.utime ? formatTimestamp(tx.utime) : 'Pending',
                    confirmations: tx.in_progress ? 'Pending' : 'Confirmed',
                    txLink: `https://tonviewer.com/transaction/${tx.transaction_id.hash}`,
                    unit: 'TON'
                }));
        }

        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p>No transactions found. Please verify the wallet address or try again later.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'transaction-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>TxID</th>
                    <th>Amount</th>
                    <th>Amount (USD)</th>
                    <th>Time and Date</th>
                    <th>Confirmations</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(tx => `
                    <tr>
                        <td><a href="${tx.txLink}" target="_blank">${tx.txId.slice(0, 8)}...</a></td>
                        <td>${tx.amount !== 'N/A' ? formatAmount(tx.amount) + ' ' + tx.unit : 'N/A'}</td>
                        <td>${tx.amountUsd !== 'N/A' ? '$' + formatAmount(tx.amountUsd, 2) : 'N/A'}</td>
                        <td>${tx.time}</td>
                        <td>${tx.confirmations}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        container.appendChild(table);
    } catch (error) {
        console.error(`Error rendering ${crypto} transactions:`, error);
        container.innerHTML = '<p>Error processing transaction data. Please try again later</p>';
    }
}

function renderEconomicCalendar(events, container) {
    container.innerHTML = '';
    if (!events.length) {
        container.innerHTML = '<p>No events found for the selected criteria.</p>';
        return;
    }

    const tableBody = container.querySelector('#calendar-table-body') || container;
    tableBody.innerHTML = events.map(event => `
        <tr>
            <td>${event.date}</td>
            <td>${event.time}</td>
            <td>${event.currency}</td>
            <td class="impact-${event.impact.toLowerCase()}">${event.impact}</td>
            <td>${event.event}</td>
        </tr>
    `).join('');
}

function calculatePips(pair, entryPrice, stopLoss, takeProfit, lotSize, accountBalance, riskPercent, accountCurrency) {
    const pipDecimals = pair.includes("JPY") ? 2 : 4;
    const pipMultiplier = pair.includes("JPY") ? 100 : 10000;
    
    const stopLossPips = Math.abs(entryPrice - stopLoss) * pipMultiplier;
    const takeProfitPips = Math.abs(takeProfit - entryPrice) * pipMultiplier;
    
    const riskReward = takeProfitPips / (stopLossPips || 1);
    
    const pipValue = pair.includes("USD") ? 10 : 10 / 1.2;
    const pipValueInCurrency = accountCurrency === "USD" ? pipValue : pipValue * 0.85;
    
    const riskAmount = accountBalance * (riskPercent / 100);
    const positionSize = riskAmount / (stopLossPips * pipValueInCurrency);
    
    const profit = takeProfitPips * pipValueInCurrency * lotSize;
    const loss = stopLossPips * pipValueInCurrency * lotSize;

    return {
        stopLossPips: stopLossPips.toFixed(2),
        takeProfitPips: takeProfitPips.toFixed(2),
        riskReward: riskReward.toFixed(2),
        pipValue: pipValueInCurrency.toFixed(2),
        positionSize: positionSize.toFixed(2),
        profit: profit.toFixed(2),
        loss: loss.toFixed(2)
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion Functionality
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question i').className = 'bx bx-plus';
            });
            if (!isActive) {
                faqItem.classList.add('active');
                question.querySelector('i').className = 'bx bx-minus';
            }
        });
    });

    // Filter Functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const projectsContainer = document.querySelector('.projects-container');
    
    const comingSoonMessage = document.createElement('div');
    comingSoonMessage.className = 'coming-soon';
    comingSoonMessage.innerHTML = `
        <h3>Not Available Yet</h3>
        <p>Projects for this category have not been posted yet. Exciting work is coming soon!</p>
    `;
    comingSoonMessage.style.display = 'none';
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Set active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
    
            const filter = button.dataset.filter;
            let hasProjects = false;
    
            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    hasProjects = true;
                } else {
                    card.style.display = 'none';
                }
            });
    
            // Show/hide "coming soon" message
            if (!hasProjects && filter !== 'all') {
                comingSoonMessage.style.display = 'block';
            } else {
                comingSoonMessage.style.display = 'none';
            }
        });
    });

    // Navigation Scroll Behavior
    const nav = document.querySelector('nav');
    if (nav) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', debounce(() => {
            let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const links = nav.querySelector('.links');
            if (!links?.classList.contains('active')) {
                if (currentScroll <= 0) {
                    nav.classList.remove('hidden');
                    lastScrollTop = currentScroll;
                    return;
                }
                if (currentScroll > lastScrollTop && currentScroll > 50 && !nav.classList.contains('hidden')) {
                    nav.classList.add('hidden');
                } else if (currentScroll < lastScrollTop && nav.classList.contains('hidden')) {
                    nav.classList.remove('hidden');
                }
            }
            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        }, 100));
    }

    // Input Focus Handling
    document.querySelectorAll('input, textarea').forEach(element => {
        element.addEventListener('touchstart', () => {
            element.focus();
        }, { passive: true });
        element.addEventListener('click', () => {
            element.focus();
        });
        element.addEventListener('focus', () => {
            element.style.position = 'relative';
            element.style.zIndex = '1000';
        });
        element.addEventListener('blur', () => {
            element.style.zIndex = '';
        });
    });

    // Scroll Animations
    function setupScrollAnimations() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const elements = document.querySelectorAll(
            '.mobile-scroll, .slide-left, .slide-right, .scroll-reveal, #home .profile-img, .box, .blog-link, #home .info-box h1, #home .info-box h3, #home .info-box p, #about .about-info p'
        );

        if (prefersReducedMotion) {
            elements.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    } else {
                        entry.target.classList.remove('visible');
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -10% 0px'
            }
        );

        window.updateObservers = debounce(() => {
            observer.disconnect();
            elements.forEach(el => observer.observe(el));
        }, 100);

        window.updateObservers();
    }

    setupScrollAnimations();

    // Home Section Text Animation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const homeElements = document.querySelectorAll('#home .info-box h1, #home .info-box h3, #home .info-box p');

    if (!prefersReducedMotion) {
        const homeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    homeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });

        homeElements.forEach(element => {
            homeObserver.observe(element);
        });

        const originalUpdateObservers = window.updateObservers;
        window.updateObservers = debounce(() => {
            originalUpdateObservers();
            homeObserver.disconnect();
            homeElements.forEach(element => homeObserver.observe(element));
        }, 100);
    } else {
        homeElements.forEach(el => el.classList.add('visible'));
    }

    // Initialize Enhanced Animations and Interactions
    initScrollReveal();
    enhanceFormInputs();
    enhanceButtons();
    initParallax();
    enhanceCards();
    
    // Enhanced Scroll Progress
    window.addEventListener('scroll', debounce(updateScrollProgress, 10));
    
    // Dark Mode Initialization
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.querySelectorAll('#dark-mode-toggle').forEach(icon => {
            icon.className = 'bx bx-sun';
        });
    }

    // Dark Mode Toggle
    document.querySelectorAll('.mode-toggle').forEach(toggle => {
        toggle.addEventListener('click', toggleDarkMode);
    });

    // Navigation Menu
    const menuOpen = document.querySelector('#menu-open');
    const menuClose = document.querySelector('#menu-close');
    const navLinks = document.querySelector('.links');

    if (menuOpen && menuClose && navLinks && nav) {
        menuOpen.addEventListener('click', () => {
            navLinks.classList.add('active');
            menuOpen.style.display = 'none';
            menuClose.style.display = 'block';
            toggleMenu(true);
            nav.classList.remove('hidden');
        });

        menuClose.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuClose.style.display = 'none';
            menuOpen.style.display = 'block';
            toggleMenu(false);
        });

        // Active Nav Link
        const links = document.querySelectorAll('nav ul.links a');
        const currentPage = window.location.pathname.split('/').pop() || 'home.html';

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }

            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                navLinks.classList.remove('active');
                menuClose.style.display = 'none';
                menuOpen.style.display = 'block';
                toggleMenu(false);

                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        const navHeight = nav.offsetHeight;
                        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    }
                }
            });
        });

        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 968) {
                navLinks.classList.remove('active');
                menuClose.style.display = 'none';
                menuOpen.style.display = 'block';
                toggleMenu(false);
            }
            window.updateObservers();
        }, 100));
    }


    // News Section
    const cryptoNewsContainer = document.getElementById('crypto-news-container');
    if (cryptoNewsContainer) {
        const fallbackData = [
            { title: "Bitcoin Hits Record High", url: "https://example.com/bitcoin-news", image: "https://via.placeholder.com/300x200?text=Bitcoin+News", category: "Crypto" },
            { title: "Premier League Transfer Rumors", url: "https://example.com/football-news", image: "https://via.placeholder.com/300x200?text=Football+News", category: "Sports" },
            { title: "Global Climate Summit Updates", url: "https://example.com/world-news", image: "https://via.placeholder.com/300x200?text=World+News", category: "World" },
            { title: "Ethereum ETF Approval", url: "https://example.com/ethereum-news", image: "https://via.placeholder.com/300x200?text=Ethereum+News", category: "Crypto" },
            { title: "Champions League Highlights", url: "https://example.com/football-highlights", image: "https://via.placeholder.com/300x200?text=Football+Highlights", category: "Sports" },
            { title: "Tech Stocks Surge", url: "https://example.com/tech-news", image: "https://via.placeholder.com/300x200?text=Tech+News", category: "Technology" },
            { title: "Solana DeFi Growth", url: "https://example.com/solana-news", image: "https://via.placeholder.com/300x200?text=Solana+News", category: "Crypto" },
            { title: "World Economy Outlook", url: "https://example.com/economy-news", image: "https://via.placeholder.com/300x200?text=Economy+News", category: "Economy" },
            { title: "Blockchain Adoption Trends", url: "https://example.com/blockchain-news", image: "https://via.placeholder.com/300x200?text=Blockchain+News", category: "Crypto" }
        ];

        function renderItems(items, container) {
            container.innerHTML = '';
            const fragment = document.createDocumentFragment();
            items.slice(0, 9).forEach(item => {
                const imageUrl = item.image || 'https://via.placeholder.com/300x200?text=News';
                const newsItem = document.createElement('a');
                newsItem.href = item.url;
                newsItem.className = 'blog-link';
                newsItem.target = '_blank';
                newsItem.rel = 'noopener noreferrer';
                newsItem.innerHTML = `
                    <div class="box mobile-scroll-content">
                        <h1><span>${item.title || 'No Title'}</span></h1>
                        <img src="${imageUrl}" alt="${item.title || 'News Item'}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=News';">
                        <span class="category">${item.category || 'General'}</span>
                        <span class="view-site">Read More <i class='bx bx-right-arrow-alt'></i></span>
                    </div>
                `;
                fragment.appendChild(newsItem);
            });
            container.appendChild(fragment);
            container.classList.add('visible');
            window.updateObservers && window.updateObservers();
        }

        async function getUserCountry() {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                const { latitude, longitude } = position.coords;
                const response = await fetch(`${API_CONFIG.geolocation.baseUrl}?q=${latitude}+${longitude}&key=${API_CONFIG.geolocation.apiKey}`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (!response.ok) throw new Error('Geocoding API error');
                const data = await response.json();
                return data.results[0]?.components?.country_code?.toLowerCase() || 'us';
            } catch (error) {
                console.error('Error getting user location:', error);
                return 'us';
            }
        }

        async function fetchNewsData(retries = 3) {
            cryptoNewsContainer.innerHTML = '<div class="loading-indicator">Loading news...</div>';
            let newsItems = [];
            const seenTitles = new Set();
            const categories = ['business', 'sports', 'technology', 'general', 'entertainment'];
            const maxPerCategory = 2;
            const country = await getUserCountry();

            for (let attempt = 0; attempt < retries; attempt++) {
                for (const category of categories) {
                    try {
                        const response = await fetch(
                            `${API_CONFIG.news.baseUrl}${API_CONFIG.news.endpoint}?category=${category}&lang=en&country=${country}&max=${maxPerCategory}&apikey=${API_CONFIG.news.apiKey}`,
                            {
                                headers: { 'Accept': 'application/json' },
                                signal: AbortSignal.timeout(5000)
                            }
                        );
                        if (response.status === 429) {
                            if (attempt < retries - 1) {
                                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                                continue;
                            }
                            throw new Error('Rate limit exceeded');
                        }
                        if (!response.ok) throw new Error(`GNews API error: ${response.status}`);
                        const data = await response.json();
                        const articles = (data.articles || [])
                            .filter(article => !seenTitles.has(article.title) && article.url && article.title && article.image)
                            .slice(0, maxPerCategory)
                            .map(article => {
                                seenTitles.add(article.title);
                                return {
                                    title: article.title,
                                    url: article.url,
                                    image: article.image,
                                    category: category.charAt(0).toUpperCase() + category.slice(1)
                                };
                            });
                        newsItems = [...newsItems, ...articles];
                    } catch (error) {
                        console.error(`Error fetching ${category} news for ${country} (attempt ${attempt + 1}):`, error);
                    }
                }
                if (newsItems.length >= 9) break;
            }

            if (newsItems.length < 9) {
                const fallback = fallbackData
                    .filter(item => !seenTitles.has(item.title))
                    .slice(0, 9 - newsItems.length);
                newsItems = [...newsItems, ...fallback];
            }

            renderItems(newsItems.slice(0, 9), cryptoNewsContainer);
        }

        fetchNewsData().catch(() => renderItems(fallbackData.slice(0, 9), cryptoNewsContainer));

        const refreshLink = document.getElementById('news-refresh');
        if (refreshLink) {
            refreshLink.addEventListener('click', (e) => {
                e.preventDefault();
                fetchNewsData();
            });
        }
    }

    // TradingView Chart
    const tradingViewChart = document.getElementById('tradingview_chart');
    if (tradingViewChart) {
        function initTradingViewChart() {
            const isMobile = window.innerWidth <= 768;
            new TradingView.widget({
                "width": "100%",
                "height": isMobile ? 450 : 650,
                "symbol": "BINANCE:BTCUSDT",
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "white",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "allow_symbol_change": true,
                "hotlist": true,
                "calendar": true,
                "container_id": "tradingview_chart"
            });
        }

        if (!window.TradingView) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = () => setTimeout(initTradingViewChart, 0);
            script.onerror = () => console.error('Failed to load TradingView script');
            document.head.appendChild(script);
        } else {
            setTimeout(initTradingViewChart, 100);
        }
    }

    // Transaction Tracker
    const walletAddressInput = document.getElementById('wallet-address');
    const cryptoSelect = document.getElementById('crypto-select');
    const trackBtn = document.getElementById('track-btn');
    const trackerResult = document.getElementById('tracker-result');
    if (walletAddressInput && cryptoSelect && trackBtn && trackerResult) {
        async function trackTransactions() {
            const walletAddress = walletAddressInput.value.trim();
            const crypto = cryptoSelect.value;
            trackerResult.innerHTML = '<p>Loading transactions...</p>';

            try {
                const transactions = await fetchTransactions(walletAddress, crypto);
                renderTransactions(transactions, crypto, trackerResult);
            } catch (error) {
                console.error('Error tracking transactions:', error);
                trackerResult.innerHTML = `<p>Error: ${error.message}. We’re making improvements. Thank you for your patience!</p>`;
            }
        }

        trackBtn.addEventListener('click', trackTransactions);
        walletAddressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackTransactions();
        });
    }

    // Pips Calculator
    const pipsPair = document.getElementById('pips-pair');
    const pipsAccountBalance = document.getElementById('pips-account-balance');
    const pipsRiskPercent = document.getElementById('pips-risk-percent');
    const pipsEntryPrice = document.getElementById('pips-entry-price');
    const pipsStopLoss = document.getElementById('pips-stop-loss');
    const pipsTakeProfit = document.getElementById('pips-take-profit');
    const pipsLotSize = document.getElementById('pips-lot-size');
    const pipsAccountCurrency = document.getElementById('pips-account-currency');
    const pipsCalculateBtn = document.getElementById('pips-calculate-btn');
    const pipsResult = document.getElementById('pips-result');
    if (pipsCalculateBtn && pipsResult) {
        pipsCalculateBtn.addEventListener('click', () => {
            const pair = pipsPair.value;
            const accountBalance = parseFloat(pipsAccountBalance.value);
            const riskPercent = parseFloat(pipsRiskPercent.value);
            const entryPrice = parseFloat(pipsEntryPrice.value);
            const stopLoss = parseFloat(pipsStopLoss.value);
            const takeProfit = parseFloat(pipsTakeProfit.value);
            const lotSize = parseFloat(pipsLotSize.value);
            const accountCurrency = pipsAccountCurrency.value;

            if (!pair || isNaN(accountBalance) || isNaN(riskPercent) || isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit) || isNaN(lotSize) || !accountCurrency) {
                pipsResult.classList.add('error');
                pipsResult.innerHTML = '<span>Please fill in all fields with valid numbers.</span>';
                return;
            }

            try {
                const results = calculatePips(pair, entryPrice, stopLoss, takeProfit, lotSize, accountBalance, riskPercent, accountCurrency);
                pipsResult.classList.remove('error');
                pipsResult.innerHTML = `
                    <p><span>Stop-Loss Pips: ${results.stopLossPips}</span></p>
                    <p><span>Take-Profit Pips: ${results.takeProfitPips}</span></p>
                    <p><span>Risk-Reward Ratio: ${results.riskReward}</span></p>
                    <p><span>Pip Value (${accountCurrency}): ${results.pipValue}</span></p>
                    <p><span>Position Size (Lots): ${results.positionSize}</span></p>
                    <p><span>Potential Profit (${accountCurrency}): ${results.profit}</span></p>
                    <p><span>Potential Loss (${accountCurrency}): ${results.loss}</span></p>
                `;
            } catch (error) {
                pipsResult.classList.add('error');
                pipsResult.innerHTML = `<span>Error: ${error.message}</span>`;
            }
        });
    }

    // Economic Calendar
    const calendarDate = document.getElementById('calendar-date');
    const calendarCurrency = document.getElementById('calendar-currency');
    const calendarResult = document.getElementById('calendar-result');
    if (calendarDate && calendarCurrency && calendarResult) {
        async function filterEvents() {
            const selectedDate = calendarDate.value;
            const selectedCurrency = calendarCurrency.value;

            calendarResult.innerHTML = '<p>Loading economic events...</p>';
            const events = await fetchEconomicEvents(selectedDate, selectedCurrency);
            renderEconomicCalendar(events, calendarResult);
        }

        calendarDate.addEventListener('change', filterEvents);
        calendarCurrency.addEventListener('change', filterEvents);
        filterEvents();
    }

// Toast Setup (shared)
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const showToast = (message, isError = false) => {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.className = `toast show ${isError ? 'error' : ''}`;
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4000);
};

// CONTACT FORM
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const formData = new FormData(contactForm);
        const name = formData.get('name')?.trim();
        const email = formData.get('email')?.trim();
        const message = formData.get('message')?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate form fields
        if (!name || !email || !message || !emailRegex.test(email)) {
            showToast('❌ Please fill in all fields with valid data.', true);
            return;
        }

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch('https://formspree.io/f/movdqpoe', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000),
                redirect: 'manual'
            });

            if (response.ok || response.status === 302 || response.type === 'opaqueredirect') {
                contactForm.reset();
                showToast('✅ Message sent successfully!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error || '❌ Failed to send message.';
                showToast(message, true);
            }
        } catch (error) {
            console.error('[Contact] Error:', error);
            showToast('❌ Something went wrong. Try again later.', true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}
// NEWSLETTER FORM
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = newsletterForm.querySelector('button[type="submit"]');
        const formData = new FormData(newsletterForm);
        const email = formData.get('email')?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate email field
        if (!email || !emailRegex.test(email)) {
            showToast('❌ Please enter a valid email address.', true);
            return;
        }

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch('https://formspree.io/f/xqabkwrp', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok || response.status === 201 || response.status === 302) {
                newsletterForm.reset();
                showToast('✅ Successfully subscribed!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error || `❌ Error: ${response.status}`;
                showToast(message, true);
            }
        } catch (error) {
            console.error('[Newsletter] Error:', error);
            let errorText = '❌ Failed to subscribe. Try again.';
            if (error.message.includes('429')) {
                errorText = '⚠️ Too many attempts. Try later.';
            } else if (error.message.includes('422')) {
                errorText = '⚠️ Invalid or already subscribed email.';
            }
            showToast(errorText, true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}


    // Image Compressor
    const dropZone = document.getElementById('drop-zone');
    const imageInput = document.getElementById('image-input');
    const compressBtn = document.getElementById('compress-btn');
    const compressorResult = document.getElementById('compressor-result');
    let selectedFiles = [];

    if (dropZone && imageInput && compressBtn && compressorResult) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Event triggered: ${eventName}`);
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('active');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            console.log('Files dropped:', e.dataTransfer.files);
            const files = Array.from(e.dataTransfer.files).filter(file => 
                ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 5 * 1024 * 1024
            );
            handleFiles(files);
        });

        imageInput.addEventListener('change', (e) => {
            console.log('Files selected via input:', e.target.files);
            const files = Array.from(e.target.files).filter(file => 
                ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 5 * 1024 * 1024
            );
            handleFiles(files);
            e.target.value = '';
        });

        dropZone.addEventListener('click', () => {
            console.log('Drop zone clicked');
            imageInput.click();
        });

        function handleFiles(files) {
            console.log('Handling files:', files);
            if (files.length === 0) {
                compressorResult.innerHTML = '<p class="error">Please select valid JPEG/PNG images (max 5MB each).</p>';
                compressBtn.disabled = true;
                return;
            }
            selectedFiles = [...selectedFiles, ...files];
            compressBtn.disabled = selectedFiles.length === 0;
            renderFileList();
        }

        function renderFileList() {
            compressorResult.innerHTML = '';
            if (selectedFiles.length === 0) return;
            const ul = document.createElement('ul');
            ul.className = 'file-list';
            selectedFiles.forEach((file, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
                    <i class='bx bx-trash' data-index="${index}"></i>
                `;
                ul.appendChild(li);
            });
            compressorResult.appendChild(ul);

            ul.querySelectorAll('.bx-trash').forEach(trash => {
                trash.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    selectedFiles.splice(index, 1);
                    compressBtn.disabled = selectedFiles.length === 0;
                    renderFileList();
                });
            });
        }

        async function compressImages() {
            if (selectedFiles.length === 0) return;
            compressorResult.innerHTML = '<p>Compressing images...</p>';
            compressBtn.disabled = true;
            const results = [];
            const maxRetries = 3;

            for (const file of selectedFiles) {
                let attempt = 0;
                let success = false;

                while (attempt < maxRetries && !success) {
                    attempt++;
                    try {
                        console.log(`Compressing ${file.name}, attempt ${attempt}`);
                        const response = await fetch('https://api.tinify.com/shrink', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Basic ${btoa(`api:${TINIFY_API_KEY}`)}`,
                                'Content-Type': file.type
                            },
                            body: file,
                            signal: AbortSignal.timeout(10000)
                        });

                        if (!response.ok) {
                            if (response.status === 429) {
                                throw new Error('Tinify API rate limit exceeded (500 compressions/month).');
                            }
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Compression failed.');
                        }

                        const data = await response.json();
                        const compressedUrl = data.output.url;
                        const originalSize = file.size;
                        const compressedSize = data.output.size;

                        const compressedResponse = await fetch(compressedUrl);
                        const compressedBlob = await compressedResponse.blob();
                        const compressedFileName = file.name.replace(/\.[^/.]+$/, '_compressed.png');
                        const compressedFile = new File([compressedBlob], compressedFileName, { type: compressedBlob.type });

                        results.push({
                            fileName: compressedFileName,
                            originalSize,
                            compressedSize,
                            compressedBlob,
                            downloadUrl: URL.createObjectURL(compressedBlob)
                        });
                        success = true;
                    } catch (error) {
                        console.error(`Error compressing ${file.name}, attempt ${attempt}:`, error);
                        if (attempt === maxRetries) {
                            results.push({
                                fileName: file.name,
                                error: error.message
                            });
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        }
                    }
                }
            }

            compressorResult.innerHTML = results.map(result => {
                if (result.error) {
                    return `<p class="error">Error compressing ${result.fileName}: ${result.error}</p>`;
                }
                return `
                    <div class="compression-result">
                        <p><strong>${result.fileName}</strong></p>
                        <p>Original Size: ${(result.originalSize / 1024).toFixed(2)} KB</p>
                        <p>Compressed Size: ${(result.compressedSize / 1024).toFixed(2)} KB</p>
                        <p>Reduction: ${((1 - result.compressedSize / result.originalSize) * 100).toFixed(2)}%</p>
                        <a href="${result.downloadUrl}" download="${result.fileName}" class="btn download-btn">Download <i class='bx bx-download'></i></a>
                    </div>
                `;
            }).join('');

            selectedFiles = [];
            compressBtn.disabled = true;
        }

        compressBtn.addEventListener('click', compressImages);
    } else {
        console.error('Image Compressor elements not found');
    }

    // PDF to JPG Converter
    const pdfDropZone = document.getElementById('pdf-drop-zone');
    const pdfInput = document.getElementById('pdf-input');
    const convertBtn = document.getElementById('convert-btn');
    const converterResult = document.getElementById('converter-result');
    let selectedFile = null;

    if (pdfDropZone && pdfInput && convertBtn && converterResult) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            pdfDropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            pdfDropZone.addEventListener(eventName, () => pdfDropZone.classList.add('active'), { passive: false });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            pdfDropZone.addEventListener(eventName, () => pdfDropZone.classList.remove('active'), { passive: false });
        });

        pdfDropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer?.files;
            if (files && files.length > 0 && files[0].type === 'application/pdf' && files[0].size <= 10 * 1024 * 1024) {
                handleFile(files[0]);
            } else {
                converterResult.innerHTML = '<p class="error">Please select a valid PDF file (max 10MB).</p>';
            }
        });

        pdfInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0 && files[0].type === 'application/pdf' && files[0].size <= 10 * 1024 * 1024) {
                handleFile(files[0]);
            } else {
                converterResult.innerHTML = '<p class="error">Please select a valid PDF file (max 10MB).</p>';
            }
            e.target.value = '';
        });

        pdfDropZone.addEventListener('click', (e) => {
            e.stopPropagation();
            pdfInput.click();
        });

        pdfInput.addEventListener('click', (e) => e.stopPropagation());

        function handleFile(file) {
            selectedFile = file;
            convertBtn.disabled = false;
            renderFile();
        }

        function renderFile() {
            converterResult.innerHTML = '';
            if (!selectedFile) return;
            const ul = document.createElement('ul');
            ul.className = 'file-list';
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)</span>
                <i class='bx bx-trash' data-index="0"></i>
            `;
            ul.appendChild(li);
            converterResult.appendChild(ul);

            ul.querySelector('.bx-trash').addEventListener('click', () => {
                selectedFile = null;
                convertBtn.disabled = true;
                renderFile();
            });
        }

    async function convertToJPG() {
        if (!selectedFile) return;
        converterResult.innerHTML = '<p class="loading">Converting PDF...</p>';
        convertBtn.disabled = true;

        try {
            const { pdfjsLib } = window;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument(URL.createObjectURL(selectedFile)).promise;
            const results = [];

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
                const jpgBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                const jpgFileName = `${selectedFile.name.replace(/\.pdf$/, '')}_page${pageNum}.jpg`;
                const jpgFile = new File([jpgBlob], jpgFileName, { type: 'image/jpeg' });

                results.push({
                    fileName: jpgFileName,
                    originalSize: selectedFile.size,
                    convertedSize: jpgBlob.size,
                    downloadUrl: URL.createObjectURL(jpgBlob)
                });
            }

            converterResult.innerHTML = results.map(result => `
                <div class="conversion-result">
                    <p><strong>${result.fileName}</strong></p>
                    <p>Original PDF Size: ${(result.originalSize / 1024).toFixed(2)} KB</p>
                    <p>JPG Size: ${(result.convertedSize / 1024).toFixed(2)} KB</p>
                    <a href="${result.downloadUrl}" download="${result.fileName}" class="btn download-btn">Download <i class='bx bx-download'></i></a>
                </div>
            `).join('');

            selectedFile = null;
            convertBtn.disabled = true;

            setTimeout(() => {
                results.forEach(result => URL.revokeObjectURL(result.downloadUrl));
            }, 60000);
        } catch (error) {
            console.error('Error converting PDF:', error);
            converterResult.innerHTML = `<p class="error">Error converting ${selectedFile.name}: ${error.message}</p>`;
            convertBtn.disabled = false;
        }
    }

    convertBtn.addEventListener('click', convertToJPG);
} else {
    console.error('PDF Converter elements not found');
}
    // Welcome Page Functionality
    if (document.body.classList.contains('welcome-page')) {
        const popup = document.getElementById('greetingPopup');
        const body = document.body;
        const personalizeForm = document.getElementById('personalize-form');
        const closePopup = document.getElementById('closePopup');
        const greetingText = document.getElementById('greeting-text');
        const personalizeBtn = document.querySelector('.personalize-btn');
        const loader = personalizeBtn ? personalizeBtn.querySelector('.loader') : null;
        const userNameDisplay = document.querySelector('.welcome-content .user-name');

        console.log('[Welcome] Popup:', popup);
        console.log('[Welcome] Personalize Form:', personalizeForm);
        console.log('[Welcome] Close Popup:', closePopup);
        console.log('[Welcome] Greeting Text:', greetingText);
        console.log('[Welcome] Personalize Button:', personalizeBtn);
        console.log('[Welcome] Loader:', loader);
        console.log('[Welcome] User Name Display:', userNameDisplay);

        if (popup) {
            setTimeout(() => {
                popup.classList.add('visible');
                console.log('[Welcome] Popup shown');
            }, 1000);
        } else {
            console.error('[Welcome] Popup element (#greetingPopup) not found');
        }

        if (closePopup) {
            closePopup.addEventListener('click', () => {
                popup.classList.remove('visible');
                body.classList.add('content-visible');
                console.log('[Welcome] Popup closed via close button');
            });
        } else {
            console.error('[Welcome] Close popup button (#closePopup) not found');
        }

        async function sendDelayedEmail(name, email) {
            const emailContent = {
                name: name,
                email: email,
                message: `Dear ${name},\n\nThank you for visiting my portfolio today at codewithskye.github.io! I look forward to the opportunity to work with you in the near future. Please kindly refer me to friends, family, or any company you know that may need my services.\n\nBest regards,\nSkye`
            };
            // https://formspree.io/f/xpwrjqpp
            try {
                const response = await fetch('https://formspree.io/f/xpwrjqpp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(emailContent),
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    console.log(`[Welcome] Delayed email sent to ${email}`);
                } else {
                    const errorData = await response.json();
                    console.error(`[Welcome] Failed to send delayed email: ${errorData.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('[Welcome] Error sending delayed email:', error);
            }
        }

        if (personalizeForm) {
            personalizeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('[Welcome] Form submitted');

                const userNameInput = document.getElementById('user-name');
                const userEmailInput = document.getElementById('user-email');
                const userName = userNameInput ? userNameInput.value.trim() : '';
                const userEmail = userEmailInput ? userEmailInput.value.trim() : '';

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!userName || !userEmail || !emailRegex.test(userEmail)) {
                    console.warn('[Welcome] Form validation failed: Name or email invalid');
                    if (greetingText) {
                        greetingText.textContent = 'Please provide a valid name and email.';
                        greetingText.classList.add('error');
                        setTimeout(() => {
                            greetingText.classList.remove('error');
                            greetingText.textContent = 'Welcome to My World!';
                        }, 3000);
                    }
                    return;
                }

                if (personalizeBtn) personalizeBtn.disabled = true;
                if (loader) {
                    loader.classList.remove('hidden');
                    console.log('[Welcome] Loader shown');
                }
                if (greetingText) greetingText.textContent = 'Personalizing...';

                setTimeout(() => {
                    console.log('[Welcome] setTimeout executed');
                    try {
                        localStorage.setItem('userName', userName);
                        localStorage.setItem('userEmail', userEmail);
                        localStorage.setItem('formSubmitted', 'true');
                        console.log(`[Welcome] Saved userName "${userName}" and userEmail "${userEmail}" to localStorage`);

                        if (userNameDisplay) {
                            userNameDisplay.textContent = userName;
                            console.log(`[Welcome] Main content greeting updated with "${userName}"`);
                        } else {
                            console.warn('[Welcome] User name display element (.welcome-content .user-name) not found');
                        }

                        if (greetingText) {
                            greetingText.textContent = `Welcome, ${userName}!`;
                        }

                        if (loader) {
                            loader.classList.add('hidden');
                            console.log('[Welcome] Loader hidden');
                        }

                        if (personalizeBtn) personalizeBtn.disabled = false;

                        if (popup) {
                            popup.classList.remove('visible');
                            console.log('[Welcome] Popup closed after form submission');
                        } else {
                            console.error('[Welcome] Popup element (#greetingPopup) not found during form submission');
                        }
                        body.classList.add('content-visible');
                        console.log('[Welcome] Main content visible');

                        // Schedule the delayed email
                        setTimeout(() => {
                            sendDelayedEmail(userName, userEmail);
                        }, 1 * 60 * 1000); // 1 minutes delay

                        // Start audio playback after form submission
                        const audio = document.getElementById('welcome-audio');
                        if (audio) {
                            audio.muted = false;
                            audio.loop = true;
                            audio.play().then(() => {
                                isPlaying = true;
                                const toggleAudioBtn = document.getElementById('toggle-audio');
                                if (toggleAudioBtn) {
                                    toggleAudioBtn.querySelector('i').classList.replace('bx-volume-full', 'bx-volume-mute');
                                }
                                console.log('[Welcome] Audio started after form submission with looping enabled');
                            }).catch((error) => {
                                console.error('[Welcome] Audio playback failed:', error);
                            });
                        }
                    } catch (error) {
                        console.error('[Welcome] Error in form submission:', error);
                        if (greetingText) {
                            greetingText.textContent = 'An error occurred. Please try again.';
                            greetingText.classList.add('error');
                        }
                        if (loader) loader.classList.add('hidden');
                        if (personalizeBtn) personalizeBtn.disabled = false;
                    }
                }, 1500);
            });
        } else {
            console.error('[Welcome] Personalize form (#personalize-form) not found');
        }

        const audio = document.getElementById('welcome-audio');
        const toggleAudioBtn = document.getElementById('toggle-audio');
        let isPlaying = false;

        if (audio) {
            audio.muted = true;
            audio.play().then(() => {
                isPlaying = true;
                if (toggleAudioBtn) {
                    toggleAudioBtn.querySelector('i').classList.replace('bx-volume-full', 'bx-volume-mute');
                }
                console.log('[Welcome] Audio autoplay started');
            }).catch((error) => {
                console.log('[Welcome] Audio autoplay failed:', error);
            });

            if (toggleAudioBtn) {
                toggleAudioBtn.addEventListener('click', () => {
                    if (isPlaying) {
                        audio.pause();
                        toggleAudioBtn.querySelector('i').classList.replace('bx-volume-mute', 'bx-volume-full');
                    } else {
                        audio.muted = false;
                        audio.play();
                        toggleAudioBtn.querySelector('i').classList.replace('bx-volume-full', 'bx-volume-mute');
                    }
                    isPlaying = !isPlaying;
                    console.log(`[Welcome] Audio toggled: ${isPlaying ? 'Playing' : 'Paused'}`);
                });
            }
        }

        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercentage = (scrollTop / scrollHeight) * 100;
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${scrollPercentage}%`;
            } else {
                console.warn('Welcome page: Progress fill element (.progress-fill) not found');
            }
        });
    }
    function showPopup(popup, greetingText, timeDateDisplay, closePopup, pageType) {
        function getGreeting() {
            const now = new Date();
            const hours = now.getHours();
            if (hours < 12) return "Good Morning";
            if (hours < 18) return "Good Afternoon";
            return "Good Evening";
        }

        function updateTimeDate() {
            const now = new Date();
            if (timeDateDisplay) {
                timeDateDisplay.textContent = now.toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });
            }
        }

        if (popup) {
            setTimeout(() => {
                if (pageType === 'home') {
                    const userName = localStorage.getItem('userName');
                    const userNameDisplays = document.querySelectorAll('#user-name-display');
                    if (userName && userNameDisplays.length > 0) {
                        userNameDisplays.forEach(display => {
                            display.textContent = userName;
                        });
                    }
                    if (greetingText && userName) {
                        greetingText.textContent = `${getGreeting()} ${userName}, welcome to my portfolio!`;
                    } else if (greetingText) {
                        greetingText.textContent = `${getGreeting()}, welcome to my portfolio!`;
                    }
                } else if (pageType === 'technexus') {
                    if (greetingText) {
                        greetingText.textContent = 'Welcome to Tech Nexus!';
                    }
                }
                popup.classList.add('visible');
                updateTimeDate();
                setInterval(updateTimeDate, 1000);
            }, 1000);
        }

        if (closePopup) {
            closePopup.addEventListener('click', () => {
                popup.classList.remove('visible');
            });
        }
    }

    // Home Page Popup
    if (document.body.classList.contains('home-page')) {
        const popup = document.getElementById('greetingPopup');
        const greetingText = document.getElementById('greeting-text');
        const timeDateDisplay = document.getElementById('greeting-time-date');
        const closePopup = document.getElementById('closePopup');
        showPopup(popup, greetingText, timeDateDisplay, closePopup, 'home');
    }

    // Tech Nexus Page Popup
    if (document.body.classList.contains('technexus-page')) {
        const popup = document.getElementById('greetingPopup');
        const greetingText = document.getElementById('greeting-text');
        const timeDateDisplay = document.getElementById('greeting-time-date');
        const closePopup = document.getElementById('closePopup');
        showPopup(popup, greetingText, timeDateDisplay, closePopup, 'technexus');
    }

    // Window Load Event
    window.addEventListener('load', () => {
        window.dispatchEvent(new Event('resize'));
    });
});




// Excel to PDF Converter
const excelDropZone = document.getElementById('excel-drop-zone');
const excelInput = document.getElementById('excel-input');
const excelConvertBtn = document.getElementById('excel-convert-btn');
const excelConverterResult = document.getElementById('excel-converter-result');
let selectedExcelFile = null;

if (excelDropZone && excelInput && excelConvertBtn && excelConverterResult) {
    console.log('Excel to PDF Converter elements found');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        excelDropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Excel drop zone event: ${eventName}`);
        }, { passive: false });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        excelDropZone.addEventListener(eventName, () => {
            excelDropZone.classList.add('active');
            console.log('Excel drop zone active');
        }, { passive: false });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        excelDropZone.addEventListener(eventName, () => {
            excelDropZone.classList.remove('active');
            console.log('Excel drop zone inactive');
        }, { passive: false });
    });

    excelDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer?.files;
        console.log('Dropped files:', files);
        if (files && files.length > 0) {
            const file = files[0];
            console.log('File details:', { name: file.name, type: file.type, size: file.size });
            if (file.name.match(/\.(xlsx|xls)$/i) && file.size <= 10 * 1024 * 1024) {
                handleExcelFile(file);
            } else {
                excelConverterResult.innerHTML = '<p class="error">Please select a valid Excel file (.xlsx, .xls, max 10MB).</p>';
                console.log('File rejected: Invalid type or size');
            }
        }
    });

    excelInput.addEventListener('change', (e) => {
        const files = e.target.files;
        console.log('Selected files via input:', files);
        if (files && files.length > 0) {
            const file = files[0];
            console.log('File details:', { name: file.name, type: file.type, size: file.size });
            if (file.name.match(/\.(xlsx|xls)$/i) && file.size <= 10 * 1024 * 1024) {
                handleExcelFile(file);
            } else {
                excelConverterResult.innerHTML = '<p class="error">Please select a valid Excel file (.xlsx, .xls, max 10MB).</p>';
                console.log('File rejected: Invalid type or size');
            }
        }
        e.target.value = '';
    });

    excelDropZone.addEventListener('click', (e) => {
        console.log('Excel drop zone clicked');
        e.stopPropagation();
        excelInput.click();
    });

    excelInput.addEventListener('click', (e) => {
        console.log('Excel file input clicked');
        e.stopPropagation();
    });

    function handleExcelFile(file) {
        selectedExcelFile = file;
        excelConvertBtn.disabled = false;
        console.log('File selected:', file.name);
        renderExcelFile();
    }

    function renderExcelFile() {
        excelConverterResult.innerHTML = '';
        if (!selectedExcelFile) return;
        const ul = document.createElement('ul');
        ul.className = 'file-list';
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${selectedExcelFile.name} (${(selectedExcelFile.size / 1024).toFixed(2)} KB)</span>
            <i class='bx bx-trash' data-index="0"></i>
        `;
        ul.appendChild(li);
        excelConverterResult.appendChild(ul);

        ul.querySelector('.bx-trash').addEventListener('click', () => {
            selectedExcelFile = null;
            excelConvertBtn.disabled = true;
            console.log('File removed');
            renderExcelFile();
        });
    }

    async function convertExcelToPDF() {
        if (!selectedExcelFile) return;
        excelConverterResult.innerHTML = '<p class="loading">Converting Excel to PDF...</p>';
        excelConvertBtn.disabled = true;
        console.log('Starting conversion for:', selectedExcelFile.name);

        try {
            const arrayBuffer = await selectedExcelFile.arrayBuffer();
            console.log('Excel file read successfully');
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            console.log('Workbook parsed:', workbook.SheetNames);
            const { jsPDF } = window;
            if (!jsPDF) throw new Error('jsPDF library not loaded');
            const doc = new jsPDF();
            let yOffset = 10;

            workbook.SheetNames.forEach((sheetName, index) => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log(`Processing sheet: ${sheetName}, rows: ${jsonData.length}`);

                if (index > 0) doc.addPage();
                doc.text(sheetName, 10, yOffset);
                yOffset += 10;

                jsonData.forEach((row, rowIndex) => {
                    if (yOffset > 270) {
                        doc.addPage();
                        yOffset = 10;
                    }
                    row.forEach((cell, colIndex) => {
                        doc.text(String(cell || ''), 10 + colIndex * 50, yOffset);
                    });
                    yOffset += 10;
                });
            });

            const pdfBlob = doc.output('blob');
            const pdfFileName = selectedExcelFile.name.replace(/\.(xlsx|xls)$/, '.pdf');
            const downloadUrl = URL.createObjectURL(pdfBlob);

            excelConverterResult.innerHTML = `
                <div class="conversion-result">
                    <p><strong>${pdfFileName}</strong></p>
                    <p>Original Excel Size: ${(selectedExcelFile.size / 1024).toFixed(2)} KB</p>
                    <p>PDF Size: ${(pdfBlob.size / 1024).toFixed(2)} KB</p>
                    <a href="${downloadUrl}" download="${pdfFileName}" class="btn download-btn">Download <i class='bx bx-download'></i></a>
                </div>
            `;
            console.log('Conversion successful, PDF generated:', pdfFileName);

            selectedExcelFile = null;
            excelConvertBtn.disabled = true;

            setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
        } catch (error) {
            console.error('Error converting Excel to PDF:', error);
            excelConverterResult.innerHTML = `<p class="error">Error converting ${selectedExcelFile.name}: ${error.message}</p>`;
            excelConvertBtn.disabled = false;
        }
    }

    excelConvertBtn.addEventListener('click', convertExcelToPDF);
} else {
    console.error('Excel to PDF Converter elements not found:', {
        excelDropZone: !!excelDropZone,
        excelInput: !!excelInput,
        excelConvertBtn: !!excelConvertBtn,
        excelConverterResult: !!excelConverterResult
    });
}


const suggestionCache = new Map();
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const popularCryptos = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' }
];

const isOnline = () => navigator.onLine;
let tradingViewWidget = null;

window.addEventListener('load', () => {
  const elements = {
    cryptoSelect: document.getElementById('crypto-select'),
    cryptoSuggestions: document.getElementById('crypto-suggestions'),
    amountInput: document.getElementById('amount'),
    currencySelect: document.getElementById('currency-select'),
    calculateBtn: document.getElementById('calculate-btn'),
    calculatorResult: document.getElementById('calculator-result'),
    tokenDetails: document.getElementById('token-details'),
    tokenName: document.getElementById('token-name'),
    tokenSymbol: document.getElementById('token-symbol'),
    tokenPrice: document.getElementById('token-price'),
    tokenMarketCap: document.getElementById('token-market-cap'),
    tokenVolume: document.getElementById('token-volume'),
    tokenChange: document.getElementById('token-change'),
    tokenCreationDate: document.getElementById('token-creation-date'),
    tokenOwner: document.getElementById('token-owner'),
    priceChart: document.getElementById('price-chart'),
    tradingViewChart: document.getElementById('tradingview-chart'),
    loadingIndicator: document.getElementById('loading-indicator')
  };

  if (Object.values(elements).some(el => !el)) {
    console.error('Missing required elements');
    return;
  }

  let selectedCryptoId = '';
  const { cryptoSelect, cryptoSuggestions, loadingIndicator, tradingViewChart, priceChart, tokenDetails, calculatorResult } = elements;

  const coinGeckoToTradingView = {
    'bitcoin': 'BINANCE:BTCUSDT',
    'ethereum': 'BINANCE:ETHUSDT',
    'binancecoin': 'BINANCE:BNBUSDT',
    'the-open-network': 'BINANCE:TONUSDT',
    'solana': 'BINANCE:SOLUSDT',
    'cardano': 'BINANCE:ADAUSDT',
    'ripple': 'BINANCE:XRPUSDT',
    'dogecoin': 'BINANCE:DOGEUSDT',
    'polkadot': 'BINANCE:DOTUSDT',
    'chainlink': 'BINANCE:LINKUSDT'
  };

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const API_CONFIG = {
    marketData: {
      baseUrl: 'https://api.coingecko.com/api/v3',
      endpoints: {
        search: '/search'
      }
    }
  };

  const fetchSuggestions = debounce(async (query) => {
    if (query.length < 2) return cryptoSuggestions.style.display = 'none';
    if (suggestionCache.has(query)) {
      const { data, timestamp } = suggestionCache.get(query);
      if (Date.now() - timestamp < CACHE_TTL) return renderSuggestions(data);
    }
    try {
      loadingIndicator.style.display = 'block';
      const url = `${API_CONFIG.marketData.baseUrl}${API_CONFIG.marketData.endpoints.search}?query=${encodeURIComponent(query)}`;
      const data = await fetchWithRetry(url);
      suggestionCache.set(query, { data, timestamp: Date.now() });
      renderSuggestions(data);
    } catch (err) {
      console.error('Suggestions error:', err);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }, 150);

  const renderSuggestions = (data) => {
    cryptoSuggestions.innerHTML = '';
    if (!data.coins.length) {
      const fallback = coinGeckoToTradingView['bitcoin'];
      updateTradingViewChart('bitcoin');
      return;
    }
    data.coins.slice(0, 5).forEach(coin => {
      const li = document.createElement('li');
      li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
      li.dataset.id = coin.id;
      li.onclick = () => {
        cryptoSelect.value = li.textContent;
        selectedCryptoId = coin.id;
        cryptoSuggestions.style.display = 'none';
        fetchTokenDetails(coin.id);
        updateTradingViewChart(coin.id);
      };
      cryptoSuggestions.appendChild(li);
    });
    cryptoSuggestions.style.display = 'block';
  };

  const fetchTokenDetails = async (id) => {
    if (tokenCache.has(id)) {
      const { data, timestamp } = tokenCache.get(id);
      if (Date.now() - timestamp < CACHE_TTL) return renderTokenDetails(data);
    }
    try {
      loadingIndicator.style.display = 'block';
      const url = `${API_CONFIG.marketData.baseUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
      const data = await fetchWithRetry(url);
      tokenCache.set(id, { data, timestamp: Date.now() });
      renderTokenDetails(data);
    } catch (err) {
      console.error('Token detail error:', err);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  };

  const renderTokenDetails = (data) => {
    elements.tokenName.textContent = `Name: ${data.name}`;
    elements.tokenSymbol.textContent = `Symbol: ${data.symbol.toUpperCase()}`;
    elements.tokenPrice.textContent = `Price: $${data.market_data.current_price.usd.toFixed(2)}`;
    elements.tokenMarketCap.textContent = `Market Cap: $${(data.market_data.market_cap.usd / 1e9).toFixed(2)}B`;
    elements.tokenVolume.textContent = `24h Volume: $${(data.market_data.total_volume.usd / 1e6).toFixed(2)}M`;
    elements.tokenChange.textContent = `24h Change: ${data.market_data.price_change_percentage_24h.toFixed(2)}%`;
    elements.tokenCreationDate.textContent = `Creation Date: ${data.genesis_date || 'Not Available'}`;
    elements.tokenOwner.textContent = `Owner: ${data.links?.homepage[0] ? new URL(data.links.homepage[0]).hostname : 'Not Available'}`;
    elements.tokenDetails.style.display = 'block';
  };

  const initTradingViewChart = (cryptoId) => {
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => createTradingViewWidget(cryptoId);
      script.onerror = () => console.error('TradingView script failed');
      document.head.appendChild(script);
    } else {
      createTradingViewWidget(cryptoId);
    }
  };

  const createTradingViewWidget = (cryptoId) => {
    const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
    const isMobile = window.innerWidth <= 768;
    tradingViewChart.innerHTML = '';
    tradingViewWidget = new TradingView.widget({
      width: '100%',
      height: isMobile ? 450 : 650,
      symbol,
      interval: 'W',
      range: '1M',
      timezone: 'Etc/UTC',
      theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      container_id: 'tradingview-chart'
    });
    priceChart.style.display = 'block';
  };

  const updateTradingViewChart = (cryptoId) => {
    const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
    if (tradingViewWidget) {
      tradingViewWidget.setSymbol(symbol, 'W');
    } else {
      initTradingViewChart(cryptoId);
    }
  };

  elements.calculateBtn.onclick = calculateConversion;
  elements.amountInput.onkeypress = (e) => {
    if (e.key === 'Enter') calculateConversion();
  };

  async function calculateConversion() {
    const amount = parseFloat(elements.amountInput.value);
    const currency = elements.currencySelect.value;
    if (!selectedCryptoId || isNaN(amount)) return;
    try {
      loadingIndicator.style.display = 'block';
      const url = `${API_CONFIG.marketData.baseUrl}/simple/price?ids=${selectedCryptoId}&vs_currencies=${currency}`;
      const data = await fetchWithRetry(url);
      const price = data[selectedCryptoId][currency];
      const result = (amount * price).toFixed(2);
      calculatorResult.innerHTML = `<span>${amount} ${selectedCryptoId} = ${result} ${currency.toUpperCase()}</span>`;
    } catch (err) {
      console.error('Conversion error:', err);
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }

  cryptoSelect.addEventListener('input', e => fetchSuggestions(e.target.value));
  cryptoSelect.addEventListener('focus', () => {
    if (cryptoSelect.value) fetchSuggestions(cryptoSelect.value);
  });
});



// Add to script.js
document.addEventListener('DOMContentLoaded', () => {
    const scrollArrow = document.getElementById('scroll-arrow');
    if (scrollArrow) {
        const toggleArrow = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const threshold = 300;

            if (scrollPosition > threshold && scrollPosition < documentHeight - windowHeight - threshold) {
                scrollArrow.classList.remove('hidden');
                scrollArrow.classList.remove('down');
                scrollArrow.title = 'Scroll to top';
            } else if (scrollPosition >= documentHeight - windowHeight - threshold) {
                scrollArrow.classList.remove('hidden');
                scrollArrow.classList.add('down');
                scrollArrow.title = 'Scroll to bottom';
            } else {
                scrollArrow.classList.add('hidden');
            }
        };

        window.addEventListener('scroll', toggleArrow);

        scrollArrow.addEventListener('click', () => {
            if (scrollArrow.classList.contains('down')) {
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        toggleArrow(); // Initial check
    }
});



document.addEventListener('DOMContentLoaded', () => {
    // Check if current page is index.html
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/index';

    if (!isIndexPage) {
        // Exit: use default browser cursor on all other pages
        return;
    }

    // Check if the device is a desktop
    const isDesktop = !('ontouchstart' in window || navigator.maxTouchPoints) && 
                      window.matchMedia('(min-width: 1024px)').matches;

    if (!isDesktop) {
        const customCursor = document.getElementById('customCursor');
        if (customCursor) customCursor.style.display = 'none';
        return;
    }

    // Apply desktop cursor class
    document.body.classList.add('desktop-cursor');

    const customCursor = document.getElementById('customCursor');
    let lastX = 0, lastY = 0;

    const updateCursorPosition = (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        requestAnimationFrame(() => {
            customCursor.style.left = `${lastX}px`;
            customCursor.style.top = `${lastY}px`;
            customCursor.classList.remove('hidden');
        });
    };

    document.addEventListener('mousemove', updateCursorPosition);

    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget && !e.toElement) {
            requestAnimationFrame(() => {
                customCursor.classList.add('hidden');
            });
        }
    });

    const interactiveElements = document.querySelectorAll('a, button, input, [role="button"]');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            customCursor.classList.add('hover');
        });
        element.addEventListener('mouseleave', () => {
            customCursor.classList.remove('hover');
        });
    });
});


// lock inspect page

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", e => {
    if (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
    }
    if (e.keyCode === 123) { 
        e.preventDefault();
    }
});

// AI Chatbot Assistant
class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.responses = {
            greetings: [
                "Hello! I'm your AI assistant. How can I help you today?",
                "Hi there! I'm here to help you navigate the portfolio.",
                "Welcome! What would you like to know about?"
            ],
            navigation: {
                home: "I'll take you to the home page where you can see the main portfolio overview.",
                about: "The about section contains detailed information about skills and experience.",
                projects: "You can view all projects and their details in the projects section.",
                contact: "The contact page has all the ways to get in touch.",
                technexus: "Tech Nexus is a comprehensive trading and analysis platform."
            },
            projects: {
                types: "The portfolio includes web development, mobile apps, trading platforms, and AI solutions.",
                delivery: "Project delivery time typically ranges from 1-4 weeks depending on complexity.",
                technologies: "Technologies used include React, Node.js, Python, JavaScript, and various APIs.",
                process: "The development process includes planning, design, development, testing, and deployment."
            },
            general: {
                skills: "Skills include full-stack development, UI/UX design, API integration, and database management.",
                experience: "With years of experience in web development and modern technologies.",
                availability: "Currently available for new projects and collaborations."
            }
        };
        this.suggestions = [
            "Show me projects",
            "How to contact?",
            "What technologies?",
            "Project delivery time?",
            "About skills"
        ];
        this.init();
    }

    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.showWelcomeMessage();
    }

    createChatbotHTML() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ai-chatbot-toggle';
        toggleBtn.innerHTML = '<i class="bx bx-bot"></i>';
        toggleBtn.setAttribute('aria-label', 'Open AI Assistant');
        document.body.appendChild(toggleBtn);

        // Create chatbot widget
        const widget = document.createElement('div');
        widget.className = 'ai-chatbot-widget';
        widget.innerHTML = `
            <div class="ai-chatbot-header">
                <h3>AI Assistant</h3>
                <button class="ai-chatbot-close" aria-label="Close chat">
                    <i class="bx bx-x"></i>
                </button>
            </div>
            <div class="ai-chatbot-messages" id="ai-messages"></div>
            <div class="ai-chatbot-input">
                <input type="text" placeholder="Type your message..." id="ai-input" autocomplete="off">
                <button class="ai-send-btn" id="ai-send" aria-label="Send message">
                    <i class="bx bx-send"></i>
                </button>
            </div>
        `;
        document.body.appendChild(widget);

        this.toggleBtn = toggleBtn;
        this.widget = widget;
        this.messagesContainer = document.getElementById('ai-messages');
        this.input = document.getElementById('ai-input');
        this.sendBtn = document.getElementById('ai-send');
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.widget.querySelector('.ai-chatbot-close').addEventListener('click', () => this.closeChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.widget.contains(e.target) && !this.toggleBtn.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.widget.classList.add('active');
        this.input.focus();
    }

    closeChat() {
        this.isOpen = false;
        this.widget.classList.remove('active');
    }

    showWelcomeMessage() {
        setTimeout(() => {
            const welcomeMsg = this.getRandomResponse(this.responses.greetings);
            this.addMessage(welcomeMsg, 'bot');
            this.showSuggestions();
        }, 1000);
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.input.value = '';
        
        this.showTyping();
        setTimeout(() => {
            this.hideTyping();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
            this.showSuggestions();
        }, 1000 + Math.random() * 1000);
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            Typing
            <div class="ai-typing-dots">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showSuggestions() {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'ai-suggestions';
        
        const randomSuggestions = this.suggestions
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        randomSuggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'ai-suggestion-btn';
            btn.textContent = suggestion;
            btn.addEventListener('click', () => {
                this.input.value = suggestion;
                this.sendMessage();
                suggestionsDiv.remove();
            });
            suggestionsDiv.appendChild(btn);
        });

        this.messagesContainer.appendChild(suggestionsDiv);
        this.scrollToBottom();
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Navigation intents
        if (lowerMessage.includes('home') || lowerMessage.includes('main')) {
            this.navigateTo('home.html');
            return this.responses.navigation.home;
        }
        if (lowerMessage.includes('about') || lowerMessage.includes('skills')) {
            this.navigateTo('about.html');
            return this.responses.navigation.about;
        }
        if (lowerMessage.includes('project')) {
            this.navigateTo('projects.html');
            return this.responses.navigation.projects;
        }
        if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
            this.navigateTo('contact.html');
            return this.responses.navigation.contact;
        }
        if (lowerMessage.includes('technexus') || lowerMessage.includes('trading')) {
            this.navigateTo('technexus.html');
            return this.responses.navigation.technexus;
        }

        // Project-related questions
        if (lowerMessage.includes('delivery') || lowerMessage.includes('time') || lowerMessage.includes('how long')) {
            return this.responses.projects.delivery;
        }
        if (lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
            return this.responses.projects.technologies;
        }
        if (lowerMessage.includes('type') || lowerMessage.includes('kind')) {
            return this.responses.projects.types;
        }
        if (lowerMessage.includes('process') || lowerMessage.includes('workflow')) {
            return this.responses.projects.process;
        }

        // General questions
        if (lowerMessage.includes('experience')) {
            return this.responses.general.experience;
        }
        if (lowerMessage.includes('available') || lowerMessage.includes('hire')) {
            return this.responses.general.availability;
        }

        // Greetings
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return this.getRandomResponse(this.responses.greetings);
        }

        // Default response
        return "I'd be happy to help! You can ask me about projects, skills, contact information, or use the suggestions below.";
    }

    navigateTo(page) {
        setTimeout(() => {
            window.location.href = page;
        }, 1500);
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize AI Chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIChatbot();
});