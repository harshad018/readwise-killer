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
    const [tagsInput, setTagsInput] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editHighlightText, setEditHighlightText] = useState('');
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


    
    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(highlights));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "highlights.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this highlight?')) return;
        try {
            const { doc, deleteDoc } = window.firebaseDbMethods;
            await deleteDoc(doc(window.firebaseDb, 'highlights', id));
            fetchHighlights();
        } catch (err) {
            console.error("Error deleting highlight: ", err);
        }
    };

    const startEdit = (highlight) => {
        setEditingId(highlight.id);
        setEditHighlightText(highlight.text);
    };

    const saveEdit = async (id) => {
        try {
            const { doc, updateDoc } = window.firebaseDbMethods;
            await updateDoc(doc(window.firebaseDb, 'highlights', id), {
                text: editHighlightText
            });
            setEditingId(null);
            fetchHighlights();
        } catch (err) {
            console.error("Error updating highlight: ", err);
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
                tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
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
            setTagsInput('');
            
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
                <h1>Readwise Killer</h1>
                <form onSubmit={handleAuth}>
                    <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                    {error && <p className="error">{error}</p>}
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
                    <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                    </p>
                </form>
            </div>
        );
    }

    if (isReviewMode) {
        const currentHighlight = reviewQueue[currentReviewIndex];
        return (
            <div className="container review-mode">
                <header>
                    <h1>Daily Review</h1>
                    <button onClick={() => setIsReviewMode(false)}>Exit Review</button>
                </header>
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${((currentReviewIndex) / reviewQueue.length) * 100}%` }}
                    ></div>
                </div>
                <p className="progress-text">{currentReviewIndex + 1} of {reviewQueue.length}</p>
                
                <div className="flashcard">
                    <p className="highlight-text">"{currentHighlight.text}"</p>
                    <p className="highlight-source">- {currentHighlight.author} ({currentHighlight.source})</p>
                </div>

                <div className="rating-controls">
                    <p>How well did you remember this? (Press 0-5)</p>
                    <div className="rating-buttons">
                        <button onClick={() => handleRating(0)} title="Complete blackout">0</button>
                        <button onClick={() => handleRating(1)} title="Incorrect, but remembered upon seeing">1</button>
                        <button onClick={() => handleRating(2)} title="Incorrect, but seemed easy to recall">2</button>
                        <button onClick={() => handleRating(3)} title="Correct, but required significant effort">3</button>
                        <button onClick={() => handleRating(4)} title="Correct, after some hesitation">4</button>
                        <button onClick={() => handleRating(5)} title="Perfect recall">5</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <div className="header-actions">
                    <button onClick={startDailyReview} disabled={isLoadingReview} className="review-btn">
                        {isLoadingReview ? 'Loading...' : 'Start Daily Review'}
                    </button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main>
                <section className="add-highlight">
                    <h2>Add New Highlight</h2>
                    <form onSubmit={handleSaveHighlight}>
                        <textarea 
                            placeholder="Enter highlight text..."
                            value={highlightText}
                            onChange={(e) => setHighlightText(e.target.value)}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Source (e.g., Book Title)"
                            value={sourceTitle}
                            onChange={(e) => setSourceTitle(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Author (optional)"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Tags (comma separated)"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                        />
                        <button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Highlight'}
                        </button>
                        {saveMessage && <p className="message">{saveMessage}</p>}
                    </form>
                </section>

                <section className="parse-url">
                    <h2>Save from URL</h2>
                    <form onSubmit={handleParseUrl}>
                        <input 
                            type="url" 
                            placeholder="https://example.com/article"
                            value={articleUrl}
                            onChange={(e) => setArticleUrl(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isParsing}>
                            {isParsing ? 'Parsing...' : 'Parse & Save'}
                        </button>
                        {parseMessage && <p className="message">{parseMessage}</p>}
                    </form>
                </section>

                <section className="highlights-list">
                    <h2>Your Highlights</h2>
                        <button onClick={handleExport} style={{marginBottom: "10px"}}>Export JSON</button>
                        <input 
                            type="text" 
                            placeholder="Filter by tag..."
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            style={{marginBottom: "20px", width: "100%"}}
                        />
                    {isLoadingHighlights ? (
                        <p>Loading highlights...</p>
                    ) : highlights.length === 0 ? (
                        <p>No highlights yet. Add some above!</p>
                    ) : (
                        highlights.filter(h => !filterTag || (h.tags && h.tags.includes(filterTag))).map(highlight => (
                            <div key={highlight.id} className="highlight-card">
                                {editingId === highlight.id ? (
                                    <div>
                                        <textarea value={editHighlightText} onChange={(e) => setEditHighlightText(e.target.value)} />
                                        <button onClick={() => saveEdit(highlight.id)}>Save</button>
                                        <button onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <p>"{highlight.text}"</p>
                                )}
                                <small>- {highlight.author} ({highlight.source})</small>
                                {highlight.tags && highlight.tags.length > 0 && (
                                    <div style={{marginTop: "5px"}}>
                                        {highlight.tags.map(tag => <span key={tag} style={{background: "#eee", padding: "2px 5px", marginRight: "5px", borderRadius: "3px", fontSize: "0.8em"}}>{tag}</span>)}
                                    </div>
                                )}
                                <div style={{marginTop: "10px"}}>
                                    <button onClick={() => startEdit(highlight)} style={{marginRight: "5px", fontSize: "0.8em"}}>Edit</button>
                                    <button onClick={() => handleDelete(highlight.id)} style={{fontSize: "0.8em", background: "#ff4444", color: "white"}}>Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);