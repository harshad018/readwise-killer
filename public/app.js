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

    // --- Render Review Mode ---
    if (isReviewMode) {
        const currentHighlight = reviewQueue[currentReviewIndex];
        return (
            <div className="container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
                <h2>Daily Review ({currentReviewIndex + 1} / {reviewQueue.length})</h2>
                <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', margin: '20px 0', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: '1.2em', fontStyle: 'italic' }}>"{currentHighlight.text}"</p>
                </div>
                <p style={{ color: '#666' }}>- {currentHighlight.author} ({currentHighlight.source})</p>
                
                <div style={{ marginTop: '30px' }}>
                    <h3>How well did you remember this?</h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => handleRating(0)} style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>0 - Blackout</button>
                        <button onClick={() => handleRating(1)} style={{ backgroundColor: '#ff9933', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>1 - Familiar</button>
                        <button onClick={() => handleRating(2)} style={{ backgroundColor: '#ffcc00', color: 'black', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>2 - Hard</button>
                        <button onClick={() => handleRating(3)} style={{ backgroundColor: '#99cc33', color: 'black', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>3 - Good</button>
                        <button onClick={() => handleRating(4)} style={{ backgroundColor: '#33cc33', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>4 - Easy</button>
                        <button onClick={() => handleRating(5)} style={{ backgroundColor: '#009933', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>5 - Perfect</button>
                    </div>
                </div>
                <button onClick={() => setIsReviewMode(false)} style={{ marginTop: '30px', padding: '8px 16px', cursor: 'pointer' }}>Exit Review</button>
            </div>
        );
    }

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <p>Your personal knowledge base and spaced repetition system.</p>
                {user && <button onClick={handleLogout} style={{marginTop: '10px'}}>Logout</button>}
            </header>
            <main>
                {user ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Welcome back, {user.email}!</h2>
                            <button 
                                onClick={startDailyReview} 
                                disabled={isLoadingReview}
                                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isLoadingReview ? 'not-allowed' : 'pointer', fontSize: '1.1em', fontWeight: 'bold' }}
                            >
                                {isLoadingReview ? 'Loading...' : 'Start Daily Review'}
                            </button>
                        </div>
                        
                        <div className="url-parser-container" style={{marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#eef7ff'}}>
                            <h3>Save Article from URL</h3>
                            <form onSubmit={handleParseUrl} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                <input 
                                    type="url" 
                                    placeholder="https://example.com/article" 
                                    value={articleUrl}
                                    onChange={(e) => setArticleUrl(e.target.value)}
                                    required
                                    style={{padding: '8px'}}
                                />
                                <button type="submit" disabled={isParsing} style={{padding: '10px', cursor: isParsing ? 'not-allowed' : 'pointer', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px'}}>
                                    {isParsing ? 'Parsing...' : 'Fetch & Save Article'}
                                </button>
                                {parseMessage && <p style={{color: parseMessage.includes('Error') ? 'red' : 'green', fontSize: '0.9em', margin: '0'}}>{parseMessage}</p>}
                            </form>
                        </div>

                        <div className="highlight-form-container" style={{marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
                            <h3>Add a New Highlight</h3>
                            <form onSubmit={handleSaveHighlight} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                <textarea 
                                    placeholder="Enter your highlight text here..." 
                                    value={highlightText}
                                    onChange={(e) => setHighlightText(e.target.value)}
                                    required
                                    rows="4"
                                    style={{padding: '8px', resize: 'vertical'}}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Source (e.g., Book Title, Article URL)" 
                                    value={sourceTitle}
                                    onChange={(e) => setSourceTitle(e.target.value)}
                                    style={{padding: '8px'}}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Author" 
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    style={{padding: '8px'}}
                                />
                                <button type="submit" disabled={isSaving} style={{padding: '10px', cursor: isSaving ? 'not-allowed' : 'pointer'}}>
                                    {isSaving ? 'Saving...' : 'Save Highlight'}
                                </button>
                                {saveMessage && <p style={{color: saveMessage.includes('Error') ? 'red' : 'green', fontSize: '0.9em', margin: '0'}}>{saveMessage}</p>}
                            </form>
                        </div>

                        <div className="highlights-list-container" style={{marginTop: '30px'}}>
                            <h3>Your Highlights</h3>
                            {isLoadingHighlights ? (
                                <p>Loading highlights...</p>
                            ) : highlights.length > 0 ? (
                                <ul style={{listStyleType: 'none', padding: 0}}>
                                    {highlights.map(highlight => (
                                        <li key={highlight.id} style={{marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '4px'}}>
                                            <p style={{fontStyle: 'italic', margin: '0 0 10px 0'}}>"{highlight.text}"</p>
                                            <small style={{color: '#666'}}>
                                                - {highlight.author} ({highlight.source})
                                                <br/>
                                                Next Review: {highlight.nextReviewDate ? new Date(highlight.nextReviewDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No highlights saved yet.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="auth-container" style={{maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
                        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                        <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                style={{padding: '8px'}}
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                style={{padding: '8px'}}
                            />
                            <button type="submit" style={{padding: '10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                                {isLogin ? 'Login' : 'Sign Up'}
                            </button>
                        </form>
                        {error && <p style={{color: 'red', fontSize: '0.9em'}}>{error}</p>}
                        <p style={{textAlign: 'center', marginTop: '15px'}}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLogin(!isLogin)} style={{background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline'}}>
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);