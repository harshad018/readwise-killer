const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    
    // Highlight entry state
    const [highlightText, setHighlightText] = useState('');
    const [sourceTitle, setSourceTitle] = useState('');
    const [sourceAuthor, setSourceAuthor] = useState('');
    const [highlights, setHighlights] = useState([]);
    const [loadingHighlights, setLoadingHighlights] = useState(false);

    useEffect(() => {
        // Wait for firebaseAuthMethods to be available on window
        const checkAuth = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                clearInterval(checkAuth);
                const { onAuthStateChanged } = window.firebaseAuthMethods;
                const unsubscribe = onAuthStateChanged(window.firebaseAuth, (currentUser) => {
                    setUser(currentUser);
                    if (currentUser) {
                        fetchHighlights(currentUser.uid);
                    } else {
                        setHighlights([]);
                    }
                });
                return () => unsubscribe();
            }
        }, 100);
        return () => clearInterval(checkAuth);
    }, []);

    const fetchHighlights = async (userId) => {
        if (!window.firebaseDb || !window.firebaseDbMethods) return;
        setLoadingHighlights(true);
        const { collection, query, where, getDocs } = window.firebaseDbMethods;
        try {
            const q = query(collection(window.firebaseDb, "highlights"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const fetchedHighlights = [];
            querySnapshot.forEach((doc) => {
                fetchedHighlights.push({ id: doc.id, ...doc.data() });
            });
            setHighlights(fetchedHighlights);
        } catch (err) {
            console.error("Error fetching highlights:", err);
        } finally {
            setLoadingHighlights(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.firebaseAuthMethods;
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            } else {
                await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            }
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        const { signOut } = window.firebaseAuthMethods;
        try {
            await signOut(window.firebaseAuth);
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const handleAddHighlight = async (e) => {
        e.preventDefault();
        if (!user || !highlightText.trim()) return;

        const { collection, addDoc, serverTimestamp } = window.firebaseDbMethods;
        
        try {
            const newHighlight = {
                userId: user.uid,
                text: highlightText,
                sourceTitle: sourceTitle || 'Unknown Source',
                sourceAuthor: sourceAuthor || 'Unknown Author',
                createdAt: serverTimestamp(),
                // SM-2 initial values
                repetition: 0,
                interval: 1,
                easiness: 2.5,
                nextReviewDate: serverTimestamp() // Review immediately
            };

            const docRef = await addDoc(collection(window.firebaseDb, "highlights"), newHighlight);
            
            // Optimistically update UI
            setHighlights([...highlights, { id: docRef.id, ...newHighlight, createdAt: new Date() }]);
            
            // Reset form
            setHighlightText('');
            setSourceTitle('');
            setSourceAuthor('');
        } catch (err) {
            console.error("Error adding highlight:", err);
            setError("Failed to add highlight.");
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <p>Your personal knowledge base and spaced repetition system.</p>
            </header>
            <main>
                {user ? (
                    <div>
                        <div className="user-header">
                            <h2>Welcome back, {user.email}!</h2>
                            <button onClick={handleLogout}>Log Out</button>
                        </div>
                        
                        <div className="add-highlight-section">
                            <h3>Add a Highlight</h3>
                            <form onSubmit={handleAddHighlight} className="highlight-form">
                                <textarea 
                                    placeholder="Enter your highlight text here..." 
                                    value={highlightText}
                                    onChange={(e) => setHighlightText(e.target.value)}
                                    required
                                    rows="4"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Source Title (e.g., Book Name)" 
                                    value={sourceTitle}
                                    onChange={(e) => setSourceTitle(e.target.value)}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Author" 
                                    value={sourceAuthor}
                                    onChange={(e) => setSourceAuthor(e.target.value)}
                                />
                                <button type="submit">Save Highlight</button>
                            </form>
                        </div>

                        <div className="highlights-list">
                            <h3>Your Highlights</h3>
                            {loadingHighlights ? (
                                <p>Loading highlights...</p>
                            ) : highlights.length > 0 ? (
                                <ul>
                                    {highlights.map(h => (
                                        <li key={h.id} className="highlight-item">
                                            <blockquote>"{h.text}"</blockquote>
                                            <cite>- {h.sourceTitle} by {h.sourceAuthor}</cite>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No highlights yet. Add one above!</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="auth-container">
                        <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
                        {error && <p className="error" style={{color: 'red'}}>{error}</p>}
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
                            <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
                        </form>
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button className="link-button" onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Sign Up' : 'Log In'}
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
