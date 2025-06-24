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
        throw new Error('Invalid wallet address format');
    }
    if (!crypto || !API_CONFIG[crypto]) {
        throw new Error('Invalid cryptocurrency');
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

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
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

            if (!hasProjects && filter !== 'all') {
                projectsContainer.innerHTML = '';
                projectsContainer.appendChild(comingSoonMessage);
            } else if (filter === 'all') {
                projectsContainer.innerHTML = '';
                projectCards.forEach(card => projectsContainer.appendChild(card));
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

    // Chatbot Functionality
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotSendBtn = document.querySelector('.chatbot-send');
    if (chatbotInput && chatbotMessages && chatbotSendBtn) {
        async function fetchAIResponse(query) {
            const mockResponses = {
                'bitcoin price': 'The current price of Bitcoin is approximately $60,000 USD, based on recent market data.',
                'crypto news': 'Recent crypto news includes Bitcoin reaching a new all-time high and Ethereum upgrades improving transaction speeds.',
                'what is ui/ux': 'UI/UX refers to User Interface and User Experience design, focusing on creating intuitive and visually appealing digital products.',
                'web development': 'Web development involves building websites using HTML, CSS, and JavaScript. Popular frameworks include React, Angular, and Node.js.',
                'crypto calculator': 'A crypto calculator converts cryptocurrency amounts to fiat currencies like USD or EUR, using based on current market prices.',
                default: 'Sorry, I don’t have specific information on that topic. Try asking about crypto, UI/UX, or web development!'
            };

            const queryLower = query.toLowerCase().trim();
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockResponses[queryLower] || mockResponses.default);
                }, 1000);
            });
        }

        function addMessage(content, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            messageDiv.textContent = content;
            chatbotMessages.appendChild(messageDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        async function handleChatbotInput() {
            const query = chatbotInput.value.trim();
            if (!query) return;

            addMessage(query, true);
            chatbotInput.value = '';

            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message bot-message';
            loadingDiv.textContent = 'Thinking...';
            chatbotMessages.appendChild(loadingDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            try {
                const response = await fetchAIResponse(query);
                loadingDiv.remove();
                addMessage(response);
            } catch (error) {
                console.error('Error fetching AI response:', error);
                loadingDiv.remove();
                addMessage('Sorry, something went wrong. Please try again later.');
            }
        }

        chatbotSendBtn.addEventListener('click', handleChatbotInput);
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatbotInput();
        });
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
                "theme": "dark",
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

    // Crypto Calculator
    // const cryptoSearch = document.getElementById('crypto-search');
    // const suggestionsList = document.getElementById('crypto-suggestions');
    // const cryptoAmount = document.getElementById('crypto-amount');
    // const currencySelect = document.getElementById('currency-select');
    // const calculateBtn = document.getElementById('calculate-btn');
    // const calculatorResult = document.getElementById('calculator-result');
    // if (cryptoSearch && suggestionsList && cryptoAmount && currencySelect && calculateBtn && calculatorResult) {
    //     let cryptoList = [];
    //     let selectedCrypto = null;
    //     const popularCryptos = ['bitcoin', 'ethereum', 'solana', 'cardano', 'binancecoin', 'ripple', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'];

    //     async function fetchCryptoList() {
    //         try {
    //             const response = await fetch('https://api.coingecko.com/api/v3/coins/list', { signal: AbortSignal.timeout(5000) });
    //             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    //             cryptoList = await response.json();
    //         } catch (error) {
    //             console.error('Error fetching crypto list:', error);
    //             calculatorResult.innerHTML = '<span>Error loading cryptocurrency list. Please refresh your browser or try again later, Thank You.</span>';
    //             calculatorResult.classList.add('error');
    //         }
    //     }

    //     function formatNumber(number, decimals = 2) {
    //         return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    //     }

    //     const showSuggestions = debounce((query) => {
    //         suggestionsList.innerHTML = '';
    //         suggestionsList.style.display = 'none';
    //         if (!query) return;

    //         const queryLower = query.toLowerCase().trim();
    //         const scoredCryptos = cryptoList
    //             .map(coin => {
    //                 const nameLower = coin.name.toLowerCase();
    //                 const symbolLower = coin.symbol.toLowerCase();
    //                 let score = 0;
    //                 if (nameLower === queryLower || symbolLower === queryLower) score += 100;
    //                 if (nameLower.startsWith(queryLower) || symbolLower.startsWith(queryLower) || popularCryptos.includes(coin.id)) score += 50;
    //                 if (nameLower.includes(queryLower) || symbolLower.includes(queryLower)) score += 20;
    //                 return { coin, score };
    //             })
    //             .filter(item => item.score > 0)
    //             .sort((a, b) => b.score - a.score || a.coin.name.localeCompare(b.coin.name))
    //             .slice(0, 5);

    //         if (scoredCryptos.length === 0) {
    //             suggestionsList.innerHTML = '<li>No matching cryptocurrencies found.</li>';
    //             suggestionsList.style.display = 'block';
    //             return;
    //         }

    //         scoredCryptos.forEach(({ coin }) => {
    //             const li = document.createElement('li');
    //             li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    //             li.dataset.id = coin.id;
    //             li.dataset.symbol = coin.symbol.toUpperCase();
    //             li.addEventListener('click', () => {
    //                 cryptoSearch.value = `${coin.name} (${coin.symbol.toUpperCase()})`;
    //                 selectedCrypto = { id: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name };
    //                 suggestionsList.innerHTML = '';
    //                 suggestionsList.style.display = 'none';
    //             });
    //             suggestionsList.appendChild(li);
    //         });

    //         suggestionsList.style.display = 'block';
    //     }, 500);

    //     async function calculateConversion() {
    //         const amount = parseFloat(cryptoAmount.value);
    //         const currency = currencySelect.value.toLowerCase();
    //         calculatorResult.innerHTML = '';
    //         calculatorResult.classList.remove('error');

    //         if (!selectedCrypto) {
    //             calculatorResult.innerHTML = '<span>Please select a valid cryptocurrency.</span>';
    //             calculatorResult.classList.add('error');
    //             return;
    //         }
    //         if (isNaN(amount) || amount <= 0) {
    //             calculatorResult.innerHTML = '<span>Please enter a valid amount.</span>';
    //             calculatorResult.classList.add('error');
    //             return;
    //         }

    //         try {
    //             calculatorResult.innerHTML = '<p>Loading...</p>';
    //             const price = await fetchCryptoPrice(selectedCrypto.id, currency);
    //             const convertedValue = amount * price;
    //             calculatorResult.innerHTML = `<span>${formatNumber(amount, 8)} ${selectedCrypto.symbol} = ${formatNumber(convertedValue, 2)} ${currency.toUpperCase()}</span>`;
    //         } catch (error) {
    //             console.error('Error fetching crypto price:', error);
    //             calculatorResult.innerHTML = '<p>Error fetching price data. Please try again later.</p>';
    //             calculatorResult.classList.add('error');
    //         }
    //     }

    //     fetchCryptoList();

    //     cryptoSearch.addEventListener('input', (e) => {
    //         selectedCrypto = null;
    //         showSuggestions(e.target.value);
    //     });

    //     cryptoSearch.addEventListener('blur', () => {
    //         setTimeout(() => { suggestionsList.style.display = 'none'; }, 200);
    //     });

    //     cryptoSearch.addEventListener('focus', () => {
    //         if (cryptoSearch.value) showSuggestions(cryptoSearch.value);
    //     });

    //     cryptoSearch.addEventListener('keypress', (e) => {
    //         if (e.key === 'Enter' && selectedCrypto) calculateConversion();
    //     });

    //     calculateBtn.addEventListener('click', calculateConversion);
    //     cryptoAmount.addEventListener('keypress', (e) => {
    //         if (e.key === 'Enter' && selectedCrypto) calculateConversion();
    //     });
    // }

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
                trackerResult.innerHTML = `<p>Error: ${error.message}. Please ensure your wallet address is valid.</p>`;
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

    // Contact Form
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const textarea = contactForm.querySelector('textarea');
            const formData = new FormData(contactForm);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            try {
                const response = await fetch('https://formspree.io/f/movdqpoe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(formObject),
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    alert('Message sent successfully!');
                    contactForm.reset();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || 'Failed to send message. Please try again.'}`);
                }
            } catch (error) {
                alert('An error occurred while sending the message. Please try again later.');
                console.error('Form submission error:', error);
            }
            if (textarea) textarea.focus();
        });
    }

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletter-form');
    const feedbackDiv = document.getElementById('newsletter-feedback');
    if (newsletterForm && feedbackDiv) {
        const loader = feedbackDiv.querySelector('.loader');
        const successMessage = feedbackDiv.querySelector('.success-message');
        const errorMessage = feedbackDiv.querySelector('.error-message');

        const initializeFeedback = () => {
            console.log('[Newsletter] Initializing feedback');
            if (loader) {
                loader.classList.add('hidden');
                console.log('[Newsletter] Loader hidden:', loader.classList.contains('hidden'));
            }
            if (successMessage) {
                successMessage.classList.add('hidden');
                console.log('[Newsletter] Success message hidden:', successMessage.classList.contains('hidden'));
            }
            if (errorMessage) {
                errorMessage.classList.add('hidden');
                errorMessage.textContent = '';
                console.log('[Newsletter] Error message hidden:', errorMessage.classList.contains('hidden'));
            }
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = false;
        };

        initializeFeedback();

        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[Newsletter] Form submitted');
            const submitButton = newsletterForm.querySelector('button[type="submit"]');
            const emailInput = newsletterForm.querySelector('input[name="email"]');
            console.log('[Newsletter] Email value:', emailInput ? emailInput.value : 'No email input');

            initializeFeedback();
            if (loader) {
                loader.classList.remove('hidden');
                console.log('[Newsletter] Loader shown');
            }
            if (submitButton) submitButton.disabled = true;

            try {
                const formData = new FormData(newsletterForm);
                console.log('[Newsletter] Form data:', Object.fromEntries(formData));
                const response = await fetch('https://formspree.io/f/xqabkwrp', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(5000)
                });

                console.log('[Newsletter] Response status:', response.status, response.ok);
                if (loader) {
                    loader.classList.add('hidden');
                    console.log('[Newsletter] Loader hidden after response');
                }

                if (response.ok) {
                    console.log('[Newsletter] Submission successful');
                    if (successMessage) {
                        successMessage.classList.remove('hidden');
                        console.log('[Newsletter] Success message shown:', !successMessage.classList.contains('hidden'));
                        successMessage.offsetHeight;
                    } else {
                        console.error('[Newsletter] Success message element not found');
                    }
                    newsletterForm.reset();
                    setTimeout(() => {
                        console.log('[Newsletter] Hiding success message after 5 seconds');
                        initializeFeedback();
                    }, 5000);
                } else {
                    const errorData = await response.json();
                    console.error('[Newsletter] Response error:', errorData);
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('[Newsletter] Submission error:', error.message);
                if (loader) {
                    loader.classList.add('hidden');
                    console.log('[Newsletter] Loader hidden after error');
                }
                if (errorMessage) {
                    errorMessage.textContent = 'Failed to subscribe. Please try again.';
                    errorMessage.classList.remove('hidden');
                    console.log('[Newsletter] Error message shown');
                } else {
                    console.error('[Newsletter] Error message element not found');
                }
                if (submitButton) submitButton.disabled = false;
            }
        });

        newsletterForm.addEventListener('reset', () => {
            console.log('[Newsletter] Form reset manually');
            initializeFeedback();
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
                const response = await fetch('https://formspree', {
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

// const suggestionCache = new Map();
// const tokenCache = new Map();
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// const popularCryptos = [
//   { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
//   { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
//   { id: 'solana', name: 'Solana', symbol: 'SOL' }
// ];

// const isOnline = () => navigator.onLine;
// let tradingViewWidget = null;

// document.addEventListener('DOMContentLoaded', () => {
//   const elements = {
//     cryptoSelect: document.getElementById('crypto-select'),
//     cryptoSuggestions: document.getElementById('crypto-suggestions'),
//     amountInput: document.getElementById('amount'),
//     currencySelect: document.getElementById('currency-select'),
//     calculateBtn: document.getElementById('calculate-btn'),
//     calculatorResult: document.getElementById('calculator-result'),
//     tokenDetails: document.getElementById('token-details'),
//     tokenName: document.getElementById('token-name'),
//     tokenSymbol: document.getElementById('token-symbol'),
//     tokenPrice: document.getElementById('token-price'),
//     tokenMarketCap: document.getElementById('token-market-cap'),
//     tokenVolume: document.getElementById('token-volume'),
//     tokenChange: document.getElementById('token-change'),
//     tokenCreationDate: document.getElementById('token-creation-date'),
//     tokenOwner: document.getElementById('token-owner'),
//     priceChart: document.getElementById('price-chart'),
//     tradingViewChart: document.getElementById('tradingview-chart'),
//     loadingIndicator: document.getElementById('loading-indicator')
//   };

//   if (Object.values(elements).every(el => el)) {
//     let selectedCryptoId = '';
//     const { cryptoSelect, cryptoSuggestions, loadingIndicator, tradingViewChart, priceChart, tokenDetails, calculatorResult } = elements;

//     const coinGeckoToTradingView = {
//       'bitcoin': 'BINANCE:BTCUSDT',
//       'ethereum': 'BINANCE:ETHUSDT',
//       'binancecoin': 'BINANCE:BNBUSDT',
//       'the-open-network': 'BINANCE:TONUSDT',
//       'solana': 'BINANCE:SOLUSDT',
//       'cardano': 'BINANCE:ADAUSDT',
//       'ripple': 'BINANCE:XRPUSDT',
//       'dogecoin': 'BINANCE:DOGEUSDT',
//       'polkadot': 'BINANCE:DOTUSDT',
//       'chainlink': 'BINANCE:LINKUSDT'
//     };

//     const debounce = (func, delay) => {
//       let timeout;
//       return (...args) => {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func(...args), delay);
//       };
//     };

//     const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
//       for (let i = 0; i < retries; i++) {
//         try {
//           const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
//           if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
//           return await response.json();
//         } catch (error) {
//           if (i === retries - 1) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay));
//         }
//       }
//     };

//     const fetchSuggestions = debounce(async (query) => {
//       if (query.length < 2) {
//         cryptoSuggestions.style.display = 'none';
//         return;
//       }
//       if (suggestionCache.has(query)) {
//         const { data, timestamp } = suggestionCache.get(query);
//         if (Date.now() - timestamp < CACHE_TTL) {
//           renderSuggestions(data);
//           return;
//         }
//       }
//       if (!isOnline()) {
//         renderSuggestions({ coins: popularCryptos });
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}${API_CONFIG.marketData.endpoints.search}?query=${encodeURIComponent(query)}`
//         );
//         suggestionCache.set(query, { data, timestamp: Date.now() });
//         renderSuggestions(data);
//       } catch (error) {
//         console.error('Error fetching suggestions:', error);
//         calculatorResult.innerHTML = '<span class="error">Error fetching suggestions. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     }, 200);

//     const renderSuggestions = (data) => {
//       cryptoSuggestions.innerHTML = '';
//       data.coins.slice(0, 5).forEach(coin => {
//         const li = document.createElement('li');
//         li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
//         li.dataset.id = coin.id;
//         li.addEventListener('click', () => {
//           cryptoSelect.value = `${coin.name} (${coin.symbol.toUpperCase()})`;
//           selectedCryptoId = coin.id;
//           cryptoSuggestions.style.display = 'none';
//           fetchTokenDetails(coin.id);
//           updateTradingViewChart(coin.id);
//         });
//         cryptoSuggestions.appendChild(li);
//       });
//       cryptoSuggestions.style.display = data.coins.length ? 'block' : 'none';
//     };

//     const fetchTokenDetails = async (id) => {
//       if (tokenCache.has(id)) {
//         const { data, timestamp } = tokenCache.get(id);
//         if (Date.now() - timestamp < CACHE_TTL) {
//           renderTokenDetails(data);
//           return;
//         }
//       }
//       if (!isOnline()) {
//         tokenDetails.style.display = 'none';
//         calculatorResult.innerHTML = '<span class="error">Offline. Please check your connection.</span>';
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
//         );
//         tokenCache.set(id, { data, timestamp: Date.now() });
//         renderTokenDetails(data);
//       } catch (error) {
//         console.error('Error fetching token details:', error);
//         tokenDetails.style.display = 'none';
//         calculatorResult.innerHTML = '<span class="error">Error fetching token details. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     };

//     const renderTokenDetails = (data) => {
//       elements.tokenName.textContent = `Name: ${data.name}`;
//       elements.tokenSymbol.textContent = `Symbol: ${data.symbol.toUpperCase()}`;
//       elements.tokenPrice.textContent = `Price: $${data.market_data.current_price.usd.toFixed(2)}`;
//       elements.tokenMarketCap.textContent = `Market Cap: $${(data.market_data.market_cap.usd / 1e9).toFixed(2)}B`;
//       elements.tokenVolume.textContent = `24h Volume: $${(data.market_data.total_volume.usd / 1e6).toFixed(2)}M`;
//       elements.tokenChange.textContent = `24h Change: ${data.market_data.price_change_percentage_24h.toFixed(2)}%`;
//       elements.tokenCreationDate.textContent = `Creation Date: ${data.genesis_date || 'Not Available'}`;
//       elements.tokenOwner.textContent = `Owner: ${data.links?.homepage[0] ? new URL(data.links.homepage[0]).hostname : 'Not Available'}`;
//       tokenDetails.style.display = 'block';
//     };

//     const initTradingViewChart = (cryptoId) => {
//       if (!window.TradingView) {
//         const script = document.createElement('script');
//         script.src = 'https://s3.tradingview.com/tv.js';
//         script.async = true;
//         script.onload = () => createTradingViewWidget(cryptoId);
//         script.onerror = () => {
//           console.error('Failed to load TradingView script');
//           priceChart.style.display = 'none';
//           calculatorResult.innerHTML = '<span class="error">Failed to load chart. Please try again.</span>';
//         };
//         document.head.appendChild(script);
//       } else {
//         createTradingViewWidget(cryptoId);
//       }
//     };

//     const createTradingViewWidget = (cryptoId) => {
//       const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
//       const isMobile = window.innerWidth <= 768;
//       tradingViewChart.innerHTML = '';
//       tradingViewWidget = new TradingView.widget({
//         width: '100%',
//         height: isMobile ? 450 : 650,
//         symbol,
//         interval: 'D',
//         timezone: 'Etc/UTC',
//         theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
//         style: '1',
//         locale: 'en',
//         toolbar_bg: '#f1f3f6',
//         enable_publishing: false,
//         allow_symbol_change: false,
//         hotlist: true,
//         calendar: true,
//         container_id: 'tradingview-chart'
//       });
//       priceChart.style.display = 'block';
//       loadingIndicator.style.display = 'none';
//     };

//     const updateTradingViewChart = (cryptoId) => {
//       if (!cryptoId) return;
//       const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
//       if (tradingViewWidget) {
//         tradingViewWidget.setSymbol(symbol, 'D');
//       } else {
//         initTradingViewChart(cryptoId);
//       }
//     };

//     const observer = new IntersectionObserver((entries) => {
//       if (entries[0].isIntersecting && isOnline()) {
//         initTradingViewChart(selectedCryptoId || 'bitcoin');
//         observer.disconnect();
//       }
//     }, { threshold: 0.1 });
//     observer.observe(tradingViewChart);

//     window.addEventListener('offline', () => {
//       calculatorResult.innerHTML = '<span class="error">Offline. Using cached data.</span>';
//     });

//     cryptoSelect.addEventListener('input', (e) => fetchSuggestions(e.target.value));
//     cryptoSelect.addEventListener('blur', () => {
//       setTimeout(() => { cryptoSuggestions.style.display = 'none'; }, 200);
//     });
//     cryptoSelect.addEventListener('focus', () => {
//       if (cryptoSelect.value) fetchSuggestions(cryptoSelect.value);
//     });
//     elements.calculateBtn.addEventListener('click', calculateConversion);
//     elements.amountInput.addEventListener('keypress', (e) => {
//       if (e.key === 'Enter' && selectedCryptoId) calculateConversion();
//     });

//     async function calculateConversion() {
//       if (!selectedCryptoId || !elements.amountInput.value || elements.amountInput.value <= 0) {
//         calculatorResult.innerHTML = '<span class="error">Please select a cryptocurrency and enter a valid amount.</span>';
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const currency = elements.currencySelect.value;
//         const price = await fetchCryptoPrice(selectedCryptoId, currency);
//         const amount = parseFloat(elements.amountInput.value);
//         const result = (amount * price).toFixed(2);
//         calculatorResult.innerHTML = `<span>${elements.amountInput.value} ${cryptoSelect.value.split(' (')[0]} = ${result} ${currency.toUpperCase()}</span>`;
//       } catch (error) {
//         console.error('Error calculating conversion:', error);
//         calculatorResult.innerHTML = '<span class="error">Error calculating conversion. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     }

//     async function fetchCryptoPrice(cryptoId, currency) {
//       try {
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}/simple/price?ids=${cryptoId}&vs_currencies=${currency}`
//         );
//         return data[cryptoId][currency];
//       } catch (error) {
//         console.error('Error fetching crypto price:', error);
//         throw error;
//       }
//     }
//   } else {
//     console.error('Crypto Calculator elements not found');
//   }
// });


// const suggestionCache = new Map();
// const tokenCache = new Map();
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// const popularCryptos = [
//   { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
//   { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
//   { id: 'solana', name: 'Solana', symbol: 'SOL' }
// ];

// const isOnline = () => navigator.onLine;
// let tradingViewWidget = null;

// document.addEventListener('DOMContentLoaded', () => {
//   const elements = {
//     cryptoSelect: document.getElementById('crypto-select'),
//     cryptoSuggestions: document.getElementById('crypto-suggestions'),
//     amountInput: document.getElementById('amount'),
//     currencySelect: document.getElementById('currency-select'),
//     calculateBtn: document.getElementById('calculate-btn'),
//     calculatorResult: document.getElementById('calculator-result'),
//     tokenDetails: document.getElementById('token-details'),
//     tokenName: document.getElementById('token-name'),
//     tokenSymbol: document.getElementById('token-symbol'),
//     tokenPrice: document.getElementById('token-price'),
//     tokenMarketCap: document.getElementById('token-market-cap'),
//     tokenVolume: document.getElementById('token-volume'),
//     tokenChange: document.getElementById('token-change'),
//     tokenCreationDate: document.getElementById('token-creation-date'),
//     tokenOwner: document.getElementById('token-owner'),
//     priceChart: document.getElementById('price-chart'),
//     tradingViewChart: document.getElementById('tradingview-chart'),
//     loadingIndicator: document.getElementById('loading-indicator')
//   };

//   if (Object.values(elements).every(el => el)) {
//     let selectedCryptoId = '';
//     const { cryptoSelect, cryptoSuggestions, loadingIndicator, tradingViewChart, priceChart, tokenDetails, calculatorResult } = elements;

//     const coinGeckoToTradingView = {
//       'bitcoin': 'BINANCE:BTCUSDT',
//       'ethereum': 'BINANCE:ETHUSDT',
//       'binancecoin': 'BINANCE:BNBUSDT',
//       'the-open-network': 'BINANCE:TONUSDT',
//       'solana': 'BINANCE:SOLUSDT',
//       'cardano': 'BINANCE:ADAUSDT',
//       'ripple': 'BINANCE:XRPUSDT',
//       'dogecoin': 'BINANCE:DOGEUSDT',
//       'polkadot': 'BINANCE:DOTUSDT',
//       'chainlink': 'BINANCE:LINKUSDT'
//     };

//     const debounce = (func, delay) => {
//       let timeout;
//       return (...args) => {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func(...args), delay);
//       };
//     };

//     const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
//       for (let i = 0; i < retries; i++) {
//         try {
//           const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
//           if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
//           return await response.json();
//         } catch (error) {
//           if (i === retries - 1) throw error;
//           await new Promise(resolve => setTimeout(resolve, delay));
//         }
//       }
//     };

//     const fetchSuggestions = debounce(async (query) => {
//       if (query.length < 2) {
//         cryptoSuggestions.style.display = 'none';
//         return;
//       }
//       if (suggestionCache.has(query)) {
//         const { data, timestamp } = suggestionCache.get(query);
//         if (Date.now() - timestamp < CACHE_TTL) {
//           renderSuggestions(data);
//           return;
//         }
//       }
//       if (!isOnline()) {
//         renderSuggestions({ coins: popularCryptos });
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}${API_CONFIG.marketData.endpoints.search}?query=${encodeURIComponent(query)}`
//         );
//         suggestionCache.set(query, { data, timestamp: Date.now() });
//         renderSuggestions(data);
//       } catch (error) {
//         console.error('Error fetching suggestions:', error);
//         calculatorResult.innerHTML = '<span class="error">Error fetching suggestions. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     }, 200);

//     const renderSuggestions = (data) => {
//       cryptoSuggestions.innerHTML = '';
//       data.coins.slice(0, 5).forEach(coin => {
//         const li = document.createElement('li');
//         li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
//         li.dataset.id = coin.id;
//         li.addEventListener('click', () => {
//           cryptoSelect.value = `${coin.name} (${coin.symbol.toUpperCase()})`;
//           selectedCryptoId = coin.id;
//           cryptoSuggestions.style.display = 'none';
//           fetchTokenDetails(coin.id);
//           updateTradingViewChart(coin.id);
//         });
//         cryptoSuggestions.appendChild(li);
//       });
//       cryptoSuggestions.style.display = data.coins.length ? 'block' : 'none';
//     };

//     const fetchTokenDetails = async (id) => {
//       if (tokenCache.has(id)) {
//         const { data, timestamp } = tokenCache.get(id);
//         if (Date.now() - timestamp < CACHE_TTL) {
//           renderTokenDetails(data);
//           return;
//         }
//       }
//       if (!isOnline()) {
//         tokenDetails.style.display = 'none';
//         calculatorResult.innerHTML = '<span class="error">Offline. Please check your connection.</span>';
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
//         );
//         tokenCache.set(id, { data, timestamp: Date.now() });
//         renderTokenDetails(data);
//       } catch (error) {
//         console.error('Error fetching token details:', error);
//         tokenDetails.style.display = 'none';
//         calculatorResult.innerHTML = '<span class="error">Error fetching token details. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     };

//     const renderTokenDetails = (data) => {
//       elements.tokenName.textContent = `Name: ${data.name}`;
//       elements.tokenSymbol.textContent = `Symbol: ${data.symbol.toUpperCase()}`;
//       elements.tokenPrice.textContent = `Price: $${data.market_data.current_price.usd.toFixed(2)}`;
//       elements.tokenMarketCap.textContent = `Market Cap: $${(data.market_data.market_cap.usd / 1e9).toFixed(2)}B`;
//       elements.tokenVolume.textContent = `24h Volume: $${(data.market_data.total_volume.usd / 1e6).toFixed(2)}M`;
//       elements.tokenChange.textContent = `24h Change: ${data.market_data.price_change_percentage_24h.toFixed(2)}%`;
//       elements.tokenCreationDate.textContent = `Creation Date: ${data.genesis_date || 'Not Available'}`;
//       elements.tokenOwner.textContent = `Owner: ${data.links?.homepage[0] ? new URL(data.links.homepage[0]).hostname : 'Not Available'}`;
//       tokenDetails.style.display = 'block';
//     };

//     const initTradingViewChart = (cryptoId) => {
//       if (!window.TradingView) {
//         const script = document.createElement('script');
//         script.src = 'https://s3.tradingview.com/tv.js';
//         script.async = true;
//         script.onload = () => createTradingViewWidget(cryptoId);
//         script.onerror = () => {
//           console.error('Failed to load TradingView script');
//           priceChart.style.display = 'none';
//           calculatorResult.innerHTML = '<span class="error">Failed to load chart. Please try again.</span>';
//         };
//         document.head.appendChild(script);
//       } else {
//         createTradingViewWidget(cryptoId);
//       }
//     };

//     const createTradingViewWidget = (cryptoId) => {
//       const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
//       const isMobile = window.innerWidth <= 768;
//       tradingViewChart.innerHTML = '';
//       tradingViewWidget = new TradingView.widget({
//         width: '100%',
//         height: isMobile ? 450 : 650,
//         symbol,
//         interval: 'W', // Changed to weekly to avoid 7-day data
//         range: '1M', // Restrict to 1-month range, excluding recent 7 days
//         timezone: 'Etc/UTC',
//         theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
//         style: '1',
//         locale: 'en',
//         toolbar_bg: '#f1f3f6',
//         enable_publishing: false,
//         allow_symbol_change: false,
//         hotlist: true,
//         calendar: true,
//         container_id: 'tradingview-chart'
//       });
//       priceChart.style.display = 'block';
//       loadingIndicator.style.display = 'none';
//     };

//     const updateTradingViewChart = (cryptoId) => {
//       if (!cryptoId) return;
//       const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
//       if (tradingViewWidget) {
//         tradingViewWidget.setSymbol(symbol, 'W');
//       } else {
//         initTradingViewChart(cryptoId);
//       }
//     };

//     const observer = new IntersectionObserver((entries) => {
//       if (entries[0].isIntersecting && isOnline()) {
//         initTradingViewChart(selectedCryptoId || 'bitcoin');
//         observer.disconnect();
//       }
//     }, { threshold: 0.1 });
//     observer.observe(tradingViewChart);

//     window.addEventListener('offline', () => {
//       calculatorResult.innerHTML = '<span class="error">Offline. Using cached data.</span>';
//     });

//     cryptoSelect.addEventListener('input', (e) => fetchSuggestions(e.target.value));
//     cryptoSelect.addEventListener('blur', () => {
//       setTimeout(() => { cryptoSuggestions.style.display = 'none'; }, 200);
//     });
//     cryptoSelect.addEventListener('focus', () => {
//       if (cryptoSelect.value) fetchSuggestions(cryptoSelect.value);
//     });
//     elements.calculateBtn.addEventListener('click', calculateConversion);
//     elements.amountInput.addEventListener('keypress', (e) => {
//       if (e.key === 'Enter' && selectedCryptoId) calculateConversion();
//     });

//     async function calculateConversion() {
//       if (!selectedCryptoId || !elements.amountInput.value || elements.amountInput.value <= 0) {
//         calculatorResult.innerHTML = '<span class="error">Please select a cryptocurrency and enter a valid amount.</span>';
//         return;
//       }
//       try {
//         loadingIndicator.style.display = 'block';
//         const currency = elements.currencySelect.value;
//         const price = await fetchCryptoPrice(selectedCryptoId, currency);
//         const amount = parseFloat(elements.amountInput.value);
//         const result = (amount * price).toFixed(2);
//         calculatorResult.innerHTML = `<span>${elements.amountInput.value} ${cryptoSelect.value.split(' (')[0]} = ${result} ${currency.toUpperCase()}</span>`;
//       } catch (error) {
//         console.error('Error calculating conversion:', error);
//         calculatorResult.innerHTML = '<span class="error">Error calculating conversion. Please try again later.</span>';
//       } finally {
//         loadingIndicator.style.display = 'none';
//       }
//     }

//     async function fetchCryptoPrice(cryptoId, currency) {
//       try {
//         const data = await fetchWithRetry(
//           `${API_CONFIG.marketData.baseUrl}/simple/price?ids=${cryptoId}&vs_currencies=${currency}`
//         );
//         return data[cryptoId][currency];
//       } catch (error) {
//         console.error('Error fetching crypto price:', error);
//         throw error;
//       }
//     }
//   } else {
//     console.error('Crypto Calculator elements not found');
//   }
// });



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

document.addEventListener('DOMContentLoaded', () => {
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

  if (Object.values(elements).every(el => el)) {
    let selectedCryptoId = '';
    const { cryptoSelect, cryptoSuggestions, loadingIndicator, tradingViewChart, priceChart, tokenDetails, calculatorResult } = elements;

    // Add promotional message and WhatsApp button
    const promoContainer = document.createElement('div');
    promoContainer.className = 'promo-container';
    promoContainer.style.marginTop = '20px';
    promoContainer.innerHTML = `
      <p>Do you want to buy or sell any cryptocurrency, visit SkyExchange.</p>
      <a href="https://wa.me/+2347016794490" target="_blank" class="btn outline whatsapp-btn">
        Contact via WhatsApp <i class="bx bxl-whatsapp"></i>
      </a>
    `;
    calculatorResult.parentElement.appendChild(promoContainer);

    // Load Boxicons if not already present
    if (!document.querySelector('link[href*="boxicons"]')) {
      const boxicons = document.createElement('link');
      boxicons.rel = 'stylesheet';
      boxicons.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
      document.head.appendChild(boxicons);
    }

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

    const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
          if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
          return await response.json();
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    const fetchSuggestions = debounce(async (query) => {
      if (query.length < 2) {
        cryptoSuggestions.style.display = 'none';
        return;
      }
      if (suggestionCache.has(query)) {
        const { data, timestamp } = suggestionCache.get(query);
        if (Date.now() - timestamp < CACHE_TTL) {
          renderSuggestions(data);
          return;
        }
      }
      if (!isOnline()) {
        renderSuggestions({ coins: popularCryptos });
        return;
      }
      try {
        loadingIndicator.style.display = 'block';
        const data = await fetchWithRetry(
          `${API_CONFIG.marketData.baseUrl}${API_CONFIG.marketData.endpoints.search}?query=${encodeURIComponent(query)}`
        );
        suggestionCache.set(query, { data, timestamp: Date.now() });
        renderSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        calculatorResult.innerHTML = '<span class="error">Error fetching suggestions. Please try again later.</span>';
      } finally {
        loadingIndicator.style.display = 'none';
      }
    }, 200);

    const renderSuggestions = (data) => {
      cryptoSuggestions.innerHTML = '';
      data.coins.slice(0, 5).forEach(coin => {
        const li = document.createElement('li');
        li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
        li.dataset.id = coin.id;
        li.addEventListener('click', () => {
          cryptoSelect.value = `${coin.name} (${coin.symbol.toUpperCase()})`;
          selectedCryptoId = coin.id;
          cryptoSuggestions.style.display = 'none';
          fetchTokenDetails(coin.id);
          updateTradingViewChart(coin.id);
        });
        cryptoSuggestions.appendChild(li);
      });
      cryptoSuggestions.style.display = data.coins.length ? 'block' : 'none';
    };

    const fetchTokenDetails = async (id) => {
      if (tokenCache.has(id)) {
        const { data, timestamp } = tokenCache.get(id);
        if (Date.now() - timestamp < CACHE_TTL) {
          renderTokenDetails(data);
          return;
        }
      }
      if (!isOnline()) {
        tokenDetails.style.display = 'none';
        calculatorResult.innerHTML = '<span class="error">Offline. Please check your connection.</span>';
        return;
      }
      try {
        loadingIndicator.style.display = 'block';
        const data = await fetchWithRetry(
          `${API_CONFIG.marketData.baseUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
        );
        tokenCache.set(id, { data, timestamp: Date.now() });
        renderTokenDetails(data);
      } catch (error) {
        console.error('Error fetching token details:', error);
        tokenDetails.style.display = 'none';
        calculatorResult.innerHTML = '<span class="error">Error fetching token details. Please try again later.</span>';
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
      tokenDetails.style.display = 'block';
    };

    const initTradingViewChart = (cryptoId) => {
      if (!window.TradingView) {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => createTradingViewWidget(cryptoId);
        script.onerror = () => {
          console.error('Failed to load TradingView script');
          priceChart.style.display = 'none';
          calculatorResult.innerHTML = '<span class="error">Failed to load chart. Please try again.</span>';
        };
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
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        hotlist: true,
        calendar: true,
        container_id: 'tradingview-chart'
      });
      priceChart.style.display = 'block';
      loadingIndicator.style.display = 'none';
    };

    const updateTradingViewChart = (cryptoId) => {
      if (!cryptoId) return;
      const symbol = coinGeckoToTradingView[cryptoId] || 'BINANCE:BTCUSDT';
      if (tradingViewWidget) {
        tradingViewWidget.setSymbol(symbol, 'W');
      } else {
        initTradingViewChart(cryptoId);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && isOnline()) {
        initTradingViewChart(selectedCryptoId || 'bitcoin');
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(tradingViewChart);

    window.addEventListener('offline', () => {
      calculatorResult.innerHTML = '<span class="error">Offline. Using cached data.</span>';
    });

    cryptoSelect.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    cryptoSelect.addEventListener('blur', () => {
      setTimeout(() => { cryptoSuggestions.style.display = 'none'; }, 200);
    });
    cryptoSelect.addEventListener('focus', () => {
      if (cryptoSelect.value) fetchSuggestions(cryptoSelect.value);
    });
    elements.calculateBtn.addEventListener('click', calculateConversion);
    elements.amountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && selectedCryptoId) calculateConversion();
    });

    async function calculateConversion() {
      if (!selectedCryptoId || !elements.amountInput.value || elements.amountInput.value <= 0) {
        calculatorResult.innerHTML = '<span class="error">Please select a cryptocurrency and enter a valid amount.</span>';
        return;
      }
      try {
        loadingIndicator.style.display = 'block';
        const currency = elements.currencySelect.value;
        const price = await fetchCryptoPrice(selectedCryptoId, currency);
        const amount = parseFloat(elements.amountInput.value);
        const result = (amount * price).toFixed(2);
        calculatorResult.innerHTML = `<span>${elements.amountInput.value} ${cryptoSelect.value.split(' (')[0]} = ${result} ${currency.toUpperCase()}</span>`;
      } catch (error) {
        console.error('Error calculating conversion:', error);
        calculatorResult.innerHTML = '<span class="error">Error calculating conversion. Please try again later.</span>';
      } finally {
        loadingIndicator.style.display = 'none';
      }
    }

    async function fetchCryptoPrice(cryptoId, currency) {
      try {
        const data = await fetchWithRetry(
          `${API_CONFIG.marketData.baseUrl}/simple/price?ids=${cryptoId}&vs_currencies=${currency}`
        );
        return data[cryptoId][currency];
      } catch (error) {
        console.error('Error fetching crypto price:', error);
        throw error;
      }
    }
  } else {
    console.error('Crypto Calculator elements not found');
  }
});