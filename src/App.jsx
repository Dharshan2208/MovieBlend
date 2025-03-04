import { useState } from 'react';
import './styles/index.css';

function App() {
  const [inputCount, setInputCount] = useState(0);
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputCountChange = (count) => {
    setInputCount(count);
    setMovies(Array(count).fill(''));
    setRecommendations([]);
    setError(null);
  };

  const handleMovieChange = (index, value) => {
    const updatedMovies = [...movies];
    updatedMovies[index] = value;
    setMovies(updatedMovies);
  };

  const handleSubmit = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('API key not found in environment variables');
      return;
    }

    if (movies.some(movie => !movie.trim())) {
      setError('Please fill in all movie fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": import.meta.env.VITE_GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
              Based on these movies: ${movies.join(', ')}, suggest 5 movies that:
                  Combine ≥3 genres from input titles using IMDB's taxonomy (Action|Comedy|Crime|Drama|Family|Horror|Mystery|Romance|Sci-Fi|Thriller|Western)
                  Match narrative elements from metadata:
                  Shared themes/tones (family bonds, existential crises, heist mechanics)
                  Directorial signatures (nonlinear storytelling, genre subversion)
                  Prioritize films with:
                  Multi-genre DNA (e.g., horror-comedy-romance)
                  Crew overlaps (writers/cinematographers from original films)
                  IMDB ratings within 1.5 points of input average
                  Thematic continuity (comparable character arcs/motifs)
                  Include at least 2 non-English language films from the same languages/regions as the input movies
                  Exclude:
                  18+ content
                  Documentaries
                  Return exactly 5 titles using this exact format:
                  Title
                  Title
                  Title
                  Title
                  Title
                  No numbers, bullets, or punctuation. Only movie names with original language titles in parentheses, one per line.
                  "Just the titles, no "Here are 5 bla bla stuff" -> important thing to remember
              `
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get recommendations');
      }
      
      const data = await response.json();
      
      // Parse the response from Gemini
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract the movie recommendations
      const movieList = text
        .split('\n')
        .map(line => line.replace(/^\d+\.?\s*/, '').trim())
        .filter(movie => movie.length > 0)
        .slice(0, 5);
      
      setRecommendations(movieList);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(error.message || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Movie mixer</h1>
      <p>Select the number of movies and receive personalized recommendations based on your favorite genres!</p>

      <div className="input-selector">
        <h2>How many people are watching?</h2>
        <div className="option-buttons">
          {[1, 2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              className={`option-button ${inputCount === count ? 'selected' : ''}`}
              onClick={() => handleInputCountChange(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      
      {inputCount > 0 && (
        <>
          <div className="movie-inputs">
            <h2>Enter your movies:</h2>
            {Array.from({ length: inputCount }).map((_, index) => (
              <div key={index} className="input-group">
                <label htmlFor={`movie-${index}`}>Movie {index + 1}:</label>
                <input
                  id={`movie-${index}`}
                  type="text"
                  value={movies[index] || ''}
                  onChange={(e) => handleMovieChange(index, e.target.value)}
                  placeholder={`Enter movie ${index + 1} title...`}
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading || !import.meta.env.VITE_GEMINI_API_KEY || movies.some(movie => !movie.trim())}
            className="submit-button"
          >
            {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </>
      )}
      
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h2>Top 5 Recommendations</h2>
          <ul className="recommendations-list">
            {recommendations.map((movie, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-number">{index + 1}</span>
                <span className="recommendation-title">{movie}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;