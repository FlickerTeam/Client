import './landing.css';

import { MobileLanding } from 'mobile-ui';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES, clientPreviewImages, webAssets } from 'shared';

import { useModal } from '@/layering/modalContext';

const PREVIEW_IMAGES = [...clientPreviewImages];

const Landing = (): JSX.Element => {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 800px)' });
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [currentImg, setCurrentImg] = useState(0);

  if (isTabletOrMobile) {
    return (
      <MobileLanding
        onOpenClient={() => {
          void navigate(APP_ROUTES.login);
        }}
        onOpenGithub={() => {
          window.open('https://github.com/FlickerTeam/Client', '_blank', 'noreferrer');
        }}
        onOpenRegister={() => {
          void navigate(APP_ROUTES.register);
        }}
      />
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();

    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    setTilt({ x: y * -30, y: x * 30 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const nextImg = () => {
    setCurrentImg((prev) => (prev + 1) % PREVIEW_IMAGES.length);
  };
  const prevImg = () => {
    setCurrentImg((prev) => (prev - 1 + PREVIEW_IMAGES.length) % PREVIEW_IMAGES.length);
  };

  return (
    <OverlayScrollbarsComponent
      element='div'
      className='landing-wrapper'
      options={{ scrollbars: { autoHide: 'scroll' } }}
      defer
    >
      <nav className='landing-navbar'>
        <div
          className='brand'
          style={{
            position: 'inherit',
          }}
        >
          <img src={webAssets.flickerLogo} alt='' className='brand-logo' />
          <span>FLICKER</span>
        </div>
        <div className='navbar-links'>
          <Link title='Open Client' to={APP_ROUTES.login} className='nav-icon-link'>
            <img src={webAssets.arrow} alt='Login' />
          </Link>
          <a
            title='GitHub'
            href='https://github.com/FlickerTeam/Client'
            target='_blank'
            rel='noreferrer'
            className='nav-icon-link'
          >
            <img src={webAssets.github} alt='GitHub' />
          </a>
        </div>
      </nav>

      <main className='landing-body'>
        <section className='hero-section'>
          <div
            className='hero-visual'
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <button className='carousel-btn left' onClick={prevImg}>
              <span className='material-symbols-rounded'>chevron_left</span>
            </button>
            <div
              className='image-3d-container'
              onClick={() => {
                openModal('IMAGE_PREVIEW', {
                  src: PREVIEW_IMAGES[currentImg] ?? '',
                  alt: 'Flicker Client Preview',
                  width: 0,
                  height: 0,
                  id: `landing-preview-${String(currentImg)}`,
                  zoomOnly: true,
                });
              }}
            >
              <img
                src={PREVIEW_IMAGES[currentImg] ?? ''}
                alt='Flicker Client'
                className='client-render'
                style={{
                  transform: `rotateX(${String(tilt.x)}deg) rotateY(${String(tilt.y)}deg)`,
                }}
              />
            </div>
            <button className='carousel-btn right' onClick={nextImg}>
              <span className='material-symbols-rounded'>chevron_right</span>
            </button>
            <div className='hero-text-overlay'>
              <h1>SLEEK</h1>
              <h2>FAST</h2>
              <h3>MODERN</h3>
            </div>
          </div>

          <div className='hero-copy'>
            <p className='tagline'>The only client you need</p>
            <div className='separator'></div>
            <div className='description'>
              <p>
                Flicker is designed to be a drop in daily driver for those wishing to jump ship from
                Discord to Spacebar/Oldcord instances.
              </p>
              <p>
                It is based on the UX Discord had during its best years in 2017-2018, designed &
                developed by the very same people who made{' '}
                <Link to='https://oldcordapp.com' className='landing-link' target='__blank'>
                  Oldcord
                </Link>
                .
              </p>
              <p>Completely free, open-source, and maintained by the Community.</p>
            </div>
          </div>
        </section>

        <section className='features-section'>
          <h2 className='section-title'>Want features? We got em.</h2>
          <div className='landing-features'>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>Direct Messaging</p>
              </div>
            </div>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>Voice (Confirmed working on Oldcord)</p>
              </div>
            </div>
          </div>
          <div className='landing-features' style={{ marginTop: '15px' }}>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>Emoji, role, user, mention auto-complete</p>
              </div>
            </div>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>Account, Instance Switching</p>
              </div>
            </div>
          </div>
          <div className='landing-features' style={{ marginTop: '15px' }}>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>User Settings</p>
              </div>
            </div>
            <div className={`feature-item`}>
              <div className='feature-header'>
                <span className='material-symbols-rounded'>check_circle</span>
                <p>Developer accessible features (Console, logging)</p>
              </div>
            </div>
          </div>
          <h2
            className='section-title'
            style={{
              marginTop: '30px',
            }}
          >
            .. And more! You can find all details on our github
          </h2>
        </section>
        <div className='whatcha-waitin-for'>
          <p>Knowing all that, what are you waiting for? </p>
          <div className='try-it-wrapper'>
            <Link to={APP_ROUTES.register} className='primary-btn landing-cta'>
              TRY IT HERE
            </Link>
          </div>
        </div>
      </main>
      <footer className='landing-footer'>
        <div className='footer-main'>
          <p>
            &copy; 2026{' '}
            <Link to='https://github.com/FlickerTeam' target='_blank' rel='noreferrer'>
              Flicker Team
            </Link>
            . Licensed under GPLv3.
          </p>
        </div>
        <div className='footer-attribution'>
          <span>Icons by: </span>
          <Link
            to='https://www.flaticon.com/free-icons/arrows'
            title='arrows icons'
            target='__blank'
          >
            Pixel perfect
          </Link>
          <span className='dot'>•</span>
          <Link
            to='https://www.flaticon.com/free-icons/github'
            title='github icons'
            target='__blank'
          >
            riajulislam
          </Link>
          <span className='dot'>•</span>
          <Link to='https://www.flaticon.com/' title='Flaticon' target='__blank'>
            Flaticon
          </Link>
          <span className='dot'>•</span>
          <Link to='https://fonts.google.com/icons' title='Google' target='__blank'>
            Google
          </Link>
        </div>
      </footer>
    </OverlayScrollbarsComponent>
  );
};

export default Landing;
