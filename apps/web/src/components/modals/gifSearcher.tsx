import './gifSearcher.css';

import { useState } from 'react';
import type { GifCategory, GifResult } from 'shared';

import Scroller from '@/components/common/scroller';

interface GifSearcherProps {
  gifCategories: GifCategory[];
  gifs: GifResult[];
  onSearch: (term: string) => Promise<void>;
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export const GifSearcher = ({
  gifCategories,
  gifs,
  onSearch,
  onSelectGif,
  onClose,
}: GifSearcherProps) => {
  const [gifSearchQuery, setGifSearchQuery] = useState('');

  const handleInputChange = (val: string) => {
    setGifSearchQuery(val);
    void onSearch(val);
  };

  return (
    <div className='gif-searcher-container' key={'GifSearcher'}>
      <div className='gif-searcher-header'>
        <div className='search-bar'>
          <input
            type='text'
            placeholder='Search Tenor'
            value={gifSearchQuery}
            onChange={(e) => {
              handleInputChange(e.currentTarget.value);
            }}
          />
          <span className='material-symbols-rounded search-icon'>search</span>
        </div>
      </div>
      <Scroller element='div' className='gif-searcher-content scroller'>
        {!gifSearchQuery && gifCategories.length > 0 && (
          <div className='gif-category-grid'>
            {gifCategories.map((cat) => (
              <div
                key={cat.name}
                className='category-item'
                onClick={() => {
                  handleInputChange(cat.name);
                }}
              >
                <img src={cat.src} alt={cat.name} />
                <div className='category-label'>{cat.name}</div>
              </div>
            ))}
          </div>
        )}

        <div className='gif-grid'>
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className='gif-item'
              onClick={() => {
                onSelectGif(gif.fullUrl);
                onClose();
                setGifSearchQuery('');
              }}
            >
              <img src={gif.previewUrl} alt={gif.title} />
            </div>
          ))}
        </div>
      </Scroller>
    </div>
  );
};
