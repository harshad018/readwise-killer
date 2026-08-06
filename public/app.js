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

    // Article entry state
    const [articleUrl, setArticleUrl] = useState('');
    const [articles, setArticles] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [parsingUrl, setParsingUrl] = useState(false);

    useEffect(() => {
        const checkAuth = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                clearInterval(checkAuth);
                const { onAuthStateChanged } = window.firebaseAuthMethods;
                const unsubscribe = onAuthStateChanged(window.firebaseAuth, (currentUser) => {
                    setUser(currentUser);
                    if (currentUser) {
                        fetchHighlights(currentUser.uid);
                        fetchArticles(currentUser.uid);
                    } else {
                        setHighlights([]);
                        setArticles([]);
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

    const fetchArticles = async (userId) => {
        if (!window.firebaseDb || !window.firebaseDbMethods) return;
        setLoadingArticles(true);
        const { collection, query, where, getDocs } = window.firebaseDbMethods;
        try {
            const q = query(collection(window.firebaseDb, "articles"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const fetchedArticles = [];
            querySnapshot.forEach((doc) => {
                fetchedArticles.push({ id: doc.id, ...doc.data() });
            });
            setArticles(fetchedArticles);
        } catch (err) {
            console.error("Error fetching articles:", err);
        } finally {
            setLoadingArticles(false);
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
                repetition: 0,
                interval: 1,
                easiness: 2.5,
                nextReviewDate: serverTimestamp()
            };

            const docRef = await addDoc(collection(window.firebaseDb, "highlights"), newHighlight);
            setHighlights([...highlights, { id: docRef.id, ...newHighlight, createdAt: new Date() }]);
            setHighlightText('');
            setSourceTitle('');
            setSourceAuthor('');
        } catch (err) {
            console.error("Error adding highlight:", err);
            setError("Failed to add highlight.");
        }
    };

    const handleAddArticle = async (e) => {
        e.preventDefault();
        if (!user || !articleUrl.trim()) return;

        setParsingUrl(true);
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(articleUrl)}`);
            const data = await response.json();
            const html = data.contents;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            const title = doc.querySelector('title')?.innerText || articleUrl;
            const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.innerText).join('\n\n');
            const content = paragraphs.substring(0, 5000);

            const { collection, addDoc, serverTimestamp } = window.firebaseDbMethods;
            
            const newArticle = {
                userId: user.uid,
                url: articleUrl,
                title: title,
                content: content,
                createdAt: serverTimestamp(),
                status: 'unread'
            };

            const docRef = await addDoc(collection(window.firebaseDb, "articles"), newArticle);
            setArticles([...articles, { id: docRef.id, ...newArticle, createdAt: new Date() }]);
            setArticleUrl('');
        } catch (err) {
            console.error("Error parsing/adding article:", err);
            setError("Failed to parse and add article.");
        } finally {
            setParsingUrl(false);
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
                        
                        <div className="dashboard-grid">
                            <div className="column">
                                <div className="add-section">
                                    <h3>Add a Highlight</h3>
                                    <form onSubmit={handleAddHighlight} className="form-group">
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

                                <div className="list-section">
                                    <h3>Your Highlights</h3>
                                    {loadingHighlights ? (
                                        <p>Loading highlights...</p>
                                    ) : highlights.length > 0 ? (
                                        <ul>
                                            {highlights.map(h => (
                                                <li key={h.id} className="item-card">
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

                            <div className="column">
                                <div className="add-section">
                                    <h3>Save Article for Later</h3>
                                    <form onSubmit={handleAddArticle} className="form-group">
                                        <input 
                                            type="url" 
                                            placeholder="https://example.com/article" 
                                            value={articleUrl}
                                            onChange={(e) => setArticleUrl(e.target.value)}
                                            required
                                        />
                                        <button type="submit" disabled={parsingUrl}>
                                            {parsingUrl ? 'Parsing...' : 'Save Article'}
                                        </button>
                                    </form>
                                </div>

                                <div className="list-section">
                                    <h3>Read-it-Later List</h3>
                                    {loadingArticles ? (
                                        <p>Loading articles...</p>
                                    ) : articles.length > 0 ? (
                                        <ul>
                                            {articles.map(a => (
                                                <li key={a.id} className="item-card">
                                                    <h4>{a.title}</h4>
                                                    <a href={a.url} target="_blank" rel="noopener noreferrer">Read Original</a>
                                                    <p className="preview-text">{a.content ? a.content.substring(0, 100) + '...' : 'No content parsed.'}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No articles saved yet.</p>
                                    )}
                                </div>
                            </div>
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