import { Link } from 'react-router-dom';

function Footer() {
  return (
    <>
      <div className='credits-shape'></div>
      <footer className='credits'>
        <span>
          © 2026 -{' '}
          <Link to='https://github.com/flickerteam' className='login-link'>
            The Flicker Team
          </Link>
        </span>
        <span>
          Spacebar server code written by the{' '}
          <Link to='https://github.com/spacebarchat/server' className='login-link'>
            Spacebar Team
          </Link>
        </span>
      </footer>
    </>
  );
}

export default Footer;
