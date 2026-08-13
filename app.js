const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const [highlightText, setHighlightText] = useState('');
    const [sourceTitle, setSourceTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const [articleUrl, setArticleUrl] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseMessage, setParseMessage] = useState('');

    const [highlights, setHighlights] = useState([]);
    const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);

    // --- New State for Daily Review ---
    const [reviewQueue, setReviewQueue] = useState([]);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    useEffect(() => {
        const checkAuth = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                clearInterval(checkAuth);
                window.firebaseAuthMethods.onAuthStateChanged(window.firebaseAuth, (user) => {
                    setUser(user);
                });
            }
        }, 100);
        return () => clearInterval(checkAuth);
    }, []);

    useEffect(() => {
        if (user) {
            fetchHighlights();
        } else {
            setHighlights([]);
            setReviewQueue([]);
            setIsReviewMode(false);
        }
    }, [user]);

    const fetchHighlights = async () => {
        setIsLoadingHighlights(true);
        try {
            const { collection, query, where, orderBy, getDocs } = window.firebaseDbMethods;
            const highlightsRef = collection(window.firebaseDb, 'highlights');
            const q = query(
                highlightsRef, 
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const fetchedHighlights = [];
            querySnapshot.forEach((doc) => {
                fetchedHighlights.push({ id: doc.id, ...doc.data() });
            });
            setHighlights(fetchedHighlights);
        } catch (err) {
            console.error("Error fetching highlights: ", err);
        } finally {
            setIsLoadingHighlights(false);
        }
    };

    // --- New Function: Fetch Review Queue ---
    const startDailyReview = async () => {
        setIsLoadingReview(true);
        try {
            const { collection, query, where, getDocs } = window.firebaseDbMethods;
            const highlightsRef = collection(window.firebaseDb, 'highlights');
            
            // Fetch all user highlights. In a real app, you'd query by nextReviewDate <= now.
            // Firestore requires a composite index for inequality + equality queries, 
            // so for simplicity in this free-tier setup, we fetch all and filter client-side.
            const q = query(highlightsRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            const now = new Date();
            const dueHighlights = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Convert Firestore timestamp to JS Date
                const reviewDate = data.nextReviewDate ? data.nextReviewDate.toDate() : new Date(0);
                if (reviewDate <= now) {
                    dueHighlights.push({ id: doc.id, ...data });
                }
            });

            if (dueHighlights.length > 0) {
                setReviewQueue(dueHighlights);
                setCurrentReviewIndex(0);
                setIsReviewMode(true);
            } else {
                alert("You're all caught up! No highlights due for review right now.");
            }
        } catch (err) {
            console.error("Error starting review: ", err);
            alert("Failed to load review queue.");
        } finally {
            setIsLoadingReview(false);
        }
    };

    // --- New Function: SM-2 Algorithm ---
    const calculateSM2 = (quality, repetition, interval, easiness) => {
        let newRepetition = repetition;
        let newInterval = interval;
        let newEasiness = easiness;

        if (quality >= 3) {
            if (repetition === 0) {
                newInterval = 1;
            } else if (repetition === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(interval * easiness);
            }
            newRepetition += 1;
        } else {
            newRepetition = 0;
            newInterval = 1;
        }

        newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEasiness < 1.3) newEasiness = 1.3;

        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        return { newRepetition, newInterval, newEasiness, nextReviewDate };
    };

    // --- New Function: Handle Review Rating ---
    const handleRating = async (quality) => {
        const currentHighlight = reviewQueue[currentReviewIndex];
        
        const { newRepetition, newInterval, newEasiness, nextReviewDate } = calculateSM2(
            quality,
            currentHighlight.repetition || 0,
            currentHighlight.interval || 1,
            currentHighlight.easiness || 2.5
        );

        try {
            const { doc, updateDoc } = window.firebaseDbMethods;
            const highlightRef = doc(window.firebaseDb, 'highlights', currentHighlight.id);
            
            await updateDoc(highlightRef, {
                repetition: newRepetition,
                interval: newInterval,
                easiness: newEasiness,
                nextReviewDate: nextReviewDate
            });

            // Move to next or finish
            if (currentReviewIndex < reviewQueue.length - 1) {
                setCurrentReviewIndex(currentReviewIndex + 1);
            } else {
                setIsReviewMode(false);
                setReviewQueue([]);
                alert("Daily review complete! Great job.");
                fetchHighlights(); // Refresh the main list
            }
        } catch (err) {
            console.error("Error updating highlight: ", err);
            alert("Failed to save review progress.");
        }
    };


    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await window.firebaseAuthMethods.signInWithEmailAndPassword(window.firebaseAuth, email, password);
            } else {
                await window.firebaseAuthMethods.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            await window.firebaseAuthMethods.signOut(window.firebaseAuth);
        } catch (err) {
            console.error(err);
        }
    };

    const handleParseUrl = async (e) => {
        e.preventDefault();
        if (!articleUrl.trim()) return;

        setIsParsing(true);
        setParseMessage('Fetching and parsing article...');

        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(articleUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const htmlContent = data.contents;

            if (!htmlContent) throw new Error('No content received');

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            const reader = new Readability(doc);
            const article = reader.parse();

            if (!article) throw new Error('Could not parse article content');

            const { collection, addDoc, serverTimestamp } = window.firebaseDbMethods;
            const highlightsRef = collection(window.firebaseDb, 'highlights');
            
            await addDoc(highlightsRef, {
                userId: user.uid,
                text: article.textContent.substring(0, 1000) + (article.textContent.length > 1000 ? '...' : ''),
                source: article.title || articleUrl,
                author: article.byline || 'Unknown Author',
                originalUrl: articleUrl,
                createdAt: serverTimestamp(),
                repetition: 0,
                interval: 1,
                easiness: 2.5,
                nextReviewDate: serverTimestamp()
            });

            setParseMessage('Article parsed and saved successfully!');
            setArticleUrl('');
            fetchHighlights();
            setTimeout(() => setParseMessage(''), 3000);

        } catch (err) {
            console.error("Error parsing URL: ", err);
            setParseMessage(`Error: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleSaveHighlight = async (e) => {
        e.preventDefault();
        if (!highlightText.trim()) return;

        setIsSaving(true);
        setSaveMessage('');

        try {
            const { collection, addDoc, serverTimestamp } = window.firebaseDbMethods;
            const highlightsRef = collection(window.firebaseDb, 'highlights');
            
            await addDoc(highlightsRef, {
                userId: user.uid,
                text: highlightText,
                source: sourceTitle || 'Unknown Source',
                author: authorName || 'Unknown Author',
                createdAt: serverTimestamp(),
                repetition: 0,
                interval: 1,
                easiness: 2.5,
                nextReviewDate: serverTimestamp()
            });

            setSaveMessage('Highlight saved successfully!');
            setHighlightText('');
            setSourceTitle('');
            setAuthorName('');
            
            fetchHighlights();

            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            console.error("Error adding document: ", err);
            setSaveMessage('Error saving highlight.');
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isReviewMode) {
                const key = parseInt(e.key);
                if (key >= 0 && key <= 5) {
                    handleRating(key);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReviewMode, currentReviewIndex, reviewQueue]);


    if (!user) {
        return (
            <div className="auth-container">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <form onSubmit={handleAuth}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
                </form>
                {error && <p className="error">{error}</p>}
                <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                    {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header>
                <h1>Readwise Killer</h1>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </header>

            {isReviewMode ? (
                <div className="review-container">
                    <h2>Daily Review</h2>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${((currentReviewIndex) / reviewQueue.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="progress-text">{currentReviewIndex + 1} / {reviewQueue.length}</p>
                    
                    <div className="flashcard">
                        <p className="highlight-text">"{reviewQueue[currentReviewIndex].text}"</p>
                        <p className="highlight-source">- {reviewQueue[currentReviewIndex].source} ({reviewQueue[currentReviewIndex].author})</p>
                    </div>
                    
                    <div className="rating-controls">
                        <p>How well did you remember this?</p>
                        <div className="rating-buttons">
                            <button onClick={() => handleRating(0)} title="Blackout">0</button>
                            <button onClick={() => handleRating(1)} title="Incorrect, but remembered">1</button>
                            <button onClick={() => handleRating(2)} title="Incorrect, but seemed easy">2</button>
                            <button onClick={() => handleRating(3)} title="Correct, but hard">3</button>
                            <button onClick={() => handleRating(4)} title="Correct, after hesitation">4</button>
                            <button onClick={() => handleRating(5)} title="Perfect recall">5</button>
                        </div>
                        <p className="keyboard-hint">Tip: Use number keys 0-5</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="actions-container">
                        <button 
                            onClick={startDailyReview} 
                            disabled={isLoadingReview}
                            className="review-btn"
                        >
                            {isLoadingReview ? 'Loading...' : 'Start Daily Review'}
                        </button>
                    </div>

                    <div className="input-section">
                        <div className="manual-entry">
                            <h3>Add Highlight Manually</h3>
                            <form onSubmit={handleSaveHighlight}>
                                <textarea 
                                    placeholder="Highlight text..." 
                                    value={highlightText} 
                                    onChange={(e) => setHighlightText(e.target.value)} 
                                    required 
                                />
                                <input 
                                    type="text" 
                                    placeholder="Source/Book Title" 
                                    value={sourceTitle} 
                                    onChange={(e) => setSourceTitle(e.target.value)} 
                                />
                                <input 
                                    type="text" 
                                    placeholder="Author" 
                                    value={authorName} 
                                    onChange={(e) => setAuthorName(e.target.value)} 
                                />
                                <button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Highlight'}
                                </button>
                            </form>
                            {saveMessage && <p className="message">{saveMessage}</p>}
                        </div>

                        <div className="url-parser">
                            <h3>Parse Article from URL</h3>
                            <form onSubmit={handleParseUrl}>
                                <input 
                                    type="url" 
                                    placeholder="https://example.com/article" 
                                    value={articleUrl} 
                                    onChange={(e) => setArticleUrl(e.target.value)} 
                                    required 
                                />
                                <button type="submit" disabled={isParsing}>
                                    {isParsing ? 'Parsing...' : 'Fetch & Save'}
                                </button>
                            </form>
                            {parseMessage && <p className="message">{parseMessage}</p>}
                        </div>
                    </div>

                    <div className="highlights-list">
                        <h3>Your Highlights</h3>
                        {isLoadingHighlights ? (
                            <p>Loading highlights...</p>
                        ) : highlights.length === 0 ? (
                            <p>No highlights yet. Add some above!</p>
                        ) : (
                            highlights.map(h => (
                                <div key={h.id} className="highlight-item">
                                    <p className="text">"{h.text}"</p>
                                    <div className="meta">
                                        <span className="source">{h.source}</span>
                                        <span className="author">{h.author}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
