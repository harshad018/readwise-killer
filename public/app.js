const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <p>Your personal knowledge base and spaced repetition system.</p>
            </header>
            <main>
                {user ? (
                    <div>
                        <h2>Welcome back!</h2>
                        <p>Your highlights will appear here.</p>
                    </div>
                ) : (
                    <div>
                        <h2>Please Log In</h2>
                        <p>Authentication integration pending.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);