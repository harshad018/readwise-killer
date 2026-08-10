const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    // New state for highlight entry
    const [highlightText, setHighlightText] = useState('');
    const [sourceTitle, setSourceTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // New state for URL parsing
    const [articleUrl, setArticleUrl] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseMessage, setParseMessage] = useState('');

    // State for fetched highlights
    const [highlights, setHighlights] = useState([]);
    const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);

    useEffect(() => {
        // Wait for firebase to load
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
            // Handle error (maybe set an error state)
        } finally {
            setIsLoadingHighlights(false);
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
            // Use a CORS proxy to fetch the HTML content
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(articleUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const htmlContent = data.contents;

            if (!htmlContent) throw new Error('No content received');

            // Parse the HTML string into a DOM Document
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Use Readability to extract the article
            const reader = new Readability(doc);
            const article = reader.parse();

            if (!article) throw new Error('Could not parse article content');

            // Save the parsed article to Firestore
            const { collection, addDoc, serverTimestamp } = window.firebaseDbMethods;
            const highlightsRef = collection(window.firebaseDb, 'highlights');
            
            await addDoc(highlightsRef, {
                userId: user.uid,
                text: article.textContent.substring(0, 1000) + (article.textContent.length > 1000 ? '...' : ''), // Save a snippet or the whole thing if small. For a real app, maybe save full text in a different field.
                source: article.title || articleUrl,
                author: article.byline || 'Unknown Author',
                originalUrl: articleUrl,
                createdAt: serverTimestamp(),
                // SM-2 initial values
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
                // SM-2 initial values
                repetition: 0,
                interval: 1,
                easiness: 2.5,
                nextReviewDate: serverTimestamp() // Review immediately
            });

            setSaveMessage('Highlight saved successfully!');
            setHighlightText('');
            setSourceTitle('');
            setAuthorName('');
            
            // Refresh the list
            fetchHighlights();

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            console.error("Error adding document: ", err);
            setSaveMessage('Error saving highlight.');
        } finally {
            setIsSaving(false);
        }
    };

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
                        <h2>Welcome back, {user.email}!</h2>
                        
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
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    {highlights.map(highlight => (
                                        <div key={highlight.id} style={{padding: '15px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9'}}>
                                            <p style={{fontStyle: 'italic', marginBottom: '10px'}}>"{highlight.text}"</p>
                                            <div style={{fontSize: '0.85em', color: '#555', display: 'flex', justifyContent: 'space-between'}}>
                                                <span><strong>Source:</strong> {highlight.source}</span>
                                                <span><strong>Author:</strong> {highlight.author}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No highlights found. Add some above!</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto'}}>
                        <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
                        {error && <p style={{color: 'red', fontSize: '0.9em'}}>{error}</p>}
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
                            <button type="submit" style={{padding: '10px', cursor: 'pointer'}}>{isLogin ? 'Log In' : 'Sign Up'}</button>
                        </form>
                        <p onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: 'blue', textAlign: 'center', fontSize: '0.9em'}}>
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);