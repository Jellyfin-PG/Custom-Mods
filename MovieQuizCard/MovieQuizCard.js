(function () {
    'use strict';

    const CARD_ID = 'jf-quiz-card';
    const STYLE_ID = 'jf-quiz-styles';
    let isFetching = false;
    let quizData = [];
    let currentQuestion = 0;
    let score = 0;

    const fallbackTrivia = [
        { q: "Who directed the 1994 film 'Pulp Fiction'?", opts: ["Quentin Tarantino", "Martin Scorsese", "Steven Spielberg", "David Fincher"], ans: "Quentin Tarantino" },
        { q: "Which movie features the quote 'Here's looking at you, kid'?", opts: ["Casablanca", "Gone with the Wind", "Citizen Kane", "The Godfather"], ans: "Casablanca" },
        { q: "In what year was 'The Matrix' released?", opts: ["1999", "1998", "2000", "2001"], ans: "1999" },
        { q: "What is the highest-grossing film of all time (unadjusted)?", opts: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"], ans: "Avatar" },
        { q: "Who played the Joker in 'The Dark Knight' (2008)?", opts: ["Heath Ledger", "Joaquin Phoenix", "Jack Nicholson", "Jared Leto"], ans: "Heath Ledger" }
    ];

    const injectStyles = () => {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${CARD_ID} {
                position: relative;
                margin: 20px 3.3%;
                height: 380px;
                border-radius: 14px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                background: radial-gradient(circle at 50% -20%, #005c8a 0%, #050505 80%);
                color: #fff;
                font-family: 'Inter', system-ui, sans-serif;
            }
            
            #${CARD_ID}::before {
                content: '';
                position: absolute;
                inset: 0;
                background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                background-size: 100% 6px;
                pointer-events: none;
                z-index: 0;
                animation: scanline-drift 20s linear infinite;
            }

            @keyframes scanline-drift {
                0% { background-position: 0 0; }
                100% { background-position: 0 100vh; }
            }

            .jf-quiz-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 40px;
                text-align: center;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            .jf-quiz-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(0, 164, 220, 0.15);
                color: #00a4dc;
                border: 1px solid rgba(0, 164, 220, 0.3);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                margin-bottom: 20px;
            }
            .jf-quiz-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
            .jf-quiz-desc { font-size: 1rem; opacity: 0.7; margin-bottom: 30px; max-width: 600px; }
            .jf-quiz-question { font-size: 1.5rem; font-weight: 600; margin-bottom: 30px; max-width: 800px; line-height: 1.4; }
            
            .jf-quiz-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                width: 100%;
                max-width: 700px;
            }
            .jf-quiz-btn {
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                padding: 16px 20px;
                border-radius: 10px;
                color: #fff;
                font-size: 1.05rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                font-family: inherit;
                backdrop-filter: blur(5px);
            }
            .jf-quiz-btn:hover:not(:disabled) {
                background: rgba(0, 164, 220, 0.25);
                border-color: #00a4dc;
                transform: translateY(-2px);
            }
            .jf-quiz-btn:active:not(:disabled) { transform: translateY(0); }
            .jf-quiz-btn:disabled { cursor: default; opacity: 0.8; }
            
            .jf-quiz-btn.correct { background: #20c060 !important; border-color: #20c060 !important; color: #fff; box-shadow: 0 0 15px rgba(32, 192, 96, 0.4); }
            .jf-quiz-btn.wrong { background: #e06060 !important; border-color: #e06060 !important; color: #fff; opacity: 0.6; }
            
            .jf-quiz-start-btn {
                background: #00a4dc;
                border: none;
                padding: 14px 32px;
                border-radius: 8px;
                color: #fff;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .jf-quiz-start-btn:hover { background: #008cc0; transform: scale(1.05); }
            
            .jf-quiz-progress { position: absolute; top: 20px; right: 24px; font-weight: 600; opacity: 0.6; letter-spacing: 0.1em; font-size: 0.85rem; }
            
            @media(max-width: 768px) {
                #${CARD_ID} { height: 420px; margin: 10px 2%; }
                .jf-quiz-grid { grid-template-columns: 1fr; gap: 10px; }
                .jf-quiz-question { font-size: 1.2rem; margin-bottom: 20px; }
                .jf-quiz-btn { padding: 12px 16px; font-size: 0.95rem; }
            }
        `;
        document.head.appendChild(style);
    };

    const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random());
    
    const decodeHTML = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const fetchRealMovieTrivia = async () => {
        try {
            const res = await fetch('https://opentdb.com/api.php?amount=5&category=11&type=multiple');
            if (!res.ok) throw new Error("Trivia API Offline");
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                return data.results.map((item) => {
                    const ans = decodeHTML(item.correct_answer);
                    const wrong = item.incorrect_answers.map(decodeHTML);
                    const opts = shuffleArray([ans, ...wrong]);
                    
                    return {
                        q: decodeHTML(item.question),
                        opts: opts,
                        ans: ans
                    };
                });
            }
        } catch (err) {
            console.error("Trivia API Error:", err);
            return fallbackTrivia;
        }
        
        return fallbackTrivia;
    };

    const renderQuizUI = (container) => {
        container.innerHTML = `
            <div class="jf-quiz-overlay" id="jf-quiz-view">
                <div class="jf-quiz-badge"><span class="material-icons">movie_filter</span> Cinephile Quiz</div>
                <div class="jf-quiz-title">Movie Trivia</div>
                <div class="jf-quiz-desc">Test your cinematic knowledge with real movie trivia.</div>
                <button class="jf-quiz-start-btn" id="jf-quiz-start">Start Quiz</button>
            </div>
        `;

        document.getElementById('jf-quiz-start').addEventListener('click', () => {
            currentQuestion = 0;
            score = 0;
            showQuestion(container);
        });
    };

    const showQuestion = (container) => {
        const view = document.getElementById('jf-quiz-view');
        if (!view) return;

        const data = quizData[currentQuestion];
        
        view.style.opacity = '0';
        
        setTimeout(() => {
            view.innerHTML = `
                <div class="jf-quiz-progress">Q ${currentQuestion + 1} / ${quizData.length}</div>
                <div class="jf-quiz-question">${data.q}</div>
                <div class="jf-quiz-grid">
                    ${data.opts.map((opt) => `<button class="jf-quiz-btn" data-ans="${opt.replace(/"/g, '&quot;')}">${opt}</button>`).join('')}
                </div>
            `;
            
            view.style.opacity = '1';

            const btns = view.querySelectorAll('.jf-quiz-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', function() {
                    btns.forEach(b => b.disabled = true);
                    
                    if (this.dataset.ans === data.ans) {
                        this.classList.add('correct');
                        score++;
                    } else {
                        this.classList.add('wrong');
                        Array.from(btns).find(b => b.dataset.ans === data.ans).classList.add('correct');
                    }

                    setTimeout(() => {
                        currentQuestion++;
                        if (currentQuestion < quizData.length) {
                            showQuestion(container);
                        } else {
                            showResults(container);
                        }
                    }, 1500);
                });
            });
        }, 300);
    };

    const showResults = (container) => {
        const view = document.getElementById('jf-quiz-view');
        
        view.style.opacity = '0';
        
        setTimeout(() => {
            let message = score === 5 ? "Perfect score! A true cinephile." : score >= 3 ? "Not bad! You know your movies." : "Time to watch more movies!";
            
            view.innerHTML = `
                <div class="jf-quiz-badge"><span class="material-icons">emoji_events</span> Quiz Complete</div>
                <div class="jf-quiz-title">You scored ${score} / ${quizData.length}</div>
                <div class="jf-quiz-desc">${message}</div>
                <button class="jf-quiz-start-btn" id="jf-quiz-restart">Play Again</button>
            `;
            view.style.opacity = '1';

            document.getElementById('jf-quiz-restart').addEventListener('click', async () => {
                view.innerHTML = `<div class="jf-quiz-title">Fetching new questions...</div>`;
                quizData = await fetchRealMovieTrivia();
                currentQuestion = 0;
                score = 0;
                showQuestion(container);
            });
        }, 300);
    };

    const triggerBuild = async (insertTarget) => {
        if (isFetching || document.getElementById(CARD_ID)) return;
        
        isFetching = true;
        injectStyles();
        
        const card = document.createElement('div');
        card.id = CARD_ID;
        insertTarget.parentNode.insertBefore(card, insertTarget);

        renderQuizUI(card);

        quizData = await fetchRealMovieTrivia();
        
        isFetching = false;
    };

    const init = () => {
        if (!document.body) return;

        const isHomePageURL = window.location.hash === '' || window.location.hash === '#!' || window.location.hash.includes('home');
        const activePage = document.querySelector('.page.is-active, .homePage');
        
        const isActuallyHomePage = isHomePageURL && activePage && (activePage.classList.contains('homePage') || activePage.id.includes('home'));

        if (!isActuallyHomePage) return;

        const insertTarget = activePage.querySelector('.section0') || 
                             activePage.querySelector('.padded-left') || 
                             activePage.querySelector('.scrollSlider') || 
                             activePage.querySelector('.section');
        
        if (insertTarget && !document.getElementById(CARD_ID)) {
            triggerBuild(insertTarget);
        }
    };

    const start = () => {
        const observer = new MutationObserver(() => init());
        observer.observe(document.body, { childList: true, subtree: true });
        init();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})();
