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