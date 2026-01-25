import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../styles/searchBar.css';


function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <label htmlFor="main-search" className="visually-hidden">Buscar productos</label>
      <input
        id="main-search"
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSearch(e); }}
        className="search-input"
        aria-label="Buscar productos"
        autoComplete="off"
      />
      <button type="submit" className="search-btn" aria-label="Buscar">
        <Search aria-hidden="true" />
      </button>
    </form>
  );
}

export default SearchBar;
